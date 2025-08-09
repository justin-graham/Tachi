"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
async function main() {
    console.log("=== Transferring Ownership to Multi-Sig ===");
    // Deployed contract addresses on Base Sepolia
    const PAYMENT_PROCESSOR = "0x5a9c9Aa7feC1DF9f5702BcCEB21492be293E5d5F";
    const PROOF_OF_CRAWL_LEDGER = "0xeC3311cCd41B450a12404E7D14165D0dfa0725c3";
    // Multi-sig address from testnet deployment
    const MULTI_SIG_ADDRESS = "0x1C5a9A0228efc875484Bca44df3987bB6A2aca23";
    const [deployer] = await hardhat_1.ethers.getSigners();
    console.log("Executing with account:", deployer.address);
    console.log("Multi-sig address:", MULTI_SIG_ADDRESS);
    // Transfer PaymentProcessor ownership
    console.log("\n=== Transferring PaymentProcessor Ownership ===");
    try {
        const PaymentProcessorUpgradeable = await hardhat_1.ethers.getContractFactory("PaymentProcessorUpgradeable");
        const paymentProcessor = PaymentProcessorUpgradeable.attach(PAYMENT_PROCESSOR);
        const currentOwner = await paymentProcessor.owner();
        console.log("Current owner:", currentOwner);
        if (currentOwner.toLowerCase() === MULTI_SIG_ADDRESS.toLowerCase()) {
            console.log("✅ PaymentProcessor already owned by multi-sig");
        }
        else {
            console.log("Transferring ownership to multi-sig...");
            const tx = await paymentProcessor.transferOwnership(MULTI_SIG_ADDRESS);
            await tx.wait();
            console.log("✅ PaymentProcessor ownership transferred!");
            console.log("Transaction hash:", tx.hash);
        }
    }
    catch (error) {
        console.error("❌ PaymentProcessor ownership transfer failed:", error);
    }
    // Transfer ProofOfCrawlLedger ownership
    console.log("\n=== Transferring ProofOfCrawlLedger Ownership ===");
    try {
        const ProofOfCrawlLedgerUpgradeable = await hardhat_1.ethers.getContractFactory("ProofOfCrawlLedgerUpgradeable");
        const crawlLedger = ProofOfCrawlLedgerUpgradeable.attach(PROOF_OF_CRAWL_LEDGER);
        const currentOwner = await crawlLedger.owner();
        console.log("Current owner:", currentOwner);
        if (currentOwner.toLowerCase() === MULTI_SIG_ADDRESS.toLowerCase()) {
            console.log("✅ ProofOfCrawlLedger already owned by multi-sig");
        }
        else {
            console.log("Transferring ownership to multi-sig...");
            const tx = await crawlLedger.transferOwnership(MULTI_SIG_ADDRESS);
            await tx.wait();
            console.log("✅ ProofOfCrawlLedger ownership transferred!");
            console.log("Transaction hash:", tx.hash);
        }
    }
    catch (error) {
        console.error("❌ ProofOfCrawlLedger ownership transfer failed:", error);
    }
    // Verify final ownership
    console.log("\n=== Final Ownership Verification ===");
    try {
        const PaymentProcessorUpgradeable = await hardhat_1.ethers.getContractFactory("PaymentProcessorUpgradeable");
        const paymentProcessor = PaymentProcessorUpgradeable.attach(PAYMENT_PROCESSOR);
        const ppOwner = await paymentProcessor.owner();
        const ProofOfCrawlLedgerUpgradeable = await hardhat_1.ethers.getContractFactory("ProofOfCrawlLedgerUpgradeable");
        const crawlLedger = ProofOfCrawlLedgerUpgradeable.attach(PROOF_OF_CRAWL_LEDGER);
        const clOwner = await crawlLedger.owner();
        console.log("PaymentProcessor owner:", ppOwner);
        console.log("ProofOfCrawlLedger owner:", clOwner);
        const ppMultiSigOwned = ppOwner.toLowerCase() === MULTI_SIG_ADDRESS.toLowerCase();
        const clMultiSigOwned = clOwner.toLowerCase() === MULTI_SIG_ADDRESS.toLowerCase();
        console.log(`\n${ppMultiSigOwned ? '✅' : '❌'} PaymentProcessor owned by multi-sig: ${ppMultiSigOwned}`);
        console.log(`${clMultiSigOwned ? '✅' : '❌'} ProofOfCrawlLedger owned by multi-sig: ${clMultiSigOwned}`);
        if (ppMultiSigOwned && clMultiSigOwned) {
            console.log("\n🎉 SUCCESS! All contracts now owned by multi-sig");
            console.log("Future upgrades will require multi-signature approval");
        }
        else {
            console.log("\n⚠️ Some contracts still not owned by multi-sig");
        }
    }
    catch (error) {
        console.error("❌ Final verification failed:", error);
    }
}
main()
    .then(() => {
    console.log("\n✅ Ownership transfer process completed!");
    process.exit(0);
})
    .catch((error) => {
    console.error("💥 Ownership transfer failed:", error);
    process.exit(1);
});
