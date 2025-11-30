import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';
import { getApiUrl } from '../utils/apiUrl';
import { supabase } from '../supabase/client';
import {
  PRO_MONTHLY_PRODUCT_ID,
  PRO_YEARLY_PRODUCT_ID,
  ELITE_MONTHLY_PRODUCT_ID,
  ELITE_YEARLY_PRODUCT_ID,
  ALL_PRODUCT_IDS,
} from '../subscription/constants';

/**
 * Expected Subscription Product IDs (iOS App Store)
 * These must match exactly with:
 * - App Store Connect subscription product IDs
 * - RevenueCat product store identifiers
 * 
 * Product IDs:
 * - pro_monthly: Pro Monthly subscription
 * - pro_yearly: Pro Yearly subscription
 * - elite_monthly: Elite Monthly subscription
 * - elite_yearly: Elite Yearly subscription
 */

// Initialize RevenueCat SDK
export const initializeRevenueCat = async (userId?: string): Promise<void> => {
  try {
    // Reference product IDs to ensure they're included in the binary
    // This helps Apple App Store Connect detect subscriptions during submission
    if (__DEV__) {
      console.log('Initializing RevenueCat with product IDs:', {
        PRO_MONTHLY_PRODUCT_ID,
        PRO_YEARLY_PRODUCT_ID,
        ELITE_MONTHLY_PRODUCT_ID,
        ELITE_YEARLY_PRODUCT_ID,
        ALL_PRODUCT_IDS,
      });
    }
    
    const apiKey = Platform.OS === 'ios' 
      ? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS
      : process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID;

    if (!apiKey) {
      console.warn(`RevenueCat API key not found for ${Platform.OS} - subscriptions will not be available`);
      return;
    }

    await Purchases.configure({ apiKey });
    
    if (userId) {
      await Purchases.logIn(userId);
    }
  } catch (error: any) {
    // Don't throw - gracefully handle errors so app can still function
    console.error('Error initializing RevenueCat:', error?.message || error);
    // If it's a configuration error, log it but don't crash
    if (error?.code === 'ConfigurationError') {
      console.warn('RevenueCat configuration issue - products may not be set up in dashboard');
    }
  }
};

// Get current offerings
export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error: any) {
    // Handle configuration errors gracefully
    if (error?.code === 'ConfigurationError') {
      console.warn('RevenueCat offerings not configured - no products in dashboard');
      return null;
    }
    if (error?.code === 'StoreProblemError') {
      console.warn('RevenueCat store problem - billing may not be available on this device');
      return null;
    }
    console.error('Error fetching offerings:', error?.message || error);
    return null;
  }
};

// Get customer info
export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  try {
    // Check if Purchases is available and configured
    if (!Purchases || typeof Purchases.getCustomerInfo !== 'function') {
      console.warn('RevenueCat SDK not initialized yet');
      return null;
    }
    
    return await Purchases.getCustomerInfo();
  } catch (error: any) {
    // Handle specific configuration errors
    if (error?.code === 'ConfigurationError' || error?.message?.includes('isConfigured')) {
      console.warn('RevenueCat not configured yet - returning null');
      return null;
    }
    console.error('Error fetching customer info:', error);
    return null;
  }
};

// Purchase a package
export const purchasePackage = async (
  packageToPurchase: PurchasesPackage,
  referralCode?: string
): Promise<CustomerInfo> => {
  try {
    // Set referral code as subscriber attribute before purchase (if provided)
    if (referralCode) {
      try {
        await Purchases.setAttributes({
          '$referralCode': referralCode,
        });
      } catch (attrError) {
        console.error('Error setting referral code attribute:', attrError);
        // Continue with purchase even if attribute setting fails
      }
    }

    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    
    // Also send to backend for immediate attribution (webhook will handle it too)
    if (referralCode && customerInfo.originalAppUserId) {
      try {
        const apiUrl = getApiUrl();
        await fetch(`${apiUrl}/api/revenuecat/attribution`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: customerInfo.originalAppUserId,
            referralCode,
          }),
        });
      } catch (attributionError) {
        console.error('Error sending referral attribution:', attributionError);
        // Don't throw - purchase succeeded, attribution is secondary
      }
    }
    
    return customerInfo;
  } catch (error: any) {
    if (error.userCancelled) {
      throw new Error('Purchase was cancelled');
    }
    throw error;
  }
};

// Restore purchases
export const restorePurchases = async (): Promise<CustomerInfo> => {
  try {
    return await Purchases.restorePurchases();
  } catch (error) {
    console.error('Error restoring purchases:', error);
    throw error;
  }
};

// Check if user has active subscription
export const hasActiveSubscription = (customerInfo: CustomerInfo | null): boolean => {
  if (!customerInfo) return false;
  
  const activeEntitlements = customerInfo.entitlements.active;
  return Object.keys(activeEntitlements).length > 0;
};

// Get subscription tier from entitlements
export const getSubscriptionTier = (customerInfo: CustomerInfo | null): 'pro' | 'elite' | null => {
  if (!customerInfo) return null;
  
  const activeEntitlements = customerInfo.entitlements.active;
  
  // Check for elite entitlement first (highest priority)
  // Support multiple entitlement identifier formats
  if (
    activeEntitlements['elite'] ||
    activeEntitlements['BlackPill Elite'] ||
    activeEntitlements['BlackPill_Elite']
  ) {
    return 'elite';
  }
  
  // Check for pro entitlement (supports multiple variations)
  if (activeEntitlements['BlackPill Pro'] || activeEntitlements['pro']) {
    return 'pro';
  }
  
  return null;
};

// Get package by identifier (for pricing screen)
// Searches by both package identifier and product identifier for flexibility
// Expected product identifiers: pro_monthly, pro_yearly, elite_monthly, elite_yearly
export const getPackageByIdentifier = async (
  identifier: string
): Promise<PurchasesPackage | null> => {
  try {
    const offering = await getOfferings();
    if (!offering) return null;
    
    // Try to find by package identifier first
    const byPackage = offering.availablePackages.find(pkg => pkg.identifier === identifier);
    if (byPackage) return byPackage;
    
    // Fallback: try product identifier (for cases where identifier is a product ID)
    // Product IDs: pro_monthly, pro_yearly, elite_monthly, elite_yearly
    const byProduct = offering.availablePackages.find(pkg => pkg.product.identifier === identifier);
    return byProduct || null;
  } catch (error) {
    console.error('Error getting package by identifier:', error);
    return null;
  }
};

// Sync subscription to backend
export const syncSubscriptionToBackend = async (customerInfo: CustomerInfo): Promise<void> => {
  try {
    // Get the current session for authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session for sync:', sessionError);
      throw new Error('Authentication error: Unable to get session');
    }
    
    if (!session?.access_token) {
      console.error('No active session found for subscription sync');
      throw new Error('Authentication required: Please log in to sync subscription');
    }
    
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/api/revenuecat/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        customerInfo: {
          originalAppUserId: customerInfo.originalAppUserId,
          entitlements: customerInfo.entitlements,
          activeSubscriptions: customerInfo.activeSubscriptions,
          allPurchasedProductIdentifiers: customerInfo.allPurchasedProductIdentifiers,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sync response error:', response.status, errorText);
      throw new Error(`Failed to sync subscription to backend: ${response.status}`);
    }
    
    console.log('Subscription synced to backend successfully');
  } catch (error) {
    console.error('Error syncing subscription to backend:', error);
    throw error;
  }
};

