import { Data } from "effect"
import { ErrorCode } from "../error"

export class PromoCodeNotFound extends Data.TaggedError("PromoCodeNotFound")<{
    readonly code: string
    readonly organizationId: string
}> {
    readonly errorCode = ErrorCode.RECORD_NOT_FOUND
    readonly statusCode = 404

    get message() {
        return `Promo code '${this.code}' not found`
    }
}

export class PromoCodeAlreadyRedeemed extends Data.TaggedError("PromoCodeAlreadyRedeemed")<{
    readonly code: string
    readonly redeemedAt: Date
    readonly redeemedBy?: string
}> {
    readonly errorCode = ErrorCode.BUSINESS_RULE_VIOLATION
    readonly statusCode = 422

    get message() {
        return `Promo code '${this.code}' was already redeemed on ${this.redeemedAt.toISOString()}`
    }
}

export class PromoCodeExpired extends Data.TaggedError("PromoCodeExpired")<{
    readonly code: string
    readonly expiresAt: Date
}> {
    readonly errorCode = ErrorCode.BUSINESS_RULE_VIOLATION
    readonly statusCode = 422

    get message() {
        return `Promo code '${this.code}' expired on ${this.expiresAt.toISOString()}`
    }
}

export class PromoCodeNoProduct extends Data.TaggedError("PromoCodeNoProduct")<{
    readonly code: string
}> {
    readonly errorCode = ErrorCode.BUSINESS_RULE_VIOLATION
    readonly statusCode = 422

    get message() {
        return `Promo code '${this.code}' is not linked to a product`
    }
}

export type PromoCodeError =
    | PromoCodeNotFound
    | PromoCodeAlreadyRedeemed
    | PromoCodeExpired
    | PromoCodeNoProduct
