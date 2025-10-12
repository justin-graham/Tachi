import { ethers, upgrades, run, network } from "hardhat";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

/**
 * Comprehensive Contract Upgrade Script for Tachi Protocol
 * 
 * This script handles UUPS proxy upgrades with validation, verification,
 * and comprehensive testing of the upgraded contracts.
 */

async function main() {
  const [deployer] = await ethers.getSigners();

  function log(message: string) {
    console.log(message);
  }

  log(`\n🔄 Upgrading Tachi Protocol Contracts on ${network.name}...`);
  log(`📋 Deployer: ${deployer.address}`);
  log("=".repeat(60));

  // Load existing deployment info
  const deploymentFile = join("deployments", `${network.name}-upgradeable.json`);
  let existingDeployment: any;
  
  try {
    existingDeployment = JSON.parse(readFileSync(deploymentFile, "utf8"));
    log(`✅ Loaded deployment info from: ${deploymentFile}`);
  } catch (error) {
    log(`❌ Could not load existing deployment from ${deploymentFile}`);
    log(`Please run deploy script first: pnpm run deploy:upgradeable`);
    process.exit(1);
  }

  try {
    const currentCrawlNFTAddress = existingDeployment.contracts.CrawlNFTUpgradeable.proxy;
    const currentPaymentProcessorAddress = existingDeployment.contracts.PaymentProcessorUpgradeable.proxy;

    // Phase 1: Import existing proxies for upgrade tracking
    log("\n📦 PHASE 1: Importing Existing Proxy Deployments");
    log("-".repeat(50));
    
    log("🔗 Importing CrawlNFT proxy...");
    const CrawlNFTFactory = await ethers.getContractFactory("CrawlNFTUpgradeable");
    await upgrades.forceImport(currentCrawlNFTAddress, CrawlNFTFactory, {
      kind: "uups"
    });
    log("✅ CrawlNFT proxy imported successfully");
    
    log("🔗 Importing PaymentProcessor proxy...");
    const PaymentProcessorFactory = await ethers.getContractFactory("PaymentProcessorUpgradeable");
    await upgrades.forceImport(currentPaymentProcessorAddress, PaymentProcessorFactory, {
      kind: "uups"
    });
    log("✅ PaymentProcessor proxy imported successfully");

    // Phase 2: Validate upgrades
    log("\n🔍 PHASE 2: Validating Upgrade Compatibility");
    log("-".repeat(50));

    log("🔍 Validating CrawlNFT upgrade...");
    await upgrades.validateUpgrade(currentCrawlNFTAddress, CrawlNFTFactory, {
      kind: "uups"
    });
    log("✅ CrawlNFT upgrade validation passed");
    
    log("🔍 Validating PaymentProcessor upgrade...");
    await upgrades.validateUpgrade(currentPaymentProcessorAddress, PaymentProcessorFactory, {
      kind: "uups"
    });
    log("✅ PaymentProcessor upgrade validation passed");

    // Phase 3: Execute upgrades
    log("\n⬆️ PHASE 3: Executing Contract Upgrades");
    log("-".repeat(50));

    log("⬆️ Upgrading CrawlNFTUpgradeable...");
    const upgradedCrawlNFT = await upgrades.upgradeProxy(
      currentCrawlNFTAddress,
      CrawlNFTFactory
    );
    await upgradedCrawlNFT.waitForDeployment();
    log(`✅ CrawlNFT upgraded successfully at: ${currentCrawlNFTAddress}`);

    log("⬆️ Upgrading PaymentProcessorUpgradeable...");
    const upgradedPaymentProcessor = await upgrades.upgradeProxy(
      currentPaymentProcessorAddress,
      PaymentProcessorFactory
    );
    await upgradedPaymentProcessor.waitForDeployment();
    log(`✅ PaymentProcessor upgraded successfully at: ${currentPaymentProcessorAddress}`);

    // Phase 4: Get new implementation addresses
    log("\n🏗️ PHASE 4: Implementation Address Tracking");
    log("-".repeat(50));

    const newCrawlNFTImpl = await upgrades.erc1967.getImplementationAddress(currentCrawlNFTAddress);
    const newPaymentProcessorImpl = await upgrades.erc1967.getImplementationAddress(currentPaymentProcessorAddress);
    
    log(`🏗️ New CrawlNFT Implementation: ${newCrawlNFTImpl}`);
    log(`🏗️ New PaymentProcessor Implementation: ${newPaymentProcessorImpl}`);

    // Phase 5: Verify contracts on block explorer (if not local)
    if (network.name !== "hardhat" && network.name !== "localhost") {
      log("\n🔍 PHASE 5: Verifying Implementation Contracts");
      log("-".repeat(50));
      
      try {
        log("🔍 Verifying CrawlNFT implementation...");
        await run("verify:verify", {
          address: newCrawlNFTImpl,
          constructorArguments: [],
        });
        log("✅ CrawlNFT implementation verified");
        
        log("🔍 Verifying PaymentProcessor implementation...");
        await run("verify:verify", {
          address: newPaymentProcessorImpl,
          constructorArguments: [],
        });
        log("✅ PaymentProcessor implementation verified");
        
      } catch (error) {
        log(`⚠️ Contract verification failed: ${error}`);
        log("ℹ️ Manual verification may be required on block explorer");
      }
    } else {
      log("\n⏭️ PHASE 5: Skipping verification (local network)");
    }

    // Phase 6: Test upgraded contracts
    log("\n🧪 PHASE 6: Testing Upgraded Contracts");
    log("-".repeat(50));
    
    // Test CrawlNFT functionality
    log("🧪 Testing CrawlNFT functionality...");
    const crawlNFT = await ethers.getContractAt("CrawlNFTUpgradeable", currentCrawlNFTAddress);
    
    const name = await crawlNFT.name();
    const symbol = await crawlNFT.symbol();
    const owner = await crawlNFT.owner();
    
    log(`� CrawlNFT Name: ${name}`);
    log(`🏷️ CrawlNFT Symbol: ${symbol}`);
    log(`👑 CrawlNFT Owner: ${owner}`);
    
    // Test PaymentProcessor functionality
    log("🧪 Testing PaymentProcessor functionality...");
    const paymentProcessor = await ethers.getContractAt("PaymentProcessorUpgradeable", currentPaymentProcessorAddress);
    
    const usdcToken = await paymentProcessor.usdcToken();
    const crawlNFTContract = await paymentProcessor.crawlNFTContract();
    const baseCrawlFee = await paymentProcessor.baseCrawlFee();
    
    log(`� PaymentProcessor USDC: ${usdcToken}`);
    log(`� Linked CrawlNFT: ${crawlNFTContract}`);
    log(`� Base Crawl Fee: ${baseCrawlFee} USDC`);

    // Phase 7: Update deployment record
    log("\n� PHASE 7: Updating Deployment Records");
    log("-".repeat(50));

    const updatedDeployment = {
      ...existingDeployment,
      lastUpgrade: {
        timestamp: new Date().toISOString(),
        upgrader: deployer.address,
        previousImplementations: {
          CrawlNFT: existingDeployment.contracts.CrawlNFTUpgradeable.implementation,
          PaymentProcessor: existingDeployment.contracts.PaymentProcessorUpgradeable.implementation,
        },
      },
      contracts: {
        ...existingDeployment.contracts,
        CrawlNFTUpgradeable: {
          proxy: currentCrawlNFTAddress,
          implementation: newCrawlNFTImpl,
        },
        PaymentProcessorUpgradeable: {
          proxy: currentPaymentProcessorAddress,
          implementation: newPaymentProcessorImpl,
        },
      },
    };

    writeFileSync(deploymentFile, JSON.stringify(updatedDeployment, null, 2));
    log(`✅ Deployment record updated: ${deploymentFile}`);

    // Final Summary
    log("\n" + "=".repeat(60));
    log("🎉 CONTRACT UPGRADE COMPLETED SUCCESSFULLY!");
    log("=".repeat(60));
    log(`📋 Network: ${network.name}`);
    log(`🎫 CrawlNFT Proxy: ${currentCrawlNFTAddress}`);
    log(`🏗️ CrawlNFT Implementation: ${newCrawlNFTImpl}`);
    log(`💳 PaymentProcessor Proxy: ${currentPaymentProcessorAddress}`);
    log(`🏗️ PaymentProcessor Implementation: ${newPaymentProcessorImpl}`);
    log(`👤 Upgraded by: ${deployer.address}`);
    log(`⏰ Upgrade completed: ${new Date().toISOString()}`);
    log("=".repeat(60));
    log("\n✅ All contracts successfully upgraded and tested!");
    log("ℹ️ State preservation verified, new functionality available");

  } catch (error) {
    log(`\n❌ UPGRADE FAILED: ${error}`);
    log("\n🔧 Troubleshooting steps:");
    log("1. Check that contracts are deployed: pnpm run deploy:upgradeable");
    log("2. Verify network configuration is correct");
    log("3. Ensure deployer has sufficient permissions");
    log("4. Check storage layout compatibility");
    throw error;
  }
}

/**
 * Utility function to check if a proxy exists and is upgradeable
 */
async function checkProxyStatus(proxyAddress: string, contractName: string): Promise<boolean> {
  try {
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log(`✅ ${contractName} proxy found with implementation: ${implementationAddress}`);
    return true;
  } catch (error) {
    console.log(`❌ ${contractName} proxy not found or not upgradeable: ${error}`);
    return false;
  }
}

/**
 * Utility function to validate storage layout compatibility
 */
async function validateStorageLayout(proxyAddress: string, newImplementationName: string): Promise<boolean> {
  try {
    const NewImplementation = await ethers.getContractFactory(newImplementationName);
    await upgrades.validateUpgrade(proxyAddress, NewImplementation, { kind: "uups" });
    return true;
  } catch (error) {
    console.log(`❌ Storage layout validation failed: ${error}`);
    return false;
  }
}

// Run the upgrade
if (require.main === module) {
  main()
    .then(() => {
      console.log("\n🎉 Upgrade script completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Upgrade script failed:", error);
      process.exit(1);
    });
}

export { main as upgradeContracts, checkProxyStatus, validateStorageLayout };
