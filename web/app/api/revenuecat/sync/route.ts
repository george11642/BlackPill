import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createBrowserClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    let user = null;
    
    // Check for Bearer token in Authorization header (mobile app)
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      // Mobile app authentication via Bearer token
      const token = authHeader.substring(7);
      
      // Create a Supabase client and verify the token
      const supabaseClient = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );
      
      const { data: { user: tokenUser }, error: tokenError } = await supabaseClient.auth.getUser(token);
      
      if (tokenError) {
        console.error('[RevenueCat Sync] Token verification error:', tokenError);
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      
      user = tokenUser;
      console.log('[RevenueCat Sync] Authenticated via Bearer token for user:', user?.id);
    } else {
      // Web app authentication via cookies
      const supabase = await createClient();
      const { data: { user: cookieUser } } = await supabase.auth.getUser();
      user = cookieUser;
      console.log('[RevenueCat Sync] Authenticated via cookies for user:', user?.id);
    }

    if (!user) {
      console.error('[RevenueCat Sync] No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerInfo } = body;

    if (!customerInfo || !customerInfo.originalAppUserId) {
      return NextResponse.json({ error: 'Invalid customer info' }, { status: 400 });
    }

    // Verify the app user ID matches the authenticated user
    if (customerInfo.originalAppUserId !== user.id) {
      console.error('[RevenueCat Sync] User ID mismatch:', {
        authenticated: user.id,
        customerInfo: customerInfo.originalAppUserId,
      });
      return NextResponse.json({ error: 'User ID mismatch' }, { status: 403 });
    }

    // Get active entitlements
    const activeEntitlements = customerInfo.entitlements?.active || {};
    const entitlementKeys = Object.keys(activeEntitlements);

    console.log('[RevenueCat Sync] Active entitlement keys:', entitlementKeys);

    // Determine tier from entitlements
    // Check for elite tier first (highest priority), then pro tier
    // Support multiple entitlement identifier formats
    let tier: 'pro' | 'elite' | null = null;
    
    if (
      entitlementKeys.includes('elite') ||
      entitlementKeys.includes('BlackPill Elite') ||
      entitlementKeys.includes('BlackPill_Elite')
    ) {
      tier = 'elite';
      console.log('[RevenueCat Sync] Matched elite tier from entitlements');
    } else if (entitlementKeys.includes('BlackPill Pro') || entitlementKeys.includes('pro')) {
      tier = 'pro';
      console.log('[RevenueCat Sync] Matched pro tier from entitlements');
    }

    if (!tier) {
      // No active subscription
      console.log('[RevenueCat Sync] No active subscription tier found');
      return NextResponse.json({ synced: true, message: 'No active subscription' });
    }

    // Get the active entitlement for period dates
    // Find the entitlement that matches the tier, or use the first available
    const tierEntitlementKey = entitlementKeys.find(key => 
      key === tier || 
      (tier === 'elite' && (key === 'elite' || key === 'BlackPill Elite' || key === 'BlackPill_Elite')) ||
      (tier === 'pro' && (key === 'pro' || key === 'BlackPill Pro'))
    );
    const activeEntitlement = tierEntitlementKey 
      ? activeEntitlements[tierEntitlementKey] 
      : Object.values(activeEntitlements)[0];
    const expirationDate = activeEntitlement?.expirationDate
      ? new Date(activeEntitlement.expirationDate).toISOString()
      : null;
    const purchaseDate = activeEntitlement?.purchaseDate
      ? new Date(activeEntitlement.purchaseDate).toISOString()
      : new Date().toISOString();

    // Get transaction ID from active subscriptions
    const transactionId = customerInfo.activeSubscriptions?.[0] || null;

    // Use admin client for database operations (bypasses RLS)
    const adminClient = createAdminClient();
    
    // Check if subscription exists, then insert or update
    const { data: existingSub } = await adminClient
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('payment_provider', 'revenuecat')
      .single();

    let error;
    if (existingSub) {
      // Update existing subscription
      const result = await adminClient
        .from('subscriptions')
        .update({
          tier: tier,
          status: 'active',
          revenuecat_subscription_id: transactionId,
          revenuecat_customer_id: customerInfo.originalAppUserId,
          current_period_start: purchaseDate,
          current_period_end: expirationDate,
          cancel_at_period_end: false,
        })
        .eq('id', existingSub.id);
      error = result.error;
    } else {
      // Insert new subscription
      const result = await adminClient.from('subscriptions').insert({
        user_id: user.id,
        tier: tier,
        status: 'active',
        revenuecat_subscription_id: transactionId,
        revenuecat_customer_id: customerInfo.originalAppUserId,
        payment_provider: 'revenuecat',
        current_period_start: purchaseDate,
        current_period_end: expirationDate,
        cancel_at_period_end: false,
      });
      error = result.error;
    }

    if (error) {
      console.error('[RevenueCat Sync] Error syncing subscription:', error);
      return NextResponse.json({ error: 'Failed to sync subscription' }, { status: 500 });
    }

    // Auto-create affiliate record for new subscribers
    try {
      const { data: existingAffiliate } = await adminClient
        .from('affiliates')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!existingAffiliate) {
        // Generate a unique referral code
        const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        
        await adminClient.from('affiliates').insert({
          user_id: user.id,
          referral_code: referralCode,
          tier: 'base',
          commission_rate: 20.0,
          is_active: true,
        });
        
        console.log('[RevenueCat Sync] Created affiliate record for user:', user.id, 'code:', referralCode);
      }
    } catch (affiliateError) {
      // Don't fail the sync if affiliate creation fails - subscription is the priority
      console.error('[RevenueCat Sync] Error creating affiliate (non-fatal):', affiliateError);
    }

    console.log('[RevenueCat Sync] Successfully synced subscription for user:', user.id, 'tier:', tier);
    return NextResponse.json({ synced: true, tier });
  } catch (error: any) {
    console.error('[RevenueCat Sync] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

