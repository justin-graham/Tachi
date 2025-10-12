#!/usr/bin/env ts-node

const { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } = require("fs");
const { join } = require("path");

interface DeploymentData {
  network: string;
  chainId: number;
  contracts: {
    crawlNFT: { address: string };
    paymentProcessor: { address: string };
    proofOfCrawlLedger: { address: string };
    mockUSDC?: { address: string };
  };
}

interface NetworkConfig {
  network: string;
  crawlNFTAddress: string;
  crawlNFTStartBlock: number;
  paymentProcessorAddress: string;
  paymentProcessorStartBlock: number;
}

/**
 * Propagate deployed contract addresses to all components
 */
async function propagateAddresses(networkName: string, chainId?: number) {
  console.log("🚀 Starting Address Propagation...");
  console.log("=" .repeat(50));

  // Determine deployment file
  let deploymentFile: string;
  if (chainId) {
    deploymentFile = join(__dirname, `../deployments/${networkName}-${chainId}.json`);
  } else {
    // Try to find deployment file
    const deploymentDir = join(__dirname, "../deployments");
    const files = readdirSync(deploymentDir).filter((f: string) => f.includes(networkName));
    
    if (files.length === 0) {
      throw new Error(`No deployment file found for network: ${networkName}`);
    }
    
    deploymentFile = join(deploymentDir, files[0]);
  }

  if (!existsSync(deploymentFile)) {
    throw new Error(`Deployment file not found: ${deploymentFile}`);
  }

  console.log(`📄 Reading deployment from: ${deploymentFile}`);
  
  // Read deployment data
  const deploymentData: DeploymentData = JSON.parse(readFileSync(deploymentFile, "utf-8"));
  
  console.log(`🌐 Network: ${deploymentData.network} (Chain ID: ${deploymentData.chainId})`);
  console.log(`📝 Contract Addresses:`);
  console.log(`   - CrawlNFT: ${deploymentData.contracts.crawlNFT.address}`);
  console.log(`   - PaymentProcessor: ${deploymentData.contracts.paymentProcessor.address}`);
  console.log(`   - ProofOfCrawlLedger: ${deploymentData.contracts.proofOfCrawlLedger.address}`);
  
  // Update subgraph configuration
  await updateSubgraphConfig(deploymentData);
  
  // Update SDK defaults
  await updateSDKDefaults(deploymentData);
  
  // Update dashboard configuration
  await updateDashboardConfig(deploymentData);
  
  // Update Cloudflare Worker configuration template
  await updateCloudflareTemplate(deploymentData);
  
  // Generate environment files
  await generateEnvFiles(deploymentData);
  
  console.log("\n✅ Address propagation completed successfully!");
  console.log("\n📋 Next Steps:");
  console.log("1. Review updated configuration files");
  console.log("2. Update environment variables in production deployments");
  console.log("3. Redeploy affected services");
}

/**
 * Update subgraph configuration
 */
async function updateSubgraphConfig(deployment: DeploymentData) {
  console.log("\n📊 Updating Subgraph Configuration...");
  
  const networkMapping: Record<number, string> = {
    8453: "base",
    84532: "base-sepolia",
    31337: "localhost"
  };
  
  const networkName = networkMapping[deployment.chainId];
  if (!networkName) {
    console.log(`   ⚠️ Skipping subgraph update - unsupported chain ID: ${deployment.chainId}`);
    return;
  }
  
  const subgraphConfigPath = join(__dirname, `../../subgraph/config/${networkName}.json`);
  
  if (!existsSync(subgraphConfigPath)) {
    console.log(`   ⚠️ Subgraph config not found: ${subgraphConfigPath}`);
    return;
  }
  
  const config: NetworkConfig = JSON.parse(readFileSync(subgraphConfigPath, "utf-8"));
  
  config.crawlNFTAddress = deployment.contracts.crawlNFT.address;
  config.paymentProcessorAddress = deployment.contracts.paymentProcessor.address;
  
  writeFileSync(subgraphConfigPath, JSON.stringify(config, null, 2));
  console.log(`   ✅ Updated: ${subgraphConfigPath}`);
}

/**
 * Update SDK default addresses
 */
async function updateSDKDefaults(deployment: DeploymentData) {
  console.log("\n🔧 Updating SDK Configuration...");
  
  const sdkPath = join(__dirname, "../../sdk-js/src/index.ts");
  
  if (!existsSync(sdkPath)) {
    console.log(`   ⚠️ SDK file not found: ${sdkPath}`);
    return;
  }
  
  let sdkContent = readFileSync(sdkPath, "utf-8");
  
  // Create backup
  writeFileSync(`${sdkPath}.backup`, sdkContent);
  
  // Update PaymentProcessor address in createBaseSDK function
  if (deployment.chainId === 8453) { // Base mainnet
    const paymentProcessorRegex = /paymentProcessorAddress:\s*['"][^'"]*['"]/;
    if (sdkContent.includes("paymentProcessorAddress")) {
      sdkContent = sdkContent.replace(
        paymentProcessorRegex,
        `paymentProcessorAddress: '${deployment.contracts.paymentProcessor.address}'`
      );
      console.log(`   ✅ Updated Base mainnet PaymentProcessor address`);
    } else {
      // Add to config interface documentation
      const configComment = "// Payment configuration";
      sdkContent = sdkContent.replace(
        configComment,
        `${configComment}\n  // PaymentProcessor: ${deployment.contracts.paymentProcessor.address} (Base mainnet)`
      );
      console.log(`   ✅ Added Base mainnet PaymentProcessor address to docs`);
    }
  } else if (deployment.chainId === 84532) { // Base Sepolia
    const configComment = "// Payment configuration";
    sdkContent = sdkContent.replace(
      configComment,
      `${configComment}\n  // PaymentProcessor: ${deployment.contracts.paymentProcessor.address} (Base Sepolia)`
    );
    console.log(`   ✅ Added Base Sepolia PaymentProcessor address to docs`);
  }
  
  writeFileSync(sdkPath, sdkContent);
  console.log(`   ✅ Updated: ${sdkPath}`);
}

/**
 * Update dashboard configuration
 */
async function updateDashboardConfig(deployment: DeploymentData) {
  console.log("\n🖥️ Updating Dashboard Configuration...");
  
  // Create config file for dashboard
  const configPath = join(__dirname, "../../dashboard/config/contracts.json");
  const configDir = join(__dirname, "../../dashboard/config");
  
  // Create config directory if it doesn't exist
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
  
  const dashboardConfig = {
    network: deployment.network,
    chainId: deployment.chainId,
    contracts: {
      crawlNFT: deployment.contracts.crawlNFT.address,
      paymentProcessor: deployment.contracts.paymentProcessor.address,
      proofOfCrawlLedger: deployment.contracts.proofOfCrawlLedger.address,
      usdc: deployment.contracts.mockUSDC?.address || getUSDCAddress(deployment.chainId)
    },
    blockExplorers: {
      default: {
        name: getExplorerName(deployment.chainId),
        url: getExplorerUrl(deployment.chainId)
      }
    }
  };
  
  writeFileSync(configPath, JSON.stringify(dashboardConfig, null, 2));
  console.log(`   ✅ Created: ${configPath}`);
}

/**
 * Update Cloudflare Worker configuration template
 */
async function updateCloudflareTemplate(deployment: DeploymentData) {
  console.log("\n☁️ Updating Cloudflare Worker Template...");
  
  const templatePath = join(__dirname, "../../gateway-cloudflare/wrangler.toml.template");
  const templateDir = join(__dirname, "../../gateway-cloudflare");
  
  if (!existsSync(templateDir)) {
    console.log(`   ⚠️ Cloudflare gateway directory not found`);
    return;
  }
  
  let template = `name = "tachi-gateway"
main = "src/index.ts"
compatibility_date = "2024-09-26"

[vars]
BASE_RPC_URL = "https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY"
PAYMENT_PROCESSOR_ADDRESS = "${deployment.contracts.paymentProcessor.address}"
PROOF_OF_CRAWL_LEDGER_ADDRESS = "${deployment.contracts.proofOfCrawlLedger.address}"
USDC_ADDRESS = "${getUSDCAddress(deployment.chainId)}"
CRAWL_TOKEN_ID = "1"
PRICE_USDC = "1.0"
PUBLISHER_ADDRESS = "YOUR_PUBLISHER_ADDRESS"
ENVIRONMENT = "production"

# Security settings
RATE_LIMIT_REQUESTS = "100"
MAX_REQUEST_SIZE = "1048576"
ENABLE_LOGGING = "true"

# KV Namespace bindings
[[kv_namespaces]]
binding = "USED_TX_HASHES"
id = "YOUR_KV_NAMESPACE_ID"
preview_id = "YOUR_PREVIEW_KV_NAMESPACE_ID"
`;

  writeFileSync(templatePath, template);
  console.log(`   ✅ Created: ${templatePath}`);
  
  // Also create environment-specific templates
  const envTemplates = {
    "base": deployment.chainId === 8453,
    "base-sepolia": deployment.chainId === 84532
  };
  
  for (const [env, isCurrentNetwork] of Object.entries(envTemplates)) {
    if (!isCurrentNetwork) continue;
    
    const envTemplatePath = join(templateDir, `wrangler.${env}.toml.template`);
    const envTemplate = template.replace(
      'name = "tachi-gateway"',
      `name = "tachi-gateway-${env}"`
    );
    
    writeFileSync(envTemplatePath, envTemplate);
    console.log(`   ✅ Created: ${envTemplatePath}`);
  }
}

/**
 * Generate environment files
 */
async function generateEnvFiles(deployment: DeploymentData) {
  console.log("\n📄 Generating Environment Files...");
  
  const networkSuffix = deployment.chainId === 8453 ? "mainnet" : 
                       deployment.chainId === 84532 ? "sepolia" : "local";
  
  // Generate .env template for each component
  const envTemplates = {
    dashboard: `# Dashboard Environment Configuration
NEXT_PUBLIC_NETWORK=${deployment.network.toLowerCase().replace(" ", "-")}
NEXT_PUBLIC_CHAIN_ID=${deployment.chainId}
NEXT_PUBLIC_CRAWL_NFT_ADDRESS=${deployment.contracts.crawlNFT.address}
NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS=${deployment.contracts.paymentProcessor.address}
NEXT_PUBLIC_PROOF_LEDGER_ADDRESS=${deployment.contracts.proofOfCrawlLedger.address}
NEXT_PUBLIC_USDC_ADDRESS=${getUSDCAddress(deployment.chainId)}
NEXT_PUBLIC_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
`,
    sdk: `# SDK Environment Configuration
TACHI_NETWORK=${deployment.network.toLowerCase().replace(" ", "-")}
TACHI_CHAIN_ID=${deployment.chainId}
TACHI_PAYMENT_PROCESSOR_ADDRESS=${deployment.contracts.paymentProcessor.address}
TACHI_USDC_ADDRESS=${getUSDCAddress(deployment.chainId)}
TACHI_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
`,
    gateway: `# Gateway Environment Configuration
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
PAYMENT_PROCESSOR_ADDRESS=${deployment.contracts.paymentProcessor.address}
PROOF_OF_CRAWL_LEDGER_ADDRESS=${deployment.contracts.proofOfCrawlLedger.address}
USDC_ADDRESS=${getUSDCAddress(deployment.chainId)}
PUBLISHER_ADDRESS=YOUR_PUBLISHER_ADDRESS
PRIVATE_KEY=YOUR_PRIVATE_KEY
CRAWL_TOKEN_ID=1
PRICE_USDC=1.0
`
  };
  
  const envDir = join(__dirname, "../env-templates");
  if (!existsSync(envDir)) {
    mkdirSync(envDir, { recursive: true });
  }
  
  for (const [component, content] of Object.entries(envTemplates)) {
    const filePath = join(envDir, `.env.${component}.${networkSuffix}.template`);
    writeFileSync(filePath, content);
    console.log(`   ✅ Created: ${filePath}`);
  }
}

/**
 * Utility functions
 */
function getUSDCAddress(chainId: number): string {
  const usdcAddresses: Record<number, string> = {
    8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base mainnet
    84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia
    31337: "0x..." // Will be set by deployment script
  };
  
  return usdcAddresses[chainId] || "0x0000000000000000000000000000000000000000";
}

function getExplorerName(chainId: number): string {
  const names: Record<number, string> = {
    8453: "BaseScan",
    84532: "BaseScan Sepolia",
    31337: "Local Explorer"
  };
  
  return names[chainId] || "Unknown Explorer";
}

function getExplorerUrl(chainId: number): string {
  const urls: Record<number, string> = {
    8453: "https://basescan.org",
    84532: "https://sepolia.basescan.org",
    31337: "http://localhost:8545"
  };
  
  return urls[chainId] || "https://etherscan.io";
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error("Usage: npm run propagate-addresses <network> [chainId]");
    console.error("Example: npm run propagate-addresses base 8453");
    process.exit(1);
  }
  
  const [networkName, chainIdStr] = args;
  const chainId = chainIdStr ? parseInt(chainIdStr) : undefined;
  
  propagateAddresses(networkName, chainId)
    .then(() => {
      console.log("\n🎉 Address propagation completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Address propagation failed:");
      console.error(error);
      process.exit(1);
    });
}

module.exports = { propagateAddresses };