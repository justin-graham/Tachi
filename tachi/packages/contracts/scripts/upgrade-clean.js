"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const fs_1 = require("fs");
const path_1 = require("path");
async function main() {
    const [deployer] = await hardhat_1.ethers.getSigners();
    function log(message) {
        console.log(message);
    }
    log(`\n🔄 Upgrading Contracts on ${hardhat_1.network.name}...`);
    log(`📋 Deployer: ${deployer.address}`);
    log("=".repeat(50));
    // Load existing deployment info
    const deploymentFile = (0, path_1.join)("deployments", `${hardhat_1.network.name}-upgradeable.json`);
    let existingDeployment;
    try {
        existingDeployment = JSON.parse((0, fs_1.readFileSync)(deploymentFile, "utf8"));
    }
    catch (error) {
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
        await hardhat_1.upgrades.forceImport(currentCrawlNFTAddress, await hardhat_1.ethers.getContractFactory("CrawlNFTUpgradeable"), {
            kind: "uups"
        });
        await hardhat_1.upgrades.forceImport(currentPaymentProcessorAddress, await hardhat_1.ethers.getContractFactory("PaymentProcessorUpgradeable"), {
            kind: "uups"
        });
        log("✅ Proxy deployments imported successfully");
        // 1. Upgrade CrawlNFT
        log("\n1️⃣ Upgrading CrawlNFTUpgradeable...");
        const CrawlNFTUpgradeable = await hardhat_1.ethers.getContractFactory("CrawlNFTUpgradeable");
        // Validate the proxy before upgrading
        await hardhat_1.upgrades.validateUpgrade(currentCrawlNFTAddress, CrawlNFTUpgradeable, {
            kind: "uups"
        });
        const upgradedCrawlNFT = await hardhat_1.upgrades.upgradeProxy(currentCrawlNFTAddress, CrawlNFTUpgradeable);
        await upgradedCrawlNFT.waitForDeployment();
        log(`✅ CrawlNFTUpgradeable upgraded at: ${currentCrawlNFTAddress}`);
        // 2. Upgrade PaymentProcessor
        log("\n2️⃣ Upgrading PaymentProcessorUpgradeable...");
        const PaymentProcessorUpgradeable = await hardhat_1.ethers.getContractFactory("PaymentProcessorUpgradeable");
        // Validate the proxy before upgrading
        await hardhat_1.upgrades.validateUpgrade(currentPaymentProcessorAddress, PaymentProcessorUpgradeable, {
            kind: "uups"
        });
        const upgradedPaymentProcessor = await hardhat_1.upgrades.upgradeProxy(currentPaymentProcessorAddress, PaymentProcessorUpgradeable);
        await upgradedPaymentProcessor.waitForDeployment();
        log(`✅ PaymentProcessorUpgradeable upgraded at: ${currentPaymentProcessorAddress}`);
        // 3. Verify new implementation contracts (if not local)
        if (hardhat_1.network.name !== "hardhat" && hardhat_1.network.name !== "localhost") {
            log("\n🔍 Verifying new implementation contracts...");
            try {
                // Get new implementation addresses
                const newCrawlNFTImpl = await hardhat_1.upgrades.erc1967.getImplementationAddress(currentCrawlNFTAddress);
                const newPaymentProcessorImpl = await hardhat_1.upgrades.erc1967.getImplementationAddress(currentPaymentProcessorAddress);
                // Verify implementations
                await (0, hardhat_1.run)("verify:verify", {
                    address: newCrawlNFTImpl,
                    constructorArguments: [],
                });
                await (0, hardhat_1.run)("verify:verify", {
                    address: newPaymentProcessorImpl,
                    constructorArguments: [],
                });
                log("✅ New implementation contracts verified");
            }
            catch (error) {
                log(`⚠️ Verification failed: ${error}`);
            }
        }
        // 4. Test upgraded contracts
        log("\n🧪 Testing upgraded contracts...");
        // Test CrawlNFT
        const crawlNFT = await hardhat_1.ethers.getContractAt("CrawlNFTUpgradeable", currentCrawlNFTAddress);
        const name = await crawlNFT.name();
        log(`📋 CrawlNFT name: ${name}`);
        // Test PaymentProcessor
        const paymentProcessor = await hardhat_1.ethers.getContractAt("PaymentProcessorUpgradeable", currentPaymentProcessorAddress);
        const usdcToken = await paymentProcessor.usdcToken();
        log(`💰 PaymentProcessor USDC: ${usdcToken}`);
        log("\n" + "=".repeat(50));
        log("🎉 UPGRADE COMPLETE!");
        log("=".repeat(50));
        log(`📋 Network: ${hardhat_1.network.name}`);
        log(`🏠 CrawlNFT Proxy: ${currentCrawlNFTAddress}`);
        log(`💰 PaymentProcessor Proxy: ${currentPaymentProcessorAddress}`);
        log(`👤 Upgrader: ${deployer.address}`);
        log("=".repeat(50));
    }
    catch (error) {
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
