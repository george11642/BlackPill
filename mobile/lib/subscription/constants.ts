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
 */

// Pro tier product IDs
export const PRO_MONTHLY_PRODUCT_ID = 'pro_monthly';
export const PRO_YEARLY_PRODUCT_ID = 'pro_yearly';

// Elite tier product IDs
export const ELITE_MONTHLY_PRODUCT_ID = 'elite_monthly';
export const ELITE_YEARLY_PRODUCT_ID = 'elite_yearly';

/**
 * Get product ID by tier and billing interval
 * @param tier - Subscription tier ('pro' | 'elite')
 * @param interval - Billing interval ('monthly' | 'yearly')
 * @returns Product ID string
 */
export const getProductId = (
  tier: 'pro' | 'elite',
  interval: 'monthly' | 'yearly'
): string => {
  if (tier === 'pro') {
    return interval === 'monthly' ? PRO_MONTHLY_PRODUCT_ID : PRO_YEARLY_PRODUCT_ID;
  } else {
    return interval === 'monthly' ? ELITE_MONTHLY_PRODUCT_ID : ELITE_YEARLY_PRODUCT_ID;
  }
};

/**
 * All product IDs as an array (useful for validation or iteration)
 */
export const ALL_PRODUCT_IDS = [
  PRO_MONTHLY_PRODUCT_ID,
  PRO_YEARLY_PRODUCT_ID,
  ELITE_MONTHLY_PRODUCT_ID,
  ELITE_YEARLY_PRODUCT_ID,
] as const;

