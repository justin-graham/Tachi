// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title PaymentProcessorUpgradeable
 * @dev Upgradeable payment processing contract for Tachi Protocol
 * 
 * This contract handles USDC payments for crawl requests and manages
 * the relationship with publisher licenses (CrawlNFT).
 */
contract PaymentProcessorUpgradeable is 
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    // State variables
    IERC20 public usdcToken;
    IERC721 public crawlNFTContract;
    
    uint256 public baseCrawlFee; // Base fee in USDC (6 decimals)
    uint256 public protocolFeePercent; // Fee percentage (basis points, e.g., 250 = 2.5%)
    
    mapping(address => uint256) public publisherBalances;
    mapping(address => uint256) public totalCrawlsRequested;
    mapping(address => uint256) public totalFeesCollected;
    
    uint256 public totalProtocolFees;
    address public feeRecipient;

    // Events
    event CrawlRequested(
        address indexed requester,
        address indexed publisher,
        uint256 indexed tokenId,
        uint256 amount,
        uint256 protocolFee,
        string targetUrl
    );
    event FeesWithdrawn(address indexed publisher, uint256 amount);
    event ProtocolFeesWithdrawn(address indexed recipient, uint256 amount);
    event BaseCrawlFeeUpdated(uint256 newFee);
    event ProtocolFeePercentUpdated(uint256 newPercent);
    event FeeRecipientUpdated(address indexed newRecipient);

    // Errors
    error InvalidAmount();
    error InsufficientBalance();
    error InvalidTokenId();
    error NotLicenseOwner();
    error TransferFailed();
    error InvalidFeePercent();
    error ZeroAddress();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the contract
     * @param _usdcToken The USDC token contract address
     * @param _crawlNFTContract The CrawlNFT contract address
     */
    function initialize(
        address _usdcToken,
        address _crawlNFTContract
    ) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        if (_usdcToken == address(0) || _crawlNFTContract == address(0)) {
            revert ZeroAddress();
        }
        
        usdcToken = IERC20(_usdcToken);
        crawlNFTContract = IERC721(_crawlNFTContract);
        
        // Default values
        baseCrawlFee = 1_000_000; // 1 USDC (6 decimals)
        protocolFeePercent = 250; // 2.5%
        feeRecipient = msg.sender;
    }

    /**
     * @dev Request a crawl and pay fees
     * @param tokenId The publisher's license token ID
     * @param targetUrl The URL to crawl
     * @param amount The payment amount in USDC
     */
    function requestCrawl(
        uint256 tokenId,
        string memory targetUrl,
        uint256 amount
    ) external nonReentrant {
        if (amount < baseCrawlFee) {
            revert InvalidAmount();
        }
        
        // Verify the token exists and get the owner
        address publisher = crawlNFTContract.ownerOf(tokenId);
        if (publisher == address(0)) {
            revert InvalidTokenId();
        }
        
        // Calculate protocol fee
        uint256 protocolFee = (amount * protocolFeePercent) / 10000;
        uint256 publisherAmount = amount - protocolFee;
        
        // Transfer USDC from requester
        bool success = usdcToken.transferFrom(msg.sender, address(this), amount);
        if (!success) {
            revert TransferFailed();
        }
        
        // Update balances
        publisherBalances[publisher] += publisherAmount;
        totalProtocolFees += protocolFee;
        totalCrawlsRequested[publisher]++;
        totalFeesCollected[publisher] += publisherAmount;
        
        emit CrawlRequested(
            msg.sender,
            publisher,
            tokenId,
            publisherAmount,
            protocolFee,
            targetUrl
        );
    }

    /**
     * @dev Withdraw earned fees (publisher only)
     */
    function withdrawFees() external nonReentrant {
        uint256 balance = publisherBalances[msg.sender];
        if (balance == 0) {
            revert InsufficientBalance();
        }
        
        publisherBalances[msg.sender] = 0;
        
        bool success = usdcToken.transfer(msg.sender, balance);
        if (!success) {
            revert TransferFailed();
        }
        
        emit FeesWithdrawn(msg.sender, balance);
    }

    /**
     * @dev Withdraw protocol fees (owner only)
     */
    function withdrawProtocolFees() external onlyOwner nonReentrant {
        uint256 fees = totalProtocolFees;
        if (fees == 0) {
            revert InsufficientBalance();
        }
        
        totalProtocolFees = 0;
        
        bool success = usdcToken.transfer(feeRecipient, fees);
        if (!success) {
            revert TransferFailed();
        }
        
        emit ProtocolFeesWithdrawn(feeRecipient, fees);
    }

    /**
     * @dev Set the base crawl fee (owner only)
     * @param _newFee The new base fee in USDC
     */
    function setBaseCrawlFee(uint256 _newFee) external onlyOwner {
        baseCrawlFee = _newFee;
        emit BaseCrawlFeeUpdated(_newFee);
    }

    /**
     * @dev Set the protocol fee percentage (owner only)
     * @param _newPercent The new fee percentage in basis points
     */
    function setProtocolFeePercent(uint256 _newPercent) external onlyOwner {
        if (_newPercent > 1000) { // Maximum 10%
            revert InvalidFeePercent();
        }
        protocolFeePercent = _newPercent;
        emit ProtocolFeePercentUpdated(_newPercent);
    }

    /**
     * @dev Set the fee recipient (owner only)
     * @param _newRecipient The new fee recipient address
     */
    function setFeeRecipient(address _newRecipient) external onlyOwner {
        if (_newRecipient == address(0)) {
            revert ZeroAddress();
        }
        feeRecipient = _newRecipient;
        emit FeeRecipientUpdated(_newRecipient);
    }

    /**
     * @dev Get publisher statistics
     * @param publisher The publisher address
     * @return balance Current withdrawable balance
     * @return totalCrawls Total crawls requested
     * @return totalFees Total fees collected
     */
    function getPublisherStats(address publisher) 
        external 
        view 
        returns (uint256 balance, uint256 totalCrawls, uint256 totalFees) 
    {
        return (
            publisherBalances[publisher],
            totalCrawlsRequested[publisher],
            totalFeesCollected[publisher]
        );
    }

    /**
     * @dev Calculate fees for a given amount
     * @param amount The payment amount
     * @return protocolFee The protocol fee
     * @return publisherAmount The amount the publisher receives
     */
    function calculateFees(uint256 amount) 
        external 
        view 
        returns (uint256 protocolFee, uint256 publisherAmount) 
    {
        protocolFee = (amount * protocolFeePercent) / 10000;
        publisherAmount = amount - protocolFee;
    }

    /**
     * @dev Emergency withdrawal function (owner only)
     * @param token The token to withdraw
     * @param amount The amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }

    /**
     * @dev Authorize upgrade (only owner can upgrade)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
