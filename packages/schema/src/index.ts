export * from "./shared/base.schema.js";
export * from "./shared/money.schema.js";
export * from "./shared/enums.schema.js";
export * from "./shared/dashboard.schema.js";

export * from "./auth/user.schema.js";

export * from "./billing/plan.schema.js";
export * from "./billing/subscription.schema.js";
export * from "./billing/billing.schema.js";

// MARKETING SCHEMAS (Legacy - may be deprecated)
export * from "./marketing/promotion.schema.js";

export * from "./products/product.schema.js";
export * from "./products/purchase-order.schema.js";
export * from "./products/inventory-movement.schema.js";
export * from "./products/reconciliation.schema.js";

export * from "./campaigns/campaign.schema.js";
export * from "./campaigns/promo-code.schema.js";
export * from "./campaigns/profit-alert.schema.js";
export * from "./campaigns/alert-settings.schema.js";

export * from "./customers/customer.schema.js";

export { z, ZodError, type ZodSchema, type ZodType, type ZodTypeAny } from "zod";