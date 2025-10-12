// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title TachiCore - Core contract for the Tachi pay-per-crawl protocol
/// @notice This contract manages the core functionality of the Tachi protocol
contract TachiCore is Ownable, ReentrancyGuard {
    uint256 public constant VERSION = 1;

    event CrawlRequested(address indexed user, string url, uint256 payment);
    event CrawlCompleted(address indexed user, string url, bytes32 resultHash);

    mapping(address => uint256) public userBalances;
    mapping(bytes32 => bool) public completedCrawls;

    constructor() Ownable(msg.sender) { }

    /// @notice Allow contract to receive Ether
    receive() external payable { }

    /// @notice Deposit funds for crawling
    function deposit() external payable {
        require(msg.value > 0, "Must deposit positive amount");
        userBalances[msg.sender] += msg.value;
    }

    /// @notice Request a crawl operation
    /// @param url The URL to crawl
    /// @param payment The payment amount for the crawl
    function requestCrawl(string calldata url, uint256 payment) external nonReentrant {
        require(payment > 0, "Payment must be positive");
        require(userBalances[msg.sender] >= payment, "Insufficient balance");

        userBalances[msg.sender] -= payment;
        emit CrawlRequested(msg.sender, url, payment);
    }

    /// @notice Complete a crawl operation (called by authorized crawler)
    /// @param user The user who requested the crawl
    /// @param url The URL that was crawled
    /// @param resultHash Hash of the crawl result
    function completeCrawl(address user, string calldata url, bytes32 resultHash) external onlyOwner {
        bytes32 crawlId = keccak256(abi.encodePacked(user, url, block.timestamp));
        require(!completedCrawls[crawlId], "Crawl already completed");

        completedCrawls[crawlId] = true;
        emit CrawlCompleted(user, url, resultHash);
    }

    /// @notice Withdraw funds from contract (owner only)
    function withdraw(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient contract balance");
        (bool success,) = payable(owner()).call{ value: amount }("");
        require(success, "Transfer failed");
    }

    /// @notice Get user's balance
    function getBalance(address user) external view returns (uint256) {
        return userBalances[user];
    }
}
