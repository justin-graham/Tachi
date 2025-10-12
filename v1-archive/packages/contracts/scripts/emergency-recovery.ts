import { ethers } from "hardhat";

// Emergency recovery configuration
const EMERGENCY_CONFIG = {
  // Current multisig address that owns the contracts
  CURRENT_MULTISIG: "0x0000000000000000000000000000000000000000", // REPLACE
  
  // Emergency recovery address (could be a new multisig or trusted EOA)
  EMERGENCY_ADDRESS: "0x0000000000000000000000000000000000000000", // REPLACE
  
  // Contract addresses
  CONTRACTS: {
    crawlNFT: "0xa974E189038f5b0dEcEbfCe7B0A108824acF3813", // Replace with actual
    paymentProcessor: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9", // Replace with actual
  },
  
  // Emergency reason (for logging)
  EMERGENCY_REASON: "Multisig compromise detected - initiating emergency recovery",
};

/**
 * Emergency ownership recovery script
 * 
 * CRITICAL: This script should only be used in emergency situations where:
 * 1. The multisig wallet has been compromised
 * 2. Multisig owners are unavailable/unreachable
 * 3. Critical protocol operations need to be performed immediately
 * 
 * This script must be executed by an account that has emergency powers
 * or by the current multisig owners in a coordinated effort.
 */
async function emergencyOwnershipRecovery() {
  console.log("🚨 EMERGENCY OWNERSHIP RECOVERY");
  console.log("===============================");
  console.log("⚠️  WARNING: This is an emergency procedure!");
  console.log("⚠️  Only use in critical situations!");
  console.log("");
  
  const [signer] = await ethers.getSigners();
  console.log(`📍 Recovery account: ${signer.address}`);
  console.log(`🚨 Emergency reason: ${EMERGENCY_CONFIG.EMERGENCY_REASON}`);
  console.log(`🏦 Current multisig: ${EMERGENCY_CONFIG.CURRENT_MULTISIG}`);
  console.log(`🛡️  Emergency address: ${EMERGENCY_CONFIG.EMERGENCY_ADDRESS}`);
  console.log("");
  
  // Validate configuration
  if (EMERGENCY_CONFIG.CURRENT_MULTISIG === "0x0000000000000000000000000000000000000000") {
    throw new Error("❌ CURRENT_MULTISIG address must be set");
  }
  
  if (EMERGENCY_CONFIG.EMERGENCY_ADDRESS === "0x0000000000000000000000000000000000000000") {
    throw new Error("❌ EMERGENCY_ADDRESS must be set");
  }
  
  // Confirm emergency action
  console.log("🚨 EMERGENCY CONFIRMATION REQUIRED");
  console.log("==================================");
  console.log("This action will transfer ownership of ALL protocol contracts");
  console.log("from the current multisig to the emergency address.");
  console.log("");
  console.log("This should ONLY be done if:");
  console.log("✓ The current multisig is compromised or inaccessible");
  console.log("✓ You have authorization from protocol governance");
  console.log("✓ You understand the security implications");
  console.log("✓ You have a plan to restore proper governance");
  console.log("");
  
  // Delay for manual confirmation
  console.log("⏳ Proceeding in 15 seconds... (Ctrl+C to cancel)");
  console.log("💡 Ensure you have reviewed the emergency procedures!");
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  // Log emergency action
  console.log("📝 Logging Emergency Action");
  console.log("---------------------------");
  const timestamp = new Date().toISOString();
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Executor: ${signer.address}`);
  console.log(`Reason: ${EMERGENCY_CONFIG.EMERGENCY_REASON}`);
  console.log("");
  
  // Check current ownership
  console.log("🔍 Verifying Current Ownership");
  console.log("------------------------------");
  
  const contracts = [];
  
  // Check CrawlNFT
  if (EMERGENCY_CONFIG.CONTRACTS.crawlNFT) {
    try {
      const crawlNFT = await ethers.getContractAt(
        "CrawlNFTUpgradeable",
        EMERGENCY_CONFIG.CONTRACTS.crawlNFT
      );
      const currentOwner = await crawlNFT.owner();
      console.log(`📄 CrawlNFT owner: ${currentOwner}`);
      
      if (currentOwner.toLowerCase() === EMERGENCY_CONFIG.CURRENT_MULTISIG.toLowerCase()) {
        contracts.push({ contract: crawlNFT, name: "CrawlNFT", address: EMERGENCY_CONFIG.CONTRACTS.crawlNFT });
      } else {
        console.log(`⚠️  Warning: CrawlNFT not owned by expected multisig`);
      }
    } catch (error) {
      console.log(`❌ Error checking CrawlNFT: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Check PaymentProcessor
  if (EMERGENCY_CONFIG.CONTRACTS.paymentProcessor) {
    try {
      const paymentProcessor = await ethers.getContractAt(
        "PaymentProcessorUpgradeable",
        EMERGENCY_CONFIG.CONTRACTS.paymentProcessor
      );
      const currentOwner = await paymentProcessor.owner();
      console.log(`💰 PaymentProcessor owner: ${currentOwner}`);
      
      if (currentOwner.toLowerCase() === EMERGENCY_CONFIG.CURRENT_MULTISIG.toLowerCase()) {
        contracts.push({ contract: paymentProcessor, name: "PaymentProcessor", address: EMERGENCY_CONFIG.CONTRACTS.paymentProcessor });
      } else {
        console.log(`⚠️  Warning: PaymentProcessor not owned by expected multisig`);
      }
    } catch (error) {
      console.log(`❌ Error checking PaymentProcessor: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  if (contracts.length === 0) {
    console.log("❌ No contracts found that need emergency recovery");
    return;
  }
  
  // Execute emergency transfers
  console.log(`\n🚨 Executing Emergency Recovery for ${contracts.length} contracts`);
  console.log("==========================================================");
  
  const recoveryResults = [];
  
  for (const { contract, name, address } of contracts) {
    try {
      console.log(`🔄 Recovering ${name}...`);
      
      // This assumes the current account has the ability to call transferOwnership
      // In practice, this might need to be done through the multisig
      const tx = await contract.transferOwnership(EMERGENCY_CONFIG.EMERGENCY_ADDRESS);
      console.log(`   Transaction hash: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`   ✅ Recovered in block: ${receipt.blockNumber}`);
      
      recoveryResults.push({
        name,
        address,
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ Recovery failed: ${errorMessage}`);
      recoveryResults.push({
        name,
        address,
        success: false,
        error: errorMessage
      });
    }
  }
  
  // Summary
  console.log("\n📊 Emergency Recovery Summary");
  console.log("=============================");
  
  const successful = recoveryResults.filter(r => r.success);
  const failed = recoveryResults.filter(r => !r.success);
  
  console.log(`✅ Successful recoveries: ${successful.length}`);
  successful.forEach(result => {
    console.log(`   ${result.name}: ${result.txHash}`);
  });
  
  if (failed.length > 0) {
    console.log(`❌ Failed recoveries: ${failed.length}`);
    failed.forEach(result => {
      console.log(`   ${result.name}: ${result.error}`);
    });
  }
  
  // Post-recovery verification
  console.log("\n🔍 Post-Recovery Verification");
  console.log("=============================");
  
  for (const { contract, name } of contracts) {
    try {
      const newOwner = await contract.owner();
      const isCorrect = newOwner.toLowerCase() === EMERGENCY_CONFIG.EMERGENCY_ADDRESS.toLowerCase();
      
      console.log(`${name}: ${newOwner} ${isCorrect ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`${name}: Error verifying - ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Post-recovery instructions
  console.log("\n🚨 POST-EMERGENCY ACTIONS REQUIRED");
  console.log("==================================");
  console.log("1. 📢 IMMEDIATELY notify all stakeholders of the emergency action");
  console.log("2. 🔒 Secure the emergency address with proper access controls");
  console.log("3. 🕵️  Investigate the cause of the emergency");
  console.log("4. 🛡️  Set up new multisig wallet with fresh keys");
  console.log("5. 🔄 Transfer ownership to the new secure multisig");
  console.log("6. 📋 Update all operational procedures and documentation");
  console.log("7. 🎯 Conduct security audit and incident review");
  console.log("");
  console.log("⚠️  Remember: This is a temporary measure - restore proper governance ASAP!");
}

/**
 * Alternative: Generate multisig transaction data for emergency recovery
 * Use this when the emergency action needs to be coordinated through the existing multisig
 */
async function generateEmergencyMultisigTransaction() {
  console.log("🔧 Generating Emergency Multisig Transaction Data");
  console.log("================================================");
  
  // This would generate the transaction data that can be submitted to the multisig
  // for emergency ownership transfer
  
  console.log("Transaction data for multisig submission:");
  console.log("(Use this with Gnosis Safe or other multisig interfaces)");
  console.log("");
  
  for (const [contractName, contractAddress] of Object.entries(EMERGENCY_CONFIG.CONTRACTS)) {
    if (contractAddress) {
      // Generate the call data for transferOwnership
      const contract = await ethers.getContractAt("Ownable", contractAddress);
      const callData = contract.interface.encodeFunctionData(
        "transferOwnership",
        [EMERGENCY_CONFIG.EMERGENCY_ADDRESS]
      );
      
      console.log(`${contractName}:`);
      console.log(`  To: ${contractAddress}`);
      console.log(`  Data: ${callData}`);
      console.log(`  Value: 0`);
      console.log("");
    }
  }
}

// Execute based on command line argument
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes("--generate-tx")) {
    generateEmergencyMultisigTransaction()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error("❌ Error generating transaction data:", error);
        process.exit(1);
      });
  } else {
    emergencyOwnershipRecovery()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error("❌ Emergency recovery failed:", error);
        process.exit(1);
      });
  }
}

export { emergencyOwnershipRecovery, generateEmergencyMultisigTransaction, EMERGENCY_CONFIG };
