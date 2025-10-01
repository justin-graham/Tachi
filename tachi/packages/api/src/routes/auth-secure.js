import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Joi from 'joi';
import { 
  generateTokenPair, 
  authenticateToken, 
  refreshAccessToken, 
  logout, 
  logoutAll,
  SessionManager 
} from '../middleware/auth-secure.js';
import { 
  authRateLimit, 
  loginRateLimit, 
  passwordResetRateLimit, 
  refreshRateLimit 
} from '../middleware/rate-limit-auth.js';
import { 
  validate, 
  schemas, 
  sanitizeInput, 
  validateHoneypot,
  validateCSP 
} from '../middleware/validation.js';
import { usersService } from '../db/services.js';
import { createLogger } from '../utils/logger.js';

const router = express.Router();
const logger = createLogger();

// Apply security middleware to all auth routes
router.use(validateCSP);
router.use(sanitizeInput);

// User registration endpoint
router.post('/register', 
  authRateLimit,
  validate(schemas.registerUser),
  validateHoneypot('company'),
  async (req, res) => {
    try {
      const { email, password, firstName, lastName, type, company, acceptTerms } = req.body;
      
      // Check if user already exists
      const existingUser = await usersService.findByEmail(email, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'registration_check'
      });
      
      if (existingUser) {
        logger.warn('Registration attempt with existing email', { email, ip: req.ip });
        return res.status(409).json({
          error: 'User already exists',
          message: 'An account with this email already exists',
          code: 'USER_EXISTS'
        });
      }
      
      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      // Create user in database
      const userId = crypto.randomUUID();
      const userData = {
        id: userId,
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        type,
        company: type === 'enterprise' ? company : null,
        email_verified: false,
        verification_token: verificationToken,
        accepted_terms_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const newUser = await usersService.create(userData, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'user_registration'
      });
      
      // Send verification email
      // TODO: Implement email service
      // await sendVerificationEmail(email, verificationToken);
      
      logger.info('User registered successfully', { 
        userId, 
        email, 
        type,
        ip: req.ip 
      });
      
      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        userId,
        emailVerificationRequired: true
      });
      
    } catch (error) {
      logger.error('Registration failed:', error);
      res.status(500).json({
        error: 'Registration failed',
        message: 'An internal error occurred during registration',
        code: 'REGISTRATION_ERROR'
      });
    }
  }
);

// User login endpoint
router.post('/login',
  loginRateLimit,
  validate(schemas.loginUser),
  async (req, res) => {
    try {
      const { email, password, rememberMe } = req.body;
      
      // Find user by email
      const user = await usersService.findByEmail(email.toLowerCase(), {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'login_attempt'
      });
      
      if (!user) {
        logger.warn('Login attempt with non-existent email', { email, ip: req.ip });
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
          code: 'INVALID_CREDENTIALS'
        });
      }
      
      // Check if email is verified
      if (!user.email_verified) {
        logger.warn('Login attempt with unverified email', { email, ip: req.ip });
        return res.status(401).json({
          error: 'Email not verified',
          message: 'Please verify your email before logging in',
          code: 'EMAIL_NOT_VERIFIED'
        });
      }
      
      // Check if account is locked
      if (user.account_locked) {
        logger.warn('Login attempt on locked account', { email, ip: req.ip });
        return res.status(401).json({
          error: 'Account locked',
          message: 'Your account has been temporarily locked due to suspicious activity',
          code: 'ACCOUNT_LOCKED'
        });
      }
      
      // Verify password
      const passwordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!passwordValid) {
        logger.warn('Failed login attempt', { email, ip: req.ip });
        
        // Increment failed login attempts in database
        await usersService.incrementFailedLoginAttempts(user.id, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          operation: 'failed_login'
        });
        
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
          code: 'INVALID_CREDENTIALS'
        });
      }
      
      // Check for suspicious activity (different IP, user agent, etc.)
      const suspiciousActivity = checkSuspiciousActivity(user, req);
      if (suspiciousActivity) {
        logger.warn('Suspicious login activity detected', {
          userId: user.id,
          email,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          suspiciousActivity
        });
        
        // TODO: Send security alert email
        // await sendSecurityAlertEmail(user.email, suspiciousActivity);
      }
      
      // Generate tokens
      const tokens = generateTokenPair(user.id, user.type, user.role || 'crawler');
      
      // Update last login
      await usersService.updateLastLogin(user.id, req.ip, req.get('User-Agent'), {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'successful_login'
      });
      
      // Failed login attempts are cleared in updateLastLogin
      
      logger.info('User logged in successfully', { 
        userId: user.id, 
        email,
        sessionId: tokens.sessionId,
        ip: req.ip 
      });
      
      const response = {
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          type: user.type,
          role: user.role || 'crawler',
          emailVerified: user.email_verified
        },
        ...tokens
      };
      
      // Set secure httpOnly cookie for refresh token if requested
      if (rememberMe) {
        res.cookie('refreshToken', tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }
      
      res.json(response);
      
    } catch (error) {
      logger.error('Login failed:', error);
      res.status(500).json({
        error: 'Login failed',
        message: 'An internal error occurred during login',
        code: 'LOGIN_ERROR'
      });
    }
  }
);

// Token refresh endpoint
router.post('/refresh',
  refreshRateLimit,
  refreshAccessToken
);

// Logout endpoint
router.post('/logout',
  authenticateToken,
  logout
);

// Logout from all devices
router.post('/logout-all',
  authenticateToken,
  logoutAll
);

// Email verification endpoint
router.post('/verify-email',
  authRateLimit,
  validate(Joi.object({
    token: Joi.string().min(32).max(128).required()
  })),
  async (req, res) => {
    try {
      const { token } = req.body;
      
      // Find user by verification token
      const user = await usersService.findByVerificationToken(token, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'email_verification'
      });
      
      if (!user) {
        logger.warn('Email verification attempted with invalid token', { 
          token: token.substring(0, 8) + '...', 
          ip: req.ip 
        });
        return res.status(400).json({
          error: 'Invalid verification token',
          message: 'The verification link is invalid or has expired',
          code: 'INVALID_VERIFICATION_TOKEN'
        });
      }
      
      if (user.email_verified) {
        return res.status(200).json({
          success: true,
          message: 'Email already verified'
        });
      }
      
      // Verify email
      await usersService.verifyEmail(user.id, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'email_verification_complete'
      });
      
      logger.info('Email verified successfully', { 
        userId: user.id, 
        email: user.email,
        ip: req.ip 
      });
      
      res.json({
        success: true,
        message: 'Email verified successfully'
      });
      
    } catch (error) {
      logger.error('Email verification failed:', error);
      res.status(500).json({
        error: 'Email verification failed',
        code: 'EMAIL_VERIFICATION_ERROR'
      });
    }
  }
);

// Password reset request
router.post('/password-reset-request',
  passwordResetRateLimit,
  validate(schemas.passwordResetRequest),
  async (req, res) => {
    try {
      const { email } = req.body;
      
      // Find user by email
      const user = await usersService.findByEmail(email.toLowerCase(), {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'password_reset_request'
      });
      
      // Always return success to prevent email enumeration
      if (!user) {
        logger.warn('Password reset requested for non-existent email', { email, ip: req.ip });
      } else {
        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        
        // Save reset token
        await usersService.saveResetToken(user.id, resetToken, resetTokenExpiry, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          operation: 'password_reset_token_save'
        });
        
        // Send reset email
        // TODO: Implement email service
        // await sendPasswordResetEmail(user.email, resetToken);
        
        logger.info('Password reset email sent', { 
          userId: user.id, 
          email,
          ip: req.ip 
        });
      }
      
      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
      
    } catch (error) {
      logger.error('Password reset request failed:', error);
      res.status(500).json({
        error: 'Password reset request failed',
        code: 'PASSWORD_RESET_REQUEST_ERROR'
      });
    }
  }
);

// Password reset
router.post('/password-reset',
  authRateLimit,
  validate(schemas.passwordReset),
  async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      // Find user by reset token
      const user = await usersService.findByResetToken(token, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'password_reset'
      });
      
      if (!user || new Date(user.reset_token_expires) < new Date()) {
        logger.warn('Password reset attempted with invalid/expired token', { 
          token: token.substring(0, 8) + '...', 
          ip: req.ip 
        });
        return res.status(400).json({
          error: 'Invalid or expired reset token',
          message: 'The password reset link is invalid or has expired',
          code: 'INVALID_RESET_TOKEN'
        });
      }
      
      // Hash new password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      // Update password and clear reset token
      await usersService.updatePassword(user.id, hashedPassword, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'password_reset_complete'
      });
      
      // Invalidate all user sessions for security
      SessionManager.invalidateUserSessions(user.id);
      
      // Send notification email
      // TODO: Implement email service
      // await sendPasswordChangeNotificationEmail(user.email);
      
      logger.info('Password reset completed', { 
        userId: user.id, 
        email: user.email,
        ip: req.ip 
      });
      
      res.json({
        success: true,
        message: 'Password updated successfully. Please log in with your new password.'
      });
      
    } catch (error) {
      logger.error('Password reset failed:', error);
      res.status(500).json({
        error: 'Password reset failed',
        code: 'PASSWORD_RESET_ERROR'
      });
    }
  }
);

// Get current user info
router.get('/me',
  authenticateToken,
  async (req, res) => {
    try {
      // Get full user data from database
      const fullUserData = await usersService.findById(req.user.id, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'get_user_info'
      });
      
      const userData = fullUserData ? {
        id: fullUserData.id,
        email: fullUserData.email,
        firstName: fullUserData.first_name,
        lastName: fullUserData.last_name,
        type: fullUserData.type,
        role: req.user.role,
        emailVerified: fullUserData.email_verified,
        company: fullUserData.company,
        createdAt: fullUserData.created_at,
        lastLoginAt: fullUserData.last_login_at,
        sessionId: req.user.sessionId
      } : {
        id: req.user.id,
        type: req.user.type,
        role: req.user.role,
        sessionId: req.user.sessionId
      };
      
      res.json({
        success: true,
        user: userData,
        session: {
          id: req.session.id,
          createdAt: req.session.createdAt,
          lastActivity: req.session.lastActivity
        }
      });
      
    } catch (error) {
      logger.error('Failed to get user info:', error);
      res.status(500).json({
        error: 'Failed to get user information',
        code: 'USER_INFO_ERROR'
      });
    }
  }
);

// Helper function to check for suspicious activity
function checkSuspiciousActivity(user, req) {
  const suspiciousFactors = [];
  
  // Check for different IP address
  if (user.last_login_ip && user.last_login_ip !== req.ip) {
    suspiciousFactors.push('different_ip');
  }
  
  // Check for different user agent
  const currentUserAgent = req.get('User-Agent');
  if (user.last_user_agent && user.last_user_agent !== currentUserAgent) {
    suspiciousFactors.push('different_user_agent');
  }
  
  // Check for login from new location (would require IP geolocation)
  // suspiciousFactors.push('new_location');
  
  // Check for rapid successive login attempts
  const timeSinceLastLogin = new Date() - new Date(user.last_login_at);
  if (timeSinceLastLogin < 60000) { // Less than 1 minute
    suspiciousFactors.push('rapid_login');
  }
  
  return suspiciousFactors.length > 0 ? suspiciousFactors : null;
}

export default router;