// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/TachiCore.sol";

contract TachiCoreTest is Test {
    TachiCore public tachiCore;
    address public owner;
    address public user1;
    address public user2;
    
    // Allow test contract to receive Ether
    receive() external payable {}
    
    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        
        tachiCore = new TachiCore();
    }
    
    function testVersion() public view {
        assertEq(tachiCore.VERSION(), 1);
    }
    
    function testDeposit() public {
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        tachiCore.deposit{value: 0.5 ether}();
        
        assertEq(tachiCore.getBalance(user1), 0.5 ether);
    }
    
    function testDepositZeroAmount() public {
        vm.prank(user1);
        vm.expectRevert("Must deposit positive amount");
        tachiCore.deposit{value: 0}();
    }
    
    function testRequestCrawl() public {
        // Setup: user deposits funds
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        tachiCore.deposit{value: 0.5 ether}();
        
        // Test: request crawl
        vm.prank(user1);
        vm.expectEmit(true, false, false, true);
        emit TachiCore.CrawlRequested(user1, "https://example.com", 0.1 ether);
        tachiCore.requestCrawl("https://example.com", 0.1 ether);
        
        // Verify balance was deducted
        assertEq(tachiCore.getBalance(user1), 0.4 ether);
    }
    
    function testRequestCrawlInsufficientBalance() public {
        vm.prank(user1);
        vm.expectRevert("Insufficient balance");
        tachiCore.requestCrawl("https://example.com", 0.1 ether);
    }
    
    function testRequestCrawlZeroPayment() public {
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        tachiCore.deposit{value: 0.5 ether}();
        
        vm.prank(user1);
        vm.expectRevert("Payment must be positive");
        tachiCore.requestCrawl("https://example.com", 0);
    }
    
    function testCompleteCrawl() public {
        bytes32 resultHash = keccak256("crawl result");
        
        vm.expectEmit(true, false, false, true);
        emit TachiCore.CrawlCompleted(user1, "https://example.com", resultHash);
        tachiCore.completeCrawl(user1, "https://example.com", resultHash);
    }
    
    function testCompleteCrawlOnlyOwner() public {
        bytes32 resultHash = keccak256("crawl result");
        
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user1));
        tachiCore.completeCrawl(user1, "https://example.com", resultHash);
    }
    
    function testWithdraw() public {
        // Setup: contract receives funds
        vm.deal(address(tachiCore), 1 ether);
        
        uint256 initialBalance = owner.balance;
        tachiCore.withdraw(0.5 ether);
        
        assertEq(owner.balance, initialBalance + 0.5 ether);
    }
    
    function testWithdrawOnlyOwner() public {
        vm.deal(address(tachiCore), 1 ether);
        
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user1));
        tachiCore.withdraw(0.5 ether);
    }
    
    function testWithdrawInsufficientBalance() public {
        vm.expectRevert("Insufficient contract balance");
        tachiCore.withdraw(1 ether);
    }
}
