"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERIFICATION_CONFIG = void 0;
exports.verifyMultisigOwnership = verifyMultisigOwnership;
const hardhat_1 = require("hardhat");
// Contract addresses and multisig configuration
const VERIFICATION_CONFIG = {
    // Your Gnosis Safe multisig address
    MULTISIG_ADDRESS: "0x0000000000000000000000000000000000000000", // REPLACE THIS
    // Contract addresses to verify
    CONTRACTS: {
        crawlNFT: "0xa974E189038f5b0dEcEbfCe7B0A108824acF3813", // Replace with actual
        paymentProcessor: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9", // Replace with actual
    },
    // Expected multisig owners (for verification)
    EXPECTED_OWNERS: [
        "0x0000000000000000000000000000000000000001", // REPLACE WITH ACTUAL OWNER ADDRESSES
        "0x0000000000000000000000000000000000000002",
        "0x0000000000000000000000000000000000000003",
    ],
    // Expected threshold
    EXPECTED_THRESHOLD: 2, // Number of signatures required
};
exports.VERIFICATION_CONFIG = VERIFICATION_CONFIG;
/**
 * Verify that contracts are properly owned by multisig and multisig is configured correctly
 */
async function verifyMultisigOwnership() {
    console.log("🔍 Verifying Multisig Ownership & Configuration");
    console.log("==============================================");
    const [signer] = await hardhat_1.ethers.getSigners();
    console.log(`📍 Verification account: ${signer.address}`);
    console.log(`🏦 Multisig address: ${VERIFICATION_CONFIG.MULTISIG_ADDRESS}`);
    console.log("");
    // Verify multisig configuration exists
    console.log("🔍 Checking Multisig Configuration");
    console.log("----------------------------------");
    const multisigCode = await hardhat_1.ethers.provider.getCode(VERIFICATION_CONFIG.MULTISIG_ADDRESS);
    if (multisigCode === "0x") {
        console.log("❌ ERROR: No contract found at multisig address");
        console.log("   Please verify the multisig address is correct and deployed");
        return;
    }
    else {
        console.log("✅ Multisig contract found");
    }
    // Try to interact with multisig (this will work if it's a Gnosis Safe)
    try {
        // Standard Gnosis Safe interface
        const gnosisSafe = await hardhat_1.ethers.getContractAt([
            "function getOwners() external view returns (address[] memory)",
            "function getThreshold() external view returns (uint256)",
            "function isOwner(address owner) external view returns (bool)"
        ], VERIFICATION_CONFIG.MULTISIG_ADDRESS);
        const owners = await gnosisSafe.getOwners();
        const threshold = await gnosisSafe.getThreshold();
        console.log(`📋 Owners (${owners.length}):`);
        owners.forEach((owner, index) => {
            console.log(`   ${index + 1}. ${owner}`);
        });
        console.log(`🎯 Threshold: ${threshold}/${owners.length} signatures required`);
        // Verify expected configuration
        console.log("\n🔍 Configuration Verification");
        console.log("-----------------------------");
        if (threshold.toString() === VERIFICATION_CONFIG.EXPECTED_THRESHOLD.toString()) {
            console.log("✅ Threshold matches expected value");
        }
        else {
            console.log(`⚠️  Threshold mismatch: expected ${VERIFICATION_CONFIG.EXPECTED_THRESHOLD}, got ${threshold}`);
        }
        // Check if expected owners are present
        let missingOwners = 0;
        for (const expectedOwner of VERIFICATION_CONFIG.EXPECTED_OWNERS) {
            if (expectedOwner === "0x0000000000000000000000000000000000000001")
                continue; // Skip placeholder
            const isOwner = owners.some((owner) => owner.toLowerCase() === expectedOwner.toLowerCase());
            if (isOwner) {
                console.log(`✅ Owner ${expectedOwner} found`);
            }
            else {
                console.log(`❌ Missing expected owner: ${expectedOwner}`);
                missingOwners++;
            }
        }
        if (missingOwners === 0) {
            console.log("✅ All expected owners are configured");
        }
    }
    catch (error) {
        console.log("⚠️  Could not verify multisig configuration (may not be a standard Gnosis Safe)");
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    // Verify contract ownership
    console.log("\n🔍 Verifying Contract Ownership");
    console.log("-------------------------------");
    const ownershipResults = [];
    // Check CrawlNFT
    if (VERIFICATION_CONFIG.CONTRACTS.crawlNFT) {
        try {
            const crawlNFT = await hardhat_1.ethers.getContractAt("CrawlNFTUpgradeable", VERIFICATION_CONFIG.CONTRACTS.crawlNFT);
            const owner = await crawlNFT.owner();
            const isCorrect = owner.toLowerCase() === VERIFICATION_CONFIG.MULTISIG_ADDRESS.toLowerCase();
            console.log(`📄 CrawlNFT: ${owner} ${isCorrect ? '✅' : '❌'}`);
            ownershipResults.push({ name: "CrawlNFT", correct: isCorrect, owner });
        }
        catch (error) {
            console.log(`📄 CrawlNFT: Error checking ownership - ${error instanceof Error ? error.message : String(error)}`);
            ownershipResults.push({ name: "CrawlNFT", correct: false, error: true });
        }
    }
    // Check PaymentProcessor
    if (VERIFICATION_CONFIG.CONTRACTS.paymentProcessor) {
        try {
            const paymentProcessor = await hardhat_1.ethers.getContractAt("PaymentProcessorUpgradeable", VERIFICATION_CONFIG.CONTRACTS.paymentProcessor);
            const owner = await paymentProcessor.owner();
            const isCorrect = owner.toLowerCase() === VERIFICATION_CONFIG.MULTISIG_ADDRESS.toLowerCase();
            console.log(`💰 PaymentProcessor: ${owner} ${isCorrect ? '✅' : '❌'}`);
            ownershipResults.push({ name: "PaymentProcessor", correct: isCorrect, owner });
        }
        catch (error) {
            console.log(`💰 PaymentProcessor: Error checking ownership - ${error instanceof Error ? error.message : String(error)}`);
            ownershipResults.push({ name: "PaymentProcessor", correct: false, error: true });
        }
    }
    // Summary
    console.log("\n📊 Verification Summary");
    console.log("=======================");
    const correctOwnership = ownershipResults.filter(r => r.correct).length;
    const totalContracts = ownershipResults.length;
    if (correctOwnership === totalContracts && totalContracts > 0) {
        console.log("🎉 ALL CONTRACTS PROPERLY OWNED BY MULTISIG!");
        console.log("\n✅ Security Status: SECURE");
        console.log("✅ Ready for production operations");
    }
    else {
        console.log(`⚠️  ${correctOwnership}/${totalContracts} contracts have correct ownership`);
        console.log("\n❌ Security Status: NEEDS ATTENTION");
        const incorrectContracts = ownershipResults.filter(r => !r.correct);
        incorrectContracts.forEach(contract => {
            if (contract.error) {
                console.log(`   ${contract.name}: Error accessing contract`);
            }
            else {
                console.log(`   ${contract.name}: Owned by ${contract.owner} (should be ${VERIFICATION_CONFIG.MULTISIG_ADDRESS})`);
            }
        });
    }
    console.log("\nNext Steps:");
    console.log("1. If ownership is incorrect, run transfer-ownership-multisig.ts");
    console.log("2. Test multisig functionality with a small transaction");
    console.log("3. Update operational procedures to use multisig");
    console.log("4. Document emergency procedures");
}
// Execute verification
if (require.main === module) {
    verifyMultisigOwnership()
        .then(() => process.exit(0))
        .catch((error) => {
        console.error("❌ Verification failed:", error);
        process.exit(1);
    });
}
