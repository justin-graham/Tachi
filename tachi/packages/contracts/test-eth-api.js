const hre = require('hardhat');

async function testEthersAPI() {
  try {
    console.log("Hardhat object keys:", Object.keys(hre));
    console.log("Ethers object keys:", Object.keys(hre.ethers));
    console.log("Ethers typeof:", typeof hre.ethers);
    console.log("Ethers.provider:", typeof hre.ethers.provider);
    console.log("Ethers.getSigners:", typeof hre.ethers.getSigners);
    
    // Test network access
    const network = await hre.ethers.provider.getNetwork();
    console.log("Network:", network);
    
    // Test signers
    const signers = await hre.ethers.getSigners();
    console.log("Signers count:", signers.length);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testEthersAPI().catch(console.error);
