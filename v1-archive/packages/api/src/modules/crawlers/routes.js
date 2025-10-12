import { Router } from 'express';
import { asyncHandler, AppError } from '../../shared/errors.js';
import { requireAuth } from '../../shared/middleware/auth.js';
import { registerCrawler, getCrawlerById, addCrawlerCredits } from './service.js';
import { issueToken } from '../auth/service.js';

const router = Router();

router.post('/register', asyncHandler(async (req, res) => {
  const result = await registerCrawler(req.body || {});
  res.status(201).json(result);
}));

router.post('/auth', asyncHandler(async (req, res) => {
  const { apiKey } = req.body || {};
  const token = await issueToken(apiKey, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  res.json(token);
}));

router.get('/profile/:id', requireAuth, asyncHandler(async (req, res) => {
  if (req.user.role !== 'crawler' || req.user.crawlerId !== req.params.id) {
    throw new AppError('You can only access your own crawler profile', 403);
  }

  const crawler = await getCrawlerById(req.params.id);
  res.json({ crawler });
}));

router.post('/credits/add', requireAuth, asyncHandler(async (req, res) => {
  if (req.user.role !== 'crawler' || req.user.crawlerId !== req.body?.crawlerId) {
    throw new AppError('You can only add credits to your own account', 403);
  }

  const crawler = await addCrawlerCredits(req.body.crawlerId, req.body.amount);
  res.json({ crawler });
}));

export default router;
