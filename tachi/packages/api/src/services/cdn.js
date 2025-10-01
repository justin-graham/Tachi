import { createLogger } from '../utils/logger.js';
import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const logger = createLogger();

export class CDNService extends EventEmitter {
  constructor() {
    super();
    this.isInitialized = false;
    this.config = {
      // CDN Provider configuration (Cloudflare, AWS CloudFront, etc.)
      provider: process.env.CDN_PROVIDER || 'cloudflare',
      domain: process.env.CDN_DOMAIN || 'cdn.tachi.app',
      apiKey: process.env.CDN_API_KEY,
      zoneId: process.env.CDN_ZONE_ID,
      
      // Static asset configuration
      staticAssetPaths: [
        'public',
        'assets',
        'uploads'
      ],
      
      // Cache headers and TTL
      cacheHeaders: {
        images: { maxAge: 31536000, staleWhileRevalidate: 86400 }, // 1 year, 1 day SWR
        css: { maxAge: 31536000, staleWhileRevalidate: 3600 }, // 1 year, 1 hour SWR
        js: { maxAge: 31536000, staleWhileRevalidate: 3600 }, // 1 year, 1 hour SWR
        fonts: { maxAge: 31536000, staleWhileRevalidate: 86400 }, // 1 year, 1 day SWR
        html: { maxAge: 3600, staleWhileRevalidate: 300 }, // 1 hour, 5 min SWR
        api: { maxAge: 300, staleWhileRevalidate: 60 } // 5 minutes, 1 min SWR
      },
      
      // Compression settings
      compression: {
        enabled: true,
        gzip: true,
        brotli: true,
        threshold: 1024 // Minimum file size for compression
      },
      
      // Asset optimization
      optimization: {
        minifyCSS: true,
        minifyJS: true,
        optimizeImages: true,
        webpConversion: true,
        lazyLoading: true
      }
    };
    
    this.assets = new Map(); // Asset registry with hashes and URLs
    this.stats = {
      assetsServed: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalBandwidthSaved: 0,
      lastOptimization: null
    };
    
    this.initialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      logger.info('Initializing CDN service...');
      
      // Initialize asset registry
      await this.buildAssetRegistry();
      
      // Set up CDN purge hooks
      this.setupPurgeHooks();
      
      // Configure cache headers middleware
      this.configureCacheHeaders();
      
      this.isInitialized = true;
      this.emit('initialized');
      
      logger.info('CDN service initialized successfully', {
        provider: this.config.provider,
        domain: this.config.domain,
        assetsRegistered: this.assets.size
      });
      
    } catch (error) {
      logger.error('Failed to initialize CDN service:', error);
      throw error;
    }
  }

  async buildAssetRegistry() {
    try {
      const assetDirs = this.config.staticAssetPaths;
      
      for (const dir of assetDirs) {
        const dirPath = path.join(process.cwd(), dir);
        
        try {
          await this.scanDirectory(dirPath, dir);
        } catch (error) {
          // Directory might not exist, continue with others
          logger.warn(`Asset directory not found: ${dirPath}`);
        }
      }
      
      logger.info(`Asset registry built with ${this.assets.size} assets`);
      
    } catch (error) {
      logger.error('Failed to build asset registry:', error);
      throw error;
    }
  }

  async scanDirectory(dirPath, baseDir) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(process.cwd(), fullPath);
        
        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, baseDir);
        } else if (entry.isFile()) {
          await this.registerAsset(fullPath, relativePath);
        }
      }
    } catch (error) {
      logger.error(`Failed to scan directory ${dirPath}:`, error);
    }
  }

  async registerAsset(filePath, relativePath) {
    try {
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath);
      const hash = crypto.createHash('sha256').update(content).digest('hex').substring(0, 8);
      
      const asset = {
        path: relativePath,
        size: stats.size,
        hash,
        lastModified: stats.mtime,
        mimeType: this.getMimeType(filePath),
        cdnUrl: this.generateCDNUrl(relativePath, hash),
        cacheSettings: this.getCacheSettings(filePath)
      };
      
      this.assets.set(relativePath, asset);
      
    } catch (error) {
      logger.error(`Failed to register asset ${relativePath}:`, error);
    }
  }

  generateCDNUrl(assetPath, hash) {
    const filename = path.basename(assetPath);
    const dir = path.dirname(assetPath);
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);
    
    // Include hash in filename for cache busting
    const hashedFilename = `${name}.${hash}${ext}`;
    const cdnPath = path.join(dir, hashedFilename).replace(/\\/g, '/');
    
    return `https://${this.config.domain}/${cdnPath}`;
  }

  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.otf': 'font/otf'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  getCacheSettings(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) {
      return this.config.cacheHeaders.images;
    } else if (ext === '.css') {
      return this.config.cacheHeaders.css;
    } else if (ext === '.js') {
      return this.config.cacheHeaders.js;
    } else if (['.woff', '.woff2', '.ttf', '.otf'].includes(ext)) {
      return this.config.cacheHeaders.fonts;
    } else if (ext === '.html') {
      return this.config.cacheHeaders.html;
    }
    
    return { maxAge: 3600, staleWhileRevalidate: 300 }; // Default: 1 hour
  }

  configureCacheHeaders() {
    // Express middleware for setting cache headers
    this.cacheMiddleware = (req, res, next) => {
      const filePath = req.path;
      const asset = this.assets.get(filePath.substring(1)); // Remove leading slash
      
      if (asset) {
        const { maxAge, staleWhileRevalidate } = asset.cacheSettings;
        
        // Set cache headers
        res.set({
          'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
          'ETag': `"${asset.hash}"`,
          'Last-Modified': asset.lastModified.toUTCString(),
          'Content-Type': asset.mimeType
        });
        
        // Check if client has cached version
        const clientETag = req.get('If-None-Match');
        if (clientETag === `"${asset.hash}"`) {
          this.stats.cacheHits++;
          return res.status(304).end();
        }
        
        this.stats.cacheMisses++;
        this.stats.assetsServed++;
      }
      
      next();
    };
  }

  setupPurgeHooks() {
    // Set up automatic cache purging on asset changes
    this.on('assetUpdated', async (assetPath) => {
      try {
        await this.purgeAsset(assetPath);
        logger.info(`Cache purged for asset: ${assetPath}`);
      } catch (error) {
        logger.error(`Failed to purge cache for ${assetPath}:`, error);
      }
    });
  }

  async purgeAsset(assetPath) {
    if (!this.config.apiKey || !this.config.zoneId) {
      logger.warn('CDN API credentials not configured, skipping cache purge');
      return;
    }
    
    try {
      const asset = this.assets.get(assetPath);
      if (!asset) {
        logger.warn(`Asset not found in registry: ${assetPath}`);
        return;
      }
      
      // Cloudflare API example (implement based on your CDN provider)
      if (this.config.provider === 'cloudflare') {
        await this.purgeCloudflareCacheAPI([asset.cdnUrl]);
      }
      
      this.emit('cachePurged', { assetPath, cdnUrl: asset.cdnUrl });
      
    } catch (error) {
      logger.error(`Failed to purge CDN cache for ${assetPath}:`, error);
      throw error;
    }
  }

  async purgeCloudflareCacheAPI(urls) {
    // Mock implementation - replace with actual Cloudflare API call
    logger.info('Purging Cloudflare cache for URLs:', urls);
    
    // Example API call:
    // const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${this.config.zoneId}/purge_cache`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.config.apiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ files: urls })
    // });
    
    return { success: true, urls };
  }

  async purgeAllCache() {
    try {
      if (!this.config.apiKey || !this.config.zoneId) {
        logger.warn('CDN API credentials not configured, skipping full cache purge');
        return;
      }
      
      // Cloudflare purge everything API call
      if (this.config.provider === 'cloudflare') {
        logger.info('Purging all Cloudflare cache');
        // const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${this.config.zoneId}/purge_cache`, {
        //   method: 'POST',
        //   headers: {
        //     'Authorization': `Bearer ${this.config.apiKey}`,
        //     'Content-Type': 'application/json'
        //   },
        //   body: JSON.stringify({ purge_everything: true })
        // });
      }
      
      this.emit('allCachePurged');
      logger.info('All CDN cache purged successfully');
      
    } catch (error) {
      logger.error('Failed to purge all CDN cache:', error);
      throw error;
    }
  }

  async optimizeAsset(filePath) {
    try {
      const asset = this.assets.get(filePath);
      if (!asset) {
        throw new Error(`Asset not found: ${filePath}`);
      }
      
      const optimizations = [];
      
      // Image optimization
      if (asset.mimeType.startsWith('image/')) {
        optimizations.push(await this.optimizeImage(filePath));
      }
      
      // CSS/JS minification
      if (asset.mimeType === 'text/css' && this.config.optimization.minifyCSS) {
        optimizations.push(await this.minifyCSS(filePath));
      }
      
      if (asset.mimeType === 'application/javascript' && this.config.optimization.minifyJS) {
        optimizations.push(await this.minifyJS(filePath));
      }
      
      this.emit('assetOptimized', { filePath, optimizations });
      
      return optimizations;
      
    } catch (error) {
      logger.error(`Failed to optimize asset ${filePath}:`, error);
      throw error;
    }
  }

  async optimizeImage(filePath) {
    // Mock image optimization - implement with sharp, imagemin, etc.
    logger.info(`Optimizing image: ${filePath}`);
    
    const originalSize = this.assets.get(filePath)?.size || 0;
    const optimizedSize = Math.floor(originalSize * 0.7); // Simulate 30% reduction
    
    this.stats.totalBandwidthSaved += (originalSize - optimizedSize);
    
    return {
      type: 'image_optimization',
      originalSize,
      optimizedSize,
      savings: originalSize - optimizedSize,
      savingsPercent: Math.round(((originalSize - optimizedSize) / originalSize) * 100)
    };
  }

  async minifyCSS(filePath) {
    // Mock CSS minification
    logger.info(`Minifying CSS: ${filePath}`);
    
    const originalSize = this.assets.get(filePath)?.size || 0;
    const minifiedSize = Math.floor(originalSize * 0.8); // Simulate 20% reduction
    
    return {
      type: 'css_minification',
      originalSize,
      minifiedSize,
      savings: originalSize - minifiedSize
    };
  }

  async minifyJS(filePath) {
    // Mock JS minification
    logger.info(`Minifying JavaScript: ${filePath}`);
    
    const originalSize = this.assets.get(filePath)?.size || 0;
    const minifiedSize = Math.floor(originalSize * 0.75); // Simulate 25% reduction
    
    return {
      type: 'js_minification',
      originalSize,
      minifiedSize,
      savings: originalSize - minifiedSize
    };
  }

  async optimizeAllAssets() {
    try {
      logger.info('Starting full asset optimization...');
      
      const optimizationResults = [];
      
      for (const [filePath, asset] of this.assets) {
        try {
          const result = await this.optimizeAsset(filePath);
          optimizationResults.push({ filePath, result });
        } catch (error) {
          logger.error(`Failed to optimize ${filePath}:`, error);
        }
      }
      
      this.stats.lastOptimization = new Date();
      
      logger.info('Asset optimization completed', {
        assetsProcessed: optimizationResults.length,
        totalBandwidthSaved: this.stats.totalBandwidthSaved
      });
      
      return optimizationResults;
      
    } catch (error) {
      logger.error('Failed to optimize all assets:', error);
      throw error;
    }
  }

  getAssetUrl(relativePath) {
    const asset = this.assets.get(relativePath);
    return asset ? asset.cdnUrl : null;
  }

  getStats() {
    return {
      ...this.stats,
      assetsRegistered: this.assets.size,
      cacheHitRate: this.stats.assetsServed > 0 
        ? Math.round((this.stats.cacheHits / this.stats.assetsServed) * 100) 
        : 0,
      configuration: {
        provider: this.config.provider,
        domain: this.config.domain,
        compressionEnabled: this.config.compression.enabled,
        optimizationEnabled: Object.values(this.config.optimization).some(Boolean)
      }
    };
  }

  getHealth() {
    return {
      status: this.isInitialized ? 'healthy' : 'initializing',
      assetsRegistered: this.assets.size,
      lastOptimization: this.stats.lastOptimization,
      cacheHitRate: this.stats.assetsServed > 0 
        ? Math.round((this.stats.cacheHits / this.stats.assetsServed) * 100) 
        : 0,
      bandwidthSaved: this.stats.totalBandwidthSaved,
      configuration: {
        provider: this.config.provider,
        apiConfigured: !!(this.config.apiKey && this.config.zoneId)
      }
    };
  }
}

// Singleton instance
let cdnServiceInstance = null;

export const getCDNService = () => {
  if (!cdnServiceInstance) {
    cdnServiceInstance = new CDNService();
  }
  return cdnServiceInstance;
};

export default getCDNService();