/**
 * Content Serving API - Production Implementation
 * Real content crawling, payment verification, and license validation
 */

import express from 'express';
import { createPublicClient, http, parseAbi } from 'viem';
import { mainnet, polygon, base } from 'viem/chains';
import { authenticateToken } from '../middleware/auth-secure.js';
import { validate, schemas } from '../middleware/validation.js';
import { publishersService, crawlersService, transactionsService } from '../db/services.js';
import { createLogger } from '../utils/logger.js';
import { 
  urlSafetyScanner, 
  contentSanitizer, 
  createLicenseEnforcer 
} from '../services/content-protection.js';
import { getContentGateway } from '../services/content-gateway.js';

const router = express.Router();
const logger = createLogger();

// Initialize content gateway
const contentGateway = getContentGateway();
contentGateway.initialize().catch(error => {
  logger.error('Failed to initialize content gateway:', error);
});

// Blockchain configuration
const CHAINS = {
  mainnet: { chain: mainnet, rpc: process.env.MAINNET_RPC_URL },
  polygon: { chain: polygon, rpc: process.env.POLYGON_RPC_URL },
  base: { chain: base, rpc: process.env.BASE_RPC_URL }
};

const DEFAULT_CHAIN = process.env.DEFAULT_CHAIN || 'base';

// Smart contract addresses (from environment)
const CONTRACT_ADDRESSES = {
  crawlNFT: process.env.CRAWL_NFT_CONTRACT_ADDRESS,
  paymentProcessor: process.env.PAYMENT_PROCESSOR_CONTRACT_ADDRESS
};

// Smart contract ABIs (minimal for needed functions)
const CRAWL_NFT_ABI = parseAbi([
  'function hasLicense(address publisher) external view returns (bool)',
  'function getPublisherTokenId(address publisher) external view returns (uint256)',
  'function getLicenseData(uint256 tokenId) external view returns (address publisher, bool isActive, uint32 mintTimestamp, uint32 lastUpdated)',
  'function ownerOf(uint256 tokenId) external view returns (address)'
]);

const PAYMENT_PROCESSOR_ABI = parseAbi([
  'function getPublisherStats(address publisher) external view returns (uint256 balance, uint256 totalCrawls, uint256 totalFees)',
  'function calculateFees(uint256 amount) external view returns (uint256 protocolFee, uint256 publisherAmount)'
]);

// Create blockchain clients
const createBlockchainClient = (chainName = DEFAULT_CHAIN) => {
  const chainConfig = CHAINS[chainName];
  if (!chainConfig || !chainConfig.rpc) {
    logger.warn(`No RPC URL configured for chain ${chainName}, using demo mode`);
    return null;
  }

  try {
    return createPublicClient({
      chain: chainConfig.chain,
      transport: http(chainConfig.rpc)
    });
  } catch (error) {
    logger.error(`Failed to create blockchain client for ${chainName}:`, error);
    return null;
  }
};

// Content crawling and sanitization
class ContentCrawler {
  constructor() {
    this.timeout = parseInt(process.env.CRAWL_TIMEOUT || '30000');
    this.maxSize = parseInt(process.env.MAX_CONTENT_SIZE || '5242880'); // 5MB
    this.userAgent = 'TachiBot/1.0 (+https://tachi.ai/bot)';
  }

  async crawlUrl(url, options = {}) {
    try {
      logger.info('Starting content crawl', { url, userId: options.userId });

      // Use content gateway for secure fetching
      const content = await contentGateway.fetchContent(url, {
        method: options.method || 'GET',
        headers: {
          'User-Agent': this.userAgent,
          ...options.headers
        }
      });

      return {
        url: content.url,
        statusCode: content.statusCode,
        headers: content.headers,
        body: content.body.toString('utf8'),
        contentType: content.contentType,
        contentLength: content.contentLength,
        fromCache: content.fromCache || false
      };

    } catch (error) {
      logger.error('Content crawl failed', { url, error: error.message });
      throw error;
    }
  }


  sanitizeHeaders(headers) {
    const allowedHeaders = [
      'content-type', 'content-length', 'last-modified', 
      'etag', 'cache-control', 'expires', 'server'
    ];
    
    const sanitized = {};
    for (const [key, value] of Object.entries(headers)) {
      if (allowedHeaders.includes(key.toLowerCase())) {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  sanitizeError(error) {
    if (error.code === 'ENOTFOUND') {
      return 'Domain not found or DNS resolution failed';
    }
    if (error.code === 'ECONNREFUSED') {
      return 'Connection refused by target server';
    }
    if (error.code === 'ETIMEDOUT') {
      return 'Request timeout';
    }
    if (error.response?.status) {
      return `HTTP ${error.response.status}: ${error.response.statusText}`;
    }
    return 'Failed to crawl content';
  }
}

// Blockchain verification service
class BlockchainVerifier {
  constructor() {
    this.client = createBlockchainClient();
    this.crawlNFTAddress = CONTRACT_ADDRESSES.crawlNFT;
    this.paymentProcessorAddress = CONTRACT_ADDRESSES.paymentProcessor;
  }

  async verifyPublisherLicense(publisherAddress) {
    try {
      if (!this.client || !this.crawlNFTAddress) {
        logger.warn('Blockchain client or CrawlNFT contract address not configured');
        return { hasLicense: false, error: 'Blockchain not configured' };
      }

      const hasLicense = await this.client.readContract({
        address: this.crawlNFTAddress,
        abi: CRAWL_NFT_ABI,
        functionName: 'hasLicense',
        args: [publisherAddress]
      });

      if (!hasLicense) {
        return { hasLicense: false };
      }

      const tokenId = await this.client.readContract({
        address: this.crawlNFTAddress,
        abi: CRAWL_NFT_ABI,
        functionName: 'getPublisherTokenId',
        args: [publisherAddress]
      });

      const [publisher, isActive, mintTimestamp, lastUpdated] = await this.client.readContract({
        address: this.crawlNFTAddress,
        abi: CRAWL_NFT_ABI,
        functionName: 'getLicenseData',
        args: [tokenId]
      });

      return {
        hasLicense: true,
        isActive,
        tokenId: tokenId.toString(),
        mintTimestamp: Number(mintTimestamp),
        lastUpdated: Number(lastUpdated),
        publisher
      };

    } catch (error) {
      logger.error('Blockchain license verification failed', {
        publisherAddress,
        error: error.message
      });
      return { hasLicense: false, error: error.message };
    }
  }

  async getPublisherStats(publisherAddress) {
    try {
      if (!this.client || !this.paymentProcessorAddress) {
        logger.warn('Blockchain client or PaymentProcessor contract address not configured');
        return null;
      }

      const [balance, totalCrawls, totalFees] = await this.client.readContract({
        address: this.paymentProcessorAddress,
        abi: PAYMENT_PROCESSOR_ABI,
        functionName: 'getPublisherStats',
        args: [publisherAddress]
      });

      return {
        balance: balance.toString(),
        totalCrawls: Number(totalCrawls),
        totalFees: totalFees.toString()
      };

    } catch (error) {
      logger.error('Failed to get publisher stats from blockchain', {
        publisherAddress,
        error: error.message
      });
      return null;
    }
  }
}

// Initialize services
const contentCrawler = new ContentCrawler();
const blockchainVerifier = new BlockchainVerifier();
const licenseEnforcer = createLicenseEnforcer(blockchainVerifier);

// Get content pricing for a domain (public endpoint)
router.get('/pricing/:domain', validate(schemas.domainParam, 'params'), async (req, res) => {
  try {
    const { domain } = req.params;

    logger.info('Fetching content pricing', { domain });

    // Look up publisher by domain in database
    const publisher = await publishersService.findByDomain(domain, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    if (!publisher) {
      return res.status(404).json({
        error: 'Publisher not found for this domain',
        domain,
        available: false
      });
    }

    // Check if publisher has active blockchain license
    const licenseInfo = await blockchainVerifier.verifyPublisherLicense(publisher.id);
    
    if (!licenseInfo.hasLicense || !licenseInfo.isActive) {
      logger.warn('Publisher license not active', { domain, publisherId: publisher.id });
      // Still return pricing info but mark as potentially unavailable
    }

    // Get publisher stats from blockchain
    const publisherStats = await blockchainVerifier.getPublisherStats(publisher.id);

    res.json({
      domain,
      publisherId: publisher.id,
      publisherName: publisher.name,
      description: publisher.description,
      websiteUrl: publisher.website_url,
      contactEmail: publisher.contact_email,
      pricePerRequest: parseFloat(publisher.price_per_request),
      currency: 'USD',
      rateLimitPerHour: publisher.rate_limit_per_hour,
      termsOfService: publisher.terms_of_service,
      available: publisher.status === 'active' && (licenseInfo.hasLicense ? licenseInfo.isActive : true),
      license: licenseInfo.hasLicense ? {
        tokenId: licenseInfo.tokenId,
        isActive: licenseInfo.isActive,
        mintTimestamp: licenseInfo.mintTimestamp,
        lastUpdated: licenseInfo.lastUpdated
      } : null,
      stats: publisherStats,
      status: publisher.status
    });

  } catch (error) {
    logger.error('Error fetching content pricing:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve content with comprehensive protection and verification
router.get('/:domain/*', validate(schemas.domainParam, 'params'), authenticateToken, async (req, res) => {
  try {
    const { domain } = req.params;
    const path = req.params[0] || '';
    const fullUrl = `https://${domain}/${path}`;
    const startTime = Date.now();

    logger.info('Protected content request received', { 
      url: fullUrl, 
      userId: req.user.id,
      userType: req.user.type,
      ip: req.ip
    });

    // STEP 1: URL Safety Scanning
    const safetyResult = await urlSafetyScanner.scanURL(fullUrl, {
      userId: req.user.id,
      checkRedirects: true
    });

    if (!safetyResult.safe) {
      logger.warn('Unsafe URL blocked', {
        url: fullUrl,
        threats: safetyResult.threats,
        riskScore: safetyResult.riskScore,
        userId: req.user.id
      });

      return res.status(403).json({
        error: 'URL blocked for safety reasons',
        message: 'The requested URL was flagged as potentially unsafe',
        code: 'URL_SAFETY_VIOLATION',
        threats: safetyResult.threats,
        riskScore: safetyResult.riskScore
      });
    }

    if (safetyResult.warnings.length > 0) {
      logger.info('URL safety warnings detected', {
        url: fullUrl,
        warnings: safetyResult.warnings,
        userId: req.user.id
      });
    }

    // STEP 2: Get crawler from database
    const crawler = await crawlersService.findById(req.user.id, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      operation: 'protected_content_access'
    });

    if (!crawler) {
      return res.status(404).json({ 
        error: 'Crawler not found',
        code: 'CRAWLER_NOT_FOUND'
      });
    }

    if (crawler.status !== 'active') {
      return res.status(403).json({ 
        error: 'Crawler account is not active',
        code: 'CRAWLER_INACTIVE'
      });
    }

    // STEP 3: Look up publisher by domain
    const publisher = await publishersService.findByDomain(domain, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      operation: 'protected_content_publisher_lookup'
    });

    if (!publisher) {
      return res.status(404).json({ 
        error: 'Publisher not found for this domain',
        domain,
        code: 'PUBLISHER_NOT_FOUND'
      });
    }

    if (publisher.status !== 'active') {
      return res.status(403).json({ 
        error: 'Publisher is not active',
        domain,
        code: 'PUBLISHER_INACTIVE'
      });
    }

    // STEP 4: Comprehensive License Validation and Access Control
    const licenseValidation = await licenseEnforcer.validateAccess(
      publisher.id,
      crawler.id,
      fullUrl,
      {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user.id,
        clientIP: req.ip
      }
    );

    if (!licenseValidation.allowed) {
      logger.warn('License validation failed', {
        publisherId: publisher.id,
        crawlerId: crawler.id,
        url: fullUrl,
        restrictions: licenseValidation.restrictions,
        userId: req.user.id
      });

      return res.status(403).json({
        error: 'Access denied',
        message: 'License validation failed',
        code: 'LICENSE_VALIDATION_FAILED',
        restrictions: licenseValidation.restrictions,
        license: licenseValidation.license,
        rateLimitStatus: licenseValidation.rateLimitStatus
      });
    }

    // STEP 5: Check crawler credits
    const crawlCost = parseFloat(publisher.price_per_request);
    const crawlerCredits = parseFloat(crawler.credits);

    if (crawlerCredits < crawlCost) {
      return res.status(402).json({
        error: 'Insufficient credits',
        required: crawlCost,
        available: crawlerCredits,
        domain,
        code: 'INSUFFICIENT_CREDITS'
      });
    }

    // STEP 6: Deduct credits from crawler (pre-charge)
    await crawlersService.deductCredits(crawler.id, crawlCost, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      operation: 'protected_content_crawl',
      url: fullUrl
    });

    let refundRequired = false;
    let crawlResult = null;

    try {
      // STEP 7: Enhanced Content Crawling
      crawlResult = await contentCrawler.crawlUrl(fullUrl, {
        userId: req.user.id,
        publisherId: publisher.id,
        safetyResult: safetyResult
      });

      // STEP 8: Content Protection and Sanitization
      if (crawlResult.success && crawlResult.content) {
        const sanitizationResult = contentSanitizer.sanitizeContent(crawlResult.content, {
          contentType: crawlResult.contentType,
          removeSensitiveData: licenseValidation.accessRights.removeSensitiveData || false,
          userId: req.user.id
        });

        if (sanitizationResult.blocked) {
          logger.warn('Content blocked during sanitization', {
            url: fullUrl,
            warnings: sanitizationResult.warnings,
            userId: req.user.id
          });

          refundRequired = true;
          crawlResult.success = false;
          crawlResult.error = 'Content blocked by protection mechanisms';
          crawlResult.protectionWarnings = sanitizationResult.warnings;
        } else {
          crawlResult.content = sanitizationResult.content;
          crawlResult.protectionWarnings = sanitizationResult.warnings;
          crawlResult.sensitiveDataRemoved = sanitizationResult.sensitiveDataRemoved;
        }
      }

    } catch (crawlError) {
      logger.error('Enhanced content crawl failed', {
        url: fullUrl,
        error: crawlError.message,
        userId: req.user.id
      });

      refundRequired = true;
      crawlResult = {
        success: false,
        error: 'Content crawling failed',
        statusCode: 500,
        crawledAt: new Date().toISOString()
      };
    }

    // STEP 9: Handle refund if crawl failed
    if (refundRequired && crawlResult && !crawlResult.success) {
      try {
        await crawlersService.updateCredits(crawler.id, crawlerCredits, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          operation: 'credit_refund',
          reason: 'crawl_failed'
        });
        logger.info('Credits refunded due to failed crawl', {
          crawlerId: crawler.id,
          amount: crawlCost,
          url: fullUrl
        });
      } catch (refundError) {
        logger.error('Failed to refund credits', {
          crawlerId: crawler.id,
          error: refundError.message
        });
      }
    }

    // STEP 10: Record transaction with protection details
    const responseTime = Date.now() - startTime;
    const transactionData = {
      crawler_id: crawler.id,
      publisher_id: publisher.id,
      url: fullUrl,
      amount: refundRequired ? 0 : crawlCost,
      status: crawlResult.success ? 'completed' : 'failed',
      response_size: crawlResult.contentLength || 0,
      response_time: responseTime,
      user_agent: req.get('User-Agent'),
      ip_address: req.ip,
      safety_score: safetyResult.riskScore,
      protection_warnings: JSON.stringify(crawlResult.protectionWarnings || []),
      license_validation: JSON.stringify({
        allowed: licenseValidation.allowed,
        restrictions: licenseValidation.restrictions
      })
    };

    await transactionsService.create(transactionData, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      operation: 'protected_content_transaction'
    });

    // STEP 11: Build comprehensive response
    const response = {
      url: fullUrl,
      domain,
      finalUrl: crawlResult.finalUrl || fullUrl,
      statusCode: crawlResult.statusCode,
      publisher: {
        id: publisher.id,
        name: publisher.name,
        domain: publisher.domain,
        pricePerRequest: crawlCost
      },
      content: crawlResult.content || null,
      metadata: {
        contentType: crawlResult.contentType,
        contentLength: crawlResult.contentLength,
        headers: crawlResult.headers,
        crawledAt: crawlResult.crawledAt,
        success: crawlResult.success,
        responseTime
      },
      protection: {
        urlSafety: {
          safe: safetyResult.safe,
          riskScore: safetyResult.riskScore,
          warnings: safetyResult.warnings,
          threats: safetyResult.threats
        },
        contentSafety: {
          warnings: crawlResult.protectionWarnings || [],
          sensitiveDataRemoved: crawlResult.sensitiveDataRemoved || false
        },
        licenseValidation: {
          allowed: licenseValidation.allowed,
          accessRights: licenseValidation.accessRights,
          rateLimitStatus: licenseValidation.rateLimitStatus
        }
      },
      billing: {
        charged: refundRequired ? 0 : crawlCost,
        refunded: refundRequired,
        remainingCredits: refundRequired ? crawlerCredits : (crawlerCredits - crawlCost)
      },
      license: {
        tokenId: licenseValidation.license?.tokenId,
        isActive: licenseValidation.license?.isActive
      }
    };

    if (!crawlResult.success) {
      response.error = crawlResult.error;
      const statusCode = crawlResult.statusCode >= 400 ? crawlResult.statusCode : 500;
      res.status(statusCode);
    }

    logger.info('Protected content request completed', {
      url: fullUrl,
      success: crawlResult.success,
      charged: response.billing.charged,
      protectionWarnings: (crawlResult.protectionWarnings || []).length,
      responseTime,
      userId: req.user.id
    });

    res.json(response);

  } catch (error) {
    logger.error('Protected content serving error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'CONTENT_SERVING_ERROR',
      message: 'An unexpected error occurred while processing your request'
    });
  }
});

// Protected batch content requests (authenticated)
router.post('/batch', validate(schemas.batchRequest), authenticateToken, async (req, res) => {
  try {
    const { requests } = req.body;
    const startTime = Date.now();

    if (!requests || !Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid requests array',
        code: 'INVALID_BATCH_REQUEST'
      });
    }

    if (requests.length > 25) { // Reduced for better safety scanning performance
      return res.status(400).json({ 
        error: 'Too many requests in batch. Maximum 25 requests allowed.',
        code: 'BATCH_SIZE_EXCEEDED'
      });
    }

    logger.info('Protected batch request received', { 
      requestCount: requests.length, 
      userId: req.user.id,
      ip: req.ip
    });

    // Get crawler from database
    const crawler = await crawlersService.findById(req.user.id, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      operation: 'protected_batch_access'
    });

    if (!crawler) {
      return res.status(404).json({ 
        error: 'Crawler not found',
        code: 'CRAWLER_NOT_FOUND'
      });
    }

    if (crawler.status !== 'active') {
      return res.status(403).json({ 
        error: 'Crawler account is not active',
        code: 'CRAWLER_INACTIVE'
      });
    }

    // Pre-validate all URLs for safety
    const urlValidations = new Map();
    for (const [index, request] of requests.entries()) {
      const { domain, path = '' } = request;
      const fullUrl = `https://${domain}/${path}`;
      
      try {
        const safetyResult = await urlSafetyScanner.scanURL(fullUrl, {
          userId: req.user.id,
          checkRedirects: false // Skip redirect check for batch performance
        });
        urlValidations.set(index, { fullUrl, safetyResult });
      } catch (error) {
        urlValidations.set(index, { 
          fullUrl, 
          safetyResult: { 
            safe: false, 
            threats: ['Safety scan failed'], 
            riskScore: 100 
          }
        });
      }
    }

    // Process each request with protection
    const results = [];
    let totalCost = 0;
    let processedCount = 0;
    let refundsRequired = [];

    for (const [index, request] of requests.entries()) {
      const { domain, path = '' } = request;
      const urlValidation = urlValidations.get(index);
      const fullUrl = urlValidation.fullUrl;
      const safetyResult = urlValidation.safetyResult;

      try {
        // Check URL safety first
        if (!safetyResult.safe) {
          results.push({
            id: index + 1,
            url: fullUrl,
            domain,
            path,
            success: false,
            error: 'URL blocked for safety reasons',
            code: 'URL_SAFETY_VIOLATION',
            threats: safetyResult.threats,
            billing: { charged: 0, success: false },
            protection: {
              urlSafety: {
                safe: false,
                riskScore: safetyResult.riskScore,
                threats: safetyResult.threats
              }
            }
          });
          continue;
        }

        // Look up publisher by domain
        const publisher = await publishersService.findByDomain(domain, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          operation: 'protected_batch_publisher_lookup'
        });

        if (!publisher || publisher.status !== 'active') {
          results.push({
            id: index + 1,
            url: fullUrl,
            domain,
            path,
            success: false,
            error: 'Publisher not found or inactive',
            code: 'PUBLISHER_NOT_FOUND',
            billing: { charged: 0, success: false }
          });
          continue;
        }

        // License validation
        const licenseValidation = await licenseEnforcer.validateAccess(
          publisher.id,
          crawler.id,
          fullUrl,
          {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user.id,
            clientIP: req.ip
          }
        );
        
        if (!licenseValidation.allowed) {
          results.push({
            id: index + 1,
            url: fullUrl,
            domain,
            path,
            success: false,
            error: 'License validation failed',
            code: 'LICENSE_VALIDATION_FAILED',
            restrictions: licenseValidation.restrictions,
            billing: { charged: 0, success: false }
          });
          continue;
        }

        const crawlCost = parseFloat(publisher.price_per_request);
        const currentCredits = parseFloat(crawler.credits) - totalCost;

        // Check if crawler has sufficient credits for this request
        if (currentCredits < crawlCost) {
          results.push({
            id: index + 1,
            url: fullUrl,
            domain,
            path,
            success: false,
            error: 'Insufficient credits for this request',
            code: 'INSUFFICIENT_CREDITS',
            billing: { charged: 0, success: false }
          });
          continue;
        }

        // Pre-charge for this request
        totalCost += crawlCost;
        let itemRefundRequired = false;

        try {
          // Enhanced content crawling
          const crawlResult = await contentCrawler.crawlUrl(fullUrl, {
            userId: req.user.id,
            publisherId: publisher.id,
            safetyResult: safetyResult
          });

          // Content protection and sanitization
          if (crawlResult.success && crawlResult.content) {
            const sanitizationResult = contentSanitizer.sanitizeContent(crawlResult.content, {
              contentType: crawlResult.contentType,
              removeSensitiveData: licenseValidation.accessRights.removeSensitiveData || false,
              userId: req.user.id
            });

            if (sanitizationResult.blocked) {
              itemRefundRequired = true;
              crawlResult.success = false;
              crawlResult.error = 'Content blocked by protection mechanisms';
              crawlResult.protectionWarnings = sanitizationResult.warnings;
            } else {
              crawlResult.content = sanitizationResult.content;
              crawlResult.protectionWarnings = sanitizationResult.warnings;
              crawlResult.sensitiveDataRemoved = sanitizationResult.sensitiveDataRemoved;
            }
          }

          // Record transaction with protection details
          const transactionData = {
            crawler_id: crawler.id,
            publisher_id: publisher.id,
            url: fullUrl,
            amount: itemRefundRequired ? 0 : crawlCost,
            status: crawlResult.success ? 'completed' : 'failed',
            response_size: crawlResult.contentLength || 0,
            response_time: Date.now() - startTime,
            user_agent: req.get('User-Agent'),
            ip_address: req.ip,
            safety_score: safetyResult.riskScore,
            protection_warnings: JSON.stringify(crawlResult.protectionWarnings || []),
            license_validation: JSON.stringify({
              allowed: licenseValidation.allowed,
              restrictions: licenseValidation.restrictions
            })
          };

          await transactionsService.create(transactionData, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            operation: 'protected_batch_transaction'
          });

          if (itemRefundRequired) {
            refundsRequired.push(crawlCost);
            totalCost -= crawlCost; // Remove from total cost
          } else {
            processedCount++;
          }

          results.push({
            id: index + 1,
            url: fullUrl,
            domain,
            path,
            finalUrl: crawlResult.finalUrl || fullUrl,
            statusCode: crawlResult.statusCode,
            content: crawlResult.content || null,
            metadata: {
              contentType: crawlResult.contentType,
              contentLength: crawlResult.contentLength,
              headers: crawlResult.headers,
              crawledAt: crawlResult.crawledAt,
              success: crawlResult.success
            },
            protection: {
              urlSafety: {
                safe: safetyResult.safe,
                riskScore: safetyResult.riskScore,
                warnings: safetyResult.warnings
              },
              contentSafety: {
                warnings: crawlResult.protectionWarnings || [],
                sensitiveDataRemoved: crawlResult.sensitiveDataRemoved || false
              },
              licenseValidation: {
                allowed: licenseValidation.allowed,
                accessRights: licenseValidation.accessRights
              }
            },
            billing: {
              charged: itemRefundRequired ? 0 : crawlCost,
              refunded: itemRefundRequired,
              success: !itemRefundRequired
            },
            error: crawlResult.success ? undefined : crawlResult.error
          });

        } catch (crawlError) {
          logger.error('Batch item crawl failed', {
            index,
            url: fullUrl,
            error: crawlError.message
          });

          // Refund for failed crawl
          refundsRequired.push(crawlCost);
          totalCost -= crawlCost;

          results.push({
            id: index + 1,
            url: fullUrl,
            domain,
            path,
            success: false,
            error: 'Content crawling failed',
            code: 'CRAWL_FAILED',
            billing: { charged: 0, success: false, refunded: true }
          });
        }

      } catch (error) {
        logger.error('Batch request item processing failed', {
          index,
          url: fullUrl,
          error: error.message
        });

        results.push({
          id: index + 1,
          url: fullUrl,
          domain,
          path,
          success: false,
          error: 'Processing failed',
          code: 'PROCESSING_FAILED',
          billing: { charged: 0, success: false }
        });
      }
    }

    // Deduct actual total cost from crawler credits
    if (totalCost > 0) {
      await crawlersService.deductCredits(crawler.id, totalCost, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'protected_batch_crawl',
        requestCount: processedCount
      });
    }

    const remainingCredits = parseFloat(crawler.credits) - totalCost;
    const responseTime = Date.now() - startTime;
    const successCount = results.filter(r => r.metadata?.success).length;
    const protectionBlockedCount = results.filter(r => r.billing?.refunded).length;

    logger.info('Protected batch request completed', {
      requestCount: requests.length,
      processedCount,
      successCount,
      protectionBlockedCount,
      totalCost,
      responseTime,
      userId: req.user.id
    });

    res.json({
      batchId: `protected_batch_${Date.now()}_${req.user.id}`,
      requestCount: requests.length,
      processedCount,
      successCount,
      failedCount: requests.length - successCount,
      protectionBlockedCount,
      results,
      summary: {
        totalCost,
        refundsIssued: refundsRequired.reduce((sum, amount) => sum + amount, 0),
        remainingCredits,
        responseTime,
        averageRiskScore: results.reduce((sum, r) => sum + (r.protection?.urlSafety?.riskScore || 0), 0) / requests.length
      },
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Protected batch request error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'BATCH_PROCESSING_ERROR',
      message: 'An unexpected error occurred while processing the batch request'
    });
  }
});

export default router;
