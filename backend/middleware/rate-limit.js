const { RateLimiterRedis } = require('rate-limiter-flexible');
const { createClient } = require('redis');
const config = require('../utils/config');

let redisClient;
let rateLimiters = {};

// Initialize Redis client
async function initRedis() {
  if (!config.redis.url) {
    console.warn('Redis URL not configured. Rate limiting disabled.');
    return null;
  }

  try {
    redisClient = createClient({
      url: config.redis.url,
    });

    await redisClient.connect();
    console.log('Redis connected for rate limiting');

    // Create rate limiters
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

    return redisClient;
  } catch (error) {
    console.error('Redis connection failed:', error);
    return null;
  }
}

/**
 * Rate limiter middleware
 */
function createRateLimiter(limiterName) {
  return async (req, res, next) => {
    // Skip if Redis not available
    if (!redisClient || !rateLimiters[limiterName]) {
      return next();
    }

    try {
      const key = req.user?.id || req.ip;
      await rateLimiters[limiterName].consume(key);
      next();
    } catch (error) {
      if (error.msBeforeNext) {
        const retryAfter = Math.ceil(error.msBeforeNext / 1000);
        res.set('Retry-After', retryAfter.toString());
        
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${retryAfter} seconds.`,
          retryAfter,
        });
      }
      
      // Other errors
      console.error('Rate limiter error:', error);
      next();
    }
  };
}

/**
 * Analysis rate limiter (different limits for free vs premium)
 */
async function analyzeRateLimiter(req, res, next) {
  if (!redisClient) {
    return next();
  }

  try {
    const isPremium = req.userTier && req.userTier !== 'free';
    const limiter = isPremium ? rateLimiters.analyzePremium : rateLimiters.analyze;
    const key = req.user?.id || req.ip;

    await limiter.consume(key);
    next();
  } catch (error) {
    if (error.msBeforeNext) {
      const retryAfter = Math.ceil(error.msBeforeNext / 1000);
      res.set('Retry-After', retryAfter.toString());
      
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Analysis limit reached. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      });
    }
    
    console.error('Rate limiter error:', error);
    next();
  }
}

module.exports = {
  initRedis,
  createRateLimiter,
  analyzeRateLimiter,
};

