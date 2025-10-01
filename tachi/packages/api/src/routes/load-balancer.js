import express from 'express';
import { getLoadBalancer } from '../services/load-balancer.js';
import { createLogger } from '../utils/logger.js';
import { authenticateToken } from '../middleware/auth-secure.js';
import { apiRateLimit } from '../middleware/rate-limit-auth.js';

const router = express.Router();
const logger = createLogger();
const loadBalancer = getLoadBalancer();

// GET /api/load-balancer/stats - Get load balancer statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = loadBalancer.getStats();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    logger.error('Failed to get load balancer stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve load balancer statistics'
    });
  }
});

// GET /api/load-balancer/health - Get load balancer health
router.get('/health', async (req, res) => {
  try {
    const health = loadBalancer.getHealth();
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health
    });
    
  } catch (error) {
    logger.error('Failed to get load balancer health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve load balancer health status'
    });
  }
});

// GET /api/load-balancer/servers - Get server pool status
router.get('/servers', authenticateToken, async (req, res) => {
  try {
    const stats = loadBalancer.getStats();
    
    res.json({
      success: true,
      data: {
        servers: stats.serverStats,
        totalServers: stats.totalServers,
        healthyServers: stats.healthyServers,
        algorithm: stats.algorithm
      }
    });
    
  } catch (error) {
    logger.error('Failed to get server pool status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve server pool status'
    });
  }
});

// POST /api/load-balancer/health-check - Trigger manual health check
router.post('/health-check', authenticateToken, apiRateLimit, async (req, res) => {
  try {
    logger.info('Manual health check triggered');
    
    await loadBalancer.performHealthChecks();
    
    const health = loadBalancer.getHealth();
    
    res.json({
      success: true,
      message: 'Health check completed',
      data: health
    });
    
  } catch (error) {
    logger.error('Manual health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

// GET /api/load-balancer/config - Get load balancer configuration (admin only)
router.get('/config', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin (implement based on your auth system)
    // const user = req.user;
    // if (!user.isAdmin) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Admin access required'
    //   });
    // }
    
    const config = {
      algorithm: loadBalancer.config.algorithm,
      servers: loadBalancer.config.servers,
      healthCheck: loadBalancer.config.healthCheck,
      circuitBreaker: loadBalancer.config.circuitBreaker,
      retry: loadBalancer.config.retry,
      sessionAffinity: loadBalancer.config.sessionAffinity
    };
    
    res.json({
      success: true,
      data: config
    });
    
  } catch (error) {
    logger.error('Failed to get load balancer config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve load balancer configuration'
    });
  }
});

// GET /api/load-balancer/sessions - Get active sessions (when session affinity is enabled)
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    if (!loadBalancer.config.sessionAffinity.enabled) {
      return res.json({
        success: true,
        data: {
          sessionAffinityEnabled: false,
          activeSessions: 0,
          sessions: []
        }
      });
    }
    
    const sessions = Array.from(loadBalancer.sessionMap.entries()).map(([sessionId, data]) => ({
      sessionId: sessionId.substring(0, 8) + '...', // Partially mask for privacy
      serverUrl: data.serverUrl,
      timestamp: data.timestamp,
      age: Date.now() - data.timestamp
    }));
    
    res.json({
      success: true,
      data: {
        sessionAffinityEnabled: true,
        activeSessions: sessions.length,
        sessions,
        ttl: loadBalancer.config.sessionAffinity.ttl
      }
    });
    
  } catch (error) {
    logger.error('Failed to get active sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve active sessions'
    });
  }
});

// POST /api/load-balancer/clear-sessions - Clear all active sessions
router.post('/clear-sessions', authenticateToken, apiRateLimit, async (req, res) => {
  try {
    if (!loadBalancer.config.sessionAffinity.enabled) {
      return res.status(400).json({
        success: false,
        error: 'Session affinity is not enabled'
      });
    }
    
    const sessionsCleared = loadBalancer.sessionMap.size;
    loadBalancer.sessionMap.clear();
    
    logger.info(`Cleared ${sessionsCleared} active sessions`);
    
    res.json({
      success: true,
      message: `Cleared ${sessionsCleared} active sessions`
    });
    
  } catch (error) {
    logger.error('Failed to clear sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear active sessions'
    });
  }
});

// GET /api/load-balancer/metrics - Get detailed metrics
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const stats = loadBalancer.getStats();
    
    // Calculate additional metrics
    const totalRequests = stats.totalRequests;
    const successRate = totalRequests > 0 ? 
      Math.round((stats.successfulRequests / totalRequests) * 100) : 0;
    const failureRate = totalRequests > 0 ? 
      Math.round((stats.failedRequests / totalRequests) * 100) : 0;
    const retryRate = totalRequests > 0 ? 
      Math.round((stats.retries / totalRequests) * 100) : 0;
    
    const metrics = {
      requests: {
        total: totalRequests,
        successful: stats.successfulRequests,
        failed: stats.failedRequests,
        retries: stats.retries,
        successRate,
        failureRate,
        retryRate
      },
      performance: {
        averageResponseTime: Math.round(stats.averageResponseTime),
        circuitBreakerTrips: stats.circuitBreakerTrips
      },
      servers: {
        total: stats.totalServers,
        healthy: stats.healthyServers,
        unhealthy: stats.totalServers - stats.healthyServers,
        healthPercentage: stats.totalServers > 0 ? 
          Math.round((stats.healthyServers / stats.totalServers) * 100) : 0
      },
      sessions: {
        enabled: stats.sessionAffinityEnabled,
        active: stats.activeSessions
      },
      uptime: Date.now() - stats.lastReset.getTime()
    };
    
    res.json({
      success: true,
      data: metrics
    });
    
  } catch (error) {
    logger.error('Failed to get load balancer metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve load balancer metrics'
    });
  }
});

export default router;