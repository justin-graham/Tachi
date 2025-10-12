import { Router } from 'express';
import { asyncHandler } from '../../shared/errors.js';
import {
  listPublishers,
  getPublisherById,
  registerPublisher,
  updatePublisher
} from './service.js';

const router = Router();

router.get('/directory', asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const offset = parseInt(req.query.offset, 10) || 0;

  const publishers = await listPublishers({ limit, offset });
  res.json({ publishers, total: publishers.length });
}));

router.get('/profile/:id', asyncHandler(async (req, res) => {
  const publisher = await getPublisherById(req.params.id);
  res.json({ publisher });
}));

router.post('/register', asyncHandler(async (req, res) => {
  const result = await registerPublisher(req.body || {});
  res.status(201).json(result);
}));

router.put('/profile/:id', asyncHandler(async (req, res) => {
  const headerToken = req.get('x-management-token');
  const { managementToken, ...updates } = req.body || {};
  const token = headerToken || managementToken;

  const publisher = await updatePublisher(req.params.id, updates, { managementToken: token });

  res.json({ publisher });
}));

export default router;
