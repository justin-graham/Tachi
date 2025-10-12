import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import apiRouter from './modules/index.js';
import { notFoundHandler, errorHandler } from './shared/errors.js';
import { logger } from './shared/logger.js';

const parseOrigins = () => {
  const value = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN;
  if (!value) {
    return ['http://localhost:3000'];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const createApp = () => {
  const app = express();
  const origins = parseOrigins();

  app.use(helmet());
  app.use(cors({
    origin: origins,
    credentials: true
  }));

  app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));

  app.use((req, _res, next) => {
    if (req.originalUrl.startsWith('/api/payments/webhook')) {
      req.rawBody = req.body;
    }
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Tachi Pay-Per-Crawl API',
      timestamp: new Date().toISOString()
    });
  });

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  app.on('error', (error) => {
    logger.error('Express server error', { error });
  });

  return app;
};
