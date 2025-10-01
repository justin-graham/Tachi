import express from 'express';
import { getPerformanceTestSuite } from '../services/performance-testing.js';
import { createLogger } from '../utils/logger.js';
import { authenticateToken } from '../middleware/auth-secure.js';
import { apiRateLimit } from '../middleware/rate-limit-auth.js';

const router = express.Router();
const logger = createLogger();
const performanceTestSuite = getPerformanceTestSuite();

// Initialize performance test suite
performanceTestSuite.initialize().catch(error => {
  logger.error('Failed to initialize performance test suite:', error);
});

// GET /api/performance/health - Get performance test suite health
router.get('/health', async (req, res) => {
  try {
    const health = performanceTestSuite.getHealth();
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health
    });
    
  } catch (error) {
    logger.error('Failed to get performance test suite health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance test suite health status'
    });
  }
});

// GET /api/performance/stats - Get performance test statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = performanceTestSuite.getStats();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    logger.error('Failed to get performance test stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance test statistics'
    });
  }
});

// POST /api/performance/load-test - Run load test
router.post('/load-test', authenticateToken, apiRateLimit, async (req, res) => {
  try {
    const options = req.body || {};
    
    logger.info('Starting load test', { options, userId: req.user?.id });
    
    // Start the test asynchronously
    const testPromise = performanceTestSuite.runLoadTest(options);
    
    // Return test ID immediately for tracking
    const testResult = await testPromise;
    
    res.json({
      success: true,
      message: 'Load test completed',
      data: {
        testId: testResult.testId,
        summary: testResult.summary,
        status: testResult.status
      }
    });
    
  } catch (error) {
    logger.error('Load test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Load test failed to execute'
    });
  }
});

// POST /api/performance/stress-test - Run stress test
router.post('/stress-test', authenticateToken, apiRateLimit, async (req, res) => {
  try {
    const options = req.body || {};
    
    logger.info('Starting stress test', { options, userId: req.user?.id });
    
    // Start the test asynchronously
    const testPromise = performanceTestSuite.runStressTest(options);
    
    // Return test ID immediately for tracking
    const testResult = await testPromise;
    
    res.json({
      success: true,
      message: 'Stress test completed',
      data: {
        testId: testResult.testId,
        summary: testResult.summary,
        status: testResult.status
      }
    });
    
  } catch (error) {
    logger.error('Stress test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Stress test failed to execute'
    });
  }
});

// GET /api/performance/tests - Get test results
router.get('/tests', authenticateToken, async (req, res) => {
  try {
    const { testId, limit = 50, offset = 0 } = req.query;
    
    let results = performanceTestSuite.getTestResults(testId);
    
    if (Array.isArray(results)) {
      // Apply pagination
      const total = results.length;
      results = results
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
        .slice(parseInt(offset), parseInt(offset) + parseInt(limit));
      
      res.json({
        success: true,
        data: {
          tests: results,
          pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: parseInt(offset) + parseInt(limit) < total
          }
        }
      });
    } else if (results) {
      // Single test result
      res.json({
        success: true,
        data: results
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }
    
  } catch (error) {
    logger.error('Failed to get test results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve test results'
    });
  }
});

// GET /api/performance/tests/active - Get active tests
router.get('/tests/active', authenticateToken, async (req, res) => {
  try {
    const activeTests = performanceTestSuite.getActiveTests();
    
    res.json({
      success: true,
      data: {
        activeTests,
        count: activeTests.length
      }
    });
    
  } catch (error) {
    logger.error('Failed to get active tests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve active tests'
    });
  }
});

// POST /api/performance/tests/:testId/stop - Stop a running test
router.post('/tests/:testId/stop', authenticateToken, apiRateLimit, async (req, res) => {
  try {
    const { testId } = req.params;
    
    const stopped = performanceTestSuite.stopTest(testId);
    
    if (stopped) {
      logger.info(`Test ${testId} stopped by user`, { userId: req.user?.id });
      
      res.json({
        success: true,
        message: `Test ${testId} stopped successfully`
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Test not found or not running'
      });
    }
    
  } catch (error) {
    logger.error(`Failed to stop test ${req.params.testId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop test'
    });
  }
});

// GET /api/performance/config - Get test configuration
router.get('/config', authenticateToken, async (req, res) => {
  try {
    const config = {
      baseUrl: performanceTestSuite.config.baseUrl,
      loadTest: performanceTestSuite.config.loadTest,
      stressTest: performanceTestSuite.config.stressTest,
      thresholds: performanceTestSuite.config.thresholds,
      endpoints: performanceTestSuite.config.endpoints.map(ep => ({
        path: ep.path,
        method: ep.method,
        weight: ep.weight,
        requiresAuth: ep.requiresAuth
      }))
    };
    
    res.json({
      success: true,
      data: config
    });
    
  } catch (error) {
    logger.error('Failed to get performance test config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve performance test configuration'
    });
  }
});

// GET /api/performance/system-metrics - Get system metrics
router.get('/system-metrics', authenticateToken, async (req, res) => {
  try {
    const { timeframe = '1h' } = req.query;
    
    let cutoffTime;
    switch (timeframe) {
      case '15m':
        cutoffTime = new Date(Date.now() - 15 * 60 * 1000);
        break;
      case '1h':
        cutoffTime = new Date(Date.now() - 60 * 60 * 1000);
        break;
      case '6h':
        cutoffTime = new Date(Date.now() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffTime = new Date(Date.now() - 60 * 60 * 1000);
    }
    
    const metrics = performanceTestSuite.systemMetrics
      .filter(m => m.timestamp > cutoffTime)
      .map(m => ({
        timestamp: m.timestamp,
        memory: {
          used: m.memory.heapUsed,
          total: m.memory.heapTotal,
          external: m.memory.external
        },
        uptime: m.uptime
      }));
    
    res.json({
      success: true,
      data: {
        timeframe,
        metrics,
        count: metrics.length
      }
    });
    
  } catch (error) {
    logger.error('Failed to get system metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system metrics'
    });
  }
});

// POST /api/performance/custom-test - Run custom performance test
router.post('/custom-test', authenticateToken, apiRateLimit, async (req, res) => {
  try {
    const {
      testType = 'load',
      maxConcurrentUsers = 50,
      testDurationMs = 30000,
      requestIntervalMs = 1000,
      endpoints = []
    } = req.body;
    
    // Validate custom configuration
    if (!['load', 'stress'].includes(testType)) {
      return res.status(400).json({
        success: false,
        error: 'Test type must be either "load" or "stress"'
      });
    }
    
    if (maxConcurrentUsers < 1 || maxConcurrentUsers > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Max concurrent users must be between 1 and 1000'
      });
    }
    
    const customConfig = {
      maxConcurrentUsers,
      testDurationMs,
      requestIntervalMs,
      rampUpTimeMs: Math.min(testDurationMs / 4, 30000) // 25% of test duration or 30s max
    };
    
    // Override endpoints if provided
    if (endpoints.length > 0) {
      performanceTestSuite.config.endpoints = endpoints;
    }
    
    logger.info('Starting custom performance test', { 
      testType, 
      customConfig, 
      userId: req.user?.id 
    });
    
    let testResult;
    if (testType === 'stress') {
      testResult = await performanceTestSuite.runStressTest(customConfig);
    } else {
      testResult = await performanceTestSuite.runLoadTest(customConfig);
    }
    
    res.json({
      success: true,
      message: `Custom ${testType} test completed`,
      data: {
        testId: testResult.testId,
        summary: testResult.summary,
        status: testResult.status
      }
    });
    
  } catch (error) {
    logger.error('Custom performance test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Custom performance test failed to execute'
    });
  }
});

export default router;