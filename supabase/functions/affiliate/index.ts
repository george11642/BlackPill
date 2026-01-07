/**
 * Affiliate Edge Function - Handle affiliate, referral, commission, and creator operations
 *
 * Actions (via query param ?action=):
 * - generate-code: Generate unique referral code
 * - referral-click: Track referral link click
 * - referral-stats: Get referral statistics
 * - referral-accept: Accept referral invite
 * - referral-apply: Apply referral code
 * - referral-redeem: Redeem referral rewards
 * - calculate-commission: Calculate commission for payment
 * - creator-apply: Apply to become a creator
 * - creator-dashboard: Get creator dashboard data
 * - creator-performance: Get creator performance metrics
 * - creator-coupons: Manage creator coupons
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  handleCors,
  getAuthUser,
  getRequestId,
  createResponseWithId,
  createErrorResponse,
  getSupabaseAdmin,
  sendEmail,
} from "../_shared/index.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCors();
  }

  const requestId = getRequestId(req);
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Some actions don't require auth
    const noAuthActions = ["generate-code", "referral-click"];

    if (noAuthActions.includes(action || "")) {
      switch (action) {
        case "generate-code":
          return await handleGenerateCode(supabaseAdmin, requestId);
        case "referral-click":
          return await handleReferralClick(req, supabaseAdmin, requestId);
      }
    }

    // All other actions require auth
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return createErrorResponse(authError || "Authentication required", 401, requestId);
    }

    switch (action) {
      case "referral-stats":
        return await handleReferralStats(user, supabaseAdmin, requestId);
      case "referral-accept":
        return await handleReferralAccept(req, user, supabaseAdmin, requestId);
      case "referral-apply":
        return await handleReferralApply(req, user, supabaseAdmin, requestId);
      case "referral-redeem":
        return await handleReferralRedeem(req, user, supabaseAdmin, requestId);
      case "calculate-commission":
        return await handleCalculateCommission(req, user, supabaseAdmin, requestId);
      case "creator-apply":
        return await handleCreatorApply(req, user, supabaseAdmin, requestId);
      case "creator-dashboard":
        return await handleCreatorDashboard(user, supabaseAdmin, requestId);
      case "creator-performance":
        return await handleCreatorPerformance(user, supabaseAdmin, requestId);
      case "creator-coupons":
        return await handleCreatorCoupons(req, user, supabaseAdmin, requestId);
      default:
        return createErrorResponse(
          "Invalid action. Use: generate-code, referral-click, referral-stats, referral-accept, referral-apply, referral-redeem, calculate-commission, creator-apply, creator-dashboard, creator-performance, creator-coupons",
          400,
          requestId
        );
    }
  } catch (error) {
    console.error("[affiliate] Error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500,
      requestId
    );
  }
});

// ============ GENERATE REFERRAL CODE ============
async function handleGenerateCode(supabaseAdmin: any, requestId: string) {
  let referralCode = "";
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const { data: existing } = await supabaseAdmin
      .from("affiliates")
      .select("id")
      .eq("referral_code", referralCode)
      .single();

    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    return createErrorResponse("Failed to generate unique referral code", 500, requestId);
  }

  return createResponseWithId({ code: referralCode }, 200, requestId);
}

// ============ TRACK REFERRAL CLICK ============
async function handleReferralClick(
  req: Request,
  supabaseAdmin: any,
  requestId: string
) {
  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405, requestId);
  }

  const body = await req.json();
  const { referral_code, source, landing_page } = body;

  if (!referral_code) {
    return createErrorResponse("Missing referral_code", 400, requestId);
  }

  // Find affiliate by referral code
  const { data: affiliate } = await supabaseAdmin
    .from("affiliates")
    .select("id, user_id")
    .eq("referral_code", referral_code.toUpperCase())
    .single();

  if (!affiliate) {
    return createErrorResponse("Invalid referral code", 404, requestId);
  }

  // Record click
  await supabaseAdmin.from("affiliate_clicks").insert({
    affiliate_id: affiliate.id,
    source: source || "direct",
    landing_page: landing_page || "/",
    ip_hash: null, // Could hash IP for fraud detection
  });

  return createResponseWithId({ tracked: true }, 200, requestId);
}

// ============ REFERRAL STATS ============
async function handleReferralStats(
  user: any,
  supabaseAdmin: any,
  requestId: string
) {
  const { data: affiliate } = await supabaseAdmin
    .from("affiliates")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!affiliate) {
    return createResponseWithId(
      {
        is_affiliate: false,
        referral_code: null,
        stats: null,
      },
      200,
      requestId
    );
  }

  // Get referral counts
  const { count: totalReferrals } = await supabaseAdmin
    .from("affiliate_referrals")
    .select("*", { count: "exact", head: true })
    .eq("affiliate_id", affiliate.id);

  const { count: convertedReferrals } = await supabaseAdmin
    .from("affiliate_referrals")
    .select("*", { count: "exact", head: true })
    .eq("affiliate_id", affiliate.id)
    .eq("is_converted", true);

  // Get total earnings
  const { data: commissions } = await supabaseAdmin
    .from("commissions")
    .select("amount, status")
    .eq("affiliate_id", affiliate.id);

  const totalEarnings = commissions?.reduce((sum: number, c: any) => sum + parseFloat(c.amount || 0), 0) || 0;
  const pendingEarnings = commissions?.filter((c: any) => c.status === "pending")
    .reduce((sum: number, c: any) => sum + parseFloat(c.amount || 0), 0) || 0;

  return createResponseWithId(
    {
      is_affiliate: true,
      referral_code: affiliate.referral_code,
      referral_link: `https://black-pill.app?ref=${affiliate.referral_code}`,
      tier: affiliate.tier,
      commission_rate: affiliate.commission_rate,
      stats: {
        total_referrals: totalReferrals || 0,
        converted_referrals: convertedReferrals || 0,
        total_earnings: totalEarnings.toFixed(2),
        pending_earnings: pendingEarnings.toFixed(2),
      },
    },
    200,
    requestId
  );
}

// ============ REFERRAL ACCEPT ============
async function handleReferralAccept(
  req: Request,
  user: any,
  supabaseAdmin: any,
  requestId: string
) {
  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405, requestId);
  }

  const body = await req.json();
  const { referral_code } = body;

  if (!referral_code) {
    return createErrorResponse("Missing referral_code", 400, requestId);
  }

  // Find affiliate
  const { data: affiliate } = await supabaseAdmin
    .from("affiliates")
    .select("id, user_id")
    .eq("referral_code", referral_code.toUpperCase())
    .single();

  if (!affiliate) {
    return createErrorResponse("Invalid referral code", 404, requestId);
  }

  // Can't refer yourself
  if (affiliate.user_id === user.id) {
    return createErrorResponse("Cannot use your own referral code", 400, requestId);
  }

  // Check if user already has a referrer
  const { data: existingUser } = await supabaseAdmin
    .from("users")
    .select("referred_by")
    .eq("id", user.id)
    .single();

  if (existingUser?.referred_by) {
    return createErrorResponse("Already have a referrer", 400, requestId);
  }

  // Set referrer
  await supabaseAdmin
    .from("users")
    .update({ referred_by: affiliate.user_id })
    .eq("id", user.id);

  // Create referral record
  await supabaseAdmin.from("affiliate_referrals").insert({
    affiliate_id: affiliate.id,
    referred_user_id: user.id,
    is_converted: false,
  });

  return createResponseWithId({ accepted: true }, 200, requestId);
}

// ============ REFERRAL APPLY ============
async function handleReferralApply(
  req: Request,
  user: any,
  supabaseAdmin: any,
  requestId: string
) {
  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405, requestId);
  }

  const body = await req.json();
  const { referral_code } = body;

  if (!referral_code) {
    return createErrorResponse("Missing referral_code", 400, requestId);
  }

  // Same logic as accept
  return handleReferralAccept(req, user, supabaseAdmin, requestId);
}

// ============ REFERRAL REDEEM ============
async function handleReferralRedeem(
  req: Request,
  user: any,
  supabaseAdmin: any,
  requestId: string
) {
  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405, requestId);
  }

  // Get affiliate record
  const { data: affiliate } = await supabaseAdmin
    .from("affiliates")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!affiliate) {
    return createErrorResponse("Not an affiliate", 404, requestId);
  }

  // Get pending commissions
  const { data: pendingCommissions } = await supabaseAdmin
    .from("commissions")
    .select("id, amount")
    .eq("affiliate_id", affiliate.id)
    .eq("status", "pending");

  if (!pendingCommissions || pendingCommissions.length === 0) {
    return createErrorResponse("No pending commissions to redeem", 400, requestId);
  }

  const totalAmount = pendingCommissions.reduce(
    (sum: number, c: any) => sum + parseFloat(c.amount || 0),
    0
  );

  // Mark commissions as redeemed (actual payout handled separately)
  const commissionIds = pendingCommissions.map((c: any) => c.id);
  await supabaseAdmin
    .from("commissions")
    .update({ status: "processing" })
    .in("id", commissionIds);

  return createResponseWithId(
    {
      redeemed: true,
      amount: totalAmount.toFixed(2),
      commissions_count: commissionIds.length,
    },
    200,
    requestId
  );
}

// ============ CALCULATE COMMISSION ============
// This endpoint should only be called by internal webhooks or admins
async function handleCalculateCommission(
  req: Request,
  user: any,
  supabaseAdmin: any,
  requestId: string
) {
  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405, requestId);
  }

  // Authorization: Only admins or service role can calculate commissions
  // Check if user is admin
  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  // Also check for internal service call via special header
  const isInternalCall = req.headers.get("x-internal-webhook") === Deno.env.get("CRON_SECRET");

  if (!profile?.is_admin && !isInternalCall) {
    return createErrorResponse("Forbidden - Admin or internal webhook access required", 403, requestId);
  }

  const body = await req.json();
  const { subscriptionId, amount, referred_user_id, referrer_user_id } = body;

  if (!subscriptionId || amount === undefined) {
    return createErrorResponse("Missing subscriptionId or amount", 400, requestId);
  }

  // Find subscription - check Stripe first, then RevenueCat
  // Using separate queries to avoid filter injection via string interpolation
  let subscription = null;

  const { data: stripeMatch } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id, stripe_subscription_id, revenuecat_subscription_id, referred_by_user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (stripeMatch) {
    subscription = stripeMatch;
  } else {
    const { data: rcMatch } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id, stripe_subscription_id, revenuecat_subscription_id, referred_by_user_id")
      .eq("revenuecat_subscription_id", subscriptionId)
      .maybeSingle();
    subscription = rcMatch;
  }

  if (!subscription?.user_id) {
    return createResponseWithId(
      { success: true, message: "Subscription not found or no user assigned" },
      200,
      requestId
    );
  }

  // Get referrer
  let referrerUserId: string | null = referrer_user_id || subscription.referred_by_user_id || null;

  if (!referrerUserId) {
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("referred_by")
      .eq("id", subscription.user_id)
      .single();

    referrerUserId = user?.referred_by || null;
  }

  if (!referrerUserId) {
    return createResponseWithId(
      { success: true, message: "No referrer found for this subscription" },
      200,
      requestId
    );
  }

  // Check if referrer has active subscription
  const { data: referrerSubscription } = await supabaseAdmin
    .from("subscriptions")
    .select("id, status")
    .eq("user_id", referrerUserId)
    .eq("status", "active")
    .single();

  const referrerHasSubscription = !!referrerSubscription;

  if (referrerHasSubscription) {
    // Get or create affiliate record
    let { data: affiliate } = await supabaseAdmin
      .from("affiliates")
      .select("id, commission_rate, tier, user_id")
      .eq("user_id", referrerUserId)
      .single();

    if (!affiliate) {
      const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const { data: newAffiliate } = await supabaseAdmin
        .from("affiliates")
        .insert({
          user_id: referrerUserId,
          referral_code: referralCode,
          tier: "base",
          commission_rate: 20.0,
          is_active: true,
        })
        .select("id, commission_rate, tier, user_id")
        .single();

      affiliate = newAffiliate;
    }

    if (!affiliate) {
      return createErrorResponse("Failed to create affiliate record", 500, requestId);
    }

    // Get or create referral record
    let { data: referral } = await supabaseAdmin
      .from("affiliate_referrals")
      .select("id")
      .eq("affiliate_id", affiliate.id)
      .eq("referred_user_id", subscription.user_id)
      .single();

    if (!referral) {
      const { data: newReferral } = await supabaseAdmin
        .from("affiliate_referrals")
        .insert({
          affiliate_id: affiliate.id,
          referred_user_id: subscription.user_id,
          is_converted: true,
          conversion_timestamp: new Date().toISOString(),
        })
        .select("id")
        .single();
      referral = newReferral;
    } else {
      await supabaseAdmin
        .from("affiliate_referrals")
        .update({
          is_converted: true,
          conversion_timestamp: new Date().toISOString(),
        })
        .eq("id", referral.id);
    }

    // Calculate commission
    const commissionAmount = (amount * affiliate.commission_rate) / 100;

    // Get period dates
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    // Create commission record
    if (referral?.id) {
      await supabaseAdmin.from("commissions").insert({
        affiliate_id: affiliate.id,
        referral_id: referral.id,
        amount: commissionAmount,
        commission_rate: affiliate.commission_rate,
        subscription_revenue: amount,
        status: "pending",
        period_start: periodStart,
        period_end: periodEnd,
      });
    }

    // Check for tier upgrade
    const { data: activeReferrals } = await supabaseAdmin
      .from("affiliate_referrals")
      .select("id")
      .eq("affiliate_id", affiliate.id)
      .eq("is_converted", true)
      .eq("is_fraudulent", false);

    const activeCount = activeReferrals?.length || 0;
    let newTier = "base";
    let newRate = 20.0;

    if (activeCount >= 50) {
      newTier = "tier_3";
      newRate = 30.0;
    } else if (activeCount >= 10) {
      newTier = "tier_2";
      newRate = 25.0;
    }

    if (newRate !== affiliate.commission_rate) {
      await supabaseAdmin
        .from("affiliates")
        .update({ tier: newTier, commission_rate: newRate })
        .eq("id", affiliate.id);
    }

    return createResponseWithId(
      {
        success: true,
        type: "commission",
        commissionAmount,
        affiliateId: affiliate.id,
      },
      200,
      requestId
    );
  } else {
    // Grant unblur credits instead
    const CREDITS_TO_GRANT = 1;

    await supabaseAdmin.rpc("increment_unblur_credits", {
      user_id: referrerUserId,
      amount: CREDITS_TO_GRANT,
    });

    return createResponseWithId(
      {
        success: true,
        type: "credits",
        creditsGranted: CREDITS_TO_GRANT,
        referrerUserId,
      },
      200,
      requestId
    );
  }
}

// ============ CREATOR APPLY ============
async function handleCreatorApply(
  req: Request,
  user: any,
  supabaseAdmin: any,
  requestId: string
) {
  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405, requestId);
  }

  const body = await req.json();
  const { platform, username, followers_count, content_type, bio } = body;

  if (!platform || !username) {
    return createErrorResponse("Missing platform or username", 400, requestId);
  }

  // Check if already applied
  const { data: existing } = await supabaseAdmin
    .from("creators")
    .select("id, status")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return createResponseWithId(
      {
        already_applied: true,
        status: existing.status,
      },
      200,
      requestId
    );
  }

  // Create application
  const affiliateLink = `${username.toLowerCase()}.black-pill.app`;

  const { data: creator, error } = await supabaseAdmin
    .from("creators")
    .insert({
      user_id: user.id,
      platform,
      username,
      followers_count: followers_count || 0,
      content_type: content_type || "general",
      bio: bio || "",
      affiliate_link: affiliateLink,
      status: "pending",
      tier: "base",
      commission_rate: 20.0,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return createResponseWithId(
    {
      applied: true,
      creator_id: creator.id,
      status: "pending",
    },
    200,
    requestId
  );
}

// ============ CREATOR DASHBOARD ============
async function handleCreatorDashboard(
  user: any,
  supabaseAdmin: any,
  requestId: string
) {
  const { data: creator, error } = await supabaseAdmin
    .from("creators")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !creator) {
    return createErrorResponse("Creator not found. Apply first.", 404, requestId);
  }

  if (creator.status !== "approved") {
    return createResponseWithId(
      {
        error: "Not approved",
        status: creator.status,
      },
      200,
      requestId
    );
  }

  // Get stats
  const { count: totalClicks } = await supabaseAdmin
    .from("affiliate_clicks")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", creator.id);

  const { count: totalConversions } = await supabaseAdmin
    .from("affiliate_conversions")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", creator.id);

  // Get monthly revenue
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: monthlyConversions } = await supabaseAdmin
    .from("affiliate_conversions")
    .select("commission_earned")
    .eq("creator_id", creator.id)
    .gte("created_at", monthStart.toISOString());

  const revenueThisMonth =
    monthlyConversions?.reduce((sum: number, c: any) => sum + parseFloat(c.commission_earned || 0), 0) || 0;

  // Get pending payout
  const { data: pendingConversions } = await supabaseAdmin
    .from("affiliate_conversions")
    .select("commission_earned")
    .eq("creator_id", creator.id)
    .eq("status", "approved")
    .is("paid_at", null);

  const payoutPending =
    pendingConversions?.reduce((sum: number, c: any) => sum + parseFloat(c.commission_earned || 0), 0) || 0;

  const conversionRate = totalClicks && totalClicks > 0 ? ((totalConversions || 0) / totalClicks) * 100 : 0;

  const nextPayout = new Date();
  nextPayout.setMonth(nextPayout.getMonth() + 1);
  nextPayout.setDate(15);

  return createResponseWithId(
    {
      creator_id: creator.id,
      affiliate_link: `https://${creator.affiliate_link}`,
      tier: creator.tier,
      commission_rate: creator.commission_rate,
      stats: {
        total_clicks: totalClicks || 0,
        total_conversions: totalConversions || 0,
        conversion_rate: conversionRate.toFixed(2),
        revenue_this_month: revenueThisMonth.toFixed(2),
        payout_pending: payoutPending.toFixed(2),
        next_payout_date: nextPayout.toISOString().split("T")[0],
      },
    },
    200,
    requestId
  );
}

// ============ CREATOR PERFORMANCE ============
async function handleCreatorPerformance(
  user: any,
  supabaseAdmin: any,
  requestId: string
) {
  const { data: creator } = await supabaseAdmin
    .from("creators")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!creator) {
    return createErrorResponse("Creator not found", 404, requestId);
  }

  // Get last 30 days of data
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: dailyClicks } = await supabaseAdmin
    .from("affiliate_clicks")
    .select("created_at")
    .eq("creator_id", creator.id)
    .gte("created_at", thirtyDaysAgo.toISOString());

  const { data: dailyConversions } = await supabaseAdmin
    .from("affiliate_conversions")
    .select("created_at, commission_earned")
    .eq("creator_id", creator.id)
    .gte("created_at", thirtyDaysAgo.toISOString());

  // Aggregate by day
  const clicksByDay: Record<string, number> = {};
  const conversionsByDay: Record<string, number> = {};
  const revenueByDay: Record<string, number> = {};

  dailyClicks?.forEach((c: any) => {
    const day = c.created_at.split("T")[0];
    clicksByDay[day] = (clicksByDay[day] || 0) + 1;
  });

  dailyConversions?.forEach((c: any) => {
    const day = c.created_at.split("T")[0];
    conversionsByDay[day] = (conversionsByDay[day] || 0) + 1;
    revenueByDay[day] = (revenueByDay[day] || 0) + parseFloat(c.commission_earned || 0);
  });

  return createResponseWithId(
    {
      clicks_by_day: clicksByDay,
      conversions_by_day: conversionsByDay,
      revenue_by_day: revenueByDay,
    },
    200,
    requestId
  );
}

// ============ CREATOR COUPONS ============
async function handleCreatorCoupons(
  req: Request,
  user: any,
  supabaseAdmin: any,
  requestId: string
) {
  const { data: creator } = await supabaseAdmin
    .from("creators")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!creator) {
    return createErrorResponse("Creator not found", 404, requestId);
  }

  if (req.method === "GET") {
    const { data: coupons } = await supabaseAdmin
      .from("creator_coupons")
      .select("*")
      .eq("creator_id", creator.id)
      .order("created_at", { ascending: false });

    return createResponseWithId({ coupons: coupons || [] }, 200, requestId);
  }

  if (req.method === "POST") {
    const body = await req.json();
    const { code, discount_percent, max_uses } = body;

    if (!code || !discount_percent) {
      return createErrorResponse("Missing code or discount_percent", 400, requestId);
    }

    const { data: coupon, error } = await supabaseAdmin
      .from("creator_coupons")
      .insert({
        creator_id: creator.id,
        code: code.toUpperCase(),
        discount_percent,
        max_uses: max_uses || 100,
        uses_count: 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return createResponseWithId({ coupon }, 200, requestId);
  }

  return createErrorResponse("Method not allowed", 405, requestId);
}
