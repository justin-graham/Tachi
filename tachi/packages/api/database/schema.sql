-- Tachi Pay-Per-Crawl Database Schema
-- This file contains the SQL schema for Supabase database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Publishers table
CREATE TABLE IF NOT EXISTS publishers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE NOT NULL,
  website_url VARCHAR(500),
  description TEXT,
  contact_email VARCHAR(255),
  price_per_request DECIMAL(10, 6) DEFAULT 0.001, -- Price in USD
  rate_limit_per_hour INTEGER DEFAULT 1000,
  terms_of_service TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'inactive')),
  total_earnings DECIMAL(15, 6) DEFAULT 0,
  total_requests INTEGER DEFAULT 0,
  stripe_account_id VARCHAR(255),
  api_key_hash VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crawlers/AI Companies table
CREATE TABLE IF NOT EXISTS crawlers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  type VARCHAR(20) DEFAULT 'individual' CHECK (type IN ('individual', 'startup', 'enterprise')),
  use_case TEXT,
  estimated_volume INTEGER DEFAULT 0,
  credits DECIMAL(15, 6) DEFAULT 0,
  total_spent DECIMAL(15, 6) DEFAULT 0,
  total_requests INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  api_key_hash VARCHAR(255) NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table (for tracking all crawl requests)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  crawler_id UUID REFERENCES crawlers(id) ON DELETE CASCADE,
  publisher_id UUID REFERENCES publishers(id) ON DELETE CASCADE,
  url VARCHAR(1000) NOT NULL,
  amount DECIMAL(10, 6) NOT NULL, -- Amount charged in USD
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'refunded')),
  response_size INTEGER, -- Size of response in bytes
  response_time INTEGER, -- Response time in milliseconds
  user_agent VARCHAR(500),
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table (for tracking credit purchases)
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  crawler_id UUID REFERENCES crawlers(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  amount_usd DECIMAL(10, 2) NOT NULL,
  credits_purchased DECIMAL(15, 6) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Keys table (for additional security tracking)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  crawler_id UUID REFERENCES crawlers(id) ON DELETE CASCADE,
  key_name VARCHAR(100),
  key_hash VARCHAR(255) NOT NULL,
  last_used TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage Analytics table (for aggregated statistics)
CREATE TABLE IF NOT EXISTS usage_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  publisher_id UUID REFERENCES publishers(id) ON DELETE CASCADE,
  crawler_id UUID REFERENCES crawlers(id) ON DELETE CASCADE,
  total_requests INTEGER DEFAULT 0,
  total_amount DECIMAL(15, 6) DEFAULT 0,
  total_data_served BIGINT DEFAULT 0, -- in bytes
  avg_response_time INTEGER DEFAULT 0, -- in milliseconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, publisher_id, crawler_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_publishers_domain ON publishers(domain);
CREATE INDEX IF NOT EXISTS idx_publishers_status ON publishers(status);
CREATE INDEX IF NOT EXISTS idx_crawlers_email ON crawlers(email);
CREATE INDEX IF NOT EXISTS idx_crawlers_status ON crawlers(status);
CREATE INDEX IF NOT EXISTS idx_transactions_crawler_id ON transactions(crawler_id);
CREATE INDEX IF NOT EXISTS idx_transactions_publisher_id ON transactions(publisher_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_crawler_id ON payments(crawler_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_date ON usage_analytics(date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_publishers_updated_at BEFORE UPDATE ON publishers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crawlers_updated_at BEFORE UPDATE ON crawlers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawlers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Publishers can only see their own data
CREATE POLICY "Publishers can view own profile" ON publishers FOR ALL USING (auth.uid()::text = id::text);

-- Crawlers can only see their own data  
CREATE POLICY "Crawlers can view own profile" ON crawlers FOR ALL USING (auth.uid()::text = id::text);

-- Transactions are viewable by involved parties
CREATE POLICY "Users can view own transactions" ON transactions FOR ALL USING (
  auth.uid()::text = crawler_id::text OR auth.uid()::text = publisher_id::text
);

-- Payments are viewable by the crawler who made them
CREATE POLICY "Crawlers can view own payments" ON payments FOR ALL USING (auth.uid()::text = crawler_id::text);

-- Insert some sample data for testing
INSERT INTO publishers (email, name, domain, description, price_per_request, rate_limit_per_hour, status) VALUES 
('publisher@example.com', 'Example News Site', 'example.com', 'Leading news and analysis website', 0.002, 500, 'active'),
('tech@techblog.com', 'Tech Blog', 'techblog.com', 'Latest technology news and reviews', 0.001, 1000, 'active'),
('data@datasource.io', 'Data Source', 'datasource.io', 'Premium data and research reports', 0.005, 200, 'active')
ON CONFLICT (email) DO NOTHING;

-- Note: In production, you would run this schema through Supabase CLI or dashboard
-- supabase db push or apply migrations through the Supabase interface
