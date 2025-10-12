-- Tachi Pay-Per-Crawl Platform Database Schema
-- Migration: 001 - Initial Schema Setup
-- Created: 2025-09-30
-- Description: Complete database schema for publishers, crawlers, payments, and content protection

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create enum types (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'banned');
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'cancelled', 'refunded');
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
        CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type') THEN
        CREATE TYPE content_type AS ENUM ('html', 'json', 'xml', 'text', 'image', 'document');
    END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS publishers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    website VARCHAR(500),
    description TEXT,
    status user_status DEFAULT 'active',
    total_earnings DECIMAL(10, 2) DEFAULT 0.00,
    stripe_account_id VARCHAR(255),
    payout_setup_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS crawlers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    description TEXT,
    status user_status DEFAULT 'active',
    credits DECIMAL(10, 2) DEFAULT 0.00,
    frozen_credits DECIMAL(10, 2) DEFAULT 0.00,
    total_spent DECIMAL(10, 2) DEFAULT 0.00,
    rate_limit_per_minute INTEGER DEFAULT 60,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crawler_id UUID NOT NULL REFERENCES crawlers(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    last_4_chars VARCHAR(4) NOT NULL,
    permissions JSONB DEFAULT '[]',
    rate_limit_per_minute INTEGER DEFAULT 60,
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS domain_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publisher_id UUID NOT NULL REFERENCES publishers(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    base_price DECIMAL(8, 4) NOT NULL DEFAULT 0.001,
    per_kb_price DECIMAL(8, 6) DEFAULT 0.0001,
    max_price DECIMAL(8, 4) DEFAULT 1.00,
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(publisher_id, domain)
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crawler_id UUID NOT NULL REFERENCES crawlers(id) ON DELETE RESTRICT,
    publisher_id UUID NOT NULL REFERENCES publishers(id) ON DELETE RESTRICT,
    domain VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    amount DECIMAL(8, 4) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    content_size_bytes INTEGER,
    content_type content_type,
    status transaction_status DEFAULT 'pending',
    processing_time_ms INTEGER,
    safety_score INTEGER,
    protection_warnings JSONB DEFAULT '[]',
    failure_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    request_headers JSONB DEFAULT '{}',
    response_headers JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crawler_id UUID NOT NULL REFERENCES crawlers(id) ON DELETE RESTRICT,
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    amount_usd DECIMAL(10, 2) NOT NULL,
    credits_purchased DECIMAL(10, 2) NOT NULL DEFAULT 0,
    status payment_status DEFAULT 'pending',
    payment_method VARCHAR(50),
    risk_score INTEGER,
    processing_fee INTEGER, -- Stripe fees in cents
    net_amount INTEGER, -- Amount minus fees in cents
    failure_reason TEXT,
    failure_code VARCHAR(100),
    is_retryable BOOLEAN DEFAULT FALSE,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS payment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_intent_id VARCHAR(255),
    crawler_id UUID REFERENCES crawlers(id) ON DELETE SET NULL,
    publisher_id UUID REFERENCES publishers(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    amount_usd DECIMAL(10, 2),
    credits_added DECIMAL(10, 2),
    credits_deducted DECIMAL(10, 2),
    new_credit_balance DECIMAL(10, 2),
    risk_score INTEGER,
    failure_code VARCHAR(100),
    failure_message TEXT,
    is_retryable BOOLEAN,
    retry_count INTEGER,
    dispute_id VARCHAR(255),
    dispute_reason VARCHAR(100),
    dispute_amount DECIMAL(10, 2),
    refund_id VARCHAR(255),
    refund_amount DECIMAL(10, 2),
    reason TEXT,
    error_message TEXT,
    stripe_account_id VARCHAR(255),
    account_type VARCHAR(50),
    total_earnings DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS payment_retries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_intent_id VARCHAR(255) NOT NULL,
    retry_count INTEGER NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    executed_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_dispute_id VARCHAR(255) UNIQUE NOT NULL,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    crawler_id UUID NOT NULL REFERENCES crawlers(id) ON DELETE RESTRICT,
    dispute_reason VARCHAR(100) NOT NULL,
    dispute_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    evidence_due_by TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    stripe_refund_id VARCHAR(255) UNIQUE NOT NULL,
    crawler_id UUID NOT NULL REFERENCES crawlers(id) ON DELETE RESTRICT,
    refund_amount DECIMAL(10, 2) NOT NULL,
    credits_deducted DECIMAL(10, 2) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS payment_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_email VARCHAR(255) NOT NULL,
    notification_type VARCHAR(100) NOT NULL,
    notification_data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS publisher_verification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publisher_id UUID NOT NULL REFERENCES publishers(id) ON DELETE CASCADE,
    verification_type VARCHAR(50) NOT NULL,
    document_type VARCHAR(50),
    document_url VARCHAR(500),
    status verification_status DEFAULT 'pending',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewer_notes TEXT,
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS content_protection_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    crawler_id UUID REFERENCES crawlers(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    protection_type VARCHAR(50) NOT NULL, -- 'url_scan', 'content_filter', 'license_check'
    threat_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    threats_detected JSONB DEFAULT '[]',
    warnings_issued JSONB DEFAULT '[]',
    action_taken VARCHAR(50), -- 'allowed', 'blocked', 'sanitized', 'refunded'
    processing_time_ms INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS url_safety_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 hash of URL
    original_url TEXT NOT NULL,
    is_safe BOOLEAN NOT NULL,
    risk_score INTEGER NOT NULL,
    threats JSONB DEFAULT '[]',
    warnings JSONB DEFAULT '[]',
    scan_provider VARCHAR(50),
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    hit_count INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Can be crawler_id or publisher_id
    user_type VARCHAR(20) NOT NULL, -- 'crawler' or 'publisher'
    endpoint VARCHAR(100) NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    window_size_seconds INTEGER NOT NULL,
    request_count INTEGER DEFAULT 1,
    max_requests INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, user_type, endpoint, window_start)
);

CREATE TABLE IF NOT EXISTS analytics_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    publisher_id UUID REFERENCES publishers(id) ON DELETE CASCADE,
    crawler_id UUID REFERENCES crawlers(id) ON DELETE CASCADE,
    domain VARCHAR(255),
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    blocked_requests INTEGER DEFAULT 0,
    total_revenue DECIMAL(10, 4) DEFAULT 0,
    total_data_transferred_bytes BIGINT DEFAULT 0,
    average_response_time_ms INTEGER DEFAULT 0,
    unique_crawlers INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date, publisher_id, crawler_id, domain)
);

CREATE TABLE IF NOT EXISTS system_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'healthy', 'degraded', 'unhealthy'
    response_time_ms INTEGER,
    error_rate DECIMAL(5, 4),
    last_error TEXT,
    metadata JSONB DEFAULT '{}',
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add metadata columns to existing tables if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'publishers' AND column_name = 'metadata') THEN
        ALTER TABLE publishers ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crawlers' AND column_name = 'metadata') THEN
        ALTER TABLE crawlers ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'metadata') THEN
        ALTER TABLE transactions ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'metadata') THEN
        ALTER TABLE payments ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_events' AND column_name = 'metadata') THEN
        ALTER TABLE payment_events ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_disputes' AND column_name = 'metadata') THEN
        ALTER TABLE payment_disputes ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'refunds' AND column_name = 'metadata') THEN
        ALTER TABLE refunds ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'publisher_verification' AND column_name = 'metadata') THEN
        ALTER TABLE publisher_verification ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_protection_logs' AND column_name = 'metadata') THEN
        ALTER TABLE content_protection_logs ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_health' AND column_name = 'metadata') THEN
        ALTER TABLE system_health ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END;
$$;
CREATE INDEX IF NOT EXISTS idx_publishers_email ON publishers(email);
CREATE INDEX IF NOT EXISTS idx_publishers_status ON publishers(status);
CREATE INDEX IF NOT EXISTS idx_publishers_created_at ON publishers(created_at);

CREATE INDEX IF NOT EXISTS idx_crawlers_email ON crawlers(email);
CREATE INDEX IF NOT EXISTS idx_crawlers_status ON crawlers(status);
CREATE INDEX IF NOT EXISTS idx_crawlers_credits ON crawlers(credits);
CREATE INDEX IF NOT EXISTS idx_crawlers_created_at ON crawlers(created_at);

CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at);

CREATE INDEX IF NOT EXISTS idx_domain_pricing_publisher_domain ON domain_pricing(publisher_id, domain);
CREATE INDEX IF NOT EXISTS idx_domain_pricing_active ON domain_pricing(is_active);

CREATE INDEX IF NOT EXISTS idx_transactions_publisher_id ON transactions(publisher_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_url_hash ON transactions USING HASH(url);

CREATE INDEX IF NOT EXISTS idx_payments_stripe_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

CREATE INDEX IF NOT EXISTS idx_payment_events_publisher_id ON payment_events(publisher_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_type ON payment_events(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_events_created_at ON payment_events(created_at);

CREATE INDEX IF NOT EXISTS idx_payment_retries_intent_id ON payment_retries(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_retries_scheduled_at ON payment_retries(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_payment_retries_status ON payment_retries(status);

CREATE INDEX IF NOT EXISTS idx_payment_disputes_payment_id ON payment_disputes(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_stripe_id ON payment_disputes(stripe_dispute_id);

CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_stripe_id ON refunds(stripe_refund_id);

CREATE INDEX IF NOT EXISTS idx_protection_logs_transaction_id ON content_protection_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_protection_logs_type ON content_protection_logs(protection_type);
CREATE INDEX IF NOT EXISTS idx_protection_logs_created_at ON content_protection_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_url_safety_hash ON url_safety_cache(url_hash);
CREATE INDEX IF NOT EXISTS idx_url_safety_expires_at ON url_safety_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user ON rate_limits(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_daily(date);
CREATE INDEX IF NOT EXISTS idx_analytics_publisher_date ON analytics_daily(publisher_id, date);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_publishers_name_fts ON publishers USING GIN(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_crawlers_company_fts ON crawlers USING GIN(to_tsvector('english', company_name));

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_transactions_publisher_status_date ON transactions(publisher_id, status, created_at);

-- Partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_publishers_active ON publishers(id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_crawlers_active ON crawlers(id) WHERE status = 'active';

-- JSONB indexes for metadata searches
CREATE INDEX IF NOT EXISTS idx_transactions_metadata ON transactions USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_payments_metadata ON payments USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_protection_logs_threats ON content_protection_logs USING GIN(threats_detected);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_publishers_updated_at ON publishers;
CREATE TRIGGER update_publishers_updated_at BEFORE UPDATE ON publishers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crawlers_updated_at ON crawlers;
CREATE TRIGGER update_crawlers_updated_at BEFORE UPDATE ON crawlers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_domain_pricing_updated_at ON domain_pricing;
CREATE TRIGGER update_domain_pricing_updated_at BEFORE UPDATE ON domain_pricing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_analytics_daily_updated_at ON analytics_daily;
CREATE TRIGGER update_analytics_daily_updated_at BEFORE UPDATE ON analytics_daily
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function for automatic analytics aggregation
CREATE OR REPLACE FUNCTION aggregate_daily_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update daily analytics for the transaction
    INSERT INTO analytics_daily (
        date,
        publisher_id,
        crawler_id,
        domain,
        total_requests,
        successful_requests,
        failed_requests,
        blocked_requests,
        total_revenue,
        total_data_transferred_bytes
    )
    VALUES (
        DATE(NEW.created_at),
        NEW.publisher_id,
        NEW.crawler_id,
        NEW.domain,
        1,
        CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
        CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
        CASE WHEN NEW.protection_warnings::text != '[]' THEN 1 ELSE 0 END,
        CASE WHEN NEW.status = 'completed' THEN NEW.amount ELSE 0 END,
        COALESCE(NEW.content_size_bytes, 0)
    )
    ON CONFLICT (date, publisher_id, crawler_id, domain)
    DO UPDATE SET
        total_requests = analytics_daily.total_requests + 1,
        successful_requests = analytics_daily.successful_requests + 
            CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
        failed_requests = analytics_daily.failed_requests + 
            CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
        blocked_requests = analytics_daily.blocked_requests + 
            CASE WHEN NEW.protection_warnings::text != '[]' THEN 1 ELSE 0 END,
        total_revenue = analytics_daily.total_revenue + 
            CASE WHEN NEW.status = 'completed' THEN NEW.amount ELSE 0 END,
        total_data_transferred_bytes = analytics_daily.total_data_transferred_bytes + 
            COALESCE(NEW.content_size_bytes, 0),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_aggregate_analytics ON transactions;
CREATE TRIGGER trigger_aggregate_analytics 
    AFTER INSERT ON transactions
    FOR EACH ROW EXECUTE FUNCTION aggregate_daily_analytics();

-- Create row-level security policies (enable when needed)
-- ALTER TABLE publishers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE crawlers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create maintenance functions
CREATE OR REPLACE FUNCTION cleanup_expired_url_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM url_safety_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 hour';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Insert initial system health records
INSERT INTO system_health (component, status, checked_at)
SELECT 'database', 'healthy', NOW()
WHERE NOT EXISTS (SELECT 1 FROM system_health WHERE component = 'database');

INSERT INTO system_health (component, status, checked_at)
SELECT 'payment_processing', 'healthy', NOW()
WHERE NOT EXISTS (SELECT 1 FROM system_health WHERE component = 'payment_processing');

INSERT INTO system_health (component, status, checked_at)
SELECT 'content_protection', 'healthy', NOW()
WHERE NOT EXISTS (SELECT 1 FROM system_health WHERE component = 'content_protection');

INSERT INTO system_health (component, status, checked_at)
SELECT 'api_gateway', 'healthy', NOW()
WHERE NOT EXISTS (SELECT 1 FROM system_health WHERE component = 'api_gateway');

-- Create initial test data (for development only)
-- INSERT INTO publishers (email, password_hash, name, website) VALUES
-- ('publisher@example.com', '$2a$10$test_hash', 'Example Publisher', 'https://example.com');

-- INSERT INTO crawlers (email, password_hash, company_name, credits) VALUES
-- ('crawler@example.com', '$2a$10$test_hash', 'Example Crawler Co.', 100.00);

COMMENT ON TABLE publishers IS 'Content providers who monetize their websites and APIs';
COMMENT ON TABLE crawlers IS 'API consumers who pay for access to protected content';
COMMENT ON TABLE transactions IS 'Individual content access requests and payments';
COMMENT ON TABLE payments IS 'Credit purchases and financial transactions via Stripe';
COMMENT ON TABLE payment_events IS 'Comprehensive audit log of all payment-related events';
COMMENT ON TABLE content_protection_logs IS 'Security events and protection mechanism logs';
COMMENT ON TABLE analytics_daily IS 'Pre-aggregated daily analytics for performance';
COMMENT ON TABLE url_safety_cache IS 'Cached URL safety scan results to reduce external API calls';
