import { createClient } from 'redis';
import crypto from 'crypto-js';
import { CachedJobPosting, CacheStats } from '@/types/scraping';

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;

// Initialize Redis client
async function getRedisClient() {
  if (!redisClient) {
    // For development, use local Redis. For production, use environment variable
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = createClient({
      url: redisUrl,
      // Add error handling
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.error('Redis connection failed after 3 retries');
            return false; // Stop reconnecting
          }
          return 1000; // Retry after 1 second
        }
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Connected to Redis');
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

// Generate URL hash for privacy-first caching
export function generateUrlHash(url: string): string {
  return crypto.SHA256(url.toLowerCase().trim()).toString();
}

// Note: CachedJobPosting interface moved to @/types/scraping

// Get cached job posting by URL hash
export async function getCachedJobPosting(url: string): Promise<CachedJobPosting | null> {
  try {
    const client = await getRedisClient();
    const urlHash = generateUrlHash(url);
    const cacheKey = `job:${urlHash}`;
    
    const cached = await client.get(cacheKey);
    
    if (cached) {
      console.log('Cache HIT for URL hash:', urlHash);
      return JSON.parse(cached) as CachedJobPosting;
    } else {
      console.log('Cache MISS for URL hash:', urlHash);
      return null;
    }
  } catch (error) {
    console.error('Redis get error:', error);
    // Gracefully degrade - return null if Redis is unavailable
    return null;
  }
}

// Cache job posting with TTL (Time To Live)
export async function setCachedJobPosting(
  url: string, 
  jobPosting: string, 
  ttlHours: number = 720
): Promise<void> {
  try {
    const client = await getRedisClient();
    const urlHash = generateUrlHash(url);
    const cacheKey = `job:${urlHash}`;
    
    const cacheData: CachedJobPosting = {
      jobPosting,
      extractedAt: new Date().toISOString(),
      urlHash
    };
    
    // Set with TTL (time to live) in seconds
    const ttlSeconds = ttlHours * 60 * 60;
    await client.setEx(cacheKey, ttlSeconds, JSON.stringify(cacheData));
    
    console.log(`Cached job posting with hash: ${urlHash}, TTL: ${ttlHours}h`);
  } catch (error) {
    console.error('Redis set error:', error);
    // Gracefully degrade - continue without caching if Redis is unavailable
  }
}

// Clear expired cache entries (manual cleanup - Redis TTL handles automatic cleanup)
export async function clearExpiredCache(): Promise<void> {
  try {
    const client = await getRedisClient();
    // This is mainly for monitoring - Redis TTL automatically removes expired keys
    const keys = await client.keys('job:*');
    console.log(`Current cache entries: ${keys.length}`);
  } catch (error) {
    console.error('Redis cleanup error:', error);
  }
}

// Get cache statistics
export async function getCacheStats(): Promise<CacheStats> {
  try {
    const client = await getRedisClient();
    const keys = await client.keys('job:*');
    
    // Get memory usage if available
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
      memoryUsage
    };
  } catch (error) {
    console.error('Redis stats error:', error);
    return { totalEntries: 0 };
  }
}

// Graceful shutdown
export async function closeRedisConnection(): Promise<void> {
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