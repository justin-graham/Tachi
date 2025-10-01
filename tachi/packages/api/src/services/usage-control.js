import { createLogger } from '../utils/logger.js';
import { EventEmitter } from 'events';
import { getCacheService } from './cache.js';

const logger = createLogger();

export class UsageControlService extends EventEmitter {
  constructor() {
    super();
    this.isInitialized = false;
    this.config = {
      // Rate limiting configuration
      rateLimits: {
        // Per-user limits
        user: {
          requestsPerMinute: parseInt(process.env.USER_RATE_LIMIT_PER_MINUTE) || 60,
          requestsPerHour: parseInt(process.env.USER_RATE_LIMIT_PER_HOUR) || 1000,
          requestsPerDay: parseInt(process.env.USER_RATE_LIMIT_PER_DAY) || 10000,
          burstLimit: parseInt(process.env.USER_BURST_LIMIT) || 10
        },
        
        // Per-API key limits
        apiKey: {
          requestsPerMinute: parseInt(process.env.API_KEY_RATE_LIMIT_PER_MINUTE) || 100,
          requestsPerHour: parseInt(process.env.API_KEY_RATE_LIMIT_PER_HOUR) || 5000,
          requestsPerDay: parseInt(process.env.API_KEY_RATE_LIMIT_PER_DAY) || 50000,
          burstLimit: parseInt(process.env.API_KEY_BURST_LIMIT) || 20
        },
        
        // Per-IP limits (fallback)
        ip: {
          requestsPerMinute: parseInt(process.env.IP_RATE_LIMIT_PER_MINUTE) || 30,
          requestsPerHour: parseInt(process.env.IP_RATE_LIMIT_PER_HOUR) || 500,
          requestsPerDay: parseInt(process.env.IP_RATE_LIMIT_PER_DAY) || 2000,
          burstLimit: parseInt(process.env.IP_BURST_LIMIT) || 5
        }
      },
      
      // Usage quotas
      quotas: {
        // Free tier limits
        free: {
          requestsPerMonth: parseInt(process.env.FREE_TIER_MONTHLY_QUOTA) || 1000,
          dataTransferMB: parseInt(process.env.FREE_TIER_DATA_QUOTA) || 100,
          concurrentRequests: parseInt(process.env.FREE_TIER_CONCURRENT_LIMIT) || 2
        },
        
        // Paid tier limits
        basic: {
          requestsPerMonth: parseInt(process.env.BASIC_TIER_MONTHLY_QUOTA) || 10000,
          dataTransferMB: parseInt(process.env.BASIC_TIER_DATA_QUOTA) || 1000,
          concurrentRequests: parseInt(process.env.BASIC_TIER_CONCURRENT_LIMIT) || 5
        },
        
        // Premium tier limits
        premium: {
          requestsPerMonth: parseInt(process.env.PREMIUM_TIER_MONTHLY_QUOTA) || 100000,
          dataTransferMB: parseInt(process.env.PREMIUM_TIER_DATA_QUOTA) || 10000,
          concurrentRequests: parseInt(process.env.PREMIUM_TIER_CONCURRENT_LIMIT) || 20
        },
        
        // Enterprise tier limits
        enterprise: {
          requestsPerMonth: parseInt(process.env.ENTERPRISE_TIER_MONTHLY_QUOTA) || 1000000,
          dataTransferMB: parseInt(process.env.ENTERPRISE_TIER_DATA_QUOTA) || 100000,
          concurrentRequests: parseInt(process.env.ENTERPRISE_TIER_CONCURRENT_LIMIT) || 100
        }
      },
      
      // Throttling settings
      throttling: {
        enabled: process.env.THROTTLING_ENABLED !== 'false',
        queueSize: parseInt(process.env.THROTTLING_QUEUE_SIZE) || 1000,
        timeoutMs: parseInt(process.env.THROTTLING_TIMEOUT_MS) || 30000
      }
    };
    
    // Tracking data structures
    this.cache = getCacheService();
    this.usageData = new Map();
    this.requestQueues = new Map();
    this.activeRequests = new Map();
    
    // Statistics
    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      throttledRequests: 0,
      quotaViolations: 0,
      rateLimitViolations: 0,
      lastReset: new Date()
    };
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      logger.info('Initializing usage control service...');
      
      // Initialize cache service
      await this.cache.initialize();
      
      // Set up cleanup intervals
      this.setupCleanupIntervals();
      
      this.isInitialized = true;
      this.emit('initialized');
      
      logger.info('Usage control service initialized successfully', {
        rateLimits: this.config.rateLimits,
        quotas: Object.keys(this.config.quotas),
        throttlingEnabled: this.config.throttling.enabled
      });
      
    } catch (error) {
      logger.error('Failed to initialize usage control service:', error);
      throw error;
    }
  }

  setupCleanupIntervals() {
    // Clean up usage data every 5 minutes
    setInterval(() => {
      this.cleanupUsageData();
    }, 5 * 60 * 1000);
    
    // Clean up request queues every minute
    setInterval(() => {
      this.cleanupRequestQueues();
    }, 60 * 1000);
  }

  async checkRateLimit(identifier, identifierType = 'user') {
    const limits = this.config.rateLimits[identifierType] || this.config.rateLimits.user;
    const now = Date.now();
    
    // Get usage data from cache
    const usageKey = `usage:${identifierType}:${identifier}`;
    let usage = await this.cache.get(usageKey);
    
    if (!usage) {
      usage = {
        requests: [],
        lastReset: now,
        totalRequests: 0
      };
    }
    
    // Filter requests within time windows
    const minuteAgo = now - 60 * 1000;
    const hourAgo = now - 60 * 60 * 1000;
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const tenSecondsAgo = now - 10 * 1000;
    
    const recentRequests = usage.requests.filter(timestamp => timestamp > minuteAgo);
    const hourlyRequests = usage.requests.filter(timestamp => timestamp > hourAgo);
    const dailyRequests = usage.requests.filter(timestamp => timestamp > dayAgo);
    const burstRequests = usage.requests.filter(timestamp => timestamp > tenSecondsAgo);
    
    // Check rate limits
    const violations = [];
    
    if (recentRequests.length >= limits.requestsPerMinute) {
      violations.push({
        type: 'rate_limit_minute',
        limit: limits.requestsPerMinute,
        current: recentRequests.length,
        resetTime: recentRequests[0] + 60 * 1000
      });
    }
    
    if (hourlyRequests.length >= limits.requestsPerHour) {
      violations.push({
        type: 'rate_limit_hour',
        limit: limits.requestsPerHour,
        current: hourlyRequests.length,
        resetTime: hourlyRequests[0] + 60 * 60 * 1000
      });
    }
    
    if (dailyRequests.length >= limits.requestsPerDay) {
      violations.push({
        type: 'rate_limit_day',
        limit: limits.requestsPerDay,
        current: dailyRequests.length,
        resetTime: dailyRequests[0] + 24 * 60 * 60 * 1000
      });
    }
    
    if (burstRequests.length >= limits.burstLimit) {
      violations.push({
        type: 'burst_limit',
        limit: limits.burstLimit,
        current: burstRequests.length,
        resetTime: burstRequests[0] + 10 * 1000
      });
    }
    
    if (violations.length > 0) {
      this.stats.rateLimitViolations++;
      this.stats.blockedRequests++;
      
      this.emit('rateLimitExceeded', {
        identifier,
        identifierType,
        violations
      });
      
      throw new Error(`Rate limit exceeded: ${violations.map(v => v.type).join(', ')}`);
    }
    
    // Record the request
    usage.requests = [...recentRequests, now];
    usage.totalRequests++;
    usage.lastUpdated = now;
    
    // Save updated usage data
    await this.cache.set(usageKey, usage, { ttl: 24 * 60 * 60 }); // 24 hours
    
    return {
      allowed: true,
      limits: {
        requestsPerMinute: limits.requestsPerMinute,
        requestsPerHour: limits.requestsPerHour,
        requestsPerDay: limits.requestsPerDay,
        burstLimit: limits.burstLimit
      },
      usage: {
        requestsThisMinute: recentRequests.length + 1,
        requestsThisHour: hourlyRequests.length + 1,
        requestsThisDay: dailyRequests.length + 1,
        totalRequests: usage.totalRequests
      }
    };
  }

  async checkQuota(userId, userTier = 'free', dataUsageMB = 0) {
    const quota = this.config.quotas[userTier] || this.config.quotas.free;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get monthly usage from cache
    const quotaKey = `quota:${userId}:${monthStart.toISOString().substring(0, 7)}`;
    let monthlyUsage = await this.cache.get(quotaKey);
    
    if (!monthlyUsage) {
      monthlyUsage = {
        requests: 0,
        dataTransferMB: 0,
        monthStart: monthStart.toISOString(),
        lastUpdated: now.toISOString()
      };
    }
    
    // Check quota violations
    const violations = [];
    
    if (monthlyUsage.requests >= quota.requestsPerMonth) {
      violations.push({
        type: 'monthly_request_quota',
        limit: quota.requestsPerMonth,
        current: monthlyUsage.requests,
        resetTime: new Date(now.getFullYear(), now.getMonth() + 1, 1)
      });
    }
    
    if (monthlyUsage.dataTransferMB + dataUsageMB >= quota.dataTransferMB) {
      violations.push({
        type: 'monthly_data_quota',
        limit: quota.dataTransferMB,
        current: monthlyUsage.dataTransferMB + dataUsageMB,
        resetTime: new Date(now.getFullYear(), now.getMonth() + 1, 1)
      });
    }
    
    // Check concurrent request limit
    const activeRequestCount = this.getActiveRequestCount(userId);
    if (activeRequestCount >= quota.concurrentRequests) {
      violations.push({
        type: 'concurrent_request_limit',
        limit: quota.concurrentRequests,
        current: activeRequestCount,
        resetTime: null // No specific reset time for concurrent limits
      });
    }
    
    if (violations.length > 0) {
      this.stats.quotaViolations++;
      this.stats.blockedRequests++;
      
      this.emit('quotaExceeded', {
        userId,
        userTier,
        violations
      });
      
      throw new Error(`Quota exceeded: ${violations.map(v => v.type).join(', ')}`);
    }
    
    // Update usage
    monthlyUsage.requests++;
    monthlyUsage.dataTransferMB += dataUsageMB;
    monthlyUsage.lastUpdated = now.toISOString();
    
    // Save updated quota data
    const ttl = Math.ceil((new Date(now.getFullYear(), now.getMonth() + 1, 1) - now) / 1000);
    await this.cache.set(quotaKey, monthlyUsage, { ttl });
    
    return {
      allowed: true,
      quota: {
        requestsPerMonth: quota.requestsPerMonth,
        dataTransferMB: quota.dataTransferMB,
        concurrentRequests: quota.concurrentRequests
      },
      usage: {
        requestsThisMonth: monthlyUsage.requests,
        dataTransferThisMonth: monthlyUsage.dataTransferMB,
        activeRequests: activeRequestCount
      }
    };
  }

  async throttleRequest(identifier, priority = 0) {
    if (!this.config.throttling.enabled) {
      return { allowed: true, delay: 0 };
    }
    
    const queueKey = `throttle:${identifier}`;
    let queue = this.requestQueues.get(queueKey) || [];
    
    // Check queue size
    if (queue.length >= this.config.throttling.queueSize) {
      this.stats.blockedRequests++;
      throw new Error('Request queue is full');
    }
    
    const requestId = this.generateRequestId();
    const request = {
      id: requestId,
      timestamp: Date.now(),
      priority,
      identifier
    };
    
    // Add to queue
    queue.push(request);
    queue.sort((a, b) => b.priority - a.priority || a.timestamp - b.timestamp);
    this.requestQueues.set(queueKey, queue);
    
    // Calculate delay
    const position = queue.findIndex(r => r.id === requestId);
    const delay = position * 100; // 100ms per position
    
    if (delay > 0) {
      this.stats.throttledRequests++;
      
      this.emit('requestThrottled', {
        identifier,
        requestId,
        delay,
        queuePosition: position
      });
    }
    
    return { allowed: true, delay, requestId, queuePosition: position };
  }

  async releaseThrottledRequest(identifier, requestId) {
    const queueKey = `throttle:${identifier}`;
    let queue = this.requestQueues.get(queueKey) || [];
    
    // Remove request from queue
    queue = queue.filter(r => r.id !== requestId);
    this.requestQueues.set(queueKey, queue);
    
    return { released: true };
  }

  trackActiveRequest(userId, requestId, metadata = {}) {
    const request = {
      id: requestId,
      userId,
      startTime: Date.now(),
      metadata
    };
    
    this.activeRequests.set(requestId, request);
    this.stats.totalRequests++;
    
    this.emit('requestStarted', {
      userId,
      requestId,
      metadata
    });
  }

  releaseActiveRequest(requestId, dataUsageMB = 0) {
    const request = this.activeRequests.get(requestId);
    
    if (request) {
      const duration = Date.now() - request.startTime;
      
      this.activeRequests.delete(requestId);
      
      this.emit('requestCompleted', {
        userId: request.userId,
        requestId,
        duration,
        dataUsageMB,
        metadata: request.metadata
      });
      
      return { released: true, duration, dataUsageMB };
    }
    
    return { released: false };
  }

  getActiveRequestCount(userId) {
    return Array.from(this.activeRequests.values())
      .filter(request => request.userId === userId).length;
  }

  generateRequestId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  cleanupUsageData() {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    
    for (const [key, data] of this.usageData) {
      if (data.lastUpdated < cutoff) {
        this.usageData.delete(key);
      }
    }
  }

  cleanupRequestQueues() {
    const cutoff = Date.now() - this.config.throttling.timeoutMs;
    
    for (const [key, queue] of this.requestQueues) {
      const filteredQueue = queue.filter(request => request.timestamp > cutoff);
      
      if (filteredQueue.length === 0) {
        this.requestQueues.delete(key);
      } else {
        this.requestQueues.set(key, filteredQueue);
      }
    }
  }

  async getUserUsageStats(userId, timeframe = '24h') {
    const now = Date.now();
    let cutoff;
    
    switch (timeframe) {
      case '1h':
        cutoff = now - 60 * 60 * 1000;
        break;
      case '24h':
        cutoff = now - 24 * 60 * 60 * 1000;
        break;
      case '7d':
        cutoff = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        cutoff = now - 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        cutoff = now - 24 * 60 * 60 * 1000;
    }
    
    // Get usage data from cache
    const usageKey = `usage:user:${userId}`;
    const usage = await this.cache.get(usageKey);
    
    if (!usage) {
      return {
        timeframe,
        requests: 0,
        dataTransferMB: 0,
        averageResponseTime: 0,
        activeRequests: this.getActiveRequestCount(userId)
      };
    }
    
    const recentRequests = usage.requests.filter(timestamp => timestamp > cutoff);
    
    return {
      timeframe,
      requests: recentRequests.length,
      dataTransferMB: usage.dataTransferMB || 0,
      averageResponseTime: usage.averageResponseTime || 0,
      activeRequests: this.getActiveRequestCount(userId),
      lastRequest: recentRequests.length > 0 ? Math.max(...recentRequests) : null
    };
  }

  getServiceStats() {
    return {
      ...this.stats,
      activeRequests: this.activeRequests.size,
      requestQueues: this.requestQueues.size,
      usageDataEntries: this.usageData.size,
      throttlingEnabled: this.config.throttling.enabled,
      rateLimitTiers: Object.keys(this.config.rateLimits),
      quotaTiers: Object.keys(this.config.quotas)
    };
  }

  getHealth() {
    const activeRequestCount = this.activeRequests.size;
    const queueCount = this.requestQueues.size;
    
    let status = 'healthy';
    if (activeRequestCount > 1000 || queueCount > 100) {
      status = 'degraded';
    }
    if (activeRequestCount > 5000 || queueCount > 500) {
      status = 'unhealthy';
    }
    
    return {
      status,
      activeRequests: activeRequestCount,
      requestQueues: queueCount,
      rateLimitViolations: this.stats.rateLimitViolations,
      quotaViolations: this.stats.quotaViolations,
      throttlingEnabled: this.config.throttling.enabled,
      cacheConnected: this.cache.isInitialized
    };
  }

  async resetUserUsage(userId, timeframe = 'all') {
    const cacheKeys = [];
    
    if (timeframe === 'all' || timeframe === 'rate_limits') {
      cacheKeys.push(`usage:user:${userId}`);
    }
    
    if (timeframe === 'all' || timeframe === 'quotas') {
      const now = new Date();
      const monthKey = `quota:${userId}:${now.toISOString().substring(0, 7)}`;
      cacheKeys.push(monthKey);
    }
    
    for (const key of cacheKeys) {
      await this.cache.delete(key);
    }
    
    // Clear active requests for user
    for (const [requestId, request] of this.activeRequests) {
      if (request.userId === userId) {
        this.activeRequests.delete(requestId);
      }
    }
    
    logger.info(`Reset usage data for user ${userId}`, { timeframe, keysCleared: cacheKeys.length });
    
    return { reset: true, timeframe, keysCleared: cacheKeys.length };
  }
}

// Singleton instance
let usageControlInstance = null;

export const getUsageControlService = () => {
  if (!usageControlInstance) {
    usageControlInstance = new UsageControlService();
  }
  return usageControlInstance;
};

export default getUsageControlService();