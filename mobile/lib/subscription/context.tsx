import React, { createContext, useContext, useState, useEffect } from 'react';
import { SubscriptionTier, SubscriptionState, TIER_FEATURES, FeatureAccess } from './types';
import { useAuth } from '../auth/context';
import { supabase } from '../supabase/client';
import { getCustomerInfo, getSubscriptionTier } from '../revenuecat/client';

interface SubscriptionContextType extends SubscriptionState {
  refreshSubscription: () => Promise<void>;
  spendUnblurCredit: () => Promise<boolean>;
  canAccessFeature: (feature: keyof FeatureAccess) => boolean;
  hasUnblurCredits: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    tier: 'free',
    unblurCredits: 0,
    features: TIER_FEATURES.free,
    isLoading: true,
    analysesUsedThisMonth: 0,
    coachMessagesUsedThisMonth: 0,
  });

  useEffect(() => {
    console.log('[Subscription] useEffect triggered, user:', !!user, 'session:', !!session);
    if (user && session) {
      // Add a small delay to allow RevenueCat initialization to complete
      const timer = setTimeout(() => {
        console.log('[Subscription] Timer fired, calling refreshSubscription');
        refreshSubscription();
      }, 500);
      return () => clearTimeout(timer);
    } else if (!user) {
      console.log('[Subscription] No user, setting loading to false');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, session]);

  const refreshSubscription = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      console.log('[Subscription] Starting refresh for user:', user?.id);
      console.log('[Subscription] Session present:', !!session);

      // Check if we have a valid session first
      if (!session) {
        console.log('[Subscription] No session, skipping Supabase queries');
        setState({
          tier: 'free',
          unblurCredits: 0,
          features: TIER_FEATURES['free'],
          isLoading: false,
          analysesUsedThisMonth: 0,
          coachMessagesUsedThisMonth: 0,
        });
        return;
      }

      let currentTier: SubscriptionTier = 'free';

      // 1. First, check Supabase subscriptions table (source of truth)
      if (user?.id) {
        console.log('[Subscription] Checking Supabase subscriptions table...');
        console.log('[Subscription] User ID:', user.id);
        
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select('tier, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        console.log('[Subscription] Supabase query result:', JSON.stringify({ subscription, error: subError }));

        if (subscription && !subError && subscription.tier) {
          console.log('[Subscription] Found subscription with tier:', subscription.tier);
          // Map subscription tier from Supabase (supports 'pro' and 'elite')
          if (subscription.tier === 'elite' || subscription.tier === 'pro') {
            currentTier = subscription.tier;
            console.log('[Subscription] Set tier from Supabase:', currentTier);
          } else {
            console.log('[Subscription] Tier not recognized (expected elite or pro):', subscription.tier);
          }
        } else {
          console.log('[Subscription] No active subscription found in Supabase');
        }
      }

      // 2. Fallback to RevenueCat if Supabase check didn't find active subscription
      if (currentTier === 'free') {
        console.log('[Subscription] Checking RevenueCat...');
        const customerInfo = await getCustomerInfo();
        console.log('[Subscription] RevenueCat customerInfo:', customerInfo ? 'found' : 'null');
        
        if (customerInfo) {
          const tierFromRevenueCat = getSubscriptionTier(customerInfo);
          console.log('[Subscription] RevenueCat tier:', tierFromRevenueCat);
          if (tierFromRevenueCat) {
            currentTier = tierFromRevenueCat;
            console.log('[Subscription] Set tier from RevenueCat:', currentTier);
          }
        }
      }

      console.log('[Subscription] Final tier determined:', currentTier);

      // 3. Get user credits and usage from Supabase
      if (user?.id) {
        console.log('[Subscription] Fetching user data from users table...');
        const { data: userData, error } = await supabase
          .from('users')
          .select('unblur_credits, analyses_used_this_month, coach_messages_used_this_month')
          .eq('id', user.id)
          .single();

        console.log('[Subscription] User data from Supabase:', JSON.stringify({ userData, error }));

        if (userData && !error) {
          setState({
            tier: currentTier,
            unblurCredits: userData.unblur_credits || 0,
            features: TIER_FEATURES[currentTier],
            isLoading: false,
            analysesUsedThisMonth: userData.analyses_used_this_month || 0,
            coachMessagesUsedThisMonth: userData.coach_messages_used_this_month || 0,
          });
          console.log('[Subscription] State updated with tier:', currentTier);
          return;
        }
      }

      // Fallback if DB fetch fails or user not found
      console.log('[Subscription] Using fallback state with tier:', currentTier);
      setState({
        tier: currentTier,
        unblurCredits: 0,
        features: TIER_FEATURES[currentTier],
        isLoading: false,
        analysesUsedThisMonth: 0,
        coachMessagesUsedThisMonth: 0,
      });

    } catch (error) {
      console.error('[Subscription] Failed to refresh subscription:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const spendUnblurCredit = async (): Promise<boolean> => {
    if (state.unblurCredits <= 0) return false;

    try {
      // Optimistic update
      setState(prev => ({ ...prev, unblurCredits: prev.unblurCredits - 1 }));

      const { error } = await supabase.rpc('decrement_unblur_credits', {
        user_id: user?.id
      });

      if (error) {
        console.error('Failed to spend credit:', error);
        // Revert on failure
        refreshSubscription();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error spending credit:', error);
      return false;
    }
  };

  const canAccessFeature = (feature: keyof FeatureAccess): boolean => {
    const access = state.features[feature];
    
    if (feature === 'aiCoach') {
      const limit = (access as FeatureAccess['aiCoach']).messageLimit;
      if (limit === 'unlimited') return true;
      return state.coachMessagesUsedThisMonth < limit;
    }
    
    if (feature === 'analyses') {
        // This is handled separately via unblur logic usually, but generally
        // everyone can access analyses, just blurred or limited unblurred
        return true; 
    }

    // Basic boolean checks for other features (simplified)
    // You might need specific logic per feature
    if (typeof access === 'object' && 'access' in access) {
        return (access as any).access !== false && (access as any).access !== 'locked';
    }
    
    return true; 
  };

  return (
    <SubscriptionContext.Provider
      value={{
        ...state,
        refreshSubscription,
        spendUnblurCredit,
        canAccessFeature,
        hasUnblurCredits: state.unblurCredits > 0,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

