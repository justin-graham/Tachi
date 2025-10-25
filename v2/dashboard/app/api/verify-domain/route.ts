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

    // Extract root domain (no subdomains) and trim whitespace
    const rootDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].trim();

    // Query DNS for TXT records using Cloudflare DNS-over-HTTPS
    const dnsResponse = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${rootDomain}&type=TXT`,
      {headers: {Accept: 'application/dns-json'}}
    );

    const dnsData = await dnsResponse.json();

    // Log for debugging
    console.log('DNS lookup for:', rootDomain);
    console.log('Wallet address:', address);
    console.log('DNS response status:', dnsData.Status);

    // Check if Answer exists
    if (!dnsData.Answer || !Array.isArray(dnsData.Answer)) {
      return NextResponse.json({
        verified: false,
        message: 'No DNS TXT records found for domain: ' + rootDomain
      });
    }

    // Look for tachi-verify=<address> in TXT records
    const expectedRecord = `tachi-verify=${address.toLowerCase()}`;

    // Strip quotes and whitespace from DNS records for comparison
    const verified = dnsData.Answer.some((record: any) => {
      if (!record.data) return false;

      // Remove escaped quotes, actual quotes, and trim whitespace
      const cleanData = record.data
        .replace(/^"/, '')  // Remove leading quote
        .replace(/"$/, '')  // Remove trailing quote
        .replace(/\\"/g, '') // Remove escaped quotes
        .trim()
        .toLowerCase();

      console.log('Checking TXT record:', cleanData);
      console.log('Expected record:', expectedRecord);

      return cleanData.includes(expectedRecord);
    });

    if (!verified) {
      // Return detailed error message with what was found
      const foundRecords = dnsData.Answer.map((r: any) => r.data).join(', ');
      return NextResponse.json({
        verified: false,
        message: `TXT record not found. Expected: ${expectedRecord}. Found: ${foundRecords}`
      });
    }

    // Update publisher record in database (use lowercase for wallet address comparison)
    const {error: dbError} = await supabase
      .from('publishers')
      .update({domain_verified: true})
      .eq('wallet_address', address.toLowerCase())
      .eq('domain', rootDomain);

    if (dbError) {
      console.error('Database update error:', dbError);
      // Continue anyway - DNS verification passed
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
