// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../src/core/CrawlNFT.sol";
import "../src/core/PaymentProcessorUpgradeable.sol";

/**
 * @title Deploy Script for Tachi Protocol Mainnet
 * @dev Deploys CrawlNFT and PaymentProcessorUpgradeable to Base Mainnet
 */
contract Deploy is Script {
    // Base Mainnet configuration
    address constant BASE_MAINNET_USDC = 0x833589fcd6edb6e08f4c7c32d4f71b54bda02913;
    uint256 constant BASE_CHAIN_ID = 8453;
    
    // Deployment configuration
    uint128 constant INITIAL_BASE_CRAWL_FEE = 1_000_000; // 1 USDC (6 decimals)
    uint96 constant INITIAL_PROTOCOL_FEE = 250; // 2.5% in basis points
    
    // Events for contract verification
    event ContractDeployed(string name, address addr);
    event DeploymentComplete(address crawlNFT, address paymentProcessor);
    
    function run() external {
        // Validate environment
        require(block.chainid == BASE_CHAIN_ID, "Must deploy to Base Mainnet");
        
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== Tachi Protocol Base Mainnet Deployment ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("USDC Address:", BASE_MAINNET_USDC);
        console.log("Initial Base Fee:", INITIAL_BASE_CRAWL_FEE);
        console.log("Protocol Fee:", INITIAL_PROTOCOL_FEE, "basis points");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy CrawlNFT (soulbound license NFTs)
        console.log("\n=== Deploying CrawlNFT ===");
        CrawlNFT crawlNFT = new CrawlNFT();
        emit ContractDeployed("CrawlNFT", address(crawlNFT));
        console.log("CrawlNFT deployed at:", address(crawlNFT));
        
        // 2. Deploy PaymentProcessorUpgradeable implementation
        console.log("\n=== Deploying PaymentProcessorUpgradeable ===");
        PaymentProcessorUpgradeable implementation = new PaymentProcessorUpgradeable();
        console.log("Implementation deployed at:", address(implementation));
        
        // 3. Deploy proxy and initialize
        bytes memory initData = abi.encodeWithSelector(
            PaymentProcessorUpgradeable.initialize.selector,
            BASE_MAINNET_USDC,
            address(crawlNFT),
            INITIAL_BASE_CRAWL_FEE,
            INITIAL_PROTOCOL_FEE,
            deployer, // feeRecipient
            deployer  // owner
        );
        
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        PaymentProcessorUpgradeable paymentProcessor = PaymentProcessorUpgradeable(address(proxy));
        
        emit ContractDeployed("PaymentProcessorUpgradeable", address(paymentProcessor));
        console.log("PaymentProcessor Proxy deployed at:", address(paymentProcessor));
        
        // 4. Verify deployments
        console.log("\n=== Verifying Deployments ===");
        
        // Verify CrawlNFT
        console.log("CrawlNFT name:", crawlNFT.name());
        console.log("CrawlNFT symbol:", crawlNFT.symbol());
        console.log("CrawlNFT owner:", crawlNFT.owner());
        console.log("CrawlNFT total supply:", crawlNFT.totalSupply());
        
        // Verify PaymentProcessor
        console.log("PaymentProcessor USDC:", paymentProcessor.usdcToken());
        console.log("PaymentProcessor CrawlNFT:", paymentProcessor.crawlNFTContract());
        console.log("PaymentProcessor base fee:", paymentProcessor.baseCrawlFee());
        console.log("PaymentProcessor protocol fee:", paymentProcessor.protocolFeePercent());
        console.log("PaymentProcessor fee recipient:", paymentProcessor.feeRecipient());
        console.log("PaymentProcessor owner:", paymentProcessor.owner());
        
        // 5. Deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("Network: Base Mainnet (Chain ID:", block.chainid, ")");
        console.log("Deployer:", deployer);
        console.log("USDC Token:", BASE_MAINNET_USDC);
        console.log("");
        console.log("Deployed Contracts:");
        console.log("- CrawlNFT:", address(crawlNFT));
        console.log("- PaymentProcessor:", address(paymentProcessor));
        console.log("- Implementation:", address(implementation));
        
        emit DeploymentComplete(address(crawlNFT), address(paymentProcessor));
        
        vm.stopBroadcast();
        
        // 6. Save deployment info for dashboard
        string memory deploymentJson = string(abi.encodePacked(
            '{\n',
            '  "network": "base-mainnet",\n',
            '  "chainId": ', vm.toString(block.chainid), ',\n',
            '  "deployedAt": "', vm.toString(block.timestamp), '",\n',
            '  "deployer": "', vm.toString(deployer), '",\n',
            '  "contracts": {\n',
            '    "CrawlNFT": {\n',
            '      "address": "', vm.toString(address(crawlNFT)), '",\n',
            '      "type": "soulbound-nft"\n',
            '    },\n',
            '    "PaymentProcessor": {\n',
            '      "address": "', vm.toString(address(paymentProcessor)), '",\n',
            '      "implementation": "', vm.toString(address(implementation)), '",\n',
            '      "type": "upgradeable-proxy"\n',
            '    },\n',
            '    "USDC": {\n',
            '      "address": "', vm.toString(BASE_MAINNET_USDC), '",\n',
            '      "type": "external-token"\n',
            '    }\n',
            '  }\n',
            '}'
        ));
        
        console.log("\n=== Contract Configuration JSON ===");
        console.log(deploymentJson);
        
        // Write to file for dashboard configuration
        vm.writeFile("./deployments/base-mainnet.json", deploymentJson);
        console.log("\nDeployment info saved to: ./deployments/base-mainnet.json");
        
        // 7. Next steps
        console.log("\n=== Next Steps ===");
        console.log("1. Verify contracts on BaseScan:");
        console.log("   forge verify-contract", address(crawlNFT), "src/core/CrawlNFT.sol:CrawlNFT --chain-id 8453");
        console.log("   forge verify-contract", address(implementation), "src/core/PaymentProcessorUpgradeable.sol:PaymentProcessorUpgradeable --chain-id 8453");
        console.log("");
        console.log("2. Update dashboard configuration:");
        console.log("   Copy base-mainnet.json to packages/dashboard/config/contracts.json");
        console.log("");
        console.log("3. Update gateway worker environment variables");
        console.log("4. Transfer ownership to multi-sig wallet");
        console.log("5. Deploy and configure monitoring");
        
        console.log("\n🎉 Mainnet deployment completed successfully!");
    }
}