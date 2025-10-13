'use client';

import {useAccount} from 'wagmi';
import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';

interface DashboardStats {
  todayRequests: number;
  todayRevenue: string;
  totalRequests: number;
  totalRevenue: string;
  avgPrice: string;
  yesterdayRequests?: number;
  recentActivity?: Array<{time: string; path: string; amount: string}>;
}

export default function DashboardPage() {
  const {address, isConnected} = useAccount();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLicense, setHasLicense] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }
    checkLicenseAndFetchData();
  }, [address, isConnected]);

  const checkLicenseAndFetchData = async () => {
    try {
      // Check license first
      const licenseRes = await fetch(`/api/check-license?address=${address}`);
      const licenseData = await licenseRes.json();

      if (!licenseData.hasLicense) {
        router.push('/onboard');
        return;
      }

      setHasLicense(true);

      // Fetch dashboard stats from Supabase
      const statsRes = await fetch(`/api/dashboard-stats?address=${address}`);
      const statsData = await statsRes.json();

      setStats(statsData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      // Fallback to zero stats
      setStats({
        todayRequests: 0,
        todayRevenue: '0.00',
        totalRequests: 0,
        totalRevenue: '0.00',
        avgPrice: '0.00'
      });
      setLoading(false);
    }
  };

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
          trend={stats?.todayRequests && stats?.yesterdayRequests
            ? `${stats.todayRequests > stats.yesterdayRequests ? '+' : ''}${(((stats.todayRequests - stats.yesterdayRequests) / (stats.yesterdayRequests || 1)) * 100).toFixed(0)}%`
            : undefined}
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
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="text-left py-3 uppercase text-sm font-bold">Time</th>
                    <th className="text-left py-3 uppercase text-sm font-bold">Path</th>
                    <th className="text-right py-3 uppercase text-sm font-bold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentActivity.map((activity, idx) => (
                    <ActivityRow key={idx} time={activity.time} path={activity.path} amount={activity.amount} />
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-center">
                <a href="/dashboard/requests" className="neo-button neo-button-sage inline-block">
                  View All Requests →
                </a>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg font-bold mb-2">No Activity Yet</p>
              <p className="text-sm opacity-60">Requests will appear here once crawlers start accessing your content.</p>
            </div>
          )}
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
