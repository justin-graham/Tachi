import { getLicenseValidationService } from '../services/license-validation.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();
const licenseValidator = getLicenseValidationService();

// Initialize license validation service
licenseValidator.initialize().catch(error => {
  logger.error('Failed to initialize license validation service:', error);
});

export const licenseValidationMiddleware = (requiredFeature = null, options = {}) => {
  const {
    chainName = null,
    allowOffline = true,
    strictValidation = false
  } = options;
  
  return async (req, res, next) => {
    try {
      // Extract user address from request
      const userAddress = req.user?.walletAddress || 
                         req.user?.address || 
                         req.headers['x-user-address'] ||
                         req.body?.userAddress;
      
      if (!userAddress) {
        return res.status(400).json({
          success: false,
          error: 'User wallet address required for license validation',
          code: 'MISSING_WALLET_ADDRESS'
        });
      }
      
      // Validate the license
      const licenseData = await licenseValidator.validateLicense(
        userAddress, 
        requiredFeature, 
        chainName
      );
      
      // Check if license is valid
      if (!licenseData.isValid) {
        return res.status(403).json({
          success: false,
          error: 'Invalid or expired license',
          code: 'INVALID_LICENSE',
          data: {
            licenseType: licenseData.licenseType,
            isActive: licenseData.isActive,
            expirationTimestamp: licenseData.expirationTimestamp,
            requiredUpgrade: licenseValidator.getRequiredUpgradeForFeature(requiredFeature)
          }
        });
      }
      
      // Check feature access if required
      if (requiredFeature && !licenseData.featureValid) {
        return res.status(403).json({
          success: false,
          error: `Feature '${requiredFeature}' not available in ${licenseData.licenseType} license`,
          code: 'FEATURE_NOT_AVAILABLE',
          data: {
            licenseType: licenseData.licenseType,
            availableFeatures: licenseData.features,
            requiredFeature,
            requiredUpgrade: licenseValidator.getRequiredUpgradeForFeature(requiredFeature)
          }
        });
      }
      
      // Check if using stale cache in strict mode
      if (strictValidation && licenseData.fromStaleCache) {
        return res.status(503).json({
          success: false,
          error: 'License validation service temporarily unavailable',
          code: 'VALIDATION_SERVICE_UNAVAILABLE'
        });
      }
      
      // Check if using offline mode when not allowed
      if (!allowOffline && licenseData.source === 'offline_mode') {
        return res.status(503).json({
          success: false,
          error: 'Online license validation required',
          code: 'OFFLINE_MODE_NOT_ALLOWED'
        });
      }
      
      // Add license info to request for use in subsequent middleware/routes
      req.license = licenseData;
      req.userTier = licenseData.licenseType;
      
      // Add license headers for client information
      res.set({
        'X-License-Type': licenseData.licenseType,
        'X-License-Valid': licenseData.isValid.toString(),
        'X-License-Source': licenseData.source
      });
      
      if (licenseData.expirationTimestamp) {
        res.set('X-License-Expires', new Date(licenseData.expirationTimestamp * 1000).toISOString());
      }
      
      // Log successful validation
      logger.debug('License validation successful', {
        userAddress,
        licenseType: licenseData.licenseType,
        feature: requiredFeature,
        source: licenseData.source
      });
      
      next();
      
    } catch (error) {
      logger.error('License validation middleware error:', {
        userAddress: req.user?.walletAddress,
        feature: requiredFeature,
        error: error.message
      });
      
      // Handle specific error types
      if (error.message.includes('No blockchain client available')) {
        if (allowOffline) {
          // Try offline mode
          try {
            const offlineLicense = licenseValidator.getOfflineLicense(
              req.user?.walletAddress, 
              requiredFeature
            );
            
            if (offlineLicense.isValid) {
              req.license = offlineLicense;
              req.userTier = offlineLicense.licenseType;
              
              res.set({
                'X-License-Type': offlineLicense.licenseType,
                'X-License-Valid': 'true',
                'X-License-Source': 'offline_mode'
              });
              
              logger.warn('Using offline license validation', {
                userAddress: req.user?.walletAddress,
                feature: requiredFeature
              });
              
              return next();
            }
          } catch (offlineError) {
            logger.error('Offline license validation failed:', offlineError);
          }
        }
        
        return res.status(503).json({
          success: false,
          error: 'License validation service unavailable',
          code: 'VALIDATION_SERVICE_UNAVAILABLE'
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'License validation failed',
        code: 'VALIDATION_ERROR'
      });
    }
  };
};

export const featureAccessMiddleware = (feature, options = {}) => {
  return licenseValidationMiddleware(feature, options);
};

export const tierRequiredMiddleware = (minimumTier, options = {}) => {
  const tierHierarchy = {
    free: 0,
    basic: 1,
    premium: 2,
    enterprise: 3
  };
  
  return async (req, res, next) => {
    try {
      // First validate license
      await new Promise((resolve, reject) => {
        licenseValidationMiddleware(null, options)(req, res, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      
      const userTier = req.license?.licenseType || 'free';
      const userTierLevel = tierHierarchy[userTier] || 0;
      const requiredTierLevel = tierHierarchy[minimumTier] || 0;
      
      if (userTierLevel < requiredTierLevel) {
        return res.status(402).json({
          success: false,
          error: `${minimumTier} tier or higher required`,
          code: 'INSUFFICIENT_TIER',
          data: {
            currentTier: userTier,
            requiredTier: minimumTier,
            upgradeRequired: true
          }
        });
      }
      
      next();
      
    } catch (error) {
      logger.error('Tier requirement middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Tier validation failed',
        code: 'TIER_VALIDATION_ERROR'
      });
    }
  };
};

export const licenseHealthCheckMiddleware = () => {
  return async (req, res, next) => {
    try {
      const health = licenseValidator.getHealth();
      
      // Add health info to response headers
      res.set({
        'X-License-Service-Status': health.status,
        'X-License-Chains-Connected': health.connectedChains.toString()
      });
      
      // If service is unhealthy and strict validation is required, block requests
      if (health.status === 'unhealthy' && !licenseValidator.config.validation.allowOfflineMode) {
        return res.status(503).json({
          success: false,
          error: 'License validation service is currently unavailable',
          code: 'SERVICE_UNHEALTHY'
        });
      }
      
      next();
      
    } catch (error) {
      logger.error('License health check middleware error:', error);
      // Don't block requests on health check errors
      next();
    }
  };
};

export const licenseInfoMiddleware = () => {
  return async (req, res, next) => {
    try {
      const userAddress = req.user?.walletAddress || req.user?.address;
      
      if (userAddress && req.license) {
        // Add additional license information to request
        req.licenseInfo = {
          ...req.license,
          availableTiers: licenseValidator.getLicenseTypes(),
          upgradeOptions: licenseValidator.getLicenseTypes()
            .filter(tier => tier.priority > (req.license.priority || 0))
        };
        
        // Add license statistics to response headers
        const stats = licenseValidator.getStats();
        res.set({
          'X-License-Cache-Hit-Rate': stats.cacheHitRate.toString(),
          'X-License-Validations-Today': stats.validationsPerformed.toString()
        });
      }
      
      next();
      
    } catch (error) {
      logger.error('License info middleware error:', error);
      // Don't block requests on info gathering errors
      next();
    }
  };
};

// Combined middleware for complete license validation
export const fullLicenseValidationMiddleware = (options = {}) => {
  const {
    requiredFeature = null,
    minimumTier = null,
    chainName = null,
    allowOffline = true,
    strictValidation = false,
    includeHealthCheck = true,
    includeInfo = true
  } = options;
  
  const middlewares = [];
  
  if (includeHealthCheck) {
    middlewares.push(licenseHealthCheckMiddleware());
  }
  
  // Main license validation
  if (minimumTier) {
    middlewares.push(tierRequiredMiddleware(minimumTier, { chainName, allowOffline, strictValidation }));
  } else {
    middlewares.push(licenseValidationMiddleware(requiredFeature, { chainName, allowOffline, strictValidation }));
  }
  
  if (includeInfo) {
    middlewares.push(licenseInfoMiddleware());
  }
  
  return middlewares;
};

export default {
  validate: licenseValidationMiddleware,
  feature: featureAccessMiddleware,
  tier: tierRequiredMiddleware,
  health: licenseHealthCheckMiddleware,
  info: licenseInfoMiddleware,
  full: fullLicenseValidationMiddleware
};