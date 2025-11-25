import { relations } from 'drizzle-orm';
import { organizations } from '../auth/organizations';
import { members } from '../auth/members';
import { customers } from '../customers/customers';
import { campaigns } from '../campaigns/campaigns';
import { campaignResponses } from '../campaigns/responses';
import { promoCodes } from '../campaigns/promos';
import { products } from '../products/products';
import { purchaseOrders, purchaseOrderItems } from '../products/purchase-orders';
import { inventoryMovements } from '../products/inventory-movements';
import { complianceLogs } from '../customers/compliance-logs';
import { invoices } from '../billing/invoices';
import { outcomeSnapshots } from '../billing/outcome-snapshots';
import { payments } from '../billing/payments';
import { invitations } from '../auth/invitations';
import { promoProfitAlerts } from '../products/profit-alerts';
import { whatsappContacts } from '../messaging/whatsapp-contacts';
import { whatsappMessages } from '../messaging/whatsapp-messages';

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