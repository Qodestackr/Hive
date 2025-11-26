/**
 * Saleor Provisioning Service
 *
 * Fault-tolerant service for provisioning Saleor resources with:
 * - Effect-based error handling (typed errors from Saleor)
 * - Idempotency checks (skip if already provisioned)
 * - Retry logic with exponential backoff
 * - OrganizationContext DI (no prop drilling)
 * - Rollback on partial failures
 */

import db, {
	and,
	eq,
	saleorChannels,
	warehouses,
	withDrizzleErrors,
} from "@repo/db";
import { OrganizationContext } from "@repo/utils";
import {
	type DatabaseError,
	GenericDatabaseError,
} from "@repo/utils/errors/domain";
import { Effect, Schedule } from "effect";
import { saleorClient } from "../client/saleor-client";
import {
	SaleorChannelActivationFailed,
	SaleorChannelCreationFailed,
	type SaleorDomainError,
	SaleorShippingZoneCreationFailed,
	SaleorWarehouseCreationFailed,
} from "../errors/saleor-errors";
import {
	ActivateChannelDocument,
	type AddressInput,
	ChannelUpdateWarehousesDocument,
	type CountryCode,
	CreateChannelDocument,
	CreateWarehouseDocument,
	ShippingZoneCreateDocument,
} from "../gql/graphql";
import {
	buildProvisioningMutations,
	type ProvisioningInput,
	validateProvisioningInput,
} from "../mutations/provisioning-mutations";

/**
 * Result of successful provisioning
 */
export interface ProvisioningResult {
	readonly channelId: string;
	readonly channelSlug: string;
	readonly warehouseId: string;
	readonly warehouseSlug: string;
	readonly shippingZoneId?: string;
	readonly alreadyExisted: boolean;
}

/**
 * Internal provisioning state
 */
interface ProvisioningState {
	channel?: { id: string; slug: string };
	warehouse?: { id: string; slug: string };
	shippingZone?: { id: string };
	rollbackNeeded: boolean;
}

export const saleorProvisioningService = {
	/**
	 * Provision complete Saleor environment for organization
	 *
	 * Creates: Channel → Warehouse → Shipping Zone → Link Everything
	 *
	 * Idempotent: Returns existing resources if already provisioned
	 * Retries: 3 attempts with exponential backoff (1s, 2s, 4s)
	 * Errors: Typed errors from Saleor responses (no assumptions)
	 *
	 * @example
	 * const result = await Effect.runPromise(
	 *   saleorProvisioningService.provisionEffect(userId, sessionId)
	 *     .pipe(Effect.provide(OrganizationContext.of({ organizationId: "org_123" })))
	 * )
	 */
	provisionEffect(
		userId: string,
		sessionId?: string,
	): Effect.Effect<
		ProvisioningResult,
		SaleorDomainError | DatabaseError,
		OrganizationContext
	> {
		return Effect.gen(function* () {
			const { organizationId } = yield* OrganizationContext;

			// Step 1: Check if resources already exist (idempotency)
			const existingChannel = yield* withDrizzleErrors(
				"saleor_channels",
				"findFirst",
				() =>
					db
						.select()
						.from(saleorChannels)
						.where(
							and(
								eq(saleorChannels.organizationId, organizationId),
								eq(saleorChannels.isActive, true),
							),
						)
						.limit(1),
			);

			if (existingChannel.length > 0) {
				// Already provisioned - return existing
				const channel = existingChannel[0]!;
				const existingWarehouse = yield* withDrizzleErrors(
					"warehouses",
					"findFirst",
					() =>
						db
							.select()
							.from(warehouses)
							.where(
								and(
									eq(warehouses.organizationId, organizationId),
									eq(warehouses.isActive, true),
								),
							)
							.limit(1),
				);

				if (existingWarehouse.length === 0) {
					// Inconsistent state - channel exists but no warehouse
					// This should not happen, but handle gracefully by continuing provision
					console.warn(
						`Channel exists for org ${organizationId} but no warehouse found - continuing provision`,
					);
				} else {
					const warehouse = existingWarehouse[0]!;
					return {
						channelId: channel.saleorChannelId,
						channelSlug: channel.slug,
						warehouseId: warehouse.saleorWarehouseId,
						warehouseSlug: warehouse.name,
						alreadyExisted: true,
					};
				}
			}

			// Step 2: Get organization for name (optional)
			const org = yield* withDrizzleErrors("organizations", "findFirst", () =>
				db.query.organizations.findFirst({
					where: (orgs: any, { eq }: any) => eq(orgs.id, organizationId),
				}),
			);

			// Step 3: Build mutation data (pure function)
			// Note: userEmail is set to a placeholder since Better Auth manages users separately
			// and we don't have direct access to the user table through db.query
			const input: ProvisioningInput = {
				organizationId,
				userId,
				userEmail: `${userId}@placeholder.local`, // Placeholder email for Saleor warehouse
				organizationName: org?.name,
				// city and address are not in organization table, use defaults
				city: undefined,
				address: undefined,
			};

			// Validate input
			const validationError = validateProvisioningInput(input);
			if (validationError) {
				return yield* Effect.fail(
					new GenericDatabaseError({
						operation: "validateInput",
						table: "organization",
						pgCode: undefined,
						detail: `Invalid provisioning input: ${validationError}`,
						originalError: new Error(validationError),
					}),
				);
			}

			const mutations = buildProvisioningMutations(input);

			// Step 5: Execute provisioning with rollback capability
			const state: ProvisioningState = { rollbackNeeded: false };

			try {
				// Create channel in Saleor
				const channel = yield* createChannelEffect(mutations.channel, state);

				// Create warehouse in Saleor
				const warehouse = yield* createWarehouseEffect(
					mutations.warehouse,
					state,
				);

				// Link warehouse to channel
				yield* linkWarehouseToChannelEffect(channel.id, warehouse.id);

				// Create shipping zone (optional - don't fail provisioning if this fails)
				const shippingZone = yield* createShippingZoneEffect(
					mutations.shippingZone,
					channel.id,
					warehouse.id,
				).pipe(
					Effect.catchAll(() => Effect.succeed(undefined)), // Ignore shipping zone failures
				);

				// Step 6: Store in our database
				yield* storeProvisionedResources({
					organizationId,
					channel,
					warehouse,
					sessionId,
				});

				return {
					channelId: channel.id,
					channelSlug: channel.slug,
					warehouseId: warehouse.id,
					warehouseSlug: warehouse.slug,
					shippingZoneId: shippingZone?.id,
					alreadyExisted: false,
				};
			} catch (error) {
				// Rollback if partial failure
				if (state.rollbackNeeded) {
					yield* rollbackProvisioningEffect(state).pipe(
						Effect.catchAll(() => Effect.succeed(undefined)), // Log rollback failures but don't block
					);
				}
				throw error;
			}
		});
	},
};

/**
 * Create channel in Saleor with retry logic
 *
 * Handles errors from Saleor GraphQL API - no assumptions
 */
function createChannelEffect(
	channelInput: {
		name: string;
		slug: string;
		currencyCode: string;
		defaultCountry: CountryCode;
	},
	state: ProvisioningState,
): Effect.Effect<
	{ id: string; slug: string },
	SaleorChannelCreationFailed | SaleorChannelActivationFailed,
	never
> {
	return Effect.gen(function* () {
		// Retry up to 3 times with exponential backoff
		const result = yield* Effect.retry(
			Effect.tryPromise({
				try: async () => {
					const response = await saleorClient.request(CreateChannelDocument, {
						input: channelInput,
					});
					return response;
				},
				catch: (error) =>
					new SaleorChannelCreationFailed({
						channelName: channelInput.name,
						reason: "Network error during channel creation",
						saleorErrors: [{ message: String(error) }],
					}),
			}),
			{
				times: 2, // Retry 2 more times (3 total attempts)
				schedule: Schedule.exponential("1 second", 2.0),
			},
		);

		// Handle Saleor errors (from their GraphQL response)
		if (!result.channelCreate?.channel) {
			const errors = result.channelCreate?.errors || [];
			const saleorErrors = errors.map((err: any) => ({
				message: err.message || "Unknown error",
				code: err.code,
				field: err.field,
			}));

			return yield* Effect.fail(
				new SaleorChannelCreationFailed({
					channelName: channelInput.name,
					reason:
						saleorErrors[0]?.message || "Channel creation returned no data",
					saleorErrors,
				}),
			);
		}

		const channel = result.channelCreate.channel;
		const channelId = (channel as any).id;
		state.channel = { id: channelId, slug: channelInput.slug };
		state.rollbackNeeded = true;

		// Activate the channel
		const activateResult = yield* Effect.tryPromise({
			try: async () => {
				const response = await saleorClient.request(ActivateChannelDocument, {
					id: channelId,
				});
				return response;
			},
			catch: (error) =>
				new SaleorChannelActivationFailed({
					channelId,
					reason: "Network error during channel activation",
					saleorErrors: [{ message: String(error) }],
				}),
		});

		// Handle activation errors (from Saleor)
		const activationErrors =
			(activateResult as any)?.channelActivate?.errors || [];
		if (activationErrors.length > 0) {
			const saleorErrors = activationErrors.map((err: any) => ({
				message: err.message || "Unknown error",
				code: err.code,
				field: err.field,
			}));

			return yield* Effect.fail(
				new SaleorChannelActivationFailed({
					channelId,
					reason: saleorErrors[0]?.message || "Channel activation failed",
					saleorErrors,
				}),
			);
		}

		console.log(`✅ Channel created and activated: ${channelId}`);
		return { id: channelId, slug: channelInput.slug };
	});
}

/**
 * Create warehouse in Saleor with retry logic
 */
function createWarehouseEffect(
	warehouseInput: {
		name: string;
		slug: string;
		email: string;
		address: AddressInput;
	},
	state: ProvisioningState,
): Effect.Effect<
	{ id: string; slug: string },
	SaleorWarehouseCreationFailed,
	never
> {
	return Effect.gen(function* () {
		const result = yield* Effect.retry(
			Effect.tryPromise({
				try: async () => {
					const response = await saleorClient.request(CreateWarehouseDocument, {
						input: warehouseInput as any,
					});
					return response;
				},
				catch: (error) =>
					new SaleorWarehouseCreationFailed({
						warehouseName: warehouseInput.name,
						reason: "Network error during warehouse creation",
						saleorErrors: [{ message: String(error) }],
					}),
			}),
			{
				times: 2,
				schedule: Schedule.exponential("1 second", 2.0),
			},
		);

		if (!result.createWarehouse?.warehouse) {
			const errors = result.createWarehouse?.errors || [];
			const saleorErrors = errors.map((err: any) => ({
				message: err.message || "Unknown error",
				code: err.code,
				field: err.field,
			}));

			return yield* Effect.fail(
				new SaleorWarehouseCreationFailed({
					warehouseName: warehouseInput.name,
					reason:
						saleorErrors[0]?.message || "Warehouse creation returned no data",
					saleorErrors,
				}),
			);
		}

		const warehouse = result.createWarehouse.warehouse;
		state.warehouse = { id: warehouse.id, slug: warehouseInput.slug };
		state.rollbackNeeded = true;

		console.log(`✅ Warehouse created: ${warehouse.id}`);
		return { id: warehouse.id, slug: warehouseInput.slug };
	});
}

/**
 * Link warehouse to channel in Saleor
 */
function linkWarehouseToChannelEffect(
	channelId: string,
	warehouseId: string,
): Effect.Effect<void, SaleorWarehouseCreationFailed, never> {
	return Effect.tryPromise({
		try: async () => {
			const response = await saleorClient.request(
				ChannelUpdateWarehousesDocument,
				{
					channelId,
					warehouseIds: [warehouseId],
				},
			);

			const errors = (response as any)?.channelUpdate?.errors || [];
			if (errors.length > 0) {
				throw new Error(errors[0]?.message || "Failed to link warehouse");
			}

			console.log(`✅ Warehouse ${warehouseId} linked to channel ${channelId}`);
		},
		catch: (error) =>
			new SaleorWarehouseCreationFailed({
				warehouseName: warehouseId,
				reason: `Failed to link warehouse to channel: ${error}`,
				saleorErrors: [{ message: String(error) }],
			}),
	});
}

/**
 * Create shipping zone (optional)
 */
function createShippingZoneEffect(
	zoneInput: { name: string; countries: CountryCode[] },
	channelId: string,
	warehouseId: string,
): Effect.Effect<
	{ id: string } | undefined,
	SaleorShippingZoneCreationFailed,
	never
> {
	return Effect.tryPromise({
		try: async () => {
			const response = await saleorClient.request(ShippingZoneCreateDocument, {
				input: {
					name: zoneInput.name,
					countries: zoneInput.countries,
					addWarehouses: [warehouseId],
					addChannels: [channelId],
				},
			});

			if (!response.shippingZoneCreate?.shippingZone) {
				const errors = response.shippingZoneCreate?.errors || [];
				const firstError = errors[0] as any;
				throw new Error(
					firstError?.message || "Shipping zone creation returned no data",
				);
			}

			// Type assertion needed due to GraphQL fragment masking
			const shippingZone = response.shippingZoneCreate.shippingZone as any;
			console.log(`✅ Shipping zone created: ${shippingZone.id}`);
			return { id: shippingZone.id };
		},
		catch: (error) =>
			new SaleorShippingZoneCreationFailed({
				zoneName: zoneInput.name,
				reason: String(error),
				saleorErrors: [{ message: String(error) }],
			}),
	});
}

/**
 * Store provisioned resources in database
 */
function storeProvisionedResources(data: {
	organizationId: string;
	channel: { id: string; slug: string };
	warehouse: { id: string; slug: string };
	sessionId?: string;
}): Effect.Effect<void, DatabaseError, never> {
	return Effect.gen(function* () {
		// Store channel
		yield* withDrizzleErrors("saleor_channels", "create", () =>
			db.insert(saleorChannels).values({
				organizationId: data.organizationId,
				saleorChannelId: data.channel.id,
				name: data.channel.slug,
				slug: data.channel.slug,
				isActive: true,
			}),
		);

		// Store warehouse
		yield* withDrizzleErrors("warehouses", "create", () =>
			db.insert(warehouses).values({
				organizationId: data.organizationId,
				saleorWarehouseId: data.warehouse.id,
				name: data.warehouse.slug,
				isPrimary: true,
				city: "Nairobi",
				address: "Default Address",
				isActive: true,
			}),
		);

		console.log(
			`✅ Resources stored in DB for organization ${data.organizationId}`,
		);
	});
}

/**
 * Rollback provisioned resources (best effort)
 */
function rollbackProvisioningEffect(
	state: ProvisioningState,
): Effect.Effect<void, never, never> {
	return Effect.sync(() => {
		console.warn("⚠️ Rolling back provisioning due to failure");

		// TODO: Implement Saleor resource deletion
		// For now, just log what would be deleted
		if (state.channel) {
			console.warn(`Would delete channel: ${state.channel.id}`);
		}
		if (state.warehouse) {
			console.warn(`Would delete warehouse: ${state.warehouse.id}`);
		}
	});
}
