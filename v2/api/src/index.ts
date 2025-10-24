import {env} from './env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {publishersRouter} from './routes/publishers.js';
import {crawlersRouter} from './routes/crawlers.js';
import {paymentsRouter} from './routes/payments.js';
import {dashboardRouter} from './routes/dashboard.js';
import {rateLimit} from './middleware/rateLimit.js';
import {optionalAuth} from './middleware/auth.js';

const app = express();
const PORT = parseInt(env.PORT);

// Middleware
app.use(helmet());
app.use(cors({origin: env.CORS_ORIGINS?.split(',') || '*'}));
app.use(express.json());

// Rate limiting (applies to all routes)
app.use(rateLimit(60, 60000)); // 60 requests per minute

// Optional auth (attaches user if authenticated)
app.use(optionalAuth);

// Health check
app.get('/health', (_req, res) => {
  res.json({status: 'ok', service: 'Tachi API v2', timestamp: new Date().toISOString()});
});

// Routes
app.use('/api/publishers', publishersRouter);
app.use('/api/crawlers', crawlersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/dashboard', dashboardRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({error: 'Not found'});
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({error: 'Internal server error', message: err.message});
});

app.listen(PORT, () => {
  console.log(`✓ Tachi API v2 listening on port ${PORT}`);
});
