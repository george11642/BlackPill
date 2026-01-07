/**
 * Stripe Edge Function - Handle Stripe operations for web
 *
 * Actions (via query param ?action=):
 * - create-checkout: Create Stripe checkout session
 * - cancel: Cancel subscription at period end
 * - status: Get subscription status
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import {
  handleCors,
  getAuthUser,
  getRequestId,
  createResponseWithId,
  createErrorResponse,
  getSupabaseAdmin,
} from "../_shared/index.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const APP_URL = Deno.env.get("APP_URL") || "https://black-pill.app";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCors();
  }

  const requestId = getRequestId(req);
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    const supabaseAdmin = getSupabaseAdmin();

    switch (action) {
      case "create-checkout":
        return await handleCreateCheckout(req, supabaseAdmin, requestId);
      case "cancel":
        return await handleCancel(req, supabaseAdmin, requestId);
      case "status":
        return await handleStatus(req, supabaseAdmin, requestId);
      default:
        return createErrorResponse(
          "Invalid action. Use: create-checkout, cancel, status",
          400,
          requestId
        );
    }
  } catch (error) {
    console.error("[stripe] Error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500,
      requestId
    );
  }
});

// ============ CREATE CHECKOUT ============
async function handleCreateCheckout(
  req: Request,
  supabaseAdmin: any,
  requestId: string
) {
  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405, requestId);
  }

  // Try to get authenticated user (optional for this endpoint)
  let user: { id: string; email?: string } | null = null;
  try {
    const { user: authUser, error } = await getAuthUser(req);
    if (!error && authUser) {
      user = authUser;
    }
  } catch {
    // Not authenticated - that's okay for web flow
  }

  const body = await req.json();
  const { tier, interval, coupon_code, email, source, user_id, affiliateReferralCode } = body;

  // Validate tier
  const validTiers = ["pro", "elite"];
  if (!validTiers.includes(tier)) {
    return createErrorResponse("Invalid tier. Must be: pro, elite", 400, requestId);
  }

  // Validate interval
  if (!["monthly", "annual"].includes(interval)) {
    return createErrorResponse("Invalid interval. Must be: monthly, annual", 400, requestId);
  }

  const isAuthenticated = !!user;
  const checkoutSource = source || (isAuthenticated ? "app" : "web");

  let customerId: string | undefined;
  let finalUserId = user_id;
  let finalEmail = email;

  if (isAuthenticated && user) {
    finalUserId = user.id;
    finalEmail = user.email || email;

    // Get or create Stripe customer
    const { data: existingUser } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", finalUserId)
      .single();

    if (existingUser?.stripe_customer_id) {
      customerId = existingUser.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: finalEmail,
        metadata: { user_id: finalUserId },
      });
      customerId = customer.id;
    }
  }

  // Define price IDs
  const priceMap: Record<string, string | undefined> = {
    "pro-monthly": Deno.env.get("STRIPE_PRICE_PRO_MONTHLY"),
    "pro-annual": Deno.env.get("STRIPE_PRICE_PRO_ANNUAL"),
    "elite-monthly": Deno.env.get("STRIPE_PRICE_ELITE_MONTHLY"),
    "elite-annual": Deno.env.get("STRIPE_PRICE_ELITE_ANNUAL"),
  };

  const priceId = priceMap[`${tier}-${interval}`];

  if (!priceId) {
    return createErrorResponse("Price not configured for this tier", 400, requestId);
  }

  const successUrl =
    checkoutSource === "app"
      ? `${APP_URL}/success?session_id={CHECKOUT_SESSION_ID}&source=app`
      : `${APP_URL}/success?session_id={CHECKOUT_SESSION_ID}&source=web`;

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: `${APP_URL}/cancel`,
    metadata: {
      tier,
      source: checkoutSource,
      ...(finalUserId && { user_id: finalUserId }),
      ...(affiliateReferralCode && { affiliate_referral_code: affiliateReferralCode }),
    },
  };

  if (customerId) {
    sessionParams.customer = customerId;
  } else if (finalEmail) {
    sessionParams.customer_email = finalEmail;
  }

  if (coupon_code) {
    sessionParams.discounts = [{ coupon: coupon_code }];
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return createResponseWithId(
    {
      session_id: session.id,
      checkout_url: session.url,
    },
    200,
    requestId
  );
}

// ============ CANCEL SUBSCRIPTION ============
async function handleCancel(
  req: Request,
  supabaseAdmin: any,
  requestId: string
) {
  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405, requestId);
  }

  const { user, error: authError } = await getAuthUser(req);
  if (authError || !user) {
    return createErrorResponse(authError || "Authentication required", 401, requestId);
  }

  const { data: subscription, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !subscription) {
    return createErrorResponse("No active subscription found", 404, requestId);
  }

  if (!subscription.stripe_subscription_id) {
    return createErrorResponse("Invalid subscription", 400, requestId);
  }

  const updatedSubscription = await stripe.subscriptions.update(
    subscription.stripe_subscription_id,
    { cancel_at_period_end: true }
  );

  await supabaseAdmin
    .from("subscriptions")
    .update({ canceled_at: new Date().toISOString() })
    .eq("id", subscription.id);

  return createResponseWithId(
    {
      success: true,
      effective_date: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
    },
    200,
    requestId
  );
}

// ============ GET STATUS ============
async function handleStatus(
  req: Request,
  supabaseAdmin: any,
  requestId: string
) {
  if (req.method !== "GET") {
    return createErrorResponse("Method not allowed", 405, requestId);
  }

  const { user, error: authError } = await getAuthUser(req);
  if (authError || !user) {
    return createErrorResponse(authError || "Authentication required", 401, requestId);
  }

  const { data: subscription, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !subscription) {
    return createResponseWithId(
      {
        status: "none",
        tier: "free",
        has_subscription: false,
      },
      200,
      requestId
    );
  }

  return createResponseWithId(
    {
      status: subscription.status,
      tier: subscription.tier,
      has_subscription: true,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      payment_provider: subscription.payment_provider,
    },
    200,
    requestId
  );
}
