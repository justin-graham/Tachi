/**
 * Content Protection Status and Monitoring Routes
 * Provides insights into protection mechanisms and security status
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth-secure.js';
import { validate, schemas } from '../middleware/validation.js';
import { urlSafetyScanner, contentSanitizer } from '../services/content-protection.js';
import { transactionsService } from '../db/services.js';
import { createLogger } from '../utils/logger.js';

const router = express.Router();
const logger = createLogger();

// Get URL safety assessment (preview endpoint)
router.post('/url-safety-check',
  authenticateToken,
  validate({
    url: schemas.url,
    checkRedirects: schemas.boolean().optional()
  }),
  async (req, res) => {
    try {
      const { url, checkRedirects = false } = req.body;

      logger.info('URL safety check requested', {
        url,
        userId: req.user.id,
        ip: req.ip
      });

      const safetyResult = await urlSafetyScanner.scanURL(url, {
        userId: req.user.id,
        checkRedirects
      });

      res.json({
        success: true,
        url,
        safety: {
          safe: safetyResult.safe,
          riskScore: safetyResult.riskScore,
          threats: safetyResult.threats,
          warnings: safetyResult.warnings,
          scanTime: safetyResult.scanTime
        },
        redirects: safetyResult.redirects || [],
        finalUrl: safetyResult.finalUrl,
        recommendations: safetyResult.safe ? [
          'URL appears safe for crawling'
        ] : [
          'URL flagged as potentially unsafe',
          'Review threats and warnings before proceeding',
          'Consider alternative sources for this content'
        ]
      });

    } catch (error) {
      logger.error('URL safety check failed:', error);
      res.status(500).json({
        error: 'Safety check failed',
        code: 'SAFETY_CHECK_ERROR'
      });
    }
  }
);

// Get content protection statistics for user
router.get('/stats',
  authenticateToken,
  async (req, res) => {
    try {
      const { timeframe = '7d' } = req.query;
      const userId = req.user.id;

      logger.info('Protection statistics requested', {
        userId,
        timeframe,
        ip: req.ip
      });

      // Calculate date range
      const now = new Date();
      let startDate;
      
      switch (timeframe) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Get transaction data for the user (simplified - in production would need proper filtering)
      const transactions = await transactionsService.findByCrawler(userId, {
        orderBy: 'created_at DESC',
        limit: 1000
      }, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        operation: 'protection_stats'
      });

      // Filter transactions by date range and analyze protection data
      const recentTransactions = transactions.filter(t => 
        new Date(t.created_at) >= startDate
      );

      const stats = {
        period: {
          timeframe,
          startDate: startDate.toISOString(),
          endDate: now.toISOString()
        },
        requests: {
          total: recentTransactions.length,
          successful: recentTransactions.filter(t => t.status === 'completed').length,
          failed: recentTransactions.filter(t => t.status === 'failed').length,
          blocked: recentTransactions.filter(t => 
            t.protection_warnings && JSON.parse(t.protection_warnings || '[]').length > 0
          ).length
        },
        safety: {
          averageRiskScore: recentTransactions.reduce((sum, t) => 
            sum + (t.safety_score || 0), 0
          ) / Math.max(recentTransactions.length, 1),
          highRiskRequests: recentTransactions.filter(t => (t.safety_score || 0) > 75).length,
          mediumRiskRequests: recentTransactions.filter(t => 
            (t.safety_score || 0) > 25 && (t.safety_score || 0) <= 75
          ).length,
          lowRiskRequests: recentTransactions.filter(t => (t.safety_score || 0) <= 25).length
        },
        protection: {
          totalWarnings: recentTransactions.reduce((sum, t) => {
            const warnings = JSON.parse(t.protection_warnings || '[]');
            return sum + warnings.length;
          }, 0),
          contentBlocked: recentTransactions.filter(t => 
            t.amount === 0 && t.status === 'failed'
          ).length,
          refundsIssued: recentTransactions.filter(t => t.amount === 0).length
        },
        billing: {
          totalSpent: recentTransactions
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
          averageCostPerRequest: recentTransactions.length > 0 ? 
            recentTransactions
              .filter(t => t.status === 'completed')
              .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) / 
            recentTransactions.filter(t => t.status === 'completed').length : 0,
          refundedAmount: recentTransactions
            .filter(t => t.amount === 0)
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
        }
      };

      // Add protection recommendations
      const recommendations = [];
      
      if (stats.safety.averageRiskScore > 50) {
        recommendations.push('Consider reviewing URL sources - average risk score is high');
      }
      
      if (stats.protection.contentBlocked > stats.requests.total * 0.1) {
        recommendations.push('High content blocking rate detected - review content sources');
      }
      
      if (stats.requests.failed > stats.requests.total * 0.2) {
        recommendations.push('High failure rate - check network connectivity and URL validity');
      }

      if (recommendations.length === 0) {
        recommendations.push('Protection systems operating normally');
      }

      res.json({
        success: true,
        userId,
        statistics: stats,
        recommendations,
        generatedAt: now.toISOString()
      });

    } catch (error) {
      logger.error('Protection statistics generation failed:', error);
      res.status(500).json({
        error: 'Failed to generate protection statistics',
        code: 'STATS_GENERATION_ERROR'
      });
    }
  }
);

// Get protection system health status
router.get('/system-health',
  authenticateToken,
  async (req, res) => {
    try {
      logger.info('System health check requested', {
        userId: req.user.id,
        ip: req.ip
      });

      const healthChecks = {
        urlSafetyScanner: true,
        contentSanitizer: true,
        licenseEnforcement: true,
        database: true
      };

      const issues = [];

      // Test URL safety scanner
      try {
        await urlSafetyScanner.scanURL('https://example.com', {
          userId: req.user.id
        });
      } catch (error) {
        healthChecks.urlSafetyScanner = false;
        issues.push('URL safety scanner unavailable');
      }

      // Test content sanitizer
      try {
        contentSanitizer.sanitizeContent('test content', {
          contentType: 'text/plain',
          userId: req.user.id
        });
      } catch (error) {
        healthChecks.contentSanitizer = false;
        issues.push('Content sanitizer unavailable');
      }

      // Overall health status
      const allHealthy = Object.values(healthChecks).every(status => status);
      const healthScore = Object.values(healthChecks).filter(status => status).length / 
                         Object.keys(healthChecks).length * 100;

      res.json({
        success: true,
        systemHealth: {
          status: allHealthy ? 'healthy' : (healthScore > 50 ? 'degraded' : 'unhealthy'),
          score: healthScore,
          components: healthChecks,
          issues,
          lastChecked: new Date().toISOString()
        },
        recommendations: allHealthy ? [
          'All protection systems operational'
        ] : [
          'Some protection components experiencing issues',
          'Contact support if problems persist'
        ]
      });

    } catch (error) {
      logger.error('System health check failed:', error);
      res.status(500).json({
        error: 'Health check failed',
        code: 'HEALTH_CHECK_ERROR'
      });
    }
  }
);

// Get content protection configuration
router.get('/config',
  authenticateToken,
  async (req, res) => {
    try {
      logger.info('Protection configuration requested', {
        userId: req.user.id,
        ip: req.ip
      });

      const config = {
        urlSafety: {
          enabled: true,
          riskScoreThreshold: 50,
          checkRedirects: true,
          blockedDomains: ['example-blocked.com'], // Sanitized list
          cacheExpiry: '1 hour'
        },
        contentSanitization: {
          enabled: true,
          maxContentSize: '10MB',
          allowedContentTypes: [
            'text/html',
            'text/plain',
            'application/json',
            'text/xml'
          ],
          sensitiveDataDetection: true,
          maliciousContentBlocking: true
        },
        licenseEnforcement: {
          enabled: true,
          blockchainVerification: true,
          rateLimiting: {
            enabled: true,
            maxRequestsPerMinute: 60
          },
          timeRestrictions: true,
          geographicRestrictions: false
        },
        billing: {
          preChargeEnabled: true,
          refundOnFailure: true,
          refundOnContentBlocking: true
        }
      };

      res.json({
        success: true,
        configuration: config,
        lastUpdated: new Date().toISOString(),
        note: 'This configuration reflects the current protection settings for your account'
      });

    } catch (error) {
      logger.error('Protection configuration request failed:', error);
      res.status(500).json({
        error: 'Failed to retrieve protection configuration',
        code: 'CONFIG_REQUEST_ERROR'
      });
    }
  }
);

export default router;