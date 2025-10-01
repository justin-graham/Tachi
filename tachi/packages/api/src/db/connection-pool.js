/**
 * Database Connection Pool and Optimization Layer
 * Provides optimized database connections, caching, and performance monitoring
 */

import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();

class DatabaseConnectionManager {
  constructor() {
    this.supabaseClient = null;
    this.pgPool = null;
    this.isInitialized = false;
    this.connectionStats = {
      totalConnections: 0,
      activeConnections: 0,
      poolHits: 0,
      poolMisses: 0,
      queryCount: 0,
      errorCount: 0,
      lastError: null
    };
  }

  /**
   * Initialize database connections with optimized configuration
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        return;
      }

      logger.info('🔧 Initializing database connection pool...');

      // Initialize Supabase client with optimized settings
      this.supabaseClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          },
          db: {
            schema: 'public'
          },
          global: {
            headers: {
              'x-application-name': 'tachi-api'
            }
          },
          realtime: {
            enabled: false // Disable realtime for API performance
          }
        }
      );

      // Initialize PostgreSQL connection pool for direct queries
      this.pgPool = new Pool({
        connectionString: process.env.DATABASE_URL || this.buildConnectionString(),
        max: parseInt(process.env.DB_POOL_MAX) || 20,
        min: parseInt(process.env.DB_POOL_MIN) || 5,
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
        connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 5000,
        acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
        application_name: 'tachi-api',
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
        statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000,
        query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000
      });

      // Set up pool event listeners
      this.setupPoolEventListeners();

      // Test connections
      await this.testConnections();

      this.isInitialized = true;
      logger.info('✅ Database connection pool initialized successfully');

    } catch (error) {
      logger.error('❌ Failed to initialize database connection pool:', error);
      throw error;
    }
  }

  /**
   * Build connection string from environment variables
   */
  buildConnectionString() {
    const host = process.env.SUPABASE_DB_HOST || 'localhost';
    const port = process.env.SUPABASE_DB_PORT || 5432;
    const database = process.env.SUPABASE_DB_NAME || 'postgres';
    const username = process.env.SUPABASE_DB_USER || 'postgres';
    const password = process.env.SUPABASE_DB_PASSWORD || '';

    return `postgresql://${username}:${password}@${host}:${port}/${database}?sslmode=require`;
  }

  /**
   * Set up connection pool event listeners for monitoring
   */
  setupPoolEventListeners() {
    this.pgPool.on('connect', (client) => {
      this.connectionStats.totalConnections++;
      this.connectionStats.activeConnections++;
      logger.debug('🔗 New database connection established');
    });

    this.pgPool.on('acquire', (client) => {
      this.connectionStats.poolHits++;
      logger.debug('📥 Connection acquired from pool');
    });

    this.pgPool.on('release', (client) => {
      this.connectionStats.activeConnections--;
      logger.debug('📤 Connection released to pool');
    });

    this.pgPool.on('remove', (client) => {
      this.connectionStats.activeConnections--;
      logger.debug('🗑️ Connection removed from pool');
    });

    this.pgPool.on('error', (error, client) => {
      this.connectionStats.errorCount++;
      this.connectionStats.lastError = error.message;
      logger.error('💥 Database connection error:', error);
    });
  }

  /**
   * Test database connections
   */
  async testConnections() {
    try {
      // Test Supabase connection
      const { data, error } = await this.supabaseClient
        .from('system_health')
        .select('component')
        .limit(1);

      if (error) {
        logger.warn('⚠️ Supabase connection test failed:', error);
      } else {
        logger.info('✅ Supabase connection test passed');
      }

      // Test PostgreSQL pool connection
      const client = await this.pgPool.connect();
      const result = await client.query('SELECT NOW() as current_time');
      client.release();

      logger.info('✅ PostgreSQL pool connection test passed');

    } catch (error) {
      logger.error('❌ Database connection test failed:', error);
      throw error;
    }
  }

  /**
   * Get Supabase client instance
   */
  getSupabaseClient() {
    if (!this.isInitialized) {
      throw new Error('Database connection manager not initialized');
    }
    return this.supabaseClient;
  }

  /**
   * Execute query with connection pooling
   */
  async query(text, params = []) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    let client;

    try {
      client = await this.pgPool.connect();
      const result = await client.query(text, params);
      
      this.connectionStats.queryCount++;
      const executionTime = Date.now() - startTime;
      
      if (executionTime > 1000) {
        logger.warn(`🐌 Slow query detected (${executionTime}ms):`, text.substring(0, 100));
      }

      return result;

    } catch (error) {
      this.connectionStats.errorCount++;
      this.connectionStats.lastError = error.message;
      logger.error('💥 Database query failed:', error);
      throw error;

    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Execute transaction with automatic rollback on error
   */
  async transaction(callback) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const client = await this.pgPool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('💥 Transaction failed, rolled back:', error);
      throw error;

    } finally {
      client.release();
    }
  }

  /**
   * Get connection pool statistics
   */
  getConnectionStats() {
    return {
      ...this.connectionStats,
      poolInfo: {
        totalCount: this.pgPool?.totalCount || 0,
        idleCount: this.pgPool?.idleCount || 0,
        waitingCount: this.pgPool?.waitingCount || 0
      },
      isInitialized: this.isInitialized
    };
  }

  /**
   * Health check for database connections
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      
      // Test basic query
      const result = await this.query('SELECT 1 as health_check');
      const responseTime = Date.now() - startTime;
      
      const stats = this.getConnectionStats();
      
      return {
        status: 'healthy',
        responseTime,
        connectionStats: stats,
        poolHealth: {
          totalConnections: stats.poolInfo.totalCount,
          activeConnections: stats.poolInfo.totalCount - stats.poolInfo.idleCount,
          idleConnections: stats.poolInfo.idleCount,
          waitingRequests: stats.poolInfo.waitingCount
        },
        lastChecked: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Database health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        connectionStats: this.getConnectionStats(),
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Graceful shutdown of connection pool
   */
  async shutdown() {
    try {
      logger.info('🔄 Shutting down database connection pool...');
      
      if (this.pgPool) {
        await this.pgPool.end();
        logger.info('✅ PostgreSQL connection pool closed');
      }

      this.isInitialized = false;
      logger.info('✅ Database connection manager shutdown complete');

    } catch (error) {
      logger.error('❌ Error during database shutdown:', error);
      throw error;
    }
  }
}

/**
 * Query Result Cache for frequently accessed data
 */
class QueryCache {
  constructor(ttlSeconds = 300) { // 5 minutes default TTL
    this.cache = new Map();
    this.ttl = ttlSeconds * 1000;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cached result
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.data;
  }

  /**
   * Set cache entry
   */
  set(key, data) {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.ttl
    });
  }

  /**
   * Clear expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses) || 0
    };
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

/**
 * Database Performance Monitor
 */
class DatabaseMonitor {
  constructor(connectionManager) {
    this.connectionManager = connectionManager;
    this.metrics = {
      queryTimes: [],
      slowQueries: [],
      errorRates: [],
      connectionUtilization: []
    };
    this.monitoringInterval = null;
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(intervalMs = 60000) { // 1 minute default
    if (this.monitoringInterval) {
      return;
    }

    logger.info('📊 Starting database performance monitoring...');

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        logger.error('❌ Error collecting database metrics:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('📊 Database performance monitoring stopped');
    }
  }

  /**
   * Collect performance metrics
   */
  async collectMetrics() {
    try {
      const healthCheck = await this.connectionManager.healthCheck();
      const stats = this.connectionManager.getConnectionStats();

      // Store metrics with timestamp
      const timestamp = new Date().toISOString();

      this.metrics.connectionUtilization.push({
        timestamp,
        totalConnections: stats.poolInfo.totalCount,
        activeConnections: stats.poolInfo.totalCount - stats.poolInfo.idleCount,
        utilization: (stats.poolInfo.totalCount - stats.poolInfo.idleCount) / stats.poolInfo.totalCount
      });

      this.metrics.errorRates.push({
        timestamp,
        errorCount: stats.errorCount,
        queryCount: stats.queryCount,
        errorRate: stats.queryCount > 0 ? stats.errorCount / stats.queryCount : 0
      });

      // Keep only last 24 hours of metrics
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      this.cleanupOldMetrics(oneDayAgo);

      // Log warnings for concerning metrics
      this.checkMetricThresholds();

    } catch (error) {
      logger.error('❌ Failed to collect database metrics:', error);
    }
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  cleanupOldMetrics(cutoffTime) {
    Object.keys(this.metrics).forEach(key => {
      this.metrics[key] = this.metrics[key].filter(metric => 
        new Date(metric.timestamp).getTime() > cutoffTime
      );
    });
  }

  /**
   * Check metric thresholds and log warnings
   */
  checkMetricThresholds() {
    const stats = this.connectionManager.getConnectionStats();
    
    // Check connection utilization
    if (stats.poolInfo.totalCount > 0) {
      const utilization = (stats.poolInfo.totalCount - stats.poolInfo.idleCount) / stats.poolInfo.totalCount;
      if (utilization > 0.9) {
        logger.warn(`⚠️ High database connection utilization: ${Math.round(utilization * 100)}%`);
      }
    }

    // Check error rate
    if (stats.queryCount > 100) {
      const errorRate = stats.errorCount / stats.queryCount;
      if (errorRate > 0.05) { // 5% error rate
        logger.warn(`⚠️ High database error rate: ${Math.round(errorRate * 100)}%`);
      }
    }

    // Check for waiting requests
    if (stats.poolInfo.waitingCount > 0) {
      logger.warn(`⚠️ Database requests waiting for connections: ${stats.poolInfo.waitingCount}`);
    }
  }

  /**
   * Get performance report
   */
  getPerformanceReport() {
    const stats = this.connectionManager.getConnectionStats();
    
    return {
      connectionStats: stats,
      metrics: {
        connectionUtilization: this.metrics.connectionUtilization.slice(-10), // Last 10 data points
        errorRates: this.metrics.errorRates.slice(-10),
        slowQueries: this.metrics.slowQueries.slice(-10)
      },
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const stats = this.connectionManager.getConnectionStats();

    // Connection pool recommendations
    if (stats.poolInfo.totalCount < 10) {
      recommendations.push('Consider increasing database connection pool size for better performance');
    }

    if (stats.poolInfo.waitingCount > 0) {
      recommendations.push('Increase connection pool size - requests are waiting for available connections');
    }

    // Error rate recommendations
    if (stats.queryCount > 0 && stats.errorCount / stats.queryCount > 0.02) {
      recommendations.push('High error rate detected - review query patterns and error handling');
    }

    // Performance recommendations
    if (this.metrics.slowQueries.length > 10) {
      recommendations.push('Multiple slow queries detected - consider adding database indexes');
    }

    if (recommendations.length === 0) {
      recommendations.push('Database performance is within normal parameters');
    }

    return recommendations;
  }
}

// Create singleton instances
const connectionManager = new DatabaseConnectionManager();
const queryCache = new QueryCache();
const performanceMonitor = new DatabaseMonitor(connectionManager);

// Initialize on module load
connectionManager.initialize().catch(error => {
  logger.error('Failed to initialize database connection manager:', error);
});

// Start performance monitoring
performanceMonitor.startMonitoring();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down database connections...');
  performanceMonitor.stopMonitoring();
  await connectionManager.shutdown();
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down database connections...');
  performanceMonitor.stopMonitoring();
  await connectionManager.shutdown();
  process.exit(0);
});

export {
  connectionManager,
  queryCache,
  performanceMonitor,
  DatabaseConnectionManager,
  QueryCache,
  DatabaseMonitor
};