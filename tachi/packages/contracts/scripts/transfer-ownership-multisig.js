"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MULTISIG_CONFIG = void 0;
exports.transferOwnershipToMultisig = transferOwnershipToMultisig;
const hardhat_1 = require("hardhat");
// Configuration for multisig ownership transfer
const MULTISIG_CONFIG = {
    // Replace with your actual Gnosis Safe address after creation
    MULTISIG_ADDRESS: "0x0000000000000000000000000000000000000000", // REPLACE THIS
    // Contract addresses from deployment
    CONTRACTS: {
        crawlNFT: "0xa974E189038f5b0dEcEbfCe7B0A108824acF3813", // Replace with actual
        paymentProcessor: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9", // Replace with actual
        // Add other contract addresses as needed
    },
    // Network configuration
    NETWORK: "base", // or "base-sepolia" for testnet
};
exports.MULTISIG_CONFIG = MULTISIG_CONFIG;
/**
 * Script to transfer ownership of all Tachi Protocol contracts to a multisig wallet
 */
async function transferOwnershipToMultisig() {
    console.log("🔐 Starting Ownership Transfer to Multisig Wallet");
    console.log("================================================");
    // Validate configuration
    if (MULTISIG_CONFIG.MULTISIG_ADDRESS === "0x0000000000000000000000000000000000000000") {
        throw new Error("❌ Please set the MULTISIG_ADDRESS in the configuration");
    }
    const [deployer] = await hardhat_1.ethers.getSigners();
    console.log(`📍 Current owner account: ${deployer.address}`);
    console.log(`🏦 Target multisig address: ${MULTISIG_CONFIG.MULTISIG_ADDRESS}`);
    console.log(`🌐 Network: ${MULTISIG_CONFIG.NETWORK}`);
    console.log("");
    // Verify current ownership
    console.log("🔍 Verifying Current Ownership");
    console.log("------------------------------");
    const contracts = [];
    // Check CrawlNFT ownership
    if (MULTISIG_CONFIG.CONTRACTS.crawlNFT) {
        const crawlNFT = await hardhat_1.ethers.getContractAt("CrawlNFTUpgradeable", MULTISIG_CONFIG.CONTRACTS.crawlNFT);
        const currentOwner = await crawlNFT.owner();
        console.log(`📄 CrawlNFT (${MULTISIG_CONFIG.CONTRACTS.crawlNFT}): ${currentOwner}`);
        if (currentOwner.toLowerCase() === deployer.address.toLowerCase()) {
            contracts.push({ contract: crawlNFT, name: "CrawlNFT", address: MULTISIG_CONFIG.CONTRACTS.crawlNFT });
        }
        else {
            console.log(`⚠️  Warning: CrawlNFT not owned by current account`);
        }
    }
    // Check PaymentProcessor ownership
    if (MULTISIG_CONFIG.CONTRACTS.paymentProcessor) {
        const paymentProcessor = await hardhat_1.ethers.getContractAt("PaymentProcessorUpgradeable", MULTISIG_CONFIG.CONTRACTS.paymentProcessor);
        const currentOwner = await paymentProcessor.owner();
        console.log(`💰 PaymentProcessor (${MULTISIG_CONFIG.CONTRACTS.paymentProcessor}): ${currentOwner}`);
        if (currentOwner.toLowerCase() === deployer.address.toLowerCase()) {
            contracts.push({ contract: paymentProcessor, name: "PaymentProcessor", address: MULTISIG_CONFIG.CONTRACTS.paymentProcessor });
        }
        else {
            console.log(`⚠️  Warning: PaymentProcessor not owned by current account`);
        }
    }
    if (contracts.length === 0) {
        throw new Error("❌ No contracts found that are owned by the current account");
    }
    console.log(`\n✅ Found ${contracts.length} contracts to transfer ownership`);
    console.log("");
    // Confirm transfer
    console.log("🚨 CRITICAL: OWNERSHIP TRANSFER CONFIRMATION");
    console.log("============================================");
    console.log("This action will transfer ownership of ALL protocol contracts");
    console.log("to the multisig wallet. This action is IRREVERSIBLE!");
    console.log("");
    console.log("Please verify:");
    console.log(`1. Multisig address is correct: ${MULTISIG_CONFIG.MULTISIG_ADDRESS}`);
    console.log(`2. You have access to the multisig wallet`);
    console.log(`3. All multisig owners are properly configured`);
    console.log("");
    // In production, you might want to add a manual confirmation step here
    // For now, we'll proceed with a delay
    console.log("⏳ Starting transfer in 10 seconds... (Ctrl+C to cancel)");
    await new Promise(resolve => setTimeout(resolve, 10000));
    // Perform ownership transfers
    console.log("🔄 Executing Ownership Transfers");
    console.log("--------------------------------");
    const transferResults = [];
    for (const { contract, name, address } of contracts) {
        try {
            console.log(`📤 Transferring ${name}...`);
            // Execute transfer
            const tx = await contract.transferOwnership(MULTISIG_CONFIG.MULTISIG_ADDRESS);
            console.log(`   Transaction hash: ${tx.hash}`);
            // Wait for confirmation
            const receipt = await tx.wait();
            console.log(`   ✅ Confirmed in block: ${receipt.blockNumber}`);
            transferResults.push({
                name,
                address,
                success: true,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.log(`   ❌ Failed: ${errorMessage}`);
            transferResults.push({
                name,
                address,
                success: false,
                error: errorMessage
            });
        }
    }
    // Summary
    console.log("\n📊 Transfer Summary");
    console.log("==================");
    const successful = transferResults.filter(r => r.success);
    const failed = transferResults.filter(r => !r.success);
    console.log(`✅ Successful transfers: ${successful.length}`);
    successful.forEach(result => {
        console.log(`   ${result.name}: ${result.txHash}`);
    });
    if (failed.length > 0) {
        console.log(`❌ Failed transfers: ${failed.length}`);
        failed.forEach(result => {
            console.log(`   ${result.name}: ${result.error}`);
        });
    }
    // Verification
    console.log("\n🔍 Post-Transfer Verification");
    console.log("=============================");
    for (const { contract, name } of contracts) {
        try {
            const newOwner = await contract.owner();
            const isCorrect = newOwner.toLowerCase() === MULTISIG_CONFIG.MULTISIG_ADDRESS.toLowerCase();
            console.log(`${name}: ${newOwner} ${isCorrect ? '✅' : '❌'}`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.log(`${name}: Error checking ownership - ${errorMessage}`);
        }
    }
    console.log("\n🎉 Ownership transfer process completed!");
    console.log("Next steps:");
    console.log("1. Verify all contracts show the multisig as owner");
    console.log("2. Test multisig functionality with a non-critical operation");
    console.log("3. Update your deployment documentation");
    console.log("4. Inform all multisig owners of the new responsibilities");
}
// Execute the transfer
if (require.main === module) {
    transferOwnershipToMultisig()
        .then(() => process.exit(0))
        .catch((error) => {
        console.error("❌ Error during ownership transfer:", error);
        process.exit(1);
    });
}
