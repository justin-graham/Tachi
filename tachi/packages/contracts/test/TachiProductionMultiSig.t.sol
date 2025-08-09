// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/TachiProductionMultiSig.sol";

contract TachiProductionMultiSigTest is Test {
    TachiProductionMultiSig public multiSig;
    
    // Test signers
    address public signer1 = address(0x1);
    address public signer2 = address(0x2);  
    address public signer3 = address(0x3);
    address public signer4 = address(0x4);
    address public signer5 = address(0x5);
    
    // Test parameters
    uint256 public constant REQUIRED_SIGNATURES = 3;
    uint256 public constant TIME_LOCK_DURATION = 24 hours;

    function setUp() public {
        address[] memory signers = new address[](5);
        string[] memory roles = new string[](5);
        string[] memory hardwareWalletTypes = new string[](5);
        
        signers[0] = signer1;
        signers[1] = signer2;
        signers[2] = signer3;
        signers[3] = signer4;
        signers[4] = signer5;
        
        roles[0] = "ceo";
        roles[1] = "cto";
        roles[2] = "security";
        roles[3] = "operations";
        roles[4] = "advisor";
        
        hardwareWalletTypes[0] = "ledger";
        hardwareWalletTypes[1] = "ledger";
        hardwareWalletTypes[2] = "trezor";
        hardwareWalletTypes[3] = "ledger";
        hardwareWalletTypes[4] = "trezor";
        
        multiSig = new TachiProductionMultiSig(
            signers,
            roles,
            hardwareWalletTypes,
            REQUIRED_SIGNATURES,
            TIME_LOCK_DURATION
        );
    }

    function testDeployment() public view {
        // Test initial deployment parameters
        assertEq(multiSig.threshold(), REQUIRED_SIGNATURES);
        assertEq(multiSig.timeLockDuration(), TIME_LOCK_DURATION);
        
        address[] memory owners = multiSig.getOwners();
        assertEq(owners.length, 5);
        
        // Verify all signers are owners
        for (uint i = 0; i < owners.length; i++) {
            (bool isActive,,,, string memory role) = multiSig.getOwnerInfo(owners[i]);
            assertTrue(isActive);
            assertTrue(bytes(role).length > 0);
        }
    }

    function testTransactionSubmission() public {
        // Test transaction submission
        vm.prank(signer1);
        uint256 txId = multiSig.submitTransaction(
            address(0x123),
            0,
            "",
            "Test transaction",
            false
        );
        
        assertEq(txId, 0);
        assertEq(multiSig.transactionCount(), 1);
        
        (address to, uint256 value, bytes memory data, bool executed, uint256 confirmations,,,, string memory description) = multiSig.getTransaction(txId);
        assertEq(to, address(0x123));
        assertEq(value, 0);
        assertEq(data.length, 0);
        assertFalse(executed);
        assertEq(confirmations, 0);
        assertEq(description, "Test transaction");
    }

    function testTransactionConfirmation() public {
        // Submit transaction
        vm.prank(signer1);
        uint256 txId = multiSig.submitTransaction(
            address(0x123),
            0,
            "",
            "Test transaction", 
            false
        );
        
        // Confirm from multiple signers
        vm.prank(signer1);
        multiSig.confirmTransaction(txId);
        
        vm.prank(signer2);
        multiSig.confirmTransaction(txId);
        
        vm.prank(signer3);
        multiSig.confirmTransaction(txId);
        
        // Check confirmations
        (, , , , uint256 confirmations,,,, ) = multiSig.getTransaction(txId);
        assertEq(confirmations, 3);
        
        // Check if confirmed by specific signers
        assertTrue(multiSig.isConfirmed(txId, signer1));
        assertTrue(multiSig.isConfirmed(txId, signer2));
        assertTrue(multiSig.isConfirmed(txId, signer3));
        assertFalse(multiSig.isConfirmed(txId, signer4));
    }

    function testEmergencyTransactions() public {
        // Set emergency responder
        vm.prank(address(multiSig));
        multiSig.setEmergencyResponder(signer3, true);
        
        // Submit emergency transaction (no time-lock)
        vm.prank(signer3);
        uint256 txId = multiSig.submitTransaction(
            address(0x123),
            0,
            "",
            "Emergency pause",
            true
        );
        
        // Should be marked as emergency
        (, , , , , , , bool isEmergency, ) = multiSig.getTransaction(txId);
        assertTrue(isEmergency);
    }

    function testOwnerManagement() public view {
        // Test getting owner info
        (bool isActive, uint256 addedAt, uint256 lastActivity, string memory hardwareWalletType, string memory role) = multiSig.getOwnerInfo(signer1);
        
        assertTrue(isActive);
        assertGt(addedAt, 0);
        assertGt(lastActivity, 0);
        assertEq(hardwareWalletType, "ledger");
        assertEq(role, "ceo");
    }

    function testAccessControl() public {
        // Test that non-owners cannot submit transactions
        vm.prank(address(0x999));
        vm.expectRevert("Not an active owner");
        multiSig.submitTransaction(address(0x123), 0, "", "Should fail", false);
        
        // Test that non-owners cannot confirm transactions
        vm.prank(signer1);
        uint256 txId = multiSig.submitTransaction(address(0x123), 0, "", "Test", false);
        
        vm.prank(address(0x999));
        vm.expectRevert("Not an active owner");
        multiSig.confirmTransaction(txId);
    }

    function testTimeLock() public {
        // Submit regular transaction
        vm.prank(signer1);
        uint256 txId = multiSig.submitTransaction(
            address(0x123),
            0,
            "",
            "Time-locked transaction",
            false
        );
        
        // Get enough confirmations
        vm.prank(signer1);
        multiSig.confirmTransaction(txId);
        
        vm.prank(signer2);
        multiSig.confirmTransaction(txId);
        
        vm.prank(signer3);
        multiSig.confirmTransaction(txId);
        
        // Should not execute immediately due to time-lock
        (, , , bool executed, , , , , ) = multiSig.getTransaction(txId);
        assertFalse(executed);
        
        // Fast forward time
        vm.warp(block.timestamp + TIME_LOCK_DURATION + 1);
        
        // Now should be able to execute
        vm.prank(signer1);
        multiSig.executeTransaction(txId);
        
        (, , , executed, , , , , ) = multiSig.getTransaction(txId);
        assertTrue(executed);
    }
}
