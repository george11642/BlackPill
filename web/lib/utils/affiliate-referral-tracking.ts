/**
 * Tracks affiliate referral clicks once per visitor using localStorage
 * Prevents duplicate tracking when navigating between pages
 */

const AFFILIATE_REFERRAL_TRACKED_KEY = 'blackpill_affiliate_referral_tracked';
const AFFILIATE_REFERRAL_TRACKED_EXPIRY_DAYS = 30;

interface TrackedAffiliateReferral {
  code: string;
  timestamp: number;
}

/**
 * Check if an affiliate referral code has already been tracked for this visitor
 */
export function hasAffiliateReferralBeenTracked(referralCode: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const stored = localStorage.getItem(AFFILIATE_REFERRAL_TRACKED_KEY);
    if (!stored) return false;

    const tracked: TrackedAffiliateReferral = JSON.parse(stored);
    const now = Date.now();
    const expiryTime = AFFILIATE_REFERRAL_TRACKED_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    // Check if it's the same code and still within expiry window
    if (
      tracked.code === referralCode &&
      now - tracked.timestamp < expiryTime
    ) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking affiliate referral tracking:', error);
    return false;
  }
}

/**
 * Mark an affiliate referral code as tracked
 */
export function markAffiliateReferralAsTracked(referralCode: string): void {
  if (typeof window === 'undefined') return;

  try {
    const tracked: TrackedAffiliateReferral = {
      code: referralCode,
      timestamp: Date.now(),
    };
    localStorage.setItem(
      AFFILIATE_REFERRAL_TRACKED_KEY,
      JSON.stringify(tracked)
    );
  } catch (error) {
    console.error('Error marking affiliate referral as tracked:', error);
  }
}

/**
 * Track an affiliate referral click (only if not already tracked)
 */
export async function trackAffiliateReferralClick(
  referralCode: string
): Promise<boolean> {
  if (hasAffiliateReferralBeenTracked(referralCode)) {
    return false; // Already tracked, skip
  }

  try {
    const response = await fetch('/api/affiliates/referral-click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ referralCode }),
    });

    if (response.ok) {
      markAffiliateReferralAsTracked(referralCode);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to track affiliate referral click:', error);
    return false;
  }
}

/**
 * Get the stored affiliate referral code from localStorage
 */
export function getStoredAffiliateReferralCode(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(AFFILIATE_REFERRAL_TRACKED_KEY);
    if (!stored) return null;

    const tracked: TrackedAffiliateReferral = JSON.parse(stored);
    const now = Date.now();
    const expiryTime = AFFILIATE_REFERRAL_TRACKED_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    // Check if still within expiry window
    if (now - tracked.timestamp < expiryTime) {
      return tracked.code;
    }

    return null;
  } catch (error) {
    console.error('Error getting stored affiliate referral code:', error);
    return null;
  }
}

/**
 * Clear the stored affiliate referral code
 */
export function clearStoredAffiliateReferralCode(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(AFFILIATE_REFERRAL_TRACKED_KEY);
  } catch (error) {
    console.error('Error clearing affiliate referral code:', error);
  }
}

