// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title PaymentProcessor - Handle USDC payments to publishers
/// @notice Simple payment processor for pay-per-crawl payments
/// @dev Transfers USDC from crawlers to publishers
contract PaymentProcessor is Ownable, ReentrancyGuard {
  /// @notice USDC token contract address
  IERC20 public immutable usdc;

  // Events
  event Payment(
    address indexed crawler,
    address indexed publisher,
    uint256 amount,
    uint256 timestamp
  );

  // Custom errors
  error ZeroAddress();
  error ZeroAmount();
  error TransferFailed();

  constructor(address _usdc) Ownable(msg.sender) {
    if (_usdc == address(0)) revert ZeroAddress();
    usdc = IERC20(_usdc);
  }

  /// @notice Pay a publisher directly
  /// @param publisher The publisher's wallet address
  /// @param amount The amount of USDC to pay (with 6 decimals)
  function payPublisher(address publisher, uint256 amount) external nonReentrant {
    if (publisher == address(0)) revert ZeroAddress();
    if (amount == 0) revert ZeroAmount();

    // Transfer USDC from crawler to publisher
    bool success = usdc.transferFrom(msg.sender, publisher, amount);
    if (!success) revert TransferFailed();

    emit Payment(msg.sender, publisher, amount, block.timestamp);
  }

  /// @notice Pay a publisher by their CrawlNFT token ID
  /// @param crawlNFT The CrawlNFT contract address
  /// @param tokenId The publisher's token ID
  /// @param amount The amount of USDC to pay
  function payPublisherByNFT(address crawlNFT, uint256 tokenId, uint256 amount)
    external
    nonReentrant
  {
    if (crawlNFT == address(0)) revert ZeroAddress();
    if (amount == 0) revert ZeroAmount();

    // Get publisher address from CrawlNFT
    (address publisher,,,) = ICrawlNFT(crawlNFT).licenses(tokenId);
    if (publisher == address(0)) revert ZeroAddress();

    // Transfer USDC from crawler to publisher
    bool success = usdc.transferFrom(msg.sender, publisher, amount);
    if (!success) revert TransferFailed();

    emit Payment(msg.sender, publisher, amount, block.timestamp);
  }

  /// @notice Get the USDC token address
  /// @return The USDC contract address
  function getUSDCAddress() external view returns (address) {
    return address(usdc);
  }
}

/// @notice Minimal CrawlNFT interface for publisher lookup
interface ICrawlNFT {
  function licenses(uint256 tokenId)
    external
    view
    returns (address publisher, bool isActive, uint32 mintedAt, uint32 updatedAt);
}
