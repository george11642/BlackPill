import { RateLimiterRedis } from 'rate-limiter-flexible';
import { getRedisClient } from '../redis/client';


let rateLimiters: Record<string, RateLimiterRedis> = {};

/**
 * Initialize Redis client for rate limiting
 * Uses the shared Redis client singleton
 */
export async function initRedis(): Promise<ReturnType<typeof getRedisClient>> {
  const redisClient = getRedisClient();
  
  if (!redisClient) {
    return null;
  }

  // Create rate limiters if not already created
  if (Object.keys(rateLimiters).length === 0) {
    rateLimiters.analyze = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl:analyze',
      points: 5, // Number of requests
      duration: 600, // Per 10 minutes
    });

    rateLimiters.analyzePremium = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl:analyze:premium',
      points: 20,
      duration: 600,
    });

    rateLimiters.auth = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl:auth',
      points: 3,
      duration: 3600, // Per hour
    });

    rateLimiters.leaderboard = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl:leaderboard',
      points: 60,
      duration: 60, // Per minute
    });

    rateLimiters.share = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl:share',
      points: 10,
      duration: 3600, // Per hour
    });
  }

  return redisClient;
}

/**
 * Get rate limiter by name
 */
function getRateLimiter(limiterName: string): RateLimiterRedis | null {
  const redisClient = getRedisClient();
  if (!redisClient || !rateLimiters[limiterName]) {
    return null;
  }
  return rateLimiters[limiterName];
}

/**
 * Create rate limiter middleware for API routes
 * Returns a function that checks rate limits and throws if exceeded
 */
export function createRateLimiter(limiterName: string) {
  return async (request: Request, userId?: string): Promise<void> => {
    const limiter = getRateLimiter(limiterName);
    
    // Skip if Redis not available
    if (!limiter) {
      return;
    }

    try {
      // Get IP address from request
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                 request.headers.get('x-real-ip') ||
                 'unknown';
      
      const key = userId || ip;
      await limiter.consume(key);
    } catch (error) {
      // Rate limit exceeded
      if (error instanceof Error && 'msBeforeNext' in error) {
        const retryAfter = Math.ceil((error as { msBeforeNext: number }).msBeforeNext / 1000);
        throw new RateLimitError(
          `Too many requests. Please try again in ${retryAfter} seconds.`,
          retryAfter
        );
      }
      
      // Other errors - log but don't block
      console.error('Rate limiter error:', error);
    }
  };
}

/**
 * Analysis rate limiter (different limits for free vs premium)
 */
export async function analyzeRateLimiter(
  request: Request,
  userTier?: string,
  userId?: string
): Promise<void> {
  const limiter = getRateLimiter(
    userTier && userTier !== 'free' ? 'analyzePremium' : 'analyze'
  );
  
  if (!limiter) {
    return;
  }

  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';
    
    const key = userId || ip;
    await limiter.consume(key);
  } catch (error) {
    if (error instanceof Error && 'msBeforeNext' in error) {
      const retryAfter = Math.ceil((error as { msBeforeNext: number }).msBeforeNext / 1000);
      throw new RateLimitError(
        `Analysis limit reached. Please try again in ${retryAfter} seconds.`,
        retryAfter
      );
    }
    
    console.error('Rate limiter error:', error);
  }
}

/**
 * Custom error for rate limiting
 */
export class RateLimitError extends Error {
  retryAfter: number;

  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Wrapper for API route handlers with rate limiting
 */
export function withRateLimit(
  limiterName: string,
  handler: (request: Request, ...args: unknown[]) => Promise<Response>
) {
  return async (request: Request, ...args: unknown[]): Promise<Response> => {
    try {
      // Initialize Redis if needed
      await initRedis();
      
      // Get user ID from request if available (set by auth middleware)
      const userId = (request as { user?: { id: string } }).user?.id;
      
      // Check rate limit
      await createRateLimiter(limiterName)(request, userId);
      
      // Call handler if rate limit passed
      return handler(request, ...args);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return Response.json(
          {
            error: 'Rate limit exceeded',
            message: error.message,
            retryAfter: error.retryAfter,
          },
          {
            status: 429,
            headers: {
              'Retry-After': error.retryAfter.toString(),
            },
          }
        );
      }
      
      throw error;
    }
  };
}

