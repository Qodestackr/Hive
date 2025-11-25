import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
  primaryKey
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import {
  businessTypeEnum,
  subscriptionStatusEnum,
  paymentProviderEnum,
  campaignStatusEnum,
  campaignTypeEnum,
  platformEnum,
  verificationMethodEnum,
  costCalculationMethodEnum
} from './enums';

export const organizations = pgTable('organization', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),

  // Business profile
  businessType: businessTypeEnum('business_type').notNull().default('retailer'),
  licenseNumber: text('license_number'),
  taxId: text('tax_id'),
  phoneNumber: text('phone_number'),

  // Subscription & Pricing (GRANDFATHERED MODEL)
  subscriptionStatus: subscriptionStatusEnum('subscription_status').notNull().default('trialing'),
  pricingVersion: text('pricing_version').notNull(), // "v1_200", "v2_250" etc
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
  basePrice: real('base_price').notNull(), // Monthly base fee (KES)

  // Outcome-based pricing config
  outcomeBasePer1000Captures: real('outcome_base_per_1000_captures').default(0), // Extra charge per 1K captures
  outcomeProfitSharePercent: real('outcome_profit_share_percent').default(0), // % of campaign profit

  // User limits (for distributors)
  maxUsers: integer('max_users').default(1),
  includedUsers: integer('included_users').default(1),
  additionalUserPrice: real('additional_user_price').default(0),

  // Trial tracking
  trialEndsAt: timestamp('trial_ends_at'),

  // Integrations
  saleorChannelId: text('saleor_channel_id'), // Link to Saleor headless commerce
  odooCompanyId: text('odoo_company_id'), // Optional Odoo integration

  // Metadata
  settings: jsonb('settings').$type<{
    enableSMS?: boolean;
    defaultCampaignLanguage?: string;
    complianceSettings?: {
      requireAgeVerification: boolean;
      minimumAge: number;
    };
  }>(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  slugIdx: uniqueIndex('org_slug_idx').on(table.slug),
  businessTypeIdx: index('org_business_type_idx').on(table.businessType),
  subscriptionStatusIdx: index('org_subscription_status_idx').on(table.subscriptionStatus),
}));

// ============================================================================
// MEMBERS (Better Auth Compatible)
// ============================================================================

export const members = pgTable('member', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull(), // References Better Auth user
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'), // owner, admin, member

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  userOrgIdx: uniqueIndex('member_user_org_idx').on(table.userId, table.organizationId),
  orgIdx: index('member_org_idx').on(table.organizationId),
}));

// ============================================================================
// INVITATIONS (Better Auth Compatible)
// ============================================================================

export const invitations = pgTable('invitation', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  inviterId: text('inviter_id').notNull(), // member.id
  role: text('role').notNull().default('member'),
  status: text('status').notNull().default('pending'), // pending, accepted, rejected, expired

  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  emailOrgIdx: index('invitation_email_org_idx').on(table.email, table.organizationId),
  statusIdx: index('invitation_status_idx').on(table.status),
}));

// ============================================================================
// PRODUCTS & INVENTORY (Profit Intelligence at Purchase Time)
// ============================================================================

export const products = pgTable('product', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  // Product details
  name: text('name').notNull(),
  sku: text('sku').notNull(),
  category: text('category'),
  description: text('description'),

  // Saleor integration (SOURCE OF TRUTH)
  saleorProductId: text('saleor_product_id'),
  saleorVariantId: text('saleor_variant_id'),
  saleorChannelId: text('saleor_channel_id'),

  // Pricing (from Saleor, synced)
  basePrice: real('base_price').notNull(),

  // Current inventory intelligence (calculated fields)
  currentFIFOCost: real('current_fifo_cost'),
  currentStockQuantity: integer('current_stock_quantity').default(0),
  reorderPoint: integer('reorder_point').default(0),
  leadTimeDays: integer('lead_time_days').default(7),

  // Compliance (for alcohol)
  alcoholContent: real('alcohol_content'),
  requiresAgeVerification: boolean('requires_age_verification').default(true),

  // AI intelligence
  isSlowMover: boolean('is_slow_mover').default(false),
  avgMarginPercent: real('avg_margin_percent'),

  // Metadata
  images: jsonb('images').$type<string[]>(),
  tags: jsonb('tags').$type<string[]>().default([]),

  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  orgSkuIdx: uniqueIndex('product_org_sku_idx').on(table.organizationId, table.sku),
  saleorProductIdx: index('product_saleor_product_idx').on(table.saleorProductId),
  saleorVariantIdx: index('product_saleor_variant_idx').on(table.saleorVariantId),
  categoryIdx: index('product_category_idx').on(table.category),
}));

export const purchaseOrders = pgTable('purchase_order', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  // PO details
  poNumber: text('po_number').notNull(),
  supplierName: text('supplier_name'),
  supplierContact: text('supplier_contact'),

  // Status
  status: text('status').notNull().default('draft'),

  // Dates
  orderDate: timestamp('order_date').notNull(),
  receivedDate: timestamp('received_date'),

  // Financials
  totalCost: real('total_cost').notNull(),
  currency: text('currency').notNull().default('KES'),

  // Metadata
  notes: text('notes'),
  metadata: jsonb('metadata').$type<Record<string, any>>(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  orgPoNumberIdx: uniqueIndex('purchase_order_org_po_number_idx').on(table.organizationId, table.poNumber),
  orgIdx: index('purchase_order_org_idx').on(table.organizationId),
  statusIdx: index('purchase_order_status_idx').on(table.status),
  orderDateIdx: index('purchase_order_order_date_idx').on(table.orderDate),
}));

export const purchaseOrderItems = pgTable('purchase_order_item', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  purchaseOrderId: text('purchase_order_id').notNull().references(() => purchaseOrders.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),

  // Quantity tracking
  quantityOrdered: integer('quantity_ordered').notNull(),
  quantityReceived: integer('quantity_received').default(0),

  // THE GOLD: Unit cost at purchase time
  unitCost: real('unit_cost').notNull(),

  // Batch tracking
  batchNumber: text('batch_number'),
  expiryDate: timestamp('expiry_date'),

  // Calculated
  lineTotal: real('line_total').notNull(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  poIdx: index('purchase_order_item_po_idx').on(table.purchaseOrderId),
  productIdx: index('purchase_order_item_product_idx').on(table.productId),
  batchIdx: index('purchase_order_item_batch_idx').on(table.batchNumber),
  expiryIdx: index('purchase_order_item_expiry_idx').on(table.expiryDate),
}));

export const inventoryMovements = pgTable('inventory_movement', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),

  // Movement details
  movementType: text('movement_type').notNull(),
  quantity: integer('quantity').notNull(),

  // FIFO cost tracking (THE KEY TO PROFIT CALCULATION)
  unitCostAtMovement: real('unit_cost_at_movement').notNull(),
  totalCost: real('total_cost').notNull(),

  // FIFO batch tracking
  fifoBatchId: text('fifo_batch_id').references(() => purchaseOrderItems.id),

  // References (what triggered this movement)
  referenceType: text('reference_type'),
  referenceId: text('reference_id'),
  campaignId: text('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  promoCodeId: text('promo_code_id').references(() => promoCodes.id, { onDelete: 'set null' }),

  // Stock levels after movement
  stockAfterMovement: integer('stock_after_movement').notNull(),

  // Metadata
  notes: text('notes'),
  metadata: jsonb('metadata').$type<Record<string, any>>(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  orgIdx: index('inventory_movement_org_idx').on(table.organizationId),
  productIdx: index('inventory_movement_product_idx').on(table.productId),
  movementTypeIdx: index('inventory_movement_type_idx').on(table.movementType),
  campaignIdx: index('inventory_movement_campaign_idx').on(table.campaignId),
  promoCodeIdx: index('inventory_movement_promo_code_idx').on(table.promoCodeId),
  createdIdx: index('inventory_movement_created_idx').on(table.createdAt),
}));

export const promoProfitAlerts = pgTable('promo_profit_alert', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  campaignId: text('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  productId: text('product_id').references(() => products.id, { onDelete: 'set null' }),

  // Alert details
  alertType: text('alert_type').notNull(),
  severity: text('severity').notNull(),
  message: text('message').notNull(),

  // Context
  currentFIFOCost: real('current_fifo_cost'),
  discountPercent: real('discount_percent'),
  redemptionsCount: integer('redemptions_count'),
  totalLoss: real('total_loss'),
  estimatedLossPerRedemption: real('estimated_loss_per_redemption'),

  // Actions
  isResolved: boolean('is_resolved').default(false),
  actionTaken: text('action_taken'),
  resolvedAt: timestamp('resolved_at'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  orgIdx: index('promo_profit_alert_org_idx').on(table.organizationId),
  campaignIdx: index('promo_profit_alert_campaign_idx').on(table.campaignId),
  severityIdx: index('promo_profit_alert_severity_idx').on(table.severity),
  resolvedIdx: index('promo_profit_alert_resolved_idx').on(table.isResolved),
}));

// ============================================================================
// CUSTOMERS (THE GOLD: Verified Phone Numbers)
// ============================================================================

export const customers = pgTable('customer', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  // Identity
  phoneNumber: text('phone_number').notNull(), // E.164 format (+254...)
  name: text('name'),
  email: text('email'),

  // Age Verification (COMPLIANCE GOLD)
  isAgeVerified: boolean('is_age_verified').notNull().default(false),
  ageVerificationMethod: verificationMethodEnum('age_verification_method'),
  ageVerifiedAt: timestamp('age_verified_at'),
  dateOfBirth: timestamp('date_of_birth'), // Optional, from ID upload

  // Opt-in tracking (REGULATORY MOAT)
  hasOptedIn: boolean('has_opted_in').notNull().default(false),
  optInSource: text('opt_in_source'), // 'whatsapp_campaign', 'in_store_signup', 'social_ad'
  optInCampaignId: text('opt_in_campaign_id'), // Which campaign captured them
  optedInAt: timestamp('opted_in_at'),
  optedOutAt: timestamp('opted_out_at'),

  // Segmentation
  tier: text('tier').default('bronze'), // bronze, silver, gold, platinum
  totalSpend: real('total_spend').default(0),
  totalOrders: integer('total_orders').default(0),
  lastOrderAt: timestamp('last_order_at'),

  // Location (for geo-targeted campaigns)
  city: text('city'),
  coordinates: jsonb('coordinates').$type<{ lat: number; lng: number }>(),

  // Metadata
  tags: jsonb('tags').$type<string[]>().default([]), // ['loyal', 'high_value', 'liquor_buyer']
  customFields: jsonb('custom_fields').$type<Record<string, any>>(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  phoneOrgIdx: uniqueIndex('customer_phone_org_idx').on(table.phoneNumber, table.organizationId),
  orgIdx: index('customer_org_idx').on(table.organizationId),
  optInIdx: index('customer_opt_in_idx').on(table.hasOptedIn),
  ageVerifiedIdx: index('customer_age_verified_idx').on(table.isAgeVerified),
}));

// ============================================================================
// CAMPAIGNS (Core Promo Engine)
// ============================================================================

export const campaigns = pgTable('campaign', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  // Campaign details
  name: text('name').notNull(),
  type: campaignTypeEnum('type').notNull(),
  status: campaignStatusEnum('status').notNull().default('draft'),

  // Messaging
  messageTemplate: text('message_template').notNull(), // Template with {{variables}}
  platforms: jsonb('platforms').$type<('whatsapp' | 'sms' | 'email')[]>().default(['whatsapp']),

  // Targeting
  targetSegment: jsonb('target_segment').$type<{
    tiers?: string[];
    minSpend?: number;
    cities?: string[];
    tags?: string[];
    lastOrderDaysAgo?: number;
  }>(),
  targetRadius: real('target_radius'), // Km from location
  targetProductIds: jsonb('target_product_ids').$type<string[]>(), // Inventory-aware targeting

  // Offer configuration
  offerType: text('offer_type').notNull(), // 'percentage_discount', 'fixed_discount', 'buy_x_get_y', 'free_delivery'
  offerValue: real('offer_value'), // e.g., 20 for 20% off
  minPurchaseAmount: real('min_purchase_amount'),

  // PROFIT INTELLIGENCE: Pre-flight simulation
  estimatedFIFOCost: real('estimated_fifo_cost'), // Current FIFO cost at campaign creation
  estimatedProfitPerRedemption: real('estimated_profit_per_redemption'), // Projected profit
  minProfitThreshold: real('min_profit_threshold'), // Don't auto-approve if below this

  // Promo code integration (Saleor)
  saleorVoucherCode: text('saleor_voucher_code'), // Link to Saleor voucher
  maxRedemptions: integer('max_redemptions'),
  redemptionsUsed: integer('redemptions_used').default(0),

  // Scheduling
  scheduledFor: timestamp('scheduled_for'),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),

  // Performance tracking (OUTCOME METRICS)
  sent: integer('sent').default(0),
  delivered: integer('delivered').default(0),
  opened: integer('opened').default(0),
  clicked: integer('clicked').default(0),

  // THE NORTH STAR METRIC
  capturesCount: integer('captures_count').default(0), // New verified phone numbers

  conversions: integer('conversions').default(0),
  revenue: real('revenue').default(0),
  discountCost: real('discount_cost').default(0),

  // TRUE PROFIT (revenue - discountCost - COGS)
  totalCOGS: real('total_cogs').default(0), // Sum of unitCostAtRedemption from all promo codes
  actualProfit: real('actual_profit').default(0), // revenue - discountCost - totalCOGS
  avgProfitPerRedemption: real('avg_profit_per_redemption'), // actualProfit / conversions

  // Warning flags
  isLosingMoney: boolean('is_losing_money').default(false), // TRUE if actualProfit < 0

  // Budget
  budgetAmount: real('budget_amount'),
  spentAmount: real('spent_amount').default(0),

  // Metadata
  metadata: jsonb('metadata').$type<Record<string, any>>(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  orgIdx: index('campaign_org_idx').on(table.organizationId),
  statusIdx: index('campaign_status_idx').on(table.status),
  scheduledIdx: index('campaign_scheduled_idx').on(table.scheduledFor),
}));

// ============================================================================
// CAMPAIGN RESPONSES (Engagement Tracking)
// ============================================================================

export const campaignResponses = pgTable('campaign_response', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  campaignId: text('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),

  // Response details
  platform: platformEnum('platform').notNull(),
  messageBody: text('message_body'),

  // Conversion tracking
  isConverted: boolean('is_converted').default(false),
  orderValue: real('order_value'),
  promoCodeUsed: text('promo_code_used'),
  saleorOrderId: text('saleor_order_id'), // Link to Saleor order

  respondedAt: timestamp('responded_at').notNull().defaultNow(),
}, (table) => ({
  campaignIdx: index('response_campaign_idx').on(table.campaignId),
  customerIdx: index('response_customer_idx').on(table.customerId),
  convertedIdx: index('response_converted_idx').on(table.isConverted),
}));

// ============================================================================
// PROMO CODES (Single-use, tracked)
// ============================================================================

export const promoCodes = pgTable('promo_code', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  campaignId: text('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  customerId: text('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
  productId: text('product_id').references(() => products.id, { onDelete: 'set null' }),

  // Code details
  code: text('code').notNull().unique(),
  discountType: text('discount_type').notNull(), // 'percentage', 'fixed_amount'
  discountValue: real('discount_value').notNull(),

  // Redemption tracking
  isRedeemed: boolean('is_redeemed').default(false),
  redeemedAt: timestamp('redeemed_at'),
  saleorOrderId: text('saleor_order_id'), // Link to Saleor order

  // PROFIT INTELLIGENCE AT REDEMPTION (THE GOLD)
  quantityRedeemed: integer('quantity_redeemed').default(1),
  originalPrice: real('original_price'), // Base price before discount
  discountAmount: real('discount_amount'), // Actual discount applied
  netRevenue: real('net_revenue'), // originalPrice - discountAmount
  unitCostAtRedemption: real('unit_cost_at_redemption'), // FIFO cost when redeemed
  totalCOGS: real('total_cogs'), // unitCostAtRedemption * quantityRedeemed
  actualProfit: real('actual_profit'), // netRevenue - totalCOGS
  isProfitable: boolean('is_profitable'), // TRUE if actualProfit > 0

  // AUDIT TRAIL: Cost calculation method used at redemption
  costCalculationMethod: costCalculationMethodEnum('cost_calculation_method'),

  // Expiry
  expiresAt: timestamp('expires_at').notNull(),

  // Metadata
  metadata: jsonb('metadata').$type<Record<string, any>>(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  codeIdx: uniqueIndex('promo_code_idx').on(table.code),
  customerIdx: index('promo_customer_idx').on(table.customerId),
  productIdx: index('promo_product_idx').on(table.productId),
  redeemedIdx: index('promo_redeemed_idx').on(table.isRedeemed),
  expiresIdx: index('promo_expires_idx').on(table.expiresAt),
  profitableIdx: index('promo_profitable_idx').on(table.isProfitable),
}));

// ============================================================================
// WHATSAPP INTEGRATION
// ============================================================================

export const whatsappContacts = pgTable('whatsapp_contact', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  customerId: text('customer_id').references(() => customers.id, { onDelete: 'set null' }),

  // WhatsApp profile
  waId: text('wa_id').notNull(), // WhatsApp ID (phone number)
  profileName: text('profile_name'),

  // Conversation state
  lastMessageAt: timestamp('last_message_at'),
  isBlocked: boolean('is_blocked').default(false),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  waIdOrgIdx: uniqueIndex('whatsapp_contact_waid_org_idx').on(table.waId, table.organizationId),
  customerIdx: index('whatsapp_contact_customer_idx').on(table.customerId),
}));

export const whatsappMessages = pgTable('whatsapp_message', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  contactId: text('contact_id').notNull().references(() => whatsappContacts.id, { onDelete: 'cascade' }),
  campaignId: text('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),

  // Message details
  waMessageId: text('wa_message_id'), // WhatsApp API message ID
  direction: text('direction').notNull(), // 'outbound', 'inbound'
  body: text('body'),
  mediaUrl: text('media_url'),

  // Status tracking
  status: text('status').notNull().default('pending'), // pending, sent, delivered, read, failed
  errorCode: text('error_code'),

  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  readAt: timestamp('read_at'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  contactIdx: index('whatsapp_message_contact_idx').on(table.contactId),
  campaignIdx: index('whatsapp_message_campaign_idx').on(table.campaignId),
  statusIdx: index('whatsapp_message_status_idx').on(table.status),
}));

// ============================================================================
// COMPLIANCE AUDIT LOG (Regulatory Moat)
// ============================================================================

export const complianceLogs = pgTable('compliance_log', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  customerId: text('customer_id').references(() => customers.id, { onDelete: 'cascade' }),

  // Audit details
  eventType: text('event_type').notNull(), // 'opt_in', 'opt_out', 'age_verified', 'promo_redeemed'
  description: text('description').notNull(),

  // Context
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata').$type<Record<string, any>>(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  orgIdx: index('compliance_log_org_idx').on(table.organizationId),
  customerIdx: index('compliance_log_customer_idx').on(table.customerId),
  eventTypeIdx: index('compliance_log_event_type_idx').on(table.eventType),
  createdIdx: index('compliance_log_created_idx').on(table.createdAt),
}));

// ============================================================================
// OUTCOME SNAPSHOTS (Immutable billing-grade frozen metrics)
// ============================================================================

export const outcomeSnapshots = pgTable('outcome_snapshot', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  invoiceId: text('invoice_id').notNull(),

  // Billing period
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),

  // Frozen outcome metrics at billing time
  capturesCount: integer('captures_count').notNull().default(0),
  conversions: integer('conversions').notNull().default(0),
  revenue: real('revenue').notNull().default(0),
  discountCost: real('discount_cost').notNull().default(0),
  profit: real('profit').notNull().default(0),

  // Campaign-level breakdown for audit trail
  campaignBreakdown: jsonb('campaign_breakdown').$type<Array<{
    campaignId: string;
    name: string;
    captures: number;
    conversions: number;
    revenue: number;
    discountCost: number;
    profit: number;
  }>>(),

  // Pricing model snapshot (frozen at billing time)
  pricingSnapshot: jsonb('pricing_snapshot').$type<{
    pricingVersion: string;
    basePrice: number;
    outcomeBasePer1000Captures: number;
    outcomeProfitSharePercent: number;
  }>(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  invoiceIdx: index('outcome_snapshot_invoice_idx').on(table.invoiceId),
  orgIdx: index('outcome_snapshot_org_idx').on(table.organizationId),
  periodIdx: index('outcome_snapshot_period_idx').on(table.periodStart, table.periodEnd),
}));

// ============================================================================
// BILLING & INVOICES (Outcome-based pricing)
// ============================================================================

export const invoices = pgTable('invoice', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  // Invoice details
  number: text('number').notNull().unique(),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),

  // Charges breakdown
  baseCharge: real('base_charge').notNull(), // Monthly subscription
  outcomeCharge: real('outcome_charge').default(0), // Based on captures/profit
  additionalUserCharge: real('additional_user_charge').default(0),

  totalAmount: real('total_amount').notNull(),
  tax: real('tax').default(0),

  // Payment
  status: text('status').notNull().default('draft'), // draft, open, paid, void
  paidAt: timestamp('paid_at'),
  dueDate: timestamp('due_date').notNull(),

  // Metadata (outcome breakdown)
  metadata: jsonb('metadata').$type<{
    capturesCount?: number;
    profitGenerated?: number;
    activeUsers?: number;
  }>(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  numberIdx: uniqueIndex('invoice_number_idx').on(table.number),
  orgIdx: index('invoice_org_idx').on(table.organizationId),
  statusIdx: index('invoice_status_idx').on(table.status),
  dueIdx: index('invoice_due_idx').on(table.dueDate),
}));

export const payments = pgTable('payment', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),

  // Payment details
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('KES'),

  provider: paymentProviderEnum('provider').notNull(),
  providerTransactionId: text('provider_transaction_id'),
  providerFee: real('provider_fee'),

  status: text('status').notNull().default('pending'), // pending, completed, failed
  failureReason: text('failure_reason'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  invoiceIdx: index('payment_invoice_idx').on(table.invoiceId),
  statusIdx: index('payment_status_idx').on(table.status),
  providerTxIdx: index('payment_provider_tx_idx').on(table.providerTransactionId),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(members),
  invitations: many(invitations),
  customers: many(customers),
  campaigns: many(campaigns),
  promoCodes: many(promoCodes),
  products: many(products),
  purchaseOrders: many(purchaseOrders),
  inventoryMovements: many(inventoryMovements),
  promoProfitAlerts: many(promoProfitAlerts),
  whatsappContacts: many(whatsappContacts),
  whatsappMessages: many(whatsappMessages),
  complianceLogs: many(complianceLogs),
  invoices: many(invoices),
  outcomeSnapshots: many(outcomeSnapshots),
}));

export const membersRelations = relations(members, ({ one }) => ({
  organization: one(organizations, {
    fields: [members.organizationId],
    references: [organizations.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [customers.organizationId],
    references: [organizations.id],
  }),
  campaignResponses: many(campaignResponses),
  promoCodes: many(promoCodes),
  complianceLogs: many(complianceLogs),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [campaigns.organizationId],
    references: [organizations.id],
  }),
  responses: many(campaignResponses),
  promoCodes: many(promoCodes),
  inventoryMovements: many(inventoryMovements),
  promoProfitAlerts: many(promoProfitAlerts),
  whatsappMessages: many(whatsappMessages),
}));

export const campaignResponsesRelations = relations(campaignResponses, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignResponses.campaignId],
    references: [campaigns.id],
  }),
  customer: one(customers, {
    fields: [campaignResponses.customerId],
    references: [customers.id],
  }),
}));

export const promoCodesRelations = relations(promoCodes, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [promoCodes.organizationId],
    references: [organizations.id],
  }),
  campaign: one(campaigns, {
    fields: [promoCodes.campaignId],
    references: [campaigns.id],
  }),
  customer: one(customers, {
    fields: [promoCodes.customerId],
    references: [customers.id],
  }),
  product: one(products, {
    fields: [promoCodes.productId],
    references: [products.id],
  }),
  inventoryMovements: many(inventoryMovements),
}));

export const whatsappContactsRelations = relations(whatsappContacts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [whatsappContacts.organizationId],
    references: [organizations.id],
  }),
  customer: one(customers, {
    fields: [whatsappContacts.customerId],
    references: [customers.id],
  }),
  messages: many(whatsappMessages),
}));

export const whatsappMessagesRelations = relations(whatsappMessages, ({ one }) => ({
  organization: one(organizations, {
    fields: [whatsappMessages.organizationId],
    references: [organizations.id],
  }),
  contact: one(whatsappContacts, {
    fields: [whatsappMessages.contactId],
    references: [whatsappContacts.id],
  }),
  campaign: one(campaigns, {
    fields: [whatsappMessages.campaignId],
    references: [campaigns.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [invoices.organizationId],
    references: [organizations.id],
  }),
  payments: many(payments),
  outcomeSnapshot: one(outcomeSnapshots, {
    fields: [invoices.id],
    references: [outcomeSnapshots.invoiceId],
  }),
}));

export const outcomeSnapshotsRelations = relations(outcomeSnapshots, ({ one }) => ({
  organization: one(organizations, {
    fields: [outcomeSnapshots.organizationId],
    references: [organizations.id],
  }),
  invoice: one(invoices, {
    fields: [outcomeSnapshots.invoiceId],
    references: [invoices.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [products.organizationId],
    references: [organizations.id],
  }),
  purchaseOrderItems: many(purchaseOrderItems),
  inventoryMovements: many(inventoryMovements),
  promoCodes: many(promoCodes),
  promoProfitAlerts: many(promoProfitAlerts),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [purchaseOrders.organizationId],
    references: [organizations.id],
  }),
  items: many(purchaseOrderItems),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one, many }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  product: one(products, {
    fields: [purchaseOrderItems.productId],
    references: [products.id],
  }),
  inventoryMovements: many(inventoryMovements),
}));

export const inventoryMovementsRelations = relations(inventoryMovements, ({ one }) => ({
  organization: one(organizations, {
    fields: [inventoryMovements.organizationId],
    references: [organizations.id],
  }),
  product: one(products, {
    fields: [inventoryMovements.productId],
    references: [products.id],
  }),
  fifoBatch: one(purchaseOrderItems, {
    fields: [inventoryMovements.fifoBatchId],
    references: [purchaseOrderItems.id],
  }),
  campaign: one(campaigns, {
    fields: [inventoryMovements.campaignId],
    references: [campaigns.id],
  }),
  promoCode: one(promoCodes, {
    fields: [inventoryMovements.promoCodeId],
    references: [promoCodes.id],
  }),
}));

export const promoProfitAlertsRelations = relations(promoProfitAlerts, ({ one }) => ({
  organization: one(organizations, {
    fields: [promoProfitAlerts.organizationId],
    references: [organizations.id],
  }),
  campaign: one(campaigns, {
    fields: [promoProfitAlerts.campaignId],
    references: [campaigns.id],
  }),
  product: one(products, {
    fields: [promoProfitAlerts.productId],
    references: [products.id],
  }),
}));