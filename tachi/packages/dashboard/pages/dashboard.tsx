import * as React from "react";

function Dashboard() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAF9F6',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: '#FAF9F6',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img 
              src="/plasmic/tachi_landing_page/images/image2.svg"
              alt="Tachi Logo"
              style={{ height: '32px', width: 'auto' }}
            />
            <div>
              <h1 style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                margin: '0',
                color: '#066D5A' 
              }}>
                Hello, Publisher!
              </h1>
              <p style={{ 
                margin: '0', 
                fontSize: '14px', 
                color: '#666' 
              }}>
                Monitor your content protection and earnings
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#066D5A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600'
            }}>
              P
            </div>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '24px',
        display: 'flex',
        gap: '24px'
      }}>
        {/* Sidebar */}
        <div style={{
          width: '200px',
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          height: 'fit-content',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <nav>
            <div style={{
              padding: '12px',
              background: '#066D5A',
              color: 'white',
              borderRadius: '8px',
              marginBottom: '8px',
              fontWeight: '500'
            }}>
              📊 Dashboard
            </div>
            <div style={{
              padding: '12px',
              color: '#666',
              borderRadius: '8px',
              marginBottom: '8px',
              cursor: 'pointer'
            }}>
              📝 Content
            </div>
            <div style={{
              padding: '12px',
              color: '#666',
              borderRadius: '8px',
              marginBottom: '8px',
              cursor: 'pointer'
            }}>
              �� Licenses
            </div>
            <div style={{
              padding: '12px',
              color: '#666',
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              ⚙️ Settings
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div style={{ flex: '1' }}>
          {/* Top 4 Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {/* Total Revenue */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ 
                fontSize: '14px', 
                color: '#666', 
                marginBottom: '8px' 
              }}>
                Total Revenue
              </div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                color: '#066D5A' 
              }}>
                $12,450
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#22c55e' 
              }}>
                +15.3% from last month
              </div>
            </div>

            {/* Average Revenue Per Action */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ 
                fontSize: '14px', 
                color: '#666', 
                marginBottom: '8px' 
              }}>
                Average Revenue Per Action
              </div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                color: '#066D5A' 
              }}>
                $0.023
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#22c55e' 
              }}>
                +8.1% from last week
              </div>
            </div>

            {/* Total Crawls */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ 
                fontSize: '14px', 
                color: '#666', 
                marginBottom: '8px' 
              }}>
                Total Crawls
              </div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                color: '#066D5A' 
              }}>
                541,250
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#22c55e' 
              }}>
                +12.4% from yesterday
              </div>
            </div>

            {/* Top Agents/Consumers */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ 
                fontSize: '14px', 
                color: '#666', 
                marginBottom: '8px' 
              }}>
                Top Agents/Consumers
              </div>
              <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ fontWeight: '500', color: '#066D5A' }}>1. AI-Crawler-Pro</span>
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ fontWeight: '500', color: '#066D5A' }}>2. DataHarvest-Bot</span>
                </div>
                <div>
                  <span style={{ fontWeight: '500', color: '#066D5A' }}>3. ContentMiner-3</span>
                </div>
              </div>
            </div>
          </div>

          {/* Second Row: Revenue Chart + Top Performing Content */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {/* Revenue Trend Chart */}
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                margin: '0 0 16px 0',
                color: '#066D5A'
              }}>
                Revenue Trend Over Time
              </h3>
              <div style={{
                height: '200px',
                background: '#f8f9fa',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                fontSize: '14px'
              }}>
                📈 Revenue chart visualization
                <br />
                <small>(Interactive chart showing daily/weekly revenue trends)</small>
              </div>
            </div>

            {/* Top Performing Content */}
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                margin: '0 0 16px 0',
                color: '#066D5A'
              }}>
                Top Performing Content
              </h3>
              <div style={{ fontSize: '14px' }}>
                <div style={{ 
                  padding: '12px 0', 
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ color: '#333' }}>/api/articles/web3-guide</span>
                  <span style={{ color: '#066D5A', fontWeight: '500' }}>2,847 hits</span>
                </div>
                <div style={{ 
                  padding: '12px 0', 
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ color: '#333' }}>/content/smart-contracts</span>
                  <span style={{ color: '#066D5A', fontWeight: '500' }}>2,341 hits</span>
                </div>
                <div style={{ 
                  padding: '12px 0', 
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ color: '#333' }}>/api/tutorials/defi-basics</span>
                  <span style={{ color: '#066D5A', fontWeight: '500' }}>1,923 hits</span>
                </div>
                <div style={{ 
                  padding: '12px 0', 
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ color: '#333' }}>/docs/nft-marketplace</span>
                  <span style={{ color: '#066D5A', fontWeight: '500' }}>1,756 hits</span>
                </div>
                <div style={{ 
                  padding: '12px 0',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ color: '#333' }}>/api/data/blockchain-metrics</span>
                  <span style={{ color: '#066D5A', fontWeight: '500' }}>1,432 hits</span>
                </div>
              </div>
              <div style={{ 
                marginTop: '12px', 
                fontSize: '12px', 
                color: '#666' 
              }}>
                Most frequently accessed URLs and API endpoints showing digital asset demand
              </div>
            </div>
          </div>

          {/* Recent Activity - Full Width */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                margin: '0',
                color: '#066D5A'
              }}>
                Recent Activity - Real Time Feed
              </h3>
            </div>
            <div style={{ padding: '0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{
                      padding: '12px 24px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#666',
                      textTransform: 'uppercase'
                    }}>
                      Time
                    </th>
                    <th style={{
                      padding: '12px 24px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#666',
                      textTransform: 'uppercase'
                    }}>
                      Agent
                    </th>
                    <th style={{
                      padding: '12px 24px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#666',
                      textTransform: 'uppercase'
                    }}>
                      Action
                    </th>
                    <th style={{
                      padding: '12px 24px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#666',
                      textTransform: 'uppercase'
                    }}>
                      Resource
                    </th>
                    <th style={{
                      padding: '12px 24px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#666',
                      textTransform: 'uppercase'
                    }}>
                      Payment
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '16px 24px', color: '#666' }}>
                      10:32 AM
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ fontWeight: '500', color: '#066D5A' }}>AI-Crawler-3</span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        background: '#22c55e',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        Crawl Access
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontFamily: 'monospace', fontSize: '13px' }}>
                      /article/xyz
                    </td>
                    <td style={{ padding: '16px 24px', fontWeight: '500', color: '#066D5A' }}>
                      0.001 USDC
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '16px 24px', color: '#666' }}>
                      10:31 AM
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ fontWeight: '500', color: '#066D5A' }}>DataHarvest-Bot</span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        background: '#3b82f6',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        API Call
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontFamily: 'monospace', fontSize: '13px' }}>
                      /api/articles/web3-guide
                    </td>
                    <td style={{ padding: '16px 24px', fontWeight: '500', color: '#066D5A' }}>
                      0.0025 USDC
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '16px 24px', color: '#666' }}>
                      10:29 AM
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ fontWeight: '500', color: '#066D5A' }}>ContentMiner-3</span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        background: '#22c55e',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        Crawl Access
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontFamily: 'monospace', fontSize: '13px' }}>
                      /content/smart-contracts
                    </td>
                    <td style={{ padding: '16px 24px', fontWeight: '500', color: '#066D5A' }}>
                      0.0015 USDC
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '16px 24px', color: '#666' }}>
                      10:28 AM
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ fontWeight: '500', color: '#066D5A' }}>AI-Scraper-Alpha</span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        background: '#f59e0b',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        Rate Limited
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontFamily: 'monospace', fontSize: '13px' }}>
                      /api/tutorials/defi-basics
                    </td>
                    <td style={{ padding: '16px 24px', color: '#666' }}>
                      -
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '16px 24px', color: '#666' }}>
                      10:26 AM
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ fontWeight: '500', color: '#066D5A' }}>NewsBot-Enterprise</span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        background: '#3b82f6',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        API Call
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontFamily: 'monospace', fontSize: '13px' }}>
                      /docs/nft-marketplace
                    </td>
                    <td style={{ padding: '16px 24px', fontWeight: '500', color: '#066D5A' }}>
                      0.002 USDC
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
