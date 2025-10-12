import { ethers, upgrades } from "hardhat";

async function main() {
    console.log("=== UUPS Upgradeable ProofOfCrawlLedger Deployment ===");
    console.log("Network:", (await ethers.provider.getNetwork()).name);
    
    // Get the contract factory
    const ProofOfCrawlLedgerUpgradeable = await ethers.getContractFactory("ProofOfCrawlLedgerUpgradeable");
    console.log("Contract factory loaded: ProofOfCrawlLedgerUpgradeable");

    // Get signer
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

    // Deploy the proxy with initialize() call
    console.log("\nDeploying ProofOfCrawlLedgerUpgradeable with proxy...");
    const proxy = await upgrades.deployProxy(
        ProofOfCrawlLedgerUpgradeable, 
        [deployer.address], // initializer arguments: _owner
        { 
            kind: 'uups',
            initializer: 'initialize',
            timeout: 60000 // 60 second timeout
        }
    );

    // Wait for deployment
    await proxy.waitForDeployment();
    const proxyAddress = await proxy.getAddress();
    
    console.log("✅ ProofOfCrawlLedgerUpgradeable deployed to:", proxyAddress);
    
    // Get implementation address for verification
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log("📋 Implementation address:", implementationAddress);
    
    const adminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);
    console.log("🔑 Proxy admin address:", adminAddress);

    // Verify the contract is working
    console.log("\n=== Contract Verification ===");
    const contract = ProofOfCrawlLedgerUpgradeable.attach(proxyAddress);
    
    try {
        const version = await contract.getVersion();
        console.log("✅ Contract version:", version);
        
        const owner = await contract.owner();
        console.log("✅ Contract owner:", owner);
        
        const stats = await contract.getContractStats();
        console.log("✅ Contract stats:", {
            totalCrawlsLogged: stats.totalCrawls.toString(),
            contractVersion: stats.contractVersion,
            contractOwner: stats.contractOwner
        });
        
        const implementationFromContract = await contract.getImplementation();
        console.log("✅ Implementation from contract:", implementationFromContract);
        
        console.log("✅ Contract successfully deployed and verified!");
        
    } catch (error) {
        console.error("❌ Contract verification failed:", error);
        throw error;
    }

    // Test basic functionality
    console.log("\n=== Testing Basic Functionality ===");
    try {
        // Test logging a crawl (only owner can do this)
        console.log("Testing crawl logging...");
        const tx = await contract.logCrawl(1, deployer.address);
        await tx.wait();
        console.log("✅ Test crawl logged successfully");
        
        // Check if crawl was logged
        const crawlExists = await contract.hasCrawlBeenLogged(1, deployer.address, (await ethers.provider.getBlock('latest'))!.timestamp);
        console.log("✅ Crawl existence check:", crawlExists);
        
        // Get updated stats
        const updatedStats = await contract.getContractStats();
        console.log("✅ Updated total crawls:", updatedStats.totalCrawls.toString());
        
    } catch (error) {
        console.warn("⚠️ Basic functionality test failed (this is normal if not owner):", error instanceof Error ? error.message : error);
    }

    // Save deployment info
    const deploymentInfo = {
        network: (await ethers.provider.getNetwork()).name,
        contractName: "ProofOfCrawlLedgerUpgradeable",
        proxyAddress: proxyAddress,
        implementationAddress: implementationAddress,
        adminAddress: adminAddress,
        deployer: deployer.address,
        deployedAt: new Date().toISOString(),
        version: "1.0.0",
        upgradeType: "UUPS"
    };

    console.log("\n=== Deployment Summary ===");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    return {
        proxy: proxyAddress,
        implementation: implementationAddress,
        admin: adminAddress,
        contract: contract
    };
}

// Run the deployment
main()
    .then((result) => {
        console.log("\n🎉 ProofOfCrawlLedger Deployment completed successfully!");
        console.log("Proxy Address:", result.proxy);
        process.exit(0);
    })
    .catch((error) => {
        console.error("💥 Deployment failed:", error);
        process.exit(1);
    });
