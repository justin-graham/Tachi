"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function main() {
    console.log("Deploying PaymentProcessor contract...");
    console.log("Network:", hardhat_1.network.name);
    // Base Sepolia USDC address
    const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    // Get the contract factory
    const PaymentProcessor = await hardhat_1.ethers.getContractFactory("PaymentProcessor");
    // Deploy the contract with USDC address
    const paymentProcessor = await PaymentProcessor.deploy(USDC_ADDRESS);
    // Wait for deployment to be mined
    await paymentProcessor.waitForDeployment();
    const address = await paymentProcessor.getAddress();
    console.log("PaymentProcessor deployed to:", address);
    // Save deployment info
    const deploymentInfo = {
        address: address,
        deployedAt: new Date().toISOString(),
        network: hardhat_1.network.name,
        chainId: hardhat_1.network.config.chainId,
        contractName: "PaymentProcessor",
        constructorArgs: [USDC_ADDRESS],
        deployer: await (await hardhat_1.ethers.getSigners())[0].getAddress()
    };
    // Create deployments directory if it doesn't exist
    const deploymentsDir = path_1.default.join(__dirname, "../deployments");
    if (!fs_1.default.existsSync(deploymentsDir)) {
        fs_1.default.mkdirSync(deploymentsDir, { recursive: true });
    }
    // Save to network-specific deployment file
    const deploymentFileName = hardhat_1.network.name === 'hardhat' ? 'payment-processor-hardhat.json' : `payment-processor-${hardhat_1.network.name}.json`;
    const deploymentPath = path_1.default.join(deploymentsDir, deploymentFileName);
    fs_1.default.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("Deployment info saved to:", deploymentPath);
    console.log("\nContract deployed successfully!");
    console.log("Network:", hardhat_1.network.name);
    console.log("Chain ID:", hardhat_1.network.config.chainId);
    console.log("Address:", address);
    console.log("USDC Address:", USDC_ADDRESS);
    if (hardhat_1.network.name === 'baseSepolia') {
        console.log("\n🌐 View on BaseScan (Sepolia):");
        console.log(`https://sepolia.basescan.org/address/${address}`);
    }
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
});
