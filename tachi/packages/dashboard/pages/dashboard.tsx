import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Sample data
const metricsData = {
  range: {
    from: "2025-08-20T00:00:00Z",
    to: "2025-08-27T23:59:59Z",
    interval: "hour"
  },
  kpis: {
    usdc: { value: 812.77, delta: 0.18 },
    paid_crawls: { value: 4217, delta: 0.12 },
    verify_ms: { p50: 3200, p95: 8900 },
    avg_price_per_crawl: { value: 0.0019, delta: 0.05 }
  },
  series: [
    { t: "2025-08-27T08:00:00Z", paid_crawls: 72, usdc: 0.95, arpc: 0.0013 },
    { t: "2025-08-27T09:00:00Z", paid_crawls: 81, usdc: 1.08, arpc: 0.0015 },
    { t: "2025-08-27T10:00:00Z", paid_crawls: 85, usdc: 1.12, arpc: 0.0017 },
    { t: "2025-08-27T11:00:00Z", paid_crawls: 104, usdc: 1.38, arpc: 0.0019 },
    { t: "2025-08-27T12:00:00Z", paid_crawls: 118, usdc: 1.55, arpc: 0.0021 },
    { t: "2025-08-27T13:00:00Z", paid_crawls: 132, usdc: 1.72, arpc: 0.0020 },
    { t: "2025-08-27T14:00:00Z", paid_crawls: 145, usdc: 1.89, arpc: 0.0018 },
    { t: "2025-08-27T15:00:00Z", paid_crawls: 128, usdc: 1.65, arpc: 0.0019 }
  ],
  leaderboards: {
    domains: [
      { path: "/premium/articles/tech-analysis", usdc: 312.5, crawls: 902 },
      { path: "/api/market-data/realtime", usdc: 221.9, crawls: 610 },
      { path: "/reports/financial/quarterly", usdc: 189.3, crawls: 445 },
      { path: "/data/climate/temperature", usdc: 156.7, crawls: 578 },
      { path: "/content/research/ai-trends", usdc: 134.2, crawls: 387 },
      { path: "/insights/market/crypto", usdc: 98.4, crawls: 312 }
    ],
    crawlers: [
      { crawler: "news.example.com", usdc: 180.2, success_rate: 0.94, last_seen: "2025-08-27T14:05:00Z" },
      { crawler: "finance.example.com", usdc: 150.8, success_rate: 0.91, last_seen: "2025-08-27T13:58:00Z" },
      { crawler: "analytics.company.com", usdc: 142.3, success_rate: 0.96, last_seen: "2025-08-27T14:12:00Z" },
      { crawler: "data.research.org", usdc: 128.9, success_rate: 0.89, last_seen: "2025-08-27T14:01:00Z" },
      { crawler: "api.trading.net", usdc: 115.6, success_rate: 0.92, last_seen: "2025-08-27T13:45:00Z" },
      { crawler: "premium.insights.io", usdc: 95.3, success_rate: 0.88, last_seen: "2025-08-27T13:30:00Z" }
    ]
  },
  events: [
    { ts: "2025-08-27T14:02:11Z", domain: "news.example.com", url: "/premium/aapl-q3", crawler: "0xC3...9D2", amount: 0.0021, status: "200" },
    { ts: "2025-08-27T14:00:28Z", domain: "finance.example.com", url: "/reports/cpi-july-2025", crawler: "0xAB...71E", amount: 0.0000, status: "402" },
    { ts: "2025-08-27T13:58:45Z", domain: "analytics.company.com", url: "/dashboard/real-time", crawler: "0x7F...48C", amount: 0.0019, status: "200" },
    { ts: "2025-08-27T13:57:12Z", domain: "data.research.org", url: "/climate-data/temperature-trends", crawler: "0x2E...65A", amount: 0.0000, status: "blocked" },
    { ts: "2025-08-27T13:55:33Z", domain: "api.trading.net", url: "/real-time-quotes/crypto", crawler: "0x9A...23B", amount: 0.0024, status: "200" },
    { ts: "2025-08-27T13:54:07Z", domain: "premium.insights.io", url: "/market-analysis/sectors", crawler: "0xC3...9D2", amount: 0.0018, status: "200" },
    { ts: "2025-08-27T13:52:15Z", domain: "research.platform.net", url: "/data/trends", crawler: "0x1F...8C4", amount: 0.0022, status: "200" }
  ]
};

// GridBox Component
interface GridBoxProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  borderStyle?: React.CSSProperties;
}

const GridBox: React.FC<GridBoxProps> = ({ title, children, className = '', borderStyle = {} }) => (
  <div className={`p-3 lg:p-4 h-full ${className}`} style={{ 
    backgroundColor: '#FAF9F6',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#FF7043',
    boxSizing: 'border-box',
    ...borderStyle
  }}>
    {title && (
      <h3 style={{ 
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#52796F',
        letterSpacing: '0.02em'
      }} className="text-xs font-bold uppercase tracking-wider mb-3">
        {title}
      </h3>
    )}
    <div className="h-full">
      {children}
    </div>
  </div>
);

// Main Dashboard Component
export default function TachiDashboard() {
  const router = useRouter();
  const [activeRange, setActiveRange] = useState('7d');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const calculateArrowRotation = (elementX: number, elementY: number) => {
    const deltaX = mousePosition.x - elementX;
    const deltaY = mousePosition.y - elementY;
    return Math.atan2(deltaY, deltaX) * (180 / Math.PI);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '200':
        return 'text-green-600 bg-green-50';
      case '402':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-red-600 bg-red-50';
    }
  };

  return (
    <div>
      {/* Header Navigation */}
      <div className="border-b-2 border-[#FF7043]" style={{ backgroundColor: '#FAF9F6' }}>
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center justify-between h-16">
            <div className="text-[#52796F] font-medium text-lg">
              tachi
            </div>
            <div className="hidden md:flex space-x-8 text-[#52796F] font-medium uppercase">
              <a href="/docs" className="hover:underline">DOCS</a>
              <a href="/dashboard" className="hover:underline">DASHBOARD</a>
            </div>
          </nav>
        </div>
      </div>
      
      <div className="min-h-screen p-4 lg:p-8" style={{ backgroundColor: '#FAF9F6' }}>
        <div className="max-w-7xl mx-auto">
        
        {/* 5-column table layout with sidebar and larger events section */}
        <div className="grid" style={{
          gridTemplateColumns: '120px 1fr 1fr 1fr 1fr',
          gridTemplateRows: '160px 160px 160px 160px 160px 320px',
          gridTemplateAreas: `
            "sidebar controls usdc price placeholder1"
            "sidebar paid-crawls revenue revenue revenue"
            "sidebar latency domains domains domains"
            "sidebar placeholder2 crawlers crawlers crawlers"
            "sidebar placeholder2 arpc arpc arpc"
            "sidebar events events events events"
          `,
          gap: '0px'
        }}>
          
          {/* Sidebar Navigation */}
          <div style={{ gridArea: 'sidebar' }}>
            <GridBox title="Navigation" className="h-full" borderStyle={{}}>
              <div className="h-full flex flex-col justify-start" style={{ padding: '8px 0' }}>
                <div className="flex flex-col space-y-2">
                  <div 
                    className="transition-colors rounded cursor-pointer"
                    style={{
                      fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontSize: '10px',
                      padding: '6px 8px',
                      backgroundColor: '#52796F',
                      color: 'white',
                      fontWeight: '600'
                    }}
                  >
                    Dashboard
                  </div>
                  <div 
                    className="transition-colors rounded cursor-pointer hover:bg-gray-100"
                    style={{
                      fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontSize: '10px',
                      padding: '6px 8px',
                      color: '#666'
                    }}
                    onClick={() => router.push('/domains')}
                  >
                    Domains
                  </div>
                  <div 
                    className="transition-colors rounded cursor-pointer hover:bg-gray-100"
                    style={{
                      fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontSize: '10px',
                      padding: '6px 8px',
                      color: '#666'
                    }}
                    onClick={() => router.push('/license')}
                  >
                    License
                  </div>
                  <div 
                    className="transition-colors rounded cursor-pointer hover:bg-gray-100"
                    style={{
                      fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontSize: '10px',
                      padding: '6px 8px',
                      color: '#666'
                    }}
                    onClick={() => router.push('/keys')}
                  >
                    Keys & Wallets
                  </div>
                  <div 
                    className="transition-colors rounded cursor-pointer hover:bg-gray-100"
                    style={{
                      fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontSize: '10px',
                      padding: '6px 8px',
                      color: '#666'
                    }}
                    onClick={() => router.push('/monitoring')}
                  >
                    Monitoring
                  </div>
                  <div 
                    className="transition-colors rounded cursor-pointer hover:bg-gray-100"
                    style={{
                      fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontSize: '10px',
                      padding: '6px 8px',
                      color: '#666'
                    }}
                    onClick={() => router.push('/team')}
                  >
                    Team
                  </div>
                  <div 
                    className="transition-colors rounded cursor-pointer hover:bg-gray-100"
                    style={{
                      fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontSize: '10px',
                      padding: '6px 8px',
                      color: '#666'
                    }}
                    onClick={() => router.push('/settings')}
                  >
                    Settings
                  </div>
                </div>
              </div>
            </GridBox>
          </div>

          {/* Row 1 - Time Range */}
          <div style={{ gridArea: 'controls' }}>
            <GridBox title="" className="h-full" borderStyle={{ borderLeft: 'none' }}>
              <div className="h-full flex flex-col justify-center items-center" style={{ padding: '4px 0' }}>
                <div className="flex flex-col space-y-1 items-center" style={{ width: '100%' }}>
                  <div className="flex flex-col space-y-1 items-center" style={{ width: '100%' }}>
                    {['Today', '7d', '30d'].map((range) => (
                      <button
                        key={range}
                        onClick={() => setActiveRange(range)}
                        style={{
                          fontSize: '8px',
                          minHeight: '16px',
                          width: '180px',
                          padding: '2px 8px',
                          backgroundColor: '#FAF9F6',
                          color: activeRange === range ? '#52796F' : '#666',
                          border: `1px solid ${activeRange === range ? '#52796F' : '#52796F'}`,
                          borderRadius: '0px',
                          fontFamily: '"Coinbase Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          fontWeight: activeRange === range ? 'bold' : 'normal',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          opacity: activeRange === range ? 1 : 0.8
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.backgroundColor = activeRange === range ? '#f0fdf4' : '#f9f9f9';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.opacity = activeRange === range ? '1' : '0.8';
                          e.currentTarget.style.backgroundColor = '#FAF9F6';
                        }}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </GridBox>
          </div>

          {/* Row 1 - USDC Earned */}
          <div style={{ gridArea: 'usdc' }}>
            <GridBox title="USDC Earned" className="h-full" borderStyle={{ borderLeft: 'none' }}>
              <div className="h-full flex flex-col justify-center py-2">
                <div style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }} 
                     className="text-xl lg:text-2xl font-bold mb-1">
                  ${metricsData.kpis.usdc.value.toLocaleString()}
                </div>
                <div style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }} 
                     className="flex items-center text-xs lg:text-sm text-green-600">
                  <span className="mr-1">↗</span>
                  <span>{(metricsData.kpis.usdc.delta * 100).toFixed(1)}%</span>
                </div>
              </div>
            </GridBox>
          </div>

          {/* Row 1 - Avg Price Per Crawl */}
          <div style={{ gridArea: 'price' }}>
            <GridBox title="Avg Price/Crawl" className="h-full" borderStyle={{ borderLeft: 'none' }}>
              <div className="h-full flex flex-col justify-center py-2">
                <div style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }} 
                     className="text-xl lg:text-2xl font-bold mb-1">
                  ${metricsData.kpis.avg_price_per_crawl.value.toFixed(4)}
                </div>
                <div style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }} 
                     className="flex items-center text-xs lg:text-sm text-green-600">
                  <span className="mr-1">↗</span>
                  <span>{(metricsData.kpis.avg_price_per_crawl.delta * 100).toFixed(1)}%</span>
                </div>
              </div>
            </GridBox>
          </div>

          {/* Row 1 - Tachi Logo */}
          <div style={{ gridArea: 'placeholder1' }}>
            <GridBox title="" className="h-full" borderStyle={{ borderLeft: 'none' }}>
              <div className="h-full flex flex-col justify-center items-center py-2">
                <div className="flex items-center justify-center">
                  <img 
                    src="/images/tachi-logo.svg"
                    alt="Tachi Protocol Logo"
                    width="192"
                    height="192"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              </div>
            </GridBox>
          </div>

          {/* Row 2 - Paid Crawls */}
          <div style={{ gridArea: 'paid-crawls' }}>
            <GridBox title="Paid Crawls" className="h-full" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
              <div className="h-full flex flex-col justify-center py-2">
                <div style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }} 
                     className="text-xl lg:text-2xl font-bold mb-1">
                  {metricsData.kpis.paid_crawls.value.toLocaleString()}
                </div>
                <div style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }} 
                     className="flex items-center text-xs lg:text-sm text-green-600">
                  <span className="mr-1">↗</span>
                  <span>{(metricsData.kpis.paid_crawls.delta * 100).toFixed(1)}%</span>
                </div>
              </div>
            </GridBox>
          </div>

          {/* Row 2 - Revenue Chart */}
          <div style={{ gridArea: 'revenue' }}>
            <GridBox title="Revenue" className="h-full" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
              <div className="h-full flex flex-col py-1" style={{ minHeight: '100px' }}>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metricsData.series.map(item => ({
                      time: new Date(item.t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                      'USDC': item.usdc,
                    }))}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF7043" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#FF7043" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="time" 
                        tick={{ 
                          fontSize: 10, 
                          fill: '#999',
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}
                        axisLine={false}
                        tickLine={false}
                        interval={Math.floor((metricsData.series.length - 1) / 5)}
                        tickFormatter={(value) => {
                          // Hide the first tick (leftmost/origin)
                          const index = metricsData.series.findIndex(item => 
                            new Date(item.t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) === value
                          );
                          return index === 0 ? '' : value;
                        }}
                      />
                      <YAxis 
                        tick={{ 
                          fontSize: 10, 
                          fill: '#999',
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}
                        axisLine={false}
                        tickLine={false}
                        width={30}
                        tickFormatter={(value) => {
                          return value === 0 ? '' : Math.round(value).toString();
                        }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#F8F4E6', 
                          border: '1px solid #FF7043', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}
                        formatter={(value) => [`$${Number(value).toFixed(2)}`, 'USDC Revenue']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="USDC" 
                        stroke="#FF7043" 
                        strokeWidth={3}
                        fill="url(#revenueGradient)"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </GridBox>
          </div>

          {/* Row 3 - Latency */}
          <div style={{ gridArea: 'latency' }}>
            <GridBox title="Verify Latency" className="h-full" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
              <div className="h-full flex flex-col justify-center py-2">
                <div style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }} 
                     className="text-xl lg:text-2xl font-bold">
                  {metricsData.kpis.verify_ms.p50}ms
                </div>
              </div>
            </GridBox>
          </div>

          {/* Row 3 - Top Domains */}
          <div style={{ gridArea: 'domains' }}>
            <GridBox title="Top Domains" className="h-full" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
              <div className="h-full flex flex-col py-2">
                <div className="flex-1 space-y-4 overflow-y-auto">
                  {metricsData.leaderboards.domains.slice(0, 3).map((domain, index) => (
                    <div key={domain.path} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <span style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }} 
                              className="text-sm text-gray-500 flex-shrink-0">
                          {index + 1}
                        </span>
                        <span style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }} 
                              className="text-sm truncate">
                          {domain.path}
                        </span>
                      </div>
                      <div style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }} 
                           className="text-sm font-semibold flex-shrink-0 ml-4">
                        ${domain.usdc.toFixed(0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GridBox>
          </div>

          {/* Row 4-5 - Interactive Arrows */}
          <div style={{ gridArea: 'placeholder2' }}>
            <GridBox title="" className="h-full" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
              <div className="h-full flex flex-col justify-center items-center">
                <div className="flex flex-col space-y-12">
                  {/* Arrow 1 */}
                  <div 
                    className="w-24 h-24 flex items-center justify-center transition-transform duration-75"
                    style={{ 
                      transform: `rotate(${calculateArrowRotation(400, 300)}deg)`,
                      transformOrigin: 'center'
                    }}
                  >
                    <svg width="96" height="96" viewBox="0 0 24 24" fill="none">
                      <path 
                        d="M7 17L17 7M17 7H9M17 7V15" 
                        stroke="#FF7043" 
                        strokeWidth="0.25" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  
                  {/* Arrow 2 */}
                  <div 
                    className="w-24 h-24 flex items-center justify-center transition-transform duration-75"
                    style={{ 
                      transform: `rotate(${calculateArrowRotation(400, 500)}deg)`,
                      transformOrigin: 'center'
                    }}
                  >
                    <svg width="96" height="96" viewBox="0 0 24 24" fill="none">
                      <path 
                        d="M7 17L17 7M17 7H9M17 7V15" 
                        stroke="#FF7043" 
                        strokeWidth="0.25" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </GridBox>
          </div>

          {/* Row 4 - Top Crawlers */}
          <div style={{ gridArea: 'crawlers' }}>
            <GridBox title="Top Crawlers" className="h-full" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
              <div className="h-full flex flex-col py-2">
                <div className="flex-1 space-y-3">
                  {metricsData.leaderboards.crawlers.slice(0, 3).map((crawler, index) => (
                    <div key={crawler.crawler} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <span style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }} 
                              className="text-sm text-gray-500 flex-shrink-0">
                          {index + 1}
                        </span>
                        <span style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }} 
                              className="text-sm truncate">
                          {crawler.crawler}
                        </span>
                      </div>
                      <div style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }} 
                           className="text-sm font-semibold flex-shrink-0 ml-4">
                        ${crawler.usdc.toFixed(0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GridBox>
          </div>

          {/* Row 5 - ARPC Trend */}
          <div style={{ gridArea: 'arpc' }}>
            <GridBox title="Average Revenue Per Crawl" className="h-full" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
              <div className="h-full flex flex-col py-2">
                <div className="flex-1" style={{ minHeight: '100px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={metricsData.series.map(item => ({
                        time: new Date(item.t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                        'ARPC': item.arpc,
                      }))}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="arpcGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#52796F" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#52796F" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="time" 
                        tick={{ 
                          fontSize: 10, 
                          fill: '#999',
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}
                        axisLine={false}
                        tickLine={false}
                        interval={Math.floor((metricsData.series.length - 1) / 5)}
                        tickFormatter={(value) => {
                          // Hide the first tick (leftmost/origin)
                          const index = metricsData.series.findIndex(item => 
                            new Date(item.t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) === value
                          );
                          return index === 0 ? '' : value;
                        }}
                      />
                      <YAxis 
                        tick={{ 
                          fontSize: 10, 
                          fill: '#999',
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                        domain={['dataMin - 0.0001', 'dataMax + 0.0001']}
                        tickFormatter={(value) => {
                          if (value === 0) return '';
                          const rounded = Math.round(value * 10000);
                          return rounded === 0 ? '' : rounded.toString();
                        }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#F8F4E6', 
                          border: '1px solid #52796F', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}
                        formatter={(value) => [`$${Number(value).toFixed(4)}`, 'ARPC']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="ARPC" 
                        stroke="#52796F" 
                        strokeWidth={3}
                        fill="url(#arpcGradient)"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </GridBox>
          </div>

          {/* Row 6 - Recent Events */}
          <div style={{ gridArea: 'events' }}>
            <GridBox title="Recent Events" className="h-full" borderStyle={{ borderLeft: 'none', borderTop: 'none' }}>
              <div className="h-full flex flex-col overflow-hidden py-1">
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0" style={{ backgroundColor: '#FAF9F6' }}>
                      <tr className="border-b border-gray-200">
                        <th style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }} 
                            className="text-left font-medium text-gray-700 pb-2 text-xs">Time</th>
                        <th style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }} 
                            className="text-left font-medium text-gray-700 pb-2 text-xs">Domain</th>
                        <th style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }} 
                            className="text-left font-medium text-gray-700 pb-2 text-xs">URL</th>
                        <th style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }} 
                            className="text-left font-medium text-gray-700 pb-2 text-xs">Crawler</th>
                        <th style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }} 
                            className="text-right font-medium text-gray-700 pb-2 text-xs">Amount</th>
                        <th style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }} 
                            className="text-center font-medium text-gray-700 pb-2 text-xs">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metricsData.events.slice(0, 5).map((event, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }} 
                              className="py-3 text-xs">
                            {formatTime(event.ts)}
                          </td>
                          <td style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }} 
                              className="py-3 text-xs truncate max-w-20">
                            {event.domain}
                          </td>
                          <td style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }} 
                              className="py-3 text-xs truncate max-w-24">
                            {event.url}
                          </td>
                          <td style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }} 
                              className="py-3 text-xs">
                            {event.crawler}
                          </td>
                          <td style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#FF7043' }} 
                              className="py-3 text-xs text-right">
                            ${event.amount.toFixed(4)}
                          </td>
                          <td className="py-3 text-center">
                            <span style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }} 
                                  className={`px-2 py-0.5 rounded text-xs ${getStatusColor(event.status)}`}>
                              {event.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </GridBox>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}