const { createClient } = require('redis');
const config = require('./config');

let redisClient = null;
let isConnected = false;

/**
 * Initialize Redis cache client
 */
async function initCache() {
  if (!config.redis.url) {
    console.warn('Redis URL not configured. Server-side caching disabled.');
    return null;
  }

  try {
    redisClient = createClient({
      url: config.redis.url,
    });

    await redisClient.connect();
    isConnected = true;
    console.log('Redis cache connected');
    
    return redisClient;
  } catch (error) {
    console.error('Redis cache connection failed:', error);
    return null;
  }
}

/**
 * Get cached data
 * @param {string} key - Cache key
 * @returns {Promise<any>} Cached data or null
 */
async function getCache(key) {
  if (!isConnected) return null;

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
 * @param {string} key - Cache key
 * @param {any} value - Data to cache
 * @param {number} ttlSeconds - Time to live in seconds
 */
async function setCache(key, value, ttlSeconds) {
  if (!isConnected) return;

  try {
    await redisClient.setEx(
      key,
      ttlSeconds,
      JSON.stringify(value)
    );
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Delete cached data
 * @param {string} key - Cache key
 */
async function deleteCache(key) {
  if (!isConnected) return;

  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

/**
 * Middleware for caching GET requests
 * PRD Section 4.4: Server-Side caching
 */
function cacheMiddleware(ttlSeconds) {
  return async (req, res, next) => {
    if (req.method !== 'GET' || !isConnected) {
      return next();
    }

    const cacheKey = `cache:${req.path}:${JSON.stringify(req.query)}`;

    try {
      const cached = await getCache(cacheKey);
      
      if (cached) {
        console.log(`Cache hit: ${cacheKey}`);
        return res.status(200).json(cached);
      }

      // Override res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = function (data) {
        setCache(cacheKey, data, ttlSeconds);
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

module.exports = {
  initCache,
  getCache,
  setCache,
  deleteCache,
  cacheMiddleware,
};

