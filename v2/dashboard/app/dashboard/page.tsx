'use client';

import {useEffect, useState} from 'react';

interface DashboardStats {
  todayRequests: number;
  todayRevenue: string;
  totalRequests: number;
  totalRevenue: string;
  avgPrice: string;
  activePublishers: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const publisherAddress = process.env.NEXT_PUBLIC_PUBLISHER_ADDRESS || '';

    fetch(`${apiUrl}/api/dashboard/stats/${publisherAddress}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats);
        } else {
          // Fallback to mock data if API fails
          setStats({
            todayRequests: 0,
            todayRevenue: '0.00',
            totalRequests: 0,
            totalRevenue: '0.00',
            avgPrice: '0.01',
            activePublishers: 0
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch stats:', err);
        // Fallback to empty data
        setStats({
          todayRequests: 0,
          todayRevenue: '0.00',
          totalRequests: 0,
          totalRevenue: '0.00',
          avgPrice: '0.01',
          activePublishers: 0
        });
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Page Title */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2">Overview</h2>
        <p className="text-lg opacity-70">Real-time metrics for your protected content</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <StatCard
          label="Today's Requests"
          value={stats?.todayRequests.toString() || '0'}
          trend="+12%"
          color="coral"
        />
        <StatCard
          label="Today's Revenue"
          value={`$${stats?.todayRevenue || '0.00'}`}
          subtitle="USDC"
          color="sage"
        />
        <StatCard
          label="Average Price"
          value={`$${stats?.avgPrice || '0.00'}`}
          subtitle="per request"
          color="black"
        />
      </div>

      {/* All-Time Stats */}
      <div className="lab-divider"></div>

      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-6">All-Time Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="neo-card blueprint-corner">
            <div className="text-sm uppercase tracking-wide text-sage mb-2">Total Requests</div>
            <div className="text-5xl font-bold mono-num">{stats?.totalRequests.toLocaleString()}</div>
          </div>
          <div className="neo-card blueprint-corner">
            <div className="text-sm uppercase tracking-wide text-sage mb-2">Total Revenue</div>
            <div className="text-5xl font-bold mono-num text-coral">
              ${stats?.totalRevenue}
            </div>
            <div className="text-sm uppercase mt-2 opacity-60">USDC on Base</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="lab-divider"></div>

      <div>
        <h3 className="text-2xl font-bold mb-6">Recent Activity</h3>
        <div className="neo-card">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-left py-3 uppercase text-sm font-bold">Time</th>
                <th className="text-left py-3 uppercase text-sm font-bold">Path</th>
                <th className="text-right py-3 uppercase text-sm font-bold">Amount</th>
              </tr>
            </thead>
            <tbody>
              <ActivityRow time="2m ago" path="/article/ai-training" amount="$0.01" />
              <ActivityRow time="5m ago" path="/dataset/financial-news" amount="$0.01" />
              <ActivityRow time="8m ago" path="/api/market-data" amount="$0.01" />
              <ActivityRow time="12m ago" path="/article/ai-training" amount="$0.01" />
              <ActivityRow time="15m ago" path="/dataset/financial-news" amount="$0.01" />
            </tbody>
          </table>
          <div className="mt-4 text-center">
            <a href="/dashboard/requests" className="neo-button neo-button-sage inline-block">
              View All Requests →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  trend,
  color
}: {
  label: string;
  value: string;
  subtitle?: string;
  trend?: string;
  color: 'coral' | 'sage' | 'black';
}) {
  const bgClass = color === 'coral' ? 'bg-coral' : color === 'sage' ? 'bg-sage' : 'bg-black';
  const textClass = color === 'black' ? 'text-white' : 'text-black';

  return (
    <div className="neo-card">
      <div className="text-sm uppercase tracking-wide opacity-60 mb-2">{label}</div>
      <div className="flex items-baseline gap-3">
        <div className="text-4xl font-bold mono-num">{value}</div>
        {trend && (
          <span className={`text-sm font-bold ${bgClass} ${textClass} px-2 py-1 border-2 border-black`}>
            {trend}
          </span>
        )}
      </div>
      {subtitle && <div className="text-sm uppercase mt-1 opacity-60">{subtitle}</div>}
    </div>
  );
}

function ActivityRow({time, path, amount}: {time: string; path: string; amount: string}) {
  return (
    <tr className="border-b border-gray-200">
      <td className="py-3 text-sm opacity-60">{time}</td>
      <td className="py-3 font-mono text-sm">{path}</td>
      <td className="py-3 text-right font-bold mono-num">{amount}</td>
    </tr>
  );
}
