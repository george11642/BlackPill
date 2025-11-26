/**
 * Central export file for all lib utilities
 * Makes imports cleaner: import { supabaseAdmin, getAuthenticatedUser } from '@/lib'
 */

// Config
export { config } from './config';

// Supabase
export { supabase, supabaseAdmin } from './supabase/client';

// Auth
export {
  getAuthenticatedUser,
  checkScansRemaining,
  withAuth,
  type AuthenticatedUser,
} from './auth/middleware';

// OpenAI
export { analyzeFacialAttractiveness } from './openai/client';


// Scoring
export { calculateFallbackScore } from './scoring/fallback';

// Moderation
export { moderateContent } from './moderation/client';
export { flagContentForReview, isUserBanned } from './moderation/flag-content';

// Rate Limiting
export {
  initRedis,
  createRateLimiter,
  analyzeRateLimiter,
  withRateLimit,
  RateLimitError,
} from './rate-limit/middleware';

// Error Handling
export { handleApiError, withErrorHandler, ApiError } from './errors/handler';

// Middleware
export { getRequestId, setRequestIdHeaders, createResponseWithId } from './middleware/request-id';

// Email
export { sendEmail, sendRenewalReminder, sendPaymentFailedEmail } from './emails/service';

// Cache
export { initCache, getCache, setCache, deleteCache, createCacheKey } from './cache/client';

// Redis
export { getRedisClient, checkRateLimitRedis } from './redis/client';

// Push Notifications
export { sendNotificationToUser, sendNotificationToToken } from './notifications/push';

// Share Card
export { generateShareCardImage } from './share-card/generator';

