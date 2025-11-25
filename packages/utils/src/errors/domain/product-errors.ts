import { Data } from "effect"
import { ErrorCode } from "../error"

export class ProductNotFound extends Data.TaggedError("ProductNotFound")<{
    readonly productId: string
    readonly organizationId: string
}> {
    readonly errorCode = ErrorCode.RECORD_NOT_FOUND
    readonly statusCode = 404

    get message() {
        return `Product '${this.productId}' not found`
    }
}

export class InsufficientInventory extends Data.TaggedError("InsufficientInventory")<{
    readonly productId: string
    readonly requested: number
    readonly available: number
}> {
    readonly errorCode = ErrorCode.BUSINESS_RULE_VIOLATION
    readonly statusCode = 422

    get message() {
        return `Insufficient inventory for product '${this.productId}': requested ${this.requested}, available ${this.available}`
    }
}

export class NoCostData extends Data.TaggedError("NoCostData")<{
    readonly productId: string
    readonly organizationId: string
}> {
    readonly errorCode = ErrorCode.BUSINESS_RULE_VIOLATION
    readonly statusCode = 422

    get message() {
        return `No purchase orders or cost data found for product '${this.productId}'. Record stock arrival first.`
    }
}

export type ProductError = ProductNotFound | InsufficientInventory | NoCostData