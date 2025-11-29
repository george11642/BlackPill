import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import {
  sendSubscriptionConfirmation,
  sendAffiliateReferralSuccessEmail,
} from '@/lib/emails/send';

// RevenueCat webhook event types
type RevenueCatEvent = {
  event: {
    id: string;
    type: string;
    app_user_id: string;
    product_id: string;
    period_type: string;
    purchased_at_ms: number;
    expiration_at_ms: number | null;
    environment: string;
    entitlement_ids: string[];
    presented_offering_id?: string;
    transaction_id: string;
    original_transaction_id: string;
    is_family_share?: boolean;
    country_code?: string;
    currency?: string;
    price?: number;
    price_in_purchased_currency?: number;
    subscriber_attributes?: Record<string, any>;
  };
};

export async function POST(request: Request) {
  // Verify webhook authorization
  const expectedToken = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!expectedToken) {
    console.error('[RevenueCat Webhook] REVENUECAT_WEBHOOK_SECRET not configured in environment variables');
    return NextResponse.json({ 
      error: 'Webhook not configured',
      message: 'REVENUECAT_WEBHOOK_SECRET environment variable is missing. Please set it in Vercel environment variables.'
    }, { status: 500 });
  }

  // Parse body first to check if it's a test event
  let body;
  try {
    body = await request.json();
  } catch (error) {
    console.error('[RevenueCat Webhook] Failed to parse request body:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const event = body as RevenueCatEvent;
  const isTestEvent = event.event?.type === 'TEST';
  const isProductChangeEvent = event.event?.type === 'PRODUCT_CHANGE';
  const isSandboxEvent = event.event?.environment === 'SANDBOX';
  const eventEnvironment = event.event?.environment || 'UNKNOWN';

  // Check authorization - try multiple methods
  const headersList = await headers();
  
  // Check User-Agent to verify it's from RevenueCat
  const userAgent = headersList.get('user-agent');
  const isFromRevenueCat = userAgent?.includes('RevenueCat') || userAgent?.includes('revenuecat');
  
  // Log event environment for diagnostics
  console.log(`[RevenueCat Webhook] Event environment: ${eventEnvironment}, Event type: ${event.event?.type}`);
  if (userAgent) {
    console.log(`[RevenueCat Webhook] User-Agent: ${userAgent}`);
    console.log(`[RevenueCat Webhook] User-Agent verification: ${isFromRevenueCat ? 'PASSED' : 'FAILED'}`);
  } else {
    console.warn('[RevenueCat Webhook] No User-Agent header found');
  }
  
  // Try multiple header name variations (case-insensitive)
  // Note: headers() in Next.js App Router returns lowercase keys
  const authHeader = 
    headersList.get('authorization') || 
    headersList.get('Authorization') ||
    headersList.get('AUTHORIZATION');

  // Also check for token in query parameters as fallback
  const url = new URL(request.url);
  const queryToken = url.searchParams.get('token');

  // Extract token from header if present
  let token: string | null = null;
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove "Bearer " prefix
    } else {
      // RevenueCat might send the token directly without "Bearer " prefix
      token = authHeader;
    }
  } else if (queryToken) {
    // Fallback to query parameter
    token = queryToken;
  }

  // For SANDBOX, TEST, and PRODUCT_CHANGE events, RevenueCat may not send Authorization headers
  // (known limitation for test/sandbox events)
  // Allow these events through but log a warning
  if ((isSandboxEvent || isTestEvent || isProductChangeEvent) && !token) {
    console.warn(`[RevenueCat Webhook] ${event.event?.type} event (environment: ${eventEnvironment}) received without Authorization header. This is expected for RevenueCat test/sandbox events.`);
    if (!isFromRevenueCat) {
      console.warn('[RevenueCat Webhook] Warning: User-Agent verification failed, but allowing event due to SANDBOX/TEST/PRODUCT_CHANGE type');
    }
    console.warn('[RevenueCat Webhook] Available headers:', Object.fromEntries(headersList.entries()));
    // Continue processing test/sandbox event without auth check
  } else if (!token) {
    // For PRODUCTION events, require authentication
    console.error('[RevenueCat Webhook] Missing Authorization header');
    console.error('[RevenueCat Webhook] Event type:', event.event?.type);
    console.error('[RevenueCat Webhook] Event environment:', eventEnvironment);
    console.error('[RevenueCat Webhook] User-Agent verification:', isFromRevenueCat ? 'PASSED' : 'FAILED');
    console.error('[RevenueCat Webhook] Available headers:', Object.fromEntries(headersList.entries()));
    console.error('[RevenueCat Webhook] Request URL:', request.url);
    return NextResponse.json({ 
      error: 'Unauthorized',
      message: `Missing Authorization header for PRODUCTION event (environment: ${eventEnvironment}). Please configure the Authorization Token in RevenueCat webhook settings. SANDBOX events may bypass authentication, but PRODUCTION events require proper authorization.`
    }, { status: 401 });
  } else if (token !== expectedToken) {
    console.error('[RevenueCat Webhook] Token mismatch.');
    console.error('[RevenueCat Webhook] Event environment:', eventEnvironment);
    console.error('[RevenueCat Webhook] Expected token length:', expectedToken.length);
    console.error('[RevenueCat Webhook] Received token length:', token.length);
    console.error('[RevenueCat Webhook] Received token (first 10 chars):', token.substring(0, 10));
    console.error('[RevenueCat Webhook] Event type:', event.event?.type);
    console.error('[RevenueCat Webhook] User-Agent verification:', isFromRevenueCat ? 'PASSED' : 'FAILED');
    return NextResponse.json({ 
      error: 'Unauthorized',
      message: 'Invalid authorization token. Please verify the REVENUECAT_WEBHOOK_SECRET matches the token configured in RevenueCat.'
    }, { status: 401 });
  }

  const supabase = createAdminClient();

  console.log('[RevenueCat Webhook] Received event:', event.event.type, 'for user:', event.event.app_user_id);

  try {
    const eventType = event.event.type;
    
    // For TEST and PRODUCT_CHANGE events, just acknowledge receipt
    // SANDBOX events are now processed to support development/testing
    if (isTestEvent || isProductChangeEvent) {
      console.log(`[RevenueCat Webhook] ${eventType} event (environment: ${eventEnvironment}) acknowledged (not processed)`);
      return NextResponse.json({ 
        received: true, 
        message: `${eventType} event (environment: ${eventEnvironment}) received successfully. Note: TEST/PRODUCT_CHANGE events are acknowledged but not processed.` 
      });
    }
    
    // Log sandbox events for visibility
    if (isSandboxEvent) {
      console.log(`[RevenueCat Webhook] Processing SANDBOX event: ${eventType} for user: ${event.event.app_user_id}`);
    }

    const appUserId = event.event.app_user_id;
    const entitlementIds = event.event.entitlement_ids || [];
    
    console.log('[RevenueCat Webhook] Entitlement IDs in event:', entitlementIds);
    
    // Determine tier from entitlements
    // Check for elite tier first (highest priority), then pro tier
    // Support multiple entitlement identifier formats
    let tier: 'pro' | 'elite' | null = null;
    
    if (
      entitlementIds.includes('elite') ||
      entitlementIds.includes('BlackPill Elite') ||
      entitlementIds.includes('BlackPill_Elite')
    ) {
      tier = 'elite';
      console.log('[RevenueCat Webhook] Matched elite tier from entitlements');
    } else if (entitlementIds.includes('BlackPill Pro') || entitlementIds.includes('pro')) {
      tier = 'pro';
      console.log('[RevenueCat Webhook] Matched pro tier from entitlements');
    }

    if (!tier) {
      console.log('[RevenueCat Webhook] No valid entitlement found in event:', eventType, 'Entitlement IDs:', entitlementIds);
      return NextResponse.json({ received: true });
    }

    // Find user by RevenueCat app_user_id (should match Supabase user_id)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, name')
      .eq('id', appUserId)
      .single();

    if (!profile) {
      console.error('User not found for app_user_id:', appUserId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = profile.id;

    // Get user's referred_by if they have one
    const { data: user } = await supabase
      .from('users')
      .select('referred_by')
      .eq('id', userId)
      .single();
    
    const referredByUserId = user?.referred_by || null;

    switch (eventType) {
      case 'INITIAL_PURCHASE': {
        // New subscription purchase
        const expirationDate = event.event.expiration_at_ms
          ? new Date(event.event.expiration_at_ms).toISOString()
          : null;
        const purchaseDate = new Date(event.event.purchased_at_ms).toISOString();

        // Get subscription price (convert from cents if needed, or use as-is)
        const subscriptionPrice = event.event.price 
          ? (event.event.price / 100) // RevenueCat price is typically in cents
          : (tier === 'pro' ? 12.99 : 19.99); // Fallback to default prices

        // Create or update subscription record
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          tier: tier,
          status: 'active',
          revenuecat_subscription_id: event.event.transaction_id,
          revenuecat_customer_id: appUserId,
          payment_provider: 'revenuecat',
          referred_by_user_id: referredByUserId,
          current_period_start: purchaseDate,
          current_period_end: expirationDate,
          cancel_at_period_end: false,
        });

        // Send subscription confirmation email
        if (profile.email) {
          const price = event.event.price_in_purchased_currency
            ? `$${(event.event.price_in_purchased_currency / 100).toFixed(2)}`
            : (tier === 'pro' ? '$12.99' : '$19.99');
          try {
            await sendSubscriptionConfirmation(profile.email, tier, price);
          } catch (emailError) {
            console.error('Failed to send subscription confirmation email:', emailError);
          }
        }

        // Calculate commission or grant credits for initial purchase
        if (referredByUserId && subscriptionPrice > 0) {
          try {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/commissions/calculate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                subscriptionId: event.event.transaction_id,
                amount: subscriptionPrice,
                referred_user_id: userId,
                referrer_user_id: referredByUserId,
              }),
            });
          } catch (error) {
            console.error('Error calculating commission for INITIAL_PURCHASE:', error);
          }
        }

        // Check for referral code in subscriber attributes (legacy support)
        const referralCode = event.event.subscriber_attributes?.referral_code?.value;
        if (referralCode) {
          await handleReferralConversion(supabase, userId, referralCode, profile);
        } else {
          // Auto-create affiliate for new subscriber
          await createAffiliateIfNeeded(supabase, userId);
        }
        break;
      }

      case 'RENEWAL': {
        // Subscription renewal
        const expirationDate = event.event.expiration_at_ms
          ? new Date(event.event.expiration_at_ms).toISOString()
          : null;
        const purchaseDate = new Date(event.event.purchased_at_ms).toISOString();

        // Get subscription record to determine tier and price
        const { data: subscriptionRecord } = await supabase
          .from('subscriptions')
          .select('tier, referred_by_user_id')
          .eq('revenuecat_customer_id', appUserId)
          .eq('payment_provider', 'revenuecat')
          .single();

        // Get subscription price (convert from cents if needed, or use as-is)
        const subscriptionPrice = event.event.price 
          ? (event.event.price / 100) // RevenueCat price is typically in cents
          : (subscriptionRecord?.tier === 'pro' ? 12.99 : 19.99); // Fallback to default prices

        // Get referrer - prefer subscription.referred_by_user_id, then check user's referred_by
        let referrerUserId = subscriptionRecord?.referred_by_user_id || referredByUserId;

        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_start: purchaseDate,
            current_period_end: expirationDate,
            cancel_at_period_end: false,
          })
          .eq('revenuecat_customer_id', appUserId)
          .eq('payment_provider', 'revenuecat');

        // Calculate commission or grant credits for renewal
        if (referrerUserId && subscriptionPrice > 0) {
          try {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/commissions/calculate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                subscriptionId: event.event.transaction_id,
                amount: subscriptionPrice,
                referred_user_id: userId,
                referrer_user_id: referrerUserId,
              }),
            });
          } catch (error) {
            console.error('Error calculating commission for RENEWAL:', error);
          }
        }
        break;
      }

      case 'CANCELLATION': {
        // Subscription cancelled
        await supabase
          .from('subscriptions')
          .update({
            cancel_at_period_end: true,
          })
          .eq('revenuecat_customer_id', appUserId)
          .eq('payment_provider', 'revenuecat');
        break;
      }

      case 'UNCANCELLATION': {
        // Subscription reactivated
        const expirationDate = event.event.expiration_at_ms
          ? new Date(event.event.expiration_at_ms).toISOString()
          : null;
        const purchaseDate = new Date(event.event.purchased_at_ms).toISOString();

        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_start: purchaseDate,
            current_period_end: expirationDate,
            cancel_at_period_end: false,
          })
          .eq('revenuecat_customer_id', appUserId)
          .eq('payment_provider', 'revenuecat');
        break;
      }

      case 'BILLING_ISSUE': {
        // Payment failed
        await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
          })
          .eq('revenuecat_customer_id', appUserId)
          .eq('payment_provider', 'revenuecat');
        break;
      }

      case 'EXPIRATION': {
        // Subscription expired
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
          })
          .eq('revenuecat_customer_id', appUserId)
          .eq('payment_provider', 'revenuecat');
        break;
      }

      default:
        console.log('Unhandled RevenueCat event type:', eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('RevenueCat webhook handler error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to handle referral conversion
async function handleReferralConversion(
  supabase: any,
  userId: string,
  referralCode: string,
  profile: any
) {
  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('id, user_id')
    .eq('referral_code', referralCode)
    .eq('is_active', true)
    .single();

  if (affiliate) {
    // Mark referral as converted
    await supabase
      .from('referrals')
      .update({
        referred_user_id: userId,
        conversion_timestamp: new Date().toISOString(),
        is_converted: true,
      })
      .eq('affiliate_id', affiliate.id)
      .is('referred_user_id', null)
      .order('click_timestamp', { ascending: false })
      .limit(1);

    // Send referral success email to affiliate
    const { data: affiliateProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', affiliate.user_id)
      .single();

    if (affiliateProfile?.email && profile?.name) {
      // Assuming standard 20% commission for legacy referrals
      const estimatedCommission = 2.60; // 20% of $12.99
      try {
        await sendAffiliateReferralSuccessEmail(
          affiliateProfile.email, 
          profile.name,
          estimatedCommission,
          20
        );
      } catch (emailError) {
        console.error('Failed to send referral success email:', emailError);
      }
    }
  }

  // Auto-create affiliate for new subscriber
  await createAffiliateIfNeeded(supabase, userId);
}

// Helper function to create affiliate if needed
async function createAffiliateIfNeeded(supabase: any, userId: string) {
  const { data: existingAffiliate } = await supabase
    .from('affiliates')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!existingAffiliate) {
    // Generate referral code
    const { data: codeData } = await supabase.rpc('generate_referral_code');
    const referralCode = codeData || Math.random().toString(36).substring(2, 10).toUpperCase();

    await supabase.from('affiliates').insert({
      user_id: userId,
      referral_code: referralCode,
      tier: 'base',
      commission_rate: 20.0,
      is_active: true,
    });
  }
}

