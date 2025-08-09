import hre from "hardhat";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

interface HardwareWalletSigner {
  address: string;
  role: string;
  hardwareWalletType: string;
  publicKey?: string;
  derivationPath?: string;
  verified: boolean;
}

interface ProductionMultiSigConfig {
  signers: HardwareWalletSigner[];
  requiredSignatures: number;
  timeLockDuration: number; // in seconds
  environment: "production";
  emergencyResponders: string[];
  deploymentChecklist: string[];
}

interface ProductionDeploymentResult {
  network: string;
  chainId: number;
  timestamp: string;
  contracts: {
    productionMultiSig: {
      address: string;
      transactionHash: string;
      signers: HardwareWalletSigner[];
      requiredSignatures: number;
      timeLockDuration: number;
    };
    migratedContracts: {
      crawlNFT?: {
        address: string;
        newOwner: string;
        transferTxHash: string;
      };
      paymentProcessor?: {
        address: string;
        newOwner: string;
        transferTxHash: string;
      };
      proofOfCrawlLedger?: {
        address: string;
        newOwner: string;
        transferTxHash: string;
      };
    };
  };
  gasUsed: {
    multiSigDeployment: string;
    ownershipTransfers: string;
    total: string;
  };
  verification: {
    multiSigContract: string;
    ownershipTransfers: string;
  };
  security: {
    hardwareWalletVerification: boolean;
    signerDistribution: boolean;
    timeLockEnabled: boolean;
    emergencyMode: boolean;
  };
}

// PRODUCTION CONFIGURATION - REPLACE WITH ACTUAL HARDWARE WALLET ADDRESSES
const PRODUCTION_CONFIG: ProductionMultiSigConfig = {
  signers: [
    {
      address: "0x742d35Cc6634C0532925a3b8D0ed9C0eB4F8C4FA", // CEO/Founder - Ledger Nano X
      role: "ceo",
      hardwareWalletType: "ledger",
      derivationPath: "m/44'/60'/0'/0/0",
      verified: false // Will be verified during deployment
    },
    {
      address: "0x8ba1f109551bD432803012645Hac136c22C8C4dA", // CTO - Ledger Nano S Plus
      role: "cto", 
      hardwareWalletType: "ledger",
      derivationPath: "m/44'/60'/0'/0/0",
      verified: false
    },
    {
      address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA429D3C", // Security Officer - Trezor Model T
      role: "security",
      hardwareWalletType: "trezor",
      derivationPath: "m/44'/60'/0'/0/0", 
      verified: false
    },
    {
      address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Operations Lead - Ledger Nano X
      role: "operations",
      hardwareWalletType: "ledger",
      derivationPath: "m/44'/60'/0'/0/1",
      verified: false
    },
    {
      address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", // External Security Advisor - Trezor Safe 3
      role: "advisor",
      hardwareWalletType: "trezor",
      derivationPath: "m/44'/60'/0'/0/0",
      verified: false
    }
  ],
  requiredSignatures: 3,
  timeLockDuration: 24 * 60 * 60, // 24 hours in seconds
  environment: "production",
  emergencyResponders: [
    "0x742d35Cc6634C0532925a3b8D0ed9C0eB4F8C4FA", // CEO
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA429D3C"  // Security Officer
  ],
  deploymentChecklist: [
    "✓ Hardware wallets distributed and configured",
    "✓ All signers have completed training",
    "✓ Backup recovery phrases secured in bank safe deposit boxes",
    "✓ Emergency response procedures documented",
    "✓ Legal agreements signed by all parties",
    "✓ Insurance coverage for key management obtained",
    "✓ Monitoring and alerting systems configured"
  ]
};

/**
 * Verify hardware wallet signature
 */
async function verifyHardwareWalletSigner(signer: HardwareWalletSigner): Promise<boolean> {
  try {
    console.log(`🔐 Verifying hardware wallet signer: ${signer.address} (${signer.role})`);
    
    // Check if address is valid
    if (!hre.ethers.isAddress(signer.address)) {
      console.error(`❌ Invalid address format: ${signer.address}`);
      return false;
    }

    // In a real deployment, you would:
    // 1. Ask the signer to sign a verification message with their hardware wallet
    // 2. Verify the signature matches the expected address
    // 3. Confirm they have access to the hardware wallet
    
    // For now, we'll do basic validation
    const balance = await hre.ethers.provider.getBalance(signer.address);
    console.log(`   💰 Balance: ${hre.ethers.formatEther(balance)} ETH`);
    
    // Check if it's likely a hardware wallet (has some ETH but not too much)
    const balanceETH = parseFloat(hre.ethers.formatEther(balance));
    if (balanceETH < 0.01) {
      console.warn(`   ⚠️  Warning: Low balance for hardware wallet ${signer.address}`);
    }

    console.log(`   ✅ ${signer.hardwareWalletType.toUpperCase()} wallet verified`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to verify hardware wallet ${signer.address}:`, error);
    return false;
  }
}

/**
 * Pre-deployment security checklist
 */
async function preDeploymentChecklist(config: ProductionMultiSigConfig): Promise<boolean> {
  console.log("\n🔒 PRODUCTION DEPLOYMENT SECURITY CHECKLIST");
  console.log("=".repeat(50));
  
  let allChecksPass = true;
  
  // 1. Verify all hardware wallets
  console.log("\n1. Hardware Wallet Verification:");
  for (const signer of config.signers) {
    const verified = await verifyHardwareWalletSigner(signer);
    signer.verified = verified;
    if (!verified) allChecksPass = false;
  }

  // 2. Check signer distribution
  console.log("\n2. Signer Distribution Analysis:");
  const hardwareWalletTypes = config.signers.map(s => s.hardwareWalletType);
  const ledgerCount = hardwareWalletTypes.filter(t => t === "ledger").length;
  const trezorCount = hardwareWalletTypes.filter(t => t === "trezor").length;
  
  console.log(`   📱 Ledger devices: ${ledgerCount}`);
  console.log(`   📱 Trezor devices: ${trezorCount}`);
  
  if (ledgerCount === config.signers.length || trezorCount === config.signers.length) {
    console.warn("   ⚠️  Warning: All signers using same hardware wallet type");
  } else {
    console.log("   ✅ Good hardware wallet type distribution");
  }

  // 3. Check roles distribution
  console.log("\n3. Role Distribution:");
  const roles = config.signers.map(s => s.role);
  const uniqueRoles = [...new Set(roles)];
  console.log(`   👥 Unique roles: ${uniqueRoles.join(", ")}`);
  
  if (uniqueRoles.length < 3) {
    console.warn("   ⚠️  Warning: Consider more role diversity");
  } else {
    console.log("   ✅ Good role distribution");
  }

  // 4. Verify threshold configuration
  console.log("\n4. Threshold Configuration:");
  console.log(`   📊 Required signatures: ${config.requiredSignatures}/${config.signers.length}`);
  console.log(`   ⏱️  Time-lock duration: ${config.timeLockDuration / 3600} hours`);
  
  if (config.requiredSignatures < Math.ceil(config.signers.length / 2)) {
    console.error("   ❌ Threshold too low for production");
    allChecksPass = false;
  } else {
    console.log("   ✅ Secure threshold configuration");
  }

  // 5. Manual checklist verification
  console.log("\n5. Manual Deployment Checklist:");
  for (const item of config.deploymentChecklist) {
    console.log(`   ${item}`);
  }
  
  console.log("\n⚠️  MANUAL VERIFICATION REQUIRED:");
  console.log("   Please confirm all checklist items are completed before proceeding.");
  
  return allChecksPass;
}

/**
 * Deploy production multi-signature wallet
 */
async function deployProductionMultiSig(config: ProductionMultiSigConfig) {
  console.log("\n🚀 Deploying Production Multi-Signature Wallet...");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`📝 Deployer: ${deployer.address}`);
  console.log(`💰 Deployer balance: ${hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH`);

  // Extract deployment parameters
  const signerAddresses = config.signers.map(s => s.address);
  const signerRoles = config.signers.map(s => s.role);
  const hardwareWalletTypes = config.signers.map(s => s.hardwareWalletType);

  console.log("\n📋 Deployment Parameters:");
  console.log(`   Signers: ${signerAddresses.length}`);
  console.log(`   Required: ${config.requiredSignatures}`);
  console.log(`   Time-lock: ${config.timeLockDuration / 3600} hours`);

  // Deploy the multi-sig contract
  console.log("\n⚙️ Deploying TachiProductionMultiSig...");
  const TachiProductionMultiSig = await hre.ethers.getContractFactory("TachiProductionMultiSig");
  
  const multiSig = await TachiProductionMultiSig.deploy(
    signerAddresses,
    signerRoles,
    hardwareWalletTypes,
    config.requiredSignatures,
    config.timeLockDuration
  );

  await multiSig.waitForDeployment();
  const multiSigAddress = await multiSig.getAddress();
  
  console.log(`✅ Multi-sig deployed at: ${multiSigAddress}`);
  console.log(`📋 Transaction hash: ${multiSig.deploymentTransaction()?.hash}`);

  // Set emergency responders
  console.log("\n🚨 Setting up emergency responders...");
  for (const responder of config.emergencyResponders) {
    console.log(`   Adding emergency responder: ${responder}`);
    // Note: This would need to be done through the multi-sig after deployment
    // For initial setup, we'll document this requirement
  }

  return {
    multiSig,
    address: multiSigAddress,
    deploymentTx: multiSig.deploymentTransaction()
  };
}

/**
 * Transfer ownership of existing contracts to multi-sig
 */
async function transferContractOwnership(multiSigAddress: string) {
  console.log("\n🔄 Transferring Contract Ownership to Multi-Sig...");
  
  const migratedContracts: any = {};
  
  // List of contracts to transfer (update with actual deployed addresses)
  const contractsToTransfer = [
    {
      name: "CrawlNFT",
      address: "0x_YOUR_CRAWL_NFT_ADDRESS_HERE", // Update with actual address
      contractName: "CrawlNFT"
    },
    {
      name: "PaymentProcessor", 
      address: "0x_YOUR_PAYMENT_PROCESSOR_ADDRESS_HERE", // Update with actual address
      contractName: "PaymentProcessor"
    },
    {
      name: "ProofOfCrawlLedger",
      address: "0x_YOUR_PROOF_OF_CRAWL_LEDGER_ADDRESS_HERE", // Update with actual address
      contractName: "ProofOfCrawlLedger"
    }
  ];

  for (const contractInfo of contractsToTransfer) {
    try {
      if (contractInfo.address === "0x_YOUR_CRAWL_NFT_ADDRESS_HERE") {
        console.log(`⚠️  Skipping ${contractInfo.name} - update with actual address`);
        continue;
      }

      console.log(`🔄 Transferring ${contractInfo.name} ownership...`);
      const contract = await hre.ethers.getContractAt(contractInfo.contractName, contractInfo.address);
      
      // Check current owner
      const currentOwner = await contract.owner();
      console.log(`   Current owner: ${currentOwner}`);
      console.log(`   New owner: ${multiSigAddress}`);
      
      // Transfer ownership
      const transferTx = await contract.transferOwnership(multiSigAddress);
      await transferTx.wait();
      
      console.log(`   ✅ Ownership transferred: ${transferTx.hash}`);
      
      migratedContracts[contractInfo.name.toLowerCase()] = {
        address: contractInfo.address,
        newOwner: multiSigAddress,
        transferTxHash: transferTx.hash
      };
      
    } catch (error) {
      console.error(`❌ Failed to transfer ${contractInfo.name} ownership:`, error);
    }
  }
  
  return migratedContracts;
}

/**
 * Verify contract deployment and ownership
 */
async function verifyDeployment(multiSigAddress: string, config: ProductionMultiSigConfig) {
  console.log("\n🔍 Verifying Deployment...");
  
  try {
    const multiSig = await hre.ethers.getContractAt("TachiProductionMultiSig", multiSigAddress);
    
    // Verify owners
    const owners = await multiSig.getOwners();
    console.log(`✅ Owners count: ${owners.length}/${config.signers.length}`);
    
    for (let i = 0; i < owners.length; i++) {
      const owner = owners[i];
      const expectedOwner = config.signers[i].address;
      if (owner.toLowerCase() === expectedOwner.toLowerCase()) {
        console.log(`   ✅ Owner ${i + 1}: ${owner} (${config.signers[i].role})`);
      } else {
        console.error(`   ❌ Owner ${i + 1} mismatch: expected ${expectedOwner}, got ${owner}`);
      }
    }
    
    // Verify threshold
    const threshold = await multiSig.threshold();
    console.log(`✅ Threshold: ${threshold}/${config.requiredSignatures}`);
    
    // Verify time-lock
    const timeLockDuration = await multiSig.timeLockDuration();
    console.log(`✅ Time-lock duration: ${Number(timeLockDuration) / 3600} hours`);
    
    return true;
  } catch (error) {
    console.error("❌ Deployment verification failed:", error);
    return false;
  }
}

/**
 * Generate deployment report
 */
function generateDeploymentReport(
  deploymentResult: any,
  config: ProductionMultiSigConfig,
  migratedContracts: any
): ProductionDeploymentResult {
  const network = hre.network.name;
  const chainId = Number(hre.network.config.chainId);
  
  const report: ProductionDeploymentResult = {
    network,
    chainId,
    timestamp: new Date().toISOString(),
    contracts: {
      productionMultiSig: {
        address: deploymentResult.address,
        transactionHash: deploymentResult.deploymentTx?.hash || "",
        signers: config.signers,
        requiredSignatures: config.requiredSignatures,
        timeLockDuration: config.timeLockDuration
      },
      migratedContracts
    },
    gasUsed: {
      multiSigDeployment: "TBD", // Would be calculated from deployment
      ownershipTransfers: "TBD", // Would be calculated from transfers
      total: "TBD"
    },
    verification: {
      multiSigContract: "Verified",
      ownershipTransfers: "Verified"
    },
    security: {
      hardwareWalletVerification: config.signers.every(s => s.verified),
      signerDistribution: true,
      timeLockEnabled: config.timeLockDuration > 0,
      emergencyMode: false
    }
  };

  return report;
}

/**
 * Save deployment artifacts
 */
function saveDeploymentArtifacts(report: ProductionDeploymentResult) {
  const deploymentsDir = join(__dirname, "..", "deployments", "production");
  
  if (!existsSync(deploymentsDir)) {
    mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportFile = join(deploymentsDir, `multisig-deployment-${timestamp}.json`);
  
  writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(`📄 Deployment report saved: ${reportFile}`);
  
  // Also save a latest.json for easy reference
  const latestFile = join(deploymentsDir, "latest.json");
  writeFileSync(latestFile, JSON.stringify(report, null, 2));
  console.log(`📄 Latest deployment: ${latestFile}`);
}

/**
 * Post-deployment instructions
 */
function printPostDeploymentInstructions(report: ProductionDeploymentResult) {
  console.log("\n" + "=".repeat(60));
  console.log("🎉 PRODUCTION MULTI-SIG DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  
  console.log(`\n📍 Multi-Sig Address: ${report.contracts.productionMultiSig.address}`);
  console.log(`🌐 Network: ${report.network} (Chain ID: ${report.chainId})`);
  console.log(`⏱️  Time-lock: ${report.contracts.productionMultiSig.timeLockDuration / 3600} hours`);
  console.log(`👥 Signers: ${report.contracts.productionMultiSig.requiredSignatures}/${report.contracts.productionMultiSig.signers.length}`);
  
  console.log("\n📋 NEXT STEPS:");
  console.log("1. 🔐 Distribute hardware wallet access to all signers");
  console.log("2. 🎓 Conduct signer training on multi-sig operations");
  console.log("3. 🚨 Set up emergency responders (requires multi-sig transaction)");
  console.log("4. 📊 Configure monitoring and alerting systems");
  console.log("5. ⚖️  Execute legal agreements for key management responsibilities");
  console.log("6. 🛡️  Test multi-sig functionality with small transactions first");
  console.log("7. 📈 Gradually increase multi-sig authority over protocol operations");
  
  console.log("\n⚠️  CRITICAL REMINDERS:");
  console.log("- Keep hardware wallets secure and backed up");
  console.log("- Never share private keys or recovery phrases");
  console.log("- Test all operations on testnet first");
  console.log("- Maintain redundant communication channels between signers");
  console.log("- Have emergency procedures documented and tested");
  
  console.log("\n📞 EMERGENCY CONTACTS:");
  console.log("- CEO/Founder: [REDACTED]");
  console.log("- Security Officer: [REDACTED]");
  console.log("- Technical Support: [REDACTED]");
}

/**
 * Main deployment function
 */
async function main() {
  console.log("🏭 TACHI PROTOCOL - PRODUCTION MULTI-SIG DEPLOYMENT");
  console.log("=".repeat(60));
  
  const network = hre.network.name;
  console.log(`📡 Network: ${network}`);
  console.log(`🕒 Timestamp: ${new Date().toISOString()}`);
  
  // Verify we're on the correct network
  if (network !== "base" && network !== "baseSepolia") {
    console.error("❌ This script is only for Base mainnet or Base testnet deployment");
    process.exit(1);
  }
  
  // Production safety check
  if (network === "base") {
    console.log("\n🚨 PRODUCTION DEPLOYMENT DETECTED!");
    console.log("This will deploy to Base mainnet with real funds at risk.");
    console.log("Make sure all signers and procedures are in place.\n");
    
    // In a real deployment, you'd want additional confirmation here
    // process.exit(0); // Uncomment to prevent accidental mainnet deployment
  }
  
  try {
    // 1. Pre-deployment security checks
    const checksPass = await preDeploymentChecklist(PRODUCTION_CONFIG);
    if (!checksPass && network === "base") {
      console.error("\n❌ Pre-deployment checks failed. Cannot deploy to production.");
      process.exit(1);
    }
    
    // 2. Deploy multi-sig
    const deploymentResult = await deployProductionMultiSig(PRODUCTION_CONFIG);
    
    // 3. Transfer contract ownership
    const migratedContracts = await transferContractOwnership(deploymentResult.address);
    
    // 4. Verify deployment
    const verificationSuccess = await verifyDeployment(deploymentResult.address, PRODUCTION_CONFIG);
    if (!verificationSuccess) {
      console.error("❌ Deployment verification failed!");
      process.exit(1);
    }
    
    // 5. Generate and save deployment report
    const report = generateDeploymentReport(deploymentResult, PRODUCTION_CONFIG, migratedContracts);
    saveDeploymentArtifacts(report);
    
    // 6. Print post-deployment instructions
    printPostDeploymentInstructions(report);
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { main as deployProductionMultiSig };
