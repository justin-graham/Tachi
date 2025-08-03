// Simple deployment script for local testing
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying CrawlNFT contract...");

  // Get the ContractFactory and Signers here.
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Use the self-mint version for local testing
  const CrawlNFT = await ethers.getContractFactory("src/CrawlNFTSelfMint.sol:CrawlNFT");
  const crawlNFT = await CrawlNFT.deploy();

  await crawlNFT.waitForDeployment();
  const address = await crawlNFT.getAddress();

  console.log("CrawlNFT deployed to:", address);
  console.log("Expected address was: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
  
  // Check if the addresses match
  if (address.toLowerCase() === "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512".toLowerCase()) {
    console.log("✅ Contract deployed at expected address!");
  } else {
    console.log("⚠️ Contract deployed at different address than expected");
    console.log("Update the crawlNftAddresses in src/contracts/crawl-nft.ts");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
