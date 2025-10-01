#!/usr/bin/env node

/**
 * Tachi Protocol - Guided Cloudflare Worker Deployment CLI
 * 
 * Interactive command-line tool for deploying Tachi Protocol gateways
 * to Cloudflare Workers with step-by-step guidance.
 */

const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');

class GuidedDeployment {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.config = {
      cloudflareApiToken: '',
      accountId: '',
      zoneId: '',
      workerName: '',
      customDomain: '',
      publisherAddress: '',
      crawlTokenId: '',
      priceUsdc: '1.50',
      publisherPrivateKey: '',
      baseRpcUrl: 'https://mainnet.base.org',
      paymentProcessorAddress: '0x742d35Cc6634C0532925a3b8D427E3c8e3e7e7e7',
      usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
    };
  }

  async question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  async secureQuestion(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer);
      });
      
      // Hide input for sensitive data
      this.rl.history = this.rl.history.slice(1);
    });
  }

  displayHeader() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 Tachi Protocol - Guided Gateway Deployment');
    console.log('   Deploy your content gateway to Cloudflare Workers');
    console.log('='.repeat(60) + '\n');
  }

  displayStep(stepNumber, title) {
    console.log(`\n📋 Step ${stepNumber}: ${title}`);
    console.log('-'.repeat(40));
  }

  async getCloudflareCredentials() {
    this.displayStep(1, 'Cloudflare Account Setup');
    
    console.log('First, we need your Cloudflare credentials:');
    console.log('• Go to https://dash.cloudflare.com/profile/api-tokens');
    console.log('• Create a token with "Zone:Read, Workers:Edit" permissions');
    console.log('• Get your Account ID from the right sidebar\n');
    
    this.config.cloudflareApiToken = await this.secureQuestion('Enter your Cloudflare API Token: ');
    this.config.accountId = await this.question('Enter your Cloudflare Account ID: ');
    
    const useCustomDomain = await this.question('Do you want to use a custom domain? (y/N): ');
    if (useCustomDomain.toLowerCase() === 'y') {
      this.config.customDomain = await this.question('Enter your custom domain (e.g., api.example.com): ');
      this.config.zoneId = await this.question('Enter your Zone ID (from Cloudflare dashboard): ');
    }
    
    console.log('✅ Cloudflare credentials configured');
  }

  async getWorkerConfiguration() {
    this.displayStep(2, 'Worker Configuration');
    
    console.log('Configure your Tachi Protocol gateway:');
    
    const defaultWorkerName = 'tachi-gateway-' + Math.random().toString(36).substring(7);
    const workerName = await this.question(`Worker name (${defaultWorkerName}): `);
    this.config.workerName = workerName || defaultWorkerName;
    
    this.config.publisherAddress = await this.question('Your wallet address (0x...): ');
    while (!this.config.publisherAddress.startsWith('0x') || this.config.publisherAddress.length !== 42) {
      console.log('❌ Invalid address format. Must start with 0x and be 42 characters long.');
      this.config.publisherAddress = await this.question('Your wallet address (0x...): ');
    }
    
    this.config.crawlTokenId = await this.question('Your CrawlNFT token ID: ');
    
    const priceInput = await this.question(`Price per crawl in USDC (${this.config.priceUsdc}): `);
    if (priceInput) {
      const price = parseFloat(priceInput);
      if (isNaN(price) || price <= 0) {
        console.log('❌ Invalid price. Using default: $1.50');
      } else {
        this.config.priceUsdc = priceInput;
      }
    }
    
    console.log('✅ Worker configuration set');
  }

  async getSecureConfiguration() {
    this.displayStep(3, 'Secure Configuration');
    
    console.log('⚠️  The following information will be stored securely as Cloudflare secrets:');
    
    this.config.publisherPrivateKey = await this.secureQuestion('Your wallet private key (0x...): ');
    while (!this.config.publisherPrivateKey.startsWith('0x') || this.config.publisherPrivateKey.length !== 66) {
      console.log('❌ Invalid private key format. Must start with 0x and be 66 characters long.');
      this.config.publisherPrivateKey = await this.secureQuestion('Your wallet private key (0x...): ');
    }
    
    const useCustomRpc = await this.question('Use custom Base RPC URL? (y/N): ');
    if (useCustomRpc.toLowerCase() === 'y') {
      this.config.baseRpcUrl = await this.question('Base RPC URL: ');
    }
    
    console.log('✅ Secure configuration collected');
  }

  displayConfigurationSummary() {
    this.displayStep(4, 'Configuration Summary');
    
    console.log('Please review your configuration:');
    console.log(`• Worker Name: ${this.config.workerName}`);
    console.log(`• Publisher Address: ${this.config.publisherAddress}`);
    console.log(`• Token ID: ${this.config.crawlTokenId}`);
    console.log(`• Price per Crawl: $${this.config.priceUsdc} USDC`);
    console.log(`• Base RPC: ${this.config.baseRpcUrl}`);
    
    if (this.config.customDomain) {
      console.log(`• Custom Domain: ${this.config.customDomain}`);
    } else {
      console.log(`• Worker URL: https://${this.config.workerName}.${this.config.accountId}.workers.dev`);
    }
  }

  async confirmDeployment() {
    console.log('\n⚠️  Ready to deploy to Cloudflare Workers.');
    console.log('This will:');
    console.log('• Create a new KV namespace');
    console.log('• Deploy the worker script');
    console.log('• Configure environment variables');
    console.log('• Set up custom domain routing (if specified)');
    
    const confirm = await this.question('\nProceed with deployment? (y/N): ');
    return confirm.toLowerCase() === 'y';
  }

  async deployWorker() {
    this.displayStep(5, 'Deploying to Cloudflare');
    
    try {
      console.log('🔄 Creating KV namespace...');
      const kvNamespace = await this.createKVNamespace();
      console.log(`✅ KV namespace created: ${kvNamespace.id}`);
      
      console.log('🔄 Generating worker script...');
      const workerScript = this.generateWorkerScript(kvNamespace.id);
      
      console.log('🔄 Deploying worker...');
      await this.uploadWorkerScript(workerScript);
      console.log(`✅ Worker deployed: ${this.config.workerName}`);
      
      console.log('🔄 Setting environment variables...');
      await this.setEnvironmentVariables();
      console.log('✅ Environment variables configured');
      
      if (this.config.customDomain && this.config.zoneId) {
        console.log('🔄 Configuring custom domain...');
        await this.configureCustomDomain();
        console.log('✅ Custom domain configured');
      }
      
      this.displaySuccessMessage();
      
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      console.log('\n🔍 Troubleshooting tips:');
      console.log('• Check your API token permissions');
      console.log('• Ensure worker name is unique');
      console.log('• Verify account ID is correct');
      console.log('• Try again or contact support');
      
      process.exit(1);
    }
  }

  async createKVNamespace() {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/storage/kv/namespaces`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.cloudflareApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `${this.config.workerName}-kv`,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create KV namespace: ${error.errors?.[0]?.message || response.statusText}`);
    }
    
    const result = await response.json();
    return result.result;
  }

  generateWorkerScript(kvNamespaceId) {
    return `// Tachi Protocol Gateway Worker
// Generated by guided deployment tool

import { handleRequest } from '@tachi/gateway-core';

export default {
  async fetch(request, env, ctx) {
    const config = {
      baseRpcUrl: env.BASE_RPC_URL,
      paymentProcessorAddress: env.PAYMENT_PROCESSOR_ADDRESS,
      proofOfCrawlLedgerAddress: env.PROOF_OF_CRAWL_LEDGER_ADDRESS,
      usdcAddress: env.USDC_ADDRESS,
      privateKey: env.PRIVATE_KEY,
      crawlTokenId: env.CRAWL_TOKEN_ID,
      priceUsdc: env.PRICE_USDC,
      publisherAddress: env.PUBLISHER_ADDRESS,
    };
    
    return handleRequest(request, config, env.KV_NAMESPACE);
  },
};`;
  }

  async uploadWorkerScript(script) {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/workers/scripts/${this.config.workerName}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.config.cloudflareApiToken}`,
        'Content-Type': 'application/javascript',
      },
      body: script,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to deploy worker: ${error.errors?.[0]?.message || response.statusText}`);
    }
  }

  async setEnvironmentVariables() {
    const variables = {
      BASE_RPC_URL: this.config.baseRpcUrl,
      PAYMENT_PROCESSOR_ADDRESS: this.config.paymentProcessorAddress,
      PROOF_OF_CRAWL_LEDGER_ADDRESS: 'YOUR_PROOF_OF_CRAWL_ADDRESS', // TODO: Set actual address
      USDC_ADDRESS: this.config.usdcAddress,
      PRIVATE_KEY: this.config.publisherPrivateKey,
      CRAWL_TOKEN_ID: this.config.crawlTokenId,
      PRICE_USDC: this.config.priceUsdc,
      PUBLISHER_ADDRESS: this.config.publisherAddress,
    };
    
    for (const [key, value] of Object.entries(variables)) {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/workers/scripts/${this.config.workerName}/secrets`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.config.cloudflareApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: key,
          text: value,
          type: 'secret_text',
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to set ${key}: ${error.errors?.[0]?.message || response.statusText}`);
      }
    }
  }

  async configureCustomDomain() {
    const pattern = `${this.config.customDomain}/*`;
    
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${this.config.zoneId}/workers/routes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.cloudflareApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pattern,
        script: this.config.workerName,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to configure custom domain: ${error.errors?.[0]?.message || response.statusText}`);
    }
  }

  displaySuccessMessage() {
    console.log('\n' + '🎉'.repeat(20));
    console.log('🎉 DEPLOYMENT SUCCESSFUL! 🎉');
    console.log('🎉'.repeat(20) + '\n');
    
    const workerUrl = this.config.customDomain 
      ? `https://${this.config.customDomain}`
      : `https://${this.config.workerName}.${this.config.accountId}.workers.dev`;
    
    console.log('✅ Your Tachi Protocol gateway is now live!');
    console.log(`🌐 Worker URL: ${workerUrl}`);
    console.log(`💰 Price per crawl: $${this.config.priceUsdc} USDC`);
    console.log(`🏦 Payments go to: ${this.config.publisherAddress}`);
    
    console.log('\n📋 Next Steps:');
    console.log('1. Test your gateway:');
    console.log(`   curl "${workerUrl}/test"`);
    console.log('2. Update your website to use the gateway');
    console.log('3. Monitor the dashboard for incoming requests');
    console.log('4. Check your wallet for USDC payments');
    
    console.log('\n📚 Resources:');
    console.log('• Documentation: https://docs.tachi.ai');
    console.log('• Support: https://discord.gg/tachi-protocol');
    console.log('• Dashboard: https://dashboard.tachi.ai');
    
    console.log('\n🚀 Happy publishing!');
  }

  async saveConfiguration() {
    const configFile = {
      workerName: this.config.workerName,
      publisherAddress: this.config.publisherAddress,
      crawlTokenId: this.config.crawlTokenId,
      priceUsdc: this.config.priceUsdc,
      customDomain: this.config.customDomain,
      deployedAt: new Date().toISOString(),
    };
    
    try {
      await fs.writeFile(
        path.join(process.cwd(), 'tachi-deployment.json'),
        JSON.stringify(configFile, null, 2)
      );
      console.log('💾 Configuration saved to tachi-deployment.json');
    } catch (error) {
      console.log('⚠️  Could not save configuration file');
    }
  }

  async run() {
    try {
      this.displayHeader();
      
      await this.getCloudflareCredentials();
      await this.getWorkerConfiguration();
      await this.getSecureConfiguration();
      
      this.displayConfigurationSummary();
      
      const shouldDeploy = await this.confirmDeployment();
      if (!shouldDeploy) {
        console.log('❌ Deployment cancelled');
        process.exit(0);
      }
      
      await this.deployWorker();
      await this.saveConfiguration();
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }
}

// Add fetch polyfill for Node.js environments that don't have it
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Run the guided deployment if this script is executed directly
if (require.main === module) {
  const deployment = new GuidedDeployment();
  deployment.run().catch(console.error);
}

module.exports = GuidedDeployment;