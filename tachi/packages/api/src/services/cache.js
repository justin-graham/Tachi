/**
 * Redis Caching Layer Service
 * Provides high-performance caching with Redis for improved application performance
 */

import { createLogger } from '../utils/logger.js';
import EventEmitter from 'events';

const logger = createLogger();

// Mock Redis implementation for development (replace with actual Redis in production)
class MockRedis {
  constructor() {
    this.data = new Map();
    this.expirations = new Map();
    this.connected = false;
  }

  async connect() {
    this.connected = true;
    logger.info('Mock Redis client connected');
  }

  async disconnect() {
    this.connected = false;
    this.data.clear();
    this.expirations.clear();
    logger.info('Mock Redis client disconnected');
  }

  async get(key) {
    if (!this.connected) throw new Error('Redis not connected');
    
    // Check expiration
    if (this.expirations.has(key)) {
      if (Date.now() > this.expirations.get(key)) {
        this.data.delete(key);
        this.expirations.delete(key);
        return null;
      }
    }
    
    return this.data.get(key) || null;
  }

  async set(key, value, options = {}) {
    if (!this.connected) throw new Error('Redis not connected');
    
    this.data.set(key, value);
    
    if (options.EX) {
      this.expirations.set(key, Date.now() + (options.EX * 1000));
    }
    
    return 'OK';
  }

  async del(key) {
    if (!this.connected) throw new Error('Redis not connected');
    
    const deleted = this.data.has(key) ? 1 : 0;
    this.data.delete(key);
    this.expirations.delete(key);
    return deleted;
  }

  async exists(key) {
    if (!this.connected) throw new Error('Redis not connected');
    return this.data.has(key) ? 1 : 0;
  }

  async expire(key, seconds) {
    if (!this.connected) throw new Error('Redis not connected');
    if (this.data.has(key)) {
      this.expirations.set(key, Date.now() + (seconds * 1000));
      return 1;
    }
    return 0;
  }

  async ttl(key) {
    if (!this.connected) throw new Error('Redis not connected');
    if (!this.expirations.has(key)) return -1;
    const remaining = Math.ceil((this.expirations.get(key) - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async flushall() {
    if (!this.connected) throw new Error('Redis not connected');
    this.data.clear();
    this.expirations.clear();
    return 'OK';
  }

  async keys(pattern) {
    if (!this.connected) throw new Error('Redis not connected');
    const keys = Array.from(this.data.keys());
    if (pattern === '*') return keys;
    
    // Simple pattern matching
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return keys.filter(key => regex.test(key));
  }

  async info() {
    if (!this.connected) throw new Error('Redis not connected');
    return `# Server\\nredis_version:7.0.0-mock\\n# Memory\\nused_memory:${this.data.size * 100}\\n`;
  }

  ping() {
    return this.connected ? 'PONG' : Promise.reject(new Error('Redis not connected'));
  }
}

export class CacheService extends EventEmitter {
  constructor() {
    super();
    this.redis = null;
    this.isConnected = false;
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || null,
      db: parseInt(process.env.REDIS_DB) || 0,
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'tachi:',
      defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL) || 3600, // 1 hour
      maxRetries: parseInt(process.env.REDIS_MAX_RETRIES) || 3,
      retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY) || 100,
      enableOfflineQueue: process.env.REDIS_ENABLE_OFFLINE_QUEUE === 'true',
      lazyConnect: process.env.REDIS_LAZY_CONNECT !== 'false'
    };

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalRequests: 0
    };

    this.initializeCache();
  }

  /**
   * Initialize Redis connection
   */
  async initializeCache() {
    try {
      logger.info('🔧 Initializing Redis cache service...');

      // Use mock Redis for development/testing, real Redis for production
      if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
        // In production, you would initialize actual Redis client here
        // const Redis = (await import('ioredis')).default;
        // this.redis = new Redis(process.env.REDIS_URL, this.config);
        
        // For now, use mock Redis
        this.redis = new MockRedis();
        logger.warn('⚠️ Using mock Redis - configure real Redis for production');
      } else {
        this.redis = new MockRedis();
        logger.info('📝 Using mock Redis for development');
      }

      // Set up event listeners
      this.setupEventListeners();

      // Connect to Redis
      await this.redis.connect();
      this.isConnected = true;

      // Test connection
      await this.testConnection();

      logger.info('✅ Redis cache service initialized successfully');
      this.emit('cache:connected');

    } catch (error) {
      logger.error('❌ Failed to initialize Redis cache:', error);
      this.emit('cache:error', error);
      throw error;
    }
  }

  /**
   * Set up Redis event listeners
   */
  setupEventListeners() {
    // Connection events would be set up here for real Redis
    // For mock Redis, we'll simulate them
    
    setTimeout(() => {
      this.emit('cache:ready');
    }, 100);
  }

  /**
   * Test Redis connection
   */
  async testConnection() {
    try {
      const response = await this.redis.ping();
      if (response === 'PONG') {
        logger.debug('✅ Redis connection test passed');
        return true;
      } else {
        throw new Error(`Unexpected ping response: ${response}`);
      }
    } catch (error) {
      logger.error('❌ Redis connection test failed:', error);
      throw error;
    }
  }

  /**
   * Get value from cache
   */
  async get(key, options = {}) {
    const fullKey = this.buildKey(key);
    
    try {
      this.stats.totalRequests++;
      const value = await this.redis.get(fullKey);
      
      if (value !== null) {
        this.stats.hits++;
        this.emit('cache:hit', { key: fullKey });
        
        // Parse JSON if requested
        if (options.parseJson && typeof value === 'string') {
          try {
            return JSON.parse(value);
          } catch (parseError) {
            logger.warn(`Failed to parse JSON for key ${fullKey}:`, parseError);
            return value;
          }
        }
        
        return value;
      } else {
        this.stats.misses++;
        this.emit('cache:miss', { key: fullKey });
        return null;
      }
      
    } catch (error) {
      this.stats.errors++;
      logger.error(`Cache get error for key ${fullKey}:`, error);
      this.emit('cache:error', { operation: 'get', key: fullKey, error });
      
      if (options.fallback) {
        return options.fallback;
      }
      
      throw error;
    }
  }

  /**
   * Set value in cache
   */
  async set(key, value, options = {}) {
    const fullKey = this.buildKey(key);
    
    try {
      this.stats.totalRequests++;
      
      // Serialize value if it's an object
      let serializedValue = value;
      if (typeof value === 'object' && value !== null) {
        serializedValue = JSON.stringify(value);
      }
      
      const setOptions = {};
      
      // Set TTL
      if (options.ttl) {
        setOptions.EX = options.ttl;
      } else if (this.config.defaultTTL) {
        setOptions.EX = this.config.defaultTTL;
      }
      
      // Set NX (only if not exists) or XX (only if exists)
      if (options.nx) setOptions.NX = true;
      if (options.xx) setOptions.XX = true;
      
      const result = await this.redis.set(fullKey, serializedValue, setOptions);
      
      if (result === 'OK') {
        this.stats.sets++;
        this.emit('cache:set', { key: fullKey, ttl: setOptions.EX });
        return true;
      }
      
      return false;
      
    } catch (error) {
      this.stats.errors++;
      logger.error(`Cache set error for key ${fullKey}:`, error);
      this.emit('cache:error', { operation: 'set', key: fullKey, error });
      throw error;
    }
  }

  /**
   * Delete value from cache
   */
  async del(key) {
    const fullKey = this.buildKey(key);
    
    try {
      this.stats.totalRequests++;
      const result = await this.redis.del(fullKey);
      
      if (result > 0) {
        this.stats.deletes++;
        this.emit('cache:delete', { key: fullKey });
      }
      
      return result > 0;
      
    } catch (error) {
      this.stats.errors++;
      logger.error(`Cache delete error for key ${fullKey}:`, error);
      this.emit('cache:error', { operation: 'delete', key: fullKey, error });
      throw error;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    const fullKey = this.buildKey(key);
    
    try {
      this.stats.totalRequests++;
      const result = await this.redis.exists(fullKey);
      return result > 0;
      
    } catch (error) {
      this.stats.errors++;
      logger.error(`Cache exists error for key ${fullKey}:`, error);
      this.emit('cache:error', { operation: 'exists', key: fullKey, error });
      throw error;
    }
  }

  /**
   * Set TTL for existing key
   */
  async expire(key, seconds) {
    const fullKey = this.buildKey(key);
    
    try {
      this.stats.totalRequests++;
      const result = await this.redis.expire(fullKey, seconds);
      return result > 0;
      
    } catch (error) {
      this.stats.errors++;
      logger.error(`Cache expire error for key ${fullKey}:`, error);
      this.emit('cache:error', { operation: 'expire', key: fullKey, error });
      throw error;
    }
  }

  /**
   * Get TTL for key
   */
  async ttl(key) {
    const fullKey = this.buildKey(key);
    
    try {
      this.stats.totalRequests++;
      return await this.redis.ttl(fullKey);
      
    } catch (error) {
      this.stats.errors++;
      logger.error(`Cache TTL error for key ${fullKey}:`, error);
      this.emit('cache:error', { operation: 'ttl', key: fullKey, error });
      throw error;
    }
  }

  /**
   * Get or set pattern - retrieve from cache or execute function and cache result
   */
  async getOrSet(key, fetchFunction, options = {}) {
    try {
      // Try to get from cache first
      const cachedValue = await this.get(key, { parseJson: true });
      
      if (cachedValue !== null) {
        return cachedValue;
      }
      
      // Not in cache, execute function
      const freshValue = await fetchFunction();
      
      // Cache the result
      await this.set(key, freshValue, options);
      
      return freshValue;
      
    } catch (error) {
      logger.error(`Cache getOrSet error for key ${key}:`, error);
      
      // If caching fails, still return the fresh value
      if (error.message && error.message.includes('Cache')) {
        try {
          return await fetchFunction();
        } catch (fetchError) {
          throw fetchError;
        }
      }
      
      throw error;
    }
  }

  /**
   * Increment/decrement operations
   */
  async incr(key, amount = 1) {
    const fullKey = this.buildKey(key);
    
    try {
      this.stats.totalRequests++;
      
      // For mock Redis, implement manually
      const current = await this.redis.get(fullKey);
      const newValue = (parseInt(current) || 0) + amount;
      await this.redis.set(fullKey, newValue.toString());
      
      return newValue;
      
    } catch (error) {
      this.stats.errors++;
      logger.error(`Cache increment error for key ${fullKey}:`, error);
      this.emit('cache:error', { operation: 'incr', key: fullKey, error });
      throw error;
    }
  }

  /**
   * Cache invalidation patterns
   */
  async invalidatePattern(pattern) {
    try {
      const keys = await this.redis.keys(this.buildKey(pattern));
      
      if (keys.length > 0) {
        const deletePromises = keys.map(key => this.redis.del(key));
        await Promise.all(deletePromises);
        
        logger.info(`Invalidated ${keys.length} keys matching pattern: ${pattern}`);
        this.emit('cache:invalidate', { pattern, count: keys.length });
        
        return keys.length;
      }
      
      return 0;
      
    } catch (error) {
      this.stats.errors++;
      logger.error(`Cache invalidation error for pattern ${pattern}:`, error);
      this.emit('cache:error', { operation: 'invalidatePattern', pattern, error });
      throw error;
    }
  }

  /**
   * Batch operations
   */
  async mget(keys) {
    try {
      this.stats.totalRequests += keys.length;
      
      const fullKeys = keys.map(key => this.buildKey(key));
      const promises = fullKeys.map(key => this.redis.get(key));
      const results = await Promise.all(promises);
      
      // Count hits and misses
      results.forEach(result => {
        if (result !== null) {
          this.stats.hits++;
        } else {
          this.stats.misses++;
        }
      });
      
      return results;
      
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache mget error:', error);
      this.emit('cache:error', { operation: 'mget', keys, error });
      throw error;
    }
  }

  /**
   * Build cache key with prefix
   */
  buildKey(key) {
    return `${this.config.keyPrefix}${key}`;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.totalRequests > 0 ? 
      (this.stats.hits / this.stats.totalRequests) * 100 : 0;
    
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      isConnected: this.isConnected,
      config: {
        host: this.config.host,
        port: this.config.port,
        db: this.config.db,
        keyPrefix: this.config.keyPrefix,
        defaultTTL: this.config.defaultTTL
      }
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const start = Date.now();
      await this.redis.ping();
      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        responseTime,
        isConnected: this.isConnected,
        stats: this.getStats()
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        isConnected: false
      };
    }
  }

  /**
   * Clear all cache
   */
  async flush() {
    try {
      await this.redis.flushall();
      
      // Reset stats
      this.stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0,
        totalRequests: 0
      };
      
      logger.info('Cache flushed successfully');
      this.emit('cache:flush');
      
      return true;
      
    } catch (error) {
      logger.error('Cache flush error:', error);
      this.emit('cache:error', { operation: 'flush', error });
      throw error;
    }
  }

  /**
   * Get cache info
   */
  async getInfo() {
    try {
      const info = await this.redis.info();
      return {
        redis: info,
        stats: this.getStats(),
        config: this.config
      };
      
    } catch (error) {
      logger.error('Cache info error:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    try {
      if (this.redis && this.isConnected) {
        await this.redis.disconnect();
        this.isConnected = false;
        logger.info('Redis cache disconnected');
        this.emit('cache:disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
      throw error;
    }
  }
}

// Commonly used cache key patterns and TTLs
export const CacheKeys = {
  // User data
  USER_PROFILE: (userId) => `user:profile:${userId}`,
  USER_PERMISSIONS: (userId) => `user:permissions:${userId}`,
  
  // API responses
  API_RESPONSE: (endpoint, params) => `api:${endpoint}:${Buffer.from(JSON.stringify(params)).toString('base64')}`,
  
  // Database queries
  DB_QUERY: (queryHash) => `db:query:${queryHash}`,
  
  // Business data
  PUBLISHER_PROFILE: (publisherId) => `publisher:${publisherId}`,
  CRAWLER_PROFILE: (crawlerId) => `crawler:${crawlerId}`,
  DOMAIN_PRICING: (domain) => `pricing:${domain}`,
  
  // Aggregated data
  ANALYTICS: (type, params) => `analytics:${type}:${Buffer.from(JSON.stringify(params)).toString('base64')}`,
  
  // System data
  SYSTEM_HEALTH: () => 'system:health',
  RATE_LIMIT: (userId, endpoint) => `rate_limit:${userId}:${endpoint}`,
  
  // Content protection
  URL_SAFETY: (urlHash) => `safety:${urlHash}`,
  CONTENT_ANALYSIS: (contentHash) => `content:${contentHash}`
};

export const CacheTTL = {
  VERY_SHORT: 60,        // 1 minute
  SHORT: 300,            // 5 minutes
  MEDIUM: 1800,          // 30 minutes
  LONG: 3600,            // 1 hour
  VERY_LONG: 86400,      // 24 hours
  WEEK: 604800,          // 7 days
  MONTH: 2592000         // 30 days
};

// Create singleton instance
export const cacheService = new CacheService();

// Auto-initialize cache service
cacheService.on('cache:error', (error) => {
  logger.error('Cache service error:', error);
});

cacheService.on('cache:connected', () => {
  logger.info('Cache service connected and ready');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, disconnecting cache...');
  await cacheService.disconnect();
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, disconnecting cache...');
  await cacheService.disconnect();
});

export default cacheService;