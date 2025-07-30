import express from 'express';
import { createLogger } from '../utils/logger.js';

const router = express.Router();
const logger = createLogger();

// Health check for publishers route
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    route: 'publishers',
    database: 'demo mode',
    timestamp: new Date().toISOString()
  });
});

// Get public publisher directory
router.get('/directory', async (req, res) => {
  try {
    // Return demo data
    return res.json({
      publishers: [
        {
          id: 'demo-1',
          name: 'Example News Site',
          domain: 'example.com',
          description: 'Leading news and analysis website',
          pricePerRequest: 0.002,
          status: 'active'
        },
        {
          id: 'demo-2',
          name: 'Tech Blog',
          domain: 'techblog.com',
          description: 'Latest technology news and reviews',
          pricePerRequest: 0.001,
          status: 'active'
        }
      ],
      total: 2,
      demo: true
    });
  } catch (error) {
    logger.error('Error fetching publisher directory:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register a new publisher (demo mode)
router.post('/register', async (req, res) => {
  try {
    const { name = 'Demo Publisher', domain = 'demo.com', email = 'demo@demo.com' } = req.body;
    
    const apiKey = 'pk_demo_' + Math.random().toString(36).substr(2, 9);
    
    logger.info(`New publisher registered (demo): ${name} (${domain})`);
    
    res.status(201).json({
      message: 'Publisher registered successfully (demo mode)',
      publisher: {
        id: 'demo-publisher-' + Date.now(),
        name,
        domain,
        email,
        pricePerRequest: 0.002,
        status: 'active'
      },
      apiKey,
      demo: true
    });
  } catch (error) {
    logger.error('Publisher registration failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
