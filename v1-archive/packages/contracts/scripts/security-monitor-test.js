#!/usr/bin/env node

/**
 * Security Monitor Test Script
 */

import { ethers } from "ethers";

// Create a simple test monitor class
class SecurityMonitorTest {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      process.env.BASE_RPC_URL || 'https://mainnet.base.org'
    );
    this.slackWebhook = process.env.SLACK_WEBHOOK_URL;
    this.pagerDutyKey = process.env.PAGERDUTY_INTEGRATION_KEY;
    this.isMonitoring = false;
    this.metrics = {
      blocksProcessed: 0,
      transactionsAnalyzed: 0,
      alertsSent: 0,
      lastBlockChecked: 0
    };
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
      await this.provider.getBlockNumber();
      status.rpc = true;
    } catch (error) {
      status.status = 'unhealthy';
      status.rpc = false;
    }
    
    return status;
  }

  /**
   * Test gas price monitoring
   */
  async testGasPriceMonitoring() {
    try {
      const feeData = await this.provider.getFeeData();
      const gasPrice = Number(ethers.formatUnits(feeData.gasPrice || 0, 'gwei'));
      
      console.log(`⛽ Current gas price: ${gasPrice.toFixed(2)} Gwei`);
      
      if (gasPrice > 50) {
        console.log('⚠️  High gas prices detected');
      } else {
        console.log('✅ Gas prices normal');
      }
      
      return { gasPrice, status: gasPrice > 50 ? 'high' : 'normal' };
    } catch (error) {
      console.error('❌ Gas price monitoring test failed:', error.message);
      return null;
    }
  }

  /**
   * Test block monitoring
   */
  async testBlockMonitoring() {
    try {
      const latestBlock = await this.provider.getBlock('latest');
      console.log(`📦 Latest block: ${latestBlock.number}`);
      console.log(`   Transactions: ${latestBlock.transactions.length}`);
      console.log(`   Timestamp: ${new Date(latestBlock.timestamp * 1000).toISOString()}`);
      
      return {
        blockNumber: latestBlock.number,
        transactionCount: latestBlock.transactions.length,
        timestamp: latestBlock.timestamp
      };
    } catch (error) {
      console.error('❌ Block monitoring test failed:', error.message);
      return null;
    }
  }
}

export { SecurityMonitorTest };
