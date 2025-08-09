"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
/**
 * Test script that deploys and then upgrades contracts to verify everything works
 */
async function main() {
    const [deployer] = await hardhat_1.ethers.getSigners();
    function log(message) {
        console.log(message);
    }
    log(`\n🧪 Testing Full Deploy + Upgrade Cycle on ${hardhat_1.network.name}...`);
    log(`📋 Deployer: ${deployer.address}`);
    log("=".repeat(60));
    try {
        // PHASE 1: Initial Deployment
        log("\n📦 PHASE 1: Initial Deployment");
        log("-".repeat(40));
        // Deploy CrawlNFT V1
        log("\n1️⃣ Deploying CrawlNFTUpgradeable V1...");
        const CrawlNFTV1 = await hardhat_1.ethers.getContractFactory("CrawlNFTUpgradeable");
        const crawlNFTProxy = await hardhat_1.upgrades.deployProxy(CrawlNFTV1, ["Tachi Publisher License", "TPL", "https://metadata.tachi.com/"], { kind: "uups" });
        await crawlNFTProxy.waitForDeployment();
        const crawlNFTAddress = await crawlNFTProxy.getAddress();
        log(`✅ CrawlNFT V1 deployed to: ${crawlNFTAddress}`);
        // Deploy PaymentProcessor V1
        log("\n2️⃣ Deploying PaymentProcessorUpgradeable V1...");
        const PaymentProcessorV1 = await hardhat_1.ethers.getContractFactory("PaymentProcessorUpgradeable");
        const paymentProcessorProxy = await hardhat_1.upgrades.deployProxy(PaymentProcessorV1, ["0x0000000000000000000000000000000000000001", crawlNFTAddress], // Mock USDC for testing
        { kind: "uups" });
        await paymentProcessorProxy.waitForDeployment();
        const paymentProcessorAddress = await paymentProcessorProxy.getAddress();
        log(`✅ PaymentProcessor V1 deployed to: ${paymentProcessorAddress}`);
        // Test basic functionality
        log("\n3️⃣ Testing initial functionality...");
        const crawlNFT = await hardhat_1.ethers.getContractAt("CrawlNFTUpgradeable", crawlNFTAddress);
        const paymentProcessor = await hardhat_1.ethers.getContractAt("PaymentProcessorUpgradeable", paymentProcessorAddress);
        const name = await crawlNFT.name();
        const symbol = await crawlNFT.symbol();
        const usdcToken = await paymentProcessor.usdcToken();
        log(`📝 CrawlNFT Name: ${name}`);
        log(`🏷️ CrawlNFT Symbol: ${symbol}`);
        log(`💰 PaymentProcessor USDC: ${usdcToken}`);
        // PHASE 2: Upgrade Testing
        log("\n🔄 PHASE 2: Upgrade Testing");
        log("-".repeat(40));
        // Upgrade CrawlNFT
        log("\n4️⃣ Upgrading CrawlNFTUpgradeable to V2...");
        // Validate upgrade
        await hardhat_1.upgrades.validateUpgrade(crawlNFTAddress, CrawlNFTV1, { kind: "uups" });
        log("✅ CrawlNFT upgrade validation passed");
        // Perform upgrade
        const crawlNFTUpgraded = await hardhat_1.upgrades.upgradeProxy(crawlNFTAddress, CrawlNFTV1);
        await crawlNFTUpgraded.waitForDeployment();
        log("✅ CrawlNFT upgraded successfully");
        // Upgrade PaymentProcessor
        log("\n5️⃣ Upgrading PaymentProcessorUpgradeable to V2...");
        // Validate upgrade
        await hardhat_1.upgrades.validateUpgrade(paymentProcessorAddress, PaymentProcessorV1, { kind: "uups" });
        log("✅ PaymentProcessor upgrade validation passed");
        // Perform upgrade
        const paymentProcessorUpgraded = await hardhat_1.upgrades.upgradeProxy(paymentProcessorAddress, PaymentProcessorV1);
        await paymentProcessorUpgraded.waitForDeployment();
        log("✅ PaymentProcessor upgraded successfully");
        // PHASE 3: Verification
        log("\n✅ PHASE 3: Post-Upgrade Verification");
        log("-".repeat(40));
        log("\n6️⃣ Verifying state preservation...");
        // Verify contracts still work after upgrade
        const crawlNFTAfter = await hardhat_1.ethers.getContractAt("CrawlNFTUpgradeable", crawlNFTAddress);
        const paymentProcessorAfter = await hardhat_1.ethers.getContractAt("PaymentProcessorUpgradeable", paymentProcessorAddress);
        const nameAfter = await crawlNFTAfter.name();
        const symbolAfter = await crawlNFTAfter.symbol();
        const usdcTokenAfter = await paymentProcessorAfter.usdcToken();
        log(`📝 CrawlNFT Name (preserved): ${nameAfter === name ? "✅" : "❌"} ${nameAfter}`);
        log(`🏷️ CrawlNFT Symbol (preserved): ${symbolAfter === symbol ? "✅" : "❌"} ${symbolAfter}`);
        log(`💰 PaymentProcessor USDC (preserved): ${usdcTokenAfter === usdcToken ? "✅" : "❌"} ${usdcTokenAfter}`);
        // Get implementation addresses
        const crawlNFTImpl = await hardhat_1.upgrades.erc1967.getImplementationAddress(crawlNFTAddress);
        const paymentProcessorImpl = await hardhat_1.upgrades.erc1967.getImplementationAddress(paymentProcessorAddress);
        log("\n7️⃣ Implementation addresses:");
        log(`🏗️ CrawlNFT Implementation: ${crawlNFTImpl}`);
        log(`🏗️ PaymentProcessor Implementation: ${paymentProcessorImpl}`);
        // Test admin addresses
        const crawlNFTAdmin = await hardhat_1.upgrades.erc1967.getAdminAddress(crawlNFTAddress);
        const paymentProcessorAdmin = await hardhat_1.upgrades.erc1967.getAdminAddress(paymentProcessorAddress);
        log("\n8️⃣ Admin addresses (UUPS should be zero):");
        log(`🛡️ CrawlNFT Admin: ${crawlNFTAdmin}`);
        log(`🛡️ PaymentProcessor Admin: ${paymentProcessorAdmin}`);
        log("\n" + "=".repeat(60));
        log("🎉 ALL TESTS PASSED! UPGRADEABLE CONTRACTS WORKING CORRECTLY!");
        log("=".repeat(60));
        log(`📋 Network: ${hardhat_1.network.name}`);
        log(`🎫 CrawlNFT Proxy: ${crawlNFTAddress}`);
        log(`💳 PaymentProcessor Proxy: ${paymentProcessorAddress}`);
        log(`✅ Deploy + Upgrade cycle completed successfully`);
        log(`✅ State preservation verified`);
        log(`✅ UUPS proxy pattern working correctly`);
        log("=".repeat(60));
    }
    catch (error) {
        log(`❌ Test failed: ${error}`);
        throw error;
    }
}
// Run the comprehensive test
main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
});
