import { ethers, upgrades, run, network } from "hardhat";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

async function main() {
  const [deployer] = await ethers.getSigners();

  function log(message: string) {
    console.log(message);
  }

  log(`\n🚀 Deploying Upgradeable Contracts on ${network.name}...`);
  log(`📋 Deployer: ${deployer.address}`);
  log("=".repeat(50));

  // Get deployment configuration based on network
  const config = getNetworkConfig(network.name);
  
  try {
    // 1. Deploy CrawlNFT (Upgradeable)
    log("\n1️⃣ Deploying CrawlNFTUpgradeable...");
    const CrawlNFTUpgradeable = await ethers.getContractFactory("CrawlNFTUpgradeable");
    
    const crawlNFTProxy = await upgrades.deployProxy(
      CrawlNFTUpgradeable,
      ["Tachi Publisher License", "TPL", "https://metadata.tachi.com/"], // correct initializer parameters
      {
        kind: "uups",
      }
    );
    
    await crawlNFTProxy.waitForDeployment();
    const crawlNFTAddress = await crawlNFTProxy.getAddress();
    
    log(`✅ CrawlNFTUpgradeable deployed to: ${crawlNFTAddress}`);

    // 2. Deploy PaymentProcessor (Upgradeable)
    log("\n2️⃣ Deploying PaymentProcessorUpgradeable...");
    const PaymentProcessorUpgradeable = await ethers.getContractFactory("PaymentProcessorUpgradeable");
    
    const paymentProcessorProxy = await upgrades.deployProxy(
      PaymentProcessorUpgradeable,
      [config.usdcToken, crawlNFTAddress], // initialize with USDC token and CrawlNFT address
      {
        kind: "uups",
      }
    );
    
    await paymentProcessorProxy.waitForDeployment();
    const paymentProcessorAddress = await paymentProcessorProxy.getAddress();
    
    log(`✅ PaymentProcessorUpgradeable deployed to: ${paymentProcessorAddress}`);

    // 3. Verify implementation contracts on block explorer (if not local)
    if (network.name !== "hardhat" && network.name !== "localhost") {
      log("\n🔍 Verifying implementation contracts...");
      
      try {
        // Get implementation addresses
        const crawlNFTImpl = await upgrades.erc1967.getImplementationAddress(crawlNFTAddress);
        const paymentProcessorImpl = await upgrades.erc1967.getImplementationAddress(paymentProcessorAddress);
        
        // Verify implementations
        await run("verify:verify", {
          address: crawlNFTImpl,
          constructorArguments: [],
        });
        
        await run("verify:verify", {
          address: paymentProcessorImpl,
          constructorArguments: [],
        });
        
        log("✅ Implementation contracts verified");
      } catch (error) {
        log(`⚠️ Verification failed: ${error}`);
      }
    }

    // 4. Save deployment info to file
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const summary = {
      network: network.name,
      chainId: chainId.toString(),
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: {
        CrawlNFTUpgradeable: {
          proxy: crawlNFTAddress,
          implementation: await upgrades.erc1967.getImplementationAddress(crawlNFTAddress),
        },
        PaymentProcessorUpgradeable: {
          proxy: paymentProcessorAddress,
          implementation: await upgrades.erc1967.getImplementationAddress(paymentProcessorAddress),
        },
      },
      config,
    };

    // Ensure deployments directory exists
    mkdirSync("deployments", { recursive: true });
    
    // Save deployment summary
    const deploymentFile = join("deployments", `${network.name}-upgradeable.json`);
    writeFileSync(deploymentFile, JSON.stringify(summary, null, 2));

    log("\n" + "=".repeat(50));
    log("🎉 DEPLOYMENT COMPLETE!");
    log("=".repeat(50));
    log(`📋 Network: ${network.name}`);
    log(`🏠 CrawlNFT Proxy: ${crawlNFTAddress}`);
    log(`💰 PaymentProcessor Proxy: ${paymentProcessorAddress}`);
    log(`👤 Owner: ${deployer.address}`);
    log(`💱 USDC Token: ${config.usdcToken}`);
    log(`📄 Deployment saved to: ${deploymentFile}`);
    log("=".repeat(50));

  } catch (error) {
    log(`❌ Deployment failed: ${error}`);
    throw error;
  }
}

// Network configuration
function getNetworkConfig(networkName: string) {
  const configs: Record<string, any> = {
    "base-sepolia": {
      usdcToken: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia USDC
      confirmations: 2,
    },
    "base": {
      usdcToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base Mainnet USDC
      confirmations: 3,
    },
    "hardhat": {
      usdcToken: "0x0000000000000000000000000000000000000001", // Mock for testing
      confirmations: 1,
    },
    "localhost": {
      usdcToken: "0x0000000000000000000000000000000000000001", // Mock for testing
      confirmations: 1,
    },
  };

  return configs[networkName] || configs["hardhat"];
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
