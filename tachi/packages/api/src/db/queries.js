/**
 * Secure Database Query Utilities
 * Provides parameterized queries and SQL injection protection
 */

import { getPostgreSQLPool, getSupabaseClient } from './connection.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();

// Query sanitization patterns
const DANGEROUS_PATTERNS = [
  /(\b(DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE|SHUTDOWN)\b)/gi,
  /(UNION\s+SELECT)/gi,
  /(OR\s+1\s*=\s*1)/gi,
  /(AND\s+1\s*=\s*1)/gi,
  /('|(\\)|;|--|\/\*|\*\/)/g,
  /(script|javascript|vbscript|onload|onerror)/gi
];

// Input sanitization
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  
  // Remove dangerous patterns
  let sanitized = input;
  DANGEROUS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // Trim and limit length
  sanitized = sanitized.trim().substring(0, 1000);
  
  return sanitized;
};

// Validate SQL identifiers (table names, column names)
export const validateIdentifier = (identifier) => {
  const VALID_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  
  if (!identifier || typeof identifier !== 'string') {
    throw new Error('Invalid identifier: must be a non-empty string');
  }
  
  if (!VALID_IDENTIFIER.test(identifier)) {
    throw new Error(`Invalid identifier: ${identifier}. Only alphanumeric characters and underscores allowed.`);
  }
  
  if (identifier.length > 63) {
    throw new Error('Invalid identifier: maximum length is 63 characters');
  }
  
  return identifier;
};

// PostgreSQL Query Builder with parameterized queries
export class PostgreSQLQueryBuilder {
  constructor() {
    this.pool = getPostgreSQLPool();
  }

  // Execute parameterized SELECT query
  async select(table, columns = '*', conditions = {}, options = {}) {
    if (!this.pool) {
      throw new Error('PostgreSQL pool not available');
    }

    try {
      // Validate table name
      const validTable = validateIdentifier(table);
      
      // Build column list
      let columnList = '*';
      if (Array.isArray(columns)) {
        columnList = columns.map(col => validateIdentifier(col)).join(', ');
      } else if (typeof columns === 'string' && columns !== '*') {
        columnList = validateIdentifier(columns);
      }

      // Build WHERE clause with parameters
      const { whereClause, params } = this.buildWhereClause(conditions);
      
      // Build LIMIT and OFFSET
      const limitClause = options.limit ? `LIMIT $${params.length + 1}` : '';
      const offsetClause = options.offset ? `OFFSET $${params.length + (options.limit ? 2 : 1)}` : '';
      
      // Build ORDER BY
      const orderClause = options.orderBy ? 
        `ORDER BY ${validateIdentifier(options.orderBy)} ${options.orderDirection === 'DESC' ? 'DESC' : 'ASC'}` : '';

      // Construct final query
      const query = `
        SELECT ${columnList} 
        FROM ${validTable} 
        ${whereClause} 
        ${orderClause} 
        ${limitClause} 
        ${offsetClause}
      `.trim().replace(/\s+/g, ' ');

      // Add LIMIT and OFFSET parameters
      if (options.limit) params.push(parseInt(options.limit));
      if (options.offset) params.push(parseInt(options.offset));

      logger.debug('Executing SELECT query', { query, paramCount: params.length });

      const client = await this.pool.connect();
      try {
        const result = await client.query(query, params);
        return result.rows;
      } finally {
        client.release();
      }

    } catch (error) {
      logger.error('PostgreSQL SELECT error:', error);
      throw new Error('Database query failed');
    }
  }

  // Execute parameterized INSERT query
  async insert(table, data) {
    if (!this.pool) {
      throw new Error('PostgreSQL pool not available');
    }

    try {
      const validTable = validateIdentifier(table);
      
      if (!data || typeof data !== 'object') {
        throw new Error('Insert data must be an object');
      }

      const columns = Object.keys(data).map(col => validateIdentifier(col));
      const values = Object.values(data).map(val => sanitizeInput(val));
      const placeholders = values.map((_, index) => `$${index + 1}`);

      const query = `
        INSERT INTO ${validTable} (${columns.join(', ')}) 
        VALUES (${placeholders.join(', ')}) 
        RETURNING *
      `;

      logger.debug('Executing INSERT query', { query, paramCount: values.length });

      const client = await this.pool.connect();
      try {
        const result = await client.query(query, values);
        return result.rows[0];
      } finally {
        client.release();
      }

    } catch (error) {
      logger.error('PostgreSQL INSERT error:', error);
      throw new Error('Database insert failed');
    }
  }

  // Execute parameterized UPDATE query
  async update(table, data, conditions) {
    if (!this.pool) {
      throw new Error('PostgreSQL pool not available');
    }

    try {
      const validTable = validateIdentifier(table);
      
      if (!data || typeof data !== 'object') {
        throw new Error('Update data must be an object');
      }

      if (!conditions || typeof conditions !== 'object') {
        throw new Error('Update conditions must be provided');
      }

      // Build SET clause
      const columns = Object.keys(data);
      const values = Object.values(data).map(val => sanitizeInput(val));
      const setClause = columns
        .map((col, index) => `${validateIdentifier(col)} = $${index + 1}`)
        .join(', ');

      // Build WHERE clause
      const { whereClause, params: whereParams } = this.buildWhereClause(conditions, values.length);

      const query = `
        UPDATE ${validTable} 
        SET ${setClause} 
        ${whereClause} 
        RETURNING *
      `;

      const allParams = [...values, ...whereParams];

      logger.debug('Executing UPDATE query', { query, paramCount: allParams.length });

      const client = await this.pool.connect();
      try {
        const result = await client.query(query, allParams);
        return result.rows;
      } finally {
        client.release();
      }

    } catch (error) {
      logger.error('PostgreSQL UPDATE error:', error);
      throw new Error('Database update failed');
    }
  }

  // Execute parameterized DELETE query
  async delete(table, conditions) {
    if (!this.pool) {
      throw new Error('PostgreSQL pool not available');
    }

    try {
      const validTable = validateIdentifier(table);
      
      if (!conditions || typeof conditions !== 'object') {
        throw new Error('Delete conditions must be provided');
      }

      const { whereClause, params } = this.buildWhereClause(conditions);

      const query = `DELETE FROM ${validTable} ${whereClause} RETURNING *`;

      logger.debug('Executing DELETE query', { query, paramCount: params.length });

      const client = await this.pool.connect();
      try {
        const result = await client.query(query, params);
        return result.rows;
      } finally {
        client.release();
      }

    } catch (error) {
      logger.error('PostgreSQL DELETE error:', error);
      throw new Error('Database delete failed');
    }
  }

  // Build WHERE clause with parameters
  buildWhereClause(conditions, startIndex = 0) {
    if (!conditions || Object.keys(conditions).length === 0) {
      return { whereClause: '', params: [] };
    }

    const whereParts = [];
    const params = [];
    let paramIndex = startIndex + 1;

    for (const [key, value] of Object.entries(conditions)) {
      const validKey = validateIdentifier(key);
      
      if (Array.isArray(value)) {
        // IN clause
        const placeholders = value.map(() => `$${paramIndex++}`);
        whereParts.push(`${validKey} IN (${placeholders.join(', ')})`);
        params.push(...value.map(v => sanitizeInput(v)));
      } else if (value === null) {
        // IS NULL
        whereParts.push(`${validKey} IS NULL`);
      } else if (typeof value === 'object' && value.operator) {
        // Custom operator (e.g., { operator: 'LIKE', value: '%test%' })
        const validOperators = ['=', '!=', '<>', '<', '>', '<=', '>=', 'LIKE', 'ILIKE'];
        if (!validOperators.includes(value.operator.toUpperCase())) {
          throw new Error(`Invalid operator: ${value.operator}`);
        }
        whereParts.push(`${validKey} ${value.operator} $${paramIndex++}`);
        params.push(sanitizeInput(value.value));
      } else {
        // Standard equality
        whereParts.push(`${validKey} = $${paramIndex++}`);
        params.push(sanitizeInput(value));
      }
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';
    return { whereClause, params };
  }

  // Execute raw parameterized query (for complex queries)
  async raw(query, params = []) {
    if (!this.pool) {
      throw new Error('PostgreSQL pool not available');
    }

    try {
      // Basic query validation - should not contain dangerous patterns
      const sanitizedQuery = sanitizeInput(query);
      if (sanitizedQuery !== query) {
        throw new Error('Query contains potentially dangerous content');
      }

      const sanitizedParams = params.map(param => sanitizeInput(param));

      logger.debug('Executing raw query', { query, paramCount: params.length });

      const client = await this.pool.connect();
      try {
        const result = await client.query(query, sanitizedParams);
        return result.rows;
      } finally {
        client.release();
      }

    } catch (error) {
      logger.error('PostgreSQL raw query error:', error);
      throw new Error('Database query failed');
    }
  }
}

// Supabase Query Builder with additional security
export class SupabaseQueryBuilder {
  constructor() {
    this.client = getSupabaseClient();
  }

  // Secure SELECT with input validation
  async select(table, columns = '*', conditions = {}, options = {}) {
    if (!this.client) {
      throw new Error('Supabase client not available');
    }

    try {
      const validTable = validateIdentifier(table);
      
      let query = this.client.from(validTable);
      
      // Select specific columns
      if (columns !== '*') {
        if (Array.isArray(columns)) {
          const validColumns = columns.map(col => validateIdentifier(col)).join(',');
          query = query.select(validColumns);
        } else {
          query = query.select(validateIdentifier(columns));
        }
      } else {
        query = query.select('*');
      }

      // Apply conditions
      for (const [key, value] of Object.entries(conditions)) {
        const validKey = validateIdentifier(key);
        const sanitizedValue = sanitizeInput(value);
        
        if (Array.isArray(value)) {
          query = query.in(validKey, value.map(v => sanitizeInput(v)));
        } else if (value === null) {
          query = query.is(validKey, null);
        } else if (typeof value === 'object' && value.operator) {
          switch (value.operator.toLowerCase()) {
            case 'like':
              query = query.like(validKey, sanitizeInput(value.value));
              break;
            case 'ilike':
              query = query.ilike(validKey, sanitizeInput(value.value));
              break;
            case 'gt':
              query = query.gt(validKey, sanitizeInput(value.value));
              break;
            case 'gte':
              query = query.gte(validKey, sanitizeInput(value.value));
              break;
            case 'lt':
              query = query.lt(validKey, sanitizeInput(value.value));
              break;
            case 'lte':
              query = query.lte(validKey, sanitizeInput(value.value));
              break;
            default:
              query = query.eq(validKey, sanitizeInput(value.value));
          }
        } else {
          query = query.eq(validKey, sanitizedValue);
        }
      }

      // Apply options
      if (options.orderBy) {
        const validOrderBy = validateIdentifier(options.orderBy);
        query = query.order(validOrderBy, { 
          ascending: options.orderDirection !== 'DESC' 
        });
      }

      if (options.limit) {
        query = query.limit(parseInt(options.limit));
      }

      if (options.offset) {
        query = query.range(
          parseInt(options.offset), 
          parseInt(options.offset) + parseInt(options.limit || 100) - 1
        );
      }

      logger.debug('Executing Supabase SELECT', { table: validTable });

      const { data, error } = await query;

      if (error) {
        logger.error('Supabase SELECT error:', error);
        throw error;
      }

      return data;

    } catch (error) {
      logger.error('Supabase query error:', error);
      throw new Error('Database query failed');
    }
  }

  // Secure INSERT
  async insert(table, data) {
    if (!this.client) {
      throw new Error('Supabase client not available');
    }

    try {
      const validTable = validateIdentifier(table);
      
      if (!data || typeof data !== 'object') {
        throw new Error('Insert data must be an object');
      }

      // Sanitize all input data
      const sanitizedData = {};
      for (const [key, value] of Object.entries(data)) {
        const validKey = validateIdentifier(key);
        sanitizedData[validKey] = sanitizeInput(value);
      }

      logger.debug('Executing Supabase INSERT', { table: validTable });

      const { data: result, error } = await this.client
        .from(validTable)
        .insert(sanitizedData)
        .select();

      if (error) {
        logger.error('Supabase INSERT error:', error);
        throw error;
      }

      return result[0];

    } catch (error) {
      logger.error('Supabase insert error:', error);
      throw new Error('Database insert failed');
    }
  }

  // Secure UPDATE
  async update(table, data, conditions) {
    if (!this.client) {
      throw new Error('Supabase client not available');
    }

    try {
      const validTable = validateIdentifier(table);
      
      if (!data || typeof data !== 'object') {
        throw new Error('Update data must be an object');
      }

      if (!conditions || typeof conditions !== 'object') {
        throw new Error('Update conditions must be provided');
      }

      // Sanitize update data
      const sanitizedData = {};
      for (const [key, value] of Object.entries(data)) {
        const validKey = validateIdentifier(key);
        sanitizedData[validKey] = sanitizeInput(value);
      }

      let query = this.client.from(validTable).update(sanitizedData);

      // Apply conditions
      for (const [key, value] of Object.entries(conditions)) {
        const validKey = validateIdentifier(key);
        const sanitizedValue = sanitizeInput(value);
        query = query.eq(validKey, sanitizedValue);
      }

      logger.debug('Executing Supabase UPDATE', { table: validTable });

      const { data: result, error } = await query.select();

      if (error) {
        logger.error('Supabase UPDATE error:', error);
        throw error;
      }

      return result;

    } catch (error) {
      logger.error('Supabase update error:', error);
      throw new Error('Database update failed');
    }
  }

  // Secure DELETE
  async delete(table, conditions) {
    if (!this.client) {
      throw new Error('Supabase client not available');
    }

    try {
      const validTable = validateIdentifier(table);
      
      if (!conditions || typeof conditions !== 'object') {
        throw new Error('Delete conditions must be provided');
      }

      let query = this.client.from(validTable).delete();

      // Apply conditions
      for (const [key, value] of Object.entries(conditions)) {
        const validKey = validateIdentifier(key);
        const sanitizedValue = sanitizeInput(value);
        query = query.eq(validKey, sanitizedValue);
      }

      logger.debug('Executing Supabase DELETE', { table: validTable });

      const { data: result, error } = await query.select();

      if (error) {
        logger.error('Supabase DELETE error:', error);
        throw error;
      }

      return result;

    } catch (error) {
      logger.error('Supabase delete error:', error);
      throw new Error('Database delete failed');
    }
  }
}

// Export singleton instances
export const pgQuery = new PostgreSQLQueryBuilder();
export const supabaseQuery = new SupabaseQueryBuilder();

// High-level database operations
export const db = {
  // Use PostgreSQL for raw queries and complex operations
  pg: pgQuery,
  
  // Use Supabase for standard CRUD operations with RLS
  supabase: supabaseQuery,
  
  // Auto-select appropriate query builder
  select: async (table, columns, conditions, options) => {
    // Use Supabase by default for better RLS support
    return await supabaseQuery.select(table, columns, conditions, options);
  },
  
  insert: async (table, data) => {
    return await supabaseQuery.insert(table, data);
  },
  
  update: async (table, data, conditions) => {
    return await supabaseQuery.update(table, data, conditions);
  },
  
  delete: async (table, conditions) => {
    return await supabaseQuery.delete(table, conditions);
  }
};

export default db;