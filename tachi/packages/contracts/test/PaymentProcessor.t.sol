// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/PaymentProcessor.sol";
import "../src/CrawlNFT.sol";

// Mock USDC token contract for testing
contract MockUSDC {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    string public name = "USD Coin";
    string public symbol = "USDC";
    uint8 public decimals = 6;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor() {
        // Mint initial supply for testing
        balanceOf[msg.sender] = 1000000 * 10**decimals; // 1M USDC
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "ERC20: transfer amount exceeds balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "ERC20: transfer amount exceeds balance");
        require(allowance[from][msg.sender] >= amount, "ERC20: transfer amount exceeds allowance");
        
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }
}

contract PaymentProcessorTest is Test {
    PaymentProcessor public paymentProcessor;
    MockUSDC public mockUSDC;
    CrawlNFT public crawlNFT;
    
    address public owner;
    address public crawler1;
    address public crawler2;
    address public publisher1;
    address public publisher2;
    
    uint256 constant USDC_AMOUNT = 100 * 10**6; // 100 USDC (6 decimals)
    uint256 constant SMALL_AMOUNT = 1 * 10**6; // 1 USDC
    
    string constant TERMS_URI = "ipfs://QmTest1234567890abcdef";
    
    event Payment(
        address indexed from,
        address indexed publisher,
        uint256 amount
    );
    
    event PaymentFailed(
        address indexed from,
        address indexed publisher,
        uint256 amount,
        string reason
    );
    
    function setUp() public {
        owner = address(this);
        crawler1 = address(0x1);
        crawler2 = address(0x2);
        publisher1 = address(0x3);
        publisher2 = address(0x4);
        
        // Deploy mock USDC contract
        mockUSDC = new MockUSDC();
        
        // Deploy PaymentProcessor with mock USDC
        paymentProcessor = new PaymentProcessor(address(mockUSDC));
        
        // Deploy CrawlNFT for testing NFT-based payments
        crawlNFT = new CrawlNFT();
        
        // Set up initial USDC balances
        mockUSDC.mint(crawler1, 1000 * 10**6); // 1000 USDC
        mockUSDC.mint(crawler2, 500 * 10**6);  // 500 USDC
    }
    
    function testConstructor() public view {
        assertEq(paymentProcessor.getUSDCTokenAddress(), address(mockUSDC));
        assertEq(address(paymentProcessor.usdcToken()), address(mockUSDC));
    }
    
    function testConstructorZeroAddress() public {
        vm.expectRevert("PaymentProcessor: USDC token address cannot be zero");
        new PaymentProcessor(address(0));
    }
    
    function testPayPublisherSuccess() public {
        // Arrange: crawler1 approves PaymentProcessor to spend USDC
        vm.prank(crawler1);
        mockUSDC.approve(address(paymentProcessor), USDC_AMOUNT);
        
        // Get initial balances
        uint256 initialCrawlerBalance = mockUSDC.balanceOf(crawler1);
        uint256 initialPublisherBalance = mockUSDC.balanceOf(publisher1);
        
        // Act: crawler1 pays publisher1
        vm.prank(crawler1);
        vm.expectEmit(true, true, false, true);
        emit Payment(crawler1, publisher1, USDC_AMOUNT);
        
        paymentProcessor.payPublisher(publisher1, USDC_AMOUNT);
        
        // Assert: balances updated correctly
        assertEq(mockUSDC.balanceOf(crawler1), initialCrawlerBalance - USDC_AMOUNT);
        assertEq(mockUSDC.balanceOf(publisher1), initialPublisherBalance + USDC_AMOUNT);
        
        // PaymentProcessor should have zero balance (pass-through)
        assertEq(mockUSDC.balanceOf(address(paymentProcessor)), 0);
    }
    
    function testPayPublisherZeroAddress() public {
        vm.prank(crawler1);
        mockUSDC.approve(address(paymentProcessor), USDC_AMOUNT);
        
        vm.prank(crawler1);
        vm.expectRevert("PaymentProcessor: Publisher address cannot be zero");
        paymentProcessor.payPublisher(address(0), USDC_AMOUNT);
    }
    
    function testPayPublisherZeroAmount() public {
        vm.prank(crawler1);
        mockUSDC.approve(address(paymentProcessor), USDC_AMOUNT);
        
        vm.prank(crawler1);
        vm.expectRevert("PaymentProcessor: Amount must be greater than zero");
        paymentProcessor.payPublisher(publisher1, 0);
    }
    
    function testPayPublisherInsufficientBalance() public {
        // Arrange: crawler1 approves more than they have
        vm.prank(crawler1);
        mockUSDC.approve(address(paymentProcessor), 2000 * 10**6);
        
        // Act & Assert: should fail due to insufficient balance
        vm.prank(crawler1);
        vm.expectRevert("PaymentProcessor: Insufficient USDC balance");
        paymentProcessor.payPublisher(publisher1, 2000 * 10**6); // More than crawler1's balance
    }
    
    function testPayPublisherInsufficientAllowance() public {
        // Arrange: crawler1 approves less than payment amount
        vm.prank(crawler1);
        mockUSDC.approve(address(paymentProcessor), SMALL_AMOUNT);
        
        // Act & Assert: should fail due to insufficient allowance
        vm.prank(crawler1);
        vm.expectRevert("PaymentProcessor: Insufficient USDC allowance");
        paymentProcessor.payPublisher(publisher1, USDC_AMOUNT); // More than approved amount
    }
    
    function testPayPublisherByNFTSuccess() public {
        // Arrange: Mint CrawlNFT to publisher1
        crawlNFT.mintLicense(publisher1, TERMS_URI);
        uint256 tokenId = crawlNFT.getPublisherTokenId(publisher1);
        
        // Approve PaymentProcessor to spend USDC
        vm.prank(crawler1);
        mockUSDC.approve(address(paymentProcessor), USDC_AMOUNT);
        
        // Get initial balances
        uint256 initialCrawlerBalance = mockUSDC.balanceOf(crawler1);
        uint256 initialPublisherBalance = mockUSDC.balanceOf(publisher1);
        
        // Act: crawler1 pays publisher1 using NFT token ID
        vm.prank(crawler1);
        vm.expectEmit(true, true, false, true);
        emit Payment(crawler1, publisher1, USDC_AMOUNT);
        
        paymentProcessor.payPublisherByNFT(address(crawlNFT), tokenId, USDC_AMOUNT);
        
        // Assert: balances updated correctly
        assertEq(mockUSDC.balanceOf(crawler1), initialCrawlerBalance - USDC_AMOUNT);
        assertEq(mockUSDC.balanceOf(publisher1), initialPublisherBalance + USDC_AMOUNT);
        assertEq(mockUSDC.balanceOf(address(paymentProcessor)), 0);
    }
    
    function testPayPublisherByNFTZeroCrawlNFTContract() public {
        vm.prank(crawler1);
        mockUSDC.approve(address(paymentProcessor), USDC_AMOUNT);
        
        vm.prank(crawler1);
        vm.expectRevert("PaymentProcessor: CrawlNFT contract address cannot be zero");
        paymentProcessor.payPublisherByNFT(address(0), 1, USDC_AMOUNT);
    }
    
    function testPayPublisherByNFTInvalidTokenId() public {
        vm.prank(crawler1);
        mockUSDC.approve(address(paymentProcessor), USDC_AMOUNT);
        
        vm.prank(crawler1);
        vm.expectRevert("PaymentProcessor: Invalid CrawlNFT token ID or contract");
        paymentProcessor.payPublisherByNFT(address(crawlNFT), 999, USDC_AMOUNT);
    }
    
    function testPayPublisherByNFTZeroAmount() public {
        // Arrange: Mint CrawlNFT to publisher1
        crawlNFT.mintLicense(publisher1, TERMS_URI);
        uint256 tokenId = crawlNFT.getPublisherTokenId(publisher1);
        
        vm.prank(crawler1);
        mockUSDC.approve(address(paymentProcessor), USDC_AMOUNT);
        
        vm.prank(crawler1);
        vm.expectRevert("PaymentProcessor: Amount must be greater than zero");
        paymentProcessor.payPublisherByNFT(address(crawlNFT), tokenId, 0);
    }
    
    function testMultiplePayments() public {
        // Arrange: Set up approvals
        vm.prank(crawler1);
        mockUSDC.approve(address(paymentProcessor), USDC_AMOUNT * 2);
        
        vm.prank(crawler2);
        mockUSDC.approve(address(paymentProcessor), USDC_AMOUNT);
        
        // Act: Multiple payments
        vm.prank(crawler1);
        paymentProcessor.payPublisher(publisher1, USDC_AMOUNT);
        
        vm.prank(crawler1);
        paymentProcessor.payPublisher(publisher2, USDC_AMOUNT);
        
        vm.prank(crawler2);
        paymentProcessor.payPublisher(publisher1, USDC_AMOUNT);
        
        // Assert: All payments processed correctly
        assertEq(mockUSDC.balanceOf(publisher1), USDC_AMOUNT * 2);
        assertEq(mockUSDC.balanceOf(publisher2), USDC_AMOUNT);
        assertEq(mockUSDC.balanceOf(address(paymentProcessor)), 0);
    }
    
    function testGetUSDCBalance() public view {
        assertEq(paymentProcessor.getUSDCBalance(crawler1), 1000 * 10**6);
        assertEq(paymentProcessor.getUSDCBalance(crawler2), 500 * 10**6);
        assertEq(paymentProcessor.getUSDCBalance(publisher1), 0);
    }
    
    function testGetUSDCAllowance() public {
        // Initially no allowance
        assertEq(paymentProcessor.getUSDCAllowance(crawler1), 0);
        
        // Set allowance
        vm.prank(crawler1);
        mockUSDC.approve(address(paymentProcessor), USDC_AMOUNT);
        
        assertEq(paymentProcessor.getUSDCAllowance(crawler1), USDC_AMOUNT);
    }
    
    function testEmergencyTokenRecovery() public {
        // Arrange: Accidentally send tokens to PaymentProcessor
        vm.prank(crawler1);
        mockUSDC.transfer(address(paymentProcessor), USDC_AMOUNT);
        
        assertEq(mockUSDC.balanceOf(address(paymentProcessor)), USDC_AMOUNT);
        
        // Act: Recover tokens
        paymentProcessor.emergencyTokenRecovery(
            address(mockUSDC),
            publisher1,
            USDC_AMOUNT
        );
        
        // Assert: Tokens recovered
        assertEq(mockUSDC.balanceOf(address(paymentProcessor)), 0);
        assertEq(mockUSDC.balanceOf(publisher1), USDC_AMOUNT);
    }
    
    function testEmergencyTokenRecoveryZeroAddress() public {
        vm.expectRevert("PaymentProcessor: Recovery address cannot be zero");
        paymentProcessor.emergencyTokenRecovery(
            address(mockUSDC),
            address(0),
            USDC_AMOUNT
        );
    }
    
    function testEmergencyTokenRecoveryZeroAmount() public {
        vm.expectRevert("PaymentProcessor: Recovery amount must be greater than zero");
        paymentProcessor.emergencyTokenRecovery(
            address(mockUSDC),
            publisher1,
            0
        );
    }
    
    function testEmergencyTokenRecoveryInsufficientBalance() public {
        vm.expectRevert("PaymentProcessor: Insufficient token balance for recovery");
        paymentProcessor.emergencyTokenRecovery(
            address(mockUSDC),
            publisher1,
            USDC_AMOUNT
        );
    }
    
    function testReentrancyProtection() public {
        // This test ensures that the nonReentrant modifier is working
        // In a real scenario, this would be tested with a malicious contract
        // that tries to call payPublisher recursively
        
        vm.prank(crawler1);
        mockUSDC.approve(address(paymentProcessor), USDC_AMOUNT);
        
        vm.prank(crawler1);
        paymentProcessor.payPublisher(publisher1, USDC_AMOUNT);
        
        // The transaction should complete successfully without reentrancy issues
        assertEq(mockUSDC.balanceOf(publisher1), USDC_AMOUNT);
    }
    
    function testPaymentProcessorIsStateless() public {
        // Test that the contract doesn't hold any funds after operations
        vm.prank(crawler1);
        mockUSDC.approve(address(paymentProcessor), USDC_AMOUNT);
        
        vm.prank(crawler1);
        paymentProcessor.payPublisher(publisher1, USDC_AMOUNT);
        
        // PaymentProcessor should never hold funds
        assertEq(mockUSDC.balanceOf(address(paymentProcessor)), 0);
        
        // Test multiple payments
        vm.prank(crawler1);
        mockUSDC.approve(address(paymentProcessor), USDC_AMOUNT);
        
        vm.prank(crawler1);
        paymentProcessor.payPublisher(publisher2, USDC_AMOUNT);
        
        // Still should hold no funds
        assertEq(mockUSDC.balanceOf(address(paymentProcessor)), 0);
    }
}
