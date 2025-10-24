-- Migration: Add CHECK constraints to existing tables
-- Created: 2025-10-24
-- Purpose: Prevent negative amounts and invalid data in database

-- Add CHECK constraints to publishers table
ALTER TABLE publishers
  ADD CONSTRAINT publishers_price_check CHECK (price_per_request >= 0),
  ADD CONSTRAINT publishers_earnings_check CHECK (total_earnings >= 0),
  ADD CONSTRAINT publishers_requests_check CHECK (total_requests >= 0);

-- Add CHECK constraints to crawlers table
ALTER TABLE crawlers
  ADD CONSTRAINT crawlers_spent_check CHECK (total_spent >= 0),
  ADD CONSTRAINT crawlers_requests_check CHECK (total_requests >= 0);

-- Add CHECK constraint to payments table
ALTER TABLE payments
  ADD CONSTRAINT payments_amount_check CHECK (amount > 0);
