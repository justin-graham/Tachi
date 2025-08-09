// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title CrawlNFT - Soulbound License Token for Tachi Protocol
/// @notice A non-fungible token representing a content license for publishers
/// @dev Publishers can mint their own licenses (self-minting enabled)
contract CrawlNFT is ERC721, Ownable {
    /// @notice Counter for token IDs
    uint256 private _tokenIdCounter;
    
    /// @notice Mapping from token ID to terms URI
    mapping(uint256 => string) private _tokenTermsURI;
    
    /// @notice Mapping from publisher address to their token ID
    mapping(address => uint256) private _publisherTokenId;
    
    /// @notice Mapping to track if a publisher already has a license
    mapping(address => bool) private _hasLicense;
    
    /// @notice Whether self-minting is enabled (can be disabled by owner)
    bool public selfMintingEnabled = true;
    
    /// @notice Event emitted when a new license is minted
    event LicenseMinted(
        address indexed publisher,
        uint256 indexed tokenId,
        string termsURI
    );
    
    /// @notice Event emitted when terms URI is updated
    event TermsURIUpdated(
        uint256 indexed tokenId,
        string oldTermsURI,
        string newTermsURI
    );
    
    /// @notice Event emitted when self-minting is toggled
    event SelfMintingToggled(bool enabled);
    
    /// @dev Constructor sets the name and symbol for the NFT collection
    constructor() ERC721("Tachi Content License", "CRAWL") Ownable(msg.sender) {
        _tokenIdCounter = 1; // Start token IDs at 1
    }
    
    /// @notice Mint a new license NFT to a publisher (self-minting enabled)
    /// @param publisher The address of the publisher receiving the license
    /// @param termsURI The URI pointing to the license terms (IPFS hash or URI)
    /// @dev Publishers can mint for themselves, or owner can mint for any publisher
    function mintLicense(address publisher, string calldata termsURI) 
        external 
    {
        require(publisher != address(0), "CrawlNFT: Cannot mint to zero address");
        require(bytes(termsURI).length > 0, "CrawlNFT: Terms URI cannot be empty");
        require(!_hasLicense[publisher], "CrawlNFT: Publisher already has a license");
        
        // Check permissions: either self-minting for own address, or owner can mint for anyone
        require(
            (selfMintingEnabled && msg.sender == publisher) || msg.sender == owner(),
            "CrawlNFT: Not authorized to mint for this address"
        );
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // EFFECTS: Update all state before external interactions
        _tokenTermsURI[tokenId] = termsURI;
        _publisherTokenId[publisher] = tokenId;
        _hasLicense[publisher] = true;
        
        // INTERACTIONS: External calls last to prevent reentrancy
        _safeMint(publisher, tokenId);
        
        emit LicenseMinted(publisher, tokenId, termsURI);
    }
    
    /// @notice Mint a license for the caller (convenience function)
    /// @param termsURI The URI pointing to the license terms
    /// @dev Uses CEI (Checks-Effects-Interactions) pattern to prevent reentrancy
    function mintMyLicense(string calldata termsURI) external {
        require(selfMintingEnabled, "CrawlNFT: Self-minting is disabled");
        require(!_hasLicense[msg.sender], "CrawlNFT: You already have a license");
        require(bytes(termsURI).length > 0, "CrawlNFT: Terms URI cannot be empty");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // EFFECTS: Update all state before external interactions
        _tokenTermsURI[tokenId] = termsURI;
        _publisherTokenId[msg.sender] = tokenId;
        _hasLicense[msg.sender] = true;
        
        // INTERACTIONS: External calls last to prevent reentrancy
        _safeMint(msg.sender, tokenId);
        
        emit LicenseMinted(msg.sender, tokenId, termsURI);
    }
    
    /// @notice Toggle self-minting capability (owner only)
    /// @param enabled Whether to enable self-minting
    function setSelfMintingEnabled(bool enabled) external onlyOwner {
        selfMintingEnabled = enabled;
        emit SelfMintingToggled(enabled);
    }
    
    /// @notice Get the terms URI for a specific token ID
    /// @param tokenId The token ID to query
    /// @return The terms URI associated with the token
    function getTermsURI(uint256 tokenId) external view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "CrawlNFT: Token does not exist");
        return _tokenTermsURI[tokenId];
    }
    
    /// @notice Get the token ID for a publisher
    /// @param publisher The publisher's address
    /// @return The token ID owned by the publisher (0 if none)
    function getPublisherTokenId(address publisher) external view returns (uint256) {
        return _publisherTokenId[publisher];
    }
    
    /// @notice Check if a publisher has a license
    /// @param publisher The publisher's address
    /// @return True if the publisher has a license, false otherwise
    function hasLicense(address publisher) external view returns (bool) {
        return _hasLicense[publisher];
    }
    
    /// @notice Get the total number of licenses minted
    /// @return The total supply of tokens
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }
    
    /// @notice Update the terms URI for a token (token owner or contract owner only)
    /// @param tokenId The token ID to update
    /// @param newTermsURI The new terms URI
    function updateTermsURI(uint256 tokenId, string calldata newTermsURI) 
        external 
    {
        require(_ownerOf(tokenId) != address(0), "CrawlNFT: Token does not exist");
        require(bytes(newTermsURI).length > 0, "CrawlNFT: Terms URI cannot be empty");
        
        // Only token owner or contract owner can update
        require(
            msg.sender == ownerOf(tokenId) || msg.sender == owner(),
            "CrawlNFT: Not authorized to update this token"
        );
        
        string memory oldTermsURI = _tokenTermsURI[tokenId];
        _tokenTermsURI[tokenId] = newTermsURI;
        
        emit TermsURIUpdated(tokenId, oldTermsURI, newTermsURI);
    }
    
    /// @notice Prevent transfers to make tokens soulbound
    /// @dev Override transfer functions to make NFTs non-transferable
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) but prevent transfers (from != address(0))
        require(from == address(0), "CrawlNFT: Soulbound token - transfers not allowed");
        
        return super._update(to, tokenId, auth);
    }
    
    /// @notice Override approve to prevent approvals (soulbound)
    function approve(address, uint256) public virtual override {
        revert("CrawlNFT: Soulbound token - approvals not allowed");
    }
    
    /// @notice Override setApprovalForAll to prevent approvals (soulbound)
    function setApprovalForAll(address, bool) public virtual override {
        revert("CrawlNFT: Soulbound token - approvals not allowed");
    }
}
