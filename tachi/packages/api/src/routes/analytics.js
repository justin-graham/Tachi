import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken } from '../middleware/auth.js';
import { createLogger } from '../utils/logger.js';

const router = express.Router();
const logger = createLogger();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get analytics for crawler
router.get('/crawler/:crawlerId', authenticateToken, async (req, res) => {
  try {
    const { crawlerId } = req.params;
    const { period = '7d' } = req.query;

    // Verify crawler ownership or admin access
    if (req.user.id !== crawlerId && req.user.type !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
      case '24h':
        startDate.setHours(endDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    // Get transaction summary
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('amount, created_at, publisher_id, url')
      .eq('crawler_id', crawlerId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (transError) {
      logger.error('Error fetching transaction analytics:', transError);
      return res.status(500).json({ error: 'Failed to fetch analytics' });
    }

    // Calculate metrics
    const totalRequests = transactions.length;
    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const avgCostPerRequest = totalRequests > 0 ? totalSpent / totalRequests : 0;

    // Group by publisher
    const publisherStats = {};
    transactions.forEach(t => {
      if (!publisherStats[t.publisher_id]) {
        publisherStats[t.publisher_id] = { requests: 0, spent: 0, urls: new Set() };
      }
      publisherStats[t.publisher_id].requests++;
      publisherStats[t.publisher_id].spent += t.amount;
      publisherStats[t.publisher_id].urls.add(new URL(t.url).hostname);
    });

    // Get publisher names
    const publisherIds = Object.keys(publisherStats);
    const { data: publishers } = await supabase
      .from('publishers')
      .select('id, name, domain')
      .in('id', publisherIds);

    const publisherBreakdown = publishers.map(p => ({
      publisherId: p.id,
      name: p.name,
      domain: p.domain,
      requests: publisherStats[p.id].requests,
      spent: publisherStats[p.id].spent,
      uniqueDomains: publisherStats[p.id].urls.size
    }));

    // Group by day for time series
    const dailyStats = {};
    transactions.forEach(t => {
      const day = t.created_at.split('T')[0];
      if (!dailyStats[day]) {
        dailyStats[day] = { requests: 0, spent: 0 };
      }
      dailyStats[day].requests++;
      dailyStats[day].spent += t.amount;
    });

    const timeSeries = Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        requests: stats.requests,
        spent: stats.spent
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      period,
      summary: {
        totalRequests,
        totalSpent,
        avgCostPerRequest,
        uniquePublishers: publisherBreakdown.length
      },
      timeSeries,
      publisherBreakdown,
      recentTransactions: transactions.slice(0, 50) // Last 50 transactions
    });

  } catch (error) {
    logger.error('Error generating crawler analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get analytics for publisher
router.get('/publisher/:publisherId', authenticateToken, async (req, res) => {
  try {
    const { publisherId } = req.params;
    const { period = '7d' } = req.query;

    // Verify publisher ownership or admin access
    if (req.user.id !== publisherId && req.user.type !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
      case '24h':
        startDate.setHours(endDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    // Get transaction summary
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('amount, created_at, crawler_id, url, response_size')
      .eq('publisher_id', publisherId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (transError) {
      logger.error('Error fetching publisher analytics:', transError);
      return res.status(500).json({ error: 'Failed to fetch analytics' });
    }

    // Calculate metrics
    const totalRequests = transactions.length;
    const totalEarnings = transactions.reduce((sum, t) => sum + t.amount, 0);
    const avgEarningsPerRequest = totalRequests > 0 ? totalEarnings / totalRequests : 0;
    const totalDataServed = transactions.reduce((sum, t) => sum + (t.response_size || 0), 0);

    // Group by crawler
    const crawlerStats = {};
    transactions.forEach(t => {
      if (!crawlerStats[t.crawler_id]) {
        crawlerStats[t.crawler_id] = { requests: 0, earnings: 0, dataServed: 0 };
      }
      crawlerStats[t.crawler_id].requests++;
      crawlerStats[t.crawler_id].earnings += t.amount;
      crawlerStats[t.crawler_id].dataServed += t.response_size || 0;
    });

    // Get crawler names
    const crawlerIds = Object.keys(crawlerStats);
    const { data: crawlers } = await supabase
      .from('crawlers')
      .select('id, company_name, type')
      .in('id', crawlerIds);

    const crawlerBreakdown = crawlers.map(c => ({
      crawlerId: c.id,
      companyName: c.company_name,
      type: c.type,
      requests: crawlerStats[c.id].requests,
      earnings: crawlerStats[c.id].earnings,
      dataServed: crawlerStats[c.id].dataServed
    }));

    // Top URLs by requests
    const urlStats = {};
    transactions.forEach(t => {
      if (!urlStats[t.url]) {
        urlStats[t.url] = { requests: 0, earnings: 0 };
      }
      urlStats[t.url].requests++;
      urlStats[t.url].earnings += t.amount;
    });

    const topUrls = Object.entries(urlStats)
      .map(([url, stats]) => ({ url, ...stats }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 20);

    // Group by day for time series
    const dailyStats = {};
    transactions.forEach(t => {
      const day = t.created_at.split('T')[0];
      if (!dailyStats[day]) {
        dailyStats[day] = { requests: 0, earnings: 0 };
      }
      dailyStats[day].requests++;
      dailyStats[day].earnings += t.amount;
    });

    const timeSeries = Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        requests: stats.requests,
        earnings: stats.earnings
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      period,
      summary: {
        totalRequests,
        totalEarnings,
        avgEarningsPerRequest,
        totalDataServed,
        uniqueCrawlers: crawlerBreakdown.length
      },
      timeSeries,
      crawlerBreakdown,
      topUrls,
      recentTransactions: transactions.slice(0, 50)
    });

  } catch (error) {
    logger.error('Error generating publisher analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get platform-wide analytics (admin only)
router.get('/platform', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { period = '7d' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
      case '24h':
        startDate.setHours(endDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    // Get platform metrics
    const [
      { data: transactions },
      { data: publishers },
      { data: crawlers }
    ] = await Promise.all([
      supabase
        .from('transactions')
        .select('amount, created_at, response_size')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      supabase
        .from('publishers')
        .select('id, created_at, status, total_earnings'),
      supabase
        .from('crawlers')
        .select('id, created_at, status, total_spent')
    ]);

    const totalRequests = transactions.length;
    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalDataServed = transactions.reduce((sum, t) => sum + (t.response_size || 0), 0);
    const activePublishers = publishers.filter(p => p.status === 'active').length;
    const activeCrawlers = crawlers.filter(c => c.status === 'active').length;

    // Group by day for time series
    const dailyStats = {};
    transactions.forEach(t => {
      const day = t.created_at.split('T')[0];
      if (!dailyStats[day]) {
        dailyStats[day] = { requests: 0, revenue: 0, dataServed: 0 };
      }
      dailyStats[day].requests++;
      dailyStats[day].revenue += t.amount;
      dailyStats[day].dataServed += t.response_size || 0;
    });

    const timeSeries = Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        requests: stats.requests,
        revenue: stats.revenue,
        dataServed: stats.dataServed
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      period,
      summary: {
        totalRequests,
        totalRevenue,
        totalDataServed,
        activePublishers,
        activeCrawlers,
        avgRevenuePerRequest: totalRequests > 0 ? totalRevenue / totalRequests : 0
      },
      timeSeries,
      topPublishers: publishers
        .sort((a, b) => (b.total_earnings || 0) - (a.total_earnings || 0))
        .slice(0, 10),
      topCrawlers: crawlers
        .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
        .slice(0, 10)
    });

  } catch (error) {
    logger.error('Error generating platform analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
