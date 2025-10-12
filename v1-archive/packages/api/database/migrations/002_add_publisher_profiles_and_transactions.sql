-- Deprecated migration.
-- The canonical schema for publisher profiles, crawl transactions, withdrawal requests, and API keys
-- now lives in supabase/migrations/002_dashboard_backend.sql.
-- Keeping this file as a no-op prevents duplicate policies when older tooling replays the API migrations.

DO $$
BEGIN
  RAISE NOTICE '002_add_publisher_profiles_and_transactions.sql is a no-op. Run supabase/migrations/002_dashboard_backend.sql instead.';
END;
$$;
