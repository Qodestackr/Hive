export { saleorProvisioningService } from "./services/saleor-provisioning.service"
export type { ProvisioningResult } from "./services/saleor-provisioning.service"

export { catalogSyncService } from "./services/catalog-sync.service"
export type { CatalogSyncResult, CatalogSyncOptions } from "./services/catalog-sync.service"

export { provisionSaleorForUser, checkSaleorResourcesExist } from "./auth-integration"

export {
    buildProvisioningMutations,
    validateProvisioningInput,
    buildStandardShippingMethods,
    type ProvisioningInput,
    type ShippingMethodConfig,
} from "./mutations/provisioning-mutations"

export {
    buildProductSyncMutation,
    batchProducts,
    calculateProgress,
    validateMasterProduct,
    type MasterProduct,
} from "./mutations/catalog-sync-mutations"

// Export errors
export type { SaleorDomainError } from "./errors/saleor-errors"
export {
    SaleorChannelCreationFailed,
    SaleorWarehouseCreationFailed,
    SaleorShippingZoneCreationFailed,
    SaleorChannelActivationFailed,
    SaleorResourceAlreadyExists,
    SaleorProductCreationFailed,
} from "./errors/saleor-errors"
