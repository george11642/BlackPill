import { getRedisClient } from '../redis/client';

/**
 * Initialize Redis cache client
 * Uses the shared Redis client singleton
 */
export async function initCache(): Promise<ReturnType<typeof getRedisClient>> {
  return getRedisClient();
}

/**
 * Get cached data
 */
export async function getCache(key: string): Promise<unknown | null> {
  const redisClient = getRedisClient();
  if (!redisClient) return null;

  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set cached data
 */
export async function setCache(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const redisClient = getRedisClient();
  if (!redisClient) return;

  try {
    await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Delete cached data
 */
export async function deleteCache(key: string): Promise<void> {
  const redisClient = getRedisClient();
  if (!redisClient) return;

  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

/**
 * Create cache key from path and params
 */
export function createCacheKey(
  ...parts: (string | Record<string, string | number>)[]
): string {
  const keyParts = parts.map((part) =>
    typeof part === 'string' ? part : JSON.stringify(part)
  );
  return `cache:${keyParts.join(':')}`;
}

