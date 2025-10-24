import {NextRequest, NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const {domain, address} = await request.json();

    if (!domain || !address) {
      return NextResponse.json({error: 'Domain and address required'}, {status: 400});
    }

    // Extract root domain (no subdomains)
    const rootDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

    // Query DNS for TXT records using Cloudflare DNS-over-HTTPS
    const dnsResponse = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${rootDomain}&type=TXT`,
      {headers: {Accept: 'application/dns-json'}}
    );

    const dnsData = await dnsResponse.json();

    // Look for tachi-verify=<address> in TXT records
    const expectedRecord = `tachi-verify=${address.toLowerCase()}`;
    const verified = dnsData.Answer?.some((record: any) =>
      record.data?.toLowerCase().includes(expectedRecord)
    );

    if (!verified) {
      return NextResponse.json({
        verified: false,
        message: 'TXT record not found. Make sure you added: ' + expectedRecord
      });
    }

    // Update publisher record in database
    const {error: dbError} = await supabase
      .from('publishers')
      .update({domain_verified: true})
      .eq('wallet_address', address)
      .eq('domain', rootDomain);

    if (dbError) {
      console.error('Database update error:', dbError);
      return NextResponse.json({error: 'Failed to update verification status'}, {status: 500});
    }

    return NextResponse.json({
      verified: true,
      message: 'Domain verified successfully!'
    });
  } catch (error: any) {
    console.error('Domain verification error:', error);
    return NextResponse.json({error: error.message}, {status: 500});
  }
}
