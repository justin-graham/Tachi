import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("\n🎫 Minting Test License for Publisher...\n");

  // Load deployment info
  const deploymentPath = path.join(__dirname, "..", "deployments", "crawlnft-deployment.json");
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ CrawlNFT deployment info not found. Deploy contracts first!");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log(`📄 CrawlNFT Contract: ${deploymentInfo.address}`);

  // Get the deployer account (will be the publisher for testing)
  const [deployer] = await ethers.getSigners();
  const publisherAddress = deployer.address;
  console.log(`👤 Publisher Address: ${publisherAddress}`);

  // Connect to the CrawlNFT contract (using self-mint version)
  const CrawlNFT = await ethers.getContractFactory("src/CrawlNFTSelfMint.sol:CrawlNFT");
  const crawlNFT = CrawlNFT.attach(deploymentInfo.address);

  try {
    // Check if publisher already has a license
    const balance = await crawlNFT.balanceOf(publisherAddress);
    if (balance > 0n) {
      console.log(`✅ Publisher already has ${balance} license(s)`);
      
      // Get token ID for first license
      const tokenId = await crawlNFT.tokenOfOwnerByIndex(publisherAddress, 0);
      console.log(`🎫 License Token ID: ${tokenId}`);
      
      // Get license details
      const licenseInfo = await crawlNFT.getLicenseInfo(tokenId);
      console.log(`📊 License Info:`);
      console.log(`   Domain: ${licenseInfo.domain}`);
      console.log(`   Price: ${ethers.formatUnits(licenseInfo.priceInUSDC, 6)} USDC`);
      console.log(`   Publisher: ${licenseInfo.publisher}`);
      console.log(`   Active: ${licenseInfo.isActive}`);
      
      return;
    }

    // Mint a new license using self-mint function
    console.log("🔨 Minting new publisher license...");
    
    const termsURI = "ipfs://QmTestTermsURI123456789"; // Test terms URI
    
    const tx = await crawlNFT.mintMyLicense(
      termsURI,
      { gasLimit: 300000 }
    );
    
    console.log(`⏳ Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);

    // Get the token ID from the event
    const transferEvent = receipt.logs.find(
      (log: any) => log.topics[0] === ethers.id("Transfer(address,address,uint256)")
    );
    
    let mintedTokenId = "1"; // Default fallback
    
    if (transferEvent) {
      const tokenId = BigInt(transferEvent.topics[3]);
      mintedTokenId = tokenId.toString();
      console.log(`🎫 License Token ID: ${tokenId}`);
      
      // Save license info for testing
      const licenseInfo = {
        tokenId: tokenId.toString(),
        termsURI,
        publisher: publisherAddress,
        contractAddress: deploymentInfo.address,
        network: "baseSepolia",
        transactionHash: tx.hash
      };
      
      const licensePath = path.join(__dirname, "..", "deployments", "test-license.json");
      fs.writeFileSync(licensePath, JSON.stringify(licenseInfo, null, 2));
      console.log(`📝 License info saved to: ${licensePath}`);
    }

    console.log("\n🎉 Test license minted successfully!");
    console.log("\n📋 Next Steps:");
    console.log("1. Update Cloudflare Worker environment with:");
    console.log(`   CRAWL_TOKEN_ID=${mintedTokenId}`);
    console.log(`   PUBLISHER_ADDRESS=${publisherAddress}`);
    console.log(`   PRICE_USDC=0.01`);
    console.log("2. Deploy Cloudflare Worker");
    console.log("3. Run end-to-end test");

  } catch (error) {
    console.error("❌ Error minting license:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
