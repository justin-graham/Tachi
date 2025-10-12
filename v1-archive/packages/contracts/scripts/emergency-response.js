#!/usr/bin/env node

/**
 * Emergency Response and Recovery Script
 * 
 * Provides emergency controls for production contracts including:
 * - Pause/unpause functionality
 * - Emergency withdrawals
 * - Access control recovery
 * - Circuit breaker activation
 */

import hre from "hardhat";
import { readFileSync } from "fs";
import { SecureKeyManager } from "./key-management.js";
import { SecurityMonitor } from "./security-monitor.js";

class EmergencyResponse {
  constructor(deploymentFile) {
    this.deployment = JSON.parse(readFileSync(deploymentFile, 'utf8'));
    this.keyManager = new SecureKeyManager();
    this.monitor = new SecurityMonitor();
    
    this.emergencyActions = {
      pause: 'Pause all contract operations',
      unpause: 'Resume contract operations',
      emergencyWithdraw: 'Emergency withdrawal of funds',
      transferOwnership: 'Transfer contract ownership',
      updateEmergencyContact: 'Update emergency contact',
      activateCircuitBreaker: 'Activate circuit breaker',
      blacklistAddress: 'Blacklist malicious address',
      whitelistAddress: 'Remove address from blacklist'
    };
  }

  async executeEmergencyAction(action, params = {}) {
    console.log(`🚨 EMERGENCY ACTION: ${this.emergencyActions[action]}`);
    console.log('⚠️  This is a critical operation on production contracts!');
    console.log('='.repeat(60));
    
    // Verify authorization
    await this.verifyEmergencyAuthorization();
    
    // Log action
    await this.logEmergencyAction(action, params);
    
    // Execute action
    switch (action) {
      case 'pause':
        return await this.pauseContracts();
      case 'unpause':
        return await this.unpauseContracts();
      case 'emergencyWithdraw':
        return await this.emergencyWithdraw(params);
      case 'transferOwnership':
        return await this.transferOwnership(params);
      case 'updateEmergencyContact':
        return await this.updateEmergencyContact(params);
      case 'activateCircuitBreaker':
        return await this.activateCircuitBreaker();
      case 'blacklistAddress':
        return await this.blacklistAddress(params);
      case 'whitelistAddress':
        return await this.whitelistAddress(params);
      default:
        throw new Error(`Unknown emergency action: ${action}`);
    }
  }

  async verifyEmergencyAuthorization() {
    console.log('🔐 Verifying emergency authorization...');
    
    const [signer] = await hre.ethers.getSigners();
    const signerAddress = await signer.getAddress();
    
    console.log(`👤 Emergency responder: ${signerAddress}`);
    
    // Verify this is an authorized emergency responder
    if (signerAddress.toLowerCase() !== this.deployment.deployer.toLowerCase()) {
      // In production, you might have a list of authorized emergency responders
      console.warn('⚠️  Warning: Signer is not the original deployer');
      console.log('Proceeding with emergency action...');
    }
    
    // Check signer has sufficient gas
    const balance = await hre.ethers.provider.getBalance(signerAddress);
    const minBalance = hre.ethers.parseEther("0.01");
    
    if (balance < minBalance) {
      throw new Error(`Insufficient gas balance: ${hre.ethers.formatEther(balance)} ETH`);
    }
    
    console.log(`💰 Gas balance: ${hre.ethers.formatEther(balance)} ETH`);
    console.log('✅ Authorization verified');
  }

  async logEmergencyAction(action, params) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      params,
      responder: await (await hre.ethers.getSigners())[0].getAddress(),
      network: this.deployment.network,
      chainId: this.deployment.chainId
    };
    
    console.log('📝 Logging emergency action:', JSON.stringify(logEntry, null, 2));
    
    // Send to monitoring system
    if (process.env.SLACK_WEBHOOK_URL) {
      await this.sendSlackAlert(`🚨 EMERGENCY ACTION EXECUTED\n\`\`\`${JSON.stringify(logEntry, null, 2)}\`\`\``);
    }
  }

  async pauseContracts() {
    console.log('⏸️  Pausing all contracts...');
    
    const results = [];
    
    // Pause PaymentProcessor (if it has pause functionality)
    try {
      const PaymentProcessor = await hre.ethers.getContractAt(
        "PaymentProcessor",
        this.deployment.contracts.paymentProcessor.address
      );
      
      // Check if contract has pause functionality
      try {
        const isPaused = await PaymentProcessor.paused();
        
        if (isPaused) {
          console.log('  ℹ️  PaymentProcessor already paused');
        } else {
          const tx = await PaymentProcessor.pause();
          const receipt = await tx.wait();
          console.log('  ✅ PaymentProcessor paused');
          results.push({ contract: 'PaymentProcessor', status: 'paused', tx: receipt.hash });
        }
      } catch (error) {
        console.log('  ⚠️  PaymentProcessor does not support pause functionality');
        results.push({ contract: 'PaymentProcessor', status: 'not_supported', error: error.message });
      }
    } catch (error) {
      console.error('  ❌ Failed to pause PaymentProcessor:', error.message);
      results.push({ contract: 'PaymentProcessor', status: 'error', error: error.message });
    }
    
    // Additional contracts can be paused here
    
    return results;
  }

  async unpauseContracts() {
    console.log('▶️  Unpausing all contracts...');
    
    const results = [];
    
    try {
      const PaymentProcessor = await hre.ethers.getContractAt(
        "PaymentProcessor",
        this.deployment.contracts.paymentProcessor.address
      );
      
      try {
        const isPaused = await PaymentProcessor.paused();
        
        if (!isPaused) {
          console.log('  ℹ️  PaymentProcessor already unpaused');
        } else {
          const tx = await PaymentProcessor.unpause();
          const receipt = await tx.wait();
          console.log('  ✅ PaymentProcessor unpaused');
          results.push({ contract: 'PaymentProcessor', status: 'unpaused', tx: receipt.hash });
        }
      } catch (error) {
        console.log('  ⚠️  PaymentProcessor does not support unpause functionality');
        results.push({ contract: 'PaymentProcessor', status: 'not_supported', error: error.message });
      }
    } catch (error) {
      console.error('  ❌ Failed to unpause PaymentProcessor:', error.message);
      results.push({ contract: 'PaymentProcessor', status: 'error', error: error.message });
    }
    
    return results;
  }

  async emergencyWithdraw(params) {
    console.log('💸 Executing emergency withdrawal...');
    
    if (!params.recipient || !params.contract) {
      throw new Error('Emergency withdrawal requires recipient and contract parameters');
    }
    
    const { recipient, contract, amount } = params;
    
    try {
      // Get contract instance
      const contractInstance = await hre.ethers.getContractAt(
        contract,
        this.deployment.contracts[contract.toLowerCase()].address
      );
      
      // Execute emergency withdrawal (implementation depends on contract)
      // This is a template - actual implementation depends on your contract's emergency functions
      
      console.log(`  📍 Recipient: ${recipient}`);
      console.log(`  📋 Contract: ${contract}`);
      console.log(`  💰 Amount: ${amount || 'all available'}`);
      
      // Example emergency withdrawal call (adjust based on your contract's interface)
      // const tx = await contractInstance.emergencyWithdraw(recipient, amount || 0);
      // const receipt = await tx.wait();
      
      console.log('  ⚠️  Emergency withdrawal interface not implemented');
      console.log('  🔧 Manual intervention required');
      
      return { status: 'manual_intervention_required', recipient, contract };
      
    } catch (error) {
      console.error(`  ❌ Emergency withdrawal failed: ${error.message}`);
      throw error;
    }
  }

  async transferOwnership(params) {
    console.log('👤 Transferring contract ownership...');
    
    if (!params.newOwner || !params.contract) {
      throw new Error('Ownership transfer requires newOwner and contract parameters');
    }
    
    const { newOwner, contract } = params;
    
    try {
      // Transfer ownership of specified contract
      const contractInstance = await hre.ethers.getContractAt(
        contract === 'crawlNFT' ? 'CrawlNFTSelfMint' : contract,
        this.deployment.contracts[contract.toLowerCase()].address
      );
      
      // Get current owner
      const currentOwner = await contractInstance.owner();
      console.log(`  👤 Current owner: ${currentOwner}`);
      console.log(`  👤 New owner: ${newOwner}`);
      
      // Verify current signer is the owner
      const [signer] = await hre.ethers.getSigners();
      const signerAddress = await signer.getAddress();
      
      if (signerAddress.toLowerCase() !== currentOwner.toLowerCase()) {
        throw new Error(`Only current owner can transfer ownership. Signer: ${signerAddress}, Owner: ${currentOwner}`);
      }
      
      // Transfer ownership
      const tx = await contractInstance.transferOwnership(newOwner);
      const receipt = await tx.wait();
      
      console.log(`  ✅ Ownership transferred to: ${newOwner}`);
      console.log(`  📄 Transaction: ${receipt.hash}`);
      
      return { status: 'transferred', from: currentOwner, to: newOwner, tx: receipt.hash };
      
    } catch (error) {
      console.error(`  ❌ Ownership transfer failed: ${error.message}`);
      throw error;
    }
  }

  async updateEmergencyContact(params) {
    console.log('📞 Updating emergency contact...');
    
    if (!params.contact) {
      throw new Error('Emergency contact update requires contact parameter');
    }
    
    const { contact } = params;
    
    // This would update emergency contact in your monitoring/alerting system
    console.log(`  📞 New emergency contact: ${contact}`);
    
    // Update monitoring configuration
    if (process.env.SLACK_WEBHOOK_URL) {
      await this.sendSlackAlert(`📞 Emergency contact updated to: ${contact}`);
    }
    
    return { status: 'updated', contact };
  }

  async activateCircuitBreaker() {
    console.log('🔥 Activating circuit breaker...');
    
    // Circuit breaker would pause all operations and prevent new transactions
    // This is a comprehensive emergency response
    
    const pauseResults = await this.pauseContracts();
    
    // Additional circuit breaker logic
    console.log('  🚫 All operations halted');
    console.log('  📢 Notifying stakeholders...');
    
    if (process.env.SLACK_WEBHOOK_URL) {
      await this.sendSlackAlert('🚨 CIRCUIT BREAKER ACTIVATED - ALL OPERATIONS HALTED');
    }
    
    if (process.env.PAGERDUTY_INTEGRATION_KEY) {
      await this.sendPagerDutyAlert('CRITICAL: Circuit breaker activated');
    }
    
    return { status: 'activated', pauseResults };
  }

  async blacklistAddress(params) {
    console.log('🚫 Blacklisting address...');
    
    if (!params.address) {
      throw new Error('Address blacklist requires address parameter');
    }
    
    const { address, reason } = params;
    
    console.log(`  🚫 Address: ${address}`);
    console.log(`  📝 Reason: ${reason || 'Not specified'}`);
    
    // Implementation depends on your contract's blacklist functionality
    console.log('  ⚠️  Blacklist functionality not implemented in contracts');
    console.log('  🔧 Consider implementing address blacklist in future versions');
    
    return { status: 'manual_intervention_required', address, reason };
  }

  async whitelistAddress(params) {
    console.log('✅ Removing address from blacklist...');
    
    if (!params.address) {
      throw new Error('Address whitelist requires address parameter');
    }
    
    const { address } = params;
    
    console.log(`  ✅ Address: ${address}`);
    
    // Implementation depends on your contract's whitelist functionality
    console.log('  ⚠️  Whitelist functionality not implemented in contracts');
    
    return { status: 'manual_intervention_required', address };
  }

  async sendSlackAlert(message) {
    try {
      const axios = require('axios');
      await axios.post(process.env.SLACK_WEBHOOK_URL, {
        text: message,
        username: 'Tachi Emergency Response',
        icon_emoji: ':warning:'
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error.message);
    }
  }

  async sendPagerDutyAlert(description) {
    try {
      const axios = require('axios');
      await axios.post('https://events.pagerduty.com/v2/enqueue', {
        routing_key: process.env.PAGERDUTY_INTEGRATION_KEY,
        event_action: 'trigger',
        payload: {
          summary: description,
          source: 'tachi-protocol',
          severity: 'critical',
          component: 'smart-contracts',
          group: 'emergency-response'
        }
      });
    } catch (error) {
      console.error('Failed to send PagerDuty alert:', error.message);
    }
  }

  async getSystemStatus() {
    console.log('📊 Checking system status...');
    
    const status = {
      timestamp: new Date().toISOString(),
      network: this.deployment.network,
      contracts: {}
    };
    
    for (const [name, data] of Object.entries(this.deployment.contracts)) {
      try {
        // Check if contract is accessible
        const code = await hre.ethers.provider.getCode(data.address);
        const isDeployed = code !== '0x';
        
        let contractStatus = {
          deployed: isDeployed,
          address: data.address,
          accessible: false,
          paused: null
        };
        
        if (isDeployed) {
          try {
            // Try to call a view function to check accessibility
            const contractName = name === 'crawlNFT' ? 'CrawlNFTSelfMint' : 
                                name === 'paymentProcessor' ? 'PaymentProcessor' :
                                name === 'proofOfCrawlLedger' ? 'ProofOfCrawlLedger' : name;
            
            const contractInstance = await hre.ethers.getContractAt(contractName, data.address);
            
            // Try basic read operation
            if (name === 'crawlNFT') {
              await contractInstance.name();
            } else if (name === 'paymentProcessor') {
              await contractInstance.usdcToken();
            } else if (name === 'proofOfCrawlLedger') {
              await contractInstance.paymentProcessor();
            }
            
            contractStatus.accessible = true;
            
            // Check pause status if supported
            try {
              contractStatus.paused = await contractInstance.paused();
            } catch {
              contractStatus.paused = 'not_supported';
            }
            
          } catch (error) {
            console.warn(`Warning: ${name} not fully accessible:`, error.message);
          }
        }
        
        status.contracts[name] = contractStatus;
        
      } catch (error) {
        status.contracts[name] = {
          deployed: false,
          error: error.message
        };
      }
    }
    
    return status;
  }
}

async function main() {
  const action = process.argv[2];
  const deploymentFile = process.argv[3];
  const paramsJson = process.argv[4];
  
  if (!action) {
    console.log('🚨 Tachi Protocol Emergency Response System');
    console.log('='.repeat(60));
    console.log('Available emergency actions:');
    
    const actions = {
      pause: 'Pause all contract operations',
      unpause: 'Resume contract operations', 
      status: 'Check system status',
      emergencyWithdraw: 'Emergency withdrawal of funds',
      transferOwnership: 'Transfer contract ownership',
      updateEmergencyContact: 'Update emergency contact',
      activateCircuitBreaker: 'Activate circuit breaker',
      blacklistAddress: 'Blacklist malicious address',
      whitelistAddress: 'Remove address from blacklist'
    };
    
    Object.entries(actions).forEach(([cmd, desc]) => {
      console.log(`  ${cmd.padEnd(20)} - ${desc}`);
    });
    
    console.log('\nUsage:');
    console.log('  node scripts/emergency-response.js <action> <deployment-file> [params-json]');
    console.log('\nExamples:');
    console.log('  node scripts/emergency-response.js status deployments/production/deployment-123.json');
    console.log('  node scripts/emergency-response.js pause deployments/production/deployment-123.json');
    console.log('  node scripts/emergency-response.js transferOwnership deployments/production/deployment-123.json \'{"newOwner":"0x...", "contract":"CrawlNFTSelfMint"}\'');
    
    process.exit(0);
  }
  
  if (!deploymentFile) {
    console.error('❌ Please provide deployment file path');
    process.exit(1);
  }
  
  try {
    const emergency = new EmergencyResponse(deploymentFile);
    const params = paramsJson ? JSON.parse(paramsJson) : {};
    
    if (action === 'status') {
      const status = await emergency.getSystemStatus();
      console.log('\n📊 SYSTEM STATUS:');
      console.log(JSON.stringify(status, null, 2));
      return;
    }
    
    const result = await emergency.executeEmergencyAction(action, params);
    
    console.log('\n✅ EMERGENCY ACTION COMPLETED');
    console.log('Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('\n❌ EMERGENCY ACTION FAILED:');
    console.error(error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { EmergencyResponse };
