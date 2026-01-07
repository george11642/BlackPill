/**
 * Rate limiting utilities for Edge Functions
 * Uses Upstash Redis for distributed rate limiting
 */

import { Redis } from "https://esm.sh/@upstash/redis@1.28.4";

let redis: Redis | null = null;

/**
 * Get Redis client singleton
 */
function getRedis(): Redis | null {
  if (redis) return redis;

  const redisUrl = Deno.env.get("UPSTASH_REDIS_REST_URL");
  const redisToken = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

  if (redisUrl && redisToken) {
    redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });
    return redis;
  }

  console.warn("[RateLimit] No Redis configured, rate limiting disabled");
  return null;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit using sliding window algorithm
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const client = getRedis();

  // Allow request if Redis not available
  if (!client) {
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: Date.now() + windowMs,
    };
  }

  const now = Date.now();
  const windowStart = now - windowMs;
  const fullKey = `rl:${key}`;

  try {
    // Use Redis pipeline for atomic operations
    const pipeline = client.pipeline();

    // Remove old entries
    pipeline.zremrangebyscore(fullKey, 0, windowStart);

    // Count current entries
    pipeline.zcard(fullKey);

    // Add new entry
    pipeline.zadd(fullKey, { score: now, member: `${now}-${Math.random()}` });

    // Set expiry
    pipeline.pexpire(fullKey, windowMs);

    const results = await pipeline.exec();
    const count = (results[1] as number) || 0;

    if (count >= maxRequests) {
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: now + windowMs,
      };
    }

    return {
      success: true,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - count - 1),
      reset: now + windowMs,
    };
  } catch (error) {
    console.error("[RateLimit] Error:", error);
    // Allow request on error
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: now + windowMs,
    };
  }
}

/**
 * Rate limit configurations for different routes
 */
export const RATE_LIMITS = {
  analyze: { maxRequests: 5, windowMs: 600000 },
  analyzePremium: { maxRequests: 20, windowMs: 600000 },
  auth: { maxRequests: 3, windowMs: 3600000 },
  leaderboard: { maxRequests: 60, windowMs: 60000 },
  share: { maxRequests: 10, windowMs: 3600000 },
  general: { maxRequests: 100, windowMs: 60000 },
};

/**
 * Check analysis rate limit based on user tier
 */
export async function analyzeRateLimit(
  userId: string,
  tier?: string
): Promise<RateLimitResult> {
  const config =
    tier && tier !== "free" ? RATE_LIMITS.analyzePremium : RATE_LIMITS.analyze;

  return checkRateLimit(`analyze:${userId}`, config.maxRequests, config.windowMs);
}

export class RateLimitError extends Error {
  retryAfter: number;

  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}
