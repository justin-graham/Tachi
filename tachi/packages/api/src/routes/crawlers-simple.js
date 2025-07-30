import express from 'express';
import { generateToken } from '../middleware/auth.js';
import { createLogger } from '../utils/logger.js';

const router = express.Router();
const logger = createLogger();

// Register a new crawler/AI company (demo mode)
router.post('/register', async (req, res) => {
  try {
    const { 
      email = 'demo@crawler.com', 
      companyName = 'Demo AI Company', 
      type = 'startup' 
    } = req.body;

    const apiKey = 'tk_demo_' + Math.random().toString(36).substr(2, 9);
    const token = generateToken('demo-crawler-' + Date.now(), type);
    
    logger.info(`New crawler registered (demo): ${companyName} (${email})`);
    
    return res.status(201).json({
      message: 'Crawler registered successfully (demo mode)',
      crawler: {
        id: 'demo-crawler-' + Date.now(),
        email,
        companyName,
        type,
        credits: type === 'individual' ? 100 : 1000
      },
      apiKey,
      token,
      demo: true
    });
  } catch (error) {
    logger.error('Crawler registration failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Authenticate crawler and get token (demo mode)
router.post('/auth', async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey || !apiKey.startsWith('tk_demo_')) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const token = generateToken('demo-crawler-authenticated', 'startup');
    
    logger.info(`Crawler authenticated (demo)`);

    res.json({
      message: 'Authentication successful (demo mode)',
      token,
      crawler: {
        id: 'demo-crawler-authenticated',
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
