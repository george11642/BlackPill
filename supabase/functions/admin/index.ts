/**
 * Admin Edge Function - Consolidated admin operations
 *
 * Actions (via query param ?action=):
 * - grant-subscription: Admin grants subscription to user (requires admin)
 * - user-delete: Delete user account (requires auth)
 * - user-export: Export user data for GDPR (requires auth)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  handleCors,
  getAuthUser,
  getRequestId,
  createResponseWithId,
  createErrorResponse,
  getSupabaseAdmin,
} from "../_shared/index.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return handleCors();
  }

  const requestId = getRequestId(req);
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    const { user, error: authError } = await getAuthUser(req);
    if (authError || !user) {
      return createErrorResponse(authError || "Authentication failed", 401, requestId);
    }

    const supabaseAdmin = getSupabaseAdmin();

    switch (action) {
      case "grant-subscription":
        return await handleGrantSubscription(req, user, supabaseAdmin, requestId);
      case "user-delete":
        return await handleUserDelete(req, user, supabaseAdmin, requestId);
      case "user-export":
        return await handleUserExport(req, user, supabaseAdmin, requestId);
      default:
        return createErrorResponse(
          "Invalid action. Use: grant-subscription, user-delete, user-export",
          400,
          requestId
        );
    }
  } catch (error) {
    console.error("[admin] Error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500,
      requestId
    );
  }
});

// ============ GRANT SUBSCRIPTION ============
async function handleGrantSubscription(
  req: Request,
  user: any,
  supabaseAdmin: any,
  requestId: string
) {
  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405, requestId);
  }

  // Check if user is admin
  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return createErrorResponse("Forbidden - Admin access required", 403, requestId);
  }

  const body = await req.json();
  const { email, makeAffiliate } = body;

  if (!email) {
    return createErrorResponse("Email is required", 400, requestId);
  }

  // Find user by email
  const { data: authData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

  if (listError || !authData?.users) {
    throw new Error("Failed to retrieve users");
  }

  const targetUser = authData.users.find((u: any) => u.email === email);

  if (!targetUser) {
    return createErrorResponse("User not found with that email", 404, requestId);
  }

  // Check if user record exists
  const { data: existingUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("id", targetUser.id)
    .maybeSingle();

  if (!existingUser) {
    // Create user record
    await supabaseAdmin.from("users").insert({
      id: targetUser.id,
      email: targetUser.email,
      tier: "free",
    });
  }

  // Generate RevenueCat IDs
  const revenuecatSubscriptionId = `admin_granted_${crypto.randomUUID()}`;
  const revenuecatCustomerId = targetUser.id;

  const subscriptionData = {
    user_id: targetUser.id,
    status: "active",
    tier: "pro",
    current_period_start: new Date().toISOString(),
    current_period_end: new Date("2099-12-31").toISOString(),
    payment_provider: "revenuecat",
    revenuecat_subscription_id: revenuecatSubscriptionId,
    revenuecat_customer_id: revenuecatCustomerId,
  };

  // Check existing subscription
  const { data: existingSub } = await supabaseAdmin
    .from("subscriptions")
    .select("id, revenuecat_subscription_id, revenuecat_customer_id")
    .eq("user_id", targetUser.id)
    .maybeSingle();

  if (existingSub) {
    await supabaseAdmin
      .from("subscriptions")
      .update({
        ...subscriptionData,
        revenuecat_subscription_id:
          existingSub.revenuecat_subscription_id || revenuecatSubscriptionId,
        revenuecat_customer_id: existingSub.revenuecat_customer_id || revenuecatCustomerId,
      })
      .eq("id", existingSub.id);
  } else {
    await supabaseAdmin.from("subscriptions").insert(subscriptionData);
  }

  // Update user tier
  await supabaseAdmin
    .from("users")
    .update({ tier: "pro", scans_remaining: 30 })
    .eq("id", targetUser.id);

  let affiliateCreated = false;
  let referralCode: string | null = null;
  let referralLink: string | null = null;

  // Make affiliate if requested
  if (makeAffiliate) {
    const { data: existingAffiliate } = await supabaseAdmin
      .from("affiliates")
      .select("id, referral_code")
      .eq("user_id", targetUser.id)
      .maybeSingle();

    if (!existingAffiliate) {
      referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      await supabaseAdmin.from("affiliates").insert({
        user_id: targetUser.id,
        referral_code: referralCode,
        tier: "base",
        commission_rate: 20.0,
        is_active: true,
      });
      affiliateCreated = true;
    } else {
      await supabaseAdmin
        .from("affiliates")
        .update({ is_active: true })
        .eq("id", existingAffiliate.id);
      referralCode = existingAffiliate.referral_code;
      affiliateCreated = true;
    }

    if (referralCode) {
      referralLink = `https://black-pill.app?ref=${referralCode}`;
    }
  }

  return createResponseWithId(
    {
      success: true,
      message: `Subscription granted${affiliateCreated ? " and affiliate created" : ""}`,
      userId: targetUser.id,
      referralCode: referralCode || undefined,
      referralLink: referralLink || undefined,
    },
    200,
    requestId
  );
}

// ============ USER DELETE ============
async function handleUserDelete(
  req: Request,
  user: any,
  supabaseAdmin: any,
  requestId: string
) {
  if (req.method !== "DELETE") {
    return createErrorResponse("Method not allowed", 405, requestId);
  }

  // Delete user from Supabase Auth (cascades via triggers)
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error("[admin] Error deleting user:", deleteError);
    throw deleteError;
  }

  return createResponseWithId(
    { success: true, message: "Account deleted successfully" },
    200,
    requestId
  );
}

// ============ USER EXPORT ============
async function handleUserExport(
  req: Request,
  user: any,
  supabaseAdmin: any,
  requestId: string
) {
  if (req.method !== "GET") {
    return createErrorResponse("Method not allowed", 405, requestId);
  }

  // Get user data
  const { data: userData } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // Get analyses
  const { data: analyses } = await supabaseAdmin
    .from("analyses")
    .select("*")
    .eq("user_id", user.id)
    .is("deleted_at", null);

  // Get subscription
  const { data: subscription } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // Get routines
  const { data: routines } = await supabaseAdmin
    .from("routines")
    .select("*, routine_tasks(*)")
    .eq("user_id", user.id);

  // Get goals
  const { data: goals } = await supabaseAdmin
    .from("goals")
    .select("*")
    .eq("user_id", user.id);

  // Get achievements
  const { data: achievements } = await supabaseAdmin
    .from("user_achievements")
    .select("*")
    .eq("user_id", user.id);

  // Get AI conversations
  const { data: conversations } = await supabaseAdmin
    .from("ai_conversations")
    .select("*, ai_messages(*)")
    .eq("user_id", user.id);

  // Compile export
  const exportData = {
    user: userData,
    analyses: analyses || [],
    subscription,
    routines: routines || [],
    goals: goals || [],
    achievements: achievements || [],
    ai_conversations: conversations || [],
    export_date: new Date().toISOString(),
    data_rights_info: {
      gdpr: "You have the right to access, rectify, delete, and port your data.",
      contact: "support@black-pill.app",
    },
  };

  return createResponseWithId(exportData, 200, requestId);
}
