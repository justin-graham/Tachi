import {NextRequest, NextResponse} from 'next/server';
import {createWalletClient, http, parseAbi, createPublicClient} from 'viem';
import {base} from 'viem/chains';
import {privateKeyToAccount} from 'viem/accounts';

const CRAWL_NFT_ABI = parseAbi([
  'function mintLicense(address publisher, string calldata termsURI) external',
  'function hasLicense(address) external view returns (bool)'
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {publisher, domain, price} = body;

    if (!publisher || !domain) {
      return NextResponse.json(
        {error: 'Publisher address and domain required'},
        {status: 400}
      );
    }

    // Check if already has license
    const publicClient = createPublicClient({
      chain: base,
      transport: http()
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

    // Mint license using admin key
    const account = privateKeyToAccount(`0x${process.env.ADMIN_PRIVATE_KEY}` as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http()
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
