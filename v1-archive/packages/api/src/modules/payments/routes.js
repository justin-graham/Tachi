import { Router } from 'express';
import { asyncHandler, AppError } from '../../shared/errors.js';
import { requireAuth } from '../../shared/middleware/auth.js';
import {
  createPaymentIntent,
  handleStripeWebhook,
  listPayments,
  getCrawlerBalance
} from './service.js';

const router = Router();

router.post('/create-payment-intent', requireAuth, asyncHandler(async (req, res) => {
  if (req.user.role !== 'crawler') {
    throw new AppError('Only crawlers can create payment intents', 403);
  }

  const { amount, currency } = req.body || {};
  const intent = await createPaymentIntent({
    crawlerId: req.user.crawlerId,
    amount,
    currency
  });

  res.status(201).json(intent);
}));

router.get('/history', requireAuth, asyncHandler(async (req, res) => {
  if (req.user.role !== 'crawler') {
    throw new AppError('Only crawlers can view payment history', 403);
  }

  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const offset = parseInt(req.query.offset, 10) || 0;

  const payments = await listPayments(req.user.crawlerId, { limit, offset });
  res.json({ payments });
}));

router.get('/balance', requireAuth, asyncHandler(async (req, res) => {
  if (req.user.role !== 'crawler') {
    throw new AppError('Only crawlers can view balances', 403);
  }

  const balance = await getCrawlerBalance(req.user.crawlerId);
  res.json(balance);
}));

router.post('/webhook', asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const payloadBuffer = req.rawBody || req.body;
  const result = await handleStripeWebhook(signature, payloadBuffer);
  res.json(result);
}));

export default router;
