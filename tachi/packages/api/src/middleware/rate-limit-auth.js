import rateLimit from 'express-rate-limit';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();

// Enhanced rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again later',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method
    });
    
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Please try again later',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: 15 * 60
    });
  },
  skip: (req) => {
    // Skip rate limiting for successful authentications in development
    return process.env.NODE_ENV === 'development' && req.path === '/auth/verify';
  }
});

// Stricter rate limiting for login attempts
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Only 3 login attempts per 15 minutes
  message: {
    error: 'Too many login attempts',
    message: 'Account temporarily locked. Please try again later',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by IP + email combination for more granular control
    const email = req.body?.email || req.body?.username || 'unknown';
    return `${req.ip}-${email}`;
  },
  handler: (req, res) => {
    const email = req.body?.email || req.body?.username || 'unknown';
    
    logger.warn('Login rate limit exceeded', {
      ip: req.ip,
      email,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      error: 'Too many login attempts',
      message: 'Account temporarily locked. Please try again later',
      code: 'LOGIN_RATE_LIMIT_EXCEEDED',
      retryAfter: 15 * 60
    });
  }
});

// Rate limiting for password reset requests
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 password reset requests per hour
  message: {
    error: 'Too many password reset requests',
    message: 'Please wait before requesting another password reset',
    code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by email address
    const email = req.body?.email || 'unknown';
    return `reset-${email}`;
  },
  handler: (req, res) => {
    const email = req.body?.email || 'unknown';
    
    logger.warn('Password reset rate limit exceeded', {
      email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      error: 'Too many password reset requests',
      message: 'Please wait before requesting another password reset',
      code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
      retryAfter: 60 * 60
    });
  }
});

// Rate limiting for token refresh
export const refreshRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 refresh attempts per minute
  message: {
    error: 'Too many token refresh requests',
    message: 'Please wait before requesting another token refresh',
    code: 'REFRESH_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Token refresh rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      error: 'Too many token refresh requests',
      message: 'Please wait before requesting another token refresh',
      code: 'REFRESH_RATE_LIMIT_EXCEEDED',
      retryAfter: 60
    });
  }
});

// General API rate limiting
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests',
    message: 'API rate limit exceeded',
    code: 'API_RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/status';
  },
  handler: (req, res) => {
    logger.warn('API rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      error: 'Too many requests',
      message: 'API rate limit exceeded',
      code: 'API_RATE_LIMIT_EXCEEDED',
      retryAfter: 15 * 60
    });
  }
});

// Progressive rate limiting based on user behavior
export const createProgressiveRateLimit = (baseMax = 10, windowMs = 15 * 60 * 1000) => {
  const attemptCounts = new Map();
  
  return rateLimit({
    windowMs,
    max: (req) => {
      const key = req.ip;
      const attempts = attemptCounts.get(key) || 0;
      
      // Reduce limit for repeat offenders
      if (attempts > 50) return Math.max(1, baseMax / 4); // 75% reduction
      if (attempts > 20) return Math.max(2, baseMax / 2); // 50% reduction
      if (attempts > 10) return Math.max(5, (baseMax * 3) / 4); // 25% reduction
      
      return baseMax;
    },
    onLimitReached: (req) => {
      const key = req.ip;
      attemptCounts.set(key, (attemptCounts.get(key) || 0) + 1);
      
      logger.warn('Progressive rate limit reached', {
        ip: req.ip,
        attempts: attemptCounts.get(key),
        endpoint: req.path,
        timestamp: new Date().toISOString()
      });
    },
    message: {
      error: 'Rate limit exceeded',
      message: 'Too many requests from this IP',
      code: 'PROGRESSIVE_RATE_LIMIT_EXCEEDED'
    }
  });
};

// Cleanup function to prevent memory leaks
setInterval(() => {
  // This would be handled automatically by Redis in production
  logger.debug('Rate limit cleanup triggered');
}, 60 * 60 * 1000); // Run every hour