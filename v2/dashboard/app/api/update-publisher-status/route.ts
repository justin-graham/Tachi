import {NextRequest, NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const {address, status} = await request.json();

    if (!address || !status) {
      return NextResponse.json({error: 'Address and status required'}, {status: 400});
    }

    if (!['active', 'inactive'].includes(status)) {
      return NextResponse.json({error: 'Invalid status'}, {status: 400});
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {error} = await supabase
      .from('publishers')
      .update({status, updated_at: new Date().toISOString()})
      .eq('wallet_address', address.toLowerCase());

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({error: 'Failed to update status'}, {status: 500});
    }

    return NextResponse.json({success: true});
  } catch (error: any) {
    console.error('Update publisher status error:', error);
    return NextResponse.json({error: error.message}, {status: 500});
  }
}
