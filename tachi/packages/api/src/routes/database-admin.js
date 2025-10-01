/**
 * Database Administration Routes
 * Provides database health monitoring, performance metrics, and administrative tools
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth-secure.js';
import { validate, schemas } from '../middleware/validation.js';
import { connectionManager, performanceMonitor } from '../db/connection-pool.js';
import { createLogger } from '../utils/logger.js';
import BackupManager from '../../database/backup-recovery.js';

const router = express.Router();
const logger = createLogger();
const backupManager = new BackupManager();

// Middleware to require admin privileges
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.email !== process.env.ADMIN_EMAIL) {
    return res.status(403).json({
      error: 'Administrator privileges required',
      code: 'INSUFFICIENT_PRIVILEGES'
    });
  }
  next();
};

// Get database health status
router.get('/health',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      logger.info('Database health check requested', {
        userId: req.user.id,
        ip: req.ip
      });

      // Get connection manager health
      const connectionHealth = await connectionManager.healthCheck();
      
      // Get database health summary using stored function
      const { data: healthSummary, error: healthError } = await connectionManager.query(`
        SELECT * FROM get_database_health_summary()
      `);

      if (healthError) {
        logger.warn('Failed to get database health summary:', healthError);
      }

      // Get recent performance metrics
      const { data: recentMetrics, error: metricsError } = await connectionManager.query(`
        SELECT * FROM db_performance_metrics 
        WHERE metric_time > NOW() - INTERVAL '1 hour'
        ORDER BY metric_time DESC
        LIMIT 10
      `);

      // Get slow query count
      const { data: slowQueries, error: slowQueryError } = await connectionManager.query(`
        SELECT 
          COUNT(*) as total_slow_queries,
          COUNT(*) FILTER (WHERE priority = 'critical') as critical_queries,
          COUNT(*) FILTER (WHERE priority = 'high') as high_priority_queries,
          AVG(execution_time_ms) as avg_execution_time
        FROM slow_query_log 
        WHERE last_seen > NOW() - INTERVAL '24 hours'
      `);

      const overallStatus = connectionHealth.status === 'healthy' && 
                          (!healthSummary || healthSummary.every(h => h.status !== 'critical'))
                          ? 'healthy' : 'degraded';

      res.json({
        success: true,
        overallStatus,
        connectionHealth,
        healthSummary: healthSummary || [],
        recentMetrics: recentMetrics || [],
        slowQueryStats: slowQueries?.[0] || {},
        recommendations: generateHealthRecommendations(connectionHealth, healthSummary, slowQueries?.[0]),
        lastChecked: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Database health check failed:', error);
      res.status(500).json({
        error: 'Health check failed',
        code: 'HEALTH_CHECK_ERROR'
      });
    }
  }
);

// Get performance metrics and analytics
router.get('/performance',
  authenticateToken,
  requireAdmin,
  validate({
    timeframe: schemas.string().valid('1h', '6h', '24h', '7d').default('24h'),
    metric: schemas.string().valid('all', 'connections', 'queries', 'errors', 'cache').default('all')
  }, 'query'),
  async (req, res) => {
    try {
      const { timeframe = '24h', metric = 'all' } = req.query;

      logger.info('Performance metrics requested', {
        userId: req.user.id,
        timeframe,
        metric,
        ip: req.ip
      });

      // Calculate time range
      const intervals = {
        '1h': '1 hour',
        '6h': '6 hours', 
        '24h': '24 hours',
        '7d': '7 days'
      };

      const interval = intervals[timeframe];
      
      // Get performance metrics
      const { data: metrics, error: metricsError } = await connectionManager.query(`
        SELECT 
          metric_time,
          connection_pool_total,
          connection_pool_active,
          connection_pool_idle,
          connection_pool_waiting,
          query_count_total,
          query_count_slow,
          query_avg_time_ms,
          error_count,
          error_rate,
          cache_hit_rate,
          cache_size
        FROM db_performance_metrics
        WHERE metric_time > NOW() - INTERVAL '${interval}'
        ORDER BY metric_time DESC
      `);

      // Get connection statistics
      const connectionStats = connectionManager.getConnectionStats();

      // Get performance monitor report
      const performanceReport = performanceMonitor.getPerformanceReport();

      // Get table performance analysis
      const { data: tableStats, error: tableError } = await connectionManager.query(`
        SELECT 
          schemaname,
          tablename,
          seq_scan,
          seq_tup_read,
          idx_scan,
          idx_tup_fetch,
          n_tup_ins + n_tup_upd + n_tup_del as total_modifications,
          last_vacuum,
          last_analyze
        FROM pg_stat_user_tables
        ORDER BY (n_tup_ins + n_tup_upd + n_tup_del) DESC
        LIMIT 20
      `);

      res.json({
        success: true,
        timeframe,
        metric,
        data: {
          metrics: metrics || [],
          connectionStats,
          performanceReport,
          tableStatistics: tableStats || [],
          summary: {
            totalDataPoints: metrics?.length || 0,
            averageResponseTime: metrics?.length > 0 ? 
              metrics.reduce((sum, m) => sum + (m.query_avg_time_ms || 0), 0) / metrics.length : 0,
            peakConnections: metrics?.length > 0 ? 
              Math.max(...metrics.map(m => m.connection_pool_active || 0)) : 0,
            errorRate: metrics?.length > 0 ?
              metrics.reduce((sum, m) => sum + (m.error_rate || 0), 0) / metrics.length : 0
          }
        },
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Performance metrics request failed:', error);
      res.status(500).json({
        error: 'Failed to retrieve performance metrics',
        code: 'PERFORMANCE_METRICS_ERROR'
      });
    }
  }
);

// Get slow queries analysis
router.get('/slow-queries',
  authenticateToken,
  requireAdmin,
  validate({
    limit: schemas.number().min(1).max(100).default(50),
    minTime: schemas.number().min(100).default(1000),
    priority: schemas.string().valid('all', 'low', 'medium', 'high', 'critical').default('all')
  }, 'query'),
  async (req, res) => {
    try {
      const { limit = 50, minTime = 1000, priority = 'all' } = req.query;

      logger.info('Slow queries analysis requested', {
        userId: req.user.id,
        limit,
        minTime,
        priority,
        ip: req.ip
      });

      let query = `
        SELECT 
          query_hash,
          LEFT(query_text, 200) as query_preview,
          execution_time_ms,
          rows_examined,
          rows_returned,
          occurrence_count,
          priority,
          first_seen,
          last_seen,
          optimization_suggestions
        FROM slow_query_log
        WHERE execution_time_ms >= $1
      `;

      const params = [minTime];

      if (priority !== 'all') {
        query += ` AND priority = $${params.length + 1}`;
        params.push(priority);
      }

      query += ` ORDER BY execution_time_ms DESC, occurrence_count DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const { data: slowQueries, error } = await connectionManager.query(query, params);

      if (error) {
        throw error;
      }

      // Get aggregated statistics
      const { data: stats, error: statsError } = await connectionManager.query(`
        SELECT 
          COUNT(*) as total_slow_queries,
          AVG(execution_time_ms) as avg_execution_time,
          MAX(execution_time_ms) as max_execution_time,
          SUM(occurrence_count) as total_occurrences,
          COUNT(*) FILTER (WHERE priority = 'critical') as critical_count,
          COUNT(*) FILTER (WHERE priority = 'high') as high_count,
          COUNT(*) FILTER (WHERE priority = 'medium') as medium_count,
          COUNT(*) FILTER (WHERE priority = 'low') as low_count
        FROM slow_query_log
        WHERE execution_time_ms >= $1
        ${priority !== 'all' ? `AND priority = '${priority}'` : ''}
      `, [minTime]);

      res.json({
        success: true,
        filters: { limit, minTime, priority },
        slowQueries: slowQueries || [],
        statistics: stats?.[0] || {},
        recommendations: generateSlowQueryRecommendations(slowQueries || []),
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Slow queries analysis failed:', error);
      res.status(500).json({
        error: 'Failed to analyze slow queries',
        code: 'SLOW_QUERY_ANALYSIS_ERROR'
      });
    }
  }
);

// Trigger database maintenance operations
router.post('/maintenance',
  authenticateToken,
  requireAdmin,
  validate({
    operation: schemas.string().valid('vacuum', 'analyze', 'reindex', 'cleanup').required(),
    table: schemas.string().optional(),
    force: schemas.boolean().default(false)
  }),
  async (req, res) => {
    try {
      const { operation, table, force = false } = req.body;

      logger.info('Database maintenance requested', {
        userId: req.user.id,
        operation,
        table,
        force,
        ip: req.ip
      });

      if (process.env.NODE_ENV === 'production' && !force) {
        return res.status(400).json({
          error: 'Production maintenance requires force flag',
          code: 'PRODUCTION_SAFETY_CHECK'
        });
      }

      const startTime = Date.now();
      let result;

      switch (operation) {
        case 'vacuum':
          result = await performVacuum(table);
          break;
        case 'analyze':
          result = await performAnalyze(table);
          break;
        case 'reindex':
          result = await performReindex(table);
          break;
        case 'cleanup':
          result = await performCleanup();
          break;
        default:
          throw new Error(`Unknown maintenance operation: ${operation}`);
      }

      const duration = Date.now() - startTime;

      // Log maintenance operation
      await connectionManager.query(`
        INSERT INTO db_maintenance_log (
          operation_type, table_name, status, start_time, end_time, 
          duration_ms, rows_affected, triggered_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        operation,
        table || null,
        'completed',
        new Date(startTime).toISOString(),
        new Date().toISOString(),
        duration,
        result.rowsAffected || 0,
        'manual'
      ]);

      res.json({
        success: true,
        operation,
        table,
        duration,
        result,
        message: `${operation} operation completed successfully`
      });

    } catch (error) {
      logger.error('Database maintenance failed:', error);
      
      // Log failed maintenance operation
      await connectionManager.query(`
        INSERT INTO db_maintenance_log (
          operation_type, table_name, status, start_time, error_message, triggered_by
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        req.body.operation,
        req.body.table || null,
        'failed',
        new Date().toISOString(),
        error.message,
        'manual'
      ]);

      res.status(500).json({
        error: `Maintenance operation failed: ${error.message}`,
        code: 'MAINTENANCE_ERROR'
      });
    }
  }
);

// Get backup status and management
router.get('/backups',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      logger.info('Backup status requested', {
        userId: req.user.id,
        ip: req.ip
      });

      const backupStatus = await backupManager.getBackupStatus();

      res.json({
        success: true,
        ...backupStatus,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Backup status request failed:', error);
      res.status(500).json({
        error: 'Failed to get backup status',
        code: 'BACKUP_STATUS_ERROR'
      });
    }
  }
);

// Create database backup
router.post('/backups',
  authenticateToken,
  requireAdmin,
  validate({
    type: schemas.string().valid('full', 'incremental').default('incremental')
  }),
  async (req, res) => {
    try {
      const { type = 'incremental' } = req.body;

      logger.info('Backup creation requested', {
        userId: req.user.id,
        type,
        ip: req.ip
      });

      let result;
      if (type === 'full') {
        result = await backupManager.createFullBackup();
      } else {
        result = await backupManager.createIncrementalBackup();
      }

      res.json({
        success: true,
        backup: result,
        message: `${type} backup created successfully`
      });

    } catch (error) {
      logger.error('Backup creation failed:', error);
      res.status(500).json({
        error: `Backup creation failed: ${error.message}`,
        code: 'BACKUP_CREATION_ERROR'
      });
    }
  }
);

// Database administration dashboard summary
router.get('/dashboard',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      logger.info('Database dashboard requested', {
        userId: req.user.id,
        ip: req.ip
      });

      // Get multiple data sources in parallel
      const [
        connectionHealth,
        recentMetrics,
        slowQueryCount,
        backupStatus,
        maintenanceLog
      ] = await Promise.all([
        connectionManager.healthCheck(),
        connectionManager.query(`
          SELECT * FROM db_performance_metrics 
          WHERE metric_time > NOW() - INTERVAL '1 hour'
          ORDER BY metric_time DESC LIMIT 1
        `),
        connectionManager.query(`
          SELECT COUNT(*) as count FROM slow_query_log 
          WHERE last_seen > NOW() - INTERVAL '24 hours'
        `),
        backupManager.getBackupStatus().catch(() => ({ status: 'unknown' })),
        connectionManager.query(`
          SELECT * FROM db_maintenance_log 
          WHERE start_time > NOW() - INTERVAL '7 days'
          ORDER BY start_time DESC LIMIT 5
        `)
      ]);

      const dashboard = {
        overview: {
          status: connectionHealth.status,
          lastChecked: new Date().toISOString(),
          uptime: process.uptime(),
          nodeVersion: process.version,
          environment: process.env.NODE_ENV
        },
        performance: {
          connectionHealth,
          latestMetrics: recentMetrics.data?.[0] || {},
          slowQueriesLast24h: slowQueryCount.data?.[0]?.count || 0
        },
        backups: {
          status: backupStatus.status,
          lastBackup: backupStatus.statistics?.lastBackup || null,
          totalBackups: backupStatus.statistics?.totalBackups || 0
        },
        maintenance: {
          recentOperations: maintenanceLog.data || [],
          nextScheduled: getNextScheduledMaintenance()
        },
        alerts: generateDashboardAlerts(connectionHealth, recentMetrics.data?.[0], slowQueryCount.data?.[0])
      };

      res.json({
        success: true,
        dashboard,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Database dashboard request failed:', error);
      res.status(500).json({
        error: 'Failed to generate dashboard',
        code: 'DASHBOARD_ERROR'
      });
    }
  }
);

// Helper functions
async function performVacuum(table) {
  if (table) {
    await connectionManager.query(`VACUUM ANALYZE ${table}`);
    return { message: `Vacuumed table ${table}`, table };
  } else {
    await connectionManager.query('VACUUM ANALYZE');
    return { message: 'Vacuumed all tables' };
  }
}

async function performAnalyze(table) {
  if (table) {
    await connectionManager.query(`ANALYZE ${table}`);
    return { message: `Analyzed table ${table}`, table };
  } else {
    await connectionManager.query('ANALYZE');
    return { message: 'Analyzed all tables' };
  }
}

async function performReindex(table) {
  if (table) {
    await connectionManager.query(`REINDEX TABLE ${table}`);
    return { message: `Reindexed table ${table}`, table };
  } else {
    await connectionManager.query('REINDEX DATABASE CONCURRENTLY');
    return { message: 'Reindexed database' };
  }
}

async function performCleanup() {
  const result = await connectionManager.query('SELECT * FROM cleanup_expired_records()');
  return {
    message: 'Cleanup completed',
    deletedRecords: result.data || []
  };
}

function generateHealthRecommendations(connectionHealth, healthSummary, slowQueryStats) {
  const recommendations = [];

  if (connectionHealth.status !== 'healthy') {
    recommendations.push('Database connection health requires attention');
  }

  if (healthSummary?.some(h => h.status === 'critical')) {
    recommendations.push('Critical health issues detected - immediate action required');
  }

  if (slowQueryStats?.total_slow_queries > 50) {
    recommendations.push('High number of slow queries - consider query optimization');
  }

  if (recommendations.length === 0) {
    recommendations.push('Database health is good - continue regular monitoring');
  }

  return recommendations;
}

function generateSlowQueryRecommendations(slowQueries) {
  const recommendations = [];

  const criticalQueries = slowQueries.filter(q => q.priority === 'critical');
  if (criticalQueries.length > 0) {
    recommendations.push(`${criticalQueries.length} critical slow queries need immediate optimization`);
  }

  const frequentQueries = slowQueries.filter(q => q.occurrence_count > 100);
  if (frequentQueries.length > 0) {
    recommendations.push(`${frequentQueries.length} frequently executed slow queries should be prioritized`);
  }

  if (slowQueries.length === 0) {
    recommendations.push('No significant slow queries detected');
  }

  return recommendations;
}

function generateDashboardAlerts(connectionHealth, latestMetrics, slowQueryStats) {
  const alerts = [];

  if (connectionHealth.status !== 'healthy') {
    alerts.push({
      level: 'error',
      message: 'Database connection issues detected',
      action: 'Check connection pool and database status'
    });
  }

  if (latestMetrics?.error_rate > 0.05) {
    alerts.push({
      level: 'warning',
      message: 'High error rate detected',
      action: 'Review application logs and query patterns'
    });
  }

  if (slowQueryStats?.count > 20) {
    alerts.push({
      level: 'warning',
      message: `${slowQueryStats.count} slow queries in last 24 hours`,
      action: 'Review and optimize slow queries'
    });
  }

  return alerts;
}

function getNextScheduledMaintenance() {
  // Calculate next scheduled maintenance (weekly)
  const now = new Date();
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + (7 - now.getDay()));
  nextSunday.setHours(2, 0, 0, 0);
  
  return {
    operation: 'weekly_maintenance',
    scheduledTime: nextSunday.toISOString(),
    description: 'Automated weekly vacuum and analyze'
  };
}

export default router;