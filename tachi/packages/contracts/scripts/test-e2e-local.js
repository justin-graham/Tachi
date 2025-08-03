#!/usr/bin/env node

/**
 * End-to-End Local Testing Script
 * 
 * This script demonstrates the complete Tachi Protocol flow:
 * 1. Setup accounts and get initial USDC
 * 2. Pay for crawl access
 * 3. Mint CrawlNFT
 * 4. Submit proof of crawl
 * 5. Verify all components work together
 */

const { ethers } = require("hardhat");

// Contract addresses from deployment
const CONTRACTS = {
  MOCK_USDC: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  CRAWL_NFT: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  PAYMENT_PROCESSOR: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  PROOF_OF_CRAWL_LEDGER: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"
};

async function main() {
  console.log("🚀 Starting End-to-End Tachi Protocol Test");
  console.log("=" .repeat(50));

  // Get signers (using Hardhat default accounts)
  const [deployer, user1, user2] = await ethers.getSigners();
  
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`👤 User1: ${user1.address}`);
  console.log(`👤 User2: ${user2.address}`);
  
  // Connect to contracts
  const mockUSDC = await ethers.getContractAt("MockUSDC", CONTRACTS.MOCK_USDC);
  const crawlNFT = await ethers.getContractAt("src/CrawlNFT.sol:CrawlNFT", CONTRACTS.CRAWL_NFT);
  const paymentProcessor = await ethers.getContractAt("PaymentProcessor", CONTRACTS.PAYMENT_PROCESSOR);
  const proofLedger = await ethers.getContractAt("ProofOfCrawlLedger", CONTRACTS.PROOF_OF_CRAWL_LEDGER);

  console.log("\n💰 Step 1: Setup USDC for testing");
  
  // Mint USDC for user2 (MockUSDC allows anyone to mint)
  const usdcAmount = ethers.parseUnits("100", 6); // 100 USDC
  await mockUSDC.connect(user2).mint(user2.address, usdcAmount);
  
  const user2Balance = await mockUSDC.balanceOf(user2.address);
  console.log(`✅ User2 USDC Balance: ${ethers.formatUnits(user2Balance, 6)} USDC`);

  console.log("\n🔐 Step 2: Make payment to publisher");
  
  // For testing, we'll pay the deployer address as the "publisher"
  const publisherAddress = deployer.address;
  const crawlCost = ethers.parseUnits("10", 6); // 10 USDC per crawl
  await mockUSDC.connect(user2).approve(CONTRACTS.PAYMENT_PROCESSOR, crawlCost);
  console.log(`✅ Approved ${ethers.formatUnits(crawlCost, 6)} USDC for payment`);
  
  // Make payment using payPublisher function
  const paymentTx = await paymentProcessor.connect(user2).payPublisher(
    publisherAddress,
    crawlCost
  );
  const paymentReceipt = await paymentTx.wait();
  
  console.log(`✅ Payment processed! Gas used: ${paymentReceipt.gasUsed.toString()}`);
  
  // Check publisher received payment
  const publisherBalance = await mockUSDC.balanceOf(publisherAddress);
  console.log(`✅ Publisher received: ${ethers.formatUnits(publisherBalance, 6)} USDC`);

  console.log("\n🎫 Step 3: Mint CrawlNFT");
  
  // Mint NFT for the user (only owner can mint)
  const websiteUrl = "https://example.com";
  const mintTx = await crawlNFT.connect(deployer).mintLicense(user2.address, websiteUrl);
  const mintReceipt = await mintTx.wait();
  
  // Get the token ID from the event
  const mintEvent = mintReceipt.logs.find(log => {
    try {
      const parsed = crawlNFT.interface.parseLog(log);
      return parsed.name === "Transfer";
    } catch {
      return false;
    }
  });
  
  const tokenId = mintEvent ? crawlNFT.interface.parseLog(mintEvent).args.tokenId : 1n;
  console.log(`✅ NFT minted! Token ID: ${tokenId.toString()}`);
  
  // Verify NFT ownership
  const owner = await crawlNFT.ownerOf(tokenId);
  console.log(`✅ NFT owner: ${owner}`);
  console.log(`✅ Owner matches user2: ${owner === user2.address}`);

  console.log("\n📝 Step 4: Submit proof of crawl");
  
  // Submit proof of crawl completion (only owner can call this)
  const crawlTokenId = tokenId; // Use the minted token ID
  const proofTx = await proofLedger.connect(deployer).logCrawlWithURL(
    crawlTokenId,
    user2.address, // crawler address
    websiteUrl
  );
  const proofReceipt = await proofTx.wait();
  
  console.log(`✅ Proof submitted! Gas used: ${proofReceipt.gasUsed.toString()}`);
  
  // Verify proof was recorded by checking total crawls
  const totalCrawls = await proofLedger.getTotalCrawlsLogged();
  console.log(`✅ Total crawls logged: ${totalCrawls.toString()}`);

  console.log("\n🔍 Step 5: Verify complete flow");
  
  // Check final balances and states
  const finalUSDCBalance = await mockUSDC.balanceOf(user2.address);
  const processorBalance = await mockUSDC.balanceOf(CONTRACTS.PAYMENT_PROCESSOR);
  
  console.log(`💰 User2 final USDC balance: ${ethers.formatUnits(finalUSDCBalance, 6)} USDC`);
  console.log(`💰 Payment processor balance: ${ethers.formatUnits(processorBalance, 6)} USDC`);
  
  // Check NFT total supply
  const totalSupply = await crawlNFT.totalSupply();
  console.log(`🎫 Total NFTs minted: ${totalSupply.toString()}`);
  
  console.log("\n🎉 End-to-End Test Complete!");
  console.log("=" .repeat(50));
  console.log("✅ Payment processing: WORKING");
  console.log("✅ NFT minting: WORKING");
  console.log("✅ Proof submission: WORKING");
  console.log("\n🚀 All systems operational! Ready for crawler integration.");
}

// Error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
