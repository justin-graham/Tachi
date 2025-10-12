"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const fs_1 = require("fs");
const path_1 = require("path");
async function main() {
    const [deployer] = await hardhat_1.ethers.getSigners();
    function log(message) {
        console.log(message);
    }
    log(`\n🔐 Setting up Multi-Sig Ownership on ${hardhat_1.network.name}...`);
    log(`📋 Deployer: ${deployer.address}`);
    log("=".repeat(50));
    // Multi-sig configuration
    const multiSigConfig = getMultiSigConfig(hardhat_1.network.name);
    // Load existing deployment info
    const deploymentFile = (0, path_1.join)("deployments", `${hardhat_1.network.name}-upgradeable.json`);
    let existingDeployment;
    try {
        existingDeployment = JSON.parse((0, fs_1.readFileSync)(deploymentFile, "utf8"));
    }
    catch (error) {
        log(`❌ Could not load existing deployment from ${deploymentFile}`);
        log(`Please run deploy script first.`);
        process.exit(1);
    }
    try {
        // 1. Deploy Gnosis Safe Multi-Sig
        log("\n1️⃣ Deploying Gnosis Safe Multi-Sig...");
        // For simplicity, we'll deploy our own simple multi-sig
        // In production, you'd use the official Gnosis Safe contracts
        const MultiSig = await hardhat_1.ethers.getContractFactory("TachiMultiSig");
        const multiSig = await MultiSig.deploy(multiSigConfig.owners, multiSigConfig.threshold);
        await multiSig.waitForDeployment();
        const multiSigAddress = await multiSig.getAddress();
        log(`✅ Multi-Sig deployed to: ${multiSigAddress}`);
        log(`👥 Owners: ${multiSigConfig.owners.join(", ")}`);
        log(`🔒 Threshold: ${multiSigConfig.threshold}/${multiSigConfig.owners.length}`);
        // 2. Transfer CrawlNFT ownership
        log("\n2️⃣ Transferring CrawlNFT ownership to Multi-Sig...");
        const crawlNFTAddress = existingDeployment.contracts.CrawlNFTUpgradeable.proxy;
        const crawlNFT = await hardhat_1.ethers.getContractAt("CrawlNFTUpgradeable", crawlNFTAddress);
        // Check current owner
        const currentCrawlNFTOwner = await crawlNFT.owner();
        log(`📋 Current CrawlNFT owner: ${currentCrawlNFTOwner}`);
        if (currentCrawlNFTOwner.toLowerCase() !== deployer.address.toLowerCase()) {
            throw new Error(`Deployer is not the current owner of CrawlNFT`);
        }
        // Transfer ownership
        const transferTx1 = await crawlNFT.transferOwnership(multiSigAddress);
        await transferTx1.wait();
        // Verify transfer
        const newCrawlNFTOwner = await crawlNFT.owner();
        log(`✅ CrawlNFT ownership transferred to: ${newCrawlNFTOwner}`);
        // 3. Transfer PaymentProcessor ownership
        log("\n3️⃣ Transferring PaymentProcessor ownership to Multi-Sig...");
        const paymentProcessorAddress = existingDeployment.contracts.PaymentProcessorUpgradeable.proxy;
        const paymentProcessor = await hardhat_1.ethers.getContractAt("PaymentProcessorUpgradeable", paymentProcessorAddress);
        // Check current owner
        const currentPaymentOwner = await paymentProcessor.owner();
        log(`💰 Current PaymentProcessor owner: ${currentPaymentOwner}`);
        if (currentPaymentOwner.toLowerCase() !== deployer.address.toLowerCase()) {
            throw new Error(`Deployer is not the current owner of PaymentProcessor`);
        }
        // Transfer ownership
        const transferTx2 = await paymentProcessor.transferOwnership(multiSigAddress);
        await transferTx2.wait();
        // Verify transfer
        const newPaymentOwner = await paymentProcessor.owner();
        log(`✅ PaymentProcessor ownership transferred to: ${newPaymentOwner}`);
        // 4. Test multi-sig functionality
        log("\n4️⃣ Testing Multi-Sig functionality...");
        try {
            // Test getting owners
            const owners = await multiSig.getOwners();
            log(`✅ Multi-Sig owners: ${owners.join(", ")}`);
            // Test threshold
            const threshold = await multiSig.getThreshold();
            log(`✅ Multi-Sig threshold: ${threshold}`);
            log("✅ Multi-Sig is functional and ready for operations");
        }
        catch (error) {
            log(`⚠️ Multi-Sig test failed: ${error}`);
        }
        // 5. Update deployment info
        const updatedDeployment = {
            ...existingDeployment,
            multiSig: {
                address: multiSigAddress,
                owners: multiSigConfig.owners,
                threshold: multiSigConfig.threshold,
                deployedAt: new Date().toISOString(),
            },
            contracts: {
                ...existingDeployment.contracts,
                CrawlNFTUpgradeable: {
                    ...existingDeployment.contracts.CrawlNFTUpgradeable,
                    owner: multiSigAddress,
                },
                PaymentProcessorUpgradeable: {
                    ...existingDeployment.contracts.PaymentProcessorUpgradeable,
                    owner: multiSigAddress,
                },
            },
            ownershipTransferredAt: new Date().toISOString(),
        };
        // Save updated deployment info
        (0, fs_1.writeFileSync)(deploymentFile, JSON.stringify(updatedDeployment, null, 2));
        log("\n" + "=".repeat(50));
        log("🎉 MULTI-SIG OWNERSHIP SETUP COMPLETE!");
        log("=".repeat(50));
        log(`📋 Network: ${hardhat_1.network.name}`);
        log(`🔐 Multi-Sig: ${multiSigAddress}`);
        log(`🏠 CrawlNFT: ${crawlNFTAddress} (owner: ${multiSigAddress})`);
        log(`💰 PaymentProcessor: ${paymentProcessorAddress} (owner: ${multiSigAddress})`);
        log(`📄 Deployment updated: ${deploymentFile}`);
        log("=".repeat(50));
        log("\n🚨 IMPORTANT: Save the multi-sig address and ensure all owners have access!");
    }
    catch (error) {
        log(`❌ Multi-Sig setup failed: ${error}`);
        throw error;
    }
}
// Multi-sig configuration by network
function getMultiSigConfig(networkName) {
    const configs = {
        "base-sepolia": {
            owners: [
                "0x742d35Cc6635C0532925a3b8D77Ad03b67bFa39c", // Replace with actual owner addresses
                "0x8ba1f109551bD432803012645Hac136c18617bf1", // Team member 1
                "0x323b5d4c9ebe6D6edb5c19c9ec6df4f2e0b9f2c3", // Team member 2
            ],
            threshold: 2, // 2 of 3 signatures required
        },
        "base": {
            owners: [
                "0x742d35Cc6635C0532925a3b8D77Ad03b67bFa39c", // Replace with actual owner addresses
                "0x8ba1f109551bD432803012645Hac136c18617bf1", // Team member 1
                "0x323b5d4c9ebe6D6edb5c19c9ec6df4f2e0b9f2c3", // Team member 2
            ],
            threshold: 2, // 2 of 3 signatures required
        },
        "hardhat": {
            owners: [
                "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Hardhat default account
                "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Hardhat account 1
                "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Hardhat account 2
            ],
            threshold: 2,
        },
        "localhost": {
            owners: [
                "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Local default account
                "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Local account 1
                "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Local account 2
            ],
            threshold: 2,
        },
    };
    const config = configs[networkName];
    if (!config) {
        throw new Error(`No multi-sig configuration found for network: ${networkName}`);
    }
    return config;
}
// Run the multi-sig setup
main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
});
