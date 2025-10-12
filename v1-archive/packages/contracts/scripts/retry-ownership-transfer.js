"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
async function main() {
    console.log("=== Retrying ProofOfCrawlLedger Ownership Transfer ===");
    const PROOF_OF_CRAWL_LEDGER = "0xeC3311cCd41B450a12404E7D14165D0dfa0725c3";
    const MULTI_SIG_ADDRESS = "0x1C5a9A0228efc875484Bca44df3987bB6A2aca23";
    const [deployer] = await hardhat_1.ethers.getSigners();
    console.log("Executing with account:", deployer.address);
    try {
        const ProofOfCrawlLedgerUpgradeable = await hardhat_1.ethers.getContractFactory("ProofOfCrawlLedgerUpgradeable");
        const crawlLedger = ProofOfCrawlLedgerUpgradeable.attach(PROOF_OF_CRAWL_LEDGER);
        const currentOwner = await crawlLedger.owner();
        console.log("Current owner:", currentOwner);
        if (currentOwner.toLowerCase() === MULTI_SIG_ADDRESS.toLowerCase()) {
            console.log("✅ Already owned by multi-sig");
            return;
        }
        console.log("Transferring ownership with higher gas price...");
        const tx = await crawlLedger.transferOwnership(MULTI_SIG_ADDRESS, {
            gasPrice: hardhat_1.ethers.parseUnits("2", "gwei") // Higher gas price
        });
        console.log("Transaction submitted:", tx.hash);
        console.log("Waiting for confirmation...");
        await tx.wait();
        console.log("✅ ProofOfCrawlLedger ownership transferred!");
        // Verify
        const newOwner = await crawlLedger.owner();
        console.log("New owner:", newOwner);
        const isMultiSigOwned = newOwner.toLowerCase() === MULTI_SIG_ADDRESS.toLowerCase();
        console.log(`${isMultiSigOwned ? '✅' : '❌'} Multi-sig ownership verified: ${isMultiSigOwned}`);
    }
    catch (error) {
        console.error("❌ Transfer failed:", error);
    }
}
main()
    .then(() => {
    console.log("\n✅ Retry completed!");
    process.exit(0);
})
    .catch((error) => {
    console.error("💥 Retry failed:", error);
    process.exit(1);
});
