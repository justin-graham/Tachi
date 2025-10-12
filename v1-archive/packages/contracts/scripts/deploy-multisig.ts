import hre from "hardhat";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

interface MultiSigConfig {
  signers: string[];
  requiredSignatures: number;
  environment: "testnet" | "production";
  description: string;
}

interface DeploymentResult {
  network: string;
  chainId: number;
  timestamp: string;
  contracts: {
    multiSigFactory: {
      address: string;
      transactionHash: string;
    };
    multiSigWallet: {
      address: string;
      transactionHash: string;
      signers: string[];
      requiredSignatures: number;
    };
    crawlNFTMultiSig: {
      address: string;
      transactionHash: string;
    };
  };
  gasUsed: {
    multiSigFactory: string;
    multiSigWallet: string;
    crawlNFTMultiSig: string;
    total: string;
  };
  verification: {
    multiSigFactory: string;
    multiSigWallet: string;
    crawlNFTMultiSig: string;
  };
}

// Predefined signer configurations for different environments
const SIGNER_CONFIGS: Record<string, MultiSigConfig> = {
  // Testnet configuration (2-of-3) - Using deployer address for all signers for testing
  testnet: {
    signers: [
      "0xdDa104A3EcA774039aE2800f53dAbA4da8C8306d", // Current deployer wallet
      "0xdDa104A3EcA774039aE2800f53dAbA4da8C8306d", // Same wallet (for testing)
      "0xdDa104A3EcA774039aE2800f53dAbA4da8C8306d", // Same wallet (for testing)
    ],
    requiredSignatures: 2,
    environment: "testnet",
    description: "Testnet 2-of-3 Multi-Signature Configuration"
  },
  
  // Production configuration (3-of-5)
  production: {
    signers: [
      "0xdDa104A3EcA774039aE2800f53dAbA4da8C8306d", // CEO/Founder (current wallet for testing)
      "0xdDa104A3EcA774039aE2800f53dAbA4da8C8306d", // CTO (current wallet for testing)
      "0xdDa104A3EcA774039aE2800f53dAbA4da8C8306d", // Security Officer (current wallet for testing)
      "0xdDa104A3EcA774039aE2800f53dAbA4da8C8306d", // Operations Lead (current wallet for testing)
      "0xdDa104A3EcA774039aE2800f53dAbA4da8C8306d", // External Advisor (current wallet for testing)
    ],
    requiredSignatures: 3,
    environment: "production",
    description: "Production 3-of-5 Multi-Signature Configuration"
  }
};

async function main() {
  console.log("🚀 Deploying Tachi Multi-Signature Infrastructure...\n");

  const network = hre.network.name;
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;
  
  console.log(`📡 Network: ${network}`);
  console.log(`🔗 Chain ID: ${chainId}`);
  console.log(`📅 Timestamp: ${new Date().toISOString()}\n`);

  // Determine environment based on network
  const environment = network.includes("mainnet") || network === "base" ? "production" : "testnet";
  const config = SIGNER_CONFIGS[environment];
  
  console.log(`🔧 Environment: ${environment.toUpperCase()}`);
  console.log(`👥 Signers: ${config.signers.length}`);
  console.log(`✍️  Required Signatures: ${config.requiredSignatures}`);
  console.log(`📝 Description: ${config.description}\n`);

  // Verify signer addresses
  console.log("🔍 Verifying signer addresses...");
  for (let i = 0; i < config.signers.length; i++) {
    const signer = config.signers[i];
    if (!hre.ethers.isAddress(signer)) {
      throw new Error(`Invalid signer address at index ${i}: ${signer}`);
    }
    console.log(`  ✅ Signer ${i + 1}: ${signer}`);
  }
  console.log();

  let totalGasUsed = 0n;
  const deploymentResult: DeploymentResult = {
    network,
    chainId: Number(chainId),
    timestamp: new Date().toISOString(),
    contracts: {
      multiSigFactory: { address: "", transactionHash: "" },
      multiSigWallet: { address: "", transactionHash: "", signers: [], requiredSignatures: 0 },
      crawlNFTMultiSig: { address: "", transactionHash: "" }
    },
    gasUsed: {
      multiSigFactory: "",
      multiSigWallet: "",
      crawlNFTMultiSig: "",
      total: ""
    },
    verification: {
      multiSigFactory: "",
      multiSigWallet: "",
      crawlNFTMultiSig: ""
    }
  };

  try {
    // Deploy MultiSig Factory
    console.log("📦 Deploying TachiMultiSigFactory...");
    const MultiSigFactoryFactory = await hre.ethers.getContractFactory("TachiMultiSigFactory");
    const multiSigFactory = await MultiSigFactoryFactory.deploy();
    await multiSigFactory.waitForDeployment();

    const factoryReceipt = await multiSigFactory.deploymentTransaction()?.wait();
    const factoryGasUsed = factoryReceipt?.gasUsed || 0n;
    totalGasUsed += factoryGasUsed;

    const factoryAddress = await multiSigFactory.getAddress();
    deploymentResult.contracts.multiSigFactory = {
      address: factoryAddress,
      transactionHash: multiSigFactory.deploymentTransaction()?.hash || "",
    };
    deploymentResult.gasUsed.multiSigFactory = factoryGasUsed.toString();

    console.log(`✅ TachiMultiSigFactory deployed to: ${factoryAddress}`);
    console.log(`⛽ Gas used: ${factoryGasUsed.toLocaleString()}\n`);

    // Deploy MultiSig Wallet
    console.log("📦 Deploying Multi-Signature Wallet...");
    
    // Generate salt for CREATE2
    const salt = hre.ethers.keccak256(
      hre.ethers.toUtf8Bytes(`tachi-multisig-${environment}-${Date.now()}`)
    );

    // Deploy based on environment
    let deployTx;
    if (environment === "testnet") {
      deployTx = await multiSigFactory.deployTestnetMultiSig(config.signers, salt);
    } else {
      deployTx = await multiSigFactory.deployProductionMultiSig(config.signers, salt);
    }

    const deployReceipt = await deployTx.wait();
    const deployGasUsed = deployReceipt?.gasUsed || 0n;
    totalGasUsed += deployGasUsed;

    // Get the deployed MultiSig address from event
    const multiSigDeployedEvent = deployReceipt?.logs?.find(
      (log: any) => log.topics[0] === hre.ethers.id("MultiSigDeployed(address,address[],uint256,bytes32)")
    );

    if (!multiSigDeployedEvent) {
      throw new Error("MultiSig deployment event not found");
    }

    const multiSigAddress = "0x" + multiSigDeployedEvent.topics[1].slice(26);
    
    deploymentResult.contracts.multiSigWallet = {
      address: multiSigAddress,
      transactionHash: deployTx.hash,
      signers: config.signers,
      requiredSignatures: config.requiredSignatures
    };
    deploymentResult.gasUsed.multiSigWallet = deployGasUsed.toString();

    console.log(`✅ Multi-Signature Wallet deployed to: ${multiSigAddress}`);
    console.log(`👥 Signers: ${config.signers.length}`);
    console.log(`✍️  Required Signatures: ${config.requiredSignatures}`);
    console.log(`⛽ Gas used: ${deployGasUsed.toLocaleString()}\n`);

    // Deploy CrawlNFT with MultiSig support
    console.log("📦 Deploying CrawlNFTMultiSig...");
    const CrawlNFTMultiSigFactory = await hre.ethers.getContractFactory("CrawlNFTMultiSig");
    const crawlNFTMultiSig = await CrawlNFTMultiSigFactory.deploy(multiSigAddress);
    await crawlNFTMultiSig.waitForDeployment();

    const crawlNFTReceipt = await crawlNFTMultiSig.deploymentTransaction()?.wait();
    const crawlNFTGasUsed = crawlNFTReceipt?.gasUsed || 0n;
    totalGasUsed += crawlNFTGasUsed;

    const crawlNFTAddress = await crawlNFTMultiSig.getAddress();
    deploymentResult.contracts.crawlNFTMultiSig = {
      address: crawlNFTAddress,
      transactionHash: crawlNFTMultiSig.deploymentTransaction()?.hash || "",
    };
    deploymentResult.gasUsed.crawlNFTMultiSig = crawlNFTGasUsed.toString();

    console.log(`✅ CrawlNFTMultiSig deployed to: ${crawlNFTAddress}`);
    console.log(`🔐 Controlled by MultiSig: ${multiSigAddress}`);
    console.log(`⛽ Gas used: ${crawlNFTGasUsed.toLocaleString()}\n`);

    // Update total gas used
    deploymentResult.gasUsed.total = totalGasUsed.toString();

    // Verify deployment
    console.log("🔍 Verifying deployment...");
    
    // Verify MultiSig configuration
    const TachiMultiSig = await hre.ethers.getContractFactory("TachiMultiSig");
    const multiSigContract = TachiMultiSig.attach(multiSigAddress);
    
    const requiredSigs = await multiSigContract.REQUIRED_SIGNATURES();
    const maxSigners = await multiSigContract.MAX_SIGNERS();
    
    console.log(`✅ MultiSig Verification:`);
    console.log(`   Required Signatures: ${requiredSigs}`);
    console.log(`   Max Signers: ${maxSigners}`);
    
    // Verify CrawlNFT MultiSig connection
    const multiSigWalletAddress = await crawlNFTMultiSig.multiSigWallet();
    console.log(`✅ CrawlNFT MultiSig Verification:`);
    console.log(`   Connected MultiSig: ${multiSigWalletAddress}`);
    console.log(`   Matches Deployed: ${multiSigWalletAddress === multiSigAddress}`);

    // Contract verification on block explorer (if not local)
    if (network !== "localhost" && network !== "hardhat") {
      console.log("\n📋 Contract Verification...");
      
      try {
        // Verify MultiSig Factory
        console.log("🔍 Verifying TachiMultiSigFactory...");
        await hre.run("verify:verify", {
          address: factoryAddress,
          constructorArguments: [],
        });
        deploymentResult.verification.multiSigFactory = "✅ Verified";
        console.log(`✅ TachiMultiSigFactory verified`);
      } catch (error) {
        console.log(`⚠️ TachiMultiSigFactory verification failed: ${error}`);
        deploymentResult.verification.multiSigFactory = "❌ Failed";
      }

      try {
        // Verify MultiSig Wallet
        console.log("🔍 Verifying TachiMultiSig...");
        await hre.run("verify:verify", {
          address: multiSigAddress,
          constructorArguments: [config.signers, config.requiredSignatures],
        });
        deploymentResult.verification.multiSigWallet = "✅ Verified";
        console.log(`✅ TachiMultiSig verified`);
      } catch (error) {
        console.log(`⚠️ TachiMultiSig verification failed: ${error}`);
        deploymentResult.verification.multiSigWallet = "❌ Failed";
      }

      try {
        // Verify CrawlNFT MultiSig
        console.log("🔍 Verifying CrawlNFTMultiSig...");
        await hre.run("verify:verify", {
          address: crawlNFTAddress,
          constructorArguments: [multiSigAddress],
        });
        deploymentResult.verification.crawlNFTMultiSig = "✅ Verified";
        console.log(`✅ CrawlNFTMultiSig verified`);
      } catch (error) {
        console.log(`⚠️ CrawlNFTMultiSig verification failed: ${error}`);
        deploymentResult.verification.crawlNFTMultiSig = "❌ Failed";
      }
    }

    // Save deployment result
    const deploymentsDir = join(process.cwd(), "deployments");
    if (!existsSync(deploymentsDir)) {
      mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = join(deploymentsDir, `multisig-deployment-${network}-${Date.now()}.json`);
    writeFileSync(deploymentFile, JSON.stringify(deploymentResult, null, 2));

    // Summary
    console.log("\n🎉 Multi-Signature Infrastructure Deployment Complete!");
    console.log("=====================================");
    console.log(`📡 Network: ${network}`);
    console.log(`🔗 Chain ID: ${chainId}`);
    console.log(`🏭 MultiSig Factory: ${factoryAddress}`);
    console.log(`🔐 MultiSig Wallet: ${multiSigAddress}`);
    console.log(`🎫 CrawlNFT MultiSig: ${crawlNFTAddress}`);
    console.log(`⛽ Total Gas Used: ${totalGasUsed.toLocaleString()}`);
    console.log(`💾 Deployment Data: ${deploymentFile}`);
    console.log("\n🔐 CRITICAL SECURITY NOTICE:");
    console.log("=====================================");
    console.log("1. 🚨 IMMEDIATELY transfer ownership from deployer EOA to MultiSig");
    console.log("2. 🔑 Ensure all signers use HARDWARE WALLETS");
    console.log("3. 🛡️ Test MultiSig operations on testnet before mainnet");
    console.log("4. 📝 Document emergency procedures for all signers");
    console.log("5. 🔄 Regular key rotation and security audits");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
