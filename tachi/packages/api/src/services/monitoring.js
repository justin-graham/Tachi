/**
 * Application Monitoring and Alerting Service
 * Provides comprehensive monitoring, metrics collection, and alerting capabilities
 */

import { createLogger } from '../utils/logger.js';
import { connectionManager } from '../db/connection-pool.js';
import EventEmitter from 'events';
import os from 'os';
import process from 'process';

const logger = createLogger();

export class ApplicationMonitor extends EventEmitter {
  constructor() {
    super();
    this.metrics = new Map();
    this.alerts = new Map();
    this.isRunning = false;
    this.collectInterval = null;
    this.alertCheckInterval = null;
    
    // Metric collection configuration
    this.config = {
      collectInterval: parseInt(process.env.METRICS_COLLECT_INTERVAL) || 30000, // 30 seconds
      alertCheckInterval: parseInt(process.env.ALERT_CHECK_INTERVAL) || 60000, // 1 minute
      retentionPeriod: parseInt(process.env.METRICS_RETENTION_HOURS) || 72, // 72 hours
      maxMetricsInMemory: parseInt(process.env.MAX_METRICS_IN_MEMORY) || 2000
    };

    // Alert thresholds
    this.thresholds = {
      cpuUsage: parseFloat(process.env.CPU_ALERT_THRESHOLD) || 80,
      memoryUsage: parseFloat(process.env.MEMORY_ALERT_THRESHOLD) || 85,
      responseTime: parseInt(process.env.RESPONSE_TIME_ALERT_THRESHOLD) || 5000,
      errorRate: parseFloat(process.env.ERROR_RATE_ALERT_THRESHOLD) || 5.0,
      diskUsage: parseFloat(process.env.DISK_ALERT_THRESHOLD) || 90,
      connectionPool: parseFloat(process.env.CONNECTION_POOL_ALERT_THRESHOLD) || 90
    };

    // Initialize metric collectors
    this.initializeMetricCollectors();
  }

  /**
   * Initialize metric collection handlers
   */
  initializeMetricCollectors() {
    this.collectors = {
      system: () => this.collectSystemMetrics(),
      application: () => this.collectApplicationMetrics(),
      database: () => this.collectDatabaseMetrics(),
      api: () => this.collectAPIMetrics(),
      business: () => this.collectBusinessMetrics()
    };
  }

  /**
   * Start monitoring service
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Monitoring service is already running');
      return;
    }

    try {
      logger.info('🚀 Starting application monitoring service...');
      
      // Initialize database tables for metrics storage
      await this.initializeMetricsTables();
      
      // Start metric collection
      this.collectInterval = setInterval(async () => {
        try {
          await this.collectAllMetrics();
        } catch (error) {
          logger.error('Error collecting metrics:', error);
        }
      }, this.config.collectInterval);

      // Start alert checking
      this.alertCheckInterval = setInterval(async () => {
        try {
          await this.checkAlerts();
        } catch (error) {
          logger.error('Error checking alerts:', error);
        }
      }, this.config.alertCheckInterval);

      // Clean up old metrics periodically
      setInterval(async () => {
        try {
          await this.cleanupOldMetrics();
        } catch (error) {
          logger.error('Error cleaning up old metrics:', error);
        }
      }, 6 * 60 * 60 * 1000); // Every 6 hours

      this.isRunning = true;
      logger.info('✅ Application monitoring service started');
      
      // Emit start event
      this.emit('monitoring:started');

    } catch (error) {
      logger.error('❌ Failed to start monitoring service:', error);
      throw error;
    }
  }

  /**
   * Stop monitoring service
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    logger.info('🛑 Stopping application monitoring service...');

    if (this.collectInterval) {
      clearInterval(this.collectInterval);
      this.collectInterval = null;
    }

    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval);
      this.alertCheckInterval = null;
    }

    this.isRunning = false;
    logger.info('✅ Application monitoring service stopped');
    
    // Emit stop event
    this.emit('monitoring:stopped');
  }

  /**
   * Initialize database tables for metrics storage
   */
  async initializeMetricsTables() {
    try {
      const createTablesSQL = `
        CREATE TABLE IF NOT EXISTS application_metrics (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          metric_name VARCHAR(100) NOT NULL,
          metric_value DECIMAL(15, 6) NOT NULL,
          metric_unit VARCHAR(20),
          tags JSONB DEFAULT '{}',
          collected_at TIMESTAMPTZ DEFAULT NOW(),
          instance_id VARCHAR(100),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS alert_incidents (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          alert_name VARCHAR(100) NOT NULL,
          severity VARCHAR(20) NOT NULL, -- 'info', 'warning', 'error', 'critical'
          status VARCHAR(20) DEFAULT 'active', -- 'active', 'resolved', 'acknowledged'
          message TEXT NOT NULL,
          metric_name VARCHAR(100),
          metric_value DECIMAL(15, 6),
          threshold_value DECIMAL(15, 6),
          triggered_at TIMESTAMPTZ DEFAULT NOW(),
          resolved_at TIMESTAMPTZ,
          acknowledged_at TIMESTAMPTZ,
          acknowledged_by VARCHAR(255),
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_application_metrics_name_time 
        ON application_metrics(metric_name, collected_at);
        
        CREATE INDEX IF NOT EXISTS idx_application_metrics_collected_at 
        ON application_metrics(collected_at);
        
        CREATE INDEX IF NOT EXISTS idx_alert_incidents_status 
        ON alert_incidents(status);
        
        CREATE INDEX IF NOT EXISTS idx_alert_incidents_triggered_at 
        ON alert_incidents(triggered_at);
      `;

      await connectionManager.query(createTablesSQL);
      logger.debug('✅ Metrics tables initialized');

    } catch (error) {
      logger.error('❌ Failed to initialize metrics tables:', error);
      throw error;
    }
  }

  /**
   * Collect all metrics from different sources
   */
  async collectAllMetrics() {
    const timestamp = new Date();
    const instanceId = process.env.INSTANCE_ID || `api-${os.hostname()}-${process.pid}`;

    try {
      // Collect metrics from all sources
      const results = await Promise.allSettled([
        this.collectors.system(),
        this.collectors.application(),
        this.collectors.database(),
        this.collectors.api(),
        this.collectors.business()
      ]);

      // Flatten all metrics
      const allMetrics = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          result.value.forEach(metric => {
            allMetrics.push({
              ...metric,
              collected_at: timestamp,
              instance_id: instanceId
            });
          });
        } else {
          logger.warn(`Metric collection failed for collector ${index}:`, result.reason);
        }
      });

      // Store metrics in memory
      this.storeMetricsInMemory(allMetrics);

      // Persist to database (batch insert)
      if (allMetrics.length > 0) {
        await this.persistMetrics(allMetrics);
      }

      // Emit metrics collected event
      this.emit('metrics:collected', { count: allMetrics.length, timestamp });

    } catch (error) {
      logger.error('Error in metric collection:', error);
      throw error;
    }
  }

  /**
   * Collect system-level metrics
   */
  async collectSystemMetrics() {
    const metrics = [];

    try {
      // CPU Usage
      const cpuUsage = process.cpuUsage();
      const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
      metrics.push({
        metric_name: 'system.cpu.usage_percent',
        metric_value: cpuPercent,
        metric_unit: 'percent',
        tags: { component: 'system' }
      });

      // Memory Usage
      const memUsage = process.memoryUsage();
      metrics.push({
        metric_name: 'system.memory.heap_used',
        metric_value: memUsage.heapUsed,
        metric_unit: 'bytes',
        tags: { component: 'system' }
      });

      metrics.push({
        metric_name: 'system.memory.heap_total',
        metric_value: memUsage.heapTotal,
        metric_unit: 'bytes',
        tags: { component: 'system' }
      });

      metrics.push({
        metric_name: 'system.memory.rss',
        metric_value: memUsage.rss,
        metric_unit: 'bytes',
        tags: { component: 'system' }
      });

      // System Load
      const loadAvg = os.loadavg();
      metrics.push({
        metric_name: 'system.load.1min',
        metric_value: loadAvg[0],
        metric_unit: 'load',
        tags: { component: 'system' }
      });

      // Process uptime
      metrics.push({
        metric_name: 'system.uptime',
        metric_value: process.uptime(),
        metric_unit: 'seconds',
        tags: { component: 'system' }
      });

      // Free memory
      const freeMem = os.freemem();
      const totalMem = os.totalmem();
      metrics.push({
        metric_name: 'system.memory.free',
        metric_value: freeMem,
        metric_unit: 'bytes',
        tags: { component: 'system' }
      });

      metrics.push({
        metric_name: 'system.memory.usage_percent',
        metric_value: ((totalMem - freeMem) / totalMem) * 100,
        metric_unit: 'percent',
        tags: { component: 'system' }
      });

    } catch (error) {
      logger.error('Error collecting system metrics:', error);
    }

    return metrics;
  }

  /**
   * Collect application-level metrics
   */
  async collectApplicationMetrics() {
    const metrics = [];

    try {
      // Active handles and requests
      metrics.push({
        metric_name: 'app.handles.active',
        metric_value: process._getActiveHandles().length,
        metric_unit: 'count',
        tags: { component: 'application' }
      });

      metrics.push({
        metric_name: 'app.requests.active',
        metric_value: process._getActiveRequests().length,
        metric_unit: 'count',
        tags: { component: 'application' }
      });

      // Event loop lag (simplified)
      const start = process.hrtime.bigint();
      await new Promise(resolve => setImmediate(resolve));
      const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds

      metrics.push({
        metric_name: 'app.event_loop.lag',
        metric_value: lag,
        metric_unit: 'milliseconds',
        tags: { component: 'application' }
      });

      // Get metrics from in-memory store
      const inMemoryMetrics = this.getRecentMetricsFromMemory();
      
      // Calculate derived metrics
      const recentErrorRate = this.calculateErrorRate(inMemoryMetrics);
      const avgResponseTime = this.calculateAverageResponseTime(inMemoryMetrics);

      if (recentErrorRate !== null) {
        metrics.push({
          metric_name: 'app.errors.rate',
          metric_value: recentErrorRate,
          metric_unit: 'percent',
          tags: { component: 'application', period: '5min' }
        });
      }

      if (avgResponseTime !== null) {
        metrics.push({
          metric_name: 'app.response_time.avg',
          metric_value: avgResponseTime,
          metric_unit: 'milliseconds',
          tags: { component: 'application', period: '5min' }
        });
      }

    } catch (error) {
      logger.error('Error collecting application metrics:', error);
    }

    return metrics;
  }

  /**
   * Collect database-related metrics
   */
  async collectDatabaseMetrics() {
    const metrics = [];

    try {
      // Get connection pool stats
      const connectionStats = connectionManager.getConnectionStats();
      
      metrics.push({
        metric_name: 'database.connections.total',
        metric_value: connectionStats.poolInfo.totalCount,
        metric_unit: 'count',
        tags: { component: 'database' }
      });

      metrics.push({
        metric_name: 'database.connections.active',
        metric_value: connectionStats.poolInfo.totalCount - connectionStats.poolInfo.idleCount,
        metric_unit: 'count',
        tags: { component: 'database' }
      });

      metrics.push({
        metric_name: 'database.connections.idle',
        metric_value: connectionStats.poolInfo.idleCount,
        metric_unit: 'count',
        tags: { component: 'database' }
      });

      metrics.push({
        metric_name: 'database.connections.waiting',
        metric_value: connectionStats.poolInfo.waitingCount,
        metric_unit: 'count',
        tags: { component: 'database' }
      });

      // Connection pool utilization
      const utilization = connectionStats.poolInfo.totalCount > 0 ?
        ((connectionStats.poolInfo.totalCount - connectionStats.poolInfo.idleCount) / connectionStats.poolInfo.totalCount) * 100 : 0;

      metrics.push({
        metric_name: 'database.connections.utilization',
        metric_value: utilization,
        metric_unit: 'percent',
        tags: { component: 'database' }
      });

      // Query metrics
      metrics.push({
        metric_name: 'database.queries.total',
        metric_value: connectionStats.queryCount,
        metric_unit: 'count',
        tags: { component: 'database' }
      });

      metrics.push({
        metric_name: 'database.errors.total',
        metric_value: connectionStats.errorCount,
        metric_unit: 'count',
        tags: { component: 'database' }
      });

      // Error rate
      const errorRate = connectionStats.queryCount > 0 ? 
        (connectionStats.errorCount / connectionStats.queryCount) * 100 : 0;

      metrics.push({
        metric_name: 'database.errors.rate',
        metric_value: errorRate,
        metric_unit: 'percent',
        tags: { component: 'database' }
      });

    } catch (error) {
      logger.error('Error collecting database metrics:', error);
    }

    return metrics;
  }

  /**
   * Collect API-related metrics
   */
  async collectAPIMetrics() {
    const metrics = [];

    try {
      // These would typically be collected from middleware that tracks API calls
      // For now, we'll use placeholder values that would be populated by request middleware
      
      const apiMetrics = this.getAPIMetricsFromMemory();
      
      if (apiMetrics.requestCount !== undefined) {
        metrics.push({
          metric_name: 'api.requests.total',
          metric_value: apiMetrics.requestCount,
          metric_unit: 'count',
          tags: { component: 'api', period: '1min' }
        });
      }

      if (apiMetrics.avgResponseTime !== undefined) {
        metrics.push({
          metric_name: 'api.response_time.avg',
          metric_value: apiMetrics.avgResponseTime,
          metric_unit: 'milliseconds',
          tags: { component: 'api', period: '1min' }
        });
      }

      if (apiMetrics.errorCount !== undefined) {
        metrics.push({
          metric_name: 'api.errors.total',
          metric_value: apiMetrics.errorCount,
          metric_unit: 'count',
          tags: { component: 'api', period: '1min' }
        });
      }

      // Rate limiting metrics
      if (apiMetrics.rateLimitHits !== undefined) {
        metrics.push({
          metric_name: 'api.rate_limit.hits',
          metric_value: apiMetrics.rateLimitHits,
          metric_unit: 'count',
          tags: { component: 'api', period: '1min' }
        });
      }

    } catch (error) {
      logger.error('Error collecting API metrics:', error);
    }

    return metrics;
  }

  /**
   * Collect business-related metrics
   */
  async collectBusinessMetrics() {
    const metrics = [];

    try {
      // Get recent business metrics from database
      const query = `
        SELECT 
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_transactions,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
          COUNT(*) as total_transactions,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
          COUNT(DISTINCT crawler_id) as active_crawlers,
          COUNT(DISTINCT publisher_id) as active_publishers
        FROM transactions 
        WHERE created_at > NOW() - INTERVAL '5 minutes'
      `;

      const result = await connectionManager.query(query);
      const data = result.rows[0];

      metrics.push({
        metric_name: 'business.transactions.successful',
        metric_value: parseInt(data.successful_transactions) || 0,
        metric_unit: 'count',
        tags: { component: 'business', period: '5min' }
      });

      metrics.push({
        metric_name: 'business.transactions.failed',
        metric_value: parseInt(data.failed_transactions) || 0,
        metric_unit: 'count',
        tags: { component: 'business', period: '5min' }
      });

      metrics.push({
        metric_name: 'business.transactions.total',
        metric_value: parseInt(data.total_transactions) || 0,
        metric_unit: 'count',
        tags: { component: 'business', period: '5min' }
      });

      metrics.push({
        metric_name: 'business.revenue.total',
        metric_value: parseFloat(data.total_revenue) || 0,
        metric_unit: 'usd',
        tags: { component: 'business', period: '5min' }
      });

      metrics.push({
        metric_name: 'business.users.active_crawlers',
        metric_value: parseInt(data.active_crawlers) || 0,
        metric_unit: 'count',
        tags: { component: 'business', period: '5min' }
      });

      metrics.push({
        metric_name: 'business.users.active_publishers',
        metric_value: parseInt(data.active_publishers) || 0,
        metric_unit: 'count',
        tags: { component: 'business', period: '5min' }
      });

      // Transaction success rate
      const totalTx = parseInt(data.total_transactions) || 0;
      const successfulTx = parseInt(data.successful_transactions) || 0;
      const successRate = totalTx > 0 ? (successfulTx / totalTx) * 100 : 100;

      metrics.push({
        metric_name: 'business.transactions.success_rate',
        metric_value: successRate,
        metric_unit: 'percent',
        tags: { component: 'business', period: '5min' }
      });

    } catch (error) {
      logger.error('Error collecting business metrics:', error);
    }

    return metrics;
  }

  /**
   * Store metrics in memory for quick access
   */
  storeMetricsInMemory(metrics) {
    const timestamp = Date.now();
    
    metrics.forEach(metric => {
      const key = metric.metric_name;
      
      if (!this.metrics.has(key)) {
        this.metrics.set(key, []);
      }
      
      const metricArray = this.metrics.get(key);
      metricArray.push({
        ...metric,
        timestamp
      });
      
      // Keep only recent metrics in memory
      const cutoff = timestamp - (this.config.retentionPeriod * 60 * 60 * 1000);
      this.metrics.set(key, metricArray.filter(m => m.timestamp > cutoff));
      
      // Limit memory usage
      if (metricArray.length > this.config.maxMetricsInMemory) {
        metricArray.splice(0, metricArray.length - this.config.maxMetricsInMemory);
      }
    });
  }

  /**
   * Persist metrics to database
   */
  async persistMetrics(metrics) {
    if (metrics.length === 0) return;

    try {
      const values = metrics.map(metric => [
        metric.metric_name,
        metric.metric_value,
        metric.metric_unit || null,
        JSON.stringify(metric.tags || {}),
        metric.collected_at,
        metric.instance_id
      ]);

      const placeholders = values.map((_, i) => {
        const offset = i * 6;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`;
      }).join(', ');

      const query = `
        INSERT INTO application_metrics 
        (metric_name, metric_value, metric_unit, tags, collected_at, instance_id)
        VALUES ${placeholders}
      `;

      await connectionManager.query(query, values.flat());
      
    } catch (error) {
      logger.error('Error persisting metrics:', error);
      throw error;
    }
  }

  /**
   * Check for alert conditions
   */
  async checkAlerts() {
    try {
      const alerts = await this.evaluateAlertConditions();
      
      for (const alert of alerts) {
        await this.processAlert(alert);
      }
      
    } catch (error) {
      logger.error('Error checking alerts:', error);
    }
  }

  /**
   * Evaluate alert conditions based on current metrics
   */
  async evaluateAlertConditions() {
    const alerts = [];
    const recentMetrics = this.getRecentMetricsFromMemory();

    // System alerts
    const cpuMetrics = recentMetrics.filter(m => m.metric_name === 'system.cpu.usage_percent');
    if (cpuMetrics.length > 0) {
      const avgCpu = cpuMetrics.reduce((sum, m) => sum + m.metric_value, 0) / cpuMetrics.length;
      if (avgCpu > this.thresholds.cpuUsage) {
        alerts.push({
          name: 'high_cpu_usage',
          severity: avgCpu > 90 ? 'critical' : 'warning',
          message: `High CPU usage detected: ${avgCpu.toFixed(2)}%`,
          metric_name: 'system.cpu.usage_percent',
          metric_value: avgCpu,
          threshold_value: this.thresholds.cpuUsage
        });
      }
    }

    // Memory alerts
    const memMetrics = recentMetrics.filter(m => m.metric_name === 'system.memory.usage_percent');
    if (memMetrics.length > 0) {
      const avgMem = memMetrics.reduce((sum, m) => sum + m.metric_value, 0) / memMetrics.length;
      if (avgMem > this.thresholds.memoryUsage) {
        alerts.push({
          name: 'high_memory_usage',
          severity: avgMem > 95 ? 'critical' : 'warning',
          message: `High memory usage detected: ${avgMem.toFixed(2)}%`,
          metric_name: 'system.memory.usage_percent',
          metric_value: avgMem,
          threshold_value: this.thresholds.memoryUsage
        });
      }
    }

    // Database connection pool alerts
    const poolMetrics = recentMetrics.filter(m => m.metric_name === 'database.connections.utilization');
    if (poolMetrics.length > 0) {
      const avgPool = poolMetrics.reduce((sum, m) => sum + m.metric_value, 0) / poolMetrics.length;
      if (avgPool > this.thresholds.connectionPool) {
        alerts.push({
          name: 'high_connection_pool_usage',
          severity: avgPool > 95 ? 'critical' : 'warning',
          message: `High database connection pool usage: ${avgPool.toFixed(2)}%`,
          metric_name: 'database.connections.utilization',
          metric_value: avgPool,
          threshold_value: this.thresholds.connectionPool
        });
      }
    }

    // Error rate alerts
    const errorRateMetrics = recentMetrics.filter(m => m.metric_name === 'app.errors.rate');
    if (errorRateMetrics.length > 0) {
      const avgErrorRate = errorRateMetrics.reduce((sum, m) => sum + m.metric_value, 0) / errorRateMetrics.length;
      if (avgErrorRate > this.thresholds.errorRate) {
        alerts.push({
          name: 'high_error_rate',
          severity: avgErrorRate > 10 ? 'critical' : 'warning',
          message: `High error rate detected: ${avgErrorRate.toFixed(2)}%`,
          metric_name: 'app.errors.rate',
          metric_value: avgErrorRate,
          threshold_value: this.thresholds.errorRate
        });
      }
    }

    return alerts;
  }

  /**
   * Process and handle alerts
   */
  async processAlert(alert) {
    try {
      // Check if alert already exists and is active
      const existingAlert = await this.getActiveAlert(alert.name);
      
      if (existingAlert) {
        // Update existing alert
        await this.updateAlert(existingAlert.id, alert);
      } else {
        // Create new alert
        await this.createAlert(alert);
        
        // Emit alert event
        this.emit('alert:triggered', alert);
        
        // Send notifications
        await this.sendAlertNotifications(alert);
      }
      
    } catch (error) {
      logger.error('Error processing alert:', error);
    }
  }

  /**
   * Get active alert by name
   */
  async getActiveAlert(alertName) {
    try {
      const query = `
        SELECT * FROM alert_incidents 
        WHERE alert_name = $1 AND status = 'active'
        ORDER BY triggered_at DESC 
        LIMIT 1
      `;
      
      const result = await connectionManager.query(query, [alertName]);
      return result.rows[0] || null;
      
    } catch (error) {
      logger.error('Error getting active alert:', error);
      return null;
    }
  }

  /**
   * Create new alert incident
   */
  async createAlert(alert) {
    try {
      const query = `
        INSERT INTO alert_incidents (
          alert_name, severity, message, metric_name, 
          metric_value, threshold_value, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;
      
      const result = await connectionManager.query(query, [
        alert.name,
        alert.severity,
        alert.message,
        alert.metric_name,
        alert.metric_value,
        alert.threshold_value,
        JSON.stringify(alert.metadata || {})
      ]);
      
      logger.warn(`🚨 Alert triggered: ${alert.name} - ${alert.message}`);
      return result.rows[0].id;
      
    } catch (error) {
      logger.error('Error creating alert:', error);
      throw error;
    }
  }

  /**
   * Update existing alert
   */
  async updateAlert(alertId, alert) {
    try {
      const query = `
        UPDATE alert_incidents 
        SET metric_value = $2, triggered_at = NOW()
        WHERE id = $1
      `;
      
      await connectionManager.query(query, [alertId, alert.metric_value]);
      
    } catch (error) {
      logger.error('Error updating alert:', error);
    }
  }

  /**
   * Send alert notifications
   */
  async sendAlertNotifications(alert) {
    try {
      // Log alert (could be extended to send emails, Slack, etc.)
      logger.error(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);
      
      // In a production system, you would integrate with:
      // - Email service
      // - Slack/Discord webhooks
      // - PagerDuty
      // - SMS service
      
      // For now, just emit an event that external systems can listen to
      this.emit('alert:notification', alert);
      
    } catch (error) {
      logger.error('Error sending alert notifications:', error);
    }
  }

  /**
   * Get monitoring status and health
   */
  getMonitoringStatus() {
    return {
      isRunning: this.isRunning,
      config: this.config,
      thresholds: this.thresholds,
      metricsInMemory: this.metrics.size,
      uptime: this.isRunning ? Date.now() - this.startTime : 0,
      lastCollection: this.lastCollectionTime,
      collectInterval: this.config.collectInterval,
      alertCheckInterval: this.config.alertCheckInterval
    };
  }

  /**
   * Get recent metrics from memory
   */
  getRecentMetricsFromMemory(minutes = 5) {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    const recentMetrics = [];
    
    for (const [metricName, metrics] of this.metrics.entries()) {
      const recent = metrics.filter(m => m.timestamp > cutoff);
      recentMetrics.push(...recent);
    }
    
    return recentMetrics;
  }

  /**
   * Calculate error rate from recent metrics
   */
  calculateErrorRate(metrics) {
    const errorMetrics = metrics.filter(m => m.metric_name === 'api.errors.total');
    const requestMetrics = metrics.filter(m => m.metric_name === 'api.requests.total');
    
    if (errorMetrics.length === 0 || requestMetrics.length === 0) {
      return null;
    }
    
    const totalErrors = errorMetrics.reduce((sum, m) => sum + m.metric_value, 0);
    const totalRequests = requestMetrics.reduce((sum, m) => sum + m.metric_value, 0);
    
    return totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  }

  /**
   * Calculate average response time
   */
  calculateAverageResponseTime(metrics) {
    const responseTimeMetrics = metrics.filter(m => m.metric_name === 'api.response_time.avg');
    
    if (responseTimeMetrics.length === 0) {
      return null;
    }
    
    return responseTimeMetrics.reduce((sum, m) => sum + m.metric_value, 0) / responseTimeMetrics.length;
  }

  /**
   * Get API metrics from memory (placeholder)
   */
  getAPIMetricsFromMemory() {
    // This would be populated by API middleware
    return {
      requestCount: 0,
      avgResponseTime: 0,
      errorCount: 0,
      rateLimitHits: 0
    };
  }

  /**
   * Clean up old metrics from database
   */
  async cleanupOldMetrics() {
    try {
      const cutoffTime = new Date(Date.now() - (this.config.retentionPeriod * 60 * 60 * 1000));
      
      const query = `
        DELETE FROM application_metrics 
        WHERE collected_at < $1
      `;
      
      const result = await connectionManager.query(query, [cutoffTime]);
      
      if (result.rowCount > 0) {
        logger.info(`🧹 Cleaned up ${result.rowCount} old metrics`);
      }
      
    } catch (error) {
      logger.error('Error cleaning up old metrics:', error);
    }
  }
}

// Create singleton instance
export const applicationMonitor = new ApplicationMonitor();

// Auto-start monitoring in production
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_MONITORING === 'true') {
  applicationMonitor.start().catch(error => {
    logger.error('Failed to start application monitoring:', error);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, stopping monitoring...');
  await applicationMonitor.stop();
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, stopping monitoring...');
  await applicationMonitor.stop();
  process.exit(0);
});

export default applicationMonitor;