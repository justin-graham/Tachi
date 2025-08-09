"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
async function main() {
    console.log("=== UUPS Upgradeable Contract Deployment ===");
    console.log("Network:", (await hardhat_1.ethers.provider.getNetwork()).name);
    // Get the contract factory
    const PaymentProcessorUpgradeable = await hardhat_1.ethers.getContractFactory("PaymentProcessorUpgradeable");
    console.log("Contract factory loaded: PaymentProcessorUpgradeable");
    // Get signer
    const [deployer] = await hardhat_1.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", hardhat_1.ethers.formatEther(await hardhat_1.ethers.provider.getBalance(deployer.address)), "ETH");
    // Deploy the proxy with initialize() call
    console.log("\nDeploying PaymentProcessorUpgradeable with proxy...");
    // For testing, use a mock USDC address (you can replace with actual USDC address)
    const mockUSDCAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia USDC
    const proxy = await hardhat_1.upgrades.deployProxy(PaymentProcessorUpgradeable, [mockUSDCAddress, deployer.address], // _usdcToken, _owner
    {
        kind: 'uups',
        initializer: 'initialize',
        timeout: 60000 // 60 second timeout
    });
    // Wait for deployment
    await proxy.waitForDeployment();
    const proxyAddress = await proxy.getAddress();
    console.log("✅ PaymentProcessorUpgradeable deployed to:", proxyAddress);
    // Get implementation address for verification
    const implementationAddress = await hardhat_1.upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log("📋 Implementation address:", implementationAddress);
    const adminAddress = await hardhat_1.upgrades.erc1967.getAdminAddress(proxyAddress);
    console.log("🔑 Proxy admin address:", adminAddress);
    // Verify the contract is working
    console.log("\n=== Contract Verification ===");
    const contract = PaymentProcessorUpgradeable.attach(proxyAddress);
    try {
        const version = await contract.getVersion();
        console.log("✅ Contract version:", version);
        const owner = await contract.owner();
        console.log("✅ Contract owner:", owner);
        const stats = await contract.getContractStats();
        console.log("✅ Contract stats:", {
            totalPaymentsProcessed: stats.totalPayments.toString(),
            contractVersion: stats.contractVersion,
            contractOwner: stats.contractOwner
        });
        console.log("✅ Contract successfully deployed and verified!");
    }
    catch (error) {
        console.error("❌ Contract verification failed:", error);
        throw error;
    }
    // Save deployment info
    const deploymentInfo = {
        network: (await hardhat_1.ethers.provider.getNetwork()).name,
        contractName: "PaymentProcessorUpgradeable",
        proxyAddress: proxyAddress,
        implementationAddress: implementationAddress,
        adminAddress: adminAddress,
        deployer: deployer.address,
        deployedAt: new Date().toISOString(),
        version: "1.0.0",
        upgradeType: "UUPS"
    };
    console.log("\n=== Deployment Summary ===");
    console.log(JSON.stringify(deploymentInfo, null, 2));
    return {
        proxy: proxyAddress,
        implementation: implementationAddress,
        admin: adminAddress,
        contract: contract
    };
}
// Run the deployment
main()
    .then((result) => {
    console.log("\n🎉 Deployment completed successfully!");
    console.log("Proxy Address:", result.proxy);
    process.exit(0);
})
    .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
});
