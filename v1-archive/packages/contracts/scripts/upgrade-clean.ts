import { ethers, upgrades, run, network } from "hardhat";
import { readFileSync } from "fs";
import { join } from "path";

async function main() {
  const [deployer] = await ethers.getSigners();

  function log(message: string) {
    console.log(message);
  }

  log(`\n🔄 Upgrading Contracts on ${network.name}...`);
  log(`📋 Deployer: ${deployer.address}`);
  log("=".repeat(50));

  // Load existing deployment info
  const deploymentFile = join("deployments", `${network.name}-upgradeable.json`);
  let existingDeployment;
  
  try {
    existingDeployment = JSON.parse(readFileSync(deploymentFile, "utf8"));
  } catch (error) {
    log(`❌ Could not load existing deployment from ${deploymentFile}`);
    log(`Please run deploy script first.`);
    process.exit(1);
  }

  try {
    // Import existing proxies for upgrade tracking
    log("\n🔗 Importing existing proxy deployments...");
    
    const currentCrawlNFTAddress = existingDeployment.contracts.CrawlNFTUpgradeable.proxy;
    const currentPaymentProcessorAddress = existingDeployment.contracts.PaymentProcessorUpgradeable.proxy;
    
    // Force import the existing proxies
    await upgrades.forceImport(currentCrawlNFTAddress, await ethers.getContractFactory("CrawlNFTUpgradeable"), {
      kind: "uups"
    });
    
    await upgrades.forceImport(currentPaymentProcessorAddress, await ethers.getContractFactory("PaymentProcessorUpgradeable"), {
      kind: "uups"
    });
    
    log("✅ Proxy deployments imported successfully");

    // 1. Upgrade CrawlNFT
    log("\n1️⃣ Upgrading CrawlNFTUpgradeable...");
    const CrawlNFTUpgradeable = await ethers.getContractFactory("CrawlNFTUpgradeable");
    
    // Validate the proxy before upgrading
    await upgrades.validateUpgrade(currentCrawlNFTAddress, CrawlNFTUpgradeable, {
      kind: "uups"
    });
    
    const upgradedCrawlNFT = await upgrades.upgradeProxy(
      currentCrawlNFTAddress,
      CrawlNFTUpgradeable
    );
    
    await upgradedCrawlNFT.waitForDeployment();
    log(`✅ CrawlNFTUpgradeable upgraded at: ${currentCrawlNFTAddress}`);

    // 2. Upgrade PaymentProcessor
    log("\n2️⃣ Upgrading PaymentProcessorUpgradeable...");
    const PaymentProcessorUpgradeable = await ethers.getContractFactory("PaymentProcessorUpgradeable");
    
    // Validate the proxy before upgrading
    await upgrades.validateUpgrade(currentPaymentProcessorAddress, PaymentProcessorUpgradeable, {
      kind: "uups"
    });
    
    const upgradedPaymentProcessor = await upgrades.upgradeProxy(
      currentPaymentProcessorAddress,
      PaymentProcessorUpgradeable
    );
    
    await upgradedPaymentProcessor.waitForDeployment();
    log(`✅ PaymentProcessorUpgradeable upgraded at: ${currentPaymentProcessorAddress}`);

    // 3. Verify new implementation contracts (if not local)
    if (network.name !== "hardhat" && network.name !== "localhost") {
      log("\n🔍 Verifying new implementation contracts...");
      
      try {
        // Get new implementation addresses
        const newCrawlNFTImpl = await upgrades.erc1967.getImplementationAddress(currentCrawlNFTAddress);
        const newPaymentProcessorImpl = await upgrades.erc1967.getImplementationAddress(currentPaymentProcessorAddress);
        
        // Verify implementations
        await run("verify:verify", {
          address: newCrawlNFTImpl,
          constructorArguments: [],
        });
        
        await run("verify:verify", {
          address: newPaymentProcessorImpl,
          constructorArguments: [],
        });
        
        log("✅ New implementation contracts verified");
      } catch (error) {
        log(`⚠️ Verification failed: ${error}`);
      }
    }

    // 4. Test upgraded contracts
    log("\n🧪 Testing upgraded contracts...");
    
    // Test CrawlNFT
    const crawlNFT = await ethers.getContractAt("CrawlNFTUpgradeable", currentCrawlNFTAddress);
    const name = await crawlNFT.name();
    log(`📋 CrawlNFT name: ${name}`);
    
    // Test PaymentProcessor
    const paymentProcessor = await ethers.getContractAt("PaymentProcessorUpgradeable", currentPaymentProcessorAddress);
    const usdcToken = await paymentProcessor.usdcToken();
    log(`💰 PaymentProcessor USDC: ${usdcToken}`);

    log("\n" + "=".repeat(50));
    log("🎉 UPGRADE COMPLETE!");
    log("=".repeat(50));
    log(`📋 Network: ${network.name}`);
    log(`🏠 CrawlNFT Proxy: ${currentCrawlNFTAddress}`);
    log(`💰 PaymentProcessor Proxy: ${currentPaymentProcessorAddress}`);
    log(`👤 Upgrader: ${deployer.address}`);
    log("=".repeat(50));

  } catch (error) {
    log(`❌ Upgrade failed: ${error}`);
    throw error;
  }
}

// Run the upgrade
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
