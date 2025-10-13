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

    // Get all payments for this publisher
    const {data: payments, error} = await supabase
      .from('payments')
      .select('amount, timestamp')
      .eq('publisher_address', address.toLowerCase());

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({
        todayRequests: 0,
        todayRevenue: '0.00',
        totalRequests: 0,
        totalRevenue: '0.00',
        avgPrice: '0.01'
      });
    }

    // Calculate stats
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const totalRequests = payments?.length || 0;
    const totalRevenue = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

    const todayPayments = payments?.filter(
      (p) => new Date(p.timestamp) > oneDayAgo
    ) || [];
    const todayRequests = todayPayments.length;
    const todayRevenue = todayPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const avgPrice = totalRequests > 0 ? totalRevenue / totalRequests : 0.01;

    return NextResponse.json({
      todayRequests,
      todayRevenue: todayRevenue.toFixed(2),
      totalRequests,
      totalRevenue: totalRevenue.toFixed(2),
      avgPrice: avgPrice.toFixed(2)
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({error: error.message}, {status: 500});
  }
}
