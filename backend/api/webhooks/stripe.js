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
 */
async function handleCheckoutCompleted(session) {
  const userId = session.metadata.user_id;
  const tier = session.metadata.tier;
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Create or update subscription record
  await supabaseAdmin
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      tier,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    });

  // Update user tier and scans
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
    .eq('id', userId);
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

