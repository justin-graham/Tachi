'use client';

import {useState, useEffect} from 'react';
import {createPublicClient, http, parseAbi} from 'viem';
import {base} from 'viem/chains';

const CRAWL_NFT_ABI = parseAbi([
  'function totalSupply() external view returns (uint256)',
  'function licenses(uint256) external view returns (address publisher, bool isActive, uint32 mintedAt, uint32 updatedAt)',
  'function termsURI(uint256) external view returns (string)'
]);

interface Publisher {
  tokenId: number;
  address: string;
  domain: string;
  price: string;
  isActive: boolean;
}

export default function DirectoryPage() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadPublishers();
  }, []);

  const loadPublishers = async () => {
    try {
      const client = createPublicClient({chain: base, transport: http()});
      const address = process.env.NEXT_PUBLIC_CRAWL_NFT_ADDRESS as `0x${string}`;

      const totalSupply = await client.readContract({
        address,
        abi: CRAWL_NFT_ABI,
        functionName: 'totalSupply'
      } as any);

      const pubs: Publisher[] = [];
      for (let i = 1; i <= Number(totalSupply); i++) {
        const [publisher, isActive] = await client.readContract({
          address,
          abi: CRAWL_NFT_ABI,
          functionName: 'licenses',
          args: [BigInt(i)]
        } as any) as [string, boolean, number, number];

        const termsURI = await client.readContract({
          address,
          abi: CRAWL_NFT_ABI,
          functionName: 'termsURI',
          args: [BigInt(i)]
        } as any) as string;

        const url = new URL(termsURI);
        const domain = url.searchParams.get('domain') || 'Unknown';
        const price = url.searchParams.get('price') || '0.01';

        pubs.push({tokenId: i, address: publisher, domain, price, isActive});
      }

      setPublishers(pubs.filter((p) => p.isActive));
    } catch (error) {
      console.error('Failed to load publishers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = publishers.filter(
    (p) => p.domain.toLowerCase().includes(search.toLowerCase()) || p.address.toLowerCase().includes(search)
  );

  const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://tachi-gateway.jgrahamsport16.workers.dev';

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-5xl font-bold mb-2">Publisher Directory</h1>
        <p className="text-lg md:text-xl opacity-70">Discover content publishers using Tachi Protocol</p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by domain or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="neo-input w-full"
        />
      </div>

      {loading ? (
        <div className="neo-card text-center py-12">Loading publishers...</div>
      ) : filtered.length === 0 ? (
        <div className="neo-card text-center py-12">
          <p className="text-lg font-bold mb-2">No publishers found</p>
          <p className="text-sm opacity-60">Be the first to register!</p>
        </div>
      ) : (
        <div className="neo-card overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-left py-3 uppercase text-xs md:text-sm font-bold">Domain</th>
                <th className="text-left py-3 uppercase text-xs md:text-sm font-bold">Publisher</th>
                <th className="text-right py-3 uppercase text-xs md:text-sm font-bold">Price</th>
                <th className="text-right py-3 uppercase text-xs md:text-sm font-bold">Gateway</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.tokenId} className="border-b border-gray-200">
                  <td className="py-3 font-bold">{p.domain}</td>
                  <td className="py-3 font-mono text-sm">{p.address.slice(0, 10)}...{p.address.slice(-8)}</td>
                  <td className="py-3 text-right font-bold mono-num text-coral">${p.price}</td>
                  <td className="py-3 text-right">
                    <a
                      href={`${gatewayUrl}?publisher=${p.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-sage hover:underline"
                    >
                      Access →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
