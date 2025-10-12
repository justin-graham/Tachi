import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import {publishersRouter} from './routes/publishers.js';
import {crawlersRouter} from './routes/crawlers.js';
import {paymentsRouter} from './routes/payments.js';
import {dashboardRouter} from './routes/dashboard.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({origin: process.env.CORS_ORIGINS?.split(',') || '*'}));
app.use(express.json());

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
