import { Router } from 'express';
import { asyncHandler } from '../../shared/errors.js';
import { issueToken } from './service.js';

const router = Router();

router.post('/token', asyncHandler(async (req, res) => {
  const { apiKey } = req.body;
  const token = await issueToken(apiKey, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  res.json(token);
}));

export default router;
