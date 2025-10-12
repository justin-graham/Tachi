import { Router } from 'express';
import { asyncHandler } from '../../shared/errors.js';
import { requireAuth } from '../../shared/middleware/auth.js';
import {
  fetchContent,
  fetchContentBatch,
  getContentPricing
} from './service.js';

const router = Router();

router.get('/pricing/:domain', asyncHandler(async (req, res) => {
  const pricing = await getContentPricing(req.params.domain);
  res.json({ pricing });
}));

router.get('/:domain/*', requireAuth, asyncHandler(async (req, res) => {
  const path = req.params[0] || '';
  const result = await fetchContent({
    domain: req.params.domain,
    path,
    query: req.query,
    user: req.user
  });

  res.json(result);
}));

router.post('/batch', requireAuth, asyncHandler(async (req, res) => {
  const result = await fetchContentBatch(req.body?.requests || [], {
    user: req.user
  });
  res.json(result);
}));

export default router;
