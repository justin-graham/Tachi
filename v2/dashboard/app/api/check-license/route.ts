import {NextRequest, NextResponse} from 'next/server';
import {createPublicClient, http, parseAbi} from 'viem';
import {base} from 'viem/chains';

const CRAWL_NFT_ABI = parseAbi([
  'function hasLicense(address) external view returns (bool)',
  'function publisherTokenId(address) external view returns (uint256)'
]);

export async function GET(request: NextRequest) {
  try {
    const {searchParams} = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({error: 'Address required'}, {status: 400});
    }

    const client = createPublicClient({
      chain: base,
      transport: http('https://mainnet.base.org')
    });

    const hasLicense = await client.readContract({
      address: process.env.NEXT_PUBLIC_CRAWL_NFT_ADDRESS as `0x${string}`,
      abi: CRAWL_NFT_ABI,
      functionName: 'hasLicense',
      args: [address as `0x${string}`]
    } as any);

    let tokenId = null;
    if (hasLicense) {
      tokenId = await client.readContract({
        address: process.env.NEXT_PUBLIC_CRAWL_NFT_ADDRESS as `0x${string}`,
        abi: CRAWL_NFT_ABI,
        functionName: 'publisherTokenId',
        args: [address as `0x${string}`]
      } as any);
    }

    return NextResponse.json({
      hasLicense,
      tokenId: tokenId ? tokenId.toString() : null
    });
  } catch (error: any) {
    console.error('Check license error:', error);
    return NextResponse.json({error: error.message}, {status: 500});
  }
}
