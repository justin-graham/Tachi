#!/usr/bin/env node

/**
 * Security Monitoring and Alerting System for Tachi Protocol
 * 
 * This script sets up comprehensive security monitoring including:
 * - Transaction monitoring and anomaly detection
 * - Failed transaction alerts
 * - Gas price spike monitoring
 * - Unusual contract activity detection
 * - Multi-channel alerting (Slack, email, PagerDuty)
 */

import { ethers } from 'ethers';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

class SecurityMonitor {
  constructor(config) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.isMonitoring = false;
    this.alerts = [];
    this.metrics = {
      transactions: 0,
      failedTransactions: 0,
      totalGasUsed: BigInt(0),
      alertsSent: 0,
      lastBlockChecked: 0
    };
    
    // Load contract ABIs and addresses
    this.loadContractConfigs();
  }

  loadContractConfigs() {
    try {
      const contractsPath = path.join(process.cwd(), 'deployments');
      
      // Load deployed contract addresses and ABIs
      this.contracts = {
        crawlNFT: this.loadContract(contractsPath, 'crawlnft-deployment.json'),
        paymentProcessor: this.loadContract(contractsPath, 'payment-processor-deployment.json'),
        proofLedger: this.loadContract(contractsPath, 'proof-of-crawl-ledger-deployment.json')
      };
      
      console.log('📋 Loaded contract configurations for monitoring');
    } catch (error) {
      console.warn('⚠️  Could not load contract configurations:', error.message);
      this.contracts = {};
    }
  }

  loadContract(basePath, filename) {
    try {
      const deploymentFile = fs.readFileSync(path.join(basePath, filename), 'utf8');
      const deployment = JSON.parse(deploymentFile);
      return {
        address: deployment.address,
        abi: deployment.abi
      };
    } catch (error) {
      console.warn(`⚠️  Could not load ${filename}:`, error.message);
      return null;
    }
  }

  /**
   * Start comprehensive security monitoring
   */
  async startMonitoring() {
    console.log('🛡️  Starting Tachi Protocol Security Monitor...');
    console.log(`🌐 Network: ${this.config.network}`);
    console.log(`🔗 RPC: ${this.config.rpcUrl}`);
    
    this.isMonitoring = true;
    
    // Start different monitoring processes
    this.monitorBlocks();
    this.monitorContracts();
    this.monitorGasPrices();
    this.startHealthCheck();
    
    // Setup periodic reports
    setInterval(() => this.generateReport(), 60 * 60 * 1000); // Hourly reports
    
    console.log('✅ Security monitoring active');
  }

  /**
   * Monitor new blocks for suspicious activity
   */
  async monitorBlocks() {
    this.provider.on('block', async (blockNumber) => {
      try {
        const block = await this.provider.getBlock(blockNumber, true);
        
        if (!block) return;
        
        this.metrics.lastBlockChecked = blockNumber;
        
        // Check for unusual activity
        await this.analyzeBlock(block);
        
        // Check transactions in block
        for (const tx of block.transactions) {
          await this.analyzeTransaction(tx);
        }
        
      } catch (error) {
        await this.sendAlert({
          type: 'error',
          severity: 'high',
          message: `Block monitoring error: ${error.message}`,
          blockNumber
        });
      }
    });
  }

  /**
   * Monitor specific contract events
   */
  async monitorContracts() {
    for (const [name, contract] of Object.entries(this.contracts)) {
      if (!contract) continue;
      
      try {
        const contractInstance = new ethers.Contract(
          contract.address, 
          contract.abi, 
          this.provider
        );
        
        // Monitor all events
        contractInstance.on('*', async (event) => {
          await this.analyzeContractEvent(name, event);
        });
        
        console.log(`👀 Monitoring ${name} contract at ${contract.address}`);
      } catch (error) {
        console.warn(`⚠️  Could not monitor ${name} contract:`, error.message);
      }
    }
  }

  /**
   * Monitor gas price fluctuations
   */
  async monitorGasPrices() {
    setInterval(async () => {
      try {
        const gasPrice = await this.provider.getFeeData();
        const gasPriceGwei = Number(ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei'));
        
        // Alert on high gas prices
        if (gasPriceGwei > this.config.gasAlert.highThreshold) {
          await this.sendAlert({
            type: 'gas-price',
            severity: 'medium',
            message: `High gas price detected: ${gasPriceGwei.toFixed(2)} Gwei`,
            gasPrice: gasPriceGwei
          });
        }
        
        // Store gas price metrics
        this.storeMetric('gasPrice', gasPriceGwei);
        
      } catch (error) {
        console.error('Gas price monitoring error:', error.message);
      }
    }, 30 * 1000); // Check every 30 seconds
  }

  /**
   * Analyze block for suspicious patterns
   */
  async analyzeBlock(block) {
    // Check for unusually large blocks
    if (block.transactions.length > this.config.alerts.maxTransactionsPerBlock) {
      await this.sendAlert({
        type: 'unusual-activity',
        severity: 'medium',
        message: `Unusually large block: ${block.transactions.length} transactions`,
        blockNumber: block.number
      });
    }
    
    // Check for gas limit issues
    if (block.gasUsed > (block.gasLimit * BigInt(90)) / BigInt(100)) {
      await this.sendAlert({
        type: 'network-congestion',
        severity: 'medium',
        message: `High block gas usage: ${ethers.formatUnits(block.gasUsed, 'gwei')} / ${ethers.formatUnits(block.gasLimit, 'gwei')}`,
        blockNumber: block.number
      });
    }
  }

  /**
   * Analyze individual transactions
   */
  async analyzeTransaction(tx) {
    this.metrics.transactions++;
    
    try {
      // Get transaction receipt to check if it failed
      const receipt = await this.provider.getTransactionReceipt(tx.hash);
      
      if (receipt && receipt.status === 0) {
        this.metrics.failedTransactions++;
        
        // Check if it's one of our contracts
        const isOurContract = Object.values(this.contracts).some(
          contract => contract && (
            tx.to === contract.address || 
            tx.from === contract.address
          )
        );
        
        if (isOurContract) {
          await this.sendAlert({
            type: 'failed-transaction',
            severity: 'high',
            message: `Failed transaction on monitored contract`,
            txHash: tx.hash,
            to: tx.to,
            from: tx.from
          });
        }
      }
      
      // Check for large value transfers
      if (tx.value && tx.value > ethers.parseEther(this.config.alerts.largeValueThreshold)) {
        await this.sendAlert({
          type: 'large-transfer',
          severity: 'medium',
          message: `Large value transfer: ${ethers.formatEther(tx.value)} ETH`,
          txHash: tx.hash,
          value: ethers.formatEther(tx.value)
        });
      }
      
    } catch (error) {
      console.error('Transaction analysis error:', error.message);
    }
  }

  /**
   * Analyze contract events for anomalies
   */
  async analyzeContractEvent(contractName, event) {
    // Log all contract events
    console.log(`📝 ${contractName} event:`, event.event || 'Unknown', event.args);
    
    // Check for specific suspicious patterns
    if (event.event === 'PaymentProcessed') {
      const amount = event.args?.amount;
      if (amount && amount > ethers.parseUnits('1000', 6)) { // 1000 USDC
        await this.sendAlert({
          type: 'large-payment',
          severity: 'medium',
          message: `Large payment processed: ${ethers.formatUnits(amount, 6)} USDC`,
          contract: contractName,
          txHash: event.transactionHash
        });
      }
    }
    
    // Rate limiting check - detect rapid-fire transactions
    this.checkRateLimit(event);
  }

  /**
   * Check for rate limiting violations
   */
  checkRateLimit(event) {
    const now = Date.now();
    const key = `${event.address}_${event.event}`;
    
    if (!this.rateLimitTracker) {
      this.rateLimitTracker = new Map();
    }
    
    if (!this.rateLimitTracker.has(key)) {
      this.rateLimitTracker.set(key, []);
    }
    
    const events = this.rateLimitTracker.get(key);
    events.push(now);
    
    // Keep only events from last minute
    const oneMinuteAgo = now - 60 * 1000;
    const recentEvents = events.filter(time => time > oneMinuteAgo);
    this.rateLimitTracker.set(key, recentEvents);
    
    // Alert if too many events
    if (recentEvents.length > this.config.alerts.maxEventsPerMinute) {
      this.sendAlert({
        type: 'rate-limit-violation',
        severity: 'high',
        message: `Rate limit exceeded: ${recentEvents.length} ${event.event} events in 1 minute`,
        contract: event.address
      });
    }
  }

  /**
   * Send alert through configured channels
   */
  async sendAlert(alert) {
    this.metrics.alertsSent++;
    alert.timestamp = new Date().toISOString();
    alert.id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.alerts.push(alert);
    
    console.log(`🚨 ALERT [${alert.severity}]: ${alert.message}`);
    
    // Send to configured alert channels
    const promises = [];
    
    if (this.config.slack?.webhookUrl) {
      promises.push(this.sendSlackAlert(alert));
    }
    
    if (this.config.email?.enabled) {
      promises.push(this.sendEmailAlert(alert));
    }
    
    if (this.config.pagerDuty?.integrationKey && alert.severity === 'high') {
      promises.push(this.sendPagerDutyAlert(alert));
    }
    
    // Execute all alert sends
    await Promise.allSettled(promises);
    
    // Store alert to file for persistence
    this.storeAlert(alert);
  }

  /**
   * Send Slack alert
   */
  async sendSlackAlert(alert) {
    try {
      const color = {
        low: '#36a64f',
        medium: '#ff9500',
        high: '#ff0000'
      }[alert.severity] || '#36a64f';
      
      const payload = {
        text: `🚨 Tachi Protocol Security Alert`,
        attachments: [{
          color,
          title: `${alert.type.toUpperCase()} Alert`,
          text: alert.message,
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true
            },
            {
              title: 'Time',
              value: alert.timestamp,
              short: true
            },
            {
              title: 'Network',
              value: this.config.network,
              short: true
            }
          ]
        }]
      };
      
      if (alert.txHash) {
        payload.attachments[0].fields.push({
          title: 'Transaction',
          value: `https://basescan.org/tx/${alert.txHash}`,
          short: false
        });
      }
      
      const response = await fetch(this.config.slack.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status}`);
      }
      
    } catch (error) {
      console.error('Failed to send Slack alert:', error.message);
    }
  }

  /**
   * Send PagerDuty alert for critical issues
   */
  async sendPagerDutyAlert(alert) {
    try {
      const payload = {
        routing_key: this.config.pagerDuty.integrationKey,
        event_action: 'trigger',
        dedup_key: `tachi_${alert.type}_${Date.now()}`,
        payload: {
          summary: `Tachi Protocol: ${alert.message}`,
          severity: alert.severity === 'high' ? 'critical' : 'warning',
          source: 'tachi-security-monitor',
          component: alert.contract || 'protocol',
          group: 'tachi-protocol',
          class: alert.type,
          custom_details: alert
        }
      };
      
      const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`PagerDuty API error: ${response.status}`);
      }
      
    } catch (error) {
      console.error('Failed to send PagerDuty alert:', error.message);
    }
  }

  /**
   * Store alert to persistent storage
   */
  storeAlert(alert) {
    try {
      const alertsFile = path.join(process.cwd(), 'security-alerts.jsonl');
      fs.appendFileSync(alertsFile, JSON.stringify(alert) + '\n');
    } catch (error) {
      console.error('Failed to store alert:', error.message);
    }
  }

  /**
   * Store metrics for analysis
   */
  storeMetric(type, value) {
    try {
      const metricsFile = path.join(process.cwd(), 'security-metrics.jsonl');
      const metric = {
        type,
        value,
        timestamp: new Date().toISOString(),
        network: this.config.network
      };
      fs.appendFileSync(metricsFile, JSON.stringify(metric) + '\n');
    } catch (error) {
      console.error('Failed to store metric:', error.message);
    }
  }

  /**
   * Start health check endpoint
   */
  startHealthCheck() {
    const http = require('http');
    
    const server = http.createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          monitoring: this.isMonitoring,
          metrics: {
            ...this.metrics,
            totalGasUsed: this.metrics.totalGasUsed.toString(),
            uptime: process.uptime()
          },
          timestamp: new Date().toISOString()
        }));
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });
    
    const port = this.config.healthCheck?.port || 3001;
    server.listen(port, () => {
      console.log(`🏥 Health check endpoint available at http://localhost:${port}/health`);
    });
  }

  /**
   * Generate periodic security report
   */
  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      period: '1 hour',
      metrics: this.metrics,
      recentAlerts: this.alerts.slice(-10),
      network: this.config.network,
      summary: {
        totalTransactions: this.metrics.transactions,
        failureRate: (this.metrics.failedTransactions / Math.max(this.metrics.transactions, 1) * 100).toFixed(2) + '%',
        alertsSent: this.metrics.alertsSent
      }
    };
    
    console.log('📊 Security Report:', JSON.stringify(report, null, 2));
    
    // Send report to configured channels if needed
    if (this.config.reports?.enabled) {
      await this.sendSlackAlert({
        type: 'security-report',
        severity: 'low',
        message: `Hourly security report: ${report.summary.totalTransactions} transactions, ${report.summary.failureRate} failure rate, ${report.summary.alertsSent} alerts`,
        timestamp: report.timestamp
      });
    }
    
    return report;
  }

  /**
   * Stop monitoring
   */
  stop() {
    console.log('🛑 Stopping security monitor...');
    this.isMonitoring = false;
    this.provider.removeAllListeners();
  }

  /**
   * Test connection to RPC provider
   */
  async testConnection() {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      console.log(`✅ Connected to network (Block: ${blockNumber})`);
      return true;
    } catch (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Test alert systems
   */
  async testAlerts() {
    try {
      console.log('🧪 Testing alert systems (dry run)...');
      
      // Test Slack alert (dry run)
      if (this.slackWebhook) {
        console.log('✅ Slack webhook configured');
      } else {
        console.log('⚠️  No Slack webhook configured');
      }
      
      // Test PagerDuty alert (dry run)
      if (this.pagerDutyKey) {
        console.log('✅ PagerDuty integration configured');
      } else {
        console.log('⚠️  No PagerDuty integration configured');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Alert test failed:', error.message);
      return false;
    }
  }

  /**
   * Get health status
   */
  async getHealthStatus() {
    const status = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      rpc: false,
      monitoring: this.isMonitoring,
      metrics: this.metrics
    };
    
    // Test RPC connection
    try {
      const blockNumber = await this.provider.getBlockNumber();
      status.rpc = true;
      status.blockNumber = blockNumber;
    } catch (error) {
      status.status = 'unhealthy';
      status.rpc = false;
      status.error = error.message;
    }
    
    return status;
  }
}

// Configuration
const defaultConfig = {
  network: process.env.NETWORK || 'base-sepolia',
  rpcUrl: process.env.BASE_RPC_URL || 'https://sepolia.base.org',
  
  alerts: {
    maxTransactionsPerBlock: 1000,
    largeValueThreshold: '10', // ETH
    maxEventsPerMinute: 50
  },
  
  gasAlert: {
    highThreshold: 50 // Gwei
  },
  
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL
  },
  
  pagerDuty: {
    integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY
  },
  
  email: {
    enabled: false
  },
  
  reports: {
    enabled: true
  },
  
  healthCheck: {
    port: 3001
  }
};

// CLI interface
async function main() {
  const monitor = new SecurityMonitor(defaultConfig);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down security monitor...');
    monitor.stop();
    process.exit(0);
  });
  
  await monitor.startMonitoring();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { SecurityMonitor };
