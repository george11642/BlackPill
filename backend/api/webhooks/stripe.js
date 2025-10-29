const Stripe = require('stripe');
const { supabaseAdmin } = require('../../utils/supabase');
const config = require('../../utils/config');
const { sendRenewalReminder, sendPaymentFailedEmail } = require('../../utils/email-service');

const stripe = new Stripe(config.stripe.secretKey);

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
module.exports = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

/**
 * Handle checkout session completed
 * Supports both app (authenticated) and web (unauthenticated) flows
 */
async function handleCheckoutCompleted(session) {
  const source = session.metadata.source || 'web';
  const userId = session.metadata.user_id;
  const tier = session.metadata.tier;
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  // Get customer email from Stripe
  const customer = await stripe.customers.retrieve(customerId);
  const customerEmail = customer.email;

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  let finalUserId = userId;

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
      // Note: This requires the user to sign up in the app later with the same email
      // For now, we'll create a placeholder user record
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
        // Continue with subscription creation - user can be linked later
      }
    }
  }

  if (!finalUserId) {
    console.error('No user ID available for subscription', {
      sessionId: session.id,
      customerEmail,
      source,
    });
    // Still create subscription record but without user_id
    // User can be linked later when they sign up
  }

  // Create or update subscription record
  const subscriptionData = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    tier,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    source, // Track where subscription came from
  };

  if (finalUserId) {
    subscriptionData.user_id = finalUserId;
  }

  await supabaseAdmin
    .from('subscriptions')
    .upsert(subscriptionData, {
      onConflict: 'stripe_subscription_id',
    });

  // Update user tier and scans if user_id is available
  if (finalUserId) {
    const scansMap = {
      basic: 5,
      pro: 20,
      unlimited: -1, // unlimited
    };

    await supabaseAdmin
      .from('users')
      .update({
        tier,
        scans_remaining: scansMap[tier],
      })
      .eq('id', finalUserId);
  }

  // Track analytics by source
  console.log('Subscription completed', {
    source,
    tier,
    userId: finalUserId,
    customerEmail,
    subscriptionId,
  });

  // TODO: Send to analytics service (PostHog, etc.)
  // analytics.track('subscription_completed', {
  //   source,
  //   tier,
  //   user_id: finalUserId,
  // });
}

/**
 * Handle subscription update
 */
async function handleSubscriptionUpdate(subscription) {
  const customerId = subscription.customer;

  // Get user ID from subscription
  const { data: subData } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!subData) {
    console.error('User not found for subscription update');
    return;
  }

  // Update subscription status
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;

  // Get user
  const { data: subData } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!subData) return;

  // Update subscription status
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  // Downgrade user to free tier
  await supabaseAdmin
    .from('users')
    .update({
      tier: 'free',
      scans_remaining: 0,
    })
    .eq('id', subData.user_id);
}

/**
 * Handle invoice paid (renewal)
 */
async function handleInvoicePaid(invoice) {
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) return;

  // Get subscription
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId = subscription.customer;

  // Get user
  const { data: subData } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, tier')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!subData) return;

  // Reset scans for the new billing period
  const scansMap = {
    basic: 5,
    pro: 20,
    unlimited: -1,
  };

  await supabaseAdmin
    .from('users')
    .update({
      scans_remaining: scansMap[subData.tier],
    })
    .eq('id', subData.user_id);
}

/**
 * Handle payment failure
 */
async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;

  // Get user and subscription
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select(`
      user_id,
      tier,
      users!inner(email)
    `)
    .eq('stripe_customer_id', customerId)
    .single();

  if (!sub) return;

  // Send email notification about payment failure
  try {
    await sendPaymentFailedEmail(sub.users.email, {
      tier: sub.tier,
    });
  } catch (error) {
    console.error('Failed to send payment failure email:', error);
  }
}

