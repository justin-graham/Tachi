import express from 'express';
import { getLicenseValidationService } from '../services/license-validation.js';
import { createLogger } from '../utils/logger.js';
import { authenticateToken } from '../middleware/auth-secure.js';
import { apiRateLimit } from '../middleware/rate-limit-auth.js';

const router = express.Router();
const logger = createLogger();
const licenseValidator = getLicenseValidationService();

// GET /api/license/health - Get license validation service health
router.get('/health', async (req, res) => {
  try {
    const health = licenseValidator.getHealth();
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health
    });
    
  } catch (error) {
    logger.error('Failed to get license validation health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve license validation health status'
    });
  }
});

// GET /api/license/stats - Get service statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Check admin permissions for detailed stats
    const isAdmin = req.user?.isAdmin || false;
    const stats = licenseValidator.getStats();
    
    // Filter sensitive information for non-admin users
    const responseStats = isAdmin ? stats : {
      validationsPerformed: stats.validationsPerformed,
      cacheHitRate: stats.cacheHitRate,
      successRate: stats.successRate,
      availableChains: stats.availableChains.length
    };
    
    res.json({
      success: true,
      data: responseStats
    });
    
  } catch (error) {
    logger.error('Failed to get license validation stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve license validation statistics'
    });
  }
});

// POST /api/license/validate - Validate a license
router.post('/validate', authenticateToken, apiRateLimit, async (req, res) => {
  try {
    const { userAddress, feature, chainName } = req.body;
    
    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: 'User address is required'
      });
    }
    
    // Non-admin users can only validate their own licenses
    if (!req.user.isAdmin && req.user.walletAddress !== userAddress) {
      return res.status(403).json({
        success: false,
        error: 'Can only validate your own license'
      });
    }
    
    const licenseData = await licenseValidator.validateLicense(userAddress, feature, chainName);
    
    res.json({
      success: true,
      data: licenseData
    });
    
  } catch (error) {
    logger.error('License validation failed:', error);
    res.status(500).json({
      success: false,
      error: 'License validation failed',
      message: error.message
    });
  }
});

// POST /api/license/validate-feature - Validate feature access
router.post('/validate-feature', authenticateToken, apiRateLimit, async (req, res) => {
  try {
    const { userAddress, feature, chainName } = req.body;
    
    if (!userAddress || !feature) {
      return res.status(400).json({
        success: false,
        error: 'User address and feature are required'
      });
    }
    
    // Non-admin users can only validate their own feature access
    if (!req.user.isAdmin && req.user.walletAddress !== userAddress) {
      return res.status(403).json({
        success: false,
        error: 'Can only validate your own feature access'
      });
    }
    
    const accessResult = await licenseValidator.validateFeatureAccess(userAddress, feature, chainName);
    
    const statusCode = accessResult.allowed ? 200 : 403;
    
    res.status(statusCode).json({
      success: accessResult.allowed,
      data: accessResult
    });
    
  } catch (error) {
    logger.error('Feature validation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Feature validation failed',
      message: error.message
    });
  }
});

// GET /api/license/user/:userAddress - Get user license information
router.get('/user/:userAddress', authenticateToken, async (req, res) => {
  try {
    const { userAddress } = req.params;
    const { chainName } = req.query;
    
    // Non-admin users can only access their own license info
    if (!req.user.isAdmin && req.user.walletAddress !== userAddress) {
      return res.status(403).json({
        success: false,
        error: 'Can only access your own license information'
      });
    }
    
    const licenseData = await licenseValidator.validateLicense(userAddress, null, chainName);
    
    // Add additional information
    const licenseTypes = licenseValidator.getLicenseTypes();
    const currentTierConfig = licenseTypes.find(tier => tier.name === licenseData.licenseType);
    
    res.json({
      success: true,
      data: {
        license: licenseData,
        tierConfiguration: currentTierConfig,
        availableTiers: licenseTypes,
        upgradeOptions: licenseTypes.filter(tier => tier.priority > (currentTierConfig?.priority || 0))
      }
    });
    
  } catch (error) {
    logger.error('Failed to get user license:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user license information'
    });
  }
});

// GET /api/license/user/:userAddress/history - Get user license history
router.get('/user/:userAddress/history', authenticateToken, async (req, res) => {
  try {
    const { userAddress } = req.params;
    const { chainName } = req.query;
    
    // Non-admin users can only access their own license history
    if (!req.user.isAdmin && req.user.walletAddress !== userAddress) {
      return res.status(403).json({
        success: false,
        error: 'Can only access your own license history'
      });
    }
    
    const history = await licenseValidator.getLicenseHistory(userAddress, chainName);
    
    res.json({
      success: true,
      data: {
        userAddress,
        history,
        totalEntries: history.length
      }
    });
    
  } catch (error) {
    logger.error('Failed to get license history:', error);
    
    if (error.message.includes('not available')) {
      return res.status(404).json({
        success: false,
        error: 'License history not available for this chain'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve license history'
    });
  }
});

// POST /api/license/refresh/:userAddress - Refresh license cache
router.post('/refresh/:userAddress', authenticateToken, apiRateLimit, async (req, res) => {
  try {
    const { userAddress } = req.params;
    const { chainName } = req.body;
    
    // Non-admin users can only refresh their own license cache
    if (!req.user.isAdmin && req.user.walletAddress !== userAddress) {
      return res.status(403).json({
        success: false,
        error: 'Can only refresh your own license cache'
      });
    }
    
    const refreshedLicense = await licenseValidator.refreshLicenseCache(userAddress, chainName);
    
    logger.info(`License cache refreshed for ${userAddress}`, {
      requestedBy: req.user.id,
      chainName
    });
    
    res.json({
      success: true,
      message: 'License cache refreshed successfully',
      data: refreshedLicense
    });
    
  } catch (error) {
    logger.error('Failed to refresh license cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh license cache',
      message: error.message
    });
  }
});

// GET /api/license/types - Get available license types
router.get('/types', async (req, res) => {
  try {
    const licenseTypes = licenseValidator.getLicenseTypes();
    
    res.json({
      success: true,
      data: {
        licenseTypes,
        totalTypes: licenseTypes.length
      }
    });
    
  } catch (error) {
    logger.error('Failed to get license types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve license types'
    });
  }
});

// GET /api/license/config - Get configuration (admin only)
router.get('/config', authenticateToken, async (req, res) => {
  try {
    // Check admin permissions
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const config = {
      chains: Object.entries(licenseValidator.config.chains).map(([name, config]) => ({
        name,
        enabled: config.enabled,
        hasRpc: !!config.rpc
      })),
      defaultChain: licenseValidator.config.defaultChain,
      contracts: licenseValidator.config.contracts,
      validation: licenseValidator.config.validation,
      licenseTypes: licenseValidator.config.licenseTypes
    };
    
    res.json({
      success: true,
      data: config
    });
    
  } catch (error) {
    logger.error('Failed to get license validation config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve license validation configuration'
    });
  }
});

// GET /api/license/chains - Get available blockchain networks
router.get('/chains', async (req, res) => {
  try {
    const chains = Array.from(licenseValidator.clients.keys()).map(chainName => {
      const health = licenseValidator.getHealth();
      return {
        name: chainName,
        connected: true,
        isDefault: chainName === licenseValidator.config.defaultChain
      };
    });
    
    // Add disconnected chains
    const allChainNames = Object.keys(licenseValidator.config.chains);
    const connectedChainNames = Array.from(licenseValidator.clients.keys());
    
    for (const chainName of allChainNames) {
      if (!connectedChainNames.includes(chainName)) {
        chains.push({
          name: chainName,
          connected: false,
          isDefault: chainName === licenseValidator.config.defaultChain
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        chains,
        totalChains: chains.length,
        connectedChains: chains.filter(c => c.connected).length
      }
    });
    
  } catch (error) {
    logger.error('Failed to get blockchain chains:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve blockchain chains'
    });
  }
});

// POST /api/license/batch-validate - Validate multiple licenses
router.post('/batch-validate', authenticateToken, apiRateLimit, async (req, res) => {
  try {
    // Check admin permissions for batch operations
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required for batch validation'
      });
    }
    
    const { userAddresses, feature, chainName } = req.body;
    
    if (!Array.isArray(userAddresses) || userAddresses.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'User addresses array is required'
      });
    }
    
    if (userAddresses.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 100 addresses allowed per batch'
      });
    }
    
    const results = [];
    
    for (const userAddress of userAddresses) {
      try {
        const licenseData = await licenseValidator.validateLicense(userAddress, feature, chainName);
        results.push({
          userAddress,
          success: true,
          data: licenseData
        });
      } catch (error) {
        results.push({
          userAddress,
          success: false,
          error: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: userAddresses.length,
          successful: successCount,
          failed: userAddresses.length - successCount
        }
      }
    });
    
  } catch (error) {
    logger.error('Batch license validation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Batch license validation failed'
    });
  }
});

export default router;