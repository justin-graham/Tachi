import {NextRequest, NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {randomBytes} from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {address} = body;

    if (!address) {
      return NextResponse.json({error: 'Address required'}, {status: 400});
    }

    // Generate a random 64-character hex string (32 bytes)
    const apiKey = randomBytes(32).toString('hex');

    // Update publisher record with new API key
    const {data, error} = await supabase
      .from('publishers')
      .update({
        api_key: apiKey,
        api_key_created_at: new Date().toISOString()
      })
      .eq('wallet_address', address.toLowerCase())
      .select('api_key')
      .single();

    if (error) {
      console.error('Failed to generate API key:', error);
      return NextResponse.json({error: 'Failed to generate API key'}, {status: 500});
    }

    return NextResponse.json({
      success: true,
      apiKey: data.api_key
    });
  } catch (error: any) {
    console.error('Generate API key error:', error);
    return NextResponse.json({error: error.message}, {status: 500});
  }
}
