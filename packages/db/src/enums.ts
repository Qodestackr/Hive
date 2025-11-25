import {
  pgEnum,
} from 'drizzle-orm/pg-core';

export const businessTypeEnum = pgEnum('business_type', [
  'retailer',
  'wholesaler',
  'distributor',
  'brand_owner'
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'trialing',
  'past_due',
  'unpaid',
  'canceled',
  'paused',
  // 'outcome_only'
]);

export const costCalculationMethodEnum = pgEnum('cost_calculation_method', [
  'fifo',
  'average',
  'estimated',
]);

export const discountTypeEnum = pgEnum('discount_type', [
  'percentage',
  'fixed',
]);

export const paymentProviderEnum = pgEnum('payment_provider', [
  'mpesa',
  'coop_bank',
  'polar', // creem, Gumroad, lemon squeezy,
  'paystack'
]);

export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft',
  'scheduled',
  'active',
  'paused',
  'completed',
  'cancelled'
]);

export const campaignTypeEnum = pgEnum('campaign_type', [
  'flash_sale',
  'loyalty_nudge',
  'restock_alert',
  'event_promo',
  'dead_hour_boost',
  'product_launch',
  'reactivation'
]);

export const platformEnum = pgEnum('platform', [
  'whatsapp',
  'sms',
  'email'
]);

export const verificationMethodEnum = pgEnum('verification_method', [
  'id_upload',
  'show_at_pickup',
  'manual_verification'
]);
