// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/core/CrawlNFT.sol";
import "../src/core/PaymentProcessorUpgradeable.sol";
import "../src/utils/MockUSDC.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract Deploy is Script {
    // Base network configuration
    address constant USDC_BASE_MAINNET = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address constant USDC_BASE_SEPOLIA = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Determine USDC address based on chain
        address usdcAddress;
        if (block.chainid == 8453) {
            // Base mainnet
            usdcAddress = USDC_BASE_MAINNET;
        } else if (block.chainid == 84532) {
            // Base sepolia
            usdcAddress = USDC_BASE_SEPOLIA;
        } else {
            // For local testing, deploy mock USDC
            MockUSDC mockUSDC = new MockUSDC("Mock USD Coin", "USDC");
            usdcAddress = address(mockUSDC);
            console.log("Deployed MockUSDC at:", usdcAddress);
        }
        
        console.log("Using USDC at:", usdcAddress);
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        
        // 1. Deploy CrawlNFT (Publisher License Contract)
        CrawlNFT crawlNFT = new CrawlNFT();
        console.log("CrawlNFT deployed at:", address(crawlNFT));
        
        // 2. Deploy PaymentProcessor implementation
        PaymentProcessorUpgradeable paymentProcessorImpl = new PaymentProcessorUpgradeable();
        console.log("PaymentProcessor implementation deployed at:", address(paymentProcessorImpl));
        
        // 3. Deploy PaymentProcessor proxy with initialization
        bytes memory initData = abi.encodeWithSelector(
            PaymentProcessorUpgradeable.initialize.selector,
            usdcAddress,                    // USDC token address
            address(crawlNFT),             // CrawlNFT contract address
            1_000_000,                     // Base crawl fee: 1 USDC (6 decimals)
            250,                           // Protocol fee: 2.5% (250 basis points)
            deployer                       // Fee recipient (deployer initially)
        );
        
        ERC1967Proxy paymentProcessorProxy = new ERC1967Proxy(
            address(paymentProcessorImpl),
            initData
        );
        
        PaymentProcessorUpgradeable paymentProcessor = PaymentProcessorUpgradeable(
            address(paymentProcessorProxy)
        );
        
        console.log("PaymentProcessor proxy deployed at:", address(paymentProcessor));
        
        // 4. Verify the deployment
        console.log("\n=== Deployment Verification ===");
        console.log("CrawlNFT owner:", crawlNFT.owner());
        console.log("CrawlNFT total supply:", crawlNFT.totalSupply());
        console.log("PaymentProcessor owner:", paymentProcessor.owner());
        console.log("PaymentProcessor USDC token:", paymentProcessor.getUSDCTokenAddress());
        console.log("PaymentProcessor base crawl fee:", paymentProcessor.baseCrawlFee());
        console.log("PaymentProcessor protocol fee %:", paymentProcessor.protocolFeePercent());
        console.log("PaymentProcessor fee recipient:", paymentProcessor.feeRecipient());
        
        vm.stopBroadcast();
        
        // 5. Save deployment addresses to file
        string memory addresses = string(abi.encodePacked(
            "CRAWL_NFT_ADDRESS=", vm.toString(address(crawlNFT)), "\n",
            "PAYMENT_PROCESSOR_ADDRESS=", vm.toString(address(paymentProcessor)), "\n",
            "USDC_ADDRESS=", vm.toString(usdcAddress), "\n",
            "CHAIN_ID=", vm.toString(block.chainid), "\n",
            "DEPLOYER=", vm.toString(deployer), "\n"
        ));
        
        vm.writeFile("./deployments/latest.env", addresses);
        
        console.log("\n=== Deployment Complete ===");
        console.log("Addresses saved to ./deployments/latest.env");
        console.log("To integrate with dashboard, copy these addresses to your environment variables");
    }
}