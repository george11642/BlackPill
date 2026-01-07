/**
 * Webhooks Edge Function - Consolidated webhook handlers
 *
 * Providers (via query param ?provider=):
 * - stripe: Handle Stripe webhook events
 * - revenuecat: Handle RevenueCat webhook events
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.5.0";
import {
  handleCors,
  getRequestId,
  createResponseWithId,
  createErrorResponse,
  getSupabaseAdmin,
  sendEmail,
} from "../_shared/index.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCors();
  }

  const requestId = getRequestId(req);
  const url = new URL(req.url);
  const provider = url.searchParams.get("provider");

  try {
    const supabaseAdmin = getSupabaseAdmin();

    switch (provider) {
      case "stripe":
        return await handleStripeWebhook(req, supabaseAdmin, requestId);
      case "revenuecat":
        return await handleRevenueCatWebhook(req, supabaseAdmin, requestId);
      default:
        return createErrorResponse(
          "Invalid provider. Use: stripe, revenuecat",
          400,
          requestId
        );
    }
  } catch (error) {
    console.error("[webhooks] Error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500,
      requestId
    );
  }
});

// ============ STRIPE WEBHOOK ============
async function handleStripeWebhook(
  req: Request,
  supabaseAdmin: any,
  requestId: string
) {
  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405, requestId);
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return createErrorResponse("Missing stripe-signature header", 400, requestId);
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    }
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe webhook] Signature verification failed:", err);
    return createErrorResponse(
      `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`,
      400,
      requestId
    );
  }

  console.log(`[stripe webhook] Processing: ${event.type}, ID: ${event.id}`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleStripeCheckout(
          event.data.object as Stripe.Checkout.Session,
          supabaseAdmin
        );
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleStripeSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
          supabaseAdmin
        );
        break;

      case "customer.subscription.deleted":
        await handleStripeSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
          supabaseAdmin
        );
        break;

      case "invoice.paid":
        await handleStripeInvoicePaid(
          event.data.object as Stripe.Invoice,
          supabaseAdmin
        );
        break;

      case "invoice.payment_failed":
        await handleStripePaymentFailed(
          event.data.object as Stripe.Invoice,
          supabaseAdmin
        );
        break;

      default:
        console.log(`[stripe webhook] Unhandled event: ${event.type}`);
    }

    return createResponseWithId({ received: true }, 200, requestId);
  } catch (error) {
    console.error(`[stripe webhook] Error processing ${event.id}:`, error);
    throw error;
  }
}

async function handleStripeCheckout(
  session: Stripe.Checkout.Session,
  supabaseAdmin: any
) {
  const source = session.metadata?.source || "web";
  const userId = session.metadata?.user_id;
  const tier = session.metadata?.tier || "basic";
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!customerId || !subscriptionId) {
    console.error("[stripe] Missing customer or subscription ID");
    return;
  }

  const customer = await stripe.customers.retrieve(customerId);
  const customerEmail =
    typeof customer === "object" && !(customer as any).deleted
      ? (customer as any).email
      : null;

  if (!customerEmail) {
    console.error("[stripe] No email for customer:", customerId);
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  let finalUserId = userId || null;

  // Find or create user by email
  if (!finalUserId && customerEmail) {
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", customerEmail)
      .single();

    if (existingUser) {
      finalUserId = existingUser.id;
    } else {
      const { data: newUser, error } = await supabaseAdmin
        .from("users")
        .insert({ email: customerEmail, tier: "free", scans_remaining: 0 })
        .select("id")
        .single();
      if (newUser && !error) finalUserId = newUser.id;
    }
  }

  // Get referrer
  let referredByUserId: string | null = null;
  if (finalUserId) {
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("referred_by")
      .eq("id", finalUserId)
      .single();
    referredByUserId = user?.referred_by || null;
  }

  // Create subscription record
  await supabaseAdmin.from("subscriptions").upsert({
    user_id: finalUserId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    tier,
    status: "active",
    source,
    referred_by_user_id: referredByUserId,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    payment_provider: "stripe",
    revenuecat_subscription_id: `stripe_${subscriptionId}`,
    revenuecat_customer_id: finalUserId || customerId,
  });

  // Update user tier
  if (finalUserId) {
    const scansForTier = tier === "elite" ? 999999 : tier === "pro" ? 30 : 5;
    await supabaseAdmin
      .from("users")
      .update({ tier, scans_remaining: scansForTier })
      .eq("id", finalUserId);

    // Auto-create affiliate
    await createAffiliateIfNeeded(supabaseAdmin, finalUserId);
  }

  console.log(`[stripe] Subscription created for user ${finalUserId}`);
}

async function handleStripeSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabaseAdmin: any
) {
  const { data: subRecord } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id, tier, revenuecat_subscription_id, revenuecat_customer_id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  const updateData: any = {
    status: subscription.status,
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  };

  if (!subRecord?.revenuecat_subscription_id) {
    updateData.revenuecat_subscription_id = `stripe_${subscription.id}`;
  }
  if (!subRecord?.revenuecat_customer_id && subRecord?.user_id) {
    updateData.revenuecat_customer_id = subRecord.user_id;
  }

  await supabaseAdmin
    .from("subscriptions")
    .update(updateData)
    .eq("stripe_subscription_id", subscription.id);
}

async function handleStripeSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabaseAdmin: any
) {
  await supabaseAdmin
    .from("subscriptions")
    .update({ status: "canceled", canceled_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id);
}

async function handleStripeInvoicePaid(
  invoice: Stripe.Invoice,
  supabaseAdmin: any
) {
  const subscriptionId = invoice.subscription as string;
  const { data: subRecord } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id, tier, referred_by_user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (subRecord?.user_id && invoice.amount_paid && invoice.amount_paid > 0) {
    const amount = invoice.amount_paid / 100;
    let referrerUserId = subRecord.referred_by_user_id;

    if (!referrerUserId) {
      const { data: user } = await supabaseAdmin
        .from("users")
        .select("referred_by")
        .eq("id", subRecord.user_id)
        .single();
      referrerUserId = user?.referred_by || null;
    }

    // Calculate commission if referrer exists
    if (referrerUserId) {
      await calculateCommission(supabaseAdmin, subscriptionId, amount, subRecord.user_id, referrerUserId);
    }
  }

  console.log(`[stripe] Invoice paid: ${invoice.id}`);
}

async function handleStripePaymentFailed(
  invoice: Stripe.Invoice,
  supabaseAdmin: any
) {
  const subscriptionId = invoice.subscription as string;
  const { data: subRecord } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id, tier")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (subRecord?.user_id) {
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("id", subRecord.user_id)
      .single();

    if (user?.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: "Payment Failed - Action Required",
          html: `<p>Your payment for BlackPill ${subRecord.tier} subscription failed. Please update your payment method.</p>`,
        });
      } catch (e) {
        console.error("[stripe] Failed to send payment failed email:", e);
      }
    }
  }

  console.log(`[stripe] Payment failed: ${invoice.id}`);
}

// ============ REVENUECAT WEBHOOK ============
type RevenueCatEvent = {
  event: {
    id: string;
    type: string;
    app_user_id: string;
    product_id: string;
    purchased_at_ms: number;
    expiration_at_ms: number | null;
    environment: string;
    entitlement_ids: string[];
    transaction_id: string;
    price?: number;
    price_in_purchased_currency?: number;
    subscriber_attributes?: Record<string, any>;
  };
};

async function handleRevenueCatWebhook(
  req: Request,
  supabaseAdmin: any,
  requestId: string
) {
  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405, requestId);
  }

  const expectedToken = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
  if (!expectedToken) {
    return createErrorResponse("Webhook not configured", 500, requestId);
  }

  let body: RevenueCatEvent;
  try {
    body = await req.json();
  } catch {
    return createErrorResponse("Invalid request body", 400, requestId);
  }

  const event = body.event;
  const isTestEvent = event.type === "TEST";
  const isProductChangeEvent = event.type === "PRODUCT_CHANGE";
  const isSandboxEvent = event.environment === "SANDBOX";

  // Check authorization for production events
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  let token: string | null = null;

  if (authHeader) {
    token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
  }

  // Allow test/sandbox events without auth
  if (!(isSandboxEvent || isTestEvent || isProductChangeEvent)) {
    if (!token) {
      return createErrorResponse("Missing Authorization header", 401, requestId);
    }
    if (token !== expectedToken) {
      return createErrorResponse("Invalid authorization token", 401, requestId);
    }
  }

  console.log(`[revenuecat webhook] Processing: ${event.type}, user: ${event.app_user_id}`);

  // Skip TEST and PRODUCT_CHANGE events
  if (isTestEvent || isProductChangeEvent) {
    return createResponseWithId({ received: true, message: `${event.type} acknowledged` }, 200, requestId);
  }

  try {
    const appUserId = event.app_user_id;
    const entitlementIds = event.entitlement_ids || [];

    // Determine tier
    let tier: "pro" | "elite" | null = null;
    if (
      entitlementIds.includes("elite") ||
      entitlementIds.includes("BlackPill Elite") ||
      entitlementIds.includes("BlackPill_Elite")
    ) {
      tier = "elite";
    } else if (entitlementIds.includes("BlackPill Pro") || entitlementIds.includes("pro")) {
      tier = "pro";
    }

    if (!tier) {
      console.log(`[revenuecat] No valid entitlement for ${event.type}`);
      return createResponseWithId({ received: true }, 200, requestId);
    }

    // Find user
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("id, email, username, referred_by")
      .eq("id", appUserId)
      .single();

    if (!userData) {
      return createErrorResponse("User not found", 404, requestId);
    }

    const userId = userData.id;
    const referredByUserId = userData.referred_by || null;

    switch (event.type) {
      case "INITIAL_PURCHASE": {
        const expirationDate = event.expiration_at_ms
          ? new Date(event.expiration_at_ms).toISOString()
          : null;
        const purchaseDate = new Date(event.purchased_at_ms).toISOString();
        const subscriptionPrice = event.price ? event.price / 100 : tier === "pro" ? 12.99 : 19.99;

        // Check existing subscription
        const { data: existingSub } = await supabaseAdmin
          .from("subscriptions")
          .select("id")
          .eq("user_id", userId)
          .eq("payment_provider", "revenuecat")
          .single();

        if (existingSub) {
          await supabaseAdmin
            .from("subscriptions")
            .update({
              tier,
              status: "active",
              revenuecat_subscription_id: event.transaction_id,
              revenuecat_customer_id: appUserId,
              current_period_start: purchaseDate,
              current_period_end: expirationDate,
              cancel_at_period_end: false,
            })
            .eq("id", existingSub.id);
        } else {
          await supabaseAdmin.from("subscriptions").insert({
            user_id: userId,
            tier,
            status: "active",
            revenuecat_subscription_id: event.transaction_id,
            revenuecat_customer_id: appUserId,
            payment_provider: "revenuecat",
            referred_by_user_id: referredByUserId,
            current_period_start: purchaseDate,
            current_period_end: expirationDate,
            cancel_at_period_end: false,
          });
        }

        // Update user tier
        const scansForTier = tier === "elite" ? 999999 : 30;
        await supabaseAdmin
          .from("users")
          .update({ tier, scans_remaining: scansForTier })
          .eq("id", userId);

        // Calculate commission
        if (referredByUserId && subscriptionPrice > 0) {
          await calculateCommission(supabaseAdmin, event.transaction_id, subscriptionPrice, userId, referredByUserId);
        }

        // Create affiliate
        await createAffiliateIfNeeded(supabaseAdmin, userId);
        break;
      }

      case "RENEWAL": {
        const expirationDate = event.expiration_at_ms
          ? new Date(event.expiration_at_ms).toISOString()
          : null;
        const purchaseDate = new Date(event.purchased_at_ms).toISOString();

        const { data: subRecord } = await supabaseAdmin
          .from("subscriptions")
          .select("tier, referred_by_user_id")
          .eq("revenuecat_customer_id", appUserId)
          .eq("payment_provider", "revenuecat")
          .single();

        const subscriptionPrice = event.price
          ? event.price / 100
          : subRecord?.tier === "pro" ? 12.99 : 19.99;

        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "active",
            current_period_start: purchaseDate,
            current_period_end: expirationDate,
            cancel_at_period_end: false,
          })
          .eq("revenuecat_customer_id", appUserId)
          .eq("payment_provider", "revenuecat");

        // Refresh scans
        const renewalTier = subRecord?.tier || tier;
        const renewalScans = renewalTier === "elite" ? 999999 : 30;
        await supabaseAdmin
          .from("users")
          .update({ tier: renewalTier, scans_remaining: renewalScans })
          .eq("id", userId);

        // Calculate commission
        const referrerUserId = subRecord?.referred_by_user_id || referredByUserId;
        if (referrerUserId && subscriptionPrice > 0) {
          await calculateCommission(supabaseAdmin, event.transaction_id, subscriptionPrice, userId, referrerUserId);
        }
        break;
      }

      case "CANCELLATION":
        await supabaseAdmin
          .from("subscriptions")
          .update({ cancel_at_period_end: true })
          .eq("revenuecat_customer_id", appUserId)
          .eq("payment_provider", "revenuecat");
        break;

      case "UNCANCELLATION": {
        const expirationDate = event.expiration_at_ms
          ? new Date(event.expiration_at_ms).toISOString()
          : null;
        const purchaseDate = new Date(event.purchased_at_ms).toISOString();

        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "active",
            current_period_start: purchaseDate,
            current_period_end: expirationDate,
            cancel_at_period_end: false,
          })
          .eq("revenuecat_customer_id", appUserId)
          .eq("payment_provider", "revenuecat");
        break;
      }

      case "BILLING_ISSUE":
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "past_due" })
          .eq("revenuecat_customer_id", appUserId)
          .eq("payment_provider", "revenuecat");
        break;

      case "EXPIRATION":
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "canceled" })
          .eq("revenuecat_customer_id", appUserId)
          .eq("payment_provider", "revenuecat");

        // Reset to free
        await supabaseAdmin
          .from("users")
          .update({ tier: "free", scans_remaining: 1 })
          .eq("id", userId);
        break;

      default:
        console.log(`[revenuecat] Unhandled event: ${event.type}`);
    }

    return createResponseWithId({ received: true }, 200, requestId);
  } catch (error) {
    console.error(`[revenuecat webhook] Error:`, error);
    throw error;
  }
}

// ============ HELPERS ============
async function createAffiliateIfNeeded(supabaseAdmin: any, userId: string) {
  try {
    const { data: existing } = await supabaseAdmin
      .from("affiliates")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existing) return;

    // Generate unique code
    let referralCode = "";
    let isUnique = false;
    while (!isUnique) {
      referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const { data: check } = await supabaseAdmin
        .from("affiliates")
        .select("id")
        .eq("referral_code", referralCode)
        .single();
      isUnique = !check;
    }

    await supabaseAdmin.from("affiliates").insert({
      user_id: userId,
      referral_code: referralCode,
      tier: "base",
      commission_rate: 20.0,
      is_active: true,
    });

    console.log(`[webhooks] Created affiliate for user ${userId}`);
  } catch (error) {
    console.error("[webhooks] Error creating affiliate:", error);
  }
}

async function calculateCommission(
  supabaseAdmin: any,
  subscriptionId: string,
  amount: number,
  referredUserId: string,
  referrerUserId: string
) {
  try {
    // Get affiliate info for referrer
    const { data: affiliate } = await supabaseAdmin
      .from("affiliates")
      .select("id, commission_rate")
      .eq("user_id", referrerUserId)
      .eq("is_active", true)
      .single();

    if (!affiliate) return;

    const commissionRate = affiliate.commission_rate || 20;
    const commissionAmount = (amount * commissionRate) / 100;

    // Create commission record
    await supabaseAdmin.from("commissions").insert({
      affiliate_id: affiliate.id,
      subscription_id: subscriptionId,
      referred_user_id: referredUserId,
      amount: commissionAmount,
      rate: commissionRate,
      status: "pending",
    });

    console.log(`[webhooks] Created commission: $${commissionAmount} for affiliate ${affiliate.id}`);
  } catch (error) {
    console.error("[webhooks] Error calculating commission:", error);
  }
}
