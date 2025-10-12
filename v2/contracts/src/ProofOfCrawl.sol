// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ProofOfCrawl - Log crawl and payment events on-chain
/// @notice Immutable audit trail of all crawls and payments
/// @dev Optimized for gas-efficient event logging
contract ProofOfCrawl is Ownable {
  /// @notice Total number of crawls logged
  uint256 public totalCrawls;

  /// @notice Total payments logged
  uint256 public totalPayments;

  // Events (the actual "storage" - events are cheaper than storage)
  event CrawlLogged(
    uint256 indexed crawlId,
    uint256 indexed tokenId,
    address indexed crawler,
    string url,
    uint256 timestamp
  );

  event PaymentLogged(
    uint256 indexed paymentId,
    address indexed crawler,
    address indexed publisher,
    uint256 amount,
    string txHash,
    uint256 timestamp
  );

  // Custom errors
  error ZeroAddress();
  error EmptyString();

  constructor() Ownable(msg.sender) {}

  /// @notice Log a crawl event
  /// @param tokenId The publisher's CrawlNFT token ID
  /// @param crawler The crawler's wallet address
  /// @param url The URL that was crawled
  function logCrawl(uint256 tokenId, address crawler, string calldata url) external onlyOwner {
    if (crawler == address(0)) revert ZeroAddress();
    if (bytes(url).length == 0) revert EmptyString();

    uint256 crawlId = totalCrawls;

    unchecked {
      totalCrawls++;
    }

    emit CrawlLogged(crawlId, tokenId, crawler, url, block.timestamp);
  }

  /// @notice Log a payment event
  /// @param crawler The crawler's wallet address
  /// @param publisher The publisher's wallet address
  /// @param amount The payment amount in USDC
  /// @param txHash The payment transaction hash
  function logPayment(
    address crawler,
    address publisher,
    uint256 amount,
    string calldata txHash
  ) external onlyOwner {
    if (crawler == address(0)) revert ZeroAddress();
    if (publisher == address(0)) revert ZeroAddress();
    if (bytes(txHash).length == 0) revert EmptyString();

    uint256 paymentId = totalPayments;

    unchecked {
      totalPayments++;
    }

    emit PaymentLogged(paymentId, crawler, publisher, amount, txHash, block.timestamp);
  }

  /// @notice Get total number of crawls
  /// @return The total crawl count
  function getTotalCrawls() external view returns (uint256) {
    return totalCrawls;
  }

  /// @notice Get total number of payments
  /// @return The total payment count
  function getTotalPayments() external view returns (uint256) {
    return totalPayments;
  }
}
