/**
 * Secure Database Service Layer
 * High-level database operations with built-in security, validation, and audit logging
 */

import { db } from './queries.js';
import { InputSanitizer, QueryValidator, SecurityAuditLogger } from './sanitizer.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();

/**
 * Base service class with security features
 */
class BaseService {
  constructor(tableName) {
    this.tableName = QueryValidator.validateTableName(tableName);
  }

  // Validate and sanitize input data
  validateInput(data, context = {}) {
    if (!data || typeof data !== 'object') {
      throw new Error('Input data must be an object');
    }

    const validated = {};
    
    for (const [key, value] of Object.entries(data)) {
      try {
        const validColumn = QueryValidator.validateColumnName(key, this.tableName);
        const validValue = QueryValidator.validateQueryValue(value, key);
        validated[validColumn] = validValue;
      } catch (error) {
        logger.error('Input validation failed', {
          table: this.tableName,
          column: key,
          error: error.message,
          context
        });
        throw new Error(`Invalid input for field '${key}': ${error.message}`);
      }
    }

    return validated;
  }

  // Validate and sanitize query conditions
  validateConditions(conditions, context = {}) {
    if (!conditions || typeof conditions !== 'object') {
      return {};
    }

    const validated = {};
    
    for (const [key, value] of Object.entries(conditions)) {
      try {
        const validColumn = QueryValidator.validateColumnName(key, this.tableName);
        const validValue = QueryValidator.validateQueryValue(value, key);
        validated[validColumn] = validValue;
      } catch (error) {
        logger.error('Condition validation failed', {
          table: this.tableName,
          column: key,
          error: error.message,
          context
        });
        throw new Error(`Invalid condition for field '${key}': ${error.message}`);
      }
    }

    return validated;
  }

  // Validate query options
  validateOptions(options, context = {}) {
    try {
      return QueryValidator.validateQueryOptions(options);
    } catch (error) {
      logger.error('Options validation failed', {
        table: this.tableName,
        error: error.message,
        context
      });
      throw error;
    }
  }

  // Audit log for database operations
  auditLog(operation, details = {}) {
    logger.info('Database operation', {
      table: this.tableName,
      operation,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  // Error handling with security logging
  handleError(error, operation, context = {}) {
    logger.error('Database operation failed', {
      table: this.tableName,
      operation,
      error: error.message,
      stack: error.stack,
      context
    });

    // Check if error might be due to malicious input
    if (error.message.includes('potentially malicious') || 
        error.message.includes('SQL injection') ||
        error.message.includes('not allowed')) {
      SecurityAuditLogger.logSecurityEvent('database_security_violation', {
        severity: 'high',
        table: this.tableName,
        operation,
        error: error.message,
        ...context
      });
    }

    throw error;
  }
}

/**
 * Publishers Service
 */
export class PublishersService extends BaseService {
  constructor() {
    super('publishers');
  }

  async create(publisherData, context = {}) {
    try {
      this.auditLog('create_publisher', { context });
      
      const validatedData = this.validateInput(publisherData, context);
      
      // Additional business logic validation
      if (!validatedData.email || !validatedData.name || !validatedData.domain) {
        throw new Error('Email, name, and domain are required');
      }

      const result = await db.insert(this.tableName, validatedData);
      
      this.auditLog('publisher_created', { 
        publisherId: result.id,
        email: validatedData.email,
        context 
      });
      
      return result;
      
    } catch (error) {
      this.handleError(error, 'create', context);
    }
  }

  async findById(id, context = {}) {
    try {
      this.auditLog('find_publisher_by_id', { publisherId: id, context });
      
      const validId = QueryValidator.validateUUID(id);
      const conditions = { id: validId };
      
      const results = await db.select(this.tableName, '*', conditions);
      return results[0] || null;
      
    } catch (error) {
      this.handleError(error, 'findById', context);
    }
  }

  async findByDomain(domain, context = {}) {
    try {
      this.auditLog('find_publisher_by_domain', { domain, context });
      
      const sanitizedDomain = InputSanitizer.sanitize(domain, { maxLength: 255 });
      const conditions = { domain: sanitizedDomain };
      
      const results = await db.select(this.tableName, '*', conditions);
      return results[0] || null;
      
    } catch (error) {
      this.handleError(error, 'findByDomain', context);
    }
  }

  async findByEmail(email, context = {}) {
    try {
      this.auditLog('find_publisher_by_email', { email, context });
      
      const validEmail = QueryValidator.validateEmail(email);
      const conditions = { email: validEmail };
      
      const results = await db.select(this.tableName, '*', conditions);
      return results[0] || null;
      
    } catch (error) {
      this.handleError(error, 'findByEmail', context);
    }
  }

  async update(id, updateData, context = {}) {
    try {
      this.auditLog('update_publisher', { publisherId: id, context });
      
      const validId = QueryValidator.validateUUID(id);
      const validatedData = this.validateInput(updateData, context);
      const conditions = { id: validId };
      
      const results = await db.update(this.tableName, validatedData, conditions);
      
      this.auditLog('publisher_updated', { 
        publisherId: id,
        updatedFields: Object.keys(validatedData),
        context 
      });
      
      return results[0] || null;
      
    } catch (error) {
      this.handleError(error, 'update', context);
    }
  }

  async list(options = {}, context = {}) {
    try {
      this.auditLog('list_publishers', { options, context });
      
      const validatedOptions = this.validateOptions(options, context);
      
      const results = await db.select(this.tableName, '*', {}, validatedOptions);
      return results;
      
    } catch (error) {
      this.handleError(error, 'list', context);
    }
  }
}

/**
 * Crawlers Service
 */
export class CrawlersService extends BaseService {
  constructor() {
    super('crawlers');
  }

  async create(crawlerData, context = {}) {
    try {
      this.auditLog('create_crawler', { context });
      
      const validatedData = this.validateInput(crawlerData, context);
      
      // Additional business logic validation
      if (!validatedData.email || !validatedData.company_name) {
        throw new Error('Email and company name are required');
      }

      const result = await db.insert(this.tableName, validatedData);
      
      this.auditLog('crawler_created', { 
        crawlerId: result.id,
        email: validatedData.email,
        context 
      });
      
      return result;
      
    } catch (error) {
      this.handleError(error, 'create', context);
    }
  }

  async findById(id, context = {}) {
    try {
      this.auditLog('find_crawler_by_id', { crawlerId: id, context });
      
      const validId = QueryValidator.validateUUID(id);
      const conditions = { id: validId };
      
      const results = await db.select(this.tableName, '*', conditions);
      return results[0] || null;
      
    } catch (error) {
      this.handleError(error, 'findById', context);
    }
  }

  async findByEmail(email, context = {}) {
    try {
      this.auditLog('find_crawler_by_email', { email, context });
      
      const validEmail = QueryValidator.validateEmail(email);
      const conditions = { email: validEmail };
      
      const results = await db.select(this.tableName, '*', conditions);
      return results[0] || null;
      
    } catch (error) {
      this.handleError(error, 'findByEmail', context);
    }
  }

  async updateCredits(id, creditAmount, context = {}) {
    try {
      this.auditLog('update_crawler_credits', { 
        crawlerId: id, 
        creditAmount, 
        context 
      });
      
      const validId = QueryValidator.validateUUID(id);
      const validAmount = QueryValidator.validateNumeric(creditAmount);
      
      if (validAmount < 0) {
        throw new Error('Credit amount cannot be negative');
      }

      const updateData = { 
        credits: validAmount,
        updated_at: new Date().toISOString()
      };
      
      const conditions = { id: validId };
      const results = await db.update(this.tableName, updateData, conditions);
      
      this.auditLog('crawler_credits_updated', { 
        crawlerId: id,
        newCredits: validAmount,
        context 
      });
      
      return results[0] || null;
      
    } catch (error) {
      this.handleError(error, 'updateCredits', context);
    }
  }

  async deductCredits(id, amount, context = {}) {
    try {
      this.auditLog('deduct_crawler_credits', { 
        crawlerId: id, 
        amount, 
        context 
      });
      
      const validId = QueryValidator.validateUUID(id);
      const validAmount = QueryValidator.validateNumeric(amount);
      
      if (validAmount <= 0) {
        throw new Error('Deduction amount must be positive');
      }

      // First, get current credits
      const crawler = await this.findById(id, context);
      if (!crawler) {
        throw new Error('Crawler not found');
      }

      const currentCredits = parseFloat(crawler.credits) || 0;
      if (currentCredits < validAmount) {
        throw new Error('Insufficient credits');
      }

      const newCredits = currentCredits - validAmount;
      const updateData = { 
        credits: newCredits,
        total_spent: (parseFloat(crawler.total_spent) || 0) + validAmount,
        total_requests: (parseInt(crawler.total_requests) || 0) + 1,
        updated_at: new Date().toISOString()
      };
      
      const conditions = { id: validId };
      const results = await db.update(this.tableName, updateData, conditions);
      
      this.auditLog('crawler_credits_deducted', { 
        crawlerId: id,
        amountDeducted: validAmount,
        newCredits,
        context 
      });
      
      return results[0] || null;
      
    } catch (error) {
      this.handleError(error, 'deductCredits', context);
    }
  }
}

/**
 * Transactions Service
 */
export class TransactionsService extends BaseService {
  constructor() {
    super('transactions');
  }

  async create(transactionData, context = {}) {
    try {
      this.auditLog('create_transaction', { context });
      
      const validatedData = this.validateInput(transactionData, context);
      
      // Additional business logic validation
      if (!validatedData.crawler_id || !validatedData.publisher_id || 
          !validatedData.url || !validatedData.amount) {
        throw new Error('Crawler ID, publisher ID, URL, and amount are required');
      }

      const result = await db.insert(this.tableName, validatedData);
      
      this.auditLog('transaction_created', { 
        transactionId: result.id,
        crawlerId: validatedData.crawler_id,
        publisherId: validatedData.publisher_id,
        amount: validatedData.amount,
        context 
      });
      
      return result;
      
    } catch (error) {
      this.handleError(error, 'create', context);
    }
  }

  async findByCrawler(crawlerId, options = {}, context = {}) {
    try {
      this.auditLog('find_transactions_by_crawler', { 
        crawlerId, 
        options, 
        context 
      });
      
      const validId = QueryValidator.validateUUID(crawlerId);
      const validatedOptions = this.validateOptions(options, context);
      const conditions = { crawler_id: validId };
      
      const results = await db.select(this.tableName, '*', conditions, validatedOptions);
      return results;
      
    } catch (error) {
      this.handleError(error, 'findByCrawler', context);
    }
  }

  async findByPublisher(publisherId, options = {}, context = {}) {
    try {
      this.auditLog('find_transactions_by_publisher', { 
        publisherId, 
        options, 
        context 
      });
      
      const validId = QueryValidator.validateUUID(publisherId);
      const validatedOptions = this.validateOptions(options, context);
      const conditions = { publisher_id: validId };
      
      const results = await db.select(this.tableName, '*', conditions, validatedOptions);
      return results;
      
    } catch (error) {
      this.handleError(error, 'findByPublisher', context);
    }
  }
}

/**
 * Payments Service
 */
export class PaymentsService extends BaseService {
  constructor() {
    super('payments');
  }

  async create(paymentData, context = {}) {
    try {
      this.auditLog('create_payment', { context });
      
      const validatedData = this.validateInput(paymentData, context);
      
      // Additional business logic validation
      if (!validatedData.crawler_id || !validatedData.amount_usd || 
          !validatedData.credits_purchased) {
        throw new Error('Crawler ID, amount USD, and credits purchased are required');
      }

      const result = await db.insert(this.tableName, validatedData);
      
      this.auditLog('payment_created', { 
        paymentId: result.id,
        crawlerId: validatedData.crawler_id,
        amount: validatedData.amount_usd,
        credits: validatedData.credits_purchased,
        context 
      });
      
      return result;
      
    } catch (error) {
      this.handleError(error, 'create', context);
    }
  }

  async findByCrawler(crawlerId, options = {}, context = {}) {
    try {
      this.auditLog('find_payments_by_crawler', { 
        crawlerId, 
        options, 
        context 
      });
      
      const validId = QueryValidator.validateUUID(crawlerId);
      const validatedOptions = this.validateOptions(options, context);
      const conditions = { crawler_id: validId };
      
      const results = await db.select(this.tableName, '*', conditions, validatedOptions);
      return results;
      
    } catch (error) {
      this.handleError(error, 'findByCrawler', context);
    }
  }

  async updateStatus(id, status, context = {}) {
    try {
      this.auditLog('update_payment_status', { 
        paymentId: id, 
        status, 
        context 
      });
      
      const validId = QueryValidator.validateUUID(id);
      const validStatus = InputSanitizer.sanitize(status, { maxLength: 20 });
      
      const allowedStatuses = ['pending', 'completed', 'failed', 'refunded'];
      if (!allowedStatuses.includes(validStatus)) {
        throw new Error(`Invalid payment status: ${status}`);
      }

      const updateData = { 
        status: validStatus,
        updated_at: new Date().toISOString()
      };
      
      const conditions = { id: validId };
      const results = await db.update(this.tableName, updateData, conditions);
      
      this.auditLog('payment_status_updated', { 
        paymentId: id,
        newStatus: validStatus,
        context 
      });
      
      return results[0] || null;
      
    } catch (error) {
      this.handleError(error, 'updateStatus', context);
    }
  }
}

/**
 * Users Service - Complete user management with authentication support
 */
export class UsersService extends BaseService {
  constructor() {
    super('users');
  }

  async create(userData, context = {}) {
    try {
      this.auditLog('create_user', { context });
      
      const validatedData = this.validateInput(userData, context);
      
      // Additional business logic validation
      if (!validatedData.email || !validatedData.password_hash || 
          !validatedData.first_name || !validatedData.last_name) {
        throw new Error('Email, password hash, first name, and last name are required');
      }

      // Ensure email is lowercase and unique
      validatedData.email = validatedData.email.toLowerCase();

      const result = await db.insert(this.tableName, validatedData);
      
      this.auditLog('user_created', { 
        userId: result.id,
        email: validatedData.email,
        type: validatedData.type,
        context 
      });
      
      return result;
      
    } catch (error) {
      this.handleError(error, 'create', context);
    }
  }

  async findById(id, context = {}) {
    try {
      this.auditLog('find_user_by_id', { userId: id, context });
      
      const validId = QueryValidator.validateUUID(id);
      const conditions = { id: validId };
      
      const results = await db.select(this.tableName, '*', conditions);
      return results[0] || null;
      
    } catch (error) {
      this.handleError(error, 'findById', context);
    }
  }

  async findByEmail(email, context = {}) {
    try {
      this.auditLog('find_user_by_email', { email, context });
      
      const validEmail = QueryValidator.validateEmail(email);
      const conditions = { email: validEmail.toLowerCase() };
      
      const results = await db.select(this.tableName, '*', conditions);
      return results[0] || null;
      
    } catch (error) {
      this.handleError(error, 'findByEmail', context);
    }
  }

  async findByVerificationToken(token, context = {}) {
    try {
      this.auditLog('find_user_by_verification_token', { context });
      
      const sanitizedToken = InputSanitizer.sanitize(token, { maxLength: 256 });
      const conditions = { 
        verification_token: sanitizedToken,
        email_verified: false
      };
      
      const results = await db.select(this.tableName, '*', conditions);
      return results[0] || null;
      
    } catch (error) {
      this.handleError(error, 'findByVerificationToken', context);
    }
  }

  async findByResetToken(token, context = {}) {
    try {
      this.auditLog('find_user_by_reset_token', { context });
      
      const sanitizedToken = InputSanitizer.sanitize(token, { maxLength: 256 });
      const now = new Date().toISOString();
      
      // Use raw SQL for complex query
      const query = `
        SELECT * FROM users 
        WHERE reset_token = ? 
        AND reset_token_expires > ?
        LIMIT 1
      `;
      
      const results = await db.raw(query, [sanitizedToken, now]);
      return results[0] || null;
      
    } catch (error) {
      this.handleError(error, 'findByResetToken', context);
    }
  }

  async update(id, updateData, context = {}) {
    try {
      this.auditLog('update_user', { userId: id, context });
      
      const validId = QueryValidator.validateUUID(id);
      const validatedData = this.validateInput(updateData, context);
      
      // Ensure updated_at is set
      validatedData.updated_at = new Date().toISOString();
      
      const conditions = { id: validId };
      const results = await db.update(this.tableName, validatedData, conditions);
      
      this.auditLog('user_updated', { 
        userId: id,
        updatedFields: Object.keys(validatedData),
        context 
      });
      
      return results[0] || null;
      
    } catch (error) {
      this.handleError(error, 'update', context);
    }
  }

  async verifyEmail(id, context = {}) {
    try {
      this.auditLog('verify_user_email', { userId: id, context });
      
      const validId = QueryValidator.validateUUID(id);
      const updateData = {
        email_verified: true,
        verification_token: null,
        email_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const conditions = { id: validId };
      const results = await db.update(this.tableName, updateData, conditions);
      
      this.auditLog('user_email_verified', { userId: id, context });
      
      return results[0] || null;
      
    } catch (error) {
      this.handleError(error, 'verifyEmail', context);
    }
  }

  async updatePassword(id, passwordHash, context = {}) {
    try {
      this.auditLog('update_user_password', { userId: id, context });
      
      const validId = QueryValidator.validateUUID(id);
      const updateData = {
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expires: null,
        password_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const conditions = { id: validId };
      const results = await db.update(this.tableName, updateData, conditions);
      
      this.auditLog('user_password_updated', { userId: id, context });
      
      return results[0] || null;
      
    } catch (error) {
      this.handleError(error, 'updatePassword', context);
    }
  }

  async saveResetToken(id, resetToken, expiresAt, context = {}) {
    try {
      this.auditLog('save_reset_token', { userId: id, context });
      
      const validId = QueryValidator.validateUUID(id);
      const updateData = {
        reset_token: resetToken,
        reset_token_expires: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const conditions = { id: validId };
      const results = await db.update(this.tableName, updateData, conditions);
      
      this.auditLog('reset_token_saved', { userId: id, context });
      
      return results[0] || null;
      
    } catch (error) {
      this.handleError(error, 'saveResetToken', context);
    }
  }

  async updateLastLogin(id, ipAddress, userAgent, context = {}) {
    try {
      this.auditLog('update_last_login', { userId: id, context });
      
      const validId = QueryValidator.validateUUID(id);
      const updateData = {
        last_login_at: new Date().toISOString(),
        last_login_ip: InputSanitizer.sanitize(ipAddress, { maxLength: 45 }),
        last_user_agent: InputSanitizer.sanitize(userAgent, { maxLength: 512 }),
        failed_login_attempts: 0, // Reset on successful login
        updated_at: new Date().toISOString()
      };
      
      const conditions = { id: validId };
      const results = await db.update(this.tableName, updateData, conditions);
      
      this.auditLog('last_login_updated', { userId: id, context });
      
      return results[0] || null;
      
    } catch (error) {
      this.handleError(error, 'updateLastLogin', context);
    }
  }

  async incrementFailedLoginAttempts(id, context = {}) {
    try {
      this.auditLog('increment_failed_login_attempts', { userId: id, context });
      
      const validId = QueryValidator.validateUUID(id);
      
      // Use raw SQL for atomic increment
      const query = `
        UPDATE users 
        SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1,
            updated_at = ?
        WHERE id = ?
      `;
      
      await db.raw(query, [new Date().toISOString(), validId]);
      
      this.auditLog('failed_login_attempts_incremented', { userId: id, context });
      
      return true;
      
    } catch (error) {
      this.handleError(error, 'incrementFailedLoginAttempts', context);
    }
  }

  async lockAccount(id, reason, context = {}) {
    try {
      this.auditLog('lock_user_account', { userId: id, reason, context });
      
      const validId = QueryValidator.validateUUID(id);
      const updateData = {
        account_locked: true,
        account_locked_at: new Date().toISOString(),
        lock_reason: InputSanitizer.sanitize(reason, { maxLength: 255 }),
        updated_at: new Date().toISOString()
      };
      
      const conditions = { id: validId };
      const results = await db.update(this.tableName, updateData, conditions);
      
      this.auditLog('user_account_locked', { 
        userId: id, 
        reason,
        context 
      });
      
      return results[0] || null;
      
    } catch (error) {
      this.handleError(error, 'lockAccount', context);
    }
  }

  async unlockAccount(id, context = {}) {
    try {
      this.auditLog('unlock_user_account', { userId: id, context });
      
      const validId = QueryValidator.validateUUID(id);
      const updateData = {
        account_locked: false,
        account_locked_at: null,
        lock_reason: null,
        failed_login_attempts: 0,
        updated_at: new Date().toISOString()
      };
      
      const conditions = { id: validId };
      const results = await db.update(this.tableName, updateData, conditions);
      
      this.auditLog('user_account_unlocked', { userId: id, context });
      
      return results[0] || null;
      
    } catch (error) {
      this.handleError(error, 'unlockAccount', context);
    }
  }
}

/**
 * API Keys Service - Manage API key generation, rotation, and permissions
 */
export class ApiKeysService extends BaseService {
  constructor() {
    super('api_keys');
  }

  async create(keyData, context = {}) {
    try {
      this.auditLog('create_api_key', { context });
      
      const validatedData = this.validateInput(keyData, context);
      
      // Additional business logic validation
      if (!validatedData.user_id || !validatedData.name || !validatedData.key_hash) {
        throw new Error('User ID, name, and key hash are required');
      }

      const result = await db.insert(this.tableName, validatedData);
      
      this.auditLog('api_key_created', { 
        keyId: result.id,
        userId: validatedData.user_id,
        name: validatedData.name,
        context 
      });
      
      return result;
      
    } catch (error) {
      this.handleError(error, 'create', context);
    }
  }

  async findByUser(userId, options = {}, context = {}) {
    try {
      this.auditLog('find_api_keys_by_user', { userId, context });
      
      const validId = QueryValidator.validateUUID(userId);
      const validatedOptions = this.validateOptions(options, context);
      const conditions = { 
        user_id: validId,
        revoked: false 
      };
      
      const results = await db.select(this.tableName, '*', conditions, validatedOptions);
      return results;
      
    } catch (error) {
      this.handleError(error, 'findByUser', context);
    }
  }

  async findByHash(keyHash, context = {}) {
    try {
      this.auditLog('find_api_key_by_hash', { context });
      
      const sanitizedHash = InputSanitizer.sanitize(keyHash, { maxLength: 128 });
      const conditions = { 
        key_hash: sanitizedHash,
        revoked: false,
        active: true
      };
      
      const results = await db.select(this.tableName, '*', conditions);
      return results[0] || null;
      
    } catch (error) {
      this.handleError(error, 'findByHash', context);
    }
  }

  async revoke(id, context = {}) {
    try {
      this.auditLog('revoke_api_key', { keyId: id, context });
      
      const validId = QueryValidator.validateUUID(id);
      const updateData = {
        revoked: true,
        revoked_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const conditions = { id: validId };
      const results = await db.update(this.tableName, updateData, conditions);
      
      this.auditLog('api_key_revoked', { keyId: id, context });
      
      return results[0] || null;
      
    } catch (error) {
      this.handleError(error, 'revoke', context);
    }
  }

  async updateLastUsed(id, context = {}) {
    try {
      const validId = QueryValidator.validateUUID(id);
      const updateData = {
        last_used_at: new Date().toISOString(),
        usage_count: db.raw('usage_count + 1'),
        updated_at: new Date().toISOString()
      };
      
      const conditions = { id: validId };
      await db.update(this.tableName, updateData, conditions);
      
      return true;
      
    } catch (error) {
      this.handleError(error, 'updateLastUsed', context);
    }
  }
}

// Export service instances
export const publishersService = new PublishersService();
export const crawlersService = new CrawlersService();
export const transactionsService = new TransactionsService();
export const paymentsService = new PaymentsService();
export const usersService = new UsersService();
export const apiKeysService = new ApiKeysService();

// Export the service classes for extension
export {
  BaseService
};

export default {
  publishers: publishersService,
  crawlers: crawlersService,
  transactions: transactionsService,
  payments: paymentsService,
  users: usersService,
  apiKeys: apiKeysService
};