
import Stripe from 'stripe';
import {
  config,
  supabaseAdmin,
  sendRenewalReminder,
  sendPaymentFailedEmail,
  handleApiError,
  getRequestId,
  createResponseWithId,
} from '@/lib';

const stripe = new Stripe(config.stripe.secretKey);

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
// Configure runtime - force dynamic and no revalidation to avoid Next.js routing issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  console.log(`[Stripe Webhook] Received webhook request - Request ID: ${requestId}`);
  
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    console.error('[Stripe Webhook] Missing stripe-signature header');
    return createResponseWithId(
      { error: 'Missing stripe-signature header' },
      { status: 400 },
      requestId
    );
  }

  let event: Stripe.Event;

  try {
    // Get raw body for signature verification
    const body = await request.text();
    
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      config.stripe.webhookSecret
    );
  } catch (err) {
    console.error(`[Stripe Webhook] Signature verification failed for request ${requestId}:`, err);
    return createResponseWithId(
      { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 400 },
      requestId
    );
  }

  // Handle the event
  try {
    console.log(`[Stripe Webhook] Processing event type: ${event.type}, Event ID: ${event.id}`);
    
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    console.log(`[Stripe Webhook] Successfully processed event ${event.id} of type ${event.type}`);
    return createResponseWithId({ received: true }, { status: 200 }, requestId);
  } catch (error) {
    console.error(`[Stripe Webhook] Error processing event ${event.id}:`, error);
    // Ensure we return a proper error response (handleApiError should return 500 for server errors)
    const errorResponse = handleApiError(error, request);
    // Log the status code being returned
    console.error(`[Stripe Webhook] Returning error response with status: ${errorResponse.status}`);
    return errorResponse;
  }
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const source = session.metadata?.source || 'web';
  const userId = session.metadata?.user_id;
  const tier = session.metadata?.tier || 'basic';
  const affiliateReferralCode = session.metadata?.affiliate_referral_code;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!customerId || !subscriptionId) {
    console.error('Missing customer or subscription ID in checkout session');
    return;
  }

  // Get customer email from Stripe
  const customer = await stripe.customers.retrieve(customerId);
  const customerEmail = typeof customer === 'object' && !(customer as any).deleted ? (customer as any).email : null;

  if (!customerEmail) {
    console.error('No email found for customer:', customerId);
    return;
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  let finalUserId = userId || null;

  // For web flow (unauthenticated), find or create user by email
  if (!finalUserId && customerEmail) {
    // Check if user exists with this email
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', customerEmail)
      .single();

    if (existingUser) {
      finalUserId = existingUser.id;
    } else {
      // Create new user account for web checkout
      const { data: newUser, error } = await supabaseAdmin
        .from('users')
        .insert({
          email: customerEmail,
          tier: 'free',
          scans_remaining: 0,
        })
        .select('id')
        .single();

      if (newUser && !error) {
        finalUserId = newUser.id;
      } else {
        console.error('Failed to create user for web checkout:', error);
      }
    }
  }

  // Get user's referred_by if they have one
  let referredByUserId: string | null = null;
  if (finalUserId) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('referred_by')
      .eq('id', finalUserId)
      .single();
    
    referredByUserId = user?.referred_by || null;
  }

  // Generate RevenueCat IDs for app compatibility
  // The mobile app requires RevenueCat IDs to recognize subscriptions, even for Stripe subscriptions
  const revenuecatSubscriptionId = `stripe_${subscriptionId}`;
  const revenuecatCustomerId = finalUserId || customerId;

  // Create or update subscription record
  const { error: subscriptionError } = await supabaseAdmin
    .from('subscriptions')
    .upsert({
      user_id: finalUserId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      tier: tier,
      status: 'active',
      source,
      referred_by_user_id: referredByUserId,
      current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      payment_provider: 'stripe',
      // Set RevenueCat IDs for app compatibility
      revenuecat_subscription_id: revenuecatSubscriptionId,
      revenuecat_customer_id: revenuecatCustomerId,
    });

  if (subscriptionError) {
    console.error('Error creating subscription record:', subscriptionError);
  }

  // Update user tier if we have a user ID
  if (finalUserId) {
    await supabaseAdmin
      .from('users')
      .update({ tier: tier })
      .eq('id', finalUserId);

    // Handle affiliate referral if present (legacy support)
    if (affiliateReferralCode) {
      try {
        await handleAffiliateReferralConversion(finalUserId, affiliateReferralCode);
      } catch (error) {
        console.error('Error handling affiliate referral:', error);
      }
    }

    // Auto-create affiliate record for new subscriber
    try {
      await createAffiliateIfNeeded(finalUserId);
    } catch (error) {
      console.error('Error creating affiliate record:', error);
    }
  }

  console.log(`Subscription created for user ${finalUserId}:`, {
    subscriptionId,
    tier: tier,
    source,
  });
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const { data: subscriptionRecord } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, tier, revenuecat_subscription_id, revenuecat_customer_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  // Ensure RevenueCat IDs are set if missing (for app compatibility)
  const updateData: any = {
    status: subscription.status,
    current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
  };

  // Set RevenueCat IDs if missing
  if (!subscriptionRecord?.revenuecat_subscription_id) {
    updateData.revenuecat_subscription_id = `stripe_${subscription.id}`;
  }
  if (!subscriptionRecord?.revenuecat_customer_id && subscriptionRecord?.user_id) {
    updateData.revenuecat_customer_id = subscriptionRecord.user_id;
  }

  // Update subscription status
  await supabaseAdmin
    .from('subscriptions')
    .update(updateData)
    .eq('stripe_subscription_id', subscription.id);
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const { data: subscriptionRecord } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  // Update subscription status to canceled
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

/**
 * Handle invoice paid
 */
async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const { data: subscriptionRecord } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, tier, referred_by_user_id')
    .eq('stripe_subscription_id', (invoice as any).subscription as string)
    .single();

  // Calculate commission or grant credits if this is a paid invoice
  if (subscriptionRecord?.user_id && invoice.amount_paid && invoice.amount_paid > 0) {
    try {
      const amount = invoice.amount_paid / 100; // Convert from cents to dollars
      
      // Get referrer - prefer subscription.referred_by_user_id, then check user's referred_by
      let referrerUserId = subscriptionRecord.referred_by_user_id;
      
      if (!referrerUserId) {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('referred_by')
          .eq('id', subscriptionRecord.user_id)
          .single();
        
        referrerUserId = user?.referred_by || null;
      }

      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/commissions/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: (invoice as any).subscription,
          amount: amount,
          referred_user_id: subscriptionRecord.user_id,
          referrer_user_id: referrerUserId,
        }),
      });
    } catch (error) {
      console.error('Error calculating commission:', error);
    }
  }

  console.log(`Invoice paid: ${invoice.id}`);
}

/**
 * Handle payment failed
 */
async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const { data: subscriptionRecord } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, tier')
    .eq('stripe_subscription_id', (invoice as any).subscription as string)
    .single();

  if (subscriptionRecord?.user_id) {
    // Send payment failure email notification
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', subscriptionRecord.user_id)
      .single();

    if (user?.email) {
      await sendPaymentFailedEmail(user.email, {
        tier: subscriptionRecord.tier,
      }).catch((error) => console.error('Error sending payment failed email:', error));
    }
  }

  console.log(`Payment failed: ${invoice.id}`);
}

/**
 * Handle affiliate referral conversion when a user subscribes with a referral code
 */
async function handleAffiliateReferralConversion(
  userId: string,
  referralCode: string
): Promise<void> {
  try {
    // Find affiliate by referral code
    const { data: affiliate } = await supabaseAdmin
      .from('affiliates')
      .select('id, user_id')
      .eq('referral_code', referralCode.toUpperCase())
      .eq('is_active', true)
      .single();

    if (!affiliate) {
      console.log('Affiliate not found for code:', referralCode);
      return;
    }

    // Find the affiliate_referral record for this user and mark it as converted
    const { data: referral } = await supabaseAdmin
      .from('affiliate_referrals')
      .select('id')
      .eq('affiliate_id', affiliate.id)
      .eq('referred_user_id', userId)
      .eq('is_converted', false)
      .single();

    if (referral) {
      // Update referral as converted
      await supabaseAdmin
        .from('affiliate_referrals')
        .update({
          is_converted: true,
          conversion_timestamp: new Date().toISOString(),
        })
        .eq('id', referral.id);

      console.log('Affiliate referral marked as converted:', {
        affiliateId: affiliate.id,
        referralId: referral.id,
        userId,
      });
    }
  } catch (error) {
    console.error('Error handling affiliate referral conversion:', error);
  }
}

/**
 * Create affiliate record for new subscriber if they don't already have one
 */
async function createAffiliateIfNeeded(userId: string): Promise<void> {
  try {
    // Check if affiliate already exists
    const { data: existingAffiliate } = await supabaseAdmin
      .from('affiliates')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingAffiliate) {
      console.log('Affiliate already exists for user:', userId);
      return;
    }

    // Generate unique referral code
    let referralCode = '';
    let isUnique = false;
    while (!isUnique) {
      referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const { data: existing } = await supabaseAdmin
        .from('affiliates')
        .select('id')
        .eq('referral_code', referralCode)
        .single();
      isUnique = !existing;
    }

    // Create new affiliate record
    const { error } = await supabaseAdmin
      .from('affiliates')
      .insert({
        user_id: userId,
        referral_code: referralCode,
        tier: 'base',
        commission_rate: 20.0,
        is_active: true,
      });

    if (error) {
      console.error('Error creating affiliate record:', error);
      return;
    }

    console.log('Affiliate record created for user:', { userId, referralCode });
  } catch (error) {
    console.error('Error in createAffiliateIfNeeded:', error);
  }
}

