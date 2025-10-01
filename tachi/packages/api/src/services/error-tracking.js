/**
 * Error Tracking and Centralized Logging Service
 * Provides comprehensive error tracking, logging, and analysis capabilities
 */

import { createLogger } from '../utils/logger.js';
import { connectionManager } from '../db/connection-pool.js';
import EventEmitter from 'events';
import crypto from 'crypto';
import os from 'os';

const logger = createLogger();

export class ErrorTracker extends EventEmitter {
  constructor() {
    super();
    this.isInitialized = false;
    this.errorCount = 0;
    this.errorBuffer = [];
    this.config = {
      bufferSize: parseInt(process.env.ERROR_BUFFER_SIZE) || 100,
      flushInterval: parseInt(process.env.ERROR_FLUSH_INTERVAL) || 5000, // 5 seconds
      retentionDays: parseInt(process.env.ERROR_RETENTION_DAYS) || 30,
      enableStackTrace: process.env.ENABLE_STACK_TRACE !== 'false',
      enableSourceMap: process.env.ENABLE_SOURCE_MAP === 'true',
      maxErrorMessageLength: parseInt(process.env.MAX_ERROR_MESSAGE_LENGTH) || 2000,
      maxStackTraceLength: parseInt(process.env.MAX_STACK_TRACE_LENGTH) || 5000
    };
    
    this.flushInterval = null;
    this.instanceId = process.env.INSTANCE_ID || `api-${os.hostname()}-${process.pid}`;
  }

  /**
   * Initialize error tracking system
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      logger.info('🔧 Initializing error tracking system...');
      
      // Initialize database tables
      await this.initializeErrorTables();
      
      // Set up error handlers
      this.setupErrorHandlers();
      
      // Start error buffer flushing
      this.startErrorFlushing();
      
      // Set up cleanup job
      this.scheduleCleanup();
      
      this.isInitialized = true;
      logger.info('✅ Error tracking system initialized');
      
      this.emit('tracking:started');

    } catch (error) {
      logger.error('❌ Failed to initialize error tracking:', error);
      throw error;
    }
  }

  /**
   * Initialize database tables for error storage
   */
  async initializeErrorTables() {
    try {
      const createTablesSQL = `
        CREATE TABLE IF NOT EXISTS error_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          error_hash VARCHAR(64) UNIQUE NOT NULL,
          error_type VARCHAR(100) NOT NULL,
          error_message TEXT NOT NULL,
          stack_trace TEXT,
          source_file VARCHAR(500),
          source_line INTEGER,
          source_column INTEGER,
          user_id UUID,
          session_id VARCHAR(255),
          request_id VARCHAR(255),
          endpoint VARCHAR(255),
          http_method VARCHAR(10),
          http_status INTEGER,
          user_agent TEXT,
          ip_address INET,
          referer VARCHAR(500),
          occurrence_count INTEGER DEFAULT 1,
          first_seen TIMESTAMPTZ DEFAULT NOW(),
          last_seen TIMESTAMPTZ DEFAULT NOW(),
          severity VARCHAR(20) DEFAULT 'error', -- 'debug', 'info', 'warn', 'error', 'fatal'
          context JSONB DEFAULT '{}',
          environment VARCHAR(50),
          instance_id VARCHAR(100),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS error_occurrences (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          error_hash VARCHAR(64) NOT NULL,
          user_id UUID,
          session_id VARCHAR(255),
          request_id VARCHAR(255),
          additional_context JSONB DEFAULT '{}',
          occurred_at TIMESTAMPTZ DEFAULT NOW(),
          FOREIGN KEY (error_hash) REFERENCES error_logs(error_hash) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS performance_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          operation_name VARCHAR(255) NOT NULL,
          duration_ms INTEGER NOT NULL,
          cpu_usage DECIMAL(5,2),
          memory_usage BIGINT,
          request_id VARCHAR(255),
          user_id UUID,
          endpoint VARCHAR(255),
          query_count INTEGER,
          cache_hits INTEGER,
          cache_misses INTEGER,
          context JSONB DEFAULT '{}',
          logged_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          action VARCHAR(100) NOT NULL,
          resource_type VARCHAR(100),
          resource_id VARCHAR(255),
          user_id UUID,
          user_email VARCHAR(255),
          ip_address INET,
          user_agent TEXT,
          success BOOLEAN DEFAULT TRUE,
          error_message TEXT,
          old_values JSONB,
          new_values JSONB,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_error_logs_hash ON error_logs(error_hash);
        CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
        CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
        CREATE INDEX IF NOT EXISTS idx_error_logs_last_seen ON error_logs(last_seen);
        CREATE INDEX IF NOT EXISTS idx_error_logs_occurrence_count ON error_logs(occurrence_count DESC);

        CREATE INDEX IF NOT EXISTS idx_error_occurrences_hash ON error_occurrences(error_hash);
        CREATE INDEX IF NOT EXISTS idx_error_occurrences_occurred_at ON error_occurrences(occurred_at);
        CREATE INDEX IF NOT EXISTS idx_error_occurrences_user_id ON error_occurrences(user_id);

        CREATE INDEX IF NOT EXISTS idx_performance_logs_operation ON performance_logs(operation_name);
        CREATE INDEX IF NOT EXISTS idx_performance_logs_duration ON performance_logs(duration_ms DESC);
        CREATE INDEX IF NOT EXISTS idx_performance_logs_logged_at ON performance_logs(logged_at);

        CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

        -- Full-text search indexes
        CREATE INDEX IF NOT EXISTS idx_error_logs_message_fts 
        ON error_logs USING GIN(to_tsvector('english', error_message));
        
        CREATE INDEX IF NOT EXISTS idx_error_logs_stack_trace_fts 
        ON error_logs USING GIN(to_tsvector('english', stack_trace));
      `;

      await connectionManager.query(createTablesSQL);
      logger.debug('✅ Error tracking tables initialized');

    } catch (error) {
      logger.error('❌ Failed to initialize error tables:', error);
      throw error;
    }
  }

  /**
   * Set up global error handlers
   */
  setupErrorHandlers() {
    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.trackError(error, {
        type: 'uncaught_exception',
        severity: 'fatal',
        context: { source: 'process' }
      });
      
      // In production, you might want to exit gracefully
      if (process.env.NODE_ENV === 'production') {
        logger.fatal('Uncaught exception occurred, shutting down gracefully...');
        setTimeout(() => process.exit(1), 1000);
      }
    });

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.trackError(reason instanceof Error ? reason : new Error(String(reason)), {
        type: 'unhandled_rejection',
        severity: 'error',
        context: { 
          source: 'promise',
          promise: promise.toString()
        }
      });
    });

    // Warning events
    process.on('warning', (warning) => {
      this.trackError(warning, {
        type: 'warning',
        severity: 'warn',
        context: { source: 'process_warning' }
      });
    });
  }

  /**
   * Track an error with context information
   */
  async trackError(error, options = {}) {
    try {
      this.errorCount++;
      
      const errorData = this.parseError(error, options);
      
      // Add to buffer for batch processing
      this.errorBuffer.push(errorData);
      
      // Emit error event for real-time handling
      this.emit('error:tracked', errorData);
      
      // Log to console based on severity
      const logLevel = errorData.severity;
      logger[logLevel](`Error tracked: ${errorData.error_type} - ${errorData.error_message}`);
      
      // Flush buffer if it's full
      if (this.errorBuffer.length >= this.config.bufferSize) {
        await this.flushErrorBuffer();
      }

    } catch (trackingError) {
      logger.error('Failed to track error:', trackingError);
      // Don't throw here to avoid infinite error loops
    }
  }

  /**
   * Parse error object into structured data
   */
  parseError(error, options = {}) {
    const timestamp = new Date();
    
    // Generate error hash for deduplication
    const errorString = `${error.name || 'Error'}:${error.message || ''}:${error.stack?.split('\\n')[1] || ''}`;
    const errorHash = crypto.createHash('sha256').update(errorString).digest('hex');
    
    // Parse stack trace
    const stackInfo = this.parseStackTrace(error.stack);
    
    return {
      error_hash: errorHash,
      error_type: error.name || options.type || 'Error',
      error_message: this.truncateString(error.message || String(error), this.config.maxErrorMessageLength),
      stack_trace: this.config.enableStackTrace ? 
        this.truncateString(error.stack || '', this.config.maxStackTraceLength) : null,
      source_file: stackInfo.file,
      source_line: stackInfo.line,
      source_column: stackInfo.column,
      user_id: options.userId || null,
      session_id: options.sessionId || null,
      request_id: options.requestId || null,
      endpoint: options.endpoint || null,
      http_method: options.httpMethod || null,
      http_status: options.httpStatus || null,
      user_agent: options.userAgent || null,
      ip_address: options.ipAddress || null,
      referer: options.referer || null,
      severity: options.severity || 'error',
      context: options.context || {},
      environment: process.env.NODE_ENV || 'development',
      instance_id: this.instanceId,
      occurred_at: timestamp
    };
  }

  /**
   * Parse stack trace to extract file, line, and column information
   */
  parseStackTrace(stack) {
    if (!stack) return {};
    
    try {
      const lines = stack.split('\\n');
      // Skip the first line (error message) and find the first relevant stack frame
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Match various stack trace formats
        const matches = line.match(/at.*\\((.*):(\\d+):(\\d+)\\)/) || 
                       line.match(/at (.*):(\\d+):(\\d+)/) ||
                       line.match(/(.*):(\\d+):(\\d+)/);
        
        if (matches) {
          return {
            file: matches[1],
            line: parseInt(matches[2]),
            column: parseInt(matches[3])
          };
        }
      }
    } catch (parseError) {
      logger.warn('Failed to parse stack trace:', parseError);
    }
    
    return {};
  }

  /**
   * Start periodic error buffer flushing
   */
  startErrorFlushing() {
    this.flushInterval = setInterval(async () => {
      if (this.errorBuffer.length > 0) {
        try {
          await this.flushErrorBuffer();
        } catch (error) {
          logger.error('Error flushing error buffer:', error);
        }
      }
    }, this.config.flushInterval);
  }

  /**
   * Flush error buffer to database
   */
  async flushErrorBuffer() {
    if (this.errorBuffer.length === 0) return;

    const errors = [...this.errorBuffer];
    this.errorBuffer = [];

    try {
      // Group errors by hash for deduplication
      const errorGroups = new Map();
      const occurrences = [];

      errors.forEach(error => {
        if (errorGroups.has(error.error_hash)) {
          // Update occurrence count
          errorGroups.get(error.error_hash).occurrence_count++;
          errorGroups.get(error.error_hash).last_seen = error.occurred_at;
        } else {
          errorGroups.set(error.error_hash, { ...error });
        }
        
        // Track individual occurrence
        occurrences.push({
          error_hash: error.error_hash,
          user_id: error.user_id,
          session_id: error.session_id,
          request_id: error.request_id,
          additional_context: error.context,
          occurred_at: error.occurred_at
        });
      });

      // Insert/update error logs
      for (const [hash, errorData] of errorGroups) {
        await this.upsertErrorLog(errorData);
      }

      // Insert error occurrences
      if (occurrences.length > 0) {
        await this.insertErrorOccurrences(occurrences);
      }

      logger.debug(`Flushed ${errors.length} errors to database`);

    } catch (error) {
      logger.error('Failed to flush error buffer:', error);
      // Put errors back in buffer for retry
      this.errorBuffer.unshift(...errors);
    }
  }

  /**
   * Insert or update error log entry
   */
  async upsertErrorLog(errorData) {
    try {
      const query = `
        INSERT INTO error_logs (
          error_hash, error_type, error_message, stack_trace, source_file, 
          source_line, source_column, user_id, session_id, request_id,
          endpoint, http_method, http_status, user_agent, ip_address, referer,
          severity, context, environment, instance_id, first_seen, last_seen
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $21
        )
        ON CONFLICT (error_hash) DO UPDATE SET
          occurrence_count = error_logs.occurrence_count + $22,
          last_seen = $21,
          updated_at = NOW()
      `;

      await connectionManager.query(query, [
        errorData.error_hash,
        errorData.error_type,
        errorData.error_message,
        errorData.stack_trace,
        errorData.source_file,
        errorData.source_line,
        errorData.source_column,
        errorData.user_id,
        errorData.session_id,
        errorData.request_id,
        errorData.endpoint,
        errorData.http_method,
        errorData.http_status,
        errorData.user_agent,
        errorData.ip_address,
        errorData.referer,
        errorData.severity,
        JSON.stringify(errorData.context),
        errorData.environment,
        errorData.instance_id,
        errorData.occurred_at,
        errorData.occurrence_count || 1
      ]);

    } catch (error) {
      logger.error('Failed to upsert error log:', error);
      throw error;
    }
  }

  /**
   * Insert error occurrences
   */
  async insertErrorOccurrences(occurrences) {
    if (occurrences.length === 0) return;

    try {
      const values = occurrences.map(occ => [
        occ.error_hash,
        occ.user_id,
        occ.session_id,
        occ.request_id,
        JSON.stringify(occ.additional_context),
        occ.occurred_at
      ]);

      const placeholders = values.map((_, i) => {
        const offset = i * 6;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`;
      }).join(', ');

      const query = `
        INSERT INTO error_occurrences 
        (error_hash, user_id, session_id, request_id, additional_context, occurred_at)
        VALUES ${placeholders}
      `;

      await connectionManager.query(query, values.flat());

    } catch (error) {
      logger.error('Failed to insert error occurrences:', error);
      throw error;
    }
  }

  /**
   * Log performance metrics
   */
  async logPerformance(operationName, duration, context = {}) {
    try {
      const query = `
        INSERT INTO performance_logs (
          operation_name, duration_ms, cpu_usage, memory_usage,
          request_id, user_id, endpoint, query_count, cache_hits, cache_misses, context
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;

      const memUsage = process.memoryUsage();
      
      await connectionManager.query(query, [
        operationName,
        duration,
        context.cpuUsage || null,
        memUsage.heapUsed,
        context.requestId || null,
        context.userId || null,
        context.endpoint || null,
        context.queryCount || null,
        context.cacheHits || null,
        context.cacheMisses || null,
        JSON.stringify(context)
      ]);

    } catch (error) {
      logger.error('Failed to log performance:', error);
    }
  }

  /**
   * Log audit events
   */
  async logAudit(action, options = {}) {
    try {
      const query = `
        INSERT INTO audit_logs (
          action, resource_type, resource_id, user_id, user_email,
          ip_address, user_agent, success, error_message,
          old_values, new_values, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `;

      await connectionManager.query(query, [
        action,
        options.resourceType || null,
        options.resourceId || null,
        options.userId || null,
        options.userEmail || null,
        options.ipAddress || null,
        options.userAgent || null,
        options.success !== false,
        options.errorMessage || null,
        options.oldValues ? JSON.stringify(options.oldValues) : null,
        options.newValues ? JSON.stringify(options.newValues) : null,
        JSON.stringify(options.metadata || {})
      ]);

    } catch (error) {
      logger.error('Failed to log audit event:', error);
    }
  }

  /**
   * Get error statistics and trends
   */
  async getErrorStatistics(timeframe = '24h') {
    try {
      const intervals = {
        '1h': '1 hour',
        '24h': '24 hours',
        '7d': '7 days',
        '30d': '30 days'
      };

      const interval = intervals[timeframe] || '24 hours';

      const query = `
        SELECT 
          COUNT(*) as total_errors,
          COUNT(DISTINCT error_hash) as unique_errors,
          SUM(occurrence_count) as total_occurrences,
          COUNT(*) FILTER (WHERE severity = 'fatal') as fatal_errors,
          COUNT(*) FILTER (WHERE severity = 'error') as error_level_errors,
          COUNT(*) FILTER (WHERE severity = 'warn') as warning_errors,
          AVG(occurrence_count) as avg_occurrences_per_error,
          array_agg(DISTINCT error_type) as error_types
        FROM error_logs 
        WHERE last_seen > NOW() - INTERVAL '${interval}'
      `;

      const result = await connectionManager.query(query);
      return result.rows[0] || {};

    } catch (error) {
      logger.error('Failed to get error statistics:', error);
      return {};
    }
  }

  /**
   * Get top errors by occurrence count
   */
  async getTopErrors(limit = 20, timeframe = '24h') {
    try {
      const intervals = {
        '1h': '1 hour',
        '24h': '24 hours',
        '7d': '7 days',
        '30d': '30 days'
      };

      const interval = intervals[timeframe] || '24 hours';

      const query = `
        SELECT 
          error_hash, error_type, error_message, severity,
          occurrence_count, first_seen, last_seen,
          source_file, source_line
        FROM error_logs 
        WHERE last_seen > NOW() - INTERVAL '${interval}'
        ORDER BY occurrence_count DESC, last_seen DESC
        LIMIT $1
      `;

      const result = await connectionManager.query(query, [limit]);
      return result.rows || [];

    } catch (error) {
      logger.error('Failed to get top errors:', error);
      return [];
    }
  }

  /**
   * Schedule cleanup of old errors
   */
  scheduleCleanup() {
    // Clean up old errors daily
    setInterval(async () => {
      try {
        await this.cleanupOldErrors();
      } catch (error) {
        logger.error('Error during cleanup:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Clean up old error records
   */
  async cleanupOldErrors() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      // Delete old error occurrences
      const occurrenceQuery = `
        DELETE FROM error_occurrences 
        WHERE occurred_at < $1
      `;
      
      const occurrenceResult = await connectionManager.query(occurrenceQuery, [cutoffDate]);

      // Delete old error logs that have no recent occurrences
      const errorLogQuery = `
        DELETE FROM error_logs 
        WHERE last_seen < $1
      `;
      
      const errorLogResult = await connectionManager.query(errorLogQuery, [cutoffDate]);

      // Delete old performance logs
      const performanceQuery = `
        DELETE FROM performance_logs 
        WHERE logged_at < $1
      `;
      
      const performanceResult = await connectionManager.query(performanceQuery, [cutoffDate]);

      // Delete old audit logs (keep longer - 90 days)
      const auditCutoff = new Date();
      auditCutoff.setDate(auditCutoff.getDate() - 90);
      
      const auditQuery = `
        DELETE FROM audit_logs 
        WHERE created_at < $1
      `;
      
      const auditResult = await connectionManager.query(auditQuery, [auditCutoff]);

      logger.info(`🧹 Cleanup completed: ${occurrenceResult.rowCount} occurrences, ${errorLogResult.rowCount} error logs, ${performanceResult.rowCount} performance logs, ${auditResult.rowCount} audit logs deleted`);

    } catch (error) {
      logger.error('Failed to cleanup old errors:', error);
    }
  }

  /**
   * Utility function to truncate strings
   */
  truncateString(str, maxLength) {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  }

  /**
   * Get tracking status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      errorCount: this.errorCount,
      bufferSize: this.errorBuffer.length,
      config: this.config,
      instanceId: this.instanceId
    };
  }

  /**
   * Stop error tracking
   */
  async stop() {
    try {
      if (this.flushInterval) {
        clearInterval(this.flushInterval);
        this.flushInterval = null;
      }

      // Flush remaining errors
      if (this.errorBuffer.length > 0) {
        await this.flushErrorBuffer();
      }

      this.isInitialized = false;
      logger.info('✅ Error tracking stopped');
      
      this.emit('tracking:stopped');

    } catch (error) {
      logger.error('Error stopping error tracking:', error);
    }
  }
}

// Create singleton instance
export const errorTracker = new ErrorTracker();

// Auto-initialize error tracking
errorTracker.initialize().catch(error => {
  logger.error('Failed to initialize error tracking:', error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await errorTracker.stop();
});

process.on('SIGINT', async () => {
  await errorTracker.stop();
});

export default errorTracker;