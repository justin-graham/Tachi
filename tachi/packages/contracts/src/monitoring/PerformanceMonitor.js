"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMonitor = void 0;
exports.createMonitoringServer = createMonitoringServer;
const crypto_1 = require("crypto");
class PerformanceMonitor {
    constructor(monitor) {
        this.metrics = new Map();
        this.alertCounts = { critical: 0, high: 0, medium: 0, low: 0 };
        this.recentAlerts = [];
        this.systemStartTime = Date.now();
        this.monitor = monitor;
        this.startMetricsCollection();
    }
    /**
     * Start collecting performance metrics
     */
    startMetricsCollection() {
        // Collect system metrics every 30 seconds
        setInterval(() => {
            this.collectSystemMetrics();
        }, 30000);
        // Collect network metrics every minute
        setInterval(() => {
            this.collectNetworkMetrics();
        }, 60000);
        // Clean old metrics every hour
        setInterval(() => {
            this.cleanOldMetrics();
        }, 3600000);
    }
    /**
     * Collect system performance metrics
     */
    collectSystemMetrics() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        // Store memory metrics
        this.addMetric('memory_rss', memUsage.rss / 1024 / 1024); // MB
        this.addMetric('memory_heap', memUsage.heapUsed / 1024 / 1024); // MB
        // Store CPU metrics (convert to percentage)
        const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
        this.addMetric('cpu_usage', cpuPercent);
    }
    /**
     * Collect network performance metrics
     */
    async collectNetworkMetrics() {
        try {
            const startTime = Date.now();
            // Mock network call - replace with actual network metrics collection
            // const blockNumber = await this.monitor.provider.getBlockNumber();
            // const feeData = await this.monitor.provider.getFeeData();
            const responseTime = Date.now() - startTime;
            this.addMetric('network_response_time', responseTime);
            // Mock gas price - replace with actual data
            this.addMetric('gas_price', Math.random() * 20 + 10); // 10-30 gwei
        }
        catch (error) {
            console.error('❌ Failed to collect network metrics:', error);
            this.addMetric('network_errors', 1);
        }
    }
    /**
     * Add a metric data point
     */
    addMetric(name, value) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        const values = this.metrics.get(name);
        values.push(value);
        // Keep only last 1000 data points
        if (values.length > 1000) {
            values.splice(0, values.length - 1000);
        }
    }
    /**
     * Clean old metrics data
     */
    cleanOldMetrics() {
        console.log('🧹 Cleaning old metrics data...');
        for (const [name, values] of this.metrics.entries()) {
            // Keep only last 100 data points for long-term storage
            if (values.length > 100) {
                const recent = values.slice(-100);
                this.metrics.set(name, recent);
            }
        }
    }
    /**
     * Get average value for a metric
     */
    getMetricAverage(name, samples = 10) {
        const values = this.metrics.get(name);
        if (!values || values.length === 0)
            return 0;
        const recent = values.slice(-samples);
        return recent.reduce((sum, val) => sum + val, 0) / recent.length;
    }
    /**
     * Get latest value for a metric
     */
    getMetricLatest(name) {
        const values = this.metrics.get(name);
        if (!values || values.length === 0)
            return 0;
        return values[values.length - 1];
    }
    /**
     * Record an alert for dashboard display
     */
    recordAlert(severity, type, description) {
        this.alertCounts[severity] = (this.alertCounts[severity] || 0) + 1;
        this.recentAlerts.unshift({
            id: this.generateId(),
            severity,
            type,
            description,
            timestamp: Date.now()
        });
        // Keep only last 50 alerts
        this.recentAlerts = this.recentAlerts.slice(0, 50);
    }
    /**
     * Get comprehensive dashboard data
     */
    getDashboardData() {
        const uptime = Date.now() - this.systemStartTime;
        const memUsage = process.memoryUsage();
        // Determine system health status
        const avgMemory = this.getMetricAverage('memory_heap');
        const avgResponseTime = this.getMetricAverage('network_response_time');
        const criticalAlerts = this.alertCounts.critical || 0;
        let systemStatus = 'healthy';
        if (criticalAlerts > 0 || avgMemory > 500 || avgResponseTime > 2000) {
            systemStatus = 'critical';
        }
        else if (avgMemory > 200 || avgResponseTime > 1000) {
            systemStatus = 'warning';
        }
        return {
            systemHealth: {
                status: systemStatus,
                uptime: Math.floor(uptime / 1000), // seconds
                memoryUsage: memUsage,
                lastUpdate: Date.now()
            },
            networkMetrics: {
                blockHeight: Math.floor(Math.random() * 1000000) + 5000000, // Mock data
                gasPrice: this.getMetricLatest('gas_price'),
                rpcResponseTime: this.getMetricLatest('network_response_time'),
                networkStatus: avgResponseTime < 1000 ? 'online' : avgResponseTime < 3000 ? 'degraded' : 'offline'
            },
            contractMetrics: {
                multiSigTransactions: Math.floor(Math.random() * 100), // Mock data
                paymentsProcessed: Math.floor(Math.random() * 1000),
                licensesIssued: Math.floor(Math.random() * 500),
                activeAlerts: this.recentAlerts.length
            },
            alertsSummary: {
                critical: this.alertCounts.critical || 0,
                high: this.alertCounts.high || 0,
                medium: this.alertCounts.medium || 0,
                low: this.alertCounts.low || 0,
                recent: this.recentAlerts.slice(0, 10) // Last 10 alerts
            },
            performanceMetrics: {
                averageResponseTime: this.getMetricAverage('network_response_time'),
                throughput: Math.floor(Math.random() * 1000) + 500, // Mock data
                errorRate: Math.random() * 2, // 0-2% error rate
                availability: 99.9 - (Math.random() * 0.8) // 99.1-99.9% availability
            }
        };
    }
    /**
     * Get historical metrics for charts
     */
    getHistoricalMetrics(metricName, samples = 50) {
        const values = this.metrics.get(metricName);
        if (!values || values.length === 0)
            return [];
        return values.slice(-samples);
    }
    /**
     * Generate a unique ID
     */
    generateId() {
        return (0, crypto_1.createHash)('sha256')
            .update(`${Date.now()}_${Math.random()}`)
            .digest('hex')
            .substring(0, 8);
    }
    /**
     * Express middleware for dashboard API
     */
    getDashboardMiddleware() {
        return {
            // Main dashboard data endpoint
            dashboard: (req, res) => {
                try {
                    const data = this.getDashboardData();
                    res.json({
                        success: true,
                        data,
                        timestamp: Date.now()
                    });
                }
                catch (error) {
                    res.status(500).json({
                        success: false,
                        error: 'Failed to fetch dashboard data',
                        timestamp: Date.now()
                    });
                }
            },
            // Historical metrics endpoint
            metrics: (req, res) => {
                try {
                    const { metric, samples } = req.query;
                    const metricName = metric;
                    const sampleCount = samples ? parseInt(samples) : 50;
                    const data = this.getHistoricalMetrics(metricName, sampleCount);
                    res.json({
                        success: true,
                        metric: metricName,
                        data,
                        samples: data.length,
                        timestamp: Date.now()
                    });
                }
                catch (error) {
                    res.status(500).json({
                        success: false,
                        error: 'Failed to fetch metrics data',
                        timestamp: Date.now()
                    });
                }
            },
            // System health endpoint
            health: (req, res) => {
                try {
                    const data = this.getDashboardData();
                    res.json({
                        success: true,
                        status: data.systemHealth.status,
                        uptime: data.systemHealth.uptime,
                        memoryUsage: data.systemHealth.memoryUsage,
                        networkStatus: data.networkMetrics.networkStatus,
                        timestamp: Date.now()
                    });
                }
                catch (error) {
                    res.status(500).json({
                        success: false,
                        error: 'Health check failed',
                        timestamp: Date.now()
                    });
                }
            },
            // Alerts endpoint
            alerts: (req, res) => {
                try {
                    const data = this.getDashboardData();
                    res.json({
                        success: true,
                        alerts: data.alertsSummary,
                        timestamp: Date.now()
                    });
                }
                catch (error) {
                    res.status(500).json({
                        success: false,
                        error: 'Failed to fetch alerts',
                        timestamp: Date.now()
                    });
                }
            }
        };
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
/**
 * Express server setup for monitoring dashboard
 */
function createMonitoringServer(performanceMonitor, port = 3001) {
    const express = require('express');
    const cors = require('cors');
    const app = express();
    // Middleware
    app.use(cors());
    app.use(express.json());
    // Dashboard API routes
    const middleware = performanceMonitor.getDashboardMiddleware();
    app.get('/api/dashboard', middleware.dashboard);
    app.get('/api/metrics', middleware.metrics);
    app.get('/api/health', middleware.health);
    app.get('/api/alerts', middleware.alerts);
    // Static dashboard HTML (simple example)
    app.get('/', (req, res) => {
        res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tachi Protocol - Monitoring Dashboard</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
          .container { max-width: 1200px; margin: 0 auto; }
          .card { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .metric { display: inline-block; margin: 10px; padding: 10px; background: #e3f2fd; border-radius: 4px; }
          .critical { background: #ffebee; border-left: 4px solid #f44336; }
          .warning { background: #fff3e0; border-left: 4px solid #ff9800; }
          .healthy { background: #e8f5e8; border-left: 4px solid #4caf50; }
          h1, h2 { color: #333; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🛡️ Tachi Protocol Monitoring Dashboard</h1>
          
          <div class="card">
            <h2>System Status</h2>
            <div id="system-status">Loading...</div>
          </div>
          
          <div class="card">
            <h2>Recent Alerts</h2>
            <div id="alerts-list">Loading...</div>
          </div>
          
          <div class="card">
            <h2>Performance Metrics</h2>
            <div id="metrics-display">Loading...</div>
          </div>
        </div>

        <script>
          async function loadDashboard() {
            try {
              const response = await fetch('/api/dashboard');
              const result = await response.json();
              
              if (result.success) {
                updateSystemStatus(result.data.systemHealth);
                updateAlerts(result.data.alertsSummary);
                updateMetrics(result.data.performanceMetrics);
              }
            } catch (error) {
              console.error('Failed to load dashboard:', error);
            }
          }
          
          function updateSystemStatus(health) {
            const statusEl = document.getElementById('system-status');
            const statusClass = health.status === 'healthy' ? 'healthy' : 
                               health.status === 'warning' ? 'warning' : 'critical';
            
            statusEl.innerHTML = \`
              <div class="\${statusClass}">
                <h3>Status: \${health.status.toUpperCase()}</h3>
                <p>Uptime: \${Math.floor(health.uptime / 3600)} hours</p>
                <p>Memory: \${Math.round(health.memoryUsage.heapUsed / 1024 / 1024)} MB</p>
                <p>Last Update: \${new Date(health.lastUpdate).toLocaleTimeString()}</p>
              </div>
            \`;
          }
          
          function updateAlerts(alerts) {
            const alertsEl = document.getElementById('alerts-list');
            
            let html = \`
              <div class="metric">Critical: \${alerts.critical}</div>
              <div class="metric">High: \${alerts.high}</div>
              <div class="metric">Medium: \${alerts.medium}</div>
              <div class="metric">Low: \${alerts.low}</div>
            \`;
            
            if (alerts.recent.length > 0) {
              html += '<h3>Recent Alerts:</h3>';
              alerts.recent.forEach(alert => {
                html += \`<div class="\${alert.severity}">
                  <strong>\${alert.type}</strong>: \${alert.description}
                  <small>(\${new Date(alert.timestamp).toLocaleTimeString()})</small>
                </div>\`;
              });
            }
            
            alertsEl.innerHTML = html;
          }
          
          function updateMetrics(metrics) {
            const metricsEl = document.getElementById('metrics-display');
            
            metricsEl.innerHTML = \`
              <div class="metric">Avg Response: \${Math.round(metrics.averageResponseTime)}ms</div>
              <div class="metric">Throughput: \${metrics.throughput} req/min</div>
              <div class="metric">Error Rate: \${metrics.errorRate.toFixed(2)}%</div>
              <div class="metric">Availability: \${metrics.availability.toFixed(2)}%</div>
            \`;
          }
          
          // Load dashboard on page load
          loadDashboard();
          
          // Refresh every 30 seconds
          setInterval(loadDashboard, 30000);
        </script>
      </body>
      </html>
    `);
    });
    // Start server
    app.listen(port, () => {
        console.log(`📊 Monitoring dashboard available at http://localhost:${port}`);
        console.log(`🔗 API endpoints: /api/dashboard, /api/metrics, /api/health, /api/alerts`);
    });
}
