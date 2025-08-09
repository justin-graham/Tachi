// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ProofOfCrawlLedger - Append-Only Crawl Log for Tachi Protocol
/// @notice A lightweight on-chain log to record successful crawls for transparency and auditability
/// @dev Records crawl events after payment verification, providing immutable proof of authorized access
contract ProofOfCrawlLedger is Ownable {
    /// @notice Counter tracking the total number of crawls logged
    /// @dev Incremented with each successful crawl log entry
    uint256 public totalCrawlsLogged;
    
    /// @notice Event emitted when a crawl is successfully logged
    /// @param crawlTokenId The CrawlNFT token ID identifying the publisher's content
    /// @param crawler The address of the crawler who performed the crawl
    /// @param timestamp The timestamp when the crawl was logged
    /// @param logId The unique log ID for this crawl entry
    event CrawlLogged(
        uint256 indexed crawlTokenId,
        address indexed crawler,
        uint256 timestamp,
        uint256 indexed logId
    );
    
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
        uint256 indexed crawlTokenId,
        address indexed crawler,
        string url,
        uint256 timestamp,
        uint256 indexed logId
    );
    
    /// @notice Event emitted when total crawls counter is reset by administrator
    /// @param oldTotal The previous total crawls count before reset
    /// @param newTotal The new total crawls count after reset (typically 0)
    /// @param admin The administrator address who performed the reset
    event TotalCrawlsReset(
        uint256 indexed oldTotal,
        uint256 indexed newTotal,
        address indexed admin
    );
    
    /// @notice Event emitted when the contract's paused state is changed
    /// @param paused The new paused state (true = paused, false = active)
    /// @param admin The administrator address who changed the pause state
    event PausedStateChanged(
        bool paused,
        address indexed admin
    );
    
    /// @notice Flag indicating whether the contract is currently paused
    /// @dev When paused, crawl logging functions cannot be executed
    bool public paused;
    
    /// @dev Constructor sets the initial owner
    constructor() Ownable(msg.sender) {
        totalCrawlsLogged = 0;
        paused = false;
    }
    
    /// @notice Modifier to prevent function execution when contract is paused
    modifier whenNotPaused() {
        require(!paused, "ProofOfCrawlLedger: Contract is paused");
        _;
    }
    
    /// @notice Log a crawl event to the blockchain
    /// @param crawlTokenId The CrawlNFT token ID identifying the publisher's content
    /// @param crawler The address of the crawler who performed the crawl
    /// @dev Only the contract owner (protocol admin) can call this function
    /// @dev Emits an event for off-chain indexing and verification
    function logCrawl(uint256 crawlTokenId, address crawler) 
        external 
        onlyOwner 
        whenNotPaused 
    {
        require(crawler != address(0), "ProofOfCrawlLedger: Crawler address cannot be zero");
        require(crawlTokenId > 0, "ProofOfCrawlLedger: CrawlTokenId must be greater than zero");
        
        totalCrawlsLogged++;
        uint256 logId = totalCrawlsLogged;
        
        emit CrawlLogged(
            crawlTokenId,
            crawler,
            block.timestamp,
            logId
        );
    }
    
    /// @notice Log a crawl event with detailed content hash information
    /// @param crawlTokenId The CrawlNFT token ID identifying the publisher's content
    /// @param crawler The address of the crawler who performed the crawl
    /// @param contentHash The cryptographic hash of the crawled content
    /// @dev Only the contract owner (protocol admin) can call this function
    /// @dev Provides additional content verification through hash storage
    function logCrawlWithContent(
        uint256 crawlTokenId,
        address crawler, 
        bytes32 contentHash
    ) 
        external 
        onlyOwner 
        whenNotPaused 
    {
        require(crawler != address(0), "ProofOfCrawlLedger: Crawler address cannot be zero");
        require(crawlTokenId > 0, "ProofOfCrawlLedger: CrawlTokenId must be greater than zero");
        require(contentHash != bytes32(0), "ProofOfCrawlLedger: Content hash cannot be zero");
        
        totalCrawlsLogged++;
        uint256 logId = totalCrawlsLogged;
        
        emit CrawlLoggedWithContent(
            crawlTokenId,
            crawler,
            contentHash,
            block.timestamp,
            logId
        );
    }
    
    /// @notice Log a crawl event with the specific URL that was accessed
    /// @param crawlTokenId The CrawlNFT token ID identifying the publisher's content
    /// @param crawler The address of the crawler who performed the crawl
    /// @param url The specific URL that was crawled and accessed
    /// @dev Only the contract owner (protocol admin) can call this function
    /// @dev Useful for tracking specific page or resource access
    function logCrawlWithURL(
        uint256 crawlTokenId,
        address crawler, 
        string calldata url
    ) 
        external 
        onlyOwner 
        whenNotPaused 
    {
        require(crawler != address(0), "ProofOfCrawlLedger: Crawler address cannot be zero");
        require(crawlTokenId > 0, "ProofOfCrawlLedger: CrawlTokenId must be greater than zero");
        require(bytes(url).length > 0, "ProofOfCrawlLedger: URL cannot be empty");
        
        totalCrawlsLogged++;
        uint256 logId = totalCrawlsLogged;
        
        emit CrawlLoggedWithURL(
            crawlTokenId,
            crawler,
            url,
            block.timestamp,
            logId
        );
    }
    
    /// @notice Log multiple crawl events in a single transaction for gas efficiency
    /// @param crawlTokenIds Array of CrawlNFT token IDs for the crawled content
    /// @param crawlers Array of crawler addresses who performed the crawls
    /// @dev All arrays must be the same length and non-empty
    /// @dev Gas-optimized batch operation for high-volume crawling
    function logCrawlBatch(
        uint256[] calldata crawlTokenIds,
        address[] calldata crawlers
    ) 
        external 
        onlyOwner 
        whenNotPaused 
    {
        require(crawlTokenIds.length == crawlers.length, "ProofOfCrawlLedger: Array lengths must match");
        require(crawlTokenIds.length > 0, "ProofOfCrawlLedger: Arrays cannot be empty");
        require(crawlTokenIds.length <= 100, "ProofOfCrawlLedger: Batch size too large");
        
        uint256 batchSize = crawlTokenIds.length;
        uint256 startingLogId = totalCrawlsLogged;
        
        for (uint256 i = 0; i < batchSize; i++) {
            require(crawlers[i] != address(0), "ProofOfCrawlLedger: Crawler address cannot be zero");
            require(crawlTokenIds[i] > 0, "ProofOfCrawlLedger: CrawlTokenId must be greater than zero");
            
            uint256 logId = startingLogId + i + 1;
            
            emit CrawlLogged(
                crawlTokenIds[i],
                crawlers[i],
                block.timestamp,
                logId
            );
        }
        
        // Update state once after all operations for gas efficiency
        totalCrawlsLogged += batchSize;
    }
    
    /// @notice Pause or unpause the contract's crawl logging functionality
    /// @param _paused Whether to pause the contract (true = pause, false = unpause)
    /// @dev Only the contract owner can call this function
    /// @dev Useful for emergency stops or maintenance periods
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PausedStateChanged(_paused, msg.sender);
    }
    
    /// @notice Get the total number of crawls logged since contract deployment
    /// @return The current total number of crawl events logged
    /// @dev This counter increases monotonically unless reset by admin
    function getTotalCrawlsLogged() external view returns (uint256) {
        return totalCrawlsLogged;
    }
    
    /// @notice Check if the contract is currently paused
    /// @return True if the contract is paused, false if active
    /// @dev When paused, crawl logging functions will revert
    function isPaused() external view returns (bool) {
        return paused;
    }
    
    /// @notice Get the current version of this contract
    /// @return A semantic version string for this contract implementation
    /// @dev Useful for front-end integration and upgrade tracking
    function getVersion() external pure returns (string memory) {
        return "1.0.0";
    }
    
    /// @notice Emergency function to reset the total crawls counter
    /// @param newTotal The new total count to set (typically 0 for full reset)
    /// @dev Only the contract owner can call this function
    /// @dev Should only be used for contract migration or emergency situations
    function resetTotalCrawls(uint256 newTotal) external onlyOwner {
        uint256 oldTotal = totalCrawlsLogged;
        totalCrawlsLogged = newTotal;
        
        emit TotalCrawlsReset(oldTotal, newTotal, msg.sender);
    }
}
