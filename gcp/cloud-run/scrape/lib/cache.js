// Shared caching utilities for GCP services
// Migrated and adapted from src/lib/redis.ts for GCP Memorystore

const { createClient } = require('redis');
const crypto = require('crypto');

// Redis client singleton
let redisClient = null;

/**
 * Initialize Redis client for Memorystore
 */
async function getRedisClient() {
  if (!redisClient) {
    // Build Redis URL from environment variables for security
    // Password from Secret Manager, host/port from config
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = process.env.REDIS_PORT || '6379';
    const redisPassword = process.env.REDIS_PASSWORD || '';

    // Construct URL with password (if provided)
    const redisUrl = redisPassword
      ? `redis://:${redisPassword}@${redisHost}:${redisPort}`
      : `redis://${redisHost}:${redisPort}`;

    console.log(`Connecting to Redis at ${redisHost}:${redisPort} (auth: ${redisPassword ? 'enabled' : 'disabled'})`);

    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.error('Redis connection failed after 3 retries');
            return false;
          }
          return 1000; // Retry after 1 second
        }
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Connected to Memorystore Redis');
    });

    try {
      await redisClient.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      redisClient = null;
      throw error;
    }
  }

  return redisClient;
}

/**
 * Generate URL hash for privacy-first caching
 */
function generateUrlHash(url) {
  return crypto.createHash('sha256').update(url.toLowerCase().trim()).digest('hex');
}

/**
 * Get cached job posting by URL hash
 */
async function getCachedJobPosting(url) {
  try {
    const client = await getRedisClient();
    const urlHash = generateUrlHash(url);
    const cacheKey = `job:${urlHash}`;
    
    const cached = await client.get(cacheKey);
    
    if (cached) {
      console.log('Cache HIT for URL hash:', urlHash);
      return JSON.parse(cached);
    } else {
      console.log('Cache MISS for URL hash:', urlHash);
      return null;
    }
  } catch (error) {
    console.error('Redis get error:', error);
    return null; // Graceful degradation
  }
}

/**
 * Cache job posting with TTL (Time To Live)
 */
async function setCachedJobPosting(url, jobPosting, ttlHours = 720) {
  try {
    const client = await getRedisClient();
    const urlHash = generateUrlHash(url);
    const cacheKey = `job:${urlHash}`;
    
    const cacheData = {
      jobPosting,
      extractedAt: new Date().toISOString(),
      urlHash
    };
    
    const ttlSeconds = ttlHours * 60 * 60;
    await client.setEx(cacheKey, ttlSeconds, JSON.stringify(cacheData));
    
    console.log(`Cached job posting with hash: ${urlHash}, TTL: ${ttlHours}h`);
  } catch (error) {
    console.error('Redis set error:', error);
    // Continue without caching if Redis unavailable
  }
}

/**
 * Cache insights with TTL
 */
async function setCachedInsights(jobAnalysisHash, insights, ttlHours = 720) {
  try {
    const client = await getRedisClient();
    const cacheKey = `insights:${jobAnalysisHash}`;
    
    const cacheData = {
      insights,
      generatedAt: new Date().toISOString()
    };
    
    const ttlSeconds = ttlHours * 60 * 60;
    await client.setEx(cacheKey, ttlSeconds, JSON.stringify(cacheData));
    
    console.log(`Cached insights with hash: ${jobAnalysisHash}, TTL: ${ttlHours}h`);
  } catch (error) {
    console.error('Redis insights cache error:', error);
  }
}

/**
 * Get cached insights
 */
async function getCachedInsights(jobAnalysisHash) {
  try {
    const client = await getRedisClient();
    const cacheKey = `insights:${jobAnalysisHash}`;
    
    const cached = await client.get(cacheKey);
    
    if (cached) {
      console.log('Insights cache HIT for hash:', jobAnalysisHash);
      return JSON.parse(cached);
    } else {
      console.log('Insights cache MISS for hash:', jobAnalysisHash);
      return null;
    }
  } catch (error) {
    console.error('Redis insights get error:', error);
    return null;
  }
}

/**
 * Get cache statistics
 */
async function getCacheStats() {
  try {
    const client = await getRedisClient();
    const keys = await client.keys('*');
    
    // Separate job and insights cache counts
    const jobKeys = keys.filter(key => key.startsWith('job:'));
    const insightKeys = keys.filter(key => key.startsWith('insights:'));
    
    let memoryUsage;
    try {
      const info = await client.info('memory');
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      memoryUsage = memoryMatch ? memoryMatch[1] : undefined;
    } catch {
      // Memory info not available in all Redis configurations
    }
    
    return {
      totalEntries: keys.length,
      jobPostings: jobKeys.length,
      insights: insightKeys.length,
      memoryUsage
    };
  } catch (error) {
    console.error('Redis stats error:', error);
    return { totalEntries: 0, jobPostings: 0, insights: 0 };
  }
}

/**
 * Graceful shutdown
 */
async function closeRedisConnection() {
  if (redisClient) {
    try {
      await redisClient.quit();
      redisClient = null;
      console.log('Redis connection closed');
    } catch (error) {
      console.error('Error closing Redis connection:', error);
    }
  }
}

module.exports = {
  getRedisClient,
  generateUrlHash,
  getCachedJobPosting,
  setCachedJobPosting,
  getCachedInsights,
  setCachedInsights,
  getCacheStats,
  closeRedisConnection
};