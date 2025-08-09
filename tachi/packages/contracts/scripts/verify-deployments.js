"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
async function main() {
    console.log("=== Verifying Deployed UUPS Contracts on Base Sepolia ===");
    // Contract addresses from deployment
    const deployedContracts = {
        PaymentProcessor: "0x5a9c9Aa7feC1DF9f5702BcCEB21492be293E5d5F",
        PaymentProcessor2: "0x94b610451d8d4afef1574193812081a2F2cC0De6",
        ProofOfCrawlLedger: "0xeC3311cCd41B450a12404E7D14165D0dfa0725c3"
    };
    const [deployer] = await hardhat_1.ethers.getSigners();
    console.log("Verifying with account:", deployer.address);
    for (const [name, address] of Object.entries(deployedContracts)) {
        console.log(`\n=== ${name} at ${address} ===`);
        try {
            // Check if contract exists
            const code = await hardhat_1.ethers.provider.getCode(address);
            if (code === "0x") {
                console.log("❌ No contract at this address");
                continue;
            }
            console.log("✅ Contract exists");
            // Try to interact with it
            if (name.includes("PaymentProcessor")) {
                const PaymentProcessorUpgradeable = await hardhat_1.ethers.getContractFactory("PaymentProcessorUpgradeable");
                const contract = PaymentProcessorUpgradeable.attach(address);
                try {
                    const version = await contract.getVersion();
                    console.log("✅ Version:", version);
                    const owner = await contract.owner();
                    console.log("✅ Owner:", owner);
                    const usdcToken = await contract.usdcToken();
                    console.log("✅ USDC Token:", usdcToken);
                }
                catch (error) {
                    console.log("❌ Contract interaction failed:", error instanceof Error ? error.message : error);
                }
            }
            else if (name.includes("ProofOfCrawlLedger")) {
                const ProofOfCrawlLedgerUpgradeable = await hardhat_1.ethers.getContractFactory("ProofOfCrawlLedgerUpgradeable");
                const contract = ProofOfCrawlLedgerUpgradeable.attach(address);
                try {
                    const version = await contract.getVersion();
                    console.log("✅ Version:", version);
                    const owner = await contract.owner();
                    console.log("✅ Owner:", owner);
                    const totalCrawls = await contract.totalCrawlsLogged();
                    console.log("✅ Total Crawls:", totalCrawls.toString());
                }
                catch (error) {
                    console.log("❌ Contract interaction failed:", error instanceof Error ? error.message : error);
                }
            }
        }
        catch (error) {
            console.log("❌ Error verifying contract:", error instanceof Error ? error.message : error);
        }
    }
    console.log("\n=== Summary ===");
    console.log("Base Sepolia Testnet Deployments:");
    console.log("PaymentProcessorUpgradeable: 0x5a9c9Aa7feC1DF9f5702BcCEB21492be293E5d5F");
    console.log("ProofOfCrawlLedgerUpgradeable: 0xeC3311cCd41B450a12404E7D14165D0dfa0725c3");
}
main()
    .then(() => {
    console.log("\n🎉 Verification completed!");
    process.exit(0);
})
    .catch((error) => {
    console.error("💥 Verification failed:", error);
    process.exit(1);
});
