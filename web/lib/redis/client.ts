import Redis from 'ioredis';

// Redis client singleton
let redis: Redis | null = null;

/**
 * Determines if TLS should be used for Redis connection based on URL
 */
function shouldUseTls(url: string): boolean {
  // If URL explicitly uses redis:// (not rediss://), don't use TLS
  // This respects the user's explicit choice of non-TLS connection
  if (url.startsWith('redis://')) {
    return false;
  }
  
  // If URL explicitly uses rediss:// protocol, use TLS
  if (url.startsWith('rediss://')) {
    return true;
  }
  
  // For URLs without explicit protocol, check for known TLS-required providers
  const tlsProviders = [
    'redislabs.com',
    'redis.cloud',
    'redis-cloud.com',
    'redis-cloud',
    'upstash.io',
    'upstash.com',
  ];
  
  return tlsProviders.some(provider => url.includes(provider));
}

export function getRedisClient(): Redis | null {
  if (redis) return redis;
  
  const redisUrl = process.env.blackpill_REDIS_URL || process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.warn('No Redis URL configured, rate limiting will use in-memory fallback');
    return null;
  }
  
  // Check if URL is a placeholder or invalid
  if (redisUrl.includes('password@host:port') || redisUrl.includes('your_') || redisUrl === 'redis://default:password@host:port') {
    console.warn('Redis URL appears to be a placeholder, skipping Redis connection');
    return null;
  }
  
  try {
    const useTls = shouldUseTls(redisUrl);
    
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 5000,
      lazyConnect: true, // Don't connect immediately
      // TLS configuration for providers that require it
      // rejectUnauthorized: false is needed for some Redis providers' self-signed certificates
      tls: useTls ? { rejectUnauthorized: false } : undefined,
    });
    
    redis.on('error', (err) => {
      console.error('Redis connection error:', err.message);
    });
    
    redis.on('connect', () => {
      console.log('Redis connected successfully');
    });
    
    return redis;
  } catch (error) {
    console.error('Failed to create Redis client:', error);
    return null;
  }
}

// Rate limiting using Redis sliding window
export async function checkRateLimitRedis(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const client = getRedisClient();
  
  if (!client) {
    // Fallback: allow request if Redis is unavailable
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: Date.now() + windowMs,
    };
  }
  
  const now = Date.now();
  const windowStart = now - windowMs;
  const resetTime = now + windowMs;
  
  try {
    // Use Redis sorted set for sliding window
    // Score = timestamp, Member = unique request ID
    const multi = client.multi();
    
    // Remove old entries outside the window
    multi.zremrangebyscore(key, 0, windowStart);
    
    // Count current requests in window
    multi.zcard(key);
    
    // Add current request
    multi.zadd(key, now, `${now}-${Math.random()}`);
    
    // Set expiry on the key
    multi.pexpire(key, windowMs);
    
    const results = await multi.exec();
    
    if (!results) {
      throw new Error('Redis transaction failed');
    }
    
    // Get count from zcard result (index 1)
    const count = (results[1]?.[1] as number) || 0;
    
    if (count >= maxRequests) {
      // Get the oldest entry to calculate reset time
      const oldest = await client.zrange(key, 0, 0, 'WITHSCORES');
      const oldestTime = oldest.length >= 2 ? parseInt(oldest[1], 10) : now;
      const actualReset = oldestTime + windowMs;
      
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: actualReset,
      };
    }
    
    return {
      success: true,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - count - 1),
      reset: resetTime,
    };
  } catch (error) {
    console.error('Redis rate limit error:', error);
    // Fallback: allow request if Redis fails
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: resetTime,
    };
  }
}

