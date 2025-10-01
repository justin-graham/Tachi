/**
 * Monitoring and Analytics Routes
 * Provides access to application metrics, performance data, and system analytics
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth-secure.js';
import { validate, schemas } from '../middleware/validation.js';
import { connectionManager } from '../db/connection-pool.js';
import { applicationMonitor } from '../services/monitoring.js';
import { errorTracker } from '../services/error-tracking.js';
import { healthDiagnostics } from '../services/health-diagnostics.js';
import { createLogger } from '../utils/logger.js';

const router = express.Router();
const logger = createLogger();

// Middleware to require admin or monitoring privileges
const requireMonitoringAccess = (req, res, next) => {
  if (req.user.role !== 'admin' && !req.user.permissions?.includes('monitoring')) {
    return res.status(403).json({
      error: 'Monitoring access required',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
  next();
};

// Get real-time monitoring dashboard
router.get('/dashboard',
  authenticateToken,
  requireMonitoringAccess,
  async (req, res) => {
    try {
      logger.info('Monitoring dashboard requested', {
        userId: req.user.id,
        ip: req.ip
      });

      // Get monitoring service status
      const monitoringStatus = applicationMonitor.getMonitoringStatus();

      // Get recent metrics from memory
      const recentMetrics = applicationMonitor.getRecentMetricsFromMemory(10); // Last 10 minutes

      // Get active alerts
      const { data: activeAlerts } = await connectionManager.query(`
        SELECT * FROM alert_incidents 
        WHERE status = 'active' 
        ORDER BY triggered_at DESC 
        LIMIT 20
      `);

      // Get system health summary
      const systemHealth = await getSystemHealthSummary();

      // Get performance summary
      const performanceSummary = await getPerformanceSummary(recentMetrics);

      // Get business metrics summary
      const businessSummary = await getBusinessMetricsSummary();

      const dashboard = {
        overview: {
          status: monitoringStatus.isRunning ? 'operational' : 'down',
          uptime: process.uptime(),
          lastUpdated: new Date().toISOString(),
          activeAlerts: activeAlerts?.length || 0,
          monitoringEnabled: monitoringStatus.isRunning
        },
        systemHealth,
        performance: performanceSummary,
        business: businessSummary,
        alerts: {
          active: activeAlerts || [],
          summary: categorizeAlerts(activeAlerts || [])
        },
        metrics: {
          totalInMemory: recentMetrics.length,
          collectionInterval: monitoringStatus.collectInterval,
          lastCollection: monitoringStatus.lastCollection
        }
      };

      res.json({
        success: true,
        dashboard,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Monitoring dashboard request failed:', error);
      res.status(500).json({
        error: 'Failed to generate monitoring dashboard',
        code: 'DASHBOARD_ERROR'
      });
    }
  }
);

// Get historical metrics with filtering and aggregation
router.get('/metrics',
  authenticateToken,
  requireMonitoringAccess,
  validate({
    metric: schemas.string().optional(),
    component: schemas.string().valid('system', 'application', 'database', 'api', 'business').optional(),
    timeframe: schemas.string().valid('1h', '6h', '24h', '7d', '30d').default('24h'),
    granularity: schemas.string().valid('1m', '5m', '15m', '1h', '1d').default('5m'),
    aggregation: schemas.string().valid('avg', 'sum', 'min', 'max', 'count').default('avg'),
    limit: schemas.number().min(1).max(10000).default(1000)
  }, 'query'),
  async (req, res) => {
    try {
      const { metric, component, timeframe, granularity, aggregation, limit } = req.query;

      logger.info('Metrics data requested', {
        userId: req.user.id,
        metric,
        component,
        timeframe,
        granularity,
        aggregation,
        ip: req.ip
      });

      // Calculate time range
      const intervals = {
        '1h': '1 hour',
        '6h': '6 hours',
        '24h': '24 hours',
        '7d': '7 days',
        '30d': '30 days'
      };

      const interval = intervals[timeframe];
      
      // Build query with filters
      let query = `
        SELECT 
          date_trunc($1, collected_at) as time_bucket,
          metric_name,
          ${aggregation}(metric_value) as value,
          metric_unit,
          tags
        FROM application_metrics 
        WHERE collected_at > NOW() - INTERVAL '${interval}'
      `;

      const params = [granularity];

      if (metric) {
        query += ` AND metric_name = $${params.length + 1}`;
        params.push(metric);
      }

      if (component) {
        query += ` AND tags->>'component' = $${params.length + 1}`;
        params.push(component);
      }

      query += `
        GROUP BY time_bucket, metric_name, metric_unit, tags
        ORDER BY time_bucket DESC, metric_name
        LIMIT $${params.length + 1}
      `;
      params.push(limit);

      const { data: metrics, error } = await connectionManager.query(query, params);

      if (error) {
        throw error;
      }

      // Group metrics by name for easier consumption
      const groupedMetrics = {};
      metrics?.forEach(row => {
        if (!groupedMetrics[row.metric_name]) {
          groupedMetrics[row.metric_name] = {
            name: row.metric_name,
            unit: row.metric_unit,
            dataPoints: []
          };
        }
        
        groupedMetrics[row.metric_name].dataPoints.push({
          timestamp: row.time_bucket,
          value: parseFloat(row.value),
          tags: row.tags
        });
      });

      // Get available metrics for reference
      const { data: availableMetrics } = await connectionManager.query(`
        SELECT DISTINCT 
          metric_name, 
          metric_unit,
          tags->>'component' as component,
          COUNT(*) as data_points,
          MIN(collected_at) as first_seen,
          MAX(collected_at) as last_seen
        FROM application_metrics 
        WHERE collected_at > NOW() - INTERVAL '${interval}'
        GROUP BY metric_name, metric_unit, tags->>'component'
        ORDER BY metric_name
      `);

      res.json({
        success: true,
        filters: { metric, component, timeframe, granularity, aggregation },
        metrics: Object.values(groupedMetrics),
        availableMetrics: availableMetrics || [],
        totalDataPoints: metrics?.length || 0,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Metrics request failed:', error);
      res.status(500).json({
        error: 'Failed to retrieve metrics',
        code: 'METRICS_ERROR'
      });
    }
  }
);

// Get alert incidents and management
router.get('/alerts',
  authenticateToken,
  requireMonitoringAccess,
  validate({
    status: schemas.string().valid('active', 'resolved', 'acknowledged', 'all').default('all'),
    severity: schemas.string().valid('info', 'warning', 'error', 'critical', 'all').default('all'),
    limit: schemas.number().min(1).max(500).default(100),
    offset: schemas.number().min(0).default(0)
  }, 'query'),
  async (req, res) => {
    try {
      const { status, severity, limit, offset } = req.query;

      logger.info('Alerts requested', {
        userId: req.user.id,
        status,
        severity,
        limit,
        offset,
        ip: req.ip
      });

      let query = `
        SELECT 
          id, alert_name, severity, status, message, 
          metric_name, metric_value, threshold_value,
          triggered_at, resolved_at, acknowledged_at, acknowledged_by,
          metadata
        FROM alert_incidents 
        WHERE 1=1
      `;

      const params = [];

      if (status !== 'all') {
        query += ` AND status = $${params.length + 1}`;
        params.push(status);
      }

      if (severity !== 'all') {
        query += ` AND severity = $${params.length + 1}`;
        params.push(severity);
      }

      query += ` ORDER BY triggered_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const { data: alerts, error } = await connectionManager.query(query, params);

      if (error) {
        throw error;
      }

      // Get alert statistics
      const { data: stats } = await connectionManager.query(`
        SELECT 
          COUNT(*) as total_alerts,
          COUNT(*) FILTER (WHERE status = 'active') as active_alerts,
          COUNT(*) FILTER (WHERE status = 'resolved') as resolved_alerts,
          COUNT(*) FILTER (WHERE status = 'acknowledged') as acknowledged_alerts,
          COUNT(*) FILTER (WHERE severity = 'critical') as critical_alerts,
          COUNT(*) FILTER (WHERE severity = 'error') as error_alerts,
          COUNT(*) FILTER (WHERE severity = 'warning') as warning_alerts,
          COUNT(*) FILTER (WHERE severity = 'info') as info_alerts,
          COUNT(*) FILTER (WHERE triggered_at > NOW() - INTERVAL '24 hours') as last_24h_alerts
        FROM alert_incidents
        WHERE triggered_at > NOW() - INTERVAL '30 days'
      `);

      res.json({
        success: true,
        filters: { status, severity, limit, offset },
        alerts: alerts || [],
        statistics: stats?.[0] || {},
        pagination: {
          limit,
          offset,
          hasMore: (alerts?.length || 0) === limit
        },
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Alerts request failed:', error);
      res.status(500).json({
        error: 'Failed to retrieve alerts',
        code: 'ALERTS_ERROR'
      });
    }
  }
);

// Acknowledge alert
router.post('/alerts/:alertId/acknowledge',
  authenticateToken,
  requireMonitoringAccess,
  validate({
    note: schemas.string().max(500).optional()
  }),
  async (req, res) => {
    try {
      const { alertId } = req.params;
      const { note } = req.body;

      logger.info('Alert acknowledgment requested', {
        userId: req.user.id,
        alertId,
        note,
        ip: req.ip
      });

      const query = `
        UPDATE alert_incidents 
        SET 
          status = 'acknowledged',
          acknowledged_at = NOW(),
          acknowledged_by = $2,
          metadata = COALESCE(metadata, '{}') || $3
        WHERE id = $1 AND status = 'active'
        RETURNING *
      `;

      const metadata = note ? JSON.stringify({ acknowledgment_note: note }) : '{}';
      const { data: result } = await connectionManager.query(query, [
        alertId, 
        req.user.email, 
        metadata
      ]);

      if (!result || result.length === 0) {
        return res.status(404).json({
          error: 'Alert not found or not in active state',
          code: 'ALERT_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        alert: result[0],
        message: 'Alert acknowledged successfully'
      });

    } catch (error) {
      logger.error('Alert acknowledgment failed:', error);
      res.status(500).json({
        error: 'Failed to acknowledge alert',
        code: 'ALERT_ACK_ERROR'
      });
    }
  }
);

// Resolve alert
router.post('/alerts/:alertId/resolve',
  authenticateToken,
  requireMonitoringAccess,
  validate({
    note: schemas.string().max(500).optional()
  }),
  async (req, res) => {
    try {
      const { alertId } = req.params;
      const { note } = req.body;

      logger.info('Alert resolution requested', {
        userId: req.user.id,
        alertId,
        note,
        ip: req.ip
      });

      const query = `
        UPDATE alert_incidents 
        SET 
          status = 'resolved',
          resolved_at = NOW(),
          metadata = COALESCE(metadata, '{}') || $2
        WHERE id = $1 AND status IN ('active', 'acknowledged')
        RETURNING *
      `;

      const metadata = note ? JSON.stringify({ resolution_note: note }) : '{}';
      const { data: result } = await connectionManager.query(query, [alertId, metadata]);

      if (!result || result.length === 0) {
        return res.status(404).json({
          error: 'Alert not found or already resolved',
          code: 'ALERT_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        alert: result[0],
        message: 'Alert resolved successfully'
      });

    } catch (error) {
      logger.error('Alert resolution failed:', error);
      res.status(500).json({
        error: 'Failed to resolve alert',
        code: 'ALERT_RESOLVE_ERROR'
      });
    }
  }
);

// Get performance analytics and trends
router.get('/analytics',
  authenticateToken,
  requireMonitoringAccess,
  validate({
    timeframe: schemas.string().valid('1h', '24h', '7d', '30d').default('24h'),
    metrics: schemas.array().items(schemas.string()).optional()
  }, 'query'),
  async (req, res) => {
    try {
      const { timeframe, metrics: requestedMetrics } = req.query;

      logger.info('Performance analytics requested', {
        userId: req.user.id,
        timeframe,
        requestedMetrics,
        ip: req.ip
      });

      const intervals = {
        '1h': '1 hour',
        '24h': '24 hours',
        '7d': '7 days',
        '30d': '30 days'
      };

      const interval = intervals[timeframe];

      // Get key performance indicators
      const analytics = await Promise.all([
        getPerformanceTrends(interval),
        getErrorAnalytics(interval),
        getBusinessAnalytics(interval),
        getSystemResourceAnalytics(interval),
        getUserActivityAnalytics(interval)
      ]);

      const [performanceTrends, errorAnalytics, businessAnalytics, resourceAnalytics, userAnalytics] = analytics;

      res.json({
        success: true,
        timeframe,
        analytics: {
          performance: performanceTrends,
          errors: errorAnalytics,
          business: businessAnalytics,
          resources: resourceAnalytics,
          users: userAnalytics
        },
        summary: {
          overallHealth: calculateOverallHealth(analytics),
          keyInsights: generateKeyInsights(analytics),
          recommendations: generateRecommendations(analytics)
        },
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Analytics request failed:', error);
      res.status(500).json({
        error: 'Failed to generate analytics',
        code: 'ANALYTICS_ERROR'
      });
    }
  }
);

// Get comprehensive health checks
router.get('/health',
  authenticateToken,
  requireMonitoringAccess,
  validate({
    include: schemas.array().items(schemas.string()).optional(),
    includeDiagnostics: schemas.boolean().default(false)
  }, 'query'),
  async (req, res) => {
    try {
      const { include, includeDiagnostics } = req.query;

      logger.info('Health checks requested', {
        userId: req.user.id,
        include,
        includeDiagnostics,
        ip: req.ip
      });

      const healthReport = await healthDiagnostics.generateHealthReport(includeDiagnostics);

      res.json({
        success: true,
        ...healthReport,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Health check request failed:', error);
      res.status(500).json({
        error: 'Failed to perform health checks',
        code: 'HEALTH_CHECK_ERROR'
      });
    }
  }
);

// Get error tracking data
router.get('/errors',
  authenticateToken,
  requireMonitoringAccess,
  validate({
    timeframe: schemas.string().valid('1h', '24h', '7d', '30d').default('24h'),
    limit: schemas.number().min(1).max(100).default(20),
    severity: schemas.string().valid('debug', 'info', 'warn', 'error', 'fatal', 'all').default('all')
  }, 'query'),
  async (req, res) => {
    try {
      const { timeframe, limit, severity } = req.query;

      logger.info('Error tracking data requested', {
        userId: req.user.id,
        timeframe,
        limit,
        severity,
        ip: req.ip
      });

      const [errorStats, topErrors] = await Promise.all([
        errorTracker.getErrorStatistics(timeframe),
        errorTracker.getTopErrors(limit, timeframe)
      ]);

      // Filter by severity if specified
      const filteredErrors = severity === 'all' ? 
        topErrors : 
        topErrors.filter(error => error.severity === severity);

      res.json({
        success: true,
        timeframe,
        statistics: errorStats,
        topErrors: filteredErrors,
        trackingStatus: errorTracker.getStatus(),
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error tracking request failed:', error);
      res.status(500).json({
        error: 'Failed to retrieve error data',
        code: 'ERROR_TRACKING_ERROR'
      });
    }
  }
);

// Run diagnostic tests
router.post('/diagnostics',
  authenticateToken,
  requireMonitoringAccess,
  validate({
    tests: schemas.array().items(schemas.string()).optional(),
    timeout: schemas.number().min(1000).max(60000).default(30000)
  }),
  async (req, res) => {
    try {
      const { tests, timeout } = req.body;

      logger.info('Diagnostic tests requested', {
        userId: req.user.id,
        tests,
        timeout,
        ip: req.ip
      });

      const diagnosticResults = await Promise.race([
        healthDiagnostics.runDiagnostics(tests),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Diagnostic timeout')), timeout)
        )
      ]);

      res.json({
        success: true,
        ...diagnosticResults,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Diagnostic tests failed:', error);
      res.status(500).json({
        error: error.message || 'Failed to run diagnostic tests',
        code: 'DIAGNOSTICS_ERROR'
      });
    }
  }
);

// Get real-time monitoring status
router.get('/status',
  authenticateToken,
  requireMonitoringAccess,
  async (req, res) => {
    try {
      const monitoringStatus = applicationMonitor.getMonitoringStatus();
      const recentMetrics = applicationMonitor.getRecentMetricsFromMemory(1); // Last minute

      // Get latest system metrics
      const latestMetrics = {};
      recentMetrics.forEach(metric => {
        latestMetrics[metric.metric_name] = {
          value: metric.metric_value,
          unit: metric.metric_unit,
          timestamp: metric.timestamp,
          tags: metric.tags
        };
      });

      // Get service statuses
      const serviceStatuses = {
        monitoring: monitoringStatus,
        errorTracking: errorTracker.getStatus(),
        healthDiagnostics: healthDiagnostics.getStatus()
      };

      res.json({
        success: true,
        services: serviceStatuses,
        latestMetrics,
        healthStatus: {
          system: calculateSystemHealth(latestMetrics),
          application: calculateApplicationHealth(latestMetrics),
          database: calculateDatabaseHealth(latestMetrics)
        },
        checkedAt: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Status request failed:', error);
      res.status(500).json({
        error: 'Failed to get monitoring status',
        code: 'STATUS_ERROR'
      });
    }
  }
);

// Helper functions for data analysis and calculations

async function getSystemHealthSummary() {
  try {
    const recentMetrics = applicationMonitor.getRecentMetricsFromMemory(5);
    
    const cpuMetrics = recentMetrics.filter(m => m.metric_name === 'system.cpu.usage_percent');
    const memoryMetrics = recentMetrics.filter(m => m.metric_name === 'system.memory.usage_percent');
    const loadMetrics = recentMetrics.filter(m => m.metric_name === 'system.load.1min');

    return {
      cpu: {
        current: cpuMetrics.length > 0 ? cpuMetrics[cpuMetrics.length - 1].metric_value : null,
        average: cpuMetrics.length > 0 ? cpuMetrics.reduce((sum, m) => sum + m.metric_value, 0) / cpuMetrics.length : null,
        status: cpuMetrics.length > 0 && cpuMetrics[cpuMetrics.length - 1].metric_value < 80 ? 'healthy' : 'warning'
      },
      memory: {
        current: memoryMetrics.length > 0 ? memoryMetrics[memoryMetrics.length - 1].metric_value : null,
        average: memoryMetrics.length > 0 ? memoryMetrics.reduce((sum, m) => sum + m.metric_value, 0) / memoryMetrics.length : null,
        status: memoryMetrics.length > 0 && memoryMetrics[memoryMetrics.length - 1].metric_value < 85 ? 'healthy' : 'warning'
      },
      load: {
        current: loadMetrics.length > 0 ? loadMetrics[loadMetrics.length - 1].metric_value : null,
        cores: os.cpus().length
      },
      uptime: process.uptime()
    };

  } catch (error) {
    logger.error('Error getting system health summary:', error);
    return { error: 'Unable to retrieve system health' };
  }
}

async function getPerformanceSummary(metrics) {
  const responseTimeMetrics = metrics.filter(m => m.metric_name === 'api.response_time.avg');
  const errorRateMetrics = metrics.filter(m => m.metric_name === 'app.errors.rate');
  const dbMetrics = metrics.filter(m => m.metric_name === 'database.connections.utilization');

  return {
    responseTime: {
      current: responseTimeMetrics.length > 0 ? responseTimeMetrics[responseTimeMetrics.length - 1].metric_value : null,
      average: responseTimeMetrics.length > 0 ? responseTimeMetrics.reduce((sum, m) => sum + m.metric_value, 0) / responseTimeMetrics.length : null
    },
    errorRate: {
      current: errorRateMetrics.length > 0 ? errorRateMetrics[errorRateMetrics.length - 1].metric_value : null,
      average: errorRateMetrics.length > 0 ? errorRateMetrics.reduce((sum, m) => sum + m.metric_value, 0) / errorRateMetrics.length : null
    },
    database: {
      connectionUtilization: dbMetrics.length > 0 ? dbMetrics[dbMetrics.length - 1].metric_value : null
    }
  };
}

async function getBusinessMetricsSummary() {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_transactions_1h,
        COUNT(*) FILTER (WHERE status = 'completed') as successful_transactions_1h,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as revenue_1h,
        COUNT(DISTINCT crawler_id) as active_crawlers_1h,
        COUNT(DISTINCT publisher_id) as active_publishers_1h
      FROM transactions 
      WHERE created_at > NOW() - INTERVAL '1 hour'
    `;

    const { data: result } = await connectionManager.query(query);
    const data = result?.[0] || {};

    return {
      transactions: {
        total: parseInt(data.total_transactions_1h) || 0,
        successful: parseInt(data.successful_transactions_1h) || 0,
        successRate: data.total_transactions_1h > 0 ? 
          (data.successful_transactions_1h / data.total_transactions_1h) * 100 : 100
      },
      revenue: {
        hourly: parseFloat(data.revenue_1h) || 0
      },
      users: {
        activeCrawlers: parseInt(data.active_crawlers_1h) || 0,
        activePublishers: parseInt(data.active_publishers_1h) || 0
      }
    };

  } catch (error) {
    logger.error('Error getting business metrics summary:', error);
    return { error: 'Unable to retrieve business metrics' };
  }
}

function categorizeAlerts(alerts) {
  return {
    critical: alerts.filter(a => a.severity === 'critical').length,
    error: alerts.filter(a => a.severity === 'error').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    info: alerts.filter(a => a.severity === 'info').length
  };
}

function calculateSystemHealth(metrics) {
  const cpu = metrics['system.cpu.usage_percent'];
  const memory = metrics['system.memory.usage_percent'];
  
  if (!cpu || !memory) return 'unknown';
  
  if (cpu.value > 90 || memory.value > 95) return 'critical';
  if (cpu.value > 80 || memory.value > 85) return 'warning';
  return 'healthy';
}

function calculateApplicationHealth(metrics) {
  const errorRate = metrics['app.errors.rate'];
  const responseTime = metrics['app.response_time.avg'];
  
  if (!errorRate && !responseTime) return 'unknown';
  
  if ((errorRate?.value || 0) > 10 || (responseTime?.value || 0) > 5000) return 'critical';
  if ((errorRate?.value || 0) > 5 || (responseTime?.value || 0) > 2000) return 'warning';
  return 'healthy';
}

function calculateDatabaseHealth(metrics) {
  const utilization = metrics['database.connections.utilization'];
  const errorRate = metrics['database.errors.rate'];
  
  if (!utilization && !errorRate) return 'unknown';
  
  if ((utilization?.value || 0) > 95 || (errorRate?.value || 0) > 5) return 'critical';
  if ((utilization?.value || 0) > 85 || (errorRate?.value || 0) > 2) return 'warning';
  return 'healthy';
}

// Additional analytics functions would be implemented here
async function getPerformanceTrends(interval) { return {}; }
async function getErrorAnalytics(interval) { return {}; }
async function getBusinessAnalytics(interval) { return {}; }
async function getSystemResourceAnalytics(interval) { return {}; }
async function getUserActivityAnalytics(interval) { return {}; }

function calculateOverallHealth(analytics) { return 'healthy'; }
function generateKeyInsights(analytics) { return []; }
function generateRecommendations(analytics) { return []; }

export default router;