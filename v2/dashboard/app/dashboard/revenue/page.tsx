'use client';

import {useEffect, useState} from 'react';

interface RevenueData {
  date: string;
  amount: number;
  requests: number;
}

export default function RevenuePage() {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const publisherAddress = process.env.NEXT_PUBLIC_PUBLISHER_ADDRESS || '';

    fetch(`${apiUrl}/api/dashboard/revenue/${publisherAddress}?days=7`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRevenueData(data.revenue);
          setTotalRevenue(data.revenue.reduce((sum: number, d: RevenueData) => sum + d.amount, 0));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch revenue:', err);
        setRevenueData([]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const maxAmount = Math.max(...revenueData.map((d) => d.amount));

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Page Title */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2">Revenue</h2>
        <p className="text-lg opacity-70">Track your earnings over time</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="neo-card blueprint-corner">
          <div className="text-sm uppercase tracking-wide text-sage mb-2">Total Revenue</div>
          <div className="text-5xl font-bold mono-num text-coral">
            ${totalRevenue.toFixed(2)}
          </div>
          <div className="text-sm uppercase mt-2 opacity-60">USDC on Base</div>
        </div>
        <div className="neo-card">
          <div className="text-sm uppercase tracking-wide text-sage mb-2">7-Day Average</div>
          <div className="text-5xl font-bold mono-num">
            ${(totalRevenue / revenueData.length).toFixed(2)}
          </div>
          <div className="text-sm uppercase mt-2 opacity-60">per day</div>
        </div>
        <div className="neo-card">
          <div className="text-sm uppercase tracking-wide text-sage mb-2">Best Day</div>
          <div className="text-5xl font-bold mono-num">${maxAmount.toFixed(2)}</div>
          <div className="text-sm uppercase mt-2 opacity-60">
            {revenueData.find((d) => d.amount === maxAmount)?.date}
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="neo-card">
        <h3 className="text-2xl font-bold mb-6">Last 7 Days</h3>
        <div className="space-y-4">
          {revenueData.map((day) => (
            <div key={day.date} className="flex items-center gap-4">
              <div className="w-24 text-sm font-mono opacity-60">{day.date.slice(5)}</div>
              <div className="flex-1 flex items-center gap-4">
                <div className="flex-1 relative h-12 bg-white border-2 border-black">
                  <div
                    className="absolute left-0 top-0 h-full bg-coral border-r-2 border-black flex items-center justify-end pr-2"
                    style={{width: `${(day.amount / maxAmount) * 100}%`}}
                  >
                    <span className="font-bold text-sm text-black">${day.amount.toFixed(2)}</span>
                  </div>
                </div>
                <div className="w-20 text-right text-sm opacity-60">{day.requests} req</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="lab-divider"></div>

      <div>
        <h3 className="text-2xl font-bold mb-6">Top Content by Revenue</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ContentCard
            title="AI Training Article"
            path="/article/ai-training"
            revenue="12.34"
            requests={1234}
            percentage={45}
          />
          <ContentCard
            title="Financial News Dataset"
            path="/dataset/financial-news"
            revenue="8.92"
            requests={892}
            percentage={32}
          />
          <ContentCard
            title="Market Data API"
            path="/api/market-data"
            revenue="6.80"
            requests={680}
            percentage={23}
          />
        </div>
      </div>
    </div>
  );
}

function ContentCard({
  title,
  path,
  revenue,
  requests,
  percentage
}: {
  title: string;
  path: string;
  revenue: string;
  requests: number;
  percentage: number;
}) {
  return (
    <div className="neo-card">
      <div className="mb-3">
        <div className="font-bold text-lg mb-1">{title}</div>
        <div className="text-sm font-mono opacity-60">{path}</div>
      </div>
      <div className="mb-3">
        <div className="text-3xl font-bold mono-num text-coral">${revenue}</div>
        <div className="text-sm opacity-60">{requests.toLocaleString()} requests</div>
      </div>
      <div className="w-full bg-white border-2 border-black h-3 relative">
        <div className="absolute left-0 top-0 h-full bg-sage" style={{width: `${percentage}%`}}></div>
      </div>
      <div className="text-xs mt-1 text-right opacity-60">{percentage}% of total</div>
    </div>
  );
}
