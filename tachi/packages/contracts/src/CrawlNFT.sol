// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title CrawlNFT - Soulbound License Token for Tachi Protocol
/// @notice A non-fungible token representing a content license for publishers
/// @dev Each publisher gets one CrawlNFT as a credential of their participation
contract CrawlNFT is ERC721, Ownable {
    /// @notice Counter for token IDs, incremented for each new license minted
    /// @dev Starts at 1, ensures token IDs are never 0
    uint256 private _tokenIdCounter;
    
    /// @notice Mapping from token ID to the URI containing license terms
    /// @dev Stores IPFS hashes or URIs pointing to publisher's license agreement
    mapping(uint256 => string) private _tokenTermsURI;
    
    /// @notice Mapping from publisher address to their unique token ID
    /// @dev Used to quickly find a publisher's license token
    mapping(address => uint256) private _publisherTokenId;
    
    /// @notice Mapping to track if a publisher already has a license
    /// @dev Prevents duplicate license minting to the same publisher
    mapping(address => bool) private _hasLicense;
    
    /// @notice Event emitted when a new license is minted to a publisher
    /// @param publisher The address of the publisher who received the license
    /// @param tokenId The unique token ID assigned to this license
    /// @param termsURI The URI containing the license terms and conditions
    event LicenseMinted(
        address indexed publisher,
        uint256 indexed tokenId,
        string termsURI
    );
    
    /// @notice Event emitted when license terms are updated
    /// @param tokenId The token ID whose terms were updated
    /// @param oldTermsURI The previous terms URI
    /// @param newTermsURI The new terms URI
    event TermsURIUpdated(
        uint256 indexed tokenId,
        string oldTermsURI,
        string newTermsURI
    );
    
    /// @dev Constructor sets the name and symbol for the NFT collection
    constructor() ERC721("Tachi Content License", "CRAWL") Ownable(msg.sender) {
        _tokenIdCounter = 1; // Start token IDs at 1
    }
    
    /// @notice Mint a new license NFT to a publisher
    /// @param publisher The address of the publisher receiving the license
    /// @param termsURI The URI pointing to the license terms (IPFS hash or URI)
    /// @dev Only the contract owner can mint new licenses
    /// @dev Each publisher can only have one license
    function mintLicense(address publisher, string calldata termsURI) 
        external 
        onlyOwner 
    {
        require(publisher != address(0), "CrawlNFT: Cannot mint to zero address");
        require(bytes(termsURI).length > 0, "CrawlNFT: Terms URI cannot be empty");
        require(!_hasLicense[publisher], "CrawlNFT: Publisher already has a license");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // Store the terms URI for this token
        _tokenTermsURI[tokenId] = termsURI;
        
        // Track publisher's token ID and license status
        _publisherTokenId[publisher] = tokenId;
        _hasLicense[publisher] = true;
        
        // Mint the token to the publisher
        _safeMint(publisher, tokenId);
        
        emit LicenseMinted(publisher, tokenId, termsURI);
    }
    
    /// @notice Get the terms URI for a specific token ID
    /// @param tokenId The token ID to query for terms
    /// @return The URI string containing the license terms for this token
    /// @dev Reverts if the token does not exist
    function getTermsURI(uint256 tokenId) external view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "CrawlNFT: Token does not exist");
        return _tokenTermsURI[tokenId];
    }
    
    /// @notice Get the token ID owned by a specific publisher
    /// @param publisher The publisher's address to query
    /// @return The token ID owned by the publisher (0 if no license)
    /// @dev Returns 0 if the publisher doesn't have a license
    function getPublisherTokenId(address publisher) external view returns (uint256) {
        return _publisherTokenId[publisher];
    }
    
    /// @notice Check if a publisher has an active license
    /// @param publisher The publisher's address to check
    /// @return True if the publisher has a license, false otherwise
    /// @dev This is an alias for hasPublisherLicense for backward compatibility
    function hasLicense(address publisher) external view returns (bool) {
        return _hasLicense[publisher];
    }
    
    /// @notice Check if a publisher has an active license
    /// @param publisher The publisher's address to check  
    /// @return True if the publisher has a license, false otherwise
    /// @dev Primary method for checking publisher license status
    function hasPublisherLicense(address publisher) external view returns (bool) {
        return _hasLicense[publisher];
    }
    
    /// @notice Get the total number of licenses minted
    /// @return The total supply of license tokens
    /// @dev Returns _tokenIdCounter - 1 since counter starts at 1
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }
    
    /// @notice Update the terms URI for an existing license token
    /// @param tokenId The token ID whose terms should be updated
    /// @param newTermsURI The new URI containing updated license terms
    /// @dev Only the contract owner can update terms
    /// @dev Allows for legal updates to license agreements
    function updateTermsURI(uint256 tokenId, string calldata newTermsURI) 
        external 
        onlyOwner 
    {
        require(_ownerOf(tokenId) != address(0), "CrawlNFT: Token does not exist");
        require(bytes(newTermsURI).length > 0, "CrawlNFT: Terms URI cannot be empty");
        
        string memory oldTermsURI = _tokenTermsURI[tokenId];
        _tokenTermsURI[tokenId] = newTermsURI;
        
        emit TermsURIUpdated(tokenId, oldTermsURI, newTermsURI);
    }
    
    /// @notice Override tokenURI to return terms URI
    /// @notice Get the token URI for a specific token ID
    /// @param tokenId The token ID to query for its URI
    /// @return The token URI (identical to terms URI for this implementation)
    /// @dev Required by ERC721 standard, returns the same as getTermsURI()
    function tokenURI(uint256 tokenId) 
        public 
        view 
        override 
        returns (string memory) 
    {
        require(_ownerOf(tokenId) != address(0), "CrawlNFT: Token does not exist");
        return _tokenTermsURI[tokenId];
    }
    
    /// @notice Override transfer function to enforce soulbound property
    /// @param to The address tokens are being transferred to
    /// @param tokenId The token ID being transferred  
    /// @param auth The address authorized to perform the transfer
    /// @return The previous owner of the token
    /// @dev Allows minting (from == address(0)) and burning but prevents transfers
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) but prevent all other transfers
        if (from != address(0) && to != address(0)) {
            revert("CrawlNFT: Token is soulbound and cannot be transferred");
        }
        
        // If burning (to == address(0)), update tracking mappings
        if (to == address(0) && from != address(0)) {
            _hasLicense[from] = false;
            _publisherTokenId[from] = 0;
        }
        
        return super._update(to, tokenId, auth);
    }
    
    /// @notice Burn a license token, revoking the publisher's license
    /// @param tokenId The token ID to burn
    /// @dev Only the contract owner can burn tokens
    /// @dev Updates all tracking mappings when burning
    function burn(uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "CrawlNFT: Token does not exist");
        _burn(tokenId);
    }
    
    /// @notice Check which interfaces this contract supports
    /// @param interfaceId The interface identifier to check
    /// @return True if the interface is supported, false otherwise
    /// @dev Required by ERC165 standard
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC721) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}
