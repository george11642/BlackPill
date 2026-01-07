/**
 * Subscription Product ID Constants
 * 
 * These constants ensure the product IDs are included as string literals
 * in the app binary, allowing Apple App Store Connect to detect them
 * during app submission and resolve "Missing Metadata" status.
 * 
 * Product IDs must match exactly with:
 * - App Store Connect subscription product IDs
 * - RevenueCat product store identifiers
 * 
 * Single Premium tier with weekly/monthly/yearly billing options
 */

// Premium tier product IDs
export const PREMIUM_WEEKLY_PRODUCT_ID = 'premium_weekly';
export const PREMIUM_MONTHLY_PRODUCT_ID = 'premium_monthly';
export const PREMIUM_YEARLY_PRODUCT_ID = 'premium_yearly';

// Billing interval type
export type BillingInterval = 'weekly' | 'monthly' | 'yearly';

/**
 * Get product ID by billing interval
 * @param interval - Billing interval ('weekly' | 'monthly' | 'yearly')
 * @returns Product ID string
 */
export const getProductId = (interval: BillingInterval): string => {
  switch (interval) {
    case 'weekly':
      return PREMIUM_WEEKLY_PRODUCT_ID;
    case 'monthly':
      return PREMIUM_MONTHLY_PRODUCT_ID;
    case 'yearly':
      return PREMIUM_YEARLY_PRODUCT_ID;
  }
};

/**
 * All product IDs as an array (useful for validation or iteration)
 */
export const ALL_PRODUCT_IDS = [
  PREMIUM_WEEKLY_PRODUCT_ID,
  PREMIUM_MONTHLY_PRODUCT_ID,
  PREMIUM_YEARLY_PRODUCT_ID,
] as const;

// Legacy product IDs (for backward compatibility with existing subscribers)
export const LEGACY_PRO_MONTHLY_PRODUCT_ID = 'pro_monthly';
export const LEGACY_PRO_YEARLY_PRODUCT_ID = 'pro_yearly';
export const LEGACY_ELITE_MONTHLY_PRODUCT_ID = 'elite_monthly';
export const LEGACY_ELITE_YEARLY_PRODUCT_ID = 'elite_yearly';
