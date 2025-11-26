import { Request } from 'next/server';
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
// Disable body parsing for webhook route
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
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
    console.error('Webhook signature verification failed:', err);
    return createResponseWithId(
      { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 400 },
      requestId
    );
  }

  // Handle the event
  try {
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
        console.log(`Unhandled event type: ${event.type}`);
    }

    return createResponseWithId({ received: true }, { status: 200 }, requestId);
  } catch (error) {
    console.error('Webhook handler error:', error);
    return handleApiError(error, request);
  }
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const source = session.metadata?.source || 'web';
  const userId = session.metadata?.user_id;
  const tier = session.metadata?.tier || 'basic';
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!customerId || !subscriptionId) {
    console.error('Missing customer or subscription ID in checkout session');
    return;
  }

  // Get customer email from Stripe
  const customer = await stripe.customers.retrieve(customerId);
  const customerEmail = typeof customer === 'object' && !customer.deleted ? customer.email : null;

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
      .update({ tier: tier })
      .eq('id', finalUserId);
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
    .select('user_id, tier')
    .eq('stripe_subscription_id', subscription.id)
    .single();

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
    .select('user_id, tier')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .single();

  console.log(`Invoice paid: ${invoice.id}`);
}

/**
 * Handle payment failed
 */
async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const { data: subscriptionRecord } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, tier')
    .eq('stripe_subscription_id', invoice.subscription as string)
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

