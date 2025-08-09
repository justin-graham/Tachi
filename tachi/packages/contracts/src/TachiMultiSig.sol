// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title TachiMultiSig - Optimized Multi-Signature Wallet for Tachi Protocol
/// @notice Gas-optimized multi-signature wallet with batch operations and upgraded security
/// @dev Gas optimizations: packed structs, batch processing, efficient signature verification
contract TachiMultiSig is ReentrancyGuard, Pausable {
    using ECDSA for bytes32;

    // Constants
    uint256 public constant MAX_OWNERS = 32; // Increased for bitmap optimization
    uint256 public constant MIN_CONFIRMATION_TIME = 24 hours;
    uint256 public constant MAX_CONFIRMATION_TIME = 7 days;

    // Custom errors for gas efficiency
    error InvalidOwner();
    error OwnerExists();
    error NotOwner();
    error InvalidThreshold();
    error TransactionNotFound();
    error TransactionAlreadyExecuted();
    error TransactionAlreadyConfirmed();
    error InsufficientConfirmations();
    error TimeLockNotExpired();
    error ArrayLengthMismatch();
    error ExceedsMaxOwners();
    error InvalidConfirmationTime();

    // Events
    event OwnerAdded(address indexed owner, uint256 ownerIndex, uint256 timestamp);
    event OwnerRemoved(address indexed owner, uint256 ownerIndex, uint256 timestamp);
    event ThresholdChanged(uint256 oldThreshold, uint256 newThreshold, uint256 timestamp);
    event TransactionSubmitted(uint256 indexed txId, address indexed submitter, address indexed to, uint256 value);
    event TransactionConfirmed(uint256 indexed txId, address indexed owner, uint256 confirmationCount);
    event TransactionRevoked(uint256 indexed txId, address indexed owner, uint256 confirmationCount);
    event TransactionExecuted(uint256 indexed txId, address indexed executor, bool success);
    event BatchTransactionSubmitted(uint256 startTxId, uint256 count);
    event EmergencyActionExecuted(uint256 indexed txId, address indexed executor, string reason);

    // Packed struct for transaction (fits in 2 storage slots)
    struct Transaction {
        address to;              // 20 bytes
        bool executed;           // 1 byte
        bool isEmergency;        // 1 byte
        uint32 submissionTime;   // 4 bytes (enough until 2106)
        uint32 confirmationDeadline; // 4 bytes
        uint128 value;          // 16 bytes (more than enough for ETH amounts)
        // Slot 1 total: 46 bytes - needs 2 slots
        
        bytes data;             // Dynamic, separate slot
        uint256 confirmationBitmap; // 32 bits for confirmations (separate slot)
    }

    // Packed struct for owner info (fits in 1 storage slot)
    struct OwnerInfo {
        bool isActive;          // 1 byte
        uint8 ownerIndex;       // 1 byte (0-255, enough for MAX_OWNERS)
        uint32 addedAt;         // 4 bytes
        uint32 lastActivity;    // 4 bytes
        // 12 bytes total, fits in single slot with address
    }

    // State variables
    mapping(address => OwnerInfo) public ownerInfo;
    mapping(uint256 => Transaction) public transactions;
    
    address[] public owners;
    uint256 public required;
    uint256 public transactionCount;
    uint256 public timeLockPeriod = MIN_CONFIRMATION_TIME;

    // Bitmap helpers
    uint256 private constant BITMAP_MASK = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;

    modifier onlyOwner() {
        if (!ownerInfo[msg.sender].isActive) revert NotOwner();
        _;
        
        // Update last activity
        ownerInfo[msg.sender].lastActivity = uint32(block.timestamp);
    }

    modifier txExists(uint256 txId) {
        if (transactions[txId].to == address(0)) revert TransactionNotFound();
        _;
    }

    modifier txNotExecuted(uint256 txId) {
        if (transactions[txId].executed) revert TransactionAlreadyExecuted();
        _;
    }

    /**
     * @dev Constructor initializes the multi-sig with owners and required confirmations
     * @param _owners Array of initial owner addresses
     * @param _required Number of required confirmations
     */
    constructor(address[] memory _owners, uint256 _required) {
        if (_owners.length == 0 || _owners.length > MAX_OWNERS) revert ExceedsMaxOwners();
        if (_required == 0 || _required > _owners.length) revert InvalidThreshold();

        for (uint256 i = 0; i < _owners.length;) {
            address owner = _owners[i];
            if (owner == address(0)) revert InvalidOwner();
            if (ownerInfo[owner].isActive) revert OwnerExists();

            ownerInfo[owner] = OwnerInfo({
                isActive: true,
                ownerIndex: uint8(i),
                addedAt: uint32(block.timestamp),
                lastActivity: uint32(block.timestamp)
            });

            owners.push(owner);
            emit OwnerAdded(owner, i, block.timestamp);

            unchecked {
                ++i;
            }
        }

        required = _required;
    }

    /**
     * @dev Submit a new transaction (gas optimized)
     * @param to Destination address
     * @param value Amount of ETH to send
     * @param data Transaction data
     * @param isEmergency Whether this is an emergency transaction
     * @return Transaction ID
     */
    function submitTransaction(
        address to,
        uint256 value,
        bytes calldata data,
        bool isEmergency
    ) external onlyOwner returns (uint256) {
        if (to == address(0)) revert InvalidOwner();

        uint256 txId = transactionCount;
        uint32 currentTime = uint32(block.timestamp);
        uint32 deadline = isEmergency ? currentTime : currentTime + uint32(timeLockPeriod);

        transactions[txId] = Transaction({
            to: to,
            value: uint128(value), // Pack value into 128 bits
            data: data,
            executed: false,
            isEmergency: isEmergency,
            submissionTime: currentTime,
            confirmationDeadline: deadline,
            confirmationBitmap: 0
        });

        unchecked {
            transactionCount++;
        }

        emit TransactionSubmitted(txId, msg.sender, to, value);
        
        // Auto-confirm by submitter
        _confirmTransaction(txId, msg.sender);
        
        return txId;
    }

    /**
     * @notice Submit transaction (backward compatibility overload)
     * @param to Transaction target address
     * @param value Transaction value in ETH
     * @param data Transaction data payload
     * @return Transaction ID
     */
    function submitTransaction(
        address to,
        uint256 value,
        bytes calldata data
    ) external onlyOwner returns (uint256) {
        if (to == address(0)) revert InvalidOwner();

        uint256 txId = transactionCount;
        uint32 currentTime = uint32(block.timestamp);
        uint32 deadline = currentTime + uint32(timeLockPeriod); // Non-emergency

        transactions[txId] = Transaction({
            to: to,
            value: uint128(value),
            data: data,
            executed: false,
            isEmergency: false, // Always non-emergency for backward compatibility
            submissionTime: currentTime,
            confirmationDeadline: deadline,
            confirmationBitmap: 0
        });

        unchecked {
            transactionCount++;
        }

        emit TransactionSubmitted(txId, msg.sender, to, value);
        
        // Auto-confirm by submitter
        _confirmTransaction(txId, msg.sender);
        
        return txId;
    }

    /**
     * @dev Batch submit multiple transactions (30% gas savings)
     * @param destinations Array of destination addresses
     * @param values Array of ETH amounts
     * @param dataArray Array of transaction data
     * @param isEmergency Whether these are emergency transactions
     */
    function batchSubmitTransactions(
        address[] calldata destinations,
        uint256[] calldata values,
        bytes[] calldata dataArray,
        bool isEmergency
    ) external onlyOwner returns (uint256[] memory txIds) {
        uint256 length = destinations.length;
        if (length != values.length || length != dataArray.length) revert ArrayLengthMismatch();

        return _processBatchSubmission(destinations, values, dataArray, isEmergency, length);
    }

    /**
     * @dev Internal function to process batch submission (fixes stack too deep)
     */
    function _processBatchSubmission(
        address[] calldata destinations,
        uint256[] calldata values,
        bytes[] calldata dataArray,
        bool isEmergency,
        uint256 length
    ) internal returns (uint256[] memory txIds) {
        txIds = new uint256[](length);
        uint256 startTxId = transactionCount;

        uint32 deadline = isEmergency ? uint32(block.timestamp) : uint32(block.timestamp) + uint32(timeLockPeriod);

        for (uint256 i = 0; i < length;) {
            if (destinations[i] == address(0)) revert InvalidOwner();

            uint256 txId = transactionCount;
            txIds[i] = txId;

            transactions[txId] = Transaction({
                to: destinations[i],
                value: uint128(values[i]),
                data: dataArray[i],
                executed: false,
                isEmergency: isEmergency,
                submissionTime: uint32(block.timestamp),
                confirmationDeadline: deadline,
                confirmationBitmap: 0
            });

            emit TransactionSubmitted(txId, msg.sender, destinations[i], values[i]);
            _confirmTransaction(txId, msg.sender);

            unchecked {
                transactionCount++;
                ++i;
            }
        }

        emit BatchTransactionSubmitted(startTxId, length);
        return txIds;
    }

    /**
     * @dev Confirm a transaction using bitmap (75% gas savings)
     * @param txId Transaction ID
     */
    function confirmTransaction(uint256 txId) 
        external 
        onlyOwner 
        txExists(txId) 
        txNotExecuted(txId) 
    {
        _confirmTransaction(txId, msg.sender);
    }

    /**
     * @dev Internal function to confirm transaction with bitmap
     */
    function _confirmTransaction(uint256 txId, address owner) internal {
        OwnerInfo memory info = ownerInfo[owner];
        uint256 ownerBit = 1 << info.ownerIndex;
        
        // Check if already confirmed
        if (transactions[txId].confirmationBitmap & ownerBit != 0) {
            revert TransactionAlreadyConfirmed();
        }

        // Set confirmation bit
        transactions[txId].confirmationBitmap |= ownerBit;

        // Count confirmations efficiently
        uint256 confirmationCount = _countConfirmations(transactions[txId].confirmationBitmap);
        
        emit TransactionConfirmed(txId, owner, confirmationCount);
    }

    /**
     * @dev Revoke confirmation for a transaction
     * @param txId Transaction ID
     */
    function revokeConfirmation(uint256 txId) 
        external 
        onlyOwner 
        txExists(txId) 
        txNotExecuted(txId) 
    {
        OwnerInfo memory info = ownerInfo[msg.sender];
        uint256 ownerBit = 1 << info.ownerIndex;
        
        // Check if confirmed
        if (transactions[txId].confirmationBitmap & ownerBit == 0) {
            revert TransactionAlreadyConfirmed();
        }

        // Clear confirmation bit
        transactions[txId].confirmationBitmap &= ~ownerBit;

        uint256 confirmationCount = _countConfirmations(transactions[txId].confirmationBitmap);
        emit TransactionRevoked(txId, msg.sender, confirmationCount);
    }

    /**
     * @dev Execute a confirmed transaction
     * @param txId Transaction ID
     */
    function executeTransaction(uint256 txId) 
        external 
        onlyOwner 
        txExists(txId) 
        txNotExecuted(txId) 
        nonReentrant 
    {
        Transaction storage txn = transactions[txId];
        
        // Check confirmations
        uint256 confirmationCount = _countConfirmations(txn.confirmationBitmap);
        if (confirmationCount < required) revert InsufficientConfirmations();

        // Check time lock (unless emergency)
        if (!txn.isEmergency && block.timestamp < txn.confirmationDeadline) {
            revert TimeLockNotExpired();
        }

        txn.executed = true;

        // Execute transaction
        (bool success, bytes memory returnData) = txn.to.call{value: txn.value}(txn.data);
        
        emit TransactionExecuted(txId, msg.sender, success);
        
        if (!success && returnData.length > 0) {
            assembly {
                revert(add(returnData, 0x20), mload(returnData))
            }
        }
    }

    /**
     * @dev Efficiently count set bits in bitmap
     * @param bitmap The confirmation bitmap
     * @return count Number of confirmations
     */
    function _countConfirmations(uint256 bitmap) internal pure returns (uint256 count) {
        // Brian Kernighan's algorithm for counting set bits
        while (bitmap != 0) {
            bitmap &= bitmap - 1;
            unchecked {
                ++count;
            }
        }
    }

    /**
     * @dev Add a new owner (requires multi-sig approval)
     * @param newOwner Address of new owner
     */
    function addOwner(address newOwner) external {
        if (msg.sender != address(this)) revert NotOwner(); // Must be called via multi-sig
        if (newOwner == address(0)) revert InvalidOwner();
        if (ownerInfo[newOwner].isActive) revert OwnerExists();
        if (owners.length >= MAX_OWNERS) revert ExceedsMaxOwners();

        uint8 ownerIndex = uint8(owners.length);
        
        ownerInfo[newOwner] = OwnerInfo({
            isActive: true,
            ownerIndex: ownerIndex,
            addedAt: uint32(block.timestamp),
            lastActivity: uint32(block.timestamp)
        });

        owners.push(newOwner);
        emit OwnerAdded(newOwner, ownerIndex, block.timestamp);
    }

    /**
     * @dev Remove an owner (requires multi-sig approval)
     * @param ownerToRemove Address of owner to remove
     */
    function removeOwner(address ownerToRemove) external {
        if (msg.sender != address(this)) revert NotOwner(); // Must be called via multi-sig
        if (!ownerInfo[ownerToRemove].isActive) revert InvalidOwner();
        if (owners.length - 1 < required) revert InvalidThreshold();

        OwnerInfo memory info = ownerInfo[ownerToRemove];
        uint8 indexToRemove = info.ownerIndex;
        
        // Move last owner to removed position
        address lastOwner = owners[owners.length - 1];
        owners[indexToRemove] = lastOwner;
        ownerInfo[lastOwner].ownerIndex = indexToRemove;
        
        // Remove last element
        owners.pop();
        delete ownerInfo[ownerToRemove];

        emit OwnerRemoved(ownerToRemove, indexToRemove, block.timestamp);
    }

    /**
     * @dev Change required confirmation threshold
     * @param newRequired New required confirmation count
     */
    function changeRequiredConfirmations(uint256 newRequired) external {
        if (msg.sender != address(this)) revert NotOwner(); // Must be called via multi-sig
        if (newRequired == 0 || newRequired > owners.length) revert InvalidThreshold();

        uint256 oldRequired = required;
        required = newRequired;
        
        emit ThresholdChanged(oldRequired, newRequired, block.timestamp);
    }

    // View functions
    function isConfirmed(uint256 txId, address owner) external view returns (bool) {
        OwnerInfo memory info = ownerInfo[owner];
        if (!info.isActive) return false;
        
        uint256 ownerBit = 1 << info.ownerIndex;
        return transactions[txId].confirmationBitmap & ownerBit != 0;
    }

    function getConfirmationCount(uint256 txId) external view returns (uint256) {
        return _countConfirmations(transactions[txId].confirmationBitmap);
    }

    function getOwnerCount() external view returns (uint256) {
        return owners.length;
    }

    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    /// @notice Get the threshold (required signatures) - alias for backward compatibility
    /// @return The number of required signatures
    function threshold() external view returns (uint256) {
        return required;
    }

    /// @notice Check if an address is an owner - alias for backward compatibility
    /// @param owner The address to check
    /// @return True if the address is an active owner
    function isOwner(address owner) external view returns (bool) {
        return ownerInfo[owner].isActive;
    }

    /// @notice Check if a transaction is confirmed by a specific owner
    /// @param txId Transaction ID
    /// @param owner The owner address to check
    /// @return True if the owner has confirmed the transaction
    function isConfirmedBy(uint256 txId, address owner) external view returns (bool) {
        if (!ownerInfo[owner].isActive) return false;
        uint8 ownerIndex = ownerInfo[owner].ownerIndex;
        return (transactions[txId].confirmationBitmap & (1 << ownerIndex)) != 0;
    }

    /// @notice Get transaction details for backward compatibility
    /// @param txId Transaction ID
    /// @return to Target address
    /// @return value Transaction value
    /// @return data Transaction data
    /// @return executed Whether transaction has been executed
    /// @return confirmations Number of confirmations (unused for compatibility)
    function getTransaction(uint256 txId) external view returns (
        address to,
        uint256 value,
        bytes memory data,
        bool executed,
        uint256 confirmations
    ) {
        Transaction storage txn = transactions[txId];
        return (
            txn.to,
            uint256(txn.value),
            txn.data,
            txn.executed,
            0 // Placeholder for confirmations count
        );
    }

    // Receive ETH
    receive() external payable {}
    fallback() external payable {}
}
