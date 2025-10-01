import express from 'express';
import crypto from 'crypto';
import { generateTokenPair } from '../middleware/auth-secure.js';
import { validate, schemas } from '../middleware/validation.js';
import { createLogger } from '../utils/logger.js';

const router = express.Router();
const logger = createLogger();

// Register a new crawler/AI company (demo mode)
router.post('/register', validate(schemas.registerCrawler), async (req, res) => {
  try {
    const { 
      email = 'demo@crawler.com', 
      companyName = 'Demo AI Company', 
      type = 'startup' 
    } = req.body;

    const userId = crypto.randomUUID();
    const apiKey = 'tk_demo_' + Math.random().toString(36).substr(2, 9);
    const tokens = generateTokenPair(userId, type);
    
    logger.info(`New crawler registered (demo): ${companyName} (${email})`);
    
    return res.status(201).json({
      message: 'Crawler registered successfully (demo mode)',
      crawler: {
        id: userId,
        email,
        companyName,
        type,
        credits: type === 'individual' ? 100 : 1000
      },
      apiKey,
      ...tokens,
      demo: true
    });
  } catch (error) {
    logger.error('Crawler registration failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Authenticate crawler and get token (demo mode)
router.post('/auth', validate(schemas.authCrawler), async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey || !apiKey.startsWith('tk_demo_')) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const userId = crypto.randomUUID();
    const tokens = generateTokenPair(userId, 'individual');
    
    logger.info(`Crawler authenticated (demo)`);

    res.json({
      message: 'Authentication successful (demo mode)',
      ...tokens,
      crawler: {
        id: userId,
        email: 'demo@crawler.com',
        companyName: 'Demo AI Company',
        type: 'startup',
        credits: 1000
      },
      demo: true
    });
  } catch (error) {
    logger.error('Crawler authentication failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
