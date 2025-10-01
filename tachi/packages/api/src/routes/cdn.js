import express from 'express';
import { getCDNService } from '../services/cdn.js';
import { createLogger } from '../utils/logger.js';
import { authenticateToken } from '../middleware/auth-secure.js';
import { apiRateLimit } from '../middleware/rate-limit-auth.js';

const router = express.Router();
const logger = createLogger();
const cdnService = getCDNService();

// Initialize CDN service
cdnService.initialize().catch(error => {
  logger.error('Failed to initialize CDN service:', error);
});

// GET /api/cdn/assets - Get asset registry
router.get('/assets', authenticateToken, async (req, res) => {
  try {
    const { filter, type } = req.query;
    
    let assets = Array.from(cdnService.assets.entries()).map(([path, asset]) => ({
      path,
      ...asset
    }));
    
    // Filter by asset type if specified
    if (type) {
      assets = assets.filter(asset => asset.mimeType.startsWith(type));
    }
    
    // Filter by path pattern if specified
    if (filter) {
      const filterRegex = new RegExp(filter, 'i');
      assets = assets.filter(asset => filterRegex.test(asset.path));
    }
    
    res.json({
      success: true,
      data: {
        assets,
        total: assets.length,
        stats: cdnService.getStats()
      }
    });
    
  } catch (error) {
    logger.error('Failed to get asset registry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve asset registry'
    });
  }
});

// GET /api/cdn/asset/:path - Get specific asset info
router.get('/asset/*', authenticateToken, async (req, res) => {
  try {
    const assetPath = req.params[0];
    const asset = cdnService.assets.get(assetPath);
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        path: assetPath,
        ...asset
      }
    });
    
  } catch (error) {
    logger.error('Failed to get asset info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve asset information'
    });
  }
});

// POST /api/cdn/optimize - Optimize assets
router.post('/optimize', authenticateToken, apiRateLimit, async (req, res) => {
  try {
    const { assetPath, optimizeAll = false } = req.body;
    
    let results;
    
    if (optimizeAll) {
      logger.info('Starting full asset optimization');
      results = await cdnService.optimizeAllAssets();
    } else if (assetPath) {
      logger.info(`Optimizing specific asset: ${assetPath}`);
      results = await cdnService.optimizeAsset(assetPath);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either assetPath or optimizeAll=true must be specified'
      });
    }
    
    res.json({
      success: true,
      data: {
        optimizationResults: results,
        stats: cdnService.getStats()
      }
    });
    
  } catch (error) {
    logger.error('Asset optimization failed:', error);
    res.status(500).json({
      success: false,
      error: 'Asset optimization failed'
    });
  }
});

// POST /api/cdn/purge - Purge CDN cache
router.post('/purge', authenticateToken, apiRateLimit, async (req, res) => {
  try {
    const { assetPath, purgeAll = false } = req.body;
    
    if (purgeAll) {
      logger.info('Purging all CDN cache');
      await cdnService.purgeAllCache();
      
      res.json({
        success: true,
        message: 'All CDN cache purged successfully'
      });
    } else if (assetPath) {
      logger.info(`Purging CDN cache for asset: ${assetPath}`);
      await cdnService.purgeAsset(assetPath);
      
      res.json({
        success: true,
        message: `CDN cache purged for asset: ${assetPath}`
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either assetPath or purgeAll=true must be specified'
      });
    }
    
  } catch (error) {
    logger.error('CDN cache purge failed:', error);
    res.status(500).json({
      success: false,
      error: 'CDN cache purge failed'
    });
  }
});

// POST /api/cdn/rebuild-registry - Rebuild asset registry
router.post('/rebuild-registry', authenticateToken, async (req, res) => {
  try {
    logger.info('Rebuilding CDN asset registry');
    
    await cdnService.buildAssetRegistry();
    
    res.json({
      success: true,
      message: 'Asset registry rebuilt successfully',
      data: {
        assetsRegistered: cdnService.assets.size,
        stats: cdnService.getStats()
      }
    });
    
  } catch (error) {
    logger.error('Failed to rebuild asset registry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rebuild asset registry'
    });
  }
});

// GET /api/cdn/url/:path - Get CDN URL for asset
router.get('/url/*', async (req, res) => {
  try {
    const assetPath = req.params[0];
    const cdnUrl = cdnService.getAssetUrl(assetPath);
    
    if (!cdnUrl) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found or CDN URL not available'
      });
    }
    
    res.json({
      success: true,
      data: {
        assetPath,
        cdnUrl,
        fallbackUrl: `/${assetPath}` // Local fallback
      }
    });
    
  } catch (error) {
    logger.error('Failed to get CDN URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve CDN URL'
    });
  }
});

// GET /api/cdn/stats - Get CDN statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = cdnService.getStats();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    logger.error('Failed to get CDN stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve CDN statistics'
    });
  }
});

// GET /api/cdn/health - Get CDN service health
router.get('/health', async (req, res) => {
  try {
    const health = cdnService.getHealth();
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health
    });
    
  } catch (error) {
    logger.error('Failed to get CDN health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve CDN health status'
    });
  }
});

// GET /api/cdn/config - Get CDN configuration (admin only)
router.get('/config', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin (implement based on your auth system)
    // const user = req.user;
    // if (!user.isAdmin) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Admin access required'
    //   });
    // }
    
    const config = {
      provider: cdnService.config.provider,
      domain: cdnService.config.domain,
      cacheHeaders: cdnService.config.cacheHeaders,
      compression: cdnService.config.compression,
      optimization: cdnService.config.optimization,
      staticAssetPaths: cdnService.config.staticAssetPaths
    };
    
    res.json({
      success: true,
      data: config
    });
    
  } catch (error) {
    logger.error('Failed to get CDN config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve CDN configuration'
    });
  }
});

// Middleware to serve static assets with CDN headers
export const cdnMiddleware = (req, res, next) => {
  // Apply CDN cache middleware if available
  if (cdnService.cacheMiddleware) {
    cdnService.cacheMiddleware(req, res, next);
  } else {
    next();
  }
};

export default router;