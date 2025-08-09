"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function main() {
    console.log("Deploying ProofOfCrawlLedger contract...");
    console.log("Network:", hardhat_1.network.name);
    // Get the contract factory
    const ProofOfCrawlLedger = await hardhat_1.ethers.getContractFactory("ProofOfCrawlLedger");
    // Deploy the contract
    const ledger = await ProofOfCrawlLedger.deploy();
    // Wait for deployment to be mined
    await ledger.waitForDeployment();
    const address = await ledger.getAddress();
    console.log("ProofOfCrawlLedger deployed to:", address);
    // Save deployment info
    const deploymentInfo = {
        address: address,
        deployedAt: new Date().toISOString(),
        network: hardhat_1.network.name,
        chainId: hardhat_1.network.config.chainId,
        contractName: "ProofOfCrawlLedger",
        deployer: await (await hardhat_1.ethers.getSigners())[0].getAddress()
    };
    // Create deployments directory if it doesn't exist
    const deploymentsDir = path_1.default.join(__dirname, "../deployments");
    if (!fs_1.default.existsSync(deploymentsDir)) {
        fs_1.default.mkdirSync(deploymentsDir, { recursive: true });
    }
    // Save to network-specific deployment file
    const deploymentFileName = hardhat_1.network.name === 'hardhat' ? 'ledger-hardhat.json' : `ledger-${hardhat_1.network.name}.json`;
    const deploymentPath = path_1.default.join(deploymentsDir, deploymentFileName);
    fs_1.default.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("Deployment info saved to:", deploymentPath);
    console.log("\nContract deployed successfully!");
    console.log("Network:", hardhat_1.network.name);
    console.log("Chain ID:", hardhat_1.network.config.chainId);
    console.log("Address:", address);
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
