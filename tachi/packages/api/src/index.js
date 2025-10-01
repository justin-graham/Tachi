import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authenticateToken } from './middleware/auth-secure.js';
import { sanitizeInput, validateCSP } from './middleware/validation.js';
import { apiRateLimit } from './middleware/rate-limit-auth.js';

// Route imports
import publisherRoutes from './routes/publishers-simple.js';
import crawlerRoutes from './routes/crawlers-simple.js';
import contentRoutes from './routes/content-simple.js';
import contentProtectionRoutes from './routes/content-protection-status.js';
import paymentRoutes from './routes/payments.js';
import databaseAdminRoutes from './routes/database-admin.js';
import monitoringRoutes from './routes/monitoring.js';
import authRoutes from './routes/auth-secure.js';
import apiKeyRoutes from './routes/api-keys.js';
import publisherVerificationRoutes from './routes/publisher-verification.js';
import cdnRoutes, { cdnMiddleware } from './routes/cdn.js';
import loadBalancerRoutes from './routes/load-balancer.js';
import { loadBalancerMiddleware } from './middleware/load-balancer.js';
import performanceRoutes from './routes/performance.js';
import usageControlRoutes from './routes/usage-control.js';
import licenseValidationRoutes from './routes/license-validation.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });


const app = express();
const PORT = process.env.PORT || 3001;
const logger = createLogger();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tachi.app', 'https://dashboard.tachi.app']
    : ['http://localhost:3003', 'http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Special rate limiting for crawl endpoints
const crawlLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 crawl requests per minute
  message: 'Crawl rate limit exceeded, please slow down your requests.'
});

// Body parsing middleware (special handling for Stripe webhooks)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Load balancer middleware (applies in production)
app.use(loadBalancerMiddleware);

// CDN cache middleware for static assets
app.use(cdnMiddleware);

// Security validation middleware for all API routes
app.use('/api', sanitizeInput);
app.use('/api', validateCSP);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'Tachi Pay-Per-Crawl API'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/publisher-verification', publisherVerificationRoutes);
app.use('/api/publishers', publisherRoutes);
app.use('/api/crawlers', crawlerRoutes);
app.use('/api/content', crawlLimiter, contentRoutes);
app.use('/api/content-protection', contentProtectionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/database', databaseAdminRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/cdn', cdnRoutes);
app.use('/api/load-balancer', loadBalancerRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/usage-control', usageControlRoutes);
app.use('/api/license', licenseValidationRoutes);

// Legacy crawl endpoint (redirect to new API structure)
app.get('/crawl/:domain/*', authenticateToken, async (req, res) => {
  try {
    const { domain } = req.params;
    const path = req.params[0] || '';
    
    // Redirect to new API structure
    res.status(301).json({
      message: 'This endpoint has been moved to /api/content/:domain/*',
      newEndpoint: `/api/content/${domain}/${path}`,
      documentation: '/api/docs'
    });
  } catch (error) {
    logger.error('Legacy crawl request failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    service: 'Tachi Pay-Per-Crawl API',
    version: '1.0.0',
    description: 'API for publishers to monetize content and crawlers to access premium content',
    endpoints: {
      publishers: {
        register: 'POST /api/publishers/register',
        profile: 'GET /api/publishers/profile/:id',
        directory: 'GET /api/publishers/directory',
        update: 'PUT /api/publishers/profile/:id'
      },
      crawlers: {
        register: 'POST /api/crawlers/register',
        auth: 'POST /api/crawlers/auth',
        profile: 'GET /api/crawlers/profile/:id',
        addCredits: 'POST /api/crawlers/credits/add'
      },
      content: {
        serve: 'GET /api/content/:domain/*',
        pricing: 'GET /api/content/pricing/:domain',
        batch: 'POST /api/content/batch'
      },
      contentProtection: {
        urlSafetyCheck: 'POST /api/content-protection/url-safety-check',
        stats: 'GET /api/content-protection/stats?timeframe=7d',
        systemHealth: 'GET /api/content-protection/system-health',
        config: 'GET /api/content-protection/config'
      },
      payments: {
        createIntent: 'POST /api/payments/create-payment-intent',
        webhook: 'POST /api/payments/webhook',
        history: 'GET /api/payments/history?limit=50&offset=0&status=completed&timeframe=30d',
        balance: 'GET /api/payments/balance?includeAnalytics=true',
        setupPayout: 'POST /api/payments/setup-payout',
        refund: 'POST /api/payments/refund',
        analytics: 'GET /api/payments/analytics?timeframe=30d'
      },
      analytics: {
        crawler: 'GET /api/analytics/crawler/:id?period=7d',
        publisher: 'GET /api/analytics/publisher/:id?period=7d',
        platform: 'GET /api/analytics/platform?period=7d'
      },
      database: {
        health: 'GET /api/database/health',
        performance: 'GET /api/database/performance?timeframe=24h&metric=all',
        slowQueries: 'GET /api/database/slow-queries?limit=50&priority=all',
        maintenance: 'POST /api/database/maintenance',
        backups: 'GET /api/database/backups',
        createBackup: 'POST /api/database/backups',
        dashboard: 'GET /api/database/dashboard'
      },
      monitoring: {
        dashboard: 'GET /api/monitoring/dashboard',
        metrics: 'GET /api/monitoring/metrics?timeframe=24h&component=all',
        alerts: 'GET /api/monitoring/alerts?status=active&severity=all',
        acknowledgeAlert: 'POST /api/monitoring/alerts/:alertId/acknowledge',
        resolveAlert: 'POST /api/monitoring/alerts/:alertId/resolve',
        analytics: 'GET /api/monitoring/analytics?timeframe=24h',
        health: 'GET /api/monitoring/health?includeDiagnostics=false',
        errors: 'GET /api/monitoring/errors?timeframe=24h&severity=all',
        diagnostics: 'POST /api/monitoring/diagnostics',
        status: 'GET /api/monitoring/status'
      },
      cdn: {
        assets: 'GET /api/cdn/assets?filter=pattern&type=image',
        asset: 'GET /api/cdn/asset/:path',
        optimize: 'POST /api/cdn/optimize',
        purge: 'POST /api/cdn/purge',
        rebuildRegistry: 'POST /api/cdn/rebuild-registry',
        url: 'GET /api/cdn/url/:path',
        stats: 'GET /api/cdn/stats',
        health: 'GET /api/cdn/health',
        config: 'GET /api/cdn/config'
      },
      loadBalancer: {
        stats: 'GET /api/load-balancer/stats',
        health: 'GET /api/load-balancer/health',
        servers: 'GET /api/load-balancer/servers',
        healthCheck: 'POST /api/load-balancer/health-check',
        config: 'GET /api/load-balancer/config',
        sessions: 'GET /api/load-balancer/sessions',
        clearSessions: 'POST /api/load-balancer/clear-sessions',
        metrics: 'GET /api/load-balancer/metrics'
      },
      performance: {
        health: 'GET /api/performance/health',
        stats: 'GET /api/performance/stats',
        loadTest: 'POST /api/performance/load-test',
        stressTest: 'POST /api/performance/stress-test',
        tests: 'GET /api/performance/tests?limit=50&offset=0',
        activeTests: 'GET /api/performance/tests/active',
        stopTest: 'POST /api/performance/tests/:testId/stop',
        config: 'GET /api/performance/config',
        systemMetrics: 'GET /api/performance/system-metrics?timeframe=1h',
        customTest: 'POST /api/performance/custom-test'
      },
      usageControl: {
        health: 'GET /api/usage-control/health',
        stats: 'GET /api/usage-control/stats',
        userUsage: 'GET /api/usage-control/user/:userId/usage?timeframe=24h',
        userLimits: 'GET /api/usage-control/user/:userId/limits',
        resetUser: 'POST /api/usage-control/user/:userId/reset',
        activeRequests: 'GET /api/usage-control/active-requests',
        config: 'GET /api/usage-control/config',
        checkRateLimit: 'POST /api/usage-control/check-rate-limit',
        checkQuota: 'POST /api/usage-control/check-quota',
        queueStatus: 'GET /api/usage-control/queue-status',
        metrics: 'GET /api/usage-control/metrics'
      },
      license: {
        health: 'GET /api/license/health',
        stats: 'GET /api/license/stats',
        validate: 'POST /api/license/validate',
        validateFeature: 'POST /api/license/validate-feature',
        userLicense: 'GET /api/license/user/:userAddress',
        userHistory: 'GET /api/license/user/:userAddress/history',
        refresh: 'POST /api/license/refresh/:userAddress',
        types: 'GET /api/license/types',
        config: 'GET /api/license/config',
        chains: 'GET /api/license/chains',
        batchValidate: 'POST /api/license/batch-validate'
      }
    },
    authentication: {
      method: 'Bearer Token',
      header: 'Authorization: Bearer <token>',
      obtain: 'POST /api/crawlers/auth with API key'
    },
    rateLimits: {
      general: '100 requests per 15 minutes',
      crawling: '60 requests per minute for /api/content/*'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    method: req.method,
    path: req.originalUrl,
    available: '/api/docs'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Tachi API Server running on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`📖 API docs: http://localhost:${PORT}/api/docs`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`💳 Payment processing: ${process.env.STRIPE_SECRET_KEY ? 'Enabled' : 'Disabled'}`);
});

export default app;
