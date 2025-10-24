-- Tachi v2 Database Schema
-- Simple, focused schema for pay-per-crawl protocol

-- Publishers table
CREATE TABLE publishers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  price_per_request DECIMAL(10, 6) DEFAULT 0.01 CHECK (price_per_request >= 0),
  status TEXT DEFAULT 'active',
  domain_verified BOOLEAN DEFAULT false,
  total_earnings DECIMAL(18, 6) DEFAULT 0 CHECK (total_earnings >= 0),
  total_requests INTEGER DEFAULT 0 CHECK (total_requests >= 0),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crawlers table
CREATE TABLE crawlers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active',
  total_spent DECIMAL(18, 6) DEFAULT 0 CHECK (total_spent >= 0),
  total_requests INTEGER DEFAULT 0 CHECK (total_requests >= 0),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payments table (on-chain transaction log)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash TEXT UNIQUE NOT NULL,
  crawler_address TEXT NOT NULL,
  publisher_address TEXT NOT NULL,
  amount DECIMAL(18, 6) NOT NULL CHECK (amount > 0),
  timestamp TIMESTAMP NOT NULL,
  onchain_logged BOOLEAN DEFAULT false,
  onchain_tx TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Crawl logs table (audit trail)
CREATE TABLE crawl_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash TEXT NOT NULL,
  path TEXT NOT NULL,
  publisher_address TEXT NOT NULL,
  crawler_address TEXT,
  timestamp TIMESTAMP NOT NULL,
  onchain_logged BOOLEAN DEFAULT false,
  onchain_tx TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_publishers_domain ON publishers(domain);
CREATE INDEX idx_publishers_wallet ON publishers(wallet_address);
CREATE INDEX idx_crawlers_wallet ON crawlers(wallet_address);
CREATE INDEX idx_payments_tx_hash ON payments(tx_hash);
CREATE INDEX idx_payments_publisher ON payments(publisher_address);
CREATE INDEX idx_payments_crawler ON payments(crawler_address);
CREATE INDEX idx_crawl_logs_publisher ON crawl_logs(publisher_address);
CREATE INDEX idx_crawl_logs_timestamp ON crawl_logs(timestamp);

-- Helper functions
CREATE OR REPLACE FUNCTION increment_publisher_earnings(
  p_wallet_address TEXT,
  p_amount DECIMAL
)
RETURNS VOID AS $$
BEGIN
  UPDATE publishers
  SET
    total_earnings = total_earnings + p_amount,
    total_requests = total_requests + 1,
    updated_at = NOW()
  WHERE wallet_address = p_wallet_address;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_crawler_spending(
  c_wallet_address TEXT,
  c_amount DECIMAL
)
RETURNS VOID AS $$
BEGIN
  UPDATE crawlers
  SET
    total_spent = total_spent + c_amount,
    total_requests = total_requests + 1,
    updated_at = NOW()
  WHERE wallet_address = c_wallet_address;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
ALTER TABLE publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawlers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_logs ENABLE ROW LEVEL SECURITY;

-- Public read access for publishers (directory)
CREATE POLICY "Publishers are viewable by everyone"
  ON publishers FOR SELECT
  USING (status = 'active');

-- Public read access for crawlers
CREATE POLICY "Crawlers are viewable by everyone"
  ON crawlers FOR SELECT
  USING (status = 'active');

-- Payments are publicly viewable (blockchain is public)
CREATE POLICY "Payments are viewable by everyone"
  ON payments FOR SELECT
  USING (true);

-- Crawl logs are publicly viewable
CREATE POLICY "Crawl logs are viewable by everyone"
  ON crawl_logs FOR SELECT
  USING (true);
