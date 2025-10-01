/**
 * Secure Database Connection Module
 * Handles secure PostgreSQL and Supabase connections with proper security configurations
 */

import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();

// Database connection configuration with security settings
const getDatabaseConfig = () => {
  const config = {
    // PostgreSQL direct connection (for raw queries when needed)
    postgresql: {
      user: process.env.DB_USER || process.env.POSTGRES_USER,
      password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD,
      host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || process.env.POSTGRES_PORT || '5432'),
      database: process.env.DB_NAME || process.env.POSTGRES_DB || 'tachi',
      
      // Security and performance settings
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: true,
        sslmode: 'require'
      } : false,
      
      // Connection pool settings for security and performance
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
      
      // Security settings
      application_name: 'tachi-api',
      statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'),
      query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
      
      // Prevent SQL injection by disabling multiple statements
      multipleStatements: false,
    },
    
    // Supabase configuration
    supabase: {
      url: process.env.SUPABASE_URL,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      anonKey: process.env.SUPABASE_ANON_KEY,
      
      auth: {
        autoRefreshToken: false, // Service role doesn't need refresh
        persistSession: false,   // Server-side, no session persistence needed
        detectSessionInUrl: false
      },
      
      // Security and performance settings
      global: {
        headers: {
          'x-application-name': 'tachi-api',
          'x-client-info': 'tachi-api/1.0.0'
        }
      },
      
      db: {
        schema: 'public'
      }
    }
  };
  
  return config;
};

// PostgreSQL connection pool (singleton)
let pgPool = null;

export const createPostgreSQLPool = () => {
  if (pgPool) {
    return pgPool;
  }
  
  try {
    const config = getDatabaseConfig();
    
    if (!config.postgresql.user || !config.postgresql.password) {
      logger.warn('PostgreSQL credentials not configured - PostgreSQL pool will not be created');
      return null;
    }
    
    pgPool = new Pool(config.postgresql);
    
    // Connection pool event handlers for monitoring and security
    pgPool.on('connect', (client) => {
      logger.info('New PostgreSQL client connected');
      
      // Set security parameters for each connection
      client.query(`
        SET application_name = 'tachi-api';
        SET statement_timeout = '30s';
        SET lock_timeout = '10s';
        SET idle_in_transaction_session_timeout = '60s';
      `).catch(err => {
        logger.error('Failed to set security parameters:', err);
      });
    });
    
    pgPool.on('error', (err, client) => {
      logger.error('PostgreSQL pool error:', {
        error: err.message,
        stack: err.stack,
        client: client ? 'available' : 'unavailable'
      });
    });
    
    pgPool.on('acquire', () => {
      logger.debug('PostgreSQL client acquired from pool');
    });
    
    pgPool.on('remove', () => {
      logger.debug('PostgreSQL client removed from pool');
    });
    
    logger.info('PostgreSQL connection pool created successfully', {
      host: config.postgresql.host,
      port: config.postgresql.port,
      database: config.postgresql.database,
      ssl: !!config.postgresql.ssl,
      maxConnections: config.postgresql.max
    });
    
    return pgPool;
    
  } catch (error) {
    logger.error('Failed to create PostgreSQL pool:', error);
    throw new Error('Database connection initialization failed');
  }
};

// Supabase client (singleton)
let supabaseClient = null;

export const createSupabaseClient = () => {
  if (supabaseClient) {
    return supabaseClient;
  }
  
  try {
    const config = getDatabaseConfig();
    
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      logger.warn('Supabase credentials not configured - Supabase client will not be created');
      return null;
    }
    
    supabaseClient = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: config.supabase.auth,
        global: config.supabase.global,
        db: config.supabase.db
      }
    );
    
    logger.info('Supabase client created successfully', {
      url: config.supabase.url,
      hasServiceKey: !!config.supabase.serviceRoleKey
    });
    
    return supabaseClient;
    
  } catch (error) {
    logger.error('Failed to create Supabase client:', error);
    throw new Error('Supabase client initialization failed');
  }
};

// Get database connections (lazy initialization)
export const getPostgreSQLPool = () => {
  if (!pgPool) {
    return createPostgreSQLPool();
  }
  return pgPool;
};

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    return createSupabaseClient();
  }
  return supabaseClient;
};

// Graceful shutdown handlers
export const closeDatabaseConnections = async () => {
  const shutdownPromises = [];
  
  if (pgPool) {
    logger.info('Closing PostgreSQL connection pool...');
    shutdownPromises.push(
      pgPool.end().then(() => {
        logger.info('PostgreSQL pool closed successfully');
        pgPool = null;
      }).catch(err => {
        logger.error('Error closing PostgreSQL pool:', err);
      })
    );
  }
  
  // Supabase client doesn't need explicit cleanup
  if (supabaseClient) {
    logger.info('Supabase client references cleared');
    supabaseClient = null;
  }
  
  await Promise.allSettled(shutdownPromises);
  logger.info('Database connections cleanup completed');
};

// Health check functions
export const checkDatabaseHealth = async () => {
  const health = {
    postgresql: { status: 'unknown', latency: null, error: null },
    supabase: { status: 'unknown', latency: null, error: null }
  };
  
  // Test PostgreSQL connection
  try {
    const pool = getPostgreSQLPool();
    if (pool) {
      const start = Date.now();
      const client = await pool.connect();
      await client.query('SELECT 1 as test');
      client.release();
      
      health.postgresql = {
        status: 'healthy',
        latency: Date.now() - start,
        error: null
      };
    } else {
      health.postgresql.status = 'not_configured';
    }
  } catch (error) {
    health.postgresql = {
      status: 'unhealthy',
      latency: null,
      error: error.message
    };
  }
  
  // Test Supabase connection
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const start = Date.now();
      const { data, error } = await supabase
        .from('publishers')
        .select('count')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }
      
      health.supabase = {
        status: 'healthy',
        latency: Date.now() - start,
        error: null
      };
    } else {
      health.supabase.status = 'not_configured';
    }
  } catch (error) {
    health.supabase = {
      status: 'unhealthy',
      latency: null,
      error: error.message
    };
  }
  
  return health;
};

// Process event handlers for graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, closing database connections...');
  closeDatabaseConnections().then(() => process.exit(0));
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, closing database connections...');
  closeDatabaseConnections().then(() => process.exit(0));
});

export default {
  getPostgreSQLPool,
  getSupabaseClient,
  checkDatabaseHealth,
  closeDatabaseConnections
};