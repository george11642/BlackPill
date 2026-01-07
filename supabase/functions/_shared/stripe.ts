/**
 * Stripe utilities for Edge Functions
 */

import Stripe from "https://esm.sh/stripe@17.0.0";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;

  const secretKey = Deno.env.get("STRIPE_SECRET_KEY");

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }

  _stripe = new Stripe(secretKey, {
    apiVersion: "2024-11-20.acacia",
    httpClient: Stripe.createFetchHttpClient(),
  });

  return _stripe;
}

/**
 * Verify Stripe webhook signature
 */
export async function verifyStripeWebhook(
  req: Request
): Promise<{ event: Stripe.Event | null; error: string | null }> {
  const stripe = getStripe();
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!webhookSecret) {
    return { event: null, error: "Webhook secret not configured" };
  }

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return { event: null, error: "Missing stripe-signature header" };
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    return { event, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Stripe] Webhook verification failed:", message);
    return { event: null, error: `Webhook verification failed: ${message}` };
  }
}

/**
 * Create checkout session for subscription
 */
export async function createCheckoutSession(
  userId: string,
  email: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();

  return stripe.checkout.sessions.create({
    customer_email: email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      user_id: userId,
    },
    subscription_data: {
      metadata: {
        user_id: userId,
      },
    },
  });
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  return stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Get subscription details
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  return stripe.subscriptions.retrieve(subscriptionId);
}
