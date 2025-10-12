-- Tachi Pay-Per-Crawl Platform Database Schema
-- Migration: 002 - Backup and Monitoring Tables
-- Created: 2025-09-30
-- Description: Additional tables for backup logging, monitoring, and performance tracking

CREATE TABLE IF NOT EXISTS backup_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_id VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'full', 'incremental'
    status VARCHAR(20) NOT NULL, -- 'in_progress', 'completed', 'failed', 'no_changes'
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_ms INTEGER,
    size_bytes BIGINT,
    table_count INTEGER,
    s3_key VARCHAR(500),
    checksum VARCHAR(64),
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restore_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_id VARCHAR(255) NOT NULL,
    restore_time TIMESTAMPTZ NOT NULL,
    duration_ms INTEGER,
    status VARCHAR(20) DEFAULT 'completed', -- 'completed', 'failed'
    restored_by VARCHAR(255),
    options JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS db_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_time TIMESTAMPTZ NOT NULL,
    connection_pool_total INTEGER,
    connection_pool_active INTEGER,
    connection_pool_idle INTEGER,
    connection_pool_waiting INTEGER,
    query_count_total BIGINT DEFAULT 0,
    query_count_slow INTEGER DEFAULT 0,
    query_avg_time_ms DECIMAL(10, 2),
    error_count INTEGER DEFAULT 0,
    error_rate DECIMAL(5, 4),
    cache_hit_rate DECIMAL(5, 4),
    cache_size INTEGER,
    cpu_usage_percent DECIMAL(5, 2),
    memory_usage_mb INTEGER,
    disk_usage_percent DECIMAL(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS slow_query_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_hash VARCHAR(64) NOT NULL,
    query_text TEXT NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    rows_examined INTEGER,
    rows_returned INTEGER,
    user_id UUID,
    endpoint VARCHAR(255),
    request_id VARCHAR(255),
    execution_plan JSONB,
    optimization_suggestions TEXT[],
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    occurrence_count INTEGER DEFAULT 1,
    priority VARCHAR(20) DEFAULT 'medium' -- 'low', 'medium', 'high', 'critical'
);

CREATE TABLE IF NOT EXISTS db_maintenance_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_type VARCHAR(50) NOT NULL, -- 'vacuum', 'reindex', 'analyze', 'cleanup'
    table_name VARCHAR(255),
    status VARCHAR(20) NOT NULL, -- 'running', 'completed', 'failed'
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_ms INTEGER,
    rows_affected INTEGER,
    space_freed_mb INTEGER,
    error_message TEXT,
    triggered_by VARCHAR(50), -- 'scheduled', 'manual', 'automatic'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS connection_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id VARCHAR(255),
    event_type VARCHAR(20) NOT NULL, -- 'connect', 'disconnect', 'timeout', 'error'
    user_type VARCHAR(20), -- 'crawler', 'publisher', 'system'
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    connection_duration_ms INTEGER,
    queries_executed INTEGER,
    data_transferred_bytes BIGINT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS query_performance_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_pattern VARCHAR(255) NOT NULL,
    avg_execution_time_ms DECIMAL(10, 2),
    min_execution_time_ms INTEGER,
    max_execution_time_ms INTEGER,
    execution_count INTEGER DEFAULT 1,
    last_optimized TIMESTAMPTZ,
    optimization_applied TEXT[],
    performance_score INTEGER, -- 0-100 score
    cache_expires TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 hour',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_backup_log_backup_id ON backup_log(backup_id);
CREATE INDEX IF NOT EXISTS idx_backup_log_type_status ON backup_log(type, status);
CREATE INDEX IF NOT EXISTS idx_backup_log_start_time ON backup_log(start_time);

CREATE INDEX IF NOT EXISTS idx_restore_log_backup_id ON restore_log(backup_id);
CREATE INDEX IF NOT EXISTS idx_restore_log_restore_time ON restore_log(restore_time);

CREATE INDEX IF NOT EXISTS idx_db_performance_metrics_time ON db_performance_metrics(metric_time);
CREATE INDEX IF NOT EXISTS idx_db_performance_metrics_time_desc ON db_performance_metrics(metric_time DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_slow_query_log_hash_unique ON slow_query_log(query_hash);
CREATE INDEX IF NOT EXISTS idx_slow_query_log_execution_time ON slow_query_log(execution_time_ms DESC);
CREATE INDEX IF NOT EXISTS idx_slow_query_log_priority ON slow_query_log(priority);
CREATE INDEX IF NOT EXISTS idx_slow_query_log_last_seen ON slow_query_log(last_seen DESC);

CREATE INDEX IF NOT EXISTS idx_db_maintenance_log_operation ON db_maintenance_log(operation_type);
CREATE INDEX IF NOT EXISTS idx_db_maintenance_log_table ON db_maintenance_log(table_name);
CREATE INDEX IF NOT EXISTS idx_db_maintenance_log_start_time ON db_maintenance_log(start_time);

CREATE INDEX IF NOT EXISTS idx_connection_audit_event_type ON connection_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_connection_audit_user ON connection_audit_log(user_type, user_id);
CREATE INDEX IF NOT EXISTS idx_connection_audit_created_at ON connection_audit_log(created_at);

CREATE INDEX IF NOT EXISTS idx_query_performance_pattern ON query_performance_cache(query_pattern);
CREATE INDEX IF NOT EXISTS idx_query_performance_expires ON query_performance_cache(cache_expires);
CREATE INDEX IF NOT EXISTS idx_query_performance_score ON query_performance_cache(performance_score DESC);

-- Full-text search index for slow queries
CREATE INDEX IF NOT EXISTS idx_slow_query_text_fts ON slow_query_log USING GIN(to_tsvector('english', query_text));

-- Create trigger for slow query deduplication
CREATE OR REPLACE FUNCTION upsert_slow_query()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO slow_query_log (
        query_hash, query_text, execution_time_ms, rows_examined, 
        rows_returned, user_id, endpoint, request_id, execution_plan,
        optimization_suggestions, first_seen, last_seen, occurrence_count, priority
    )
    VALUES (
        NEW.query_hash, NEW.query_text, NEW.execution_time_ms, NEW.rows_examined,
        NEW.rows_returned, NEW.user_id, NEW.endpoint, NEW.request_id, NEW.execution_plan,
        NEW.optimization_suggestions, NEW.first_seen, NEW.last_seen, 1,
        CASE 
            WHEN NEW.execution_time_ms > 10000 THEN 'critical'
            WHEN NEW.execution_time_ms > 5000 THEN 'high'
            WHEN NEW.execution_time_ms > 2000 THEN 'medium'
            ELSE 'low'
        END
    )
    ON CONFLICT (query_hash) DO UPDATE SET
        execution_time_ms = CASE 
            WHEN slow_query_log.execution_time_ms > NEW.execution_time_ms 
            THEN NEW.execution_time_ms 
            ELSE slow_query_log.execution_time_ms 
        END,
        last_seen = NEW.last_seen,
        occurrence_count = slow_query_log.occurrence_count + 1,
        priority = CASE 
            WHEN NEW.execution_time_ms > 10000 THEN 'critical'
            WHEN NEW.execution_time_ms > 5000 THEN 'high'
            WHEN NEW.execution_time_ms > 2000 THEN 'medium'
            ELSE 'low'
        END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update trigger for updated_at columns
DROP TRIGGER IF EXISTS update_query_performance_cache_updated_at ON query_performance_cache;
CREATE TRIGGER update_query_performance_cache_updated_at 
    BEFORE UPDATE ON query_performance_cache
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create functions for database maintenance
CREATE OR REPLACE FUNCTION analyze_table_performance(p_table_name TEXT)
RETURNS TABLE(
    table_name TEXT,
    row_count BIGINT,
    table_size TEXT,
    index_size TEXT,
    total_size TEXT,
    seq_scan BIGINT,
    seq_tup_read BIGINT,
    idx_scan BIGINT,
    idx_tup_fetch BIGINT,
    n_tup_ins BIGINT,
    n_tup_upd BIGINT,
    n_tup_del BIGINT,
    last_vacuum TIMESTAMPTZ,
    last_analyze TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.table_name::TEXT,
        t.row_count,
        pg_size_pretty(t.table_size)::TEXT,
        pg_size_pretty(t.index_size)::TEXT,
        pg_size_pretty(t.total_size)::TEXT,
        s.seq_scan,
        s.seq_tup_read,
        s.idx_scan,
        s.idx_tup_fetch,
        s.n_tup_ins,
        s.n_tup_upd,
        s.n_tup_del,
        s.last_vacuum,
        s.last_analyze
    FROM (
        SELECT
            p_table_name,
            (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = p_table_name) as row_count,
            pg_total_relation_size(p_table_name::regclass) as total_size,
            pg_relation_size(p_table_name::regclass) as table_size,
            pg_total_relation_size(p_table_name::regclass) - pg_relation_size(p_table_name::regclass) as index_size
    ) t
    LEFT JOIN pg_stat_user_tables s ON s.relname = p_table_name;
END;
$$ LANGUAGE plpgsql;

-- Function to get database health summary
CREATE OR REPLACE FUNCTION get_database_health_summary()
RETURNS TABLE(
    metric VARCHAR(50),
    value TEXT,
    status VARCHAR(20),
    recommendation TEXT
) AS $$
DECLARE
    connection_count INTEGER;
    slow_query_count INTEGER;
    error_rate DECIMAL;
    cache_hit_ratio DECIMAL;
    db_size BIGINT;
BEGIN
    -- Get current connection count
    SELECT COUNT(*) INTO connection_count FROM pg_stat_activity WHERE state = 'active';
    
    -- Get slow query count (last 24 hours)
    SELECT COUNT(*) INTO slow_query_count 
    FROM slow_query_log 
    WHERE last_seen > NOW() - INTERVAL '24 hours' AND execution_time_ms > 1000;
    
    -- Get error rate (last hour)
    SELECT COALESCE(AVG(error_rate), 0) INTO error_rate
    FROM db_performance_metrics 
    WHERE metric_time > NOW() - INTERVAL '1 hour';
    
    -- Get cache hit ratio
    SELECT COALESCE(AVG(cache_hit_rate), 0) INTO cache_hit_ratio
    FROM db_performance_metrics 
    WHERE metric_time > NOW() - INTERVAL '1 hour';
    
    -- Get database size
    SELECT pg_database_size(current_database()) INTO db_size;
    
    -- Return metrics with status and recommendations
    RETURN QUERY VALUES
        ('Active Connections', connection_count::TEXT, 
         CASE WHEN connection_count < 50 THEN 'healthy' 
              WHEN connection_count < 100 THEN 'warning'
              ELSE 'critical' END,
         CASE WHEN connection_count >= 100 THEN 'Consider increasing connection pool size or optimizing queries'
              ELSE 'Connection count within normal range' END),
              
        ('Slow Queries (24h)', slow_query_count::TEXT,
         CASE WHEN slow_query_count < 10 THEN 'healthy'
              WHEN slow_query_count < 50 THEN 'warning'
              ELSE 'critical' END,
         CASE WHEN slow_query_count >= 50 THEN 'Review and optimize slow queries, consider adding indexes'
              ELSE 'Query performance within acceptable range' END),
              
        ('Error Rate', ROUND(error_rate * 100, 2)::TEXT || '%',
         CASE WHEN error_rate < 0.01 THEN 'healthy'
              WHEN error_rate < 0.05 THEN 'warning'
              ELSE 'critical' END,
         CASE WHEN error_rate >= 0.05 THEN 'High error rate detected, review application logs'
              ELSE 'Error rate within acceptable range' END),
              
        ('Cache Hit Ratio', ROUND(cache_hit_ratio * 100, 2)::TEXT || '%',
         CASE WHEN cache_hit_ratio > 0.95 THEN 'healthy'
              WHEN cache_hit_ratio > 0.85 THEN 'warning'
              ELSE 'critical' END,
         CASE WHEN cache_hit_ratio <= 0.85 THEN 'Low cache hit ratio, consider increasing cache size'
              ELSE 'Cache performance is good' END),
              
        ('Database Size', pg_size_pretty(db_size),
         CASE WHEN db_size < 10737418240 THEN 'healthy' -- < 10GB
              WHEN db_size < 107374182400 THEN 'warning' -- < 100GB
              ELSE 'monitor' END,
         CASE WHEN db_size >= 107374182400 THEN 'Monitor disk space and consider archiving old data'
              ELSE 'Database size within normal range' END);
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired records
CREATE OR REPLACE FUNCTION cleanup_expired_records()
RETURNS TABLE(
    table_name TEXT,
    deleted_count INTEGER
) AS $$
DECLARE
    deleted_backup_logs INTEGER;
    deleted_restore_logs INTEGER;
    deleted_performance_metrics INTEGER;
    deleted_connection_logs INTEGER;
    deleted_query_cache INTEGER;
BEGIN
    -- Cleanup old backup logs (keep 1 year)
    DELETE FROM backup_log WHERE created_at < NOW() - INTERVAL '1 year';
    GET DIAGNOSTICS deleted_backup_logs = ROW_COUNT;
    
    -- Cleanup old restore logs (keep 6 months)
    DELETE FROM restore_log WHERE created_at < NOW() - INTERVAL '6 months';
    GET DIAGNOSTICS deleted_restore_logs = ROW_COUNT;
    
    -- Cleanup old performance metrics (keep 3 months)
    DELETE FROM db_performance_metrics WHERE created_at < NOW() - INTERVAL '3 months';
    GET DIAGNOSTICS deleted_performance_metrics = ROW_COUNT;
    
    -- Cleanup old connection logs (keep 1 month)
    DELETE FROM connection_audit_log WHERE created_at < NOW() - INTERVAL '1 month';
    GET DIAGNOSTICS deleted_connection_logs = ROW_COUNT;
    
    -- Cleanup expired query cache
    DELETE FROM query_performance_cache WHERE cache_expires < NOW();
    GET DIAGNOSTICS deleted_query_cache = ROW_COUNT;
    
    -- Return cleanup results
    RETURN QUERY VALUES
        ('backup_log', deleted_backup_logs),
        ('restore_log', deleted_restore_logs),
        ('db_performance_metrics', deleted_performance_metrics),
        ('connection_audit_log', deleted_connection_logs),
        ('query_performance_cache', deleted_query_cache);
END;
$$ LANGUAGE plpgsql;

-- Create scheduled cleanup job (using pg_cron if available)
-- SELECT cron.schedule('cleanup-expired-records', '0 2 * * *', 'SELECT cleanup_expired_records();');

-- Insert initial health record
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables 
        WHERE table_name = 'system_health'
          AND table_schema = 'public'
    ) THEN
        INSERT INTO system_health (component, status, checked_at)
        SELECT 'backup_system', 'healthy', NOW()
        WHERE NOT EXISTS (SELECT 1 FROM system_health WHERE component = 'backup_system');

        INSERT INTO system_health (component, status, checked_at)
        SELECT 'performance_monitoring', 'healthy', NOW()
        WHERE NOT EXISTS (SELECT 1 FROM system_health WHERE component = 'performance_monitoring');

        INSERT INTO system_health (component, status, checked_at)
        SELECT 'connection_pooling', 'healthy', NOW()
        WHERE NOT EXISTS (SELECT 1 FROM system_health WHERE component = 'connection_pooling');
    END IF;
END;
$$;

COMMENT ON TABLE backup_log IS 'Log of all database backup operations';
COMMENT ON TABLE restore_log IS 'Log of all database restore operations';
COMMENT ON TABLE db_performance_metrics IS 'Historical database performance metrics';
COMMENT ON TABLE slow_query_log IS 'Log of slow database queries for optimization';
COMMENT ON TABLE db_maintenance_log IS 'Log of database maintenance operations';
COMMENT ON TABLE connection_audit_log IS 'Audit trail of database connections';
COMMENT ON TABLE query_performance_cache IS 'Cached query performance data for optimization';
