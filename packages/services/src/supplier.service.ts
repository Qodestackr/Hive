import db, {
    supplierSubscriptions,
    withDrizzleErrors,
    eq,
} from "@repo/db";
import { Effect } from "effect";
import { createError, OrganizationContext } from "@repo/utils";

export const supplierService = {
    createSubscriptionEffect(input: {
        organizationId: string;
        accessLevel: "brand" | "category" | "full";
        brandsAllowed?: string[];
        categoriesAllowed?: string[];
        monthlyFee: number;
    }) {
        return Effect.gen(function* () {
            const now = new Date();
            const periodEnd = new Date(now);
            periodEnd.setMonth(periodEnd.getMonth() + 1);

            const mutation = {
                organizationId: input.organizationId,
                accessLevel: input.accessLevel,
                brandsAllowed: input.brandsAllowed || [],
                categoriesAllowed: input.categoriesAllowed || [],
                subscriptionStatus: "active",
                monthlyFee: input.monthlyFee,
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
            };

            return yield* withDrizzleErrors("supplierSubscriptions", "supplier", () =>
                db.insert(supplierSubscriptions).values(mutation).returning(),
            );
        });
    },

    getSubscriptionEffect(organizationId: string) {
        return Effect.gen(function* () {
            const subscription = yield* withDrizzleErrors(
                "supplierSubscriptions",
                "supplier",
                () =>
                    db
                        .select()
                        .from(supplierSubscriptions)
                        .where(eq(supplierSubscriptions.organizationId, organizationId))
                        .limit(1),
            );

            if (!subscription[0]) {
                return yield* Effect.fail(
                    createError.notFound("Subscription not found"),
                );
            }

            return subscription[0];
        });
    },

    verifyAccessEffect(organizationId: string, brandId: string) {
        return Effect.gen(function* () {
            const subscription = yield* this.getSubscriptionEffect(organizationId);

            if (subscription.accessLevel === "full") return true;

            if (subscription.accessLevel === "brand") {
                if (!subscription.brandsAllowed?.includes(brandId)) {
                    return yield* Effect.fail(
                        createError.forbidden("No access to this brand"),
                    );
                }
            }

            if (subscription.accessLevel === "category") {
                return yield* Effect.fail(
                    createError.notImplemented(
                        "Category access verification not yet implemented",
                    ),
                );
            }

            return true;
        });
    },
};
