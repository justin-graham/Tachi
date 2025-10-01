// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @title ProofOfCrawlLedgerUpgradeable - Upgradeable Append-Only Crawl Log for Tachi Protocol
/// @notice A lightweight on-chain log to record successful crawls for transparency and auditability
/// @dev Records crawl events after payment verification, providing immutable proof of authorized access with UUPS upgradability
contract ProofOfCrawlLedgerUpgradeable is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    /// @notice Counter tracking the total number of crawls logged
    /// @dev Incremented with each successful crawl log entry
    uint256 public totalCrawlsLogged;

    /// @notice Version of the contract implementation
    string public constant VERSION = "1.0.0";

    /// @notice Mapping to track if a specific crawl has been logged (prevents duplicates)
    /// @dev Maps keccak256(crawlTokenId, crawler, timestamp) => bool
    mapping(bytes32 => bool) public crawlExists;

    /// @notice Event emitted when a crawl is successfully logged
    /// @param crawlTokenId The CrawlNFT token ID identifying the publisher's content
    /// @param crawler The address of the crawler who performed the crawl
    /// @param timestamp The timestamp when the crawl was logged
    /// @param logId The unique log ID for this crawl entry
    event CrawlLogged(uint256 indexed crawlTokenId, address indexed crawler, uint256 timestamp, uint256 indexed logId);

    /// @notice Event emitted when a crawl with additional metadata is logged
    /// @param crawlTokenId The CrawlNFT token ID identifying the publisher's content
    /// @param crawler The address of the crawler who performed the crawl
    /// @param contentHash The hash of the content that was crawled
    /// @param timestamp The timestamp when the crawl was logged
    /// @param logId The unique log ID for this crawl entry
    event CrawlLoggedWithContent(
        uint256 indexed crawlTokenId,
        address indexed crawler,
        bytes32 contentHash,
        uint256 timestamp,
        uint256 indexed logId
    );

    /// @notice Event emitted when a crawl with URL is logged
    /// @param crawlTokenId The CrawlNFT token ID identifying the publisher's content
    /// @param crawler The address of the crawler who performed the crawl
    /// @param url The URL that was crawled
    /// @param timestamp The timestamp when the crawl was logged
    /// @param logId The unique log ID for this crawl entry
    event CrawlLoggedWithURL(
        uint256 indexed crawlTokenId, address indexed crawler, string url, uint256 timestamp, uint256 indexed logId
    );

    /// @notice Event emitted when a batch of crawls is logged
    /// @param crawler The address of the crawler who performed the crawls
    /// @param batchSize The number of crawls in this batch
    /// @param batchId A unique identifier for this batch
    event BatchCrawlLogged(address indexed crawler, uint256 batchSize, bytes32 indexed batchId);

    /// @notice Event emitted when the contract is upgraded
    /// @param previousVersion The version before upgrade
    /// @param newVersion The version after upgrade
    /// @param implementation The address of the new implementation
    event ContractUpgraded(string previousVersion, string newVersion, address indexed implementation);

    /// @notice Custom errors for gas-efficient reverts
    error ZeroAddress();
    error InvalidTokenId();
    error InvalidTimestamp();
    error CrawlAlreadyExists();
    error UnauthorizedUpgrade();
    error EmptyBatch();
    error ArrayLengthMismatch();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initialize the contract (replaces constructor for upgradeable contracts)
    /// @param _owner The owner address for the contract
    function initialize(address _owner) public initializer {
        if (_owner == address(0)) revert ZeroAddress();

        __Ownable_init(_owner);
        __UUPSUpgradeable_init();

        totalCrawlsLogged = 0;

        emit ContractUpgraded("0.0.0", VERSION, address(this));
    }

    /// @notice Log a successful crawl event
    /// @param crawlTokenId The CrawlNFT token ID identifying the publisher's content
    /// @param crawler The address of the crawler who performed the crawl
    /// @dev Only callable by contract owner, timestamp is set to current block timestamp
    function logCrawl(uint256 crawlTokenId, address crawler) external onlyOwner {
        if (crawler == address(0)) revert ZeroAddress();
        if (crawlTokenId == 0) revert InvalidTokenId();

        uint256 timestamp = block.timestamp;
        bytes32 crawlHash = keccak256(abi.encodePacked(crawlTokenId, crawler, timestamp));

        if (crawlExists[crawlHash]) revert CrawlAlreadyExists();

        crawlExists[crawlHash] = true;
        uint256 logId = ++totalCrawlsLogged;

        emit CrawlLogged(crawlTokenId, crawler, timestamp, logId);
    }

    /// @notice Log a crawl with content hash for verification
    /// @param crawlTokenId The CrawlNFT token ID identifying the publisher's content
    /// @param crawler The address of the crawler who performed the crawl
    /// @param contentHash The hash of the content that was crawled
    /// @dev Only callable by contract owner, provides content integrity verification
    function logCrawlWithContent(uint256 crawlTokenId, address crawler, bytes32 contentHash) external onlyOwner {
        if (crawler == address(0)) revert ZeroAddress();
        if (crawlTokenId == 0) revert InvalidTokenId();

        uint256 timestamp = block.timestamp;
        bytes32 crawlHash = keccak256(abi.encodePacked(crawlTokenId, crawler, timestamp, contentHash));

        if (crawlExists[crawlHash]) revert CrawlAlreadyExists();

        crawlExists[crawlHash] = true;
        uint256 logId = ++totalCrawlsLogged;

        emit CrawlLoggedWithContent(crawlTokenId, crawler, contentHash, timestamp, logId);
    }

    /// @notice Log a crawl with the specific URL that was accessed
    /// @param crawlTokenId The CrawlNFT token ID identifying the publisher's content
    /// @param crawler The address of the crawler who performed the crawl
    /// @param url The URL that was crawled
    /// @dev Only callable by contract owner, provides full audit trail with URLs
    function logCrawlWithURL(uint256 crawlTokenId, address crawler, string calldata url) external onlyOwner {
        if (crawler == address(0)) revert ZeroAddress();
        if (crawlTokenId == 0) revert InvalidTokenId();
        if (bytes(url).length == 0) revert("Empty URL");

        uint256 timestamp = block.timestamp;
        bytes32 urlHash = keccak256(bytes(url));
        bytes32 crawlHash = keccak256(abi.encodePacked(crawlTokenId, crawler, timestamp, urlHash));

        if (crawlExists[crawlHash]) revert CrawlAlreadyExists();

        crawlExists[crawlHash] = true;
        uint256 logId = ++totalCrawlsLogged;

        emit CrawlLoggedWithURL(crawlTokenId, crawler, url, timestamp, logId);
    }

    /// @notice Log multiple crawls in a single transaction (gas optimization)
    /// @param crawlTokenIds Array of CrawlNFT token IDs
    /// @param crawlers Array of crawler addresses
    /// @dev Arrays must be same length, only callable by contract owner
    function logBatchCrawls(uint256[] calldata crawlTokenIds, address[] calldata crawlers) external onlyOwner {
        if (crawlTokenIds.length != crawlers.length) revert ArrayLengthMismatch();
        if (crawlTokenIds.length == 0) revert EmptyBatch();

        uint256 timestamp = block.timestamp;
        bytes32 batchId = keccak256(abi.encodePacked(block.timestamp, block.number, msg.sender));

        for (uint256 i = 0; i < crawlTokenIds.length; i++) {
            if (crawlers[i] == address(0)) revert ZeroAddress();
            if (crawlTokenIds[i] == 0) revert InvalidTokenId();

            bytes32 crawlHash = keccak256(abi.encodePacked(crawlTokenIds[i], crawlers[i], timestamp, i));

            if (!crawlExists[crawlHash]) {
                crawlExists[crawlHash] = true;
                uint256 logId = ++totalCrawlsLogged;

                emit CrawlLogged(crawlTokenIds[i], crawlers[i], timestamp, logId);
            }
        }

        emit BatchCrawlLogged(crawlers[0], crawlTokenIds.length, batchId);
    }

    /// @notice Check if a specific crawl has been logged
    /// @param crawlTokenId The CrawlNFT token ID
    /// @param crawler The crawler address
    /// @param timestamp The timestamp of the crawl
    /// @return exists True if the crawl has been logged
    function hasCrawlBeenLogged(uint256 crawlTokenId, address crawler, uint256 timestamp)
        external
        view
        returns (bool exists)
    {
        bytes32 crawlHash = keccak256(abi.encodePacked(crawlTokenId, crawler, timestamp));
        return crawlExists[crawlHash];
    }

    /// @notice Get the version of the contract
    /// @return The current version string
    function getVersion() external pure returns (string memory) {
        return VERSION;
    }

    /// @notice Get contract statistics
    /// @return totalCrawls The total number of crawls logged
    /// @return contractVersion The contract version
    /// @return contractOwner The contract owner
    function getContractStats()
        external
        view
        returns (uint256 totalCrawls, string memory contractVersion, address contractOwner)
    {
        return (totalCrawlsLogged, VERSION, owner());
    }

    /// @notice Authorize contract upgrades (required by UUPSUpgradeable)
    /// @param newImplementation The address of the new implementation contract
    /// @dev Only the contract owner can authorize upgrades
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        // Additional upgrade authorization logic can be added here
        if (newImplementation == address(0)) revert UnauthorizedUpgrade();

        // Emit upgrade event for transparency
        emit ContractUpgraded(VERSION, "UPGRADING", newImplementation);
    }

    /// @notice Get the implementation slot for transparency
    /// @return impl The current implementation address
    function getImplementation() external view returns (address impl) {
        // EIP-1967 implementation slot
        bytes32 slot = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
        assembly {
            impl := sload(slot)
        }
    }
}
