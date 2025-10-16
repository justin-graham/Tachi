'use client';

import {useEffect, useState} from 'react';
import {useHydrationSafeAddress} from '../../hooks/useHydrationSafeAddress';
import {useRouter} from 'next/navigation';

interface CrawlRequest {
  id: string;
  timestamp: string;
  path: string;
  crawlerAddress: string;
  amount: string;
  txHash: string;
}

export default function RequestsPage() {
  const {address, isConnected} = useHydrationSafeAddress();
  const router = useRouter();
  const [requests, setRequests] = useState<CrawlRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }
    setRequests([]);
    setLoading(false);
  }, [address, isConnected]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Page Title */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2">Request Log</h2>
        <p className="text-lg opacity-70">All crawl requests with payment verification</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="neo-card">
          <div className="text-sm uppercase tracking-wide text-sage mb-1">Total Requests</div>
          <div className="text-3xl font-bold mono-num">{requests.length}</div>
        </div>
        <div className="neo-card">
          <div className="text-sm uppercase tracking-wide text-sage mb-1">Unique Crawlers</div>
          <div className="text-3xl font-bold mono-num">
            {new Set(requests.map((r) => r.crawlerAddress)).size}
          </div>
        </div>
        <div className="neo-card">
          <div className="text-sm uppercase tracking-wide text-sage mb-1">Total Earned</div>
          <div className="text-3xl font-bold mono-num text-coral">
            ${(requests.length * 0.01).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Request Table */}
      <div className="neo-card">
        {requests.length > 0 ? (
          <div className="p-0 overflow-hidden -m-6">
            <table className="neo-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Path</th>
                  <th>Crawler</th>
                  <th>Amount</th>
                  <th>Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td className="mono-num">{formatTime(req.timestamp)}</td>
                    <td className="font-mono text-sm">{req.path}</td>
                    <td className="font-mono text-xs opacity-60">
                      {req.crawlerAddress.slice(0, 6)}...{req.crawlerAddress.slice(-4)}
                    </td>
                    <td className="font-bold mono-num">${req.amount}</td>
                    <td>
                      <a
                        href={`https://sepolia.basescan.org/tx/${req.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-coral hover:underline"
                      >
                        {req.txHash}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg font-bold mb-2">No Requests Yet</p>
            <p className="text-sm opacity-60">Request logs will appear here once crawlers access your content</p>
          </div>
        )}
      </div>

      {/* Export Button */}
      <div className="mt-6 text-center">
        <button className="neo-button neo-button-sage">
          Export CSV →
        </button>
      </div>
    </div>
  );
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleString();
}
