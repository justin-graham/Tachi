const { ethers } = require("hardhat");

async function main() {
  console.log("Testing CrawlNFT Self-Minting Functionality\n");

  // Get deployed contract address
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  // Get contract factory and attach to deployed contract
  const CrawlNFT = await ethers.getContractFactory("src/CrawlNFTSelfMint.sol:CrawlNFT");
  const crawlNFT = CrawlNFT.attach(contractAddress);
  
  // Get signers (test accounts)
  const [owner, publisher1, publisher2] = await ethers.getSigners();
  
  console.log("📋 Contract Information:");
  console.log("Address:", contractAddress);
  console.log("Owner:", await owner.getAddress());
  console.log("Publisher1:", await publisher1.getAddress());
  console.log("Publisher2:", await publisher2.getAddress());
  
  // Check if self-minting is enabled
  const selfMintingEnabled = await crawlNFT.selfMintingEnabled();
  console.log("Self-minting enabled:", selfMintingEnabled);
  console.log();
  
  // Test 1: Publisher mints their own license using mintMyLicense
  console.log("🧪 Test 1: Self-minting using mintMyLicense");
  const termsURI1 = "ipfs://QmTestHash1/terms.json";
  
  try {
    const tx1 = await crawlNFT.connect(publisher1).mintMyLicense(termsURI1);
    const receipt1 = await tx1.wait();
    console.log("✅ Publisher1 successfully minted license");
    console.log("Transaction hash:", receipt1.hash);
    console.log("Terms URI:", termsURI1);
    
    // Verify the license
    const hasLicense1 = await crawlNFT.hasLicense(publisher1.address);
    const tokenId1 = await crawlNFT.getPublisherTokenId(publisher1.address);
    const storedTermsURI1 = await crawlNFT.getTermsURI(tokenId1);
    
    console.log("Has license:", hasLicense1);
    console.log("Token ID:", tokenId1.toString());
    console.log("Stored terms URI:", storedTermsURI1);
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
  console.log();
  
  // Test 2: Publisher mints for someone else using mintLicense (should work as owner)
  console.log("🧪 Test 2: Owner minting for publisher2");
  const termsURI2 = "ipfs://QmTestHash2/terms.json";
  
  try {
    const tx2 = await crawlNFT.connect(owner).mintLicense(publisher2.address, termsURI2);
    const receipt2 = await tx2.wait();
    console.log("✅ Owner successfully minted license for Publisher2");
    console.log("Transaction hash:", receipt2.hash);
    
    // Verify the license
    const hasLicense2 = await crawlNFT.hasLicense(publisher2.address);
    const tokenId2 = await crawlNFT.getPublisherTokenId(publisher2.address);
    
    console.log("Publisher2 has license:", hasLicense2);
    console.log("Publisher2 token ID:", tokenId2.toString());
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
  console.log();
  
  // Test 3: Try to mint duplicate license (should fail)
  console.log("🧪 Test 3: Attempting to mint duplicate license");
  try {
    await crawlNFT.connect(publisher1).mintMyLicense("ipfs://duplicate");
    console.log("❌ Unexpected: Duplicate mint succeeded");
  } catch (error) {
    console.log("✅ Expected error: Duplicate mint prevented");
    console.log("Error:", error.message.split("(")[0].trim());
  }
  console.log();
  
  // Test 4: Check total supply
  console.log("📊 Final Statistics:");
  const totalSupply = await crawlNFT.totalSupply();
  console.log("Total licenses minted:", totalSupply.toString());
  
  // Test 5: Try to transfer (should fail - soulbound)
  console.log("\n🧪 Test 4: Attempting transfer (should fail - soulbound)");
  try {
    const tokenId = await crawlNFT.getPublisherTokenId(publisher1.address);
    await crawlNFT.connect(publisher1).transferFrom(publisher1.address, publisher2.address, tokenId);
    console.log("❌ Unexpected: Transfer succeeded");
  } catch (error) {
    console.log("✅ Expected error: Transfer prevented (soulbound)");
    console.log("Error:", error.message.split("(")[0].trim());
  }
  
  console.log("\n🎉 Self-minting test completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
