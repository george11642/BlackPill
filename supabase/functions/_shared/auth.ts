/**
 * Authentication utilities for Edge Functions
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { errorResponse } from "./cors.ts";
import { getSupabaseAdmin } from "./supabase.ts";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  [key: string]: unknown;
}

export interface AuthResult {
  user: AuthenticatedUser | null;
  error: string | null;
}

/**
 * Get authenticated user from request Authorization header
 */
export async function getAuthUser(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      user: null,
      error: "Missing or invalid authorization header",
    };
  }

  const token = authHeader.substring(7).trim();

  if (!token || token === "undefined" || token === "null") {
    return {
      user: null,
      error: "Invalid or missing authentication token",
    };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      user: null,
      error: "Server configuration error",
    };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error) {
    console.error("[Auth] Token verification error:", error.message);
    return {
      user: null,
      error: "Invalid or expired token",
    };
  }

  if (!user) {
    return {
      user: null,
      error: "User not found",
    };
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      ...user,
    },
    error: null,
  };
}

/**
 * Check if user has scans remaining
 */
export async function checkScansRemaining(
  userId: string
): Promise<{ tier: string; scansRemaining: number }> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("scans_remaining, tier")
    .eq("id", userId)
    .single();

  if (error || !user) {
    throw new Error("User not found");
  }

  // Elite tier has unlimited scans
  if (user.tier === "elite") {
    return {
      tier: user.tier,
      scansRemaining: Infinity,
    };
  }

  if (user.scans_remaining <= 0) {
    throw new Error("Insufficient scans remaining");
  }

  return {
    tier: user.tier,
    scansRemaining: user.scans_remaining,
  };
}

/**
 * Higher-order function to wrap handlers with authentication
 */
export function withAuth(
  handler: (req: Request, user: AuthenticatedUser) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const { user, error } = await getAuthUser(req);

    if (error || !user) {
      return errorResponse(error || "Authentication failed", 401, "Unauthorized");
    }

    return handler(req, user);
  };
}

/**
 * Verify cron secret for scheduled functions
 */
export function verifyCronSecret(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  const cronSecret = Deno.env.get("CRON_SECRET");

  if (!cronSecret) {
    console.error("[Cron] CRON_SECRET not configured");
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}
