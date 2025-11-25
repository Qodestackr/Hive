export * from "./base"

export * from "./common-errors"
export * from "./database-errors"
export * from "./promo-code-errors"
export * from "./product-errors"
export * from "./campaign-errors"

// union of all domain errors. Handles any generic domain error
import type { PromoCodeError } from "./promo-code-errors"
import type { ProductError } from "./product-errors"
import type { CampaignError } from "./campaign-errors"
import type { DatabaseError } from "./database-errors"

export type DomainError =
    | PromoCodeError
    | ProductError
    | CampaignError
    | DatabaseError
