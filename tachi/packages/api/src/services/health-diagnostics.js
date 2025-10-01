/**
 * Health Checks and Diagnostics Service
 * Provides comprehensive system health monitoring and diagnostic capabilities
 */

import { createLogger } from '../utils/logger.js';
import { connectionManager } from '../db/connection-pool.js';
import { applicationMonitor } from './monitoring.js';
import { errorTracker } from './error-tracking.js';
import EventEmitter from 'events';
import os from 'os';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const logger = createLogger();

export class HealthDiagnostics extends EventEmitter {
  constructor() {
    super();
    this.healthChecks = new Map();
    this.diagnosticTests = new Map();
    this.isRunning = false;
    this.checkInterval = null;
    
    this.config = {
      healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000, // 30 seconds
      enableDiskCheck: process.env.ENABLE_DISK_CHECK !== 'false',
      enableNetworkCheck: process.env.ENABLE_NETWORK_CHECK !== 'false',
      enableServiceCheck: process.env.ENABLE_SERVICE_CHECK !== 'false',
      diskThreshold: parseFloat(process.env.DISK_THRESHOLD) || 85, // 85%
      memoryThreshold: parseFloat(process.env.MEMORY_THRESHOLD) || 90, // 90%
      cpuThreshold: parseFloat(process.env.CPU_THRESHOLD) || 85, // 85%
      responseTimeThreshold: parseInt(process.env.RESPONSE_TIME_THRESHOLD) || 1000 // 1 second
    };

    this.initializeHealthChecks();
    this.initializeDiagnosticTests();
  }

  /**
   * Initialize built-in health checks
   */
  initializeHealthChecks() {
    // Database connectivity check
    this.registerHealthCheck('database', async () => {
      try {
        const start = Date.now();
        await connectionManager.query('SELECT 1');
        const responseTime = Date.now() - start;
        
        return {
          status: 'healthy',
          responseTime,
          details: 'Database connection successful'
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error.message,
          details: 'Database connection failed'
        };
      }
    });

    // Memory usage check
    this.registerHealthCheck('memory', async () => {
      const memUsage = process.memoryUsage();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memoryUsagePercent = (usedMem / totalMem) * 100;
      
      const status = memoryUsagePercent > this.config.memoryThreshold ? 'unhealthy' : 'healthy';
      
      return {
        status,
        memoryUsagePercent: Math.round(memoryUsagePercent * 100) / 100,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        rss: memUsage.rss,
        external: memUsage.external,
        details: `Memory usage: ${memoryUsagePercent.toFixed(2)}%`
      };
    });

    // CPU usage check
    this.registerHealthCheck('cpu', async () => {
      const loadAvg = os.loadavg();
      const cpuCount = os.cpus().length;
      const loadPercent = (loadAvg[0] / cpuCount) * 100;
      
      const status = loadPercent > this.config.cpuThreshold ? 'unhealthy' : 'healthy';
      
      return {
        status,
        loadAverage: {
          '1min': loadAvg[0],
          '5min': loadAvg[1],
          '15min': loadAvg[2]
        },
        cpuCount,
        loadPercent: Math.round(loadPercent * 100) / 100,
        details: `CPU load: ${loadPercent.toFixed(2)}%`
      };
    });

    // Disk space check (if enabled)
    if (this.config.enableDiskCheck) {
      this.registerHealthCheck('disk', async () => {
        try {
          const diskUsage = await this.getDiskUsage();
          const status = diskUsage.usagePercent > this.config.diskThreshold ? 'unhealthy' : 'healthy';
          
          return {
            status,
            ...diskUsage,
            details: `Disk usage: ${diskUsage.usagePercent.toFixed(2)}%`
          };
        } catch (error) {
          return {
            status: 'unknown',
            error: error.message,
            details: 'Unable to check disk usage'
          };
        }
      });
    }

    // Application monitoring service check
    this.registerHealthCheck('monitoring', async () => {
      const monitoringStatus = applicationMonitor.getMonitoringStatus();
      
      return {
        status: monitoringStatus.isRunning ? 'healthy' : 'unhealthy',
        isRunning: monitoringStatus.isRunning,
        metricsInMemory: monitoringStatus.metricsInMemory,
        uptime: monitoringStatus.uptime,
        details: monitoringStatus.isRunning ? 'Monitoring service operational' : 'Monitoring service not running'
      };
    });

    // Error tracking service check
    this.registerHealthCheck('error_tracking', async () => {
      const trackingStatus = errorTracker.getStatus();
      
      return {
        status: trackingStatus.isInitialized ? 'healthy' : 'unhealthy',
        isInitialized: trackingStatus.isInitialized,
        errorCount: trackingStatus.errorCount,
        bufferSize: trackingStatus.bufferSize,
        details: trackingStatus.isInitialized ? 'Error tracking operational' : 'Error tracking not initialized'
      };
    });

    // External API connectivity check (if configured)
    if (process.env.EXTERNAL_API_HEALTH_CHECK) {
      this.registerHealthCheck('external_apis', async () => {
        try {
          const checks = await this.checkExternalAPIs();
          const allHealthy = checks.every(check => check.status === 'healthy');
          
          return {
            status: allHealthy ? 'healthy' : 'degraded',
            apis: checks,
            details: allHealthy ? 'All external APIs accessible' : 'Some external APIs unavailable'
          };
        } catch (error) {
          return {
            status: 'unhealthy',
            error: error.message,
            details: 'External API health check failed'
          };
        }
      });
    }
  }

  /**
   * Initialize diagnostic tests
   */
  initializeDiagnosticTests() {
    // Database performance test
    this.registerDiagnosticTest('database_performance', async () => {
      const results = [];
      
      try {
        // Test simple query performance
        const start1 = Date.now();
        await connectionManager.query('SELECT 1');
        const simpleQueryTime = Date.now() - start1;
        results.push({
          test: 'simple_query',
          duration: simpleQueryTime,
          status: simpleQueryTime < 100 ? 'pass' : 'slow'
        });

        // Test complex query performance
        const start2 = Date.now();
        await connectionManager.query(`
          SELECT COUNT(*) FROM information_schema.tables 
          WHERE table_schema = 'public'
        `);
        const complexQueryTime = Date.now() - start2;
        results.push({
          test: 'complex_query',
          duration: complexQueryTime,
          status: complexQueryTime < 500 ? 'pass' : 'slow'
        });

        // Test connection pool
        const poolStats = connectionManager.getConnectionStats();
        results.push({
          test: 'connection_pool',
          poolInfo: poolStats.poolInfo,
          status: poolStats.poolInfo.waitingCount === 0 ? 'pass' : 'warning'
        });

      } catch (error) {
        results.push({
          test: 'database_error',
          error: error.message,
          status: 'fail'
        });
      }

      return results;
    });

    // Memory leak detection
    this.registerDiagnosticTest('memory_analysis', async () => {
      const results = [];
      
      try {
        const memUsage = process.memoryUsage();
        const gcBefore = global.gc ? global.gc() : null;
        
        // Wait a moment and check again
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const memUsageAfter = process.memoryUsage();
        const heapGrowth = memUsageAfter.heapUsed - memUsage.heapUsed;
        
        results.push({
          test: 'heap_growth',
          heapGrowthBytes: heapGrowth,
          heapGrowthMB: Math.round(heapGrowth / 1024 / 1024 * 100) / 100,
          status: Math.abs(heapGrowth) < 10 * 1024 * 1024 ? 'pass' : 'warning' // 10MB threshold
        });

        results.push({
          test: 'memory_usage',
          heapUsedMB: Math.round(memUsageAfter.heapUsed / 1024 / 1024 * 100) / 100,
          heapTotalMB: Math.round(memUsageAfter.heapTotal / 1024 / 1024 * 100) / 100,
          rssMB: Math.round(memUsageAfter.rss / 1024 / 1024 * 100) / 100,
          status: memUsageAfter.heapUsed < memUsageAfter.heapTotal * 0.9 ? 'pass' : 'warning'
        });

      } catch (error) {
        results.push({
          test: 'memory_analysis_error',
          error: error.message,
          status: 'fail'
        });
      }

      return results;
    });

    // Error rate analysis
    this.registerDiagnosticTest('error_analysis', async () => {
      const results = [];
      
      try {
        const errorStats = await errorTracker.getErrorStatistics('1h');
        const topErrors = await errorTracker.getTopErrors(5, '1h');
        
        results.push({
          test: 'error_rate',
          totalErrors: errorStats.total_errors || 0,
          uniqueErrors: errorStats.unique_errors || 0,
          fatalErrors: errorStats.fatal_errors || 0,
          status: (errorStats.fatal_errors || 0) === 0 && (errorStats.total_errors || 0) < 100 ? 'pass' : 'warning'
        });

        results.push({
          test: 'top_errors',
          errors: topErrors.map(error => ({
            type: error.error_type,
            message: error.error_message.substring(0, 100),
            count: error.occurrence_count,
            severity: error.severity
          })),
          status: topErrors.length === 0 ? 'pass' : 'info'
        });

      } catch (error) {
        results.push({
          test: 'error_analysis_error',
          error: error.message,
          status: 'fail'
        });
      }

      return results;
    });

    // System resource utilization
    this.registerDiagnosticTest('system_resources', async () => {
      const results = [];
      
      try {
        const cpus = os.cpus();
        const loadAvg = os.loadavg();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const uptime = os.uptime();
        
        results.push({
          test: 'cpu_info',
          cpuCount: cpus.length,
          cpuModel: cpus[0]?.model || 'Unknown',
          loadAverage: loadAvg,
          status: loadAvg[0] < cpus.length * 0.8 ? 'pass' : 'warning'
        });

        results.push({
          test: 'memory_info',
          totalMemoryGB: Math.round(totalMem / 1024 / 1024 / 1024 * 100) / 100,
          freeMemoryGB: Math.round(freeMem / 1024 / 1024 / 1024 * 100) / 100,
          memoryUsagePercent: Math.round((totalMem - freeMem) / totalMem * 10000) / 100,
          status: freeMem / totalMem > 0.1 ? 'pass' : 'warning' // At least 10% free
        });

        results.push({
          test: 'system_uptime',
          uptimeHours: Math.round(uptime / 3600 * 100) / 100,
          status: uptime > 3600 ? 'pass' : 'info' // At least 1 hour
        });

      } catch (error) {
        results.push({
          test: 'system_resources_error',
          error: error.message,
          status: 'fail'
        });
      }

      return results;
    });
  }

  /**
   * Register a new health check
   */
  registerHealthCheck(name, checkFunction) {
    this.healthChecks.set(name, checkFunction);
    logger.debug(`Health check registered: ${name}`);
  }

  /**
   * Register a new diagnostic test
   */
  registerDiagnosticTest(name, testFunction) {
    this.diagnosticTests.set(name, testFunction);
    logger.debug(`Diagnostic test registered: ${name}`);
  }

  /**
   * Run all health checks
   */
  async runHealthChecks(includeChecks = []) {
    const results = new Map();
    const checksToRun = includeChecks.length > 0 ? 
      includeChecks.filter(name => this.healthChecks.has(name)) : 
      Array.from(this.healthChecks.keys());

    const startTime = Date.now();

    for (const checkName of checksToRun) {
      const checkFunction = this.healthChecks.get(checkName);
      const checkStart = Date.now();

      try {
        const result = await Promise.race([
          checkFunction(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 5000)
          )
        ]);

        results.set(checkName, {
          ...result,
          duration: Date.now() - checkStart,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        results.set(checkName, {
          status: 'unhealthy',
          error: error.message,
          duration: Date.now() - checkStart,
          timestamp: new Date().toISOString()
        });
      }
    }

    const totalDuration = Date.now() - startTime;
    const overallStatus = this.calculateOverallStatus(results);

    return {
      status: overallStatus,
      checks: Object.fromEntries(results),
      summary: {
        total: results.size,
        healthy: Array.from(results.values()).filter(r => r.status === 'healthy').length,
        unhealthy: Array.from(results.values()).filter(r => r.status === 'unhealthy').length,
        unknown: Array.from(results.values()).filter(r => r.status === 'unknown').length,
        degraded: Array.from(results.values()).filter(r => r.status === 'degraded').length
      },
      duration: totalDuration,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Run diagnostic tests
   */
  async runDiagnostics(includeTests = []) {
    const results = new Map();
    const testsToRun = includeTests.length > 0 ? 
      includeTests.filter(name => this.diagnosticTests.has(name)) : 
      Array.from(this.diagnosticTests.keys());

    const startTime = Date.now();

    for (const testName of testsToRun) {
      const testFunction = this.diagnosticTests.get(testName);
      const testStart = Date.now();

      try {
        const result = await Promise.race([
          testFunction(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Diagnostic test timeout')), 30000)
          )
        ]);

        results.set(testName, {
          results: result,
          duration: Date.now() - testStart,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        results.set(testName, {
          results: [{
            test: testName,
            error: error.message,
            status: 'fail'
          }],
          duration: Date.now() - testStart,
          timestamp: new Date().toISOString()
        });
      }
    }

    const totalDuration = Date.now() - startTime;

    return {
      diagnostics: Object.fromEntries(results),
      summary: {
        total: results.size,
        duration: totalDuration
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Start periodic health monitoring
   */
  async startMonitoring() {
    if (this.isRunning) {
      logger.warn('Health monitoring is already running');
      return;
    }

    try {
      logger.info('🚀 Starting health monitoring...');
      
      this.checkInterval = setInterval(async () => {
        try {
          const healthResults = await this.runHealthChecks();
          
          // Emit health check results
          this.emit('health:checked', healthResults);
          
          // Log any unhealthy services
          Object.entries(healthResults.checks).forEach(([name, result]) => {
            if (result.status === 'unhealthy') {
              logger.warn(`Health check failed: ${name} - ${result.details || result.error}`);
            }
          });
          
          // Store health check results in database
          await this.storeHealthCheckResults(healthResults);

        } catch (error) {
          logger.error('Error during health monitoring:', error);
        }
      }, this.config.healthCheckInterval);

      this.isRunning = true;
      logger.info('✅ Health monitoring started');
      
      this.emit('monitoring:started');

    } catch (error) {
      logger.error('❌ Failed to start health monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop health monitoring
   */
  async stopMonitoring() {
    if (!this.isRunning) {
      return;
    }

    logger.info('🛑 Stopping health monitoring...');

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.isRunning = false;
    logger.info('✅ Health monitoring stopped');
    
    this.emit('monitoring:stopped');
  }

  /**
   * Calculate overall system status
   */
  calculateOverallStatus(results) {
    const statuses = Array.from(results.values()).map(r => r.status);
    
    if (statuses.some(s => s === 'unhealthy')) return 'unhealthy';
    if (statuses.some(s => s === 'degraded')) return 'degraded';
    if (statuses.some(s => s === 'unknown')) return 'unknown';
    return 'healthy';
  }

  /**
   * Get disk usage information
   */
  async getDiskUsage() {
    try {
      if (process.platform === 'win32') {
        // Windows disk usage check
        const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption');
        // Parse Windows output (simplified)
        return { usagePercent: 50, available: '1TB', used: '500GB' }; // Placeholder
      } else {
        // Unix-like systems
        const { stdout } = await execAsync('df -h /');
        const lines = stdout.trim().split('\\n');
        const data = lines[1].split(/\\s+/);
        
        const usagePercent = parseInt(data[4]);
        return {
          filesystem: data[0],
          size: data[1],
          used: data[2],
          available: data[3],
          usagePercent,
          mountpoint: data[5]
        };
      }
    } catch (error) {
      logger.warn('Could not get disk usage:', error.message);
      throw error;
    }
  }

  /**
   * Check external API connectivity
   */
  async checkExternalAPIs() {
    const apis = (process.env.EXTERNAL_API_HEALTH_CHECK || '').split(',').filter(Boolean);
    const results = [];

    for (const apiUrl of apis) {
      try {
        const start = Date.now();
        const response = await fetch(apiUrl.trim(), { 
          method: 'HEAD',
          timeout: 5000 
        });
        const duration = Date.now() - start;

        results.push({
          url: apiUrl.trim(),
          status: response.ok ? 'healthy' : 'unhealthy',
          responseTime: duration,
          httpStatus: response.status
        });

      } catch (error) {
        results.push({
          url: apiUrl.trim(),
          status: 'unhealthy',
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Store health check results in database
   */
  async storeHealthCheckResults(healthResults) {
    try {
      const query = `
        INSERT INTO system_health (component, status, response_time_ms, metadata, checked_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (component) DO UPDATE SET
          status = EXCLUDED.status,
          response_time_ms = EXCLUDED.response_time_ms,
          metadata = EXCLUDED.metadata,
          checked_at = EXCLUDED.checked_at
      `;

      for (const [component, result] of Object.entries(healthResults.checks)) {
        await connectionManager.query(query, [
          component,
          result.status,
          result.duration || null,
          JSON.stringify(result),
          result.timestamp
        ]);
      }

    } catch (error) {
      logger.warn('Failed to store health check results:', error);
    }
  }

  /**
   * Get health monitoring status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.config.healthCheckInterval,
      healthChecks: Array.from(this.healthChecks.keys()),
      diagnosticTests: Array.from(this.diagnosticTests.keys()),
      config: this.config
    };
  }

  /**
   * Generate health report
   */
  async generateHealthReport(includeDiagnostics = false) {
    try {
      const healthResults = await this.runHealthChecks();
      const report = {
        overview: {
          status: healthResults.status,
          timestamp: healthResults.timestamp,
          duration: healthResults.duration,
          summary: healthResults.summary
        },
        healthChecks: healthResults.checks,
        systemInfo: {
          platform: os.platform(),
          architecture: os.arch(),
          nodeVersion: process.version,
          uptime: process.uptime(),
          pid: process.pid,
          environment: process.env.NODE_ENV || 'development'
        }
      };

      if (includeDiagnostics) {
        const diagnosticResults = await this.runDiagnostics();
        report.diagnostics = diagnosticResults;
      }

      return report;

    } catch (error) {
      logger.error('Failed to generate health report:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const healthDiagnostics = new HealthDiagnostics();

// Auto-start monitoring in production
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_HEALTH_MONITORING === 'true') {
  healthDiagnostics.startMonitoring().catch(error => {
    logger.error('Failed to start health monitoring:', error);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, stopping health monitoring...');
  await healthDiagnostics.stopMonitoring();
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, stopping health monitoring...');
  await healthDiagnostics.stopMonitoring();
});

export default healthDiagnostics;