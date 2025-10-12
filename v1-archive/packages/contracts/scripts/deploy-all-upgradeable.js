"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
async function main() {
    console.log("=== Deploying All UUPS Upgradeable Contracts ===");
    console.log("Network:", (await hardhat_1.ethers.provider.getNetwork()).name);
    const [deployer] = await hardhat_1.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", hardhat_1.ethers.formatEther(await hardhat_1.ethers.provider.getBalance(deployer.address)), "ETH");
    const deployments = {};
    // Deploy PaymentProcessorUpgradeable
    console.log("\n=== Deploying PaymentProcessorUpgradeable ===");
    try {
        const PaymentProcessorUpgradeable = await hardhat_1.ethers.getContractFactory("PaymentProcessorUpgradeable");
        // For testing, use a mock USDC address (you can replace with actual USDC address)
        const mockUSDCAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia USDC
        const paymentProcessor = await hardhat_1.upgrades.deployProxy(PaymentProcessorUpgradeable, [mockUSDCAddress, deployer.address], // _usdcToken, _owner
        {
            kind: 'uups',
            initializer: 'initialize',
            timeout: 60000
        });
        await paymentProcessor.waitForDeployment();
        const paymentProcessorAddress = await paymentProcessor.getAddress();
        deployments.PaymentProcessor = paymentProcessorAddress;
        console.log("✅ PaymentProcessorUpgradeable deployed to:", paymentProcessorAddress);
        // Verify deployment
        const ppVersion = await paymentProcessor.getVersion();
        console.log("✅ PaymentProcessor version:", ppVersion);
    }
    catch (error) {
        console.error("❌ PaymentProcessorUpgradeable deployment failed:", error);
        throw error;
    }
    // Deploy ProofOfCrawlLedgerUpgradeable
    console.log("\n=== Deploying ProofOfCrawlLedgerUpgradeable ===");
    try {
        const ProofOfCrawlLedgerUpgradeable = await hardhat_1.ethers.getContractFactory("ProofOfCrawlLedgerUpgradeable");
        const crawlLedger = await hardhat_1.upgrades.deployProxy(ProofOfCrawlLedgerUpgradeable, [deployer.address], {
            kind: 'uups',
            initializer: 'initialize',
            timeout: 60000
        });
        await crawlLedger.waitForDeployment();
        const crawlLedgerAddress = await crawlLedger.getAddress();
        deployments.ProofOfCrawlLedger = crawlLedgerAddress;
        console.log("✅ ProofOfCrawlLedgerUpgradeable deployed to:", crawlLedgerAddress);
        // Verify deployment
        const clVersion = await crawlLedger.getVersion();
        console.log("✅ ProofOfCrawlLedger version:", clVersion);
    }
    catch (error) {
        console.error("❌ ProofOfCrawlLedgerUpgradeable deployment failed:", error);
        throw error;
    }
    // Get implementation addresses for all deployments
    console.log("\n=== Deployment Summary ===");
    for (const [name, proxyAddress] of Object.entries(deployments)) {
        const implementationAddress = await hardhat_1.upgrades.erc1967.getImplementationAddress(proxyAddress);
        const adminAddress = await hardhat_1.upgrades.erc1967.getAdminAddress(proxyAddress);
        console.log(`\n${name}:`);
        console.log(`  Proxy: ${proxyAddress}`);
        console.log(`  Implementation: ${implementationAddress}`);
        console.log(`  Admin: ${adminAddress}`);
    }
    // Save deployment information
    const deploymentInfo = {
        network: (await hardhat_1.ethers.provider.getNetwork()).name,
        chainId: Number((await hardhat_1.ethers.provider.getNetwork()).chainId),
        deployer: deployer.address,
        deployedAt: new Date().toISOString(),
        contracts: {}
    };
    for (const [name, proxyAddress] of Object.entries(deployments)) {
        const implementationAddress = await hardhat_1.upgrades.erc1967.getImplementationAddress(proxyAddress);
        const adminAddress = await hardhat_1.upgrades.erc1967.getAdminAddress(proxyAddress);
        deploymentInfo.contracts[name] = {
            proxy: proxyAddress,
            implementation: implementationAddress,
            admin: adminAddress,
            version: "1.0.0",
            upgradeType: "UUPS"
        };
    }
    console.log("\n=== Complete Deployment Info ===");
    console.log(JSON.stringify(deploymentInfo, null, 2));
    // Test basic integration
    console.log("\n=== Testing Basic Integration ===");
    try {
        const paymentProcessor = await hardhat_1.ethers.getContractAt("PaymentProcessorUpgradeable", deployments.PaymentProcessor);
        const crawlLedger = await hardhat_1.ethers.getContractAt("ProofOfCrawlLedgerUpgradeable", deployments.ProofOfCrawlLedger);
        // Test PaymentProcessor
        const ppStats = await paymentProcessor.getContractStats();
        console.log("✅ PaymentProcessor stats:", {
            totalPayments: ppStats.totalPayments.toString(),
            version: ppStats.contractVersion,
            owner: ppStats.contractOwner
        });
        // Test ProofOfCrawlLedger
        const clStats = await crawlLedger.getContractStats();
        console.log("✅ ProofOfCrawlLedger stats:", {
            totalCrawls: clStats.totalCrawls.toString(),
            version: clStats.contractVersion,
            owner: clStats.contractOwner
        });
        console.log("✅ All contracts deployed and verified successfully!");
    }
    catch (error) {
        console.warn("⚠️ Integration test failed:", error instanceof Error ? error.message : error);
    }
    return deployments;
}
main()
    .then((deployments) => {
    console.log("\n🎉 All UUPS upgradeable contracts deployed successfully!");
    console.log("Deployment addresses:", deployments);
    process.exit(0);
})
    .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
});
