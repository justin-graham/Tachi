import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authenticateToken } from './middleware/auth.js';

// Route imports
import publisherRoutes from './routes/publishers-simple.js';
import crawlerRoutes from './routes/crawlers-simple.js';
import contentRoutes from './routes/content-simple.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: '/Users/justin/Tachi/Tachi-1/tachi/packages/api/.env' });

// Debug environment loading
console.log('JWT_SECRET loaded:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET value:', process.env.JWT_SECRET?.substring(0, 10) + '...');
console.log('Working directory:', process.cwd());
console.log('Env file path:', path.join(__dirname, '../.env'));

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
app.use('/api/publishers', publisherRoutes);
app.use('/api/crawlers', crawlerRoutes);
app.use('/api/content', crawlLimiter, contentRoutes);

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
      payments: {
        createIntent: 'POST /api/payments/create-payment-intent',
        webhook: 'POST /api/payments/webhook',
        history: 'GET /api/payments/history',
        balance: 'GET /api/payments/balance',
        setupPayout: 'POST /api/payments/setup-payout'
      },
      analytics: {
        crawler: 'GET /api/analytics/crawler/:id?period=7d',
        publisher: 'GET /api/analytics/publisher/:id?period=7d',
        platform: 'GET /api/analytics/platform?period=7d'
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
