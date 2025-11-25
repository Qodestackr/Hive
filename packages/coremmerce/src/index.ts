export type { SaleorContext, SaleorError, SaleorGraphQLError } from './types';

export {
    SaleorProductNotFound,
    SaleorVariantNotFound,
    SaleorStockUpdateFailed,
    SaleorProductCreationFailed,
    SaleorPromotionError,
    SaleorInvalidChannelConfig,
    SaleorRateLimitExceeded,
    type SaleorDomainError,
} from './errors/saleor-errors';

export { saleorClient, executeSaleorRequest, executeQuery, executeMutation } from './client/saleor-client';

export {
    getProductById,
    getProductBySlug,
    getProductInventory,
    listProducts,
    createProduct,
    createProductVariant,
    setVariantPrice,
    updateVariantCostPrice,
    updateStock,
    publishProductToChannel,
    getVariantBySKU,
} from './functions/inventory';

export {
    createPromotion,
    createPromotionRule,
    getPromotion,
    listActivePromotions,
    updatePromotionMetadata,
    updatePromotion,
    updatePromotionRule,
    deletePromotion,
    deletePromotionRule,
    createPromotionWithRules,
    type PromotionRuleConfig,
} from './functions/promotions';

export * from './gql/graphql';