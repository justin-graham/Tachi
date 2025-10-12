import {Router} from 'express';
import {supabase} from '../db.js';

export const dashboardRouter = Router();

// Get dashboard stats for a publisher
dashboardRouter.get('/stats/:publisherAddress', async (req, res) => {
  try {
    const {publisherAddress} = req.params;

    // Get today's stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const {data: todayLogs} = await supabase
      .from('crawl_logs')
      .select('*')
      .eq('publisher_address', publisherAddress)
      .gte('timestamp', todayStart.toISOString());

    const {data: todayPayments} = await supabase
      .from('payments')
      .select('amount')
      .eq('publisher_address', publisherAddress)
      .gte('timestamp', todayStart.toISOString());

    // Get all-time stats
    const {data: publisher} = await supabase
      .from('publishers')
      .select('total_earnings, total_requests, price_per_request')
      .eq('wallet_address', publisherAddress)
      .single();

    const todayRevenue = todayPayments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

    res.json({
      success: true,
      stats: {
        todayRequests: todayLogs?.length || 0,
        todayRevenue: todayRevenue.toFixed(2),
        totalRequests: publisher?.total_requests || 0,
        totalRevenue: publisher?.total_earnings || '0.00',
        avgPrice: publisher?.price_per_request || '0.01',
        activePublishers: 1
      }
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({error: 'Failed to fetch stats', message: error.message});
  }
});

// Get recent requests for a publisher
dashboardRouter.get('/requests/:publisherAddress', async (req, res) => {
  try {
    const {publisherAddress} = req.params;
    const limit = parseInt((req.query.limit as string) || '50');

    const {data, error} = await supabase
      .from('crawl_logs')
      .select('id, tx_hash, path, crawler_address, timestamp')
      .eq('publisher_address', publisherAddress)
      .order('timestamp', {ascending: false})
      .limit(limit);

    if (error) throw error;

    // Join with payments to get amounts
    const requestsWithPayments = await Promise.all(
      (data || []).map(async (log) => {
        const {data: payment} = await supabase
          .from('payments')
          .select('amount')
          .eq('tx_hash', log.tx_hash)
          .single();

        return {
          ...log,
          amount: payment?.amount || '0.01'
        };
      })
    );

    res.json({success: true, requests: requestsWithPayments});
  } catch (error: any) {
    console.error('Dashboard requests error:', error);
    res.status(500).json({error: 'Failed to fetch requests', message: error.message});
  }
});

// Get revenue data for a publisher
dashboardRouter.get('/revenue/:publisherAddress', async (req, res) => {
  try {
    const {publisherAddress} = req.params;
    const days = parseInt((req.query.days as string) || '7');

    // Get payments for last N days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const {data: payments} = await supabase
      .from('payments')
      .select('amount, timestamp')
      .eq('publisher_address', publisherAddress)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', {ascending: true});

    // Group by date
    const revenueByDate: Record<string, {amount: number; requests: number}> = {};

    (payments || []).forEach((payment) => {
      const date = payment.timestamp.split('T')[0];
      if (!revenueByDate[date]) {
        revenueByDate[date] = {amount: 0, requests: 0};
      }
      revenueByDate[date].amount += parseFloat(payment.amount);
      revenueByDate[date].requests += 1;
    });

    const revenueData = Object.entries(revenueByDate).map(([date, data]) => ({
      date,
      amount: parseFloat(data.amount.toFixed(2)),
      requests: data.requests
    }));

    res.json({success: true, revenue: revenueData});
  } catch (error: any) {
    console.error('Dashboard revenue error:', error);
    res.status(500).json({error: 'Failed to fetch revenue', message: error.message});
  }
});
