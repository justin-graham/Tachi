// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/core/PaymentProcessorUpgradeable.sol";
import "../src/utils/MockUSDC.sol";
import "../src/core/CrawlNFT.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract PaymentProcessorFuzzTest is Test {
    PaymentProcessorUpgradeable public paymentProcessor;
    MockUSDC public mockUSDC;
    CrawlNFT public crawlNFT;

    address public owner;
    address public publisher;
    address public crawler;

    function setUp() public {
        owner = address(this);
        publisher = makeAddr("publisher");
        crawler = makeAddr("crawler");

        // Deploy contracts
        mockUSDC = new MockUSDC("Mock USDC", "USDC");
        crawlNFT = new CrawlNFT();

        // Deploy PaymentProcessorUpgradeable with proxy
        PaymentProcessorUpgradeable implementation = new PaymentProcessorUpgradeable();
        bytes memory initData = abi.encodeWithSignature(
            "initialize(address,address,uint256,uint256,address)",
            address(mockUSDC), // _usdcToken
            address(crawlNFT), // _crawlNFTContract
            1_000_000, // _baseCrawlFee (1 USDC)
            250, // _protocolFeePercent (2.5%)
            owner // _feeRecipient
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        paymentProcessor = PaymentProcessorUpgradeable(address(proxy));

        // Mint NFT for publisher
        crawlNFT.mintLicense(publisher, "https://example.com/terms");

        // Give crawler lots of USDC for testing
        mockUSDC.mint(crawler, 1000000 * 10 ** 6); // 1M USDC
    }

    /// @notice Fuzz test for payPublisher with random amounts
    function testFuzz_PayPublisher(uint256 amount) public {
        // Bound amount to valid range (1 wei to 1000 USDC max limit)
        amount = bound(amount, 1, 1000 * 10 ** 6);

        vm.startPrank(crawler);

        // Approve the payment processor
        mockUSDC.approve(address(paymentProcessor), amount);

        // Should succeed for valid amounts
        uint256 initialBalance = mockUSDC.balanceOf(publisher);
        paymentProcessor.payPublisher(publisher, amount);

        // Verify publisher received the payment
        assertEq(mockUSDC.balanceOf(publisher), initialBalance + amount);

        vm.stopPrank();
    }

    /// @notice Fuzz test for payPublisherByNFT with random token IDs and amounts
    function testFuzz_PayPublisherByNFT(uint256 tokenId, uint256 amount) public {
        // Bound inputs to valid ranges
        tokenId = bound(tokenId, 1, 1); // We only minted token ID 1
        amount = bound(amount, 1, 1000 * 10 ** 6); // Respect 1000 USDC max limit

        vm.startPrank(crawler);

        // Approve the payment processor
        mockUSDC.approve(address(paymentProcessor), amount);

        // Should succeed for valid token ID
        if (tokenId == 1) {
            uint256 initialBalance = mockUSDC.balanceOf(publisher);
            paymentProcessor.payPublisherByNFT(address(crawlNFT), tokenId, amount);
            assertEq(mockUSDC.balanceOf(publisher), initialBalance + amount);
        }

        vm.stopPrank();
    }

    /// @notice Fuzz test for payPublisher with random addresses (should handle zero address gracefully)
    function testFuzz_PayPublisherAddresses(address publisherAddr, uint256 amount) public {
        amount = bound(amount, 1, 1000 * 10 ** 6); // Smaller amounts for address testing

        vm.startPrank(crawler);
        mockUSDC.approve(address(paymentProcessor), amount);

        if (publisherAddr == address(0)) {
            // Should revert for zero address
            vm.expectRevert(PaymentProcessorUpgradeable.ZeroAddress.selector);
            paymentProcessor.payPublisher(publisherAddr, amount);
        } else {
            // Record initial balance
            uint256 initialBalance = mockUSDC.balanceOf(publisherAddr);

            // Should succeed for non-zero address
            paymentProcessor.payPublisher(publisherAddr, amount);

            // Check balance increased by the payment amount
            assertEq(mockUSDC.balanceOf(publisherAddr), initialBalance + amount);
        }

        vm.stopPrank();
    }

    /// @notice Fuzz test for emergency token recovery
    function testFuzz_EmergencyTokenRecovery(uint256 amount) public {
        amount = bound(amount, 1, 1000 * 10 ** 6);

        // Send some USDC to the payment processor (shouldn't normally happen)
        mockUSDC.transfer(address(paymentProcessor), amount);

        uint256 initialBalance = mockUSDC.balanceOf(owner);

        // Owner should be able to recover
        paymentProcessor.emergencyTokenRecovery(address(mockUSDC), owner, amount);

        assertEq(mockUSDC.balanceOf(owner), initialBalance + amount);
        assertEq(mockUSDC.balanceOf(address(paymentProcessor)), 0);
    }

    /// @notice Fuzz test that payment processor remains stateless
    function testFuzz_PaymentProcessorStateless(uint256 amount1, uint256 amount2) public {
        amount1 = bound(amount1, 1, 1000 * 10 ** 6); // Respect 1000 USDC max limit
        amount2 = bound(amount2, 1, 1000 * 10 ** 6); // Respect 1000 USDC max limit

        vm.startPrank(crawler);

        // Make first payment
        mockUSDC.approve(address(paymentProcessor), amount1);
        paymentProcessor.payPublisher(publisher, amount1);

        // Payment processor should have zero balance
        assertEq(mockUSDC.balanceOf(address(paymentProcessor)), 0);

        // Make second payment
        mockUSDC.approve(address(paymentProcessor), amount2);
        paymentProcessor.payPublisher(publisher, amount2);

        // Payment processor should still have zero balance
        assertEq(mockUSDC.balanceOf(address(paymentProcessor)), 0);

        // Publisher should have received both payments
        assertEq(mockUSDC.balanceOf(publisher), amount1 + amount2);

        vm.stopPrank();
    }
}
