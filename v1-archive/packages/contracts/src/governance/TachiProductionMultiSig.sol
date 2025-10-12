// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title TachiProductionMultiSig
 * @dev Production-ready multi-signature wallet for Tachi Protocol governance
 *
 * Features:
 * - Hardware wallet compatibility
 * - Time-lock delays for critical operations
 * - Emergency pause functionality
 * - Gas-optimized execution
 * - Event logging for transparency
 * - Owner management with proper validations
 */
contract TachiProductionMultiSig is ReentrancyGuard, Pausable {
    using ECDSA for bytes32;

    // Constants
    uint256 public constant MAX_OWNERS = 10;
    uint256 public constant MIN_CONFIRMATION_TIME = 24 hours;
    uint256 public constant MAX_CONFIRMATION_TIME = 7 days;

    // Events
    event OwnerAdded(address indexed owner, uint256 timestamp);
    event OwnerRemoved(address indexed owner, uint256 timestamp);
    event ThresholdChanged(uint256 oldThreshold, uint256 newThreshold, uint256 timestamp);
    event TransactionSubmitted(
        uint256 indexed txId, address indexed submitter, address indexed to, uint256 value, bytes data
    );
    event TransactionConfirmed(uint256 indexed txId, address indexed owner, uint256 confirmationCount);
    event TransactionRevoked(uint256 indexed txId, address indexed owner, uint256 confirmationCount);
    event TransactionExecuted(uint256 indexed txId, address indexed executor, bool success, bytes returnData);
    event TimeLockChanged(uint256 oldTimeLock, uint256 newTimeLock);
    event EmergencyActionExecuted(uint256 indexed txId, address indexed executor, string reason);

    // Structs
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmations;
        uint256 submissionTime;
        uint256 confirmationDeadline;
        bool isEmergency;
        string description;
        mapping(address => bool) confirmedBy;
    }

    struct OwnerInfo {
        bool isActive;
        uint256 addedAt;
        uint256 lastActivity;
        string hardwareWalletType; // "ledger", "trezor", etc.
        string role; // "ceo", "cto", "security", "operations", "advisor"
    }

    // State variables
    mapping(address => OwnerInfo) public ownerInfo;
    address[] public owners;
    uint256 public threshold;
    uint256 public transactionCount;
    uint256 public timeLockDuration;
    mapping(uint256 => Transaction) public transactions;

    // Security features
    uint256 public dailyTransactionLimit;
    uint256 public dailyTransactionCount;
    uint256 public lastResetDay;

    // Emergency features
    mapping(address => bool) public emergencyResponders;
    bool public emergencyMode;
    uint256 public emergencyModeActivatedAt;

    // Modifiers
    modifier onlyOwner() {
        require(ownerInfo[msg.sender].isActive, "Not an active owner");
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

    modifier withinTimeLock(uint256 _txId) {
        Transaction storage txn = transactions[_txId];
        require(
            block.timestamp >= txn.submissionTime + timeLockDuration || txn.isEmergency,
            "Transaction still in time-lock period"
        );
        require(block.timestamp <= txn.confirmationDeadline, "Transaction confirmation period expired");
        _;
    }

    /**
     * @dev Constructor sets initial owners, threshold, and time-lock
     * @param _owners List of initial owners (hardware wallet addresses)
     * @param _threshold Number of confirmations required
     * @param _timeLockDuration Time delay before execution (seconds)
     */
    constructor(
        address[] memory _owners,
        string[] memory _roles,
        string[] memory _hardwareWalletTypes,
        uint256 _threshold,
        uint256 _timeLockDuration
    ) {
        require(_owners.length > 0 && _owners.length <= MAX_OWNERS, "Invalid owners count");
        require(_threshold > 0 && _threshold <= _owners.length, "Invalid threshold");
        require(_roles.length == _owners.length, "Roles array length mismatch");
        require(_hardwareWalletTypes.length == _owners.length, "Hardware wallet types array length mismatch");
        require(
            _timeLockDuration >= MIN_CONFIRMATION_TIME && _timeLockDuration <= MAX_CONFIRMATION_TIME,
            "Invalid time-lock duration"
        );

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner address");
            require(!ownerInfo[owner].isActive, "Duplicate owner");

            ownerInfo[owner] = OwnerInfo({
                isActive: true,
                addedAt: block.timestamp,
                lastActivity: block.timestamp,
                hardwareWalletType: _hardwareWalletTypes[i],
                role: _roles[i]
            });

            owners.push(owner);
            emit OwnerAdded(owner, block.timestamp);
        }

        threshold = _threshold;
        timeLockDuration = _timeLockDuration;
        dailyTransactionLimit = 10; // Conservative limit
        lastResetDay = block.timestamp / 1 days;

        emit ThresholdChanged(0, _threshold, block.timestamp);
        emit TimeLockChanged(0, _timeLockDuration);
    }

    /**
     * @dev Submit a transaction for execution with time-lock
     * @param _to Target contract address
     * @param _value ETH value to send
     * @param _data Transaction data
     * @param _description Human-readable description
     * @param _isEmergency Whether this is an emergency transaction (bypasses time-lock)
     * @return txId Transaction ID
     */
    function submitTransaction(
        address _to,
        uint256 _value,
        bytes memory _data,
        string memory _description,
        bool _isEmergency
    ) public onlyOwner whenNotPaused nonReentrant returns (uint256 txId) {
        // Check daily limit
        _checkDailyLimit();

        // Create transaction
        txId = transactionCount;
        Transaction storage txn = transactions[txId];
        txn.to = _to;
        txn.value = _value;
        txn.data = _data;
        txn.executed = false;
        txn.confirmations = 0;
        txn.submissionTime = block.timestamp;
        txn.confirmationDeadline = block.timestamp + MAX_CONFIRMATION_TIME;
        txn.isEmergency = _isEmergency;
        txn.description = _description;

        transactionCount++;

        // Update owner activity
        ownerInfo[msg.sender].lastActivity = block.timestamp;

        emit TransactionSubmitted(txId, msg.sender, _to, _value, _data);

        // Emergency transactions require special handling
        if (_isEmergency) {
            require(emergencyResponders[msg.sender], "Not authorized for emergency transactions");
            emit EmergencyActionExecuted(txId, msg.sender, _description);
        }

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
        whenNotPaused
        nonReentrant
    {
        Transaction storage txn = transactions[_txId];
        txn.confirmedBy[msg.sender] = true;
        txn.confirmations++;

        // Update owner activity
        ownerInfo[msg.sender].lastActivity = block.timestamp;

        emit TransactionConfirmed(_txId, msg.sender, txn.confirmations);

        // Auto-execute if threshold is met and time-lock has passed
        if (
            txn.confirmations >= threshold
                && (block.timestamp >= txn.submissionTime + timeLockDuration || txn.isEmergency)
                && block.timestamp <= txn.confirmationDeadline
        ) {
            _executeTransaction(_txId);
        }
    }

    /**
     * @dev Revoke confirmation for a transaction
     * @param _txId Transaction ID
     */
    function revokeConfirmation(uint256 _txId) public onlyOwner validTransaction(_txId) whenNotPaused nonReentrant {
        Transaction storage txn = transactions[_txId];
        require(txn.confirmedBy[msg.sender], "Transaction not confirmed by sender");

        txn.confirmedBy[msg.sender] = false;
        txn.confirmations--;

        // Update owner activity
        ownerInfo[msg.sender].lastActivity = block.timestamp;

        emit TransactionRevoked(_txId, msg.sender, txn.confirmations);
    }

    /**
     * @dev Execute a confirmed transaction
     * @param _txId Transaction ID
     */
    function executeTransaction(uint256 _txId)
        public
        onlyOwner
        validTransaction(_txId)
        withinTimeLock(_txId)
        whenNotPaused
        nonReentrant
    {
        Transaction storage txn = transactions[_txId];
        require(txn.confirmations >= threshold, "Insufficient confirmations");

        _executeTransaction(_txId);
    }

    /**
     * @dev Internal function to execute transaction
     * @param _txId Transaction ID
     */
    function _executeTransaction(uint256 _txId) internal {
        Transaction storage txn = transactions[_txId];
        txn.executed = true;

        // Update daily transaction count
        dailyTransactionCount++;

        // Execute the transaction
        (bool success, bytes memory returnData) = txn.to.call{ value: txn.value }(txn.data);

        emit TransactionExecuted(_txId, msg.sender, success, returnData);
    }

    /**
     * @dev Check and reset daily transaction limit
     */
    function _checkDailyLimit() internal {
        uint256 currentDay = block.timestamp / 1 days;

        if (currentDay > lastResetDay) {
            dailyTransactionCount = 0;
            lastResetDay = currentDay;
        }

        require(dailyTransactionCount < dailyTransactionLimit, "Daily transaction limit exceeded");
    }

    /**
     * @dev Add new owner (can only be called by multisig)
     * @param _owner New owner address
     * @param _role Owner role
     * @param _hardwareWalletType Hardware wallet type
     */
    function addOwner(address _owner, string memory _role, string memory _hardwareWalletType) public onlyMultiSig {
        require(_owner != address(0), "Invalid owner address");
        require(!ownerInfo[_owner].isActive, "Owner already exists");
        require(owners.length < MAX_OWNERS, "Maximum owners reached");

        ownerInfo[_owner] = OwnerInfo({
            isActive: true,
            addedAt: block.timestamp,
            lastActivity: block.timestamp,
            hardwareWalletType: _hardwareWalletType,
            role: _role
        });

        owners.push(_owner);
        emit OwnerAdded(_owner, block.timestamp);
    }

    /**
     * @dev Remove owner (can only be called by multisig)
     * @param _owner Owner to remove
     */
    function removeOwner(address _owner) public onlyMultiSig {
        require(ownerInfo[_owner].isActive, "Owner does not exist");
        require(owners.length > threshold, "Cannot remove owner below threshold");

        ownerInfo[_owner].isActive = false;

        // Remove from owners array
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == _owner) {
                owners[i] = owners[owners.length - 1];
                owners.pop();
                break;
            }
        }

        emit OwnerRemoved(_owner, block.timestamp);
    }

    /**
     * @dev Change threshold (can only be called by multisig)
     * @param _threshold New threshold
     */
    function changeThreshold(uint256 _threshold) public onlyMultiSig {
        require(_threshold > 0 && _threshold <= owners.length, "Invalid threshold");
        uint256 oldThreshold = threshold;
        threshold = _threshold;
        emit ThresholdChanged(oldThreshold, _threshold, block.timestamp);
    }

    /**
     * @dev Set emergency responder status
     * @param _responder Address to set as emergency responder
     * @param _status Whether they can initiate emergency transactions
     */
    function setEmergencyResponder(address _responder, bool _status) public onlyMultiSig {
        emergencyResponders[_responder] = _status;
    }

    /**
     * @dev Activate emergency mode (pauses regular operations)
     * @param _reason Reason for emergency activation
     */
    function activateEmergencyMode(string memory _reason) public {
        require(emergencyResponders[msg.sender], "Not authorized for emergency mode");
        emergencyMode = true;
        emergencyModeActivatedAt = block.timestamp;
        _pause();

        // Emit event with reason
        emit EmergencyActionExecuted(transactionCount, msg.sender, _reason);
    }

    /**
     * @dev Deactivate emergency mode (can only be called by multisig)
     */
    function deactivateEmergencyMode() public onlyMultiSig {
        emergencyMode = false;
        emergencyModeActivatedAt = 0;
        _unpause();
    }

    /**
     * @dev Get transaction details
     * @param _txId Transaction ID
     */
    function getTransaction(uint256 _txId)
        public
        view
        returns (
            address to,
            uint256 value,
            bytes memory data,
            bool executed,
            uint256 confirmations,
            uint256 submissionTime,
            uint256 confirmationDeadline,
            bool isEmergency,
            string memory description
        )
    {
        Transaction storage txn = transactions[_txId];
        return (
            txn.to,
            txn.value,
            txn.data,
            txn.executed,
            txn.confirmations,
            txn.submissionTime,
            txn.confirmationDeadline,
            txn.isEmergency,
            txn.description
        );
    }

    /**
     * @dev Check if transaction is confirmed by owner
     * @param _txId Transaction ID
     * @param _owner Owner address
     */
    function isConfirmed(uint256 _txId, address _owner) public view returns (bool) {
        return transactions[_txId].confirmedBy[_owner];
    }

    /**
     * @dev Get list of all owners
     */
    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    /**
     * @dev Get owner information
     * @param _owner Owner address
     */
    function getOwnerInfo(address _owner)
        public
        view
        returns (
            bool isActive,
            uint256 addedAt,
            uint256 lastActivity,
            string memory hardwareWalletType,
            string memory role
        )
    {
        OwnerInfo memory info = ownerInfo[_owner];
        return (info.isActive, info.addedAt, info.lastActivity, info.hardwareWalletType, info.role);
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable { }
}
