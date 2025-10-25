import {NextRequest, NextResponse} from 'next/server';
import {createWalletClient, http, parseAbi, createPublicClient} from 'viem';
import {base} from 'viem/chains';
import {privateKeyToAccount} from 'viem/accounts';
import {getAdminPrivateKey} from '@/lib/secrets';
import {createClient} from '@supabase/supabase-js';

const CRAWL_NFT_ABI = parseAbi([
  'function mintLicense(address publisher, string calldata termsURI) external',
  'function hasLicense(address) external view returns (bool)'
]);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {publisher, name, email, domain, price} = body;

    if (!publisher || !domain || !name || !email) {
      return NextResponse.json(
        {error: 'Publisher address, name, email, and domain required'},
        {status: 400}
      );
    }

    // Check if already has license
    const publicClient = createPublicClient({
      chain: base,
      transport: http('https://mainnet.base.org')
    });

    const hasLicense = await publicClient.readContract({
      address: process.env.NEXT_PUBLIC_CRAWL_NFT_ADDRESS as `0x${string}`,
      abi: CRAWL_NFT_ABI,
      functionName: 'hasLicense',
      args: [publisher as `0x${string}`]
    } as any);

    if (hasLicense) {
      return NextResponse.json({error: 'Publisher already has a license'}, {status: 400});
    }

    // Create terms URI (simple JSON for now)
    const termsURI = `https://tachi.ai/terms/v1?domain=${domain}&price=${price}`;

    // Mint license using admin key from AWS Secrets Manager
    const privateKey = await getAdminPrivateKey();
    const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    const account = privateKeyToAccount(formattedKey as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http('https://mainnet.base.org')
    });

    const hash = await walletClient.writeContract({
      address: process.env.NEXT_PUBLIC_CRAWL_NFT_ADDRESS as `0x${string}`,
      abi: CRAWL_NFT_ABI,
      functionName: 'mintLicense',
      args: [publisher as `0x${string}`, termsURI],
      account,
      chain: base
    });

    // Wait for confirmation
    await publicClient.waitForTransactionReceipt({hash});

    // Create publisher record in database
    const {error: dbError} = await supabase
      .from('publishers')
      .insert({
        domain,
        name,
        email,
        wallet_address: publisher.toLowerCase(),
        price_per_request: parseFloat(price || '0.01'),
        status: 'active'
      });

    if (dbError) {
      console.error('Failed to create publisher record:', dbError);
      // Don't fail the whole request if DB registration fails
    }

    return NextResponse.json({
      success: true,
      transactionHash: hash,
      termsURI
    });
  } catch (error: any) {
    console.error('Mint license error:', error);
    return NextResponse.json({error: error.message}, {status: 500});
  }
}
