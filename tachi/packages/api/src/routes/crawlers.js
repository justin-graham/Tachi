import express from 'express';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import { generateToken } from '../middleware/auth.js';
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

// Validation schemas
const crawlerRegistrationSchema = Joi.object({
  email: Joi.string().email().required(),
  companyName: Joi.string().min(1).max(100).required(),
  type: Joi.string().valid('individual', 'startup', 'enterprise').required(),
  useCase: Joi.string().max(500),
  estimatedVolume: Joi.number().min(0).default(0)
});

// Register a new crawler/AI company
router.post('/register', async (req, res) => {
  try {
    const { error, value } = crawlerRegistrationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, companyName, type, useCase, estimatedVolume } = value;

    if (!supabase) {
      // Demo mode response
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
    }

    // Check if crawler already exists
    const { data: existing } = await supabase
      .from('crawlers')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Crawler already registered with this email' });
    }

    // Generate API key (simple version - in production use crypto.randomBytes)
    const apiKey = 'tk_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    const hashedApiKey = await bcrypt.hash(apiKey, 10);

    // Create crawler record
    const { data: crawler, error: dbError } = await supabase
      .from('crawlers')
      .insert({
        email,
        company_name: companyName,
        type,
        use_case: useCase,
        estimated_volume: estimatedVolume,
        api_key_hash: hashedApiKey,
        status: 'active',
        credits: type === 'individual' ? 100 : 1000, // Free credits for testing
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      logger.error('Database error creating crawler:', dbError);
      return res.status(500).json({ error: 'Failed to register crawler' });
    }

    // Generate JWT token
    const token = generateToken(crawler.id, type);

    logger.info(`New crawler registered: ${companyName} (${email})`);
    
    res.status(201).json({
      message: 'Crawler registered successfully',
      crawler: {
        id: crawler.id,
        email: crawler.email,
        companyName: crawler.company_name,
        type: crawler.type,
        credits: crawler.credits
      },
      apiKey, // Return the plain API key once (crawler should store this securely)
      token
    });
  } catch (error) {
    logger.error('Crawler registration failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Authenticate crawler and get token
router.post('/auth', async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    // Find crawler with matching API key
    const { data: crawlers, error } = await supabase
      .from('crawlers')
      .select('*')
      .eq('status', 'active');

    if (error) {
      logger.error('Database error in crawler auth:', error);
      return res.status(500).json({ error: 'Authentication failed' });
    }

    let authenticatedCrawler = null;
    for (const crawler of crawlers) {
      if (await bcrypt.compare(apiKey, crawler.api_key_hash)) {
        authenticatedCrawler = crawler;
        break;
      }
    }

    if (!authenticatedCrawler) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Generate new JWT token
    const token = generateToken(authenticatedCrawler.id, authenticatedCrawler.type);

    // Update last login
    await supabase
      .from('crawlers')
      .update({ last_login: new Date().toISOString() })
      .eq('id', authenticatedCrawler.id);

    logger.info(`Crawler authenticated: ${authenticatedCrawler.company_name}`);

    res.json({
      message: 'Authentication successful',
      token,
      crawler: {
        id: authenticatedCrawler.id,
        email: authenticatedCrawler.email,
        companyName: authenticatedCrawler.company_name,
        type: authenticatedCrawler.type,
        credits: authenticatedCrawler.credits
      }
    });
  } catch (error) {
    logger.error('Crawler authentication failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get crawler profile
router.get('/profile/:crawlerId', async (req, res) => {
  try {
    const { crawlerId } = req.params;

    const { data: crawler, error } = await supabase
      .from('crawlers')
      .select('id, email, company_name, type, credits, total_requests, total_spent, created_at, last_login')
      .eq('id', crawlerId)
      .single();

    if (error || !crawler) {
      return res.status(404).json({ error: 'Crawler not found' });
    }

    res.json({
      id: crawler.id,
      email: crawler.email,
      companyName: crawler.company_name,
      type: crawler.type,
      credits: crawler.credits,
      totalRequests: crawler.total_requests || 0,
      totalSpent: crawler.total_spent || 0,
      createdAt: crawler.created_at,
      lastLogin: crawler.last_login
    });
  } catch (error) {
    logger.error('Error fetching crawler profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add credits to crawler account
router.post('/credits/add', async (req, res) => {
  try {
    const { crawlerId, amount, paymentMethod = 'stripe' } = req.body;

    if (!crawlerId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid crawler ID and amount required' });
    }

    // In a real implementation, verify payment here
    // For now, just add the credits

    const { data: crawler, error } = await supabase
      .from('crawlers')
      .update({ 
        credits: supabase.raw(`credits + ${amount}`)
      })
      .eq('id', crawlerId)
      .select()
      .single();

    if (error) {
      logger.error('Error adding credits:', error);
      return res.status(500).json({ error: 'Failed to add credits' });
    }

    logger.info(`Credits added: ${amount} to crawler ${crawlerId}`);

    res.json({
      message: 'Credits added successfully',
      newBalance: crawler.credits
    });
  } catch (error) {
    logger.error('Error adding credits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
