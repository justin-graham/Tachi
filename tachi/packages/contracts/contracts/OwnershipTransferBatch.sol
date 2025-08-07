// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./CrawlNFTUpgradeable.sol";
import "./PaymentProcessorUpgradeable.sol";

/**
 * @title OwnershipTransferBatch
 * @dev Utility contract for batch ownership transfers to multisig wallet
 * @notice This contract helps transfer ownership of multiple contracts in a single transaction
 */
contract OwnershipTransferBatch {
    struct ContractAddress {
        address contractAddr;
        string name;
    }
    
    event OwnershipTransferInitiated(address indexed contract_, address indexed newOwner);
    event BatchTransferCompleted(uint256 contractCount, address indexed newOwner);
    
    /**
     * @dev Transfer ownership of multiple contracts to a new owner (multisig)
     * @param contracts Array of contract addresses to transfer
     * @param newOwner Address of the new owner (multisig wallet)
     */
    function batchTransferOwnership(
        ContractAddress[] calldata contracts,
        address newOwner
    ) external {
        require(newOwner != address(0), "New owner cannot be zero address");
        require(contracts.length > 0, "Must specify at least one contract");
        
        for (uint256 i = 0; i < contracts.length; i++) {
            address contractAddr = contracts[i].contractAddr;
            
            // Try to transfer ownership if the contract supports Ownable
            try this.transferContractOwnership(contractAddr, newOwner) {
                emit OwnershipTransferInitiated(contractAddr, newOwner);
            } catch {
                // Log failed transfer but continue with others
                revert(string(abi.encodePacked("Failed to transfer ownership of ", contracts[i].name)));
            }
        }
        
        emit BatchTransferCompleted(contracts.length, newOwner);
    }
    
    /**
     * @dev Internal function to transfer ownership of a single contract
     * @param contractAddr Address of the contract
     * @param newOwner Address of the new owner
     */
    function transferContractOwnership(address contractAddr, address newOwner) external {
        // This will work for any Ownable contract
        (bool success, ) = contractAddr.call(
            abi.encodeWithSignature("transferOwnership(address)", newOwner)
        );
        require(success, "Ownership transfer failed");
    }
    
    /**
     * @dev Verify current owners of multiple contracts
     * @param contracts Array of contract addresses to check
     * @return owners Array of current owner addresses
     */
    function verifyCurrentOwners(address[] calldata contracts) 
        external 
        view 
        returns (address[] memory owners) 
    {
        owners = new address[](contracts.length);
        
        for (uint256 i = 0; i < contracts.length; i++) {
            (bool success, bytes memory data) = contracts[i].staticcall(
                abi.encodeWithSignature("owner()")
            );
            
            if (success && data.length >= 32) {
                owners[i] = abi.decode(data, (address));
            } else {
                owners[i] = address(0); // Contract doesn't have owner() function
            }
        }
    }
}
