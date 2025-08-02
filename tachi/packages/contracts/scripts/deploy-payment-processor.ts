import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Deploying PaymentProcessor contract...");
  console.log("Network:", network.name);

  // Base Sepolia USDC address
  const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

  // Get the contract factory
  const PaymentProcessor = await ethers.getContractFactory("PaymentProcessor");
  
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
    network: network.name,
    chainId: network.config.chainId,
    contractName: "PaymentProcessor",
    constructorArgs: [USDC_ADDRESS],
    deployer: await (await ethers.getSigners())[0].getAddress()
  };
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Save to network-specific deployment file
  const deploymentFileName = network.name === 'hardhat' ? 'payment-processor-hardhat.json' : `payment-processor-${network.name}.json`;
  const deploymentPath = path.join(deploymentsDir, deploymentFileName);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("Deployment info saved to:", deploymentPath);
  
  console.log("\nContract deployed successfully!");
  console.log("Network:", network.name);
  console.log("Chain ID:", network.config.chainId);
  console.log("Address:", address);
  console.log("USDC Address:", USDC_ADDRESS);
  
  if (network.name === 'baseSepolia') {
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
