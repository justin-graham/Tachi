import hre from "hardhat";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

// Network configuration
const NETWORKS = {
  base: {
    name: "Base Mainnet",
    chainId: 8453,
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
    explorerUrl: "https://basescan.org",
  },
  baseGoerli: {
    name: "Base Goerli Testnet",
    chainId: 84531,
    usdcAddress: "0x60bBA138A74C5e7326885De5090700626950d509", // USDC on Base Goerli
    explorerUrl: "https://goerli.basescan.org",
  },
  baseSepolia: {
    name: "Base Sepolia Testnet",
    chainId: 84532,
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC on Base Sepolia
    explorerUrl: "https://sepolia.basescan.org",
  },
  localhost: {
    name: "Local Development",
    chainId: 31337,
    usdcAddress: "", // Will deploy a mock USDC
    explorerUrl: "http://localhost:8545",
  },
};

interface DeploymentResult {
  network: string;
  chainId: number;
  timestamp: string;
  deployer: string;
  gasUsed: {
    crawlNFT: string;
    paymentProcessor: string;
    proofOfCrawlLedger: string;
    mockUSDC?: string;
    total: string;
  };
  contracts: {
    crawlNFT: {
      address: string;
      transactionHash: string;
    };
    paymentProcessor: {
      address: string;
      transactionHash: string;
    };
    proofOfCrawlLedger: {
      address: string;
      transactionHash: string;
    };
    mockUSDC?: {
      address: string;
      transactionHash: string;
    };
  };
}

async function main() {
  console.log("🚀 Starting Tachi Protocol Deployment...");
  console.log("=" .repeat(50));
  
  // Get network information
  const network = await (hre.ethers as any).provider.getNetwork();
  const networkName = hre.network.name;
  const chainId = Number(network.chainId);
  
  console.log(`📡 Network: ${networkName} (Chain ID: ${chainId})`);
  
  // Get deployment configuration
  const networkConfig = Object.values(NETWORKS).find(n => n.chainId === chainId);
  if (!networkConfig) {
    throw new Error(`Unsupported network with chain ID: ${chainId}`);
  }
  
  console.log(`🌐 Network Config: ${networkConfig.name}`);
  
  // Get deployer account
  const [deployer] = await (hre.ethers as any).getSigners();
  const deployerAddress = await deployer.getAddress();
  const deployerBalance = await (hre.ethers as any).provider.getBalance(deployerAddress);
  
  console.log(`👤 Deployer: ${deployerAddress}`);
  console.log(`💰 Balance: ${hre.ethers.formatEther(deployerBalance)} ETH`);
  
  if (deployerBalance < hre.ethers.parseEther("0.01")) {
    throw new Error("Insufficient balance for deployment. Need at least 0.01 ETH.");
  }
  
  let totalGasUsed = 0n;
  const deploymentResult: DeploymentResult = {
    network: networkConfig.name,
    chainId,
    timestamp: new Date().toISOString(),
    deployer: deployerAddress,
    gasUsed: {
      crawlNFT: "",
      paymentProcessor: "",
      proofOfCrawlLedger: "",
      total: "",
    },
    contracts: {
      crawlNFT: { address: "", transactionHash: "" },
      paymentProcessor: { address: "", transactionHash: "" },
      proofOfCrawlLedger: { address: "", transactionHash: "" },
    },
  };
  
  // Deploy MockUSDC if on localhost
  let usdcAddress = networkConfig.usdcAddress;
  if (chainId === 31337) {
    console.log("\n📦 Deploying MockUSDC...");
    const MockUSDCFactory = await hre.ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDCFactory.deploy("Mock USDC", "USDC");
    await mockUSDC.waitForDeployment();
    
    const receipt = await mockUSDC.deploymentTransaction()?.wait();
    const gasUsed = receipt?.gasUsed || 0n;
    totalGasUsed += gasUsed;
    
    usdcAddress = await mockUSDC.getAddress();
    deploymentResult.contracts.mockUSDC = {
      address: usdcAddress,
      transactionHash: mockUSDC.deploymentTransaction()?.hash || "",
    };
    deploymentResult.gasUsed.mockUSDC = gasUsed.toString();
    
    console.log(`✅ MockUSDC deployed to: ${usdcAddress}`);
    console.log(`⛽ Gas used: ${gasUsed.toLocaleString()}`);
  }
  
  // Deploy CrawlNFT
  console.log("\n📦 Deploying CrawlNFT...");
  const CrawlNFTFactory = await hre.ethers.getContractFactory("src/CrawlNFT.sol:CrawlNFT");
  const crawlNFT = await CrawlNFTFactory.deploy();
  await crawlNFT.waitForDeployment();
  
  const crawlNFTReceipt = await crawlNFT.deploymentTransaction()?.wait();
  const crawlNFTGasUsed = crawlNFTReceipt?.gasUsed || 0n;
  totalGasUsed += crawlNFTGasUsed;
  
  deploymentResult.contracts.crawlNFT = {
    address: await crawlNFT.getAddress(),
    transactionHash: crawlNFT.deploymentTransaction()?.hash || "",
  };
  deploymentResult.gasUsed.crawlNFT = crawlNFTGasUsed.toString();
  
  console.log(`✅ CrawlNFT deployed to: ${await crawlNFT.getAddress()}`);
  console.log(`⛽ Gas used: ${crawlNFTGasUsed.toLocaleString()}`);
  
  // Deploy PaymentProcessor
  console.log("\n📦 Deploying PaymentProcessor...");
  const PaymentProcessorFactory = await hre.ethers.getContractFactory("PaymentProcessor");
  const paymentProcessor = await PaymentProcessorFactory.deploy(usdcAddress);
  await paymentProcessor.waitForDeployment();
  
  const paymentProcessorReceipt = await paymentProcessor.deploymentTransaction()?.wait();
  const paymentProcessorGasUsed = paymentProcessorReceipt?.gasUsed || 0n;
  totalGasUsed += paymentProcessorGasUsed;
  
  deploymentResult.contracts.paymentProcessor = {
    address: await paymentProcessor.getAddress(),
    transactionHash: paymentProcessor.deploymentTransaction()?.hash || "",
  };
  deploymentResult.gasUsed.paymentProcessor = paymentProcessorGasUsed.toString();
  
  console.log(`✅ PaymentProcessor deployed to: ${await paymentProcessor.getAddress()}`);
  console.log(`💰 USDC Token Address: ${usdcAddress}`);
  console.log(`⛽ Gas used: ${paymentProcessorGasUsed.toLocaleString()}`);
  
  // Deploy ProofOfCrawlLedger
  console.log("\n📦 Deploying ProofOfCrawlLedger...");
  const ProofOfCrawlLedgerFactory = await hre.ethers.getContractFactory("ProofOfCrawlLedger");
  const proofOfCrawlLedger = await ProofOfCrawlLedgerFactory.deploy();
  await proofOfCrawlLedger.waitForDeployment();
  
  const proofOfCrawlLedgerReceipt = await proofOfCrawlLedger.deploymentTransaction()?.wait();
  const proofOfCrawlLedgerGasUsed = proofOfCrawlLedgerReceipt?.gasUsed || 0n;
  totalGasUsed += proofOfCrawlLedgerGasUsed;
  
  deploymentResult.contracts.proofOfCrawlLedger = {
    address: await proofOfCrawlLedger.getAddress(),
    transactionHash: proofOfCrawlLedger.deploymentTransaction()?.hash || "",
  };
  deploymentResult.gasUsed.proofOfCrawlLedger = proofOfCrawlLedgerGasUsed.toString();
  
  console.log(`✅ ProofOfCrawlLedger deployed to: ${await proofOfCrawlLedger.getAddress()}`);
  console.log(`⛽ Gas used: ${proofOfCrawlLedgerGasUsed.toLocaleString()}`);
  
  // Calculate total gas used
  deploymentResult.gasUsed.total = totalGasUsed.toString();
  
  // Display deployment summary
  console.log("\n" + "=" .repeat(50));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=" .repeat(50));
  console.log(`📊 Total Gas Used: ${totalGasUsed.toLocaleString()}`);
  console.log(`💸 Estimated Cost: ${hre.ethers.formatEther(totalGasUsed * 1000000000n)} ETH (at 1 gwei)`);
  console.log(`🔗 Explorer: ${networkConfig.explorerUrl}`);
  
  console.log("\n📋 Contract Addresses:");
  console.log(`├── CrawlNFT: ${deploymentResult.contracts.crawlNFT.address}`);
  console.log(`├── PaymentProcessor: ${deploymentResult.contracts.paymentProcessor.address}`);
  console.log(`└── ProofOfCrawlLedger: ${deploymentResult.contracts.proofOfCrawlLedger.address}`);
  
  if (deploymentResult.contracts.mockUSDC) {
    console.log(`└── MockUSDC: ${deploymentResult.contracts.mockUSDC.address}`);
  }
  
  // Save deployment results to file
  const deploymentDir = join(__dirname, "../deployments");
  if (!existsSync(deploymentDir)) {
    mkdirSync(deploymentDir, { recursive: true });
  }
  
  const deploymentFile = join(deploymentDir, `${networkName}-${chainId}.json`);
  try {
    writeFileSync(deploymentFile, JSON.stringify(deploymentResult, null, 2));
    console.log(`\n💾 Deployment details saved to: ${deploymentFile}`);
  } catch (error) {
    console.log(`\n⚠️  Could not save deployment file: ${error}`);
  }
  
  // Print verification commands
  console.log("\n🔍 Verification Commands:");
  console.log("Run these commands to verify contracts on the block explorer:");
  console.log("");
  
  console.log(`npx hardhat verify --network ${networkName} ${deploymentResult.contracts.crawlNFT.address}`);
  console.log(`npx hardhat verify --network ${networkName} ${deploymentResult.contracts.paymentProcessor.address} "${usdcAddress}"`);
  console.log(`npx hardhat verify --network ${networkName} ${deploymentResult.contracts.proofOfCrawlLedger.address}`);
  
  if (deploymentResult.contracts.mockUSDC) {
    console.log(`npx hardhat verify --network ${networkName} ${deploymentResult.contracts.mockUSDC.address} "Mock USDC" "USDC"`);
  }
  
  console.log("\n🎯 Next Steps:");
  console.log("1. Update your .env file with the deployed contract addresses");
  console.log("2. Run the verification commands above");
  console.log("3. Test the contracts on the testnet");
  console.log("4. Update your frontend/gateway configuration");
  
  return deploymentResult;
}

// Handle errors and run the deployment
main()
  .then((result) => {
    console.log("\n✅ Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
