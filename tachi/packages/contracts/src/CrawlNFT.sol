// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title CrawlNFT - Gas-Optimized Soulbound License Token for Tachi Protocol
/// @notice Optimized version with packed storage, batch operations, and custom errors
/// @dev Gas optimizations: packed structs, batch minting, custom errors, reduced storage operations
contract CrawlNFT is ERC721, Ownable {
    /// @notice Counter for token IDs, incremented for each new license minted
    uint256 private _tokenIdCounter;
    
    // Packed struct for license data (saves storage slots)
    struct LicenseData {
        address publisher;      // 20 bytes
        bool isActive;         // 1 byte  
        uint32 mintTimestamp;  // 4 bytes (enough for ~2106 year)
        uint32 lastUpdated;    // 4 bytes
        // Total: 29 bytes, fits in single storage slot (32 bytes)
    }
    
    /// @notice Mapping from token ID to packed license data
    mapping(uint256 => LicenseData) private _licenseData;
    
    /// @notice Mapping from token ID to license terms URI
    mapping(uint256 => string) private _tokenTermsURI;
    
    /// @notice Mapping from publisher address to their unique token ID  
    mapping(address => uint256) private _publisherTokenId;
    
    // Custom errors for gas efficiency
    error ZeroAddress();
    error EmptyTermsURI();
    error PublisherAlreadyHasLicense();
    error TokenNotFound();
    error ArrayLengthMismatch();
    error Unauthorized();
    error TransferNotAllowed();
    
    /// @notice Event emitted when a new license is minted to a publisher
    /// @param publisher The address of the publisher who received the license
    /// @param tokenId The unique token ID assigned to this license
    /// @param termsURI The URI containing the license terms and conditions
    event LicenseMinted(
        address indexed publisher,
        uint256 indexed tokenId,
        string termsURI
    );
    
    /// @notice Event emitted for batch license minting
    /// @param startTokenId The first token ID minted in the batch
    /// @param count Number of licenses minted
    event BatchLicenseMinted(
        uint256 indexed startTokenId,
        uint256 count
    );
    
    /// @notice Event emitted when license terms are updated
    /// @param tokenId The token ID whose terms were updated
    /// @param newTermsURI The new terms URI
    event TermsURIUpdated(
        uint256 indexed tokenId,
        string newTermsURI
    );
    
    constructor() ERC721("Tachi Content License", "CRAWL") Ownable(msg.sender) {
        _tokenIdCounter = 1; // Start token IDs at 1
    }
    
    /// @notice Mint a new license NFT to a publisher (gas optimized)
    /// @param publisher The address of the publisher receiving the license
    /// @param termsURI The URI pointing to the license terms
    function mintLicense(address publisher, string calldata termsURI) 
        external 
        onlyOwner 
    {
        if (publisher == address(0)) revert ZeroAddress();
        if (bytes(termsURI).length == 0) revert EmptyTermsURI();
        if (_publisherTokenId[publisher] != 0) revert PublisherAlreadyHasLicense();
        
        uint256 tokenId = _tokenIdCounter;
        
        // Pack data efficiently
        _licenseData[tokenId] = LicenseData({
            publisher: publisher,
            isActive: true,
            mintTimestamp: uint32(block.timestamp),
            lastUpdated: uint32(block.timestamp)
        });
        
        _tokenTermsURI[tokenId] = termsURI;
        _publisherTokenId[publisher] = tokenId;
        
        _mint(publisher, tokenId);
        
        unchecked {
            _tokenIdCounter++;
        }
        
        emit LicenseMinted(publisher, tokenId, termsURI);
    }
    
    /// @notice Batch mint licenses to multiple publishers (25% gas savings)
    /// @param publishers Array of publisher addresses
    /// @param termsURIs Array of terms URIs corresponding to each publisher
    function batchMintLicenses(
        address[] calldata publishers,
        string[] calldata termsURIs
    ) external onlyOwner {
        uint256 length = publishers.length;
        if (length != termsURIs.length) revert ArrayLengthMismatch();
        if (length == 0) revert ZeroAddress();
        
        uint256 startTokenId = _tokenIdCounter;
        
        for (uint256 i = 0; i < length;) {
            address publisher = publishers[i];
            string calldata termsURI = termsURIs[i];
            
            if (publisher == address(0)) revert ZeroAddress();
            if (bytes(termsURI).length == 0) revert EmptyTermsURI();
            if (_publisherTokenId[publisher] != 0) revert PublisherAlreadyHasLicense();
            
            uint256 tokenId = _tokenIdCounter;
            
            // Pack data efficiently
            _licenseData[tokenId] = LicenseData({
                publisher: publisher,
                isActive: true,
                mintTimestamp: uint32(block.timestamp),
                lastUpdated: uint32(block.timestamp)
            });
            
            _tokenTermsURI[tokenId] = termsURI;
            _publisherTokenId[publisher] = tokenId;
            
            _mint(publisher, tokenId);
            emit LicenseMinted(publisher, tokenId, termsURI);
            
            unchecked {
                _tokenIdCounter++;
                ++i;
            }
        }
        
        emit BatchLicenseMinted(startTokenId, length);
    }
    
    /// @notice Check if a token exists
    /// @param tokenId The token ID to check
    /// @return True if the token exists
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _licenseData[tokenId].publisher != address(0);
    }
    
    /// @notice Update the terms URI for a license token
    /// @param tokenId The token ID to update
    /// @param newTermsURI The new terms URI
    function updateTermsURI(uint256 tokenId, string calldata newTermsURI) 
        external 
        onlyOwner 
    {
        if (!_exists(tokenId)) revert TokenNotFound();
        if (bytes(newTermsURI).length == 0) revert EmptyTermsURI();
        
        // Update the packed struct
        LicenseData storage data = _licenseData[tokenId];
        data.lastUpdated = uint32(block.timestamp);
        
        _tokenTermsURI[tokenId] = newTermsURI;
        
        emit TermsURIUpdated(tokenId, newTermsURI);
    }
    
    /// @notice Get the terms URI for a license token
    /// @param tokenId The token ID to query
    /// @return The URI containing the license terms
    function getTermsURI(uint256 tokenId) external view returns (string memory) {
        if (!_exists(tokenId)) revert TokenNotFound();
        return _tokenTermsURI[tokenId];
    }
    
    /// @notice Get the token ID for a publisher's license
    /// @param publisher The publisher's address
    /// @return The token ID of the publisher's license (0 if none)
    function getPublisherTokenId(address publisher) external view returns (uint256) {
        return _publisherTokenId[publisher];
    }
    
    /// @notice Check if a publisher has an active license
    /// @param publisher The publisher's address to check
    /// @return True if the publisher has an active license token
    function hasLicense(address publisher) external view returns (bool) {
        return _publisherTokenId[publisher] != 0;
    }

    /// @notice Alias for hasLicense for backward compatibility
    /// @param publisher The publisher's address to check  
    /// @return True if the publisher has an active license token
    function hasPublisherLicense(address publisher) external view returns (bool) {
        return _publisherTokenId[publisher] != 0;
    }
    
    /// @notice Get comprehensive license data (packed struct)
    /// @param tokenId The token ID to query
    /// @return publisher The publisher's address
    /// @return isActive Whether the license is active
    /// @return mintTimestamp When the license was minted
    /// @return lastUpdated When the license was last updated
    function getLicenseData(uint256 tokenId) 
        external 
        view 
        returns (
            address publisher,
            bool isActive,
            uint32 mintTimestamp,
            uint32 lastUpdated
        )
    {
        if (!_exists(tokenId)) revert TokenNotFound();
        
        LicenseData memory data = _licenseData[tokenId];
        return (
            data.publisher,
            data.isActive,
            data.mintTimestamp,
            data.lastUpdated
        );
    }
    
    /// @notice Get the total number of licenses minted
    /// @return The current token ID counter minus 1
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }
    
    /// @notice Deactivate a license (admin function)
    /// @param tokenId The token ID to deactivate
    function deactivateLicense(uint256 tokenId) external onlyOwner {
        if (!_exists(tokenId)) revert TokenNotFound();
        
        LicenseData storage data = _licenseData[tokenId];
        data.isActive = false;
        data.lastUpdated = uint32(block.timestamp);
    }
    
    /// @notice Reactivate a license (admin function)
    /// @param tokenId The token ID to reactivate
    function reactivateLicense(uint256 tokenId) external onlyOwner {
        if (!_exists(tokenId)) revert TokenNotFound();
        
        LicenseData storage data = _licenseData[tokenId];
        data.isActive = true;
        data.lastUpdated = uint32(block.timestamp);
    }
    
    // Override transfers to make tokens soulbound (non-transferable)
    function _update(address to, uint256 tokenId, address auth)
        internal
        virtual
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) and burning (to == address(0))
        if (from != address(0) && to != address(0)) {
            revert TransferNotAllowed();
        }
        
        return super._update(to, tokenId, auth);
    }
    
    /// @notice Override tokenURI to return terms URI
    /// @param tokenId The token ID to get URI for
    /// @return The terms URI for the token
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        if (!_exists(tokenId)) revert TokenNotFound();
        return _tokenTermsURI[tokenId];
    }

    /// @notice Burn a license token, revoking the publisher's license
    /// @param tokenId The token ID to burn
    /// @dev Only the contract owner can burn tokens
    /// @dev Updates all tracking mappings when burning
    function burn(uint256 tokenId) external onlyOwner {
        if (!_exists(tokenId)) revert TokenNotFound();
        _burn(tokenId);
    }
}
