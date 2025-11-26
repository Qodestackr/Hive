import { generateId, slugify } from "@repo/utils";
import type { CountryCode } from "../gql/graphql";

export interface ProvisioningInput {
	organizationId: string;
	userId: string;
	userEmail: string;
	organizationName?: string;
	city?: string;
	address?: string;
	currencyCode?: string;
}

export interface ProvisioningMutations {
	channel: {
		name: string;
		slug: string;
		currencyCode: string;
		defaultCountry: CountryCode;
	};
	warehouse: {
		name: string;
		slug: string;
		email: string;
		address: {
			streetAddress1: string;
			city: string;
			country: CountryCode;
			postalCode: string;
			companyName: string;
		};
	};
	shippingZone: {
		name: string;
		countries: CountryCode[];
	};
}

/**
 * Build all provisioning mutations at once
 * @example
 * const mutations = buildProvisioningMutations({
 *   organizationId: "org_123",
 *   userId: "user_456",
 *   userEmail: "test@example.com"
 * })
 */
export function buildProvisioningMutations(
	input: ProvisioningInput,
): ProvisioningMutations {
	const uniqueId = generateId();
	const channelName = input.organizationName
		? `${input.organizationName} Channel`.slice(0, 50)
		: `Channel ${uniqueId}`;
	const warehouseName = input.organizationName
		? `${input.organizationName} Warehouse`.slice(0, 50)
		: `Warehouse ${uniqueId}`;

	return {
		channel: {
			name: channelName,
			slug: slugify(channelName),
			currencyCode: input.currencyCode || "KES",
			defaultCountry: "KE" as CountryCode,
		},
		warehouse: {
			name: warehouseName,
			slug: slugify(warehouseName),
			email: input.userEmail,
			address: {
				streetAddress1: input.address || "Default Address",
				city: input.city || "Nairobi",
				country: "KE" as CountryCode,
				postalCode: "00100",
				companyName: warehouseName,
			},
		},
		shippingZone: {
			name: `${channelName} Shipping`,
			countries: ["KE", "TZ"] as CountryCode[],
		},
	};
}

/**
 * Validate provisioning input
 *
 * Returns validation errors if any, undefined if valid
 */
export function validateProvisioningInput(
	input: ProvisioningInput,
): string | undefined {
	if (!input.organizationId || input.organizationId.trim() === "") {
		return "organizationId is required";
	}

	if (!input.userId || input.userId.trim() === "") {
		return "userId is required";
	}

	if (!input.userEmail || input.userEmail.trim() === "") {
		return "userEmail is required";
	}

	// Basic email validation
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(input.userEmail)) {
		return "invalid email format";
	}

	return undefined;
}

/**
 * Build shipping method configuration
 *
 * Pure function for shipping method setup
 */
export interface ShippingMethodConfig {
	name: string;
	type: "PRICE" | "WEIGHT";
	price: number;
	channelId: string;
	minimumDeliveryDays?: number;
	maximumDeliveryDays?: number;
	minimumOrderPrice?: number;
	maximumOrderPrice?: number;
}

export function buildStandardShippingMethods(
	channelId: string,
	currencyCode: string = "KES",
): ShippingMethodConfig[] {
	return [
		{
			name: "Standard Delivery",
			type: "PRICE",
			price: 200,
			channelId,
			minimumDeliveryDays: 2,
			maximumDeliveryDays: 7,
		},
		{
			name: "Express Delivery",
			type: "PRICE",
			price: 500,
			channelId,
			minimumDeliveryDays: 1,
			maximumDeliveryDays: 3,
			minimumOrderPrice: 1000,
			maximumOrderPrice: 50000,
		},
	];
}
