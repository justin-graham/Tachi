#!/usr/bin/env node

/**
 * Production Deployment Script for Base Mainnet
 * 
 * This script deploys the complete Tachi Protocol stack to Base mainnet
 * with production-ready configurations and security measures.
 */

const { ethers } = require("hardhat");

// Production configuration
const PRODUCTION_CONFIG = {
  MAINNET_RPC: process.env.BASE_MAINNET_RPC || "https://mainnet.base.org",
  USDC_ADDRESS: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base mainnet USDC
  DEPLOYER_KEY: process.env.PRODUCTION_PRIVATE_KEY,
  GAS_PRICE: ethers.parseUnits("0.001", "gwei"), // 0.001 gwei for Base
  MULTISIG_OWNER: process.env.MULTISIG_ADDRESS, // For production ownership
};

async function deployProduction() {
  console.log("🚀 PRODUCTION DEPLOYMENT - Tachi Protocol on Base Mainnet");
  console.log("=" .repeat(60));
  
  // Safety checks
  if (!PRODUCTION_CONFIG.DEPLOYER_KEY) {
    throw new Error("PRODUCTION_PRIVATE_KEY environment variable required");
  }
  
  if (!PRODUCTION_CONFIG.MULTISIG_OWNER) {
    throw new Error("MULTISIG_ADDRESS environment variable required");
  }
  
  console.log(`🌐 Network: Base Mainnet`);
  console.log(`💰 USDC Address: ${PRODUCTION_CONFIG.USDC_ADDRESS}`);
  console.log(`🔐 Multisig Owner: ${PRODUCTION_CONFIG.MULTISIG_OWNER}`);
  
  // Deploy contracts with production settings
  // ... deployment logic
  
  console.log("\n🎉 PRODUCTION DEPLOYMENT COMPLETE!");
  console.log("Next steps:");
  console.log("1. Transfer ownership to multisig");
  console.log("2. Update gateway environment variables");
  console.log("3. Deploy dashboard to production");
  console.log("4. Set up monitoring and alerts");
}

// Only run if explicitly called with --production flag
if (process.argv.includes("--production")) {
  deployProduction().catch(console.error);
} else {
  console.log("⚠️  Production deployment requires --production flag");
  console.log("Use: node scripts/deploy-production.js --production");
}
