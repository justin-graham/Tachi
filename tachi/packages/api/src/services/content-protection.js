/**
 * Content Protection Service
 * Comprehensive content access control, safety scanning, and license enforcement
 */

import crypto from 'crypto';
import axios from 'axios';
import { createLogger } from '../utils/logger.js';
import { publishersService } from '../db/services.js';

const logger = createLogger();

// Malicious URL patterns and domains
const MALICIOUS_PATTERNS = [
  // Malware domains
  /malware|virus|trojan|spyware|adware|phishing/i,
  // Suspicious file extensions
  /\.(exe|scr|pif|com|bat|cmd|vbs|js|jar|zip|rar)$/i,
  // URL shorteners (potential for abuse)
  /^https?:\/\/(bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly)\/[^\/]+$/i,
  // Base64 encoded content in URLs
  /[A-Za-z0-9+\/]{50,}={0,2}/,
  // Suspicious query parameters
  /[?&](eval|exec|system|shell|cmd|download|script)=/i
];

// Known malicious domains (this would be updated from threat feeds in production)
const BLOCKED_DOMAINS = new Set([
  'malware-example.com',
  'phishing-site.net',
  'suspicious-domain.org'
]);

// Content type allowlist
const ALLOWED_CONTENT_TYPES = [
  'text/html',
  'text/plain',
  'text/xml',
  'application/xml',
  'application/xhtml+xml',
  'application/json',
  'application/ld+json',
  'text/css',
  'application/javascript',
  'text/javascript',
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

// Rate limiting for content requests per publisher/domain
const RATE_LIMITS = new Map();

/**
 * URL Safety Scanner
 */
export class URLSafetyScanner {
  constructor() {
    this.scanCache = new Map();
    this.cacheExpiry = 3600000; // 1 hour
  }

  async scanURL(url, options = {}) {
    const cacheKey = crypto.createHash('sha256').update(url).digest('hex');
    const cached = this.scanCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }

    logger.info('Scanning URL for safety', { url, userId: options.userId });

    const scanResult = {
      url,
      safe: true,
      threats: [],
      warnings: [],
      riskScore: 0,
      scanTime: new Date().toISOString()
    };

    try {
      // Parse URL for basic validation
      const parsedUrl = new URL(url);
      
      // Check protocol
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        scanResult.safe = false;
        scanResult.threats.push('Invalid protocol - only HTTP/HTTPS allowed');
        scanResult.riskScore += 100;
      }

      // Check for private/internal IPs
      if (this.isPrivateIP(parsedUrl.hostname)) {
        scanResult.safe = false;
        scanResult.threats.push('Access to private/internal networks blocked');
        scanResult.riskScore += 100;
      }

      // Check against blocked domains
      if (BLOCKED_DOMAINS.has(parsedUrl.hostname.toLowerCase())) {
        scanResult.safe = false;
        scanResult.threats.push('Domain flagged as malicious');
        scanResult.riskScore += 100;
      }

      // Check for malicious patterns
      for (const pattern of MALICIOUS_PATTERNS) {
        if (pattern.test(url)) {
          scanResult.safe = false;
          scanResult.threats.push('URL contains suspicious patterns');
          scanResult.riskScore += 75;
          break;
        }
      }

      // Domain reputation check
      const reputationScore = await this.checkDomainReputation(parsedUrl.hostname);
      scanResult.riskScore += reputationScore;
      
      if (reputationScore > 50) {
        scanResult.warnings.push('Domain has poor reputation score');
      }

      // URL length check (extremely long URLs can be suspicious)
      if (url.length > 2048) {
        scanResult.warnings.push('Unusually long URL detected');
        scanResult.riskScore += 10;
      }

      // Check for URL redirects (basic)
      if (options.checkRedirects) {
        const redirectCheck = await this.checkRedirects(url);
        scanResult.redirects = redirectCheck.redirects;
        scanResult.finalUrl = redirectCheck.finalUrl;
        
        if (redirectCheck.suspicious) {
          scanResult.warnings.push('Suspicious redirect chain detected');
          scanResult.riskScore += 25;
        }
      }

      // Final safety determination
      scanResult.safe = scanResult.riskScore < 50;

      // Cache result
      this.scanCache.set(cacheKey, {
        result: scanResult,
        timestamp: Date.now()
      });

      logger.info('URL safety scan completed', {
        url,
        safe: scanResult.safe,
        riskScore: scanResult.riskScore,
        threats: scanResult.threats.length
      });

      return scanResult;

    } catch (error) {
      logger.error('URL safety scan failed', { url, error: error.message });
      return {
        ...scanResult,
        safe: false,
        threats: ['Failed to complete safety scan'],
        riskScore: 100,
        error: error.message
      };
    }
  }

  isPrivateIP(hostname) {
    // IPv4 private ranges
    const privateIPv4Patterns = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./, // Link-local
      /^224\./, // Multicast
      /^255\./ // Broadcast
    ];

    // Special hostnames
    const specialHostnames = [
      'localhost',
      '0.0.0.0',
      'broadcasthost'
    ];

    if (specialHostnames.includes(hostname.toLowerCase())) {
      return true;
    }

    return privateIPv4Patterns.some(pattern => pattern.test(hostname));
  }

  async checkDomainReputation(domain) {
    // Simplified reputation check - in production, integrate with threat intelligence APIs
    try {
      // Check domain age and characteristics
      let riskScore = 0;

      // Very new domains are higher risk
      if (domain.length < 4) {
        riskScore += 20;
      }

      // Suspicious TLDs
      const suspiciousTLDs = ['.tk', '.ml', '.cf', '.ga', '.cc', '.ws'];
      if (suspiciousTLDs.some(tld => domain.endsWith(tld))) {
        riskScore += 30;
      }

      // Random-looking domains
      if (/^[a-z0-9]{8,}\./.test(domain)) {
        riskScore += 15;
      }

      return riskScore;
    } catch (error) {
      logger.warn('Domain reputation check failed', { domain, error: error.message });
      return 25; // Default moderate risk
    }
  }

  async checkRedirects(url, maxRedirects = 5) {
    const redirects = [];
    let currentUrl = url;
    let suspicious = false;

    try {
      for (let i = 0; i < maxRedirects; i++) {
        const response = await axios.head(currentUrl, {
          maxRedirects: 0,
          validateStatus: status => status < 400,
          timeout: 10000
        });

        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.location;
          if (!location) break;

          redirects.push({
            from: currentUrl,
            to: location,
            status: response.status
          });

          // Check if redirect goes to different domain
          const fromDomain = new URL(currentUrl).hostname;
          const toDomain = new URL(location, currentUrl).hostname;
          
          if (fromDomain !== toDomain) {
            suspicious = true;
          }

          currentUrl = new URL(location, currentUrl).href;
        } else {
          break;
        }
      }

      return {
        redirects,
        finalUrl: currentUrl,
        suspicious: suspicious || redirects.length > 3
      };

    } catch (error) {
      return {
        redirects,
        finalUrl: currentUrl,
        suspicious: true,
        error: error.message
      };
    }
  }
}

/**
 * License Enforcement Engine
 */
export class LicenseEnforcer {
  constructor(blockchainVerifier) {
    this.blockchainVerifier = blockchainVerifier;
    this.licenseCache = new Map();
    this.cacheExpiry = 300000; // 5 minutes
  }

  async validateAccess(publisherId, crawlerId, url, options = {}) {
    logger.info('Validating license access', {
      publisherId,
      crawlerId,
      url,
      userId: options.userId
    });

    const validation = {
      allowed: false,
      publisher: null,
      license: null,
      restrictions: [],
      accessRights: {},
      rateLimitStatus: null
    };

    try {
      // Get publisher information
      validation.publisher = await publishersService.findById(publisherId, {
        operation: 'license_validation',
        ...options
      });

      if (!validation.publisher) {
        validation.restrictions.push('Publisher not found');
        return validation;
      }

      if (validation.publisher.status !== 'active') {
        validation.restrictions.push('Publisher account is not active');
        return validation;
      }

      // Verify blockchain license
      const cacheKey = `license_${publisherId}`;
      let licenseInfo = this.licenseCache.get(cacheKey);

      if (!licenseInfo || Date.now() - licenseInfo.timestamp > this.cacheExpiry) {
        licenseInfo = {
          data: await this.blockchainVerifier.verifyPublisherLicense(publisherId),
          timestamp: Date.now()
        };
        this.licenseCache.set(cacheKey, licenseInfo);
      }

      validation.license = licenseInfo.data;

      if (!validation.license.hasLicense || !validation.license.isActive) {
        validation.restrictions.push('Publisher does not have an active blockchain license');
        return validation;
      }

      // Parse usage rights
      const usageRights = JSON.parse(validation.publisher.usage_rights || '{}');
      validation.accessRights = usageRights;

      // Check content type restrictions
      if (usageRights.allowedContentTypes) {
        const urlExtension = this.getFileExtension(url);
        if (urlExtension && !usageRights.allowedContentTypes.includes(urlExtension)) {
          validation.restrictions.push(`Content type ${urlExtension} not allowed`);
          return validation;
        }
      }

      // Check rate limiting
      validation.rateLimitStatus = this.checkRateLimit(publisherId, crawlerId);
      if (!validation.rateLimitStatus.allowed) {
        validation.restrictions.push('Rate limit exceeded');
        return validation;
      }

      // Check time-based restrictions
      if (usageRights.timeRestrictions) {
        const timeCheck = this.checkTimeRestrictions(usageRights.timeRestrictions);
        if (!timeCheck.allowed) {
          validation.restrictions.push(timeCheck.reason);
          return validation;
        }
      }

      // Check geographic restrictions (if implemented)
      if (usageRights.geoRestrictions && options.clientIP) {
        const geoCheck = await this.checkGeographicRestrictions(
          usageRights.geoRestrictions, 
          options.clientIP
        );
        if (!geoCheck.allowed) {
          validation.restrictions.push(geoCheck.reason);
          return validation;
        }
      }

      validation.allowed = true;
      
      logger.info('License validation successful', {
        publisherId,
        crawlerId,
        url
      });

      return validation;

    } catch (error) {
      logger.error('License validation failed', {
        publisherId,
        crawlerId,
        error: error.message
      });
      
      validation.restrictions.push('License validation error');
      return validation;
    }
  }

  checkRateLimit(publisherId, crawlerId) {
    const key = `${publisherId}_${crawlerId}`;
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    
    if (!RATE_LIMITS.has(key)) {
      RATE_LIMITS.set(key, {
        requests: [],
        lastCleanup: now
      });
    }

    const rateLimitData = RATE_LIMITS.get(key);
    
    // Clean old requests
    if (now - rateLimitData.lastCleanup > windowMs) {
      rateLimitData.requests = rateLimitData.requests.filter(
        timestamp => now - timestamp < windowMs
      );
      rateLimitData.lastCleanup = now;
    }

    // Check rate limit (default 60 requests per minute)
    const maxRequests = 60;
    const currentRequests = rateLimitData.requests.length;

    if (currentRequests >= maxRequests) {
      return {
        allowed: false,
        currentRequests,
        maxRequests,
        resetTime: new Date(now + windowMs - (now % windowMs))
      };
    }

    // Add current request
    rateLimitData.requests.push(now);

    return {
      allowed: true,
      currentRequests: currentRequests + 1,
      maxRequests,
      remaining: maxRequests - currentRequests - 1
    };
  }

  checkTimeRestrictions(timeRestrictions) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday

    // Check hour restrictions
    if (timeRestrictions.allowedHours) {
      if (!timeRestrictions.allowedHours.includes(currentHour)) {
        return {
          allowed: false,
          reason: `Access not allowed at hour ${currentHour}`
        };
      }
    }

    // Check day restrictions
    if (timeRestrictions.allowedDays) {
      if (!timeRestrictions.allowedDays.includes(currentDay)) {
        return {
          allowed: false,
          reason: `Access not allowed on day ${currentDay}`
        };
      }
    }

    // Check date range restrictions
    if (timeRestrictions.validFrom && new Date(timeRestrictions.validFrom) > now) {
      return {
        allowed: false,
        reason: 'License not yet valid'
      };
    }

    if (timeRestrictions.validUntil && new Date(timeRestrictions.validUntil) < now) {
      return {
        allowed: false,
        reason: 'License has expired'
      };
    }

    return { allowed: true };
  }

  async checkGeographicRestrictions(geoRestrictions, clientIP) {
    // Simplified geo-restriction check
    // In production, integrate with a proper IP geolocation service
    try {
      if (geoRestrictions.blockedCountries && geoRestrictions.blockedCountries.length > 0) {
        // This would require a real geolocation service
        logger.info('Geographic restriction check skipped - service not configured');
      }

      return { allowed: true };
    } catch (error) {
      logger.error('Geographic restriction check failed', { error: error.message });
      return { allowed: true }; // Default to allow on error
    }
  }

  getFileExtension(url) {
    try {
      const pathname = new URL(url).pathname;
      const extension = pathname.split('.').pop().toLowerCase();
      return extension.length <= 4 ? extension : null;
    } catch {
      return null;
    }
  }
}

/**
 * Content Sanitizer and Filter
 */
export class ContentSanitizer {
  constructor() {
    this.sensitivePatterns = [
      // Personal information patterns
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email (partial)
      // API keys and tokens
      /\b[A-Za-z0-9]{32,}\b/g,
      // Private keys
      /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/gi
    ];
  }

  sanitizeContent(content, options = {}) {
    logger.info('Sanitizing content', { 
      contentLength: content?.length || 0,
      userId: options.userId 
    });

    const sanitized = {
      content: content,
      warnings: [],
      blocked: false,
      sensitiveDataRemoved: false,
      contentType: options.contentType || 'unknown',
      size: Buffer.byteLength(content || '', 'utf8')
    };

    try {
      if (!content || typeof content !== 'string') {
        return sanitized;
      }

      // Check content size
      if (sanitized.size > 10 * 1024 * 1024) { // 10MB
        sanitized.blocked = true;
        sanitized.warnings.push('Content exceeds maximum size limit');
        return sanitized;
      }

      // Remove sensitive data if requested
      if (options.removeSensitiveData) {
        let modifiedContent = content;
        let dataRemoved = false;

        for (const pattern of this.sensitivePatterns) {
          const matches = modifiedContent.match(pattern);
          if (matches) {
            modifiedContent = modifiedContent.replace(pattern, '[REDACTED]');
            dataRemoved = true;
          }
        }

        if (dataRemoved) {
          sanitized.content = modifiedContent;
          sanitized.sensitiveDataRemoved = true;
          sanitized.warnings.push('Sensitive data patterns detected and redacted');
        }
      }

      // Content type validation
      if (options.contentType) {
        if (!ALLOWED_CONTENT_TYPES.includes(options.contentType.split(';')[0])) {
          sanitized.blocked = true;
          sanitized.warnings.push(`Content type ${options.contentType} not allowed`);
          return sanitized;
        }
      }

      // Check for malicious content patterns
      const maliciousContentPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /onload\s*=/gi,
        /onerror\s*=/gi
      ];

      for (const pattern of maliciousContentPatterns) {
        if (pattern.test(content)) {
          sanitized.warnings.push('Potentially malicious content detected');
          break;
        }
      }

      logger.info('Content sanitization completed', {
        originalSize: content.length,
        finalSize: sanitized.content.length,
        warnings: sanitized.warnings.length,
        blocked: sanitized.blocked
      });

      return sanitized;

    } catch (error) {
      logger.error('Content sanitization failed', { error: error.message });
      return {
        ...sanitized,
        blocked: true,
        warnings: ['Content sanitization failed']
      };
    }
  }

  validateContentType(contentType, allowedTypes = ALLOWED_CONTENT_TYPES) {
    if (!contentType) {
      return { valid: false, reason: 'No content type specified' };
    }

    const baseType = contentType.split(';')[0].trim().toLowerCase();
    
    if (!allowedTypes.includes(baseType)) {
      return { 
        valid: false, 
        reason: `Content type ${baseType} not in allowlist` 
      };
    }

    return { valid: true };
  }
}

// Export singleton instances
export const urlSafetyScanner = new URLSafetyScanner();
export const contentSanitizer = new ContentSanitizer();

// Factory function for license enforcer (requires blockchain verifier)
export const createLicenseEnforcer = (blockchainVerifier) => {
  return new LicenseEnforcer(blockchainVerifier);
};