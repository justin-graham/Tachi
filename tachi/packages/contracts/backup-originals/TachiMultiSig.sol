// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title TachiMultiSig
 * @dev Simple multi-signature wallet for contract ownership
 * 
 * This is a simplified multi-sig for contract ownership management.
 * For production, consider using Gnosis Safe or similar audited solutions.
 */
contract TachiMultiSig is ReentrancyGuard {
    using ECDSA for bytes32;

    // Events
    event OwnerAdded(address indexed owner);
    event OwnerRemoved(address indexed owner);
    event ThresholdChanged(uint256 threshold);
    event TransactionSubmitted(uint256 indexed txId, address indexed submitter);
    event TransactionConfirmed(uint256 indexed txId, address indexed owner);
    event TransactionExecuted(uint256 indexed txId);
    event TransactionRevoked(uint256 indexed txId, address indexed owner);

    // Structs
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmations;
        mapping(address => bool) confirmedBy;
    }

    // State variables
    mapping(address => bool) public isOwner;
    address[] public owners;
    uint256 public threshold;
    uint256 public transactionCount;
    mapping(uint256 => Transaction) public transactions;

    // Modifiers
    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }

    modifier onlyMultiSig() {
        require(msg.sender == address(this), "Only multisig can call");
        _;
    }

    modifier validTransaction(uint256 _txId) {
        require(_txId < transactionCount, "Transaction does not exist");
        require(!transactions[_txId].executed, "Transaction already executed");
        _;
    }

    modifier notConfirmed(uint256 _txId) {
        require(!transactions[_txId].confirmedBy[msg.sender], "Transaction already confirmed");
        _;
    }

    /**
     * @dev Constructor sets initial owners and threshold
     * @param _owners List of initial owners
     * @param _threshold Number of confirmations required
     */
    constructor(address[] memory _owners, uint256 _threshold) {
        require(_owners.length > 0, "Owners required");
        require(_threshold > 0 && _threshold <= _owners.length, "Invalid threshold");

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Duplicate owner");

            isOwner[owner] = true;
            owners.push(owner);
            emit OwnerAdded(owner);
        }

        threshold = _threshold;
        emit ThresholdChanged(_threshold);
    }

    /**
     * @dev Submit a transaction for execution
     * @param _to Target contract address
     * @param _value ETH value to send
     * @param _data Transaction data
     * @return txId Transaction ID
     */
    function submitTransaction(
        address _to,
        uint256 _value,
        bytes memory _data
    ) public onlyOwner returns (uint256 txId) {
        txId = transactionCount;
        
        Transaction storage transaction = transactions[txId];
        transaction.to = _to;
        transaction.value = _value;
        transaction.data = _data;
        transaction.executed = false;
        transaction.confirmations = 0;

        transactionCount++;

        emit TransactionSubmitted(txId, msg.sender);
        
        // Automatically confirm the transaction for the submitter
        confirmTransaction(txId);
        
        return txId;
    }

    /**
     * @dev Confirm a transaction
     * @param _txId Transaction ID
     */
    function confirmTransaction(uint256 _txId) 
        public 
        onlyOwner 
        validTransaction(_txId) 
        notConfirmed(_txId) 
    {
        Transaction storage transaction = transactions[_txId];
        transaction.confirmedBy[msg.sender] = true;
        transaction.confirmations++;

        emit TransactionConfirmed(_txId, msg.sender);

        // Execute if threshold is reached
        if (transaction.confirmations >= threshold) {
            executeTransaction(_txId);
        }
    }

    /**
     * @dev Revoke confirmation of a transaction
     * @param _txId Transaction ID
     */
    function revokeConfirmation(uint256 _txId) 
        public 
        onlyOwner 
        validTransaction(_txId) 
    {
        Transaction storage transaction = transactions[_txId];
        require(transaction.confirmedBy[msg.sender], "Transaction not confirmed");

        transaction.confirmedBy[msg.sender] = false;
        transaction.confirmations--;

        emit TransactionRevoked(_txId, msg.sender);
    }

    /**
     * @dev Execute a confirmed transaction
     * @param _txId Transaction ID
     */
    function executeTransaction(uint256 _txId) 
        public 
        validTransaction(_txId) 
        nonReentrant 
    {
        Transaction storage transaction = transactions[_txId];
        require(transaction.confirmations >= threshold, "Not enough confirmations");

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "Transaction failed");

        emit TransactionExecuted(_txId);
    }

    /**
     * @dev Add a new owner (requires multi-sig approval)
     * @param _owner New owner address
     */
    function addOwner(address _owner) public onlyMultiSig {
        require(_owner != address(0), "Invalid owner");
        require(!isOwner[_owner], "Already an owner");

        isOwner[_owner] = true;
        owners.push(_owner);

        emit OwnerAdded(_owner);
    }

    /**
     * @dev Remove an owner (requires multi-sig approval)
     * @param _owner Owner address to remove
     */
    function removeOwner(address _owner) public onlyMultiSig {
        require(isOwner[_owner], "Not an owner");
        require(owners.length > 1, "Cannot remove last owner");

        isOwner[_owner] = false;

        // Remove from owners array
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == _owner) {
                owners[i] = owners[owners.length - 1];
                owners.pop();
                break;
            }
        }

        // Adjust threshold if necessary
        if (threshold > owners.length) {
            threshold = owners.length;
            emit ThresholdChanged(threshold);
        }

        emit OwnerRemoved(_owner);
    }

    /**
     * @dev Change the threshold (requires multi-sig approval)
     * @param _threshold New threshold
     */
    function changeThreshold(uint256 _threshold) public onlyMultiSig {
        require(_threshold > 0 && _threshold <= owners.length, "Invalid threshold");
        
        threshold = _threshold;
        emit ThresholdChanged(_threshold);
    }

    // View functions
    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    function getThreshold() public view returns (uint256) {
        return threshold;
    }

    function getTransactionCount() public view returns (uint256) {
        return transactionCount;
    }

    function isConfirmedBy(uint256 _txId, address _owner) public view returns (bool) {
        return transactions[_txId].confirmedBy[_owner];
    }

    function getConfirmationCount(uint256 _txId) public view returns (uint256) {
        return transactions[_txId].confirmations;
    }

    function getTransaction(uint256 _txId) public view returns (
        address to,
        uint256 value,
        bytes memory data,
        bool executed,
        uint256 confirmations
    ) {
        Transaction storage transaction = transactions[_txId];
        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.confirmations
        );
    }

    // Allow contract to receive ETH
    receive() external payable {}
    fallback() external payable {}
}
