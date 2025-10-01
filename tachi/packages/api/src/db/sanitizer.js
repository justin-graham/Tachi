/**
 * Advanced Query Sanitization and Validation Layer
 * Provides comprehensive protection against SQL injection and malicious database operations
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger();

// SQL injection patterns (comprehensive list)
const SQL_INJECTION_PATTERNS = [
  // Basic SQL injection patterns
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE|SHUTDOWN|GRANT|REVOKE)\b.*\b(FROM|INTO|SET|WHERE|VALUES|TABLE|DATABASE|SCHEMA|USER|PASSWORD|ADMIN)\b)/gi,
  
  // Union-based injection
  /(UNION\s+(ALL\s+)?SELECT)/gi,
  
  // Boolean-based injection
  /(OR\s+1\s*=\s*1|AND\s+1\s*=\s*1|OR\s+'1'\s*=\s*'1'|AND\s+'1'\s*=\s*'1')/gi,
  /(OR\s+1\s*=\s*0|AND\s+1\s*=\s*0|OR\s+'1'\s*=\s*'0'|AND\s+'1'\s*=\s*'0')/gi,
  /(1'\s*OR\s*'1'\s*=\s*'1'|'\s*OR\s*1\s*=\s*1)/gi,
  
  // Time-based injection
  /(WAITFOR\s+DELAY|SLEEP\s*\(|BENCHMARK\s*\(|pg_sleep\s*\()/gi,
  
  // Error-based injection
  /(CONVERT\s*\(|CAST\s*\(|EXTRACTVALUE\s*\(|UPDATEXML\s*\()/gi,
  
  // Stacked queries
  /(;\s*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE))/gi,
  
  // Comment injection
  /(--|\#|\/\*|\*\/|%00|%23|%2D%2D)/g,
  
  // Quote escape attempts
  /(';\s*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE))/gi,
  /(\\x[0-9a-f]{2}|\\[0-7]{3}|\\\w)/gi,
  
  // Function injection
  /(LOAD_FILE\s*\(|INTO\s+OUTFILE|INTO\s+DUMPFILE|LOAD\s+DATA\s+INFILE)/gi,
  
  // Information gathering
  /(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS|sys\.tables|sys\.columns|pg_tables|pg_attribute)/gi,
  
  // Database-specific functions
  /(@@VERSION|VERSION\s*\(\)|USER\s*\(\)|DATABASE\s*\(\)|CURRENT_USER|SESSION_USER)/gi,
  
  // Hex/Unicode encoding attempts
  /(0x[0-9a-f]+|CHAR\s*\(|ASCII\s*\(|UNHEX\s*\()/gi,
  
  // Substring/String manipulation functions often used in injection
  /(SUBSTRING\s*\(.*,.*,.*\)|MID\s*\(.*,.*,.*\)|LEFT\s*\(.*,.*\)|RIGHT\s*\(.*,.*\))/gi,
  
  // Conditional statements
  /(IF\s*\(.*,.*,.*\)|CASE\s+WHEN|IIF\s*\()/gi,
  
  // Server variables and functions
  /(@@\w+|SYSTEM_USER|CURRENT_DATABASE|HOST_NAME\s*\(\)|SERVERPROPERTY\s*\()/gi
];

// XSS patterns for additional protection
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<img[^>]+src[^>]*=[\s"']*javascript:/gi,
  /eval\s*\(/gi,
  /expression\s*\(/gi
];

// Path traversal patterns
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\/|\.\.\\|\.\.\%2f|\.\.\%5c/gi,
  /%2e%2e%2f|%2e%2e%5c/gi,
  /\.\.\//gi,
  /\.\.\\/gi
];

/**
 * Comprehensive input sanitizer
 */
export class InputSanitizer {
  static sanitize(input, options = {}) {
    if (input === null || input === undefined) {
      return input;
    }

    const config = {
      maxLength: options.maxLength || 1000,
      allowHtml: options.allowHtml || false,
      allowSpecialChars: options.allowSpecialChars || false,
      strictMode: options.strictMode || true,
      ...options
    };

    let sanitized = input;

    // Convert to string if needed
    if (typeof sanitized !== 'string') {
      sanitized = String(sanitized);
    }

    // Check for SQL injection patterns
    if (config.strictMode) {
      const sqlViolations = this.detectSQLInjection(sanitized);
      if (sqlViolations.length > 0) {
        logger.warn('SQL injection attempt detected', {
          input: sanitized.substring(0, 100),
          violations: sqlViolations
        });
        throw new Error('Input contains potentially malicious SQL patterns');
      }
    }

    // Check for XSS patterns
    if (!config.allowHtml) {
      const xssViolations = this.detectXSS(sanitized);
      if (xssViolations.length > 0) {
        logger.warn('XSS attempt detected', {
          input: sanitized.substring(0, 100),
          violations: xssViolations
        });
        sanitized = this.removeXSS(sanitized);
      }
    }

    // Check for path traversal
    const pathViolations = this.detectPathTraversal(sanitized);
    if (pathViolations.length > 0) {
      logger.warn('Path traversal attempt detected', {
        input: sanitized.substring(0, 100),
        violations: pathViolations
      });
      sanitized = this.removePathTraversal(sanitized);
    }

    // Remove null bytes and control characters
    sanitized = sanitized.replace(/\x00|\x08|\x0B|\x0C|\x0E|\x0F/g, '');
    
    // Handle special characters
    if (!config.allowSpecialChars) {
      // Remove or escape dangerous characters
      sanitized = sanitized.replace(/[<>\"'&\x00-\x1f\x7f-\x9f]/g, '');
    }

    // Trim whitespace
    sanitized = sanitized.trim();

    // Enforce length limit
    if (sanitized.length > config.maxLength) {
      sanitized = sanitized.substring(0, config.maxLength);
      logger.warn('Input truncated due to length limit', {
        originalLength: input.length,
        maxLength: config.maxLength
      });
    }

    return sanitized;
  }

  static detectSQLInjection(input) {
    const violations = [];
    
    SQL_INJECTION_PATTERNS.forEach((pattern, index) => {
      if (pattern.test(input)) {
        violations.push({
          type: 'sql_injection',
          pattern: index,
          description: this.getSQLPatternDescription(index)
        });
      }
    });

    return violations;
  }

  static detectXSS(input) {
    const violations = [];
    
    XSS_PATTERNS.forEach((pattern, index) => {
      if (pattern.test(input)) {
        violations.push({
          type: 'xss',
          pattern: index,
          description: this.getXSSPatternDescription(index)
        });
      }
    });

    return violations;
  }

  static detectPathTraversal(input) {
    const violations = [];
    
    PATH_TRAVERSAL_PATTERNS.forEach((pattern, index) => {
      if (pattern.test(input)) {
        violations.push({
          type: 'path_traversal',
          pattern: index,
          description: 'Path traversal attempt detected'
        });
      }
    });

    return violations;
  }

  static removeXSS(input) {
    let sanitized = input;
    
    XSS_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    return sanitized;
  }

  static removePathTraversal(input) {
    let sanitized = input;
    
    PATH_TRAVERSAL_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    return sanitized;
  }

  static getSQLPatternDescription(index) {
    const descriptions = [
      'SQL command injection',
      'UNION-based injection',
      'Boolean-based injection (true)',
      'Boolean-based injection (false)',
      'Time-based injection',
      'Error-based injection',
      'Stacked queries',
      'Comment injection',
      'Quote escape injection',
      'Encoding bypass attempt',
      'File operation injection',
      'Information schema access',
      'Database function injection',
      'Hex/Unicode encoding',
      'String manipulation injection',
      'Conditional statement injection',
      'Server variable access'
    ];
    
    return descriptions[index] || 'Unknown SQL injection pattern';
  }

  static getXSSPatternDescription(index) {
    const descriptions = [
      'Script tag injection',
      'Iframe injection',
      'JavaScript URL scheme',
      'Event handler injection',
      'Image source JavaScript',
      'Eval function call',
      'CSS expression injection'
    ];
    
    return descriptions[index] || 'Unknown XSS pattern';
  }
}

/**
 * Query validator for database operations
 */
export class QueryValidator {
  static validateTableName(tableName) {
    // Whitelist of allowed table names based on schema
    const ALLOWED_TABLES = [
      'users',
      'publishers',
      'crawlers', 
      'transactions',
      'payments',
      'api_keys',
      'usage_analytics'
    ];

    if (!tableName || typeof tableName !== 'string') {
      throw new Error('Table name must be a non-empty string');
    }

    const sanitizedTable = InputSanitizer.sanitize(tableName, { strictMode: true });
    
    if (!ALLOWED_TABLES.includes(sanitizedTable)) {
      logger.warn('Unauthorized table access attempt', { tableName });
      throw new Error(`Access to table '${tableName}' is not allowed`);
    }

    return sanitizedTable;
  }

  static validateColumnName(columnName, tableName = null) {
    // Define allowed columns per table
    const ALLOWED_COLUMNS = {
      publishers: [
        'id', 'email', 'name', 'domain', 'website_url', 'description', 
        'contact_email', 'price_per_request', 'rate_limit_per_hour', 
        'terms_of_service', 'status', 'total_earnings', 'total_requests',
        'stripe_account_id', 'created_at', 'updated_at'
      ],
      crawlers: [
        'id', 'email', 'company_name', 'type', 'use_case', 'estimated_volume',
        'credits', 'total_spent', 'total_requests', 'status', 'last_login',
        'created_at', 'updated_at'
      ],
      transactions: [
        'id', 'crawler_id', 'publisher_id', 'url', 'amount', 'status',
        'response_size', 'response_time', 'user_agent', 'ip_address', 'created_at'
      ],
      payments: [
        'id', 'crawler_id', 'stripe_payment_intent_id', 'amount_usd',
        'credits_purchased', 'status', 'failure_reason', 'created_at'
      ],
      api_keys: [
        'id', 'crawler_id', 'key_name', 'key_hash', 'last_used',
        'usage_count', 'is_active', 'created_at'
      ],
      usage_analytics: [
        'id', 'date', 'publisher_id', 'crawler_id', 'total_requests',
        'total_amount', 'total_data_served', 'avg_response_time', 'created_at'
      ]
    };

    if (!columnName || typeof columnName !== 'string') {
      throw new Error('Column name must be a non-empty string');
    }

    const sanitizedColumn = InputSanitizer.sanitize(columnName, { strictMode: true });

    // Check against whitelist if table is specified
    if (tableName && ALLOWED_COLUMNS[tableName]) {
      if (!ALLOWED_COLUMNS[tableName].includes(sanitizedColumn)) {
        logger.warn('Unauthorized column access attempt', { 
          columnName, 
          tableName 
        });
        throw new Error(`Access to column '${columnName}' in table '${tableName}' is not allowed`);
      }
    }

    // Additional validation for column name format
    const VALID_COLUMN_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!VALID_COLUMN_PATTERN.test(sanitizedColumn)) {
      throw new Error(`Invalid column name format: ${columnName}`);
    }

    // Check for null bytes and path traversal in column names
    if (sanitizedColumn.includes('\x00') || sanitizedColumn.includes('..')) {
      throw new Error(`Column name contains invalid characters: ${columnName}`);
    }

    if (sanitizedColumn.length > 63) {
      throw new Error('Column name too long (max 63 characters)');
    }

    return sanitizedColumn;
  }

  static validateQueryValue(value, columnName = null, dataType = null) {
    if (value === null || value === undefined) {
      return value;
    }

    // Type-specific validation
    if (dataType) {
      switch (dataType.toLowerCase()) {
        case 'uuid':
          return this.validateUUID(value);
        case 'email':
          return this.validateEmail(value);
        case 'url':
          return this.validateURL(value);
        case 'decimal':
        case 'numeric':
          return this.validateNumeric(value);
        case 'integer':
          return this.validateInteger(value);
        case 'boolean':
          return this.validateBoolean(value);
        case 'timestamp':
        case 'date':
          return this.validateDate(value);
        default:
          break;
      }
    }

    // Column-specific validation
    if (columnName) {
      if (columnName.includes('email')) {
        return this.validateEmail(value);
      }
      if (columnName.includes('url') || columnName === 'website_url') {
        return this.validateURL(value);
      }
      if (columnName.endsWith('_id') && columnName !== 'stripe_payment_intent_id') {
        return this.validateUUID(value);
      }
    }

    // General sanitization
    return InputSanitizer.sanitize(value, { 
      maxLength: 1000,
      strictMode: true 
    });
  }

  static validateUUID(value) {
    const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
      throw new Error(`Invalid UUID format: ${value}`);
    }
    
    return value.toLowerCase();
  }

  static validateEmail(value) {
    const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (typeof value !== 'string' || !EMAIL_PATTERN.test(value) || value.length > 255) {
      throw new Error(`Invalid email format: ${value}`);
    }
    
    return InputSanitizer.sanitize(value.toLowerCase(), { 
      allowSpecialChars: true,
      maxLength: 255 
    });
  }

  static validateURL(value) {
    if (typeof value !== 'string' || value.length > 500) {
      throw new Error(`Invalid URL: too long or not a string`);
    }

    try {
      new URL(value);
      return InputSanitizer.sanitize(value, { 
        allowSpecialChars: true,
        maxLength: 500 
      });
    } catch {
      throw new Error(`Invalid URL format: ${value}`);
    }
  }

  static validateNumeric(value) {
    const num = parseFloat(value);
    if (isNaN(num) || !isFinite(num)) {
      throw new Error(`Invalid numeric value: ${value}`);
    }
    return num;
  }

  static validateInteger(value) {
    const num = parseInt(value);
    if (isNaN(num) || !Number.isInteger(num)) {
      throw new Error(`Invalid integer value: ${value}`);
    }
    return num;
  }

  static validateBoolean(value) {
    if (typeof value === 'boolean') {
      return value;
    }
    
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true' || lower === '1') return true;
      if (lower === 'false' || lower === '0') return false;
    }
    
    if (typeof value === 'number') {
      return value !== 0;
    }
    
    throw new Error(`Invalid boolean value: ${value}`);
  }

  static validateDate(value) {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date value: ${value}`);
    }
    return date.toISOString();
  }

  static validateQueryOptions(options = {}) {
    const validatedOptions = {};

    if (options.limit !== undefined) {
      const limit = parseInt(options.limit);
      if (isNaN(limit) || limit < 1 || limit > 1000) {
        throw new Error('Limit must be between 1 and 1000');
      }
      validatedOptions.limit = limit;
    }

    if (options.offset !== undefined) {
      const offset = parseInt(options.offset);
      if (isNaN(offset) || offset < 0) {
        throw new Error('Offset must be a non-negative integer');
      }
      validatedOptions.offset = offset;
    }

    if (options.orderBy !== undefined) {
      validatedOptions.orderBy = this.validateColumnName(options.orderBy);
    }

    if (options.orderDirection !== undefined) {
      const direction = options.orderDirection.toUpperCase();
      if (!['ASC', 'DESC'].includes(direction)) {
        throw new Error('Order direction must be ASC or DESC');
      }
      validatedOptions.orderDirection = direction;
    }

    return validatedOptions;
  }
}

// Security audit logger
export class SecurityAuditLogger {
  static logSecurityEvent(event, details = {}) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      event,
      severity: details.severity || 'medium',
      source: details.source || 'database_sanitizer',
      details: {
        ...details,
        userAgent: details.userAgent,
        ip: details.ip,
        userId: details.userId
      }
    };

    logger.warn('Security audit event', auditEntry);

    // In production, you might want to send this to a separate security log
    // or alerting system
  }

  static logSQLInjectionAttempt(input, violations, context = {}) {
    this.logSecurityEvent('sql_injection_attempt', {
      severity: 'high',
      input: input.substring(0, 200),
      violations,
      ...context
    });
  }

  static logXSSAttempt(input, violations, context = {}) {
    this.logSecurityEvent('xss_attempt', {
      severity: 'medium',
      input: input.substring(0, 200),
      violations,
      ...context
    });
  }

  static logUnauthorizedAccess(resource, action, context = {}) {
    this.logSecurityEvent('unauthorized_access', {
      severity: 'high',
      resource,
      action,
      ...context
    });
  }
}

export {
  SQL_INJECTION_PATTERNS,
  XSS_PATTERNS,
  PATH_TRAVERSAL_PATTERNS
};