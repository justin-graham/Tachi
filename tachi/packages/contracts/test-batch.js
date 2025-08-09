
        const { ethers } = require("hardhat");
        async function testBatchOperations() {
          const [owner] = await ethers.getSigners();
          const OptimizedCrawlNFT = await ethers.getContractFactory("OptimizedCrawlNFT");
          const contract = await OptimizedCrawlNFT.deploy();
          await contract.deployed();

          // Test individual mints
          const startTime = Date.now();
          const publishers = Array.from({length: 10}, (_, i) => ethers.Wallet.createRandom().address);
          const termsURIs = publishers.map((_, i) => `https://example.com/terms/${i}`);
          
          // Individual operations
          for (let i = 0; i < publishers.length; i++) {
            await contract.mintLicense(publishers[i], termsURIs[i]);
          }
          const individualTime = Date.now() - startTime;

          // Reset contract state
          const contract2 = await OptimizedCrawlNFT.deploy();
          await contract2.deployed();

          // Batch operations
          const batchStartTime = Date.now();
          await contract2.batchMintLicenses(publishers, termsURIs);
          const batchTime = Date.now() - batchStartTime;

          return {
            individualTime,
            batchTime,
            improvement: ((individualTime - batchTime) / individualTime * 100).toFixed(2)
          };
        }
        testBatchOperations().then(console.log).catch(console.error);
      