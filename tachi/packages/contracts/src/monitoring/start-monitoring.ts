import { TachiSecurityMonitor } from "./TachiSecurityMonitor";
import { PerformanceMonitor } from "./PerformanceMonitor";
import { config } from "dotenv";
import { resolve } from "path";
import express, { Application, Request, Response, NextFunction } from "express";

// Load environment configuration
config({ path: resolve(__dirname, "../../.env.production") });

/**
 * Production monitoring configuration for Tachi Protocol
 */
const monitoringConfig = {
  networks: {
    base: {
      rpcUrl: process.env.BASE_RPC_URL || "https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
      contracts: {
        multiSig: process.env.MULTISIG_CONTRACT_ADDRESS || "0x_MULTISIG_ADDRESS_HERE",
        crawlNFT: process.env.CRAWL_NFT_ADDRESS || "0x_CRAWL_NFT_ADDRESS_HERE",
        paymentProcessor: process.env.PAYMENT_PROCESSOR_ADDRESS || "0x_PAYMENT_PROCESSOR_ADDRESS_HERE",
        proofOfCrawlLedger: process.env.PROOF_OF_CRAWL_LEDGER_ADDRESS || "0x_PROOF_OF_CRAWL_LEDGER_ADDRESS_HERE"
      }
    }
  },
  alerting: {
    slack: {
      token: process.env.SLACK_BOT_TOKEN || "",
      channels: {
        critical: process.env.SLACK_CRITICAL_CHANNEL || "#tachi-critical",
        security: process.env.SLACK_SECURITY_CHANNEL || "#tachi-security", 
        operations: process.env.SLACK_OPERATIONS_CHANNEL || "#tachi-ops"
      }
    },
    pagerduty: {
      integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY || ""
    },
    sentry: {
      dsn: process.env.SENTRY_DSN || ""
    },
    email: {
      smtp: {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || ""
      },
      recipients: {
        critical: (process.env.EMAIL_CRITICAL_RECIPIENTS || "").split(",").filter(email => email.trim()),
        security: (process.env.EMAIL_SECURITY_RECIPIENTS || "").split(",").filter(email => email.trim()),
        operations: (process.env.EMAIL_OPERATIONS_RECIPIENTS || "").split(",").filter(email => email.trim())
      }
    }
  },
  monitoring: {
    intervalMs: parseInt(process.env.MONITORING_INTERVAL_MS || "30000"),
    gasThresholds: {
      warning: parseFloat(process.env.GAS_WARNING_THRESHOLD || "20"),
      critical: parseFloat(process.env.GAS_CRITICAL_THRESHOLD || "50")
    },
    responseTimeThresholds: {
      warning: parseInt(process.env.RPC_WARNING_THRESHOLD || "1000"),
      critical: parseInt(process.env.RPC_CRITICAL_THRESHOLD || "5000")
    }
  }
};

/**
 * Start the production monitoring system
 */
async function startProduction(): Promise<void> {
  console.log("🚀 Starting Tachi Production Monitoring System...");
  
  // Validate configuration
  validateConfiguration();
  
  // Initialize the security monitor
  const securityMonitor = new TachiSecurityMonitor(monitoringConfig);
  const performanceMonitor = new PerformanceMonitor(securityMonitor);
  
  try {
    await securityMonitor.startMonitoring();
    
    // Start dashboard server
    const app: Application = express();
    const port = parseInt(process.env.DASHBOARD_PORT || "3001");
    
    // Basic authentication for dashboard
    app.use((req: Request, res: Response, next: NextFunction) => {
      const auth = req.headers.authorization;
      if (!auth) {
        res.setHeader('WWW-Authenticate', 'Basic');
        return res.status(401).send('Authentication required');
      }
      
      const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
      const username = credentials[0];
      const password = credentials[1];
      
      if (username === process.env.DASHBOARD_AUTH_USERNAME && password === process.env.DASHBOARD_AUTH_PASSWORD) {
        next();
      } else {
        res.setHeader('WWW-Authenticate', 'Basic');
        res.status(401).send('Invalid credentials');
      }
    });
    
    // Dashboard routes
    app.get('/', (req: Request, res: Response) => {
      const dashboardData = performanceMonitor.getDashboardData();
      res.send(generateDashboardHTML(dashboardData));
    });
    
    app.get('/api/stats', (req: Request, res: Response) => {
      res.json(securityMonitor.getStats());
    });
    
    app.get('/api/dashboard', (req: Request, res: Response) => {
      res.json(performanceMonitor.getDashboardData());
    });
    
    // Start dashboard server
    app.listen(port, () => {
      console.log(`📊 Dashboard available at http://localhost:${port}`);
      console.log(`🔐 Username: ${process.env.DASHBOARD_AUTH_USERNAME || 'admin'}`);
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log("\\n🛑 Received SIGINT. Shutting down gracefully...");
      await securityMonitor.stopMonitoring();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log("\\n🛑 Received SIGTERM. Shutting down gracefully...");
      await securityMonitor.stopMonitoring();
      process.exit(0);
    });

    console.log("✅ Tachi Production Monitoring System started successfully");
    console.log("📡 Monitoring Base network contracts...");
    console.log("🔔 Alerts configured for Slack, PagerDuty, and Sentry");
    
  } catch (error) {
    console.error("❌ Failed to start monitoring system:", error);
    process.exit(1);
  }
}

/**
 * Validate monitoring configuration
 */
function validateConfiguration(): void {
  const required = [
    'BASE_RPC_URL',
    'MULTISIG_CONTRACT_ADDRESS'
  ];
  
  const missing = required.filter(key => !process.env[key] || process.env[key]?.includes('YOUR_'));
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error("Please configure .env.production with actual values");
    process.exit(1);
  }
  
  if (!monitoringConfig.networks.base.rpcUrl.includes("YOUR_API_KEY")) {
    console.log("✅ RPC URL configured");
  } else {
    console.warn("⚠️  Warning: Using placeholder RPC URL");
  }

  if (monitoringConfig.alerting.slack.token) {
    console.log("✅ Slack integration configured");
  } else {
    console.warn("⚠️  Warning: Slack token not configured - using stub");
  }

  if (monitoringConfig.alerting.sentry.dsn) {
    console.log("✅ Sentry integration configured");
  } else {
    console.warn("⚠️  Warning: Sentry DSN not configured - using stub");
  }
  
  if (monitoringConfig.alerting.pagerduty.integrationKey) {
    console.log("✅ PagerDuty integration configured");
  } else {
    console.warn("⚠️  Warning: PagerDuty integration key not configured");
  }
}

/**
 * Generate HTML dashboard
 */
function generateDashboardHTML(data: any): string {
  const lastUpdate = new Date().toISOString();
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tachi Security Monitor Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status-healthy { color: #27ae60; font-weight: bold; }
        .status-warning { color: #f39c12; font-weight: bold; }
        .status-critical { color: #e74c3c; font-weight: bold; }
        .metric { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
        .refresh-btn { background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        .footer { text-align: center; margin-top: 20px; color: #666; }
    </style>
    <script>
        function refreshDashboard() { window.location.reload(); }
        setInterval(refreshDashboard, 30000);
    </script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ Tachi Security Monitor Dashboard</h1>
            <p>Real-time monitoring of Tachi Protocol on Base Network</p>
            <button class="refresh-btn" onclick="refreshDashboard()">🔄 Refresh</button>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>System Health</h3>
                <div class="metric">
                    <span>Status:</span>
                    <span class="status-\${data.systemHealth.status}">\${data.systemHealth.status.toUpperCase()}</span>
                </div>
                <div class="metric">
                    <span>Uptime:</span>
                    <span>\${Math.floor(data.systemHealth.uptime / 3600)}h \${Math.floor((data.systemHealth.uptime % 3600) / 60)}m</span>
                </div>
                <div class="metric">
                    <span>Memory:</span>
                    <span>\${Math.floor(data.systemHealth.memoryUsage.rss / 1024 / 1024)} MB</span>
                </div>
            </div>
            
            <div class="card">
                <h3>Network Metrics</h3>
                <div class="metric">
                    <span>RPC Response:</span>
                    <span>\${data.networkMetrics.rpcResponseTime || 'N/A'} ms</span>
                </div>
                <div class="metric">
                    <span>Gas Price:</span>
                    <span>\${data.networkMetrics.gasPrice || 'N/A'} gwei</span>
                </div>
            </div>
            
            <div class="card">
                <h3>Alerts Summary</h3>
                <div class="metric">
                    <span>Critical:</span>
                    <span class="status-critical">\${data.alertsSummary.critical || 0}</span>
                </div>
                <div class="metric">
                    <span>Total:</span>
                    <span>\${data.alertsSummary.total || 0}</span>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Last updated: \${lastUpdate} | Tachi Protocol Security Monitor v1.0.0</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Start development monitoring
 */
async function startDevelopment(): Promise<void> {
  console.log("🛠️  Starting Tachi Development Monitoring...");
  
  const devConfig = {
    ...monitoringConfig,
    networks: {
      base: {
        ...monitoringConfig.networks.base,
        rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"
      }
    }
  };
  
  const securityMonitor = new TachiSecurityMonitor(devConfig);
  await securityMonitor.startMonitoring();
  console.log("✅ Development monitoring started");
  console.log("📡 Using Base Sepolia testnet");
}

// Main execution
async function main(): Promise<void> {
  const mode = process.argv[2] || 'production';
  
  if (mode === 'development' || mode === 'dev') {
    await startDevelopment();
  } else {
    await startProduction();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Failed to start monitoring:", error);
    process.exit(1);
  });
}

export { startProduction, startDevelopment };
