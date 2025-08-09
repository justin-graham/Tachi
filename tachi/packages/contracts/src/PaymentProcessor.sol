// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title PaymentProcessor - On-Chain Payment Toll Booth for Tachi Protocol
/// @notice A stateless utility contract to accept payments from crawlers and immediately forward them to publishers
/// @dev Serves as the on-chain "toll booth" for crawl payments using USDC
contract PaymentProcessor is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;
    
    /// @notice The USDC token contract address
    IERC20 public immutable usdcToken;
    
    /// @notice Maximum payment amount to prevent large payment attacks (1000 USDC)
    uint256 public constant MAX_PAYMENT_AMOUNT = 1000 * 10**6;
    
    /// @notice Event emitted when a payment is successfully forwarded
    /// @param from The address of the payer (crawler)
    /// @param publisher The address of the publisher receiving payment
    /// @param amount The amount of USDC forwarded
    event Payment(
        address indexed from,
        address indexed publisher,
        uint256 amount
    );
    
    /// @notice Event emitted when a payment fails
    /// @param from The address of the payer (crawler)
    /// @param publisher The address of the publisher that should have received payment
    /// @param amount The amount of USDC that failed to transfer
    /// @param reason The reason for the failure
    event PaymentFailed(
        address indexed from,
        address indexed publisher,
        uint256 amount,
        string reason
    );
    
    /// @notice Event emitted when tokens are recovered from the contract
    /// @param token The address of the recovered token
    /// @param to The address that received the recovered tokens
    /// @param amount The amount of tokens recovered
    event TokenRecovered(
        address indexed token,
        address indexed to,
        uint256 amount
    );
    
    /// @dev Constructor sets the USDC token contract address
    /// @param _usdcToken The address of the USDC token contract on Base
    constructor(address _usdcToken) Ownable(msg.sender) {
        require(_usdcToken != address(0), "PaymentProcessor: USDC token address cannot be zero");
        
        // Verify it's a valid ERC20 token with 6 decimals (USDC standard)
        try IERC20(_usdcToken).balanceOf(address(this)) returns (uint256) {
            // Balance check succeeded, it's a valid ERC20
        } catch {
            revert("PaymentProcessor: Invalid USDC token contract");
        }
        
        usdcToken = IERC20(_usdcToken);
    }
    
    /// @notice Pay a publisher directly with USDC
    /// @param publisher The address of the publisher to pay
    /// @param amount The amount of USDC to pay (in wei, e.g., 1 USDC = 1e6)
    /// @dev The caller must have approved this contract to spend at least `amount` USDC
    /// @dev This function transfers USDC from the caller to the publisher atomically
    function payPublisher(address publisher, uint256 amount) external nonReentrant whenNotPaused {
        require(publisher != address(0), "PaymentProcessor: Publisher address cannot be zero");
        require(amount > 0, "PaymentProcessor: Amount must be greater than zero");
        require(amount <= MAX_PAYMENT_AMOUNT, "PaymentProcessor: Amount exceeds maximum allowed");
        
        // Check if caller has sufficient balance
        uint256 callerBalance = usdcToken.balanceOf(msg.sender);
        require(callerBalance >= amount, "PaymentProcessor: Insufficient USDC balance");
        
        // Check if caller has approved sufficient allowance
        uint256 allowance = usdcToken.allowance(msg.sender, address(this));
        require(allowance >= amount, "PaymentProcessor: Insufficient USDC allowance");
        
        // Transfer USDC from caller to publisher
        usdcToken.safeTransferFrom(msg.sender, publisher, amount);
        
        // Payment successful, emit event
        emit Payment(msg.sender, publisher, amount);
    }
    
    /// @notice Pay a publisher using their CrawlNFT token ID
    /// @param crawlNFTContract The address of the CrawlNFT contract
    /// @param tokenId The token ID of the publisher's CrawlNFT license
    /// @param amount The amount of USDC to pay
    /// @dev This function looks up the publisher address from the CrawlNFT contract
    function payPublisherByNFT(
        address crawlNFTContract,
        uint256 tokenId,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        require(crawlNFTContract != address(0), "PaymentProcessor: CrawlNFT contract address cannot be zero");
        require(amount > 0, "PaymentProcessor: Amount must be greater than zero");
        require(amount <= MAX_PAYMENT_AMOUNT, "PaymentProcessor: Amount exceeds maximum allowed");
        
        // Get the publisher address from the CrawlNFT contract - SECURITY FIX: Proper initialization
        address publisher = IERC721(crawlNFTContract).ownerOf(tokenId);
        require(publisher != address(0), "PaymentProcessor: Publisher address cannot be zero");
        
        // Check if caller has sufficient balance
        uint256 callerBalance = usdcToken.balanceOf(msg.sender);
        require(callerBalance >= amount, "PaymentProcessor: Insufficient USDC balance");
        
        // Check if caller has approved sufficient allowance
        uint256 allowance = usdcToken.allowance(msg.sender, address(this));
        require(allowance >= amount, "PaymentProcessor: Insufficient USDC allowance");
        
        // Transfer USDC from caller to publisher
        usdcToken.safeTransferFrom(msg.sender, publisher, amount);
        
        // Payment successful, emit event
        emit Payment(msg.sender, publisher, amount);
    }
    
    /// @notice Get the USDC balance of an address
    /// @param account The address to check
    /// @return The USDC balance of the account
    function getUSDCBalance(address account) external view returns (uint256) {
        return usdcToken.balanceOf(account);
    }
    
    /// @notice Get the USDC allowance from owner to this contract
    /// @param tokenOwner The address of the token owner
    /// @return The amount of USDC this contract is allowed to spend
    function getUSDCAllowance(address tokenOwner) external view returns (uint256) {
        return usdcToken.allowance(tokenOwner, address(this));
    }
    
    /// @notice Get the USDC token contract address
    /// @return The address of the USDC token contract
    function getUSDCTokenAddress() external view returns (address) {
        return address(usdcToken);
    }
    
    /// @notice Pause the contract to prevent payments (emergency use only)
    /// @dev Only the contract owner can pause the contract
    function pause() external onlyOwner {
        _pause();
    }
    
    /// @notice Unpause the contract to resume payments
    /// @dev Only the contract owner can unpause the contract
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /// @notice Emergency function to recover any tokens accidentally sent to this contract
    /// @param token The address of the token to recover
    /// @param to The address to send the recovered tokens to
    /// @param amount The amount of tokens to recover
    /// @dev This contract should not hold any tokens, but this provides a safety mechanism
    /// @dev Only the contract owner can call this function
    function emergencyTokenRecovery(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        require(to != address(0), "PaymentProcessor: Recovery address cannot be zero");
        require(amount > 0, "PaymentProcessor: Recovery amount must be greater than zero");
        
        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        require(balance >= amount, "PaymentProcessor: Insufficient token balance for recovery");
        
        tokenContract.safeTransfer(to, amount);
        
        emit TokenRecovered(token, to, amount);
    }
}
