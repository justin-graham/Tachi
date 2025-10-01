import { getUsageControlService } from '../services/usage-control.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();
const usageControl = getUsageControlService();

// Initialize usage control service
usageControl.initialize().catch(error => {
  logger.error('Failed to initialize usage control service:', error);
});

export const rateLimitMiddleware = (identifierType = 'user') => {
  return async (req, res, next) => {
    try {
      // Determine identifier based on type
      let identifier;
      
      switch (identifierType) {
        case 'user':
          identifier = req.user?.id || req.user?.userId;
          break;
        case 'apiKey':
          identifier = req.apiKey?.id || req.headers['x-api-key'];
          break;
        case 'ip':
          identifier = req.ip || req.connection.remoteAddress;
          break;
        default:
          identifier = req.user?.id || req.ip;
      }
      
      if (!identifier) {
        return res.status(401).json({
          success: false,
          error: 'Unable to identify request for rate limiting'
        });
      }
      
      // Check rate limits
      const rateLimitResult = await usageControl.checkRateLimit(identifier, identifierType);
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit-Minute': rateLimitResult.limits.requestsPerMinute.toString(),
        'X-RateLimit-Limit-Hour': rateLimitResult.limits.requestsPerHour.toString(),
        'X-RateLimit-Limit-Day': rateLimitResult.limits.requestsPerDay.toString(),
        'X-RateLimit-Remaining-Minute': (rateLimitResult.limits.requestsPerMinute - rateLimitResult.usage.requestsThisMinute).toString(),
        'X-RateLimit-Remaining-Hour': (rateLimitResult.limits.requestsPerHour - rateLimitResult.usage.requestsThisHour).toString(),
        'X-RateLimit-Remaining-Day': (rateLimitResult.limits.requestsPerDay - rateLimitResult.usage.requestsThisDay).toString()
      });
      
      // Store rate limit info for use in other middleware
      req.rateLimit = rateLimitResult;
      
      next();
      
    } catch (error) {
      logger.warn('Rate limit exceeded', {
        identifier: identifierType === 'ip' ? req.ip : identifier,
        identifierType,
        error: error.message
      });
      
      // Parse error for specific violation info
      if (error.message.includes('Rate limit exceeded')) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          message: error.message,
          retryAfter: 60 // Default retry after 60 seconds
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Rate limiting service error'
      });
    }
  };
};

export const quotaMiddleware = (tierExtractor = null) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id || req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required for quota check'
        });
      }
      
      // Determine user tier
      let userTier = 'free';
      if (tierExtractor && typeof tierExtractor === 'function') {
        userTier = tierExtractor(req);
      } else if (req.user?.tier) {
        userTier = req.user.tier;
      } else if (req.user?.subscription?.tier) {
        userTier = req.user.subscription.tier;
      }
      
      // Estimate data usage (can be improved with actual content length)
      const estimatedDataUsageMB = 0.1; // 100KB default estimate
      
      // Check quotas
      const quotaResult = await usageControl.checkQuota(userId, userTier, estimatedDataUsageMB);
      
      // Add quota headers
      res.set({
        'X-Quota-Limit-Requests': quotaResult.quota.requestsPerMonth.toString(),
        'X-Quota-Limit-Data': quotaResult.quota.dataTransferMB.toString(),
        'X-Quota-Limit-Concurrent': quotaResult.quota.concurrentRequests.toString(),
        'X-Quota-Used-Requests': quotaResult.usage.requestsThisMonth.toString(),
        'X-Quota-Used-Data': quotaResult.usage.dataTransferThisMonth.toString(),
        'X-Quota-Used-Concurrent': quotaResult.usage.activeRequests.toString()
      });
      
      // Store quota info for use in other middleware
      req.quota = quotaResult;
      req.userTier = userTier;
      
      next();
      
    } catch (error) {
      logger.warn('Quota exceeded', {
        userId: req.user?.id,
        error: error.message
      });
      
      if (error.message.includes('Quota exceeded')) {
        return res.status(402).json({
          success: false,
          error: 'Quota exceeded',
          message: error.message,
          upgradeRequired: true
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Quota service error'
      });
    }
  };
};

export const throttleMiddleware = (priorityExtractor = null) => {
  return async (req, res, next) => {
    try {
      const identifier = req.user?.id || req.ip || 'anonymous';
      
      // Determine request priority
      let priority = 0;
      if (priorityExtractor && typeof priorityExtractor === 'function') {
        priority = priorityExtractor(req);
      } else if (req.user?.tier) {
        // Higher tier users get higher priority
        const tierPriority = {
          free: 0,
          basic: 1,
          premium: 2,
          enterprise: 3
        };
        priority = tierPriority[req.user.tier] || 0;
      }
      
      // Apply throttling
      const throttleResult = await usageControl.throttleRequest(identifier, priority);
      
      if (throttleResult.delay > 0) {
        // Add throttling headers
        res.set({
          'X-Throttle-Delay': throttleResult.delay.toString(),
          'X-Throttle-Queue-Position': throttleResult.queuePosition.toString()
        });
        
        // Wait for the delay
        await new Promise(resolve => setTimeout(resolve, throttleResult.delay));
      }
      
      // Store throttle info and ensure cleanup
      req.throttle = throttleResult;
      
      // Cleanup on response finish
      res.on('finish', () => {
        if (throttleResult.requestId) {
          usageControl.releaseThrottledRequest(identifier, throttleResult.requestId)
            .catch(error => logger.error('Failed to release throttled request:', error));
        }
      });
      
      next();
      
    } catch (error) {
      logger.error('Throttling middleware error:', error);
      
      if (error.message.includes('queue is full')) {
        return res.status(503).json({
          success: false,
          error: 'Service temporarily unavailable',
          message: 'Request queue is full, please try again later'
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Throttling service error'
      });
    }
  };
};

export const requestTrackingMiddleware = () => {
  return (req, res, next) => {
    try {
      const userId = req.user?.id || req.user?.userId;
      
      if (userId) {
        const requestId = usageControl.generateRequestId();
        const metadata = {
          path: req.path,
          method: req.method,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        };
        
        // Track active request
        usageControl.trackActiveRequest(userId, requestId, metadata);
        
        // Store request ID for cleanup
        req.requestTrackingId = requestId;
        
        // Cleanup on response finish
        res.on('finish', () => {
          const dataUsageMB = res.get('Content-Length') 
            ? parseInt(res.get('Content-Length')) / (1024 * 1024)
            : 0;
          
          usageControl.releaseActiveRequest(requestId, dataUsageMB);
        });
        
        // Cleanup on error
        res.on('error', () => {
          usageControl.releaseActiveRequest(requestId, 0);
        });
      }
      
      next();
      
    } catch (error) {
      logger.error('Request tracking middleware error:', error);
      // Don't block the request, just continue
      next();
    }
  };
};

export const usageControlHealthMiddleware = () => {
  return async (req, res, next) => {
    try {
      const health = usageControl.getHealth();
      
      // Add health info to response headers for monitoring
      res.set({
        'X-Usage-Control-Status': health.status,
        'X-Usage-Control-Active-Requests': health.activeRequests.toString()
      });
      
      // If service is unhealthy, consider rejecting requests
      if (health.status === 'unhealthy') {
        logger.warn('Usage control service is unhealthy', health);
        
        // Only reject new requests if severely overloaded
        if (health.activeRequests > 10000) {
          return res.status(503).json({
            success: false,
            error: 'Service temporarily overloaded',
            message: 'Please try again later'
          });
        }
      }
      
      next();
      
    } catch (error) {
      logger.error('Usage control health middleware error:', error);
      // Don't block requests on health check errors
      next();
    }
  };
};

// Combined middleware for full usage control
export const fullUsageControlMiddleware = (options = {}) => {
  const {
    identifierType = 'user',
    enableQuotas = true,
    enableThrottling = true,
    enableTracking = true,
    tierExtractor = null,
    priorityExtractor = null
  } = options;
  
  const middlewares = [
    usageControlHealthMiddleware(),
    rateLimitMiddleware(identifierType)
  ];
  
  if (enableQuotas) {
    middlewares.push(quotaMiddleware(tierExtractor));
  }
  
  if (enableThrottling) {
    middlewares.push(throttleMiddleware(priorityExtractor));
  }
  
  if (enableTracking) {
    middlewares.push(requestTrackingMiddleware());
  }
  
  return middlewares;
};

export default {
  rateLimit: rateLimitMiddleware,
  quota: quotaMiddleware,
  throttle: throttleMiddleware,
  tracking: requestTrackingMiddleware,
  health: usageControlHealthMiddleware,
  full: fullUsageControlMiddleware
};