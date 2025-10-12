import { Router } from 'express';

import authRoutes from './auth/routes.js';
import publishersRoutes from './publishers/routes.js';
import crawlersRoutes from './crawlers/routes.js';
import contentRoutes from './content/routes.js';
import paymentsRoutes from './payments/routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/publishers', publishersRoutes);
router.use('/crawlers', crawlersRoutes);
router.use('/content', contentRoutes);
router.use('/payments', paymentsRoutes);

export default router;
