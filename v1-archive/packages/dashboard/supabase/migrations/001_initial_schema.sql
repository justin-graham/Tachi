-- Deprecated migration.
-- Dashboard schema is defined centrally in supabase/migrations/002_dashboard_backend.sql.
-- This stub remains so local tooling that replays dashboard migrations does not fail.

DO $$
BEGIN
  RAISE NOTICE '001_initial_schema.sql is a no-op. Use supabase/migrations/002_dashboard_backend.sql for schema updates.';
END;
$$;
