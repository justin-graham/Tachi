// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {CrawlNFT} from "../src/CrawlNFT.sol";
import {PaymentProcessor} from "../src/PaymentProcessor.sol";
import {ProofOfCrawl} from "../src/ProofOfCrawl.sol";

contract DeployScript is Script {
  // USDC addresses
  address constant USDC_BASE_MAINNET = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
  address constant USDC_BASE_SEPOLIA = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;

  function run() public {
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    address deployer = vm.addr(deployerPrivateKey);

    console.log("==============================================");
    console.log("Tachi v2 Deployment");
    console.log("==============================================");
    console.log("Deployer:", deployer);
    console.log("Chain ID:", block.chainid);

    // Get USDC address based on chain
    address usdc = block.chainid == 8453 ? USDC_BASE_MAINNET : USDC_BASE_SEPOLIA;
    console.log("USDC Address:", usdc);
    console.log("");

    vm.startBroadcast(deployerPrivateKey);

    // 1. Deploy CrawlNFT
    console.log("Deploying CrawlNFT...");
    CrawlNFT crawlNFT = new CrawlNFT();
    console.log("CrawlNFT deployed at:", address(crawlNFT));
    console.log("");

    // 2. Deploy PaymentProcessor
    console.log("Deploying PaymentProcessor...");
    PaymentProcessor paymentProcessor = new PaymentProcessor(usdc);
    console.log("PaymentProcessor deployed at:", address(paymentProcessor));
    console.log("");

    // 3. Deploy ProofOfCrawl
    console.log("Deploying ProofOfCrawl...");
    ProofOfCrawl proofOfCrawl = new ProofOfCrawl();
    console.log("ProofOfCrawl deployed at:", address(proofOfCrawl));
    console.log("");

    vm.stopBroadcast();

    // Print summary
    console.log("==============================================");
    console.log("Deployment Complete!");
    console.log("==============================================");
    console.log("Network:", block.chainid == 8453 ? "Base Mainnet" : "Base Sepolia");
    console.log("");
    console.log("Contract Addresses:");
    console.log("-------------------");
    console.log("CrawlNFT:          ", address(crawlNFT));
    console.log("PaymentProcessor:  ", address(paymentProcessor));
    console.log("ProofOfCrawl:      ", address(proofOfCrawl));
    console.log("");
    console.log("Next Steps:");
    console.log("1. Update .env with these addresses");
    console.log("2. Verify contracts on Basescan");
    console.log("3. Mint test license: cast send", address(crawlNFT));
    console.log("==============================================");

    // Save addresses to file
    string memory addresses = string.concat(
      "CRAWL_NFT_ADDRESS=",
      vm.toString(address(crawlNFT)),
      "\n",
      "PAYMENT_PROCESSOR_ADDRESS=",
      vm.toString(address(paymentProcessor)),
      "\n",
      "PROOF_OF_CRAWL_ADDRESS=",
      vm.toString(address(proofOfCrawl)),
      "\n"
    );

    vm.writeFile("deployments/latest.env", addresses);
    console.log("Addresses saved to: deployments/latest.env");
  }
}
