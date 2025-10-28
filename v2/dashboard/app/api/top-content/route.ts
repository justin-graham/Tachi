import {NextRequest, NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const {searchParams} = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({error: 'Address required'}, {status: 400});
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get all crawl logs for this publisher
    const {data: crawlLogs, error: logsError} = await supabase
      .from('crawl_logs')
      .select('path, tx_hash')
      .eq('publisher_address', address.toLowerCase());

    if (logsError) {
      console.error('Supabase error:', logsError);
      return NextResponse.json({topContent: []});
    }

    if (!crawlLogs || crawlLogs.length === 0) {
      return NextResponse.json({topContent: []});
    }

    // Get payment amounts for these transactions
    const txHashes = crawlLogs.map((log) => log.tx_hash);
    const {data: payments, error: paymentsError} = await supabase
      .from('payments')
      .select('tx_hash, amount')
      .in('tx_hash', txHashes);

    if (paymentsError) {
      console.error('Payments error:', paymentsError);
      return NextResponse.json({topContent: []});
    }

    // Create a map of tx_hash to amount
    const paymentMap = new Map(payments?.map((p) => [p.tx_hash, parseFloat(p.amount)]) || []);

    // Group by path and calculate totals
    const pathStats = new Map<string, {revenue: number; requests: number}>();

    for (const log of crawlLogs) {
      const amount = paymentMap.get(log.tx_hash) || 0;
      const existing = pathStats.get(log.path) || {revenue: 0, requests: 0};
      pathStats.set(log.path, {
        revenue: existing.revenue + amount,
        requests: existing.requests + 1
      });
    }

    // Convert to array and sort by revenue
    const topContent = Array.from(pathStats.entries())
      .map(([path, stats]) => ({
        path,
        revenue: stats.revenue.toFixed(2),
        requests: stats.requests,
        title: formatPathToTitle(path)
      }))
      .sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue))
      .slice(0, 10); // Top 10

    // Calculate total for percentages
    const totalRevenue = topContent.reduce((sum, item) => sum + parseFloat(item.revenue), 0);

    const topContentWithPercentage = topContent.map((item) => ({
      ...item,
      percentage: totalRevenue > 0 ? Math.round((parseFloat(item.revenue) / totalRevenue) * 100) : 0
    }));

    return NextResponse.json({topContent: topContentWithPercentage});
  } catch (error: any) {
    console.error('Top content error:', error);
    return NextResponse.json({error: error.message}, {status: 500});
  }
}

// Helper function to format path to readable title
function formatPathToTitle(path: string): string {
  if (!path || path === '/') return 'Homepage';

  // Remove leading slash and file extensions
  let title = path.replace(/^\//, '').replace(/\.(html|php|json)$/, '');

  // Replace hyphens and underscores with spaces
  title = title.replace(/[-_]/g, ' ');

  // Capitalize words
  title = title.replace(/\b\w/g, (char) => char.toUpperCase());

  return title;
}
