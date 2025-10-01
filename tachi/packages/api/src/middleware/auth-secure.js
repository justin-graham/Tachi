import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();

// Validation schemas
const tokenPayloadSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  type: Joi.string().valid('individual', 'enterprise').required(),
  role: Joi.string().valid('crawler', 'publisher', 'admin').required(),
  sessionId: Joi.string().uuid().required(),
  iat: Joi.number().required(),
  exp: Joi.number().required()
});

const authHeaderSchema = Joi.string().pattern(/^Bearer [A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*$/);

// In-memory session store (use Redis in production)
const activeSessions = new Map();
const blacklistedTokens = new Set();

// Enhanced JWT configuration
const jwtConfig = {
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  algorithm: 'HS256',
  issuer: 'tachi-api',
  audience: 'tachi-users'
};

// Generate cryptographically secure secret if not provided
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret || secret === 'your_super_secret_jwt_key_change_in_production_min_32_chars') {
    logger.error('JWT_SECRET not properly configured! Using fallback (INSECURE for production)');
    return crypto.randomBytes(64).toString('hex');
  }
  
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  
  return secret;
};

const JWT_SECRET = getJwtSecret();
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex');

// Session management
export class SessionManager {
  static createSession(userId, type, role) {
    const sessionId = crypto.randomUUID();
    const session = {
      id: sessionId,
      userId,
      type,
      role,
      createdAt: new Date(),
      lastActivity: new Date(),
      ipAddress: null, // Set by middleware
      userAgent: null  // Set by middleware
    };
    
    activeSessions.set(sessionId, session);
    return session;
  }
  
  static getSession(sessionId) {
    return activeSessions.get(sessionId);
  }
  
  static updateActivity(sessionId, ipAddress, userAgent) {
    const session = activeSessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
      session.ipAddress = ipAddress;
      session.userAgent = userAgent;
    }
  }
  
  static invalidateSession(sessionId) {
    return activeSessions.delete(sessionId);
  }
  
  static invalidateUserSessions(userId) {
    let count = 0;
    for (const [sessionId, session] of activeSessions.entries()) {
      if (session.userId === userId) {
        activeSessions.delete(sessionId);
        count++;
      }
    }
    return count;
  }
  
  static cleanExpiredSessions() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    let cleaned = 0;
    
    for (const [sessionId, session] of activeSessions.entries()) {
      if (now - session.lastActivity > maxAge) {
        activeSessions.delete(sessionId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.info(`Cleaned ${cleaned} expired sessions`);
    }
    
    return cleaned;
  }
}

// Token blacklist management
export class TokenBlacklist {
  static addToken(tokenId, expiresAt) {
    blacklistedTokens.add(tokenId);
    // Auto-remove after expiry (in production, use Redis with TTL)
    setTimeout(() => {
      blacklistedTokens.delete(tokenId);
    }, new Date(expiresAt) - new Date());
  }
  
  static isBlacklisted(tokenId) {
    return blacklistedTokens.has(tokenId);
  }
}

// Enhanced token generation
export const generateTokenPair = (userId, type = 'individual', role = 'crawler', sessionId = null) => {
  try {
    // Input validation
    const userSchema = Joi.object({
      userId: Joi.string().uuid().required(),
      type: Joi.string().valid('individual', 'enterprise').required(),
      role: Joi.string().valid('crawler', 'publisher', 'admin').required()
    });
    
    const { error } = userSchema.validate({ userId, type, role });
    if (error) {
      throw new Error(`Invalid user data: ${error.details[0].message}`);
    }
    
    // Create or use existing session
    const session = sessionId ? 
      SessionManager.getSession(sessionId) : 
      SessionManager.createSession(userId, type, role);
    
    if (!session) {
      throw new Error('Invalid session');
    }
    
    const now = Math.floor(Date.now() / 1000);
    const accessTokenId = crypto.randomUUID();
    const refreshTokenId = crypto.randomUUID();
    
    // Access token payload
    const accessPayload = {
      jti: accessTokenId,
      userId,
      type,
      role,
      sessionId: session.id,
      iat: now,
      exp: now + (15 * 60), // 15 minutes
      iss: jwtConfig.issuer,
      aud: jwtConfig.audience
    };
    
    // Refresh token payload
    const refreshPayload = {
      jti: refreshTokenId,
      userId,
      sessionId: session.id,
      iat: now,
      exp: now + (7 * 24 * 60 * 60), // 7 days
      iss: jwtConfig.issuer,
      aud: jwtConfig.audience,
      type: 'refresh'
    };
    
    const accessToken = jwt.sign(accessPayload, JWT_SECRET, { algorithm: jwtConfig.algorithm });
    const refreshToken = jwt.sign(refreshPayload, REFRESH_SECRET, { algorithm: jwtConfig.algorithm });
    
    logger.info(`Generated token pair for user ${userId} (session: ${session.id})`);
    
    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      tokenType: 'Bearer',
      sessionId: session.id
    };
    
  } catch (error) {
    logger.error('Token generation failed:', error);
    throw new Error('Failed to generate authentication tokens');
  }
};

// Enhanced token authentication
export const authenticateToken = async (req, res, next) => {
  try {
    // Extract and validate authorization header
    const authHeader = req.header('Authorization');
    const { error: headerError } = authHeaderSchema.validate(authHeader);
    
    if (!authHeader || headerError) {
      logger.warn('Authentication failed: Invalid authorization header', { 
        ip: req.ip, 
        userAgent: req.get('User-Agent') 
      });
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'Valid authorization header required',
        code: 'INVALID_AUTH_HEADER'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Verify and decode token
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [jwtConfig.algorithm],
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    });
    
    // Validate token payload structure
    const { error: payloadError } = tokenPayloadSchema.validate(decoded);
    if (payloadError) {
      logger.warn('Authentication failed: Invalid token payload', { 
        error: payloadError.details[0].message,
        ip: req.ip 
      });
      return res.status(401).json({ 
        error: 'Invalid token', 
        code: 'INVALID_TOKEN_PAYLOAD' 
      });
    }
    
    // Check if token is blacklisted
    if (TokenBlacklist.isBlacklisted(decoded.jti)) {
      logger.warn('Authentication failed: Token blacklisted', { 
        tokenId: decoded.jti,
        userId: decoded.userId,
        ip: req.ip 
      });
      return res.status(401).json({ 
        error: 'Token revoked', 
        code: 'TOKEN_BLACKLISTED' 
      });
    }
    
    // Verify session exists and is valid
    const session = SessionManager.getSession(decoded.sessionId);
    if (!session) {
      logger.warn('Authentication failed: Session not found', { 
        sessionId: decoded.sessionId,
        userId: decoded.userId,
        ip: req.ip 
      });
      return res.status(401).json({ 
        error: 'Session invalid', 
        code: 'SESSION_NOT_FOUND' 
      });
    }
    
    // Check for session hijacking
    const currentIp = req.ip;
    const currentUserAgent = req.get('User-Agent');
    
    if (session.ipAddress && session.ipAddress !== currentIp) {
      logger.warn('Potential session hijacking detected', {
        sessionId: session.id,
        userId: decoded.userId,
        originalIp: session.ipAddress,
        currentIp,
        userAgent: currentUserAgent
      });
      // In production, you might want to invalidate the session here
    }
    
    // Update session activity
    SessionManager.updateActivity(decoded.sessionId, currentIp, currentUserAgent);
    
    // Set user context
    req.user = {
      id: decoded.userId,
      type: decoded.type,
      role: decoded.role,
      sessionId: decoded.sessionId,
      tokenId: decoded.jti
    };
    
    req.session = session;
    
    logger.debug(`User authenticated: ${req.user.id} (${req.user.role})`);
    next();
    
  } catch (error) {
    logger.error('Authentication failed:', { 
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    let errorCode = 'AUTH_FAILED';
    let message = 'Authentication failed';
    
    if (error.name === 'TokenExpiredError') {
      errorCode = 'TOKEN_EXPIRED';
      message = 'Token has expired';
    } else if (error.name === 'JsonWebTokenError') {
      errorCode = 'INVALID_TOKEN';
      message = 'Invalid token format';
    }
    
    res.status(401).json({ 
      error: message,
      code: errorCode
    });
  }
};

// Refresh token endpoint
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ 
        error: 'Refresh token required',
        code: 'MISSING_REFRESH_TOKEN'
      });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET, {
      algorithms: [jwtConfig.algorithm],
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    });
    
    if (decoded.type !== 'refresh') {
      return res.status(400).json({ 
        error: 'Invalid token type',
        code: 'INVALID_TOKEN_TYPE'
      });
    }
    
    // Check if refresh token is blacklisted
    if (TokenBlacklist.isBlacklisted(decoded.jti)) {
      return res.status(401).json({ 
        error: 'Refresh token revoked',
        code: 'REFRESH_TOKEN_BLACKLISTED'
      });
    }
    
    // Verify session
    const session = SessionManager.getSession(decoded.sessionId);
    if (!session) {
      return res.status(401).json({ 
        error: 'Session invalid',
        code: 'SESSION_NOT_FOUND'
      });
    }
    
    // Generate new access token
    const tokens = generateTokenPair(
      decoded.userId, 
      session.type, 
      session.role, 
      decoded.sessionId
    );
    
    logger.info(`Access token refreshed for user ${decoded.userId}`);
    
    res.json({
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
      tokenType: tokens.tokenType
    });
    
  } catch (error) {
    logger.error('Token refresh failed:', error);
    
    let errorCode = 'REFRESH_FAILED';
    let message = 'Failed to refresh token';
    
    if (error.name === 'TokenExpiredError') {
      errorCode = 'REFRESH_TOKEN_EXPIRED';
      message = 'Refresh token has expired';
    } else if (error.name === 'JsonWebTokenError') {
      errorCode = 'INVALID_REFRESH_TOKEN';
      message = 'Invalid refresh token';
    }
    
    res.status(401).json({ 
      error: message,
      code: errorCode
    });
  }
};

// Logout endpoint
export const logout = async (req, res) => {
  try {
    const { tokenId, sessionId } = req.user;
    
    // Blacklist current access token
    const decoded = jwt.decode(req.header('Authorization').replace('Bearer ', ''));
    TokenBlacklist.addToken(tokenId, new Date(decoded.exp * 1000));
    
    // Invalidate session
    SessionManager.invalidateSession(sessionId);
    
    logger.info(`User logged out: ${req.user.id} (session: ${sessionId})`);
    
    res.json({ message: 'Logged out successfully' });
    
  } catch (error) {
    logger.error('Logout failed:', error);
    res.status(500).json({ 
      error: 'Logout failed',
      code: 'LOGOUT_FAILED'
    });
  }
};

// Logout all sessions
export const logoutAll = async (req, res) => {
  try {
    const sessionCount = SessionManager.invalidateUserSessions(req.user.id);
    
    logger.info(`All sessions invalidated for user: ${req.user.id} (${sessionCount} sessions)`);
    
    res.json({ 
      message: 'Logged out from all devices',
      sessionsInvalidated: sessionCount
    });
    
  } catch (error) {
    logger.error('Logout all failed:', error);
    res.status(500).json({ 
      error: 'Failed to logout from all devices',
      code: 'LOGOUT_ALL_FAILED'
    });
  }
};

// Cleanup job (run periodically)
export const cleanupSessions = () => {
  setInterval(() => {
    SessionManager.cleanExpiredSessions();
  }, 60 * 60 * 1000); // Run every hour
};

