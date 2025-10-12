/**
 * Database Migration Runner
 * Handles database setup, migrations, and schema management
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

class DatabaseMigrator {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    this.migrationsDir = __dirname;
    this.migrationTable = 'schema_migrations';
  }

  /**
   * Initialize the migrations system
   */
  async initialize() {
    try {
      console.log('🔧 Initializing database migration system...');
      
      // Create migrations tracking table
      const { error } = await this.supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS ${this.migrationTable} (
            id SERIAL PRIMARY KEY,
            version VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            applied_at TIMESTAMPTZ DEFAULT NOW(),
            checksum VARCHAR(64),
            execution_time_ms INTEGER
          );
          
          CREATE INDEX IF NOT EXISTS idx_schema_migrations_version 
          ON ${this.migrationTable}(version);
        `
      });

      if (error) {
        console.error('❌ Failed to create migrations table:', error);
        throw error;
      }

      console.log('✅ Migration system initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize migration system:', error);
      throw error;
    }
  }

  /**
   * Get list of applied migrations
   */
  async getAppliedMigrations() {
    try {
      const { data, error } = await this.supabase
        .from(this.migrationTable)
        .select('version, name, applied_at')
        .order('version');

      if (error) {
        console.warn('⚠️  Could not fetch applied migrations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('⚠️  Could not fetch applied migrations:', error);
      return [];
    }
  }

  /**
   * Get list of available migration files
   */
  async getAvailableMigrations() {
    try {
      const files = await fs.readdir(this.migrationsDir);
      const migrationFiles = files
        .filter(file => file.endsWith('.sql') && file.match(/^\\d{3}_/))
        .sort()
        .map(file => ({
          version: file.substring(0, 3),
          name: file.substring(4, file.length - 4),
          filename: file,
          path: path.join(this.migrationsDir, file)
        }));

      return migrationFiles;
    } catch (error) {
      console.error('❌ Failed to read migration files:', error);
      throw error;
    }
  }

  /**
   * Calculate checksum for migration file
   */
  async calculateChecksum(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const crypto = await import('crypto');
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error) {
      console.error('❌ Failed to calculate checksum:', error);
      return null;
    }
  }

  /**
   * Execute a single migration
   */
  async executeMigration(migration) {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Applying migration ${migration.version}: ${migration.name}...`);
      
      // Read migration file
      const sql = await fs.readFile(migration.path, 'utf8');
      const checksum = await this.calculateChecksum(migration.path);
      
      // Execute migration SQL
      const { error: sqlError } = await this.supabase.rpc('exec_sql', { sql });
      
      if (sqlError) {
        console.error(`❌ Migration ${migration.version} failed:`, sqlError);
        throw sqlError;
      }
      
      const executionTime = Date.now() - startTime;
      
      // Record migration as applied
      const { error: recordError } = await this.supabase
        .from(this.migrationTable)
        .insert({
          version: migration.version,
          name: migration.name,
          checksum,
          execution_time_ms: executionTime
        });
      
      if (recordError) {
        console.error(`❌ Failed to record migration ${migration.version}:`, recordError);
        throw recordError;
      }
      
      console.log(`✅ Migration ${migration.version} applied successfully (${executionTime}ms)`);
      return true;
      
    } catch (error) {
      console.error(`❌ Migration ${migration.version} failed:`, error);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async migrate() {
    try {
      console.log('🚀 Starting database migration...');
      
      // Initialize migration system
      await this.initialize();
      
      // Get applied and available migrations
      const appliedMigrations = await this.getAppliedMigrations();
      const availableMigrations = await this.getAvailableMigrations();
      
      const appliedVersions = new Set(appliedMigrations.map(m => m.version));
      const pendingMigrations = availableMigrations.filter(m => !appliedVersions.has(m.version));
      
      console.log(`📊 Found ${availableMigrations.length} total migrations`);
      console.log(`📊 ${appliedMigrations.length} already applied`);
      console.log(`📊 ${pendingMigrations.length} pending`);
      
      if (pendingMigrations.length === 0) {
        console.log('✅ Database is up to date');
        return true;
      }
      
      // Apply pending migrations in order
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }
      
      console.log(`🎉 Successfully applied ${pendingMigrations.length} migrations`);
      return true;
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Check migration status
   */
  async status() {
    try {
      console.log('📋 Checking migration status...');
      
      const appliedMigrations = await this.getAppliedMigrations();
      const availableMigrations = await this.getAvailableMigrations();
      
      console.log('\\n📊 Migration Status:');
      console.log('═'.repeat(80));
      
      if (appliedMigrations.length === 0) {
        console.log('⚠️  No migrations have been applied yet');
      } else {
        console.log('✅ Applied Migrations:');
        appliedMigrations.forEach(migration => {
          console.log(`   ${migration.version}: ${migration.name} (${migration.applied_at})`);
        });
      }
      
      const appliedVersions = new Set(appliedMigrations.map(m => m.version));
      const pendingMigrations = availableMigrations.filter(m => !appliedVersions.has(m.version));
      
      if (pendingMigrations.length > 0) {
        console.log('\\n⏳ Pending Migrations:');
        pendingMigrations.forEach(migration => {
          console.log(`   ${migration.version}: ${migration.name}`);
        });
      } else {
        console.log('\\n✅ All migrations are up to date');
      }
      
      console.log('═'.repeat(80));
      
    } catch (error) {
      console.error('❌ Failed to check status:', error);
      throw error;
    }
  }

  /**
   * Rollback last migration (use with caution)
   */
  async rollback() {
    try {
      console.log('⚠️  WARNING: Rolling back last migration...');
      
      const appliedMigrations = await this.getAppliedMigrations();
      
      if (appliedMigrations.length === 0) {
        console.log('ℹ️  No migrations to rollback');
        return true;
      }
      
      const lastMigration = appliedMigrations[appliedMigrations.length - 1];
      
      console.log(`🔄 Rolling back: ${lastMigration.version}: ${lastMigration.name}`);
      
      // Check if rollback script exists
      const rollbackPath = path.join(this.migrationsDir, `${lastMigration.version}_${lastMigration.name}_rollback.sql`);
      
      try {
        const rollbackSql = await fs.readFile(rollbackPath, 'utf8');
        
        // Execute rollback
        const { error } = await this.supabase.rpc('exec_sql', { sql: rollbackSql });
        
        if (error) {
          console.error('❌ Rollback SQL failed:', error);
          throw error;
        }
        
        // Remove migration record
        await this.supabase
          .from(this.migrationTable)
          .delete()
          .eq('version', lastMigration.version);
        
        console.log(`✅ Successfully rolled back migration ${lastMigration.version}`);
        
      } catch (fileError) {
        console.error('❌ No rollback script found or rollback failed');
        console.error('⚠️  Manual rollback required');
        throw fileError;
      }
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Reset database (DANGEROUS - use only in development)
   */
  async reset() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('❌ Database reset is not allowed in production');
    }
    
    try {
      console.log('⚠️  WARNING: Resetting entire database...');
      console.log('⚠️  This will delete ALL data!');
      
      // Drop all tables (in correct order to handle dependencies)
      const dropSql = `
        DROP TABLE IF EXISTS analytics_daily CASCADE;
        DROP TABLE IF EXISTS system_health CASCADE;
        DROP TABLE IF EXISTS rate_limits CASCADE;
        DROP TABLE IF EXISTS url_safety_cache CASCADE;
        DROP TABLE IF EXISTS content_protection_logs CASCADE;
        DROP TABLE IF EXISTS publisher_verification CASCADE;
        DROP TABLE IF EXISTS payment_notifications CASCADE;
        DROP TABLE IF EXISTS refunds CASCADE;
        DROP TABLE IF EXISTS payment_disputes CASCADE;
        DROP TABLE IF EXISTS payment_retries CASCADE;
        DROP TABLE IF EXISTS payment_events CASCADE;
        DROP TABLE IF EXISTS payments CASCADE;
        DROP TABLE IF EXISTS transactions CASCADE;
        DROP TABLE IF EXISTS domain_pricing CASCADE;
        DROP TABLE IF EXISTS api_keys CASCADE;
        DROP TABLE IF EXISTS crawlers CASCADE;
        DROP TABLE IF EXISTS publishers CASCADE;
        DROP TABLE IF EXISTS ${this.migrationTable} CASCADE;
        
        DROP TYPE IF EXISTS user_status CASCADE;
        DROP TYPE IF EXISTS verification_status CASCADE;
        DROP TYPE IF EXISTS payment_status CASCADE;
        DROP TYPE IF EXISTS transaction_status CASCADE;
        DROP TYPE IF EXISTS content_type CASCADE;
        
        DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
        DROP FUNCTION IF EXISTS aggregate_daily_analytics() CASCADE;
        DROP FUNCTION IF EXISTS cleanup_expired_url_cache() CASCADE;
        DROP FUNCTION IF EXISTS cleanup_old_rate_limits() CASCADE;
      `;
      
      const { error } = await this.supabase.rpc('exec_sql', { sql: dropSql });
      
      if (error) {
        console.error('❌ Database reset failed:', error);
        throw error;
      }
      
      console.log('✅ Database reset complete');
      
      // Re-run migrations
      await this.migrate();
      
    } catch (error) {
      console.error('❌ Database reset failed:', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const migrator = new DatabaseMigrator();
  const command = process.argv[2] || 'migrate';
  
  try {
    switch (command) {
      case 'migrate':
        await migrator.migrate();
        break;
      case 'status':
        await migrator.status();
        break;
      case 'rollback':
        await migrator.rollback();
        break;
      case 'reset':
        await migrator.reset();
        break;
      default:
        console.log('Usage: node migrate.js [migrate|status|rollback|reset]');
        process.exit(1);
    }
    
    console.log('🎉 Operation completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Operation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default DatabaseMigrator;