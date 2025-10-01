import express from 'express';
import { getUsageControlService } from '../services/usage-control.js';
import { createLogger } from '../utils/logger.js';
import { authenticateToken } from '../middleware/auth-secure.js';
import { apiRateLimit } from '../middleware/rate-limit-auth.js';

const router = express.Router();
const logger = createLogger();
const usageControl = getUsageControlService();

// GET /api/usage-control/health - Get usage control service health
router.get('/health', async (req, res) => {
  try {
    const health = usageControl.getHealth();
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health
    });
    
  } catch (error) {
    logger.error('Failed to get usage control health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve usage control health status'
    });
  }
});

// GET /api/usage-control/stats - Get service statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = usageControl.getServiceStats();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    logger.error('Failed to get usage control stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve usage control statistics'
    });
  }
});

// GET /api/usage-control/user/:userId/usage - Get user usage statistics
router.get('/user/:userId/usage', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeframe = '24h' } = req.query;
    
    // Check if user can access this data (self or admin)
    if (req.user.id !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const usage = await usageControl.getUserUsageStats(userId, timeframe);
    
    res.json({
      success: true,
      data: usage
    });
    
  } catch (error) {
    logger.error('Failed to get user usage stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user usage statistics'
    });
  }
});

// GET /api/usage-control/user/:userId/limits - Get user rate limits and quotas
router.get('/user/:userId/limits', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user can access this data (self or admin)
    if (req.user.id !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // Get user tier
    const userTier = req.user.tier || req.user.subscription?.tier || 'free';
    
    const limits = {
      rateLimits: usageControl.config.rateLimits.user,
      quotas: usageControl.config.quotas[userTier],
      tier: userTier,
      throttlingEnabled: usageControl.config.throttling.enabled
    };
    
    res.json({
      success: true,
      data: limits
    });
    
  } catch (error) {
    logger.error('Failed to get user limits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user limits'
    });
  }
});

// POST /api/usage-control/user/:userId/reset - Reset user usage (admin only)
router.post('/user/:userId/reset', authenticateToken, apiRateLimit, async (req, res) => {
  try {
    // Check admin permissions
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const { userId } = req.params;
    const { timeframe = 'all' } = req.body;
    
    const result = await usageControl.resetUserUsage(userId, timeframe);
    
    logger.info(`User usage reset by admin`, {
      adminId: req.user.id,
      targetUserId: userId,
      timeframe
    });
    
    res.json({
      success: true,
      message: `User usage reset successfully for timeframe: ${timeframe}`,
      data: result
    });
    
  } catch (error) {
    logger.error('Failed to reset user usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset user usage'
    });
  }
});

// GET /api/usage-control/active-requests - Get active requests
router.get('/active-requests', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.query;
    
    // Non-admin users can only see their own requests
    if (!req.user.isAdmin && userId && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    let activeRequests = Array.from(usageControl.activeRequests.values());
    
    // Filter by user if specified
    if (userId) {
      activeRequests = activeRequests.filter(request => request.userId === userId);
    } else if (!req.user.isAdmin) {
      // Non-admin users only see their own requests
      activeRequests = activeRequests.filter(request => request.userId === req.user.id);
    }
    
    // Remove sensitive information for non-admin users
    if (!req.user.isAdmin) {
      activeRequests = activeRequests.map(request => ({
        id: request.id,
        startTime: request.startTime,
        duration: Date.now() - request.startTime,
        metadata: {
          path: request.metadata?.path,
          method: request.metadata?.method
        }
      }));
    }
    
    res.json({
      success: true,
      data: {
        activeRequests,
        count: activeRequests.length
      }
    });
    
  } catch (error) {
    logger.error('Failed to get active requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve active requests'
    });
  }
});

// GET /api/usage-control/config - Get configuration (admin only)
router.get('/config', authenticateToken, async (req, res) => {
  try {
    // Check admin permissions
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const config = {
      rateLimits: usageControl.config.rateLimits,
      quotas: usageControl.config.quotas,
      throttling: usageControl.config.throttling
    };
    
    res.json({
      success: true,
      data: config
    });
    
  } catch (error) {
    logger.error('Failed to get usage control config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve usage control configuration'
    });
  }
});

// POST /api/usage-control/check-rate-limit - Check rate limit for identifier
router.post('/check-rate-limit', authenticateToken, async (req, res) => {
  try {
    const { identifier, identifierType = 'user' } = req.body;
    
    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'Identifier is required'
      });
    }
    
    // Non-admin users can only check their own limits
    if (!req.user.isAdmin) {
      if (identifierType === 'user' && identifier !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Can only check your own rate limits'
        });
      }
      if (identifierType !== 'user') {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }
    
    try {
      const result = await usageControl.checkRateLimit(identifier, identifierType);
      
      res.json({
        success: true,
        data: {
          allowed: true,
          limits: result.limits,
          usage: result.usage
        }
      });
      
    } catch (rateLimitError) {
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: rateLimitError.message,
        data: {
          allowed: false
        }
      });
    }
    
  } catch (error) {
    logger.error('Failed to check rate limit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check rate limit'
    });
  }
});

// POST /api/usage-control/check-quota - Check quota for user
router.post('/check-quota', authenticateToken, async (req, res) => {
  try {
    const { userId, userTier, dataUsageMB = 0 } = req.body;
    
    // Non-admin users can only check their own quotas
    if (!req.user.isAdmin && userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Can only check your own quota'
      });
    }
    
    const targetUserId = userId || req.user.id;
    const targetTier = userTier || req.user.tier || req.user.subscription?.tier || 'free';
    
    try {
      const result = await usageControl.checkQuota(targetUserId, targetTier, dataUsageMB);
      
      res.json({
        success: true,
        data: {
          allowed: true,
          quota: result.quota,
          usage: result.usage
        }
      });
      
    } catch (quotaError) {
      res.status(402).json({
        success: false,
        error: 'Quota exceeded',
        message: quotaError.message,
        data: {
          allowed: false
        }
      });
    }
    
  } catch (error) {
    logger.error('Failed to check quota:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check quota'
    });
  }
});

// GET /api/usage-control/queue-status - Get throttling queue status
router.get('/queue-status', authenticateToken, async (req, res) => {
  try {
    const queueStats = Array.from(usageControl.requestQueues.entries()).map(([identifier, queue]) => ({
      identifier: req.user.isAdmin ? identifier : '***', // Hide identifier for non-admin
      queueLength: queue.length,
      oldestRequest: queue.length > 0 ? Math.min(...queue.map(r => r.timestamp)) : null
    }));
    
    res.json({
      success: true,
      data: {
        totalQueues: queueStats.length,
        totalQueuedRequests: queueStats.reduce((sum, q) => sum + q.queueLength, 0),
        queues: req.user.isAdmin ? queueStats : queueStats.filter(q => q.queueLength > 0)
      }
    });
    
  } catch (error) {
    logger.error('Failed to get queue status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve queue status'
    });
  }
});

// GET /api/usage-control/metrics - Get detailed metrics (admin only)
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    // Check admin permissions
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const stats = usageControl.getServiceStats();
    const health = usageControl.getHealth();
    
    const metrics = {
      performance: {
        totalRequests: stats.totalRequests,
        blockedRequests: stats.blockedRequests,
        throttledRequests: stats.throttledRequests,
        blockRate: stats.totalRequests > 0 ? 
          Math.round((stats.blockedRequests / stats.totalRequests) * 100) : 0,
        throttleRate: stats.totalRequests > 0 ? 
          Math.round((stats.throttledRequests / stats.totalRequests) * 100) : 0
      },
      violations: {
        rateLimitViolations: stats.rateLimitViolations,
        quotaViolations: stats.quotaViolations
      },
      system: {
        activeRequests: health.activeRequests,
        requestQueues: health.requestQueues,
        status: health.status
      },
      configuration: {
        rateLimitTiers: stats.rateLimitTiers,
        quotaTiers: stats.quotaTiers,
        throttlingEnabled: stats.throttlingEnabled
      }
    };
    
    res.json({
      success: true,
      data: metrics
    });
    
  } catch (error) {
    logger.error('Failed to get usage control metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve usage control metrics'
    });
  }
});

export default router;