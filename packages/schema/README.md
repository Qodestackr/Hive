# API Schema Package

Comprehensive Zod schemas for Promco API with OpenAPI generation support.

## Core Schemas (FIFO + Profit Intelligence)

### Products
- **ProductSchema**: Full product with FIFO cost tracking
- **ProductCreateSchema**: Create new product
- **ProductUpdateSchema**: Update product
- **ProductPriceUpdateSchema**: Quick price update for onboarding
- **BulkProductPriceUpdateSchema**: Bulk price updates

### Purchase Orders (THE GOLD)
- **PurchaseOrderSchema**: Purchase order with items
- **PurchaseOrderItemSchema**: FIFO batch with `unitCost`
- **QuickStockArrivalSchema**: Simplified 3-field stock entry
- **PurchaseOrderCreateSchema**: Create PO with items

### Inventory Movements
- **InventoryMovementSchema**: Every stock change with FIFO cost
- **FIFOBatchInfoSchema**: Batch transparency for debugging
- **ProductFIFOBatchesResponseSchema**: All batches for a product

### Campaigns
- **CampaignSchema**: Campaign with profit intelligence
- **CampaignCreateSchema**: Create campaign
- **CampaignProfitabilityCheckSchema**: Pre-flight profit check
- **CampaignProfitabilityResponseSchema**: Profit warning + recommendations
- **CampaignStatsSchema**: Performance metrics

### Promo Codes
- **PromoCodeSchema**: Single-use code with profit tracking
- **PromoCodeRedeemSchema**: Redeem code with profit calculation
- **BulkPromoCodeCreateSchema**: Generate codes for campaign
- **PromoCodeValidationResponseSchema**: Validate code before use

### Profit Alerts
- **PromoProfitAlertSchema**: Real-time profit warning
- **PromoProfitAlertCreateSchema**: Create alert
- **PromoProfitAlertSummarySchema**: Dashboard summary

### Customers
- **CustomerSchema**: Customer with age verification + opt-in
- **CustomerCreateSchema**: Create customer
- **CustomerAgeVerificationSchema**: Verify age
- **CustomerOptInSchema**: Track opt-in
- **BulkCustomerImportSchema**: Import customers

Generates `generated/openapi.json` from all Zod schemas.

## Key Features

✅ **Type-safe**: Full TypeScript inference  
✅ **Validation**: Runtime validation with Zod  
✅ **OpenAPI**: Auto-generate OpenAPI spec  
✅ **Profit Intelligence**: FIFO cost tracking built-in  
✅ **Compliance**: Age verification + opt-in tracking  
✅ **Bulk Operations**: Import customers, update prices  

## Profit Intelligence Flow

1. **Record Stock**: `QuickStockArrivalSchema` → Creates FIFO batch with `unitCost`
2. **Check Profitability**: `CampaignProfitabilityCheckSchema` → Pre-flight warning
3. **Create Campaign**: `CampaignCreateSchema` → Stores `estimatedFIFOCost`
4. **Generate Codes**: `BulkPromoCodeCreateSchema` → Single-use codes
5. **Redeem Code**: `PromoCodeRedeemSchema` → Calculates `actualProfit` using FIFO
6. **Monitor**: `PromoProfitAlertSchema` → Real-time loss detection
