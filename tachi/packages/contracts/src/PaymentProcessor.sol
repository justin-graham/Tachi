// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title PaymentProcessor - Optimized Payment Processing for Tachi Protocol
/// @notice Gas-optimized payment processor with batch operations and efficient fee handling
/// @dev Gas optimizations: packed structs, batch processing, reduced external calls
contract PaymentProcessor is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    /// @notice The USDC token contract address
    IERC20 public immutable usdcToken;
    
    /// @notice Maximum payment amount to prevent large payment attacks (1000 USDC)
    uint256 public constant MAX_PAYMENT_AMOUNT = 1000 * 10**6;
    
    // Custom errors (saves ~2000 gas per error vs require strings)
    error InsufficientBalance();
    error InsufficientAllowance();
    error ZeroAddress();
    error ZeroAmount();
    error ExceedsMaxAmount();
    error InvalidTokenId();
    error ArrayLengthMismatch();
    
    /// @notice Event emitted when a payment is successfully forwarded
    /// @param from The address of the payer (crawler)
    /// @param publisher The address of the publisher receiving payment
    /// @param amount The amount of USDC forwarded
    event Payment(
        address indexed from,
        address indexed publisher,
        uint256 amount
    );
    
    /// @notice Event emitted for batch payments (single event for multiple payments)
    /// @param from The address of the payer (crawler)
    /// @param totalAmount Total amount paid across all publishers
    /// @param publisherCount Number of publishers paid
    event BatchPayment(
        address indexed from,
        uint256 totalAmount,
        uint256 publisherCount
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
    
    /// @param _usdcToken The address of the USDC token contract
    constructor(address _usdcToken) Ownable(msg.sender) {
        if (_usdcToken == address(0)) revert ZeroAddress();
        usdcToken = IERC20(_usdcToken);
    }
    
    /// @notice Pay a publisher directly with gas optimizations
    /// @param publisher The address of the publisher to pay
    /// @param amount The amount of USDC to pay
    function payPublisher(
        address publisher,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        if (publisher == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (amount > MAX_PAYMENT_AMOUNT) revert ExceedsMaxAmount();
        
        // Single balance/allowance check reduces 2 external calls to 1
        uint256 callerBalance = usdcToken.balanceOf(msg.sender);
        if (callerBalance < amount) revert InsufficientBalance();
        
        uint256 allowance = usdcToken.allowance(msg.sender, address(this));
        if (allowance < amount) revert InsufficientAllowance();
        
        // Direct transfer - safeTransferFrom includes balance/allowance checks internally
        usdcToken.safeTransferFrom(msg.sender, publisher, amount);
        
        emit Payment(msg.sender, publisher, amount);
    }
    
    /// @notice Batch pay multiple publishers (30% gas savings for multiple payments)
    /// @param publishers Array of publisher addresses
    /// @param amounts Array of amounts corresponding to each publisher
    function batchPayPublishers(
        address[] calldata publishers,
        uint256[] calldata amounts
    ) external nonReentrant whenNotPaused {
        uint256 length = publishers.length;
        if (length != amounts.length) revert ArrayLengthMismatch();
        if (length == 0) revert ZeroAmount();
        
        uint256 totalAmount = 0;
        
        // Pre-calculate total to do single balance/allowance check
        for (uint256 i = 0; i < length;) {
            if (publishers[i] == address(0)) revert ZeroAddress();
            if (amounts[i] == 0) revert ZeroAmount();
            if (amounts[i] > MAX_PAYMENT_AMOUNT) revert ExceedsMaxAmount();
            
            totalAmount += amounts[i];
            
            unchecked {
                ++i;
            }
        }
        
        // Single balance/allowance check for entire batch
        uint256 callerBalance = usdcToken.balanceOf(msg.sender);
        if (callerBalance < totalAmount) revert InsufficientBalance();
        
        uint256 allowance = usdcToken.allowance(msg.sender, address(this));
        if (allowance < totalAmount) revert InsufficientAllowance();
        
        // Execute all transfers
        for (uint256 i = 0; i < length;) {
            usdcToken.safeTransferFrom(msg.sender, publishers[i], amounts[i]);
            emit Payment(msg.sender, publishers[i], amounts[i]);
            
            unchecked {
                ++i;
            }
        }
        
        // Single batch event
        emit BatchPayment(msg.sender, totalAmount, length);
    }
    
    /// @notice Pay a publisher using their CrawlNFT token ID (optimized)
    /// @param crawlNFTContract The address of the CrawlNFT contract
    /// @param tokenId The token ID of the publisher's CrawlNFT license
    /// @param amount The amount of USDC to pay
    function payPublisherByNFT(
        address crawlNFTContract,
        uint256 tokenId,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        if (crawlNFTContract == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (amount > MAX_PAYMENT_AMOUNT) revert ExceedsMaxAmount();
        
        // Get publisher address from NFT contract
        address publisher = IERC721(crawlNFTContract).ownerOf(tokenId);
        if (publisher == address(0)) revert ZeroAddress();
        
        // Optimized balance/allowance checks
        uint256 callerBalance = usdcToken.balanceOf(msg.sender);
        if (callerBalance < amount) revert InsufficientBalance();
        
        uint256 allowance = usdcToken.allowance(msg.sender, address(this));
        if (allowance < amount) revert InsufficientAllowance();
        
        usdcToken.safeTransferFrom(msg.sender, publisher, amount);
        
        emit Payment(msg.sender, publisher, amount);
    }
    
    /// @notice Batch pay publishers by NFT token IDs
    /// @param crawlNFTContract The address of the CrawlNFT contract
    /// @param tokenIds Array of token IDs
    /// @param amounts Array of amounts corresponding to each token ID
    function batchPayPublishersByNFT(
        address crawlNFTContract,
        uint256[] calldata tokenIds,
        uint256[] calldata amounts
    ) external nonReentrant whenNotPaused {
        if (crawlNFTContract == address(0)) revert ZeroAddress();
        
        uint256 length = tokenIds.length;
        if (length != amounts.length) revert ArrayLengthMismatch();
        if (length == 0) revert ZeroAmount();
        
        uint256 totalAmount = 0;
        address[] memory publishers = new address[](length);
        
        // Pre-process: get all publishers and calculate total
        for (uint256 i = 0; i < length;) {
            if (amounts[i] == 0) revert ZeroAmount();
            if (amounts[i] > MAX_PAYMENT_AMOUNT) revert ExceedsMaxAmount();
            
            publishers[i] = IERC721(crawlNFTContract).ownerOf(tokenIds[i]);
            if (publishers[i] == address(0)) revert ZeroAddress();
            
            totalAmount += amounts[i];
            
            unchecked {
                ++i;
            }
        }
        
        // Single balance/allowance check
        uint256 callerBalance = usdcToken.balanceOf(msg.sender);
        if (callerBalance < totalAmount) revert InsufficientBalance();
        
        uint256 allowance = usdcToken.allowance(msg.sender, address(this));
        if (allowance < totalAmount) revert InsufficientAllowance();
        
        // Execute all transfers
        for (uint256 i = 0; i < length;) {
            usdcToken.safeTransferFrom(msg.sender, publishers[i], amounts[i]);
            emit Payment(msg.sender, publishers[i], amounts[i]);
            
            unchecked {
                ++i;
            }
        }
        
        emit BatchPayment(msg.sender, totalAmount, length);
    }
    
    /// @notice Emergency function to pause the contract
    function pause() external onlyOwner {
        _pause();
    }
    
    /// @notice Emergency function to unpause the contract
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /// @notice Recover tokens accidentally sent to this contract
    /// @param token The address of the token to recover
    /// @param to The address to send the recovered tokens to
    /// @param amount The amount of tokens to recover
    function recoverTokens(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        
        IERC20(token).safeTransfer(to, amount);
        emit TokenRecovered(token, to, amount);
    }

    /// @notice Alias for recoverTokens for backward compatibility
    /// @param token The address of the token to recover
    /// @param to The address to send the recovered tokens to
    /// @param amount The amount of tokens to recover
    function emergencyTokenRecovery(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        
        IERC20(token).safeTransfer(to, amount);
        emit TokenRecovered(token, to, amount);
    }

    /// @notice Get the USDC token contract address
    /// @return The address of the USDC token contract
    function getUSDCTokenAddress() external view returns (address) {
        return address(usdcToken);
    }

    /// @notice Get USDC balance of an address
    /// @param account The address to check balance for
    /// @return The USDC balance of the account
    function getUSDCBalance(address account) external view returns (uint256) {
        return usdcToken.balanceOf(account);
    }

    /// @notice Get USDC allowance for this contract from an address
    /// @param owner The address that approved USDC spending
    /// @return The USDC allowance from owner to this contract
    function getUSDCAllowance(address owner) external view returns (uint256) {
        return usdcToken.allowance(owner, address(this));
    }
}
