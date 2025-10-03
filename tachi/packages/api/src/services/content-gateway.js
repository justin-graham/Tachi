import { createLogger } from '../utils/logger.js';
import { EventEmitter } from 'events';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import crypto from 'crypto';
import { getCacheService } from './cache.js';

const logger = createLogger();

export class ContentGateway extends EventEmitter {
  constructor() {
    super();
    this.isInitialized = false;
    this.config = {
      // Content fetching settings
      maxContentSize: parseInt(process.env.GATEWAY_MAX_CONTENT_SIZE) || 50 * 1024 * 1024, // 50MB
      requestTimeout: parseInt(process.env.GATEWAY_REQUEST_TIMEOUT) || 30000, // 30 seconds
      maxRedirects: parseInt(process.env.GATEWAY_MAX_REDIRECTS) || 5,
      
      // User agent and headers
      userAgent: process.env.GATEWAY_USER_AGENT || 'Tachi Content Gateway/1.0',
      
      // Content protection settings
      allowedMimeTypes: [
        'text/html',
        'text/css',
        'application/javascript',
        'application/json',
        'application/xml',
        'text/xml',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/svg+xml',
        'image/webp',
        'application/pdf',
        'text/plain'
      ],
      
      // Security settings
      maxHeaderSize: parseInt(process.env.GATEWAY_MAX_HEADER_SIZE) || 8192, // 8KB
      sanitizeHtml: process.env.GATEWAY_SANITIZE_HTML !== 'false',
      
      // Rate limiting per domain
      domainRateLimit: {
        requestsPerMinute: parseInt(process.env.GATEWAY_DOMAIN_RATE_LIMIT) || 60,
        burstLimit: parseInt(process.env.GATEWAY_DOMAIN_BURST_LIMIT) || 10
      }
    };
    
    // Content cache and request tracking
    this.cache = getCacheService();
    this.domainRequestCounts = new Map();
    this.activeRequests = new Map();
    
    // Statistics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cachedRequests: 0,
      blockedRequests: 0,
      totalBytesServed: 0,
      averageResponseTime: 0,
      lastReset: new Date()
    };
    
    // Request queue for rate limiting
    this.requestQueues = new Map();
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      logger.info('Initializing content gateway...');
      
      // Initialize cache service
      await this.cache.initialize();
      
      // Set up rate limit cleanup
      this.setupRateLimitCleanup();
      
      this.isInitialized = true;
      this.emit('initialized');
      
      logger.info('Content gateway initialized successfully', {
        maxContentSize: this.config.maxContentSize,
        requestTimeout: this.config.requestTimeout,
        allowedMimeTypes: this.config.allowedMimeTypes.length
      });
      
    } catch (error) {
      logger.error('Failed to initialize content gateway:', error);
      throw error;
    }
  }

  setupRateLimitCleanup() {
    // Clean up rate limit counters every minute
    setInterval(() => {
      const cutoff = Date.now() - 60000; // 1 minute ago
      
      for (const [domain, requests] of this.domainRequestCounts) {
        const filteredRequests = requests.filter(timestamp => timestamp > cutoff);
        
        if (filteredRequests.length === 0) {
          this.domainRequestCounts.delete(domain);
        } else {
          this.domainRequestCounts.set(domain, filteredRequests);
        }
      }
    }, 60000);
  }

  /**
   * Batch fetch multiple URLs for improved performance
   * @param {Array} urls - Array of URLs to fetch
   * @param {Object} options - Fetch options
   * @returns {Promise<Array>} Array of results
   */
  async batchFetchContent(urls, options = {}) {
    const batchSize = options.batchSize || 10;
    const results = [];
    
    // Process URLs in batches to avoid overwhelming target servers
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchPromises = batch.map(url => 
        this.fetchContent(url, options).catch(error => ({
          url,
          error: error.message,
          success: false
        }))
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to be respectful to target servers
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  async fetchContent(url, options = {}) {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    
    this.stats.totalRequests++;
    
    try {
      // Validate and parse URL
      const parsedUrl = new URL(url);
      const domain = parsedUrl.hostname;
      
      // Check rate limits
      await this.checkRateLimit(domain);
      
      // Check cache first with enhanced caching strategy
      const cacheKey = this.generateCacheKey(url, options);
      const cachedContent = await this.getCachedContentWithFallback(cacheKey, url);
      
      if (cachedContent) {
        this.stats.cachedRequests++;
        logger.debug(`Content served from cache: ${url}`);
        return this.parseContent(cachedContent);
      }
      
      // Validate URL security
      this.validateUrlSecurity(parsedUrl);
      
      // Track active request
      this.activeRequests.set(requestId, {
        url,
        startTime,
        domain
      });
      
      // Fetch content
      const content = await this.performHttpRequest(parsedUrl, options);
      
      // Validate content
      this.validateContent(content);
      
      // Cache the content with tiered caching
      await this.cacheContentWithTiering(cacheKey, content, url);
      
      // Update statistics
      this.updateStats(true, Date.now() - startTime, content.body?.length || 0);
      
      // Record rate limit
      this.recordRequest(domain);
      
      logger.info(`Content fetched successfully: ${url}`, {
        responseTime: Date.now() - startTime,
        contentLength: content.body?.length || 0,
        mimeType: content.headers['content-type']
      });
      
      this.emit('contentFetched', {
        url,
        responseTime: Date.now() - startTime,
        contentLength: content.body?.length || 0
      });
      
      return content;
      
    } catch (error) {
      this.updateStats(false, Date.now() - startTime, 0);
      
      logger.error(`Content fetch failed: ${url}`, error);
      
      this.emit('contentFetchFailed', {
        url,
        error: error.message,
        responseTime: Date.now() - startTime
      });
      
      throw error;
      
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  async checkRateLimit(domain) {
    const now = Date.now();
    const requests = this.domainRequestCounts.get(domain) || [];
    
    // Filter requests from the last minute
    const recentRequests = requests.filter(timestamp => timestamp > now - 60000);
    
    // Check rate limit
    if (recentRequests.length >= this.config.domainRateLimit.requestsPerMinute) {
      this.stats.blockedRequests++;
      throw new Error(`Rate limit exceeded for domain: ${domain}`);
    }
    
    // Check burst limit (last 10 seconds)
    const burstRequests = recentRequests.filter(timestamp => timestamp > now - 10000);
    if (burstRequests.length >= this.config.domainRateLimit.burstLimit) {
      this.stats.blockedRequests++;
      throw new Error(`Burst rate limit exceeded for domain: ${domain}`);
    }
  }

  recordRequest(domain) {
    const now = Date.now();
    const requests = this.domainRequestCounts.get(domain) || [];
    requests.push(now);
    this.domainRequestCounts.set(domain, requests);
  }

  validateUrlSecurity(parsedUrl) {
    // Block private IP ranges
    const hostname = parsedUrl.hostname;
    
    // IPv4 private ranges
    const privateIpRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./, // Link-local
      /^224\./ // Multicast
    ];
    
    for (const range of privateIpRanges) {
      if (range.test(hostname)) {
        throw new Error(`Access to private IP range blocked: ${hostname}`);
      }
    }
    
    // Block localhost variations
    if (['localhost', '0.0.0.0'].includes(hostname)) {
      throw new Error(`Access to localhost blocked: ${hostname}`);
    }
    
    // Only allow HTTP and HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error(`Unsupported protocol: ${parsedUrl.protocol}`);
    }
    
    // Block suspicious file extensions
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
    const pathname = parsedUrl.pathname.toLowerCase();
    
    for (const ext of suspiciousExtensions) {
      if (pathname.endsWith(ext)) {
        throw new Error(`Blocked suspicious file extension: ${ext}`);
      }
    }
  }

  async performHttpRequest(parsedUrl, options = {}) {
    const isHttps = parsedUrl.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': this.config.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'close',
        'Upgrade-Insecure-Requests': '1',
        ...options.headers
      },
      timeout: this.config.requestTimeout
    };
    
    return new Promise((resolve, reject) => {
      const request = httpModule.request(requestOptions, (response) => {
        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          const redirectCount = options.redirectCount || 0;
          
          if (redirectCount >= this.config.maxRedirects) {
            reject(new Error('Too many redirects'));
            return;
          }
          
          const redirectUrl = new URL(response.headers.location, parsedUrl);
          this.fetchContent(redirectUrl.toString(), {
            ...options,
            redirectCount: redirectCount + 1
          }).then(resolve).catch(reject);
          return;
        }
        
        // Check response status
        if (response.statusCode < 200 || response.statusCode >= 400) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }
        
        // Validate content type
        const contentType = response.headers['content-type'] || '';
        const mimeType = contentType.split(';')[0].trim();
        
        if (!this.config.allowedMimeTypes.includes(mimeType)) {
          reject(new Error(`Unsupported content type: ${mimeType}`));
          return;
        }
        
        // Collect response data
        const chunks = [];
        let totalLength = 0;
        
        response.on('data', (chunk) => {
          chunks.push(chunk);
          totalLength += chunk.length;
          
          // Check content size limit
          if (totalLength > this.config.maxContentSize) {
            reject(new Error('Content size exceeds maximum limit'));
            return;
          }
        });
        
        response.on('end', () => {
          try {
            const body = Buffer.concat(chunks);
            
            resolve({
              statusCode: response.statusCode,
              headers: response.headers,
              body: body,
              url: parsedUrl.toString(),
              contentType: mimeType,
              contentLength: totalLength
            });
          } catch (error) {
            reject(error);
          }
        });
        
        response.on('error', reject);
      });
      
      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
      
      // Send request body if provided
      if (options.body) {
        request.write(options.body);
      }
      
      request.end();
    });
  }

  validateContent(content) {
    // Additional content validation
    if (!content.body || content.body.length === 0) {
      throw new Error('Empty content received');
    }
    
    // Check for malicious patterns in HTML content
    if (content.contentType === 'text/html' && this.config.sanitizeHtml) {
      const bodyText = content.body.toString('utf8');
      
      // Basic XSS pattern detection
      const xssPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe[^>]*>/gi
      ];
      
      let hasXss = false;
      for (const pattern of xssPatterns) {
        if (pattern.test(bodyText)) {
          hasXss = true;
          break;
        }
      }
      
      if (hasXss) {
        logger.warn(`Potentially malicious content detected: ${content.url}`);
        // Don't throw error, just log warning for now
      }
    }
    
    // Validate headers size
    const headersSize = JSON.stringify(content.headers).length;
    if (headersSize > this.config.maxHeaderSize) {
      throw new Error('Response headers exceed maximum size');
    }
  }

  generateCacheKey(url, options = {}) {
    const keyData = {
      url,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(keyData))
      .digest('hex');
  }

  async cacheContent(cacheKey, content) {
    try {
      const cacheData = {
        statusCode: content.statusCode,
        headers: content.headers,
        body: content.body.toString('base64'),
        url: content.url,
        contentType: content.contentType,
        contentLength: content.contentLength,
        timestamp: Date.now()
      };
      
      // Cache for different durations based on content type
      let ttl = 3600; // 1 hour default
      
      if (content.contentType.startsWith('image/')) {
        ttl = 86400; // 24 hours for images
      } else if (content.contentType === 'text/css') {
        ttl = 43200; // 12 hours for CSS
      } else if (content.contentType === 'application/javascript') {
        ttl = 43200; // 12 hours for JS
      } else if (content.contentType === 'text/html') {
        ttl = 1800; // 30 minutes for HTML
      }
      
      await this.cache.set(cacheKey, cacheData, { ttl });
      
    } catch (error) {
      logger.error('Failed to cache content:', error);
      // Don't throw - caching is optional
    }
  }

  parseContent(cachedData) {
    return {
      statusCode: cachedData.statusCode,
      headers: cachedData.headers,
      body: Buffer.from(cachedData.body, 'base64'),
      url: cachedData.url,
      contentType: cachedData.contentType,
      contentLength: cachedData.contentLength,
      fromCache: true
    };
  }

  updateStats(success, responseTime, contentLength) {
    if (success) {
      this.stats.successfulRequests++;
      this.stats.totalBytesServed += contentLength;
    } else {
      this.stats.failedRequests++;
    }
    
    // Update average response time
    const totalRequests = this.stats.successfulRequests + this.stats.failedRequests;
    this.stats.averageResponseTime = 
      ((this.stats.averageResponseTime * (totalRequests - 1)) + responseTime) / totalRequests;
  }

  /**
   * Enhanced caching with fallback strategies
   */
  async getCachedContentWithFallback(cacheKey, url) {
    try {
      // Try primary cache first
      const cachedContent = await this.cache.get(cacheKey);
      if (cachedContent) return cachedContent;
      
      // Try domain-based cache for similar content
      const domainKey = this.generateDomainCacheKey(url);
      const domainCache = await this.cache.get(domainKey);
      if (domainCache && this.isCacheStillValid(domainCache)) {
        return domainCache;
      }
      
      return null;
    } catch (error) {
      logger.warn('Cache retrieval failed', { url, error: error.message });
      return null;
    }
  }

  /**
   * Tiered caching strategy for better performance
   */
  async cacheContentWithTiering(cacheKey, content, url) {
    try {
      const domain = new URL(url).hostname;
      
      // Cache at multiple levels
      await Promise.allSettled([
        // Main content cache (short TTL for fresh content)
        this.cache.set(cacheKey, content, { ttl: 300 }), // 5 minutes
        
        // Domain cache (longer TTL for static resources)
        this.cache.set(this.generateDomainCacheKey(url), content, { ttl: 3600 }), // 1 hour
        
        // Content type cache (for similar content patterns)
        this.cache.set(`${domain}:${content.headers['content-type']}`, content, { ttl: 1800 }) // 30 minutes
      ]);
    } catch (error) {
      logger.warn('Caching failed', { url, error: error.message });
    }
  }

  generateDomainCacheKey(url) {
    const parsedUrl = new URL(url);
    return `domain:${parsedUrl.hostname}:${crypto.createHash('md5').update(parsedUrl.pathname).digest('hex')}`;
  }

  isCacheStillValid(cachedContent) {
    const cacheAge = Date.now() - (cachedContent.timestamp || 0);
    return cacheAge < 3600000; // 1 hour validity
  }

  generateRequestId() {
    return crypto.randomBytes(8).toString('hex');
  }

  async fetchMultipleUrls(urls, options = {}) {
    const { maxConcurrency = 5, ...fetchOptions } = options;
    
    const results = [];
    const batches = [];
    
    // Split URLs into batches
    for (let i = 0; i < urls.length; i += maxConcurrency) {
      batches.push(urls.slice(i, i + maxConcurrency));
    }
    
    // Process batches sequentially
    for (const batch of batches) {
      const batchPromises = batch.map(async (url) => {
        try {
          const content = await this.fetchContent(url, fetchOptions);
          return { url, success: true, content };
        } catch (error) {
          return { url, success: false, error: error.message };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(result => result.value));
    }
    
    return results;
  }

  getActiveRequests() {
    return Array.from(this.activeRequests.values());
  }

  getDomainStats() {
    const domainStats = new Map();
    
    for (const [domain, requests] of this.domainRequestCounts) {
      const now = Date.now();
      const recentRequests = requests.filter(timestamp => timestamp > now - 300000); // 5 minutes
      
      domainStats.set(domain, {
        requestsLast5Min: recentRequests.length,
        requestsLastMin: requests.filter(timestamp => timestamp > now - 60000).length,
        lastRequest: Math.max(...requests)
      });
    }
    
    return Object.fromEntries(domainStats);
  }

  getStats() {
    return {
      ...this.stats,
      activeRequests: this.activeRequests.size,
      cachedDomains: this.domainRequestCounts.size,
      successRate: this.stats.totalRequests > 0 
        ? Math.round((this.stats.successfulRequests / this.stats.totalRequests) * 100) 
        : 0,
      cacheHitRate: this.stats.totalRequests > 0 
        ? Math.round((this.stats.cachedRequests / this.stats.totalRequests) * 100) 
        : 0,
      averageResponseTime: Math.round(this.stats.averageResponseTime)
    };
  }

  getHealth() {
    const activeRequestCount = this.activeRequests.size;
    const status = activeRequestCount < 100 ? 'healthy' : 'degraded';
    
    return {
      status,
      activeRequests: activeRequestCount,
      totalRequests: this.stats.totalRequests,
      successRate: this.stats.totalRequests > 0 
        ? Math.round((this.stats.successfulRequests / this.stats.totalRequests) * 100) 
        : 0,
      cacheEnabled: this.cache.isInitialized,
      configuration: {
        maxContentSize: this.config.maxContentSize,
        requestTimeout: this.config.requestTimeout,
        allowedMimeTypes: this.config.allowedMimeTypes.length
      }
    };
  }

  async cleanup() {
    // Cancel all active requests
    for (const [requestId] of this.activeRequests) {
      this.activeRequests.delete(requestId);
    }
    
    // Clear rate limit counters
    this.domainRequestCounts.clear();
    
    logger.info('Content gateway cleanup completed');
  }
}

// Singleton instance
let contentGatewayInstance = null;

export const getContentGateway = () => {
  if (!contentGatewayInstance) {
    contentGatewayInstance = new ContentGateway();
  }
  return contentGatewayInstance;
};

export default getContentGateway();