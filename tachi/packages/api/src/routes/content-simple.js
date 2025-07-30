import express from 'express';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth.js';
import { createLogger } from '../utils/logger.js';

const router = express.Router();
const logger = createLogger();

// Initialize Supabase client (only if configured)
let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    logger.info('Supabase client initialized successfully');
  } else {
    logger.warn('Supabase not configured - API will run in demo mode');
  }
} catch (error) {
  logger.error('Failed to initialize Supabase client:', error);
}

// Get content pricing for a domain (public endpoint)
// NOTE: This route must come BEFORE the /:domain/* route to avoid conflicts
router.get('/pricing/:domain', async (req, res) => {
  try {
    const { domain } = req.params;

    // Demo response
    res.json({
      domain,
      publisherName: 'Demo Publisher',
      basePrice: 0.002,
      currency: 'USD',
      pricePerRequest: 0.002,
      rateLimitPerHour: 1000,
      termsOfService: 'Demo terms of service',
      available: true,
      demo: !supabase
    });
  } catch (error) {
    logger.error('Error fetching content pricing:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve content with payment verification
router.get('/:domain/*', authenticateToken, async (req, res) => {
  try {
    const { domain } = req.params;
    const path = req.params[0] || '';
    const fullUrl = `https://${domain}/${path}`;

    logger.info(`Content request: ${fullUrl} from user ${req.user.id}`);

    if (!supabase) {
      // Demo mode - return mock content
      return res.json({
        url: fullUrl,
        domain,
        publisher: {
          id: 'demo-publisher',
          name: 'Demo Publisher',
          pricePerRequest: 0.002
        },
        content: `<html><body><h1>Demo Content for ${domain}</h1><p>This is mock content served in demo mode. In production, this would fetch real content from ${fullUrl} after payment verification.</p><p>Path: ${path}</p></body></html>`,
        metadata: {
          contentType: 'text/html',
          contentLength: 200,
          timestamp: new Date().toISOString(),
          statusCode: 200
        },
        billing: {
          charged: 0.002,
          remainingCredits: 998
        },
        demo: true
      });
    }

    // Production logic would go here...
    res.status(503).json({
      error: 'Full content serving requires database configuration',
      demo: true
    });

  } catch (error) {
    logger.error('Content serving error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Batch content requests (authenticated)
router.post('/batch', authenticateToken, async (req, res) => {
  try {
    const { requests } = req.body;

    if (!requests || !Array.isArray(requests)) {
      return res.status(400).json({ error: 'Invalid requests array' });
    }

    logger.info(`Batch request: ${requests.length} URLs from user ${req.user.id}`);

    // Demo mode - process batch requests
    const results = requests.map((request, index) => {
      const { domain, path } = request;
      const fullUrl = `https://${domain}/${path}`;
      
      return {
        id: index + 1,
        url: fullUrl,
        domain,
        path,
        content: `<html><body><h1>Demo Batch Content for ${domain}</h1><p>This is mock batch content for ${fullUrl}</p></body></html>`,
        metadata: {
          contentType: 'text/html',
          contentLength: 150,
          timestamp: new Date().toISOString(),
          statusCode: 200
        },
        billing: {
          charged: 0.002,
          success: true
        }
      };
    });

    const totalCost = results.length * 0.002;
    const remainingCredits = 1000 - totalCost;

    res.json({
      batchId: 'batch_' + Date.now(),
      requestCount: requests.length,
      results,
      totalCost,
      remainingCredits,
      processedAt: new Date().toISOString(),
      demo: !supabase
    });

  } catch (error) {
    logger.error('Batch request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
