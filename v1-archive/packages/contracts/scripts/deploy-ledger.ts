import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Deploying ProofOfCrawlLedger contract...");
  console.log("Network:", network.name);

  // Get the contract factory
  const ProofOfCrawlLedger = await ethers.getContractFactory("ProofOfCrawlLedger");
  
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
    network: network.name,
    chainId: network.config.chainId,
    contractName: "ProofOfCrawlLedger",
    deployer: await (await ethers.getSigners())[0].getAddress()
  };
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Save to network-specific deployment file
  const deploymentFileName = network.name === 'hardhat' ? 'ledger-hardhat.json' : `ledger-${network.name}.json`;
  const deploymentPath = path.join(deploymentsDir, deploymentFileName);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("Deployment info saved to:", deploymentPath);
  
  console.log("\nContract deployed successfully!");
  console.log("Network:", network.name);
  console.log("Chain ID:", network.config.chainId);
  console.log("Address:", address);
  
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
