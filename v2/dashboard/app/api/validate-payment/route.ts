import {NextRequest, NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const {searchParams} = new URL(request.url);
    const txHash = searchParams.get('tx_hash');
    const publisher = searchParams.get('publisher');

    if (!txHash || !publisher) {
      return NextResponse.json({error: 'tx_hash and publisher required'}, {status: 400});
    }

    // Check if payment exists and is recent (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const {data, error} = await supabase
      .from('payments')
      .select('tx_hash, publisher_address, timestamp')
      .eq('tx_hash', txHash)
      .eq('publisher_address', publisher.toLowerCase())
      .gte('timestamp', fiveMinutesAgo)
      .single();

    if (error || !data) {
      return NextResponse.json({valid: false, reason: 'Payment not found or expired'});
    }

    return NextResponse.json({valid: true, timestamp: data.timestamp});
  } catch (error: any) {
    console.error('Payment validation error:', error);
    return NextResponse.json({error: error.message}, {status: 500});
  }
}
