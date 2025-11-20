-- Migration: Add x402 middleware support
-- Adds API keys for publishers and path tracking for payments

-- Add API key to publishers table
ALTER TABLE publishers
ADD COLUMN IF NOT EXISTS api_key VARCHAR(64) UNIQUE,
ADD COLUMN IF NOT EXISTS api_key_created_at TIMESTAMP;

-- Add path tracking to payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS path TEXT;

-- Add index for API key lookups (performance)
CREATE INDEX IF NOT EXISTS idx_publishers_api_key ON publishers(api_key);

-- Add index for path queries
CREATE INDEX IF NOT EXISTS idx_payments_path ON payments(path);

-- Function to generate API keys (publishers can call this)
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
DECLARE
  new_key TEXT;
BEGIN
  -- Generate a random 64-character hex string
  new_key := encode(gen_random_bytes(32), 'hex');
  RETURN new_key;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON COLUMN publishers.api_key IS 'API key for x402 middleware authentication';
COMMENT ON COLUMN payments.path IS 'Request path that was accessed (e.g., /article/123)';
