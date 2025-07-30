import express from 'express';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth.js';
import { createLogger } from '../utils/logger.js';

const router = express.Router();
const logger = createLogger();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Serve content with payment verification
router.get('/:domain/*', authenticateToken, async (req, res) => {
  try {
    const { domain } = req.params;
    const path = req.params[0] || '';
    const fullUrl = `https://${domain}/${path}`;
    const crawlerId = req.user.id;

    logger.info(`Content request: ${fullUrl} from crawler ${crawlerId}`);

    // Check if domain is registered as a publisher
    const { data: publisher, error: publisherError } = await supabase
      .from('publishers')
      .select('*')
      .eq('domain', domain)
      .eq('status', 'active')
      .single();

    if (publisherError || !publisher) {
      return res.status(404).json({ 
        error: 'Domain not available for crawling',
        domain,
        message: 'This domain is not registered in our publisher network'
      });
    }

    // Check crawler credits
    const { data: crawler, error: crawlerError } = await supabase
      .from('crawlers')
      .select('credits, status')
      .eq('id', crawlerId)
      .single();

    if (crawlerError || !crawler) {
      return res.status(401).json({ error: 'Invalid crawler' });
    }

    if (crawler.status !== 'active') {
      return res.status(403).json({ error: 'Crawler account is not active' });
    }

    if (crawler.credits < publisher.price_per_request) {
      return res.status(402).json({ 
        error: 'Insufficient credits',
        required: publisher.price_per_request,
        available: crawler.credits,
        message: 'Please add credits to your account to continue crawling'
      });
    }

    try {
      // Fetch the actual content
      const response = await axios.get(fullUrl, {
        timeout: 30000, // 30 second timeout
        headers: {
          'User-Agent': 'Tachi-Crawler/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive'
        },
        maxRedirects: 5
      });

      // Deduct credits and update counters
      const { error: updateError } = await supabase
        .from('crawlers')
        .update({
          credits: supabase.raw(`credits - ${publisher.price_per_request}`),
          total_requests: supabase.raw('total_requests + 1'),
          total_spent: supabase.raw(`total_spent + ${publisher.price_per_request}`)
        })
        .eq('id', crawlerId);

      if (updateError) {
        logger.error('Error updating crawler credits:', updateError);
      }

      // Add to publisher earnings
      await supabase
        .from('publishers')
        .update({
          total_earnings: supabase.raw(`total_earnings + ${publisher.price_per_request}`),
          total_requests: supabase.raw('total_requests + 1')
        })
        .eq('id', publisher.id);

      // Log the transaction
      await supabase
        .from('transactions')
        .insert({
          crawler_id: crawlerId,
          publisher_id: publisher.id,
          url: fullUrl,
          amount: publisher.price_per_request,
          status: 'completed',
          response_size: response.data.length,
          response_time: response.headers['request-duration'] || null,
          created_at: new Date().toISOString()
        });

      logger.info(`Content served: ${fullUrl} - ${publisher.price_per_request} credits deducted`);

      // Return the content with metadata
      res.json({
        url: fullUrl,
        domain,
        publisher: {
          id: publisher.id,
          name: publisher.name,
          pricePerRequest: publisher.price_per_request
        },
        content: response.data,
        metadata: {
          contentType: response.headers['content-type'],
          contentLength: response.data.length,
          timestamp: new Date().toISOString(),
          statusCode: response.status
        },
        billing: {
          charged: publisher.price_per_request,
          remainingCredits: crawler.credits - publisher.price_per_request
        }
      });

    } catch (fetchError) {
      logger.error(`Error fetching content from ${fullUrl}:`, fetchError.message);
      
      // Return error without charging
      res.status(502).json({
        error: 'Failed to fetch content',
        url: fullUrl,
        message: fetchError.message,
        statusCode: fetchError.response?.status || null
      });
    }

  } catch (error) {
    logger.error('Content serving error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get content pricing for a domain
router.get('/pricing/:domain', authenticateToken, async (req, res) => {
  try {
    const { domain } = req.params;

    const { data: publisher, error } = await supabase
      .from('publishers')
      .select('id, name, domain, price_per_request, rate_limit_per_hour, terms_of_service')
      .eq('domain', domain)
      .eq('status', 'active')
      .single();

    if (error || !publisher) {
      return res.status(404).json({ 
        error: 'Domain not available for crawling',
        domain
      });
    }

    res.json({
      domain: publisher.domain,
      publisherName: publisher.name,
      pricePerRequest: publisher.price_per_request,
      rateLimitPerHour: publisher.rate_limit_per_hour,
      termsOfService: publisher.terms_of_service,
      available: true
    });
  } catch (error) {
    logger.error('Error fetching content pricing:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk content request (for batch crawling)
router.post('/batch', authenticateToken, async (req, res) => {
  try {
    const { urls, maxConcurrent = 5 } = req.body;
    const crawlerId = req.user.id;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'URLs array is required' });
    }

    if (urls.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 URLs per batch request' });
    }

    // Check crawler credits first
    const { data: crawler, error: crawlerError } = await supabase
      .from('crawlers')
      .select('credits, status')
      .eq('id', crawlerId)
      .single();

    if (crawlerError || !crawler || crawler.status !== 'active') {
      return res.status(401).json({ error: 'Invalid or inactive crawler' });
    }

    // Estimate total cost
    const domains = [...new Set(urls.map(url => new URL(url).hostname))];
    const { data: publishers } = await supabase
      .from('publishers')
      .select('domain, price_per_request')
      .in('domain', domains)
      .eq('status', 'active');

    const estimatedCost = urls.reduce((total, url) => {
      const domain = new URL(url).hostname;
      const publisher = publishers.find(p => p.domain === domain);
      return total + (publisher?.price_per_request || 0);
    }, 0);

    if (crawler.credits < estimatedCost) {
      return res.status(402).json({
        error: 'Insufficient credits for batch request',
        required: estimatedCost,
        available: crawler.credits
      });
    }

    logger.info(`Batch crawl request: ${urls.length} URLs from crawler ${crawlerId}`);

    // Process URLs with concurrency limit
    const results = [];
    for (let i = 0; i < urls.length; i += maxConcurrent) {
      const batch = urls.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(async (url) => {
        try {
          const response = await axios.get(`${process.env.API_BASE_URL}/content/${url.replace('https://', '')}`, {
            headers: { Authorization: req.headers.authorization }
          });
          return { url, success: true, data: response.data };
        } catch (error) {
          return { url, success: false, error: error.message };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    res.json({
      totalUrls: urls.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });

  } catch (error) {
    logger.error('Batch content serving error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
