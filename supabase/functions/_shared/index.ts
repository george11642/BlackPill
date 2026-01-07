/**
 * Shared utilities barrel export
 */

// CORS and response utilities
export { corsHeaders, handleCors, jsonResponse, errorResponse } from "./cors.ts";
export {
  getRequestId,
  createResponseWithId,
  createErrorResponse,
  handleApiError,
} from "./response.ts";

// Supabase client
export {
  getSupabaseAdmin,
  getSupabase,
  createUserClient,
  supabaseAdmin,
} from "./supabase.ts";

// Authentication
export {
  getAuthUser,
  checkScansRemaining,
  withAuth,
  verifyCronSecret,
  type AuthenticatedUser,
  type AuthResult,
} from "./auth.ts";

// Rate limiting
export {
  checkRateLimit,
  analyzeRateLimit,
  RATE_LIMITS,
  RateLimitError,
  type RateLimitResult,
} from "./rate-limit.ts";

// External services
export {
  analyzeFacialAttractiveness,
  generateChatResponse,
  type FacialAnalysisResult,
} from "./openai.ts";

export {
  getStripe,
  verifyStripeWebhook,
  createCheckoutSession,
  cancelSubscription,
  getSubscription,
} from "./stripe.ts";

export { sendEmail, sendWelcomeEmail, sendSubscriptionEmail } from "./resend.ts";

export {
  sendExpoPush,
  sendExpoPushBatch,
  isExpoPushToken,
  sendNotificationToUser,
} from "./push.ts";
