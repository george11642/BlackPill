const Stripe = require('stripe');
const { supabaseAdmin } = require('../../utils/supabase');
const config = require('../../utils/config');
const { sendRenewalReminder, sendPaymentFailedEmail } = require('../../utils/email-service');

// Initialize PostHog for analytics if available
let posthog = null;
try {
  if (config.posthog?.apiKey) {
    const PostHog = require('posthog-node');
    posthog = new PostHog.PostHog(config.posthog.apiKey, {
      host: config.posthog.host || 'https://app.posthog.com',
    });
  }
} catch (error) {
  console.warn('PostHog not available for analytics:', error.message);
}

/**
 * Track event in PostHog analytics
 */
async function trackAnalytics(userId, event, properties = {}) {
  if (!posthog) {
    console.warn('PostHog not configured - analytics not tracked');
    return;
  }

  try {
    posthog.capture({
      distinctId: userId,
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error tracking analytics:', error);
    // Don't throw - analytics failure shouldn't block webhook
  }
}

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
        await handleSubscriptionUpdated(event.data.object);
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
  const { error: subscriptionError } = await supabaseAdmin
    .from('subscriptions')
    .upsert({
      user_id: finalUserId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      tier: tier || 'basic',
      status: 'active',
      source,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    });

  if (subscriptionError) {
    console.error('Error creating subscription record:', subscriptionError);
  }

  // Update user tier if we have a user ID
  if (finalUserId) {
    await supabaseAdmin
      .from('users')
      .update({ tier: tier || 'basic' })
      .eq('id', finalUserId);

    // Track subscription success in analytics
    await trackAnalytics(finalUserId, 'payment_success', {
      tier: tier || 'basic',
      amount: (session.amount_total || 0) / 100,
      currency: session.currency || 'usd',
      source,
    });

    // Track subscription activation
    await trackAnalytics(finalUserId, 'subscription_activated', {
      tier: tier || 'basic',
      source,
    });
  }

  console.log(`Subscription created for user ${finalUserId}:`, {
    subscriptionId,
    tier: tier || 'basic',
    source,
  });
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription) {
  console.log('Subscription created:', subscription.id);
  // Additional logic if needed
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription) {
  const subscriptionRecord = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, tier')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (subscriptionRecord?.data?.user_id) {
    // Track subscription update
    await trackAnalytics(subscriptionRecord.data.user_id, 'subscription_updated', {
      status: subscription.status,
      tier: subscriptionRecord.data.tier,
    });
  }

  // Update subscription status
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription) {
  const subscriptionRecord = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (subscriptionRecord?.data?.user_id) {
    // Track subscription cancellation
    await trackAnalytics(subscriptionRecord.data.user_id, 'subscription_canceled', {
      subscription_id: subscription.id,
    });
  }

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
async function handleInvoicePaid(invoice) {
  const subscriptionRecord = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, tier')
    .eq('stripe_subscription_id', invoice.subscription)
    .single();

  if (subscriptionRecord?.data?.user_id) {
    // Track invoice payment
    await trackAnalytics(subscriptionRecord.data.user_id, 'invoice_paid', {
      invoice_id: invoice.id,
      amount: (invoice.amount_paid || 0) / 100,
      currency: invoice.currency || 'usd',
      tier: subscriptionRecord.data.tier,
    });
  }

  console.log(`Invoice paid: ${invoice.id}`);
}

/**
 * Handle payment failed
 */
async function handlePaymentFailed(invoice) {
  const subscriptionRecord = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, tier')
    .eq('stripe_subscription_id', invoice.subscription)
    .single();

  if (subscriptionRecord?.data?.user_id) {
    // Track payment failure
    await trackAnalytics(subscriptionRecord.data.user_id, 'payment_failed', {
      invoice_id: invoice.id,
      amount: (invoice.amount_due || 0) / 100,
      currency: invoice.currency || 'usd',
      tier: subscriptionRecord.data.tier,
      reason: invoice.last_payment_error?.message || 'Unknown',
    });

    // Send payment failure email notification (already implemented)
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', subscriptionRecord.data.user_id)
      .single();

    if (user?.email) {
      const { sendPaymentFailedEmail } = require('../../utils/email-service');
      await sendPaymentFailedEmail(user.email, {
        tier: subscriptionRecord.data.tier,
      }).catch(error => console.error('Error sending payment failed email:', error));
    }
  }

  console.log(`Payment failed: ${invoice.id}`);
}

