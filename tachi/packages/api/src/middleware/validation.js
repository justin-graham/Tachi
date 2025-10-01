import Joi from 'joi';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();

// Common validation schemas
export const schemas = {
  // User authentication schemas
  email: Joi.string().email().max(255).required(),
  password: Joi.string().min(8).max(128).pattern(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
  ).required().messages({
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  }),
  
  // UUID validation
  uuid: Joi.string().uuid().required(),
  
  // API key validation
  apiKey: Joi.string().pattern(/^[a-zA-Z0-9]{32,64}$/).required(),
  
  // URL validation
  url: Joi.string().uri({ scheme: ['http', 'https'] }).max(2048).required(),
  
  // Domain validation
  domain: Joi.string().hostname().max(255).required(),
  
  // User registration
  registerUser: Joi.object({
    email: Joi.string().email().max(255).required(),
    password: Joi.string().min(8).max(128).pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
    ).required(),
    firstName: Joi.string().min(1).max(50).pattern(/^[a-zA-Z\s]+$/).required(),
    lastName: Joi.string().min(1).max(50).pattern(/^[a-zA-Z\s]+$/).required(),
    type: Joi.string().valid('individual', 'enterprise').required(),
    company: Joi.when('type', {
      is: 'enterprise',
      then: Joi.string().min(1).max(255).required(),
      otherwise: Joi.string().optional()
    }),
    acceptTerms: Joi.boolean().valid(true).required(),
    marketingConsent: Joi.boolean().optional()
  }),
  
  // User login
  loginUser: Joi.object({
    email: Joi.string().email().max(255).required(),
    password: Joi.string().max(128).required(),
    rememberMe: Joi.boolean().optional()
  }),
  
  // Password reset request
  passwordResetRequest: Joi.object({
    email: Joi.string().email().max(255).required()
  }),
  
  // Password reset
  passwordReset: Joi.object({
    token: Joi.string().min(32).max(256).required(),
    newPassword: Joi.string().min(8).max(128).pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
    ).required()
  }),
  
  // Content crawl request
  crawlRequest: Joi.object({
    url: Joi.string().uri({ scheme: ['http', 'https'] }).max(2048).required(),
    crawlType: Joi.string().valid('basic', 'deep', 'archive').default('basic'),
    options: Joi.object({
      followRedirects: Joi.boolean().default(true),
      maxDepth: Joi.number().integer().min(1).max(10).default(1),
      respectRobots: Joi.boolean().default(true),
      userAgent: Joi.string().max(256).optional()
    }).optional()
  }),
  
  // Publisher registration
  publisherRegistration: Joi.object({
    domain: Joi.string().hostname().max(255).required(),
    siteTitle: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000).optional(),
    categories: Joi.array().items(
      Joi.string().valid('news', 'blog', 'academic', 'commercial', 'documentation', 'other')
    ).min(1).max(5).required(),
    pricePerCrawl: Joi.number().positive().precision(4).min(0.0001).max(100).required(),
    currency: Joi.string().valid('USD', 'ETH', 'USDC', 'MATIC').default('USDC'),
    usageRights: Joi.object({
      aiTraining: Joi.boolean().required(),
      commercialUse: Joi.boolean().required(),
      attribution: Joi.boolean().required(),
      derivatives: Joi.boolean().required()
    }).required(),
    termsAccepted: Joi.boolean().valid(true).required()
  }),
  
  // API key generation
  apiKeyGeneration: Joi.object({
    name: Joi.string().min(1).max(100).pattern(/^[a-zA-Z0-9\s\-_]+$/).required(),
    description: Joi.string().max(500).optional(),
    permissions: Joi.array().items(
      Joi.string().valid('read', 'write', 'admin', 'content:read', 'content:write', 'publisher:manage')
    ).optional().default([]),
    expiresIn: Joi.string().pattern(/^\d+[dmy]$/).optional() // 30d, 12m, 1y format
  }),
  
  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().max(50).optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),
  
  // Payment verification
  paymentVerification: Joi.object({
    transactionHash: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required(),
    amount: Joi.string().pattern(/^\d+(\.\d+)?$/).required(),
    currency: Joi.string().valid('ETH', 'USDC', 'MATIC').required(),
    fromAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
    toAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required()
  }),
  
  // Contact form
  contactForm: Joi.object({
    name: Joi.string().min(1).max(100).pattern(/^[a-zA-Z\s]+$/).required(),
    email: Joi.string().email().max(255).required(),
    message: Joi.string().min(10).max(5000).required(),
    subject: Joi.string().max(200).optional(),
    company: Joi.string().max(255).optional() // Honeypot field
  }),

  // Parameter validation schemas
  domainParam: Joi.object({
    domain: Joi.string().hostname().max(255).required()
  }),

  // Crawler registration
  registerCrawler: Joi.object({
    email: Joi.string().email().max(255).optional(),
    companyName: Joi.string().min(1).max(255).optional(),
    type: Joi.string().valid('individual', 'startup', 'enterprise').optional()
  }),

  // Crawler authentication
  authCrawler: Joi.object({
    apiKey: Joi.string().min(5).max(128).required()
  }),

  // Publisher registration
  registerPublisher: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    domain: Joi.string().hostname().max(255).optional(),
    email: Joi.string().email().max(255).optional()
  }),

  // Batch requests
  batchRequest: Joi.object({
    requests: Joi.array().items(
      Joi.object({
        domain: Joi.string().hostname().max(255).required(),
        path: Joi.string().max(2048).optional().default('')
      })
    ).min(1).max(100).required()
  })
};

// Sanitization functions
export const sanitize = {
  string: (value) => {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/[<>]/g, ''); // Basic XSS prevention
  },
  
  email: (value) => {
    if (typeof value !== 'string') return value;
    return value.toLowerCase().trim();
  },
  
  url: (value) => {
    if (typeof value !== 'string') return value;
    try {
      const url = new URL(value.trim());
      return url.href;
    } catch {
      return value;
    }
  },
  
  domain: (value) => {
    if (typeof value !== 'string') return value;
    return value.toLowerCase().trim();
  }
};

// Validation middleware factory
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source];
      
      // Validate the data
      const { error, value } = schema.validate(data, {
        abortEarly: false, // Return all errors
        stripUnknown: true, // Remove unknown fields
        convert: true // Convert strings to appropriate types
      });
      
      if (error) {
        const details = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type
        }));
        
        logger.warn('Validation failed', {
          source,
          errors: details,
          ip: req.ip,
          endpoint: req.path
        });
        
        return res.status(400).json({
          error: 'Validation failed',
          message: 'The request contains invalid data',
          code: 'VALIDATION_ERROR',
          details
        });
      }
      
      // Replace the original data with validated/sanitized data
      req[source] = value;
      
      next();
    } catch (validationError) {
      logger.error('Validation middleware error:', validationError);
      res.status(500).json({
        error: 'Internal validation error',
        code: 'VALIDATION_INTERNAL_ERROR'
      });
    }
  };
};

// Sanitization middleware
export const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize common fields in body
    if (req.body) {
      if (req.body.email) req.body.email = sanitize.email(req.body.email);
      if (req.body.url) req.body.url = sanitize.url(req.body.url);
      if (req.body.domain) req.body.domain = sanitize.domain(req.body.domain);
      
      // Sanitize all string fields
      for (const [key, value] of Object.entries(req.body)) {
        if (typeof value === 'string') {
          req.body[key] = sanitize.string(value);
        }
      }
    }
    
    // Sanitize query parameters
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          req.query[key] = sanitize.string(value);
        }
      }
    }
    
    next();
  } catch (error) {
    logger.error('Sanitization error:', error);
    res.status(500).json({
      error: 'Input sanitization failed',
      code: 'SANITIZATION_ERROR'
    });
  }
};

// Honeypot validation (for forms)
export const validateHoneypot = (honeypotField = 'company') => {
  return (req, res, next) => {
    const honeypotValue = req.body[honeypotField];
    
    if (honeypotValue && honeypotValue.trim() !== '') {
      // Bot detected - silently reject
      logger.warn('Honeypot triggered - bot detected', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        honeypotValue,
        endpoint: req.path
      });
      
      // Return success to avoid revealing the honeypot
      return res.status(200).json({
        success: true,
        message: 'Request processed successfully'
      });
    }
    
    // Remove honeypot field from request
    delete req.body[honeypotField];
    next();
  };
};

// Content Security Policy validation
export const validateCSP = (req, res, next) => {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
};

// File upload validation
export const validateFileUpload = (options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    maxFiles = 5
  } = options;
  
  return (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      return next();
    }
    
    const files = Array.isArray(req.files.file) ? req.files.file : [req.files.file];
    
    if (files.length > maxFiles) {
      return res.status(400).json({
        error: 'Too many files',
        message: `Maximum ${maxFiles} files allowed`,
        code: 'TOO_MANY_FILES'
      });
    }
    
    for (const file of files) {
      if (file.size > maxSize) {
        return res.status(400).json({
          error: 'File too large',
          message: `File size must be less than ${maxSize / 1024 / 1024}MB`,
          code: 'FILE_TOO_LARGE'
        });
      }
      
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          error: 'Invalid file type',
          message: `Allowed types: ${allowedTypes.join(', ')}`,
          code: 'INVALID_FILE_TYPE'
        });
      }
    }
    
    next();
  };
};

export default {
  validate,
  schemas,
  sanitize,
  sanitizeInput,
  validateHoneypot,
  validateCSP,
  validateFileUpload
};