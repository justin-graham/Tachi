// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ProofOfCrawlLedger - Append-Only Crawl Log for Tachi Protocol
/// @notice A lightweight on-chain log to record successful crawls for transparency and auditability
/// @dev Records crawl events after payment verification, providing immutable proof of authorized access
contract ProofOfCrawlLedger is Ownable {
    /// @notice Counter for total crawls logged
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
    
    /// @notice Event emitted when the contract is paused or unpaused
    /// @param paused Whether the contract is paused
    event ContractPaused(bool paused);
    
    /// @notice Whether the contract is paused
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
    
    /// @notice Log a crawl event (basic version)
    /// @param crawlTokenId The CrawlNFT token ID identifying the publisher's content
    /// @param crawler The address of the crawler who performed the crawl
    /// @dev Only the contract owner (protocol admin) can call this function
    /// @dev This function only emits an event - no persistent storage for gas efficiency
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
    
    /// @notice Log a crawl event with content hash
    /// @param crawlTokenId The CrawlNFT token ID identifying the publisher's content
    /// @param crawler The address of the crawler who performed the crawl
    /// @param contentHash The hash of the content that was crawled
    /// @dev Only the contract owner (protocol admin) can call this function
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
    
    /// @notice Log a crawl event with URL
    /// @param crawlTokenId The CrawlNFT token ID identifying the publisher's content
    /// @param crawler The address of the crawler who performed the crawl
    /// @param url The URL that was crawled
    /// @dev Only the contract owner (protocol admin) can call this function
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
    
    /// @notice Batch log multiple crawls (gas optimization)
    /// @param crawlTokenIds Array of CrawlNFT token IDs
    /// @param crawlers Array of crawler addresses
    /// @dev Arrays must be the same length
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
        
        for (uint256 i = 0; i < crawlTokenIds.length; i++) {
            require(crawlers[i] != address(0), "ProofOfCrawlLedger: Crawler address cannot be zero");
            require(crawlTokenIds[i] > 0, "ProofOfCrawlLedger: CrawlTokenId must be greater than zero");
            
            totalCrawlsLogged++;
            uint256 logId = totalCrawlsLogged;
            
            emit CrawlLogged(
                crawlTokenIds[i],
                crawlers[i],
                block.timestamp,
                logId
            );
        }
    }
    
    /// @notice Pause or unpause the contract
    /// @param _paused Whether to pause the contract
    /// @dev Only the contract owner can call this function
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit ContractPaused(_paused);
    }
    
    /// @notice Get the total number of crawls logged
    /// @return The total number of crawls logged
    function getTotalCrawlsLogged() external view returns (uint256) {
        return totalCrawlsLogged;
    }
    
    /// @notice Check if the contract is paused
    /// @return Whether the contract is paused
    function isPaused() external view returns (bool) {
        return paused;
    }
    
    /// @notice Get contract version
    /// @return The version of the contract
    function getVersion() external pure returns (string memory) {
        return "1.0.0";
    }
    
    /// @notice Emergency function to reset total crawls counter (admin only)
    /// @param newTotal The new total to set
    /// @dev This should only be used in case of migration or emergency
    function resetTotalCrawls(uint256 newTotal) external onlyOwner {
        totalCrawlsLogged = newTotal;
    }
}
