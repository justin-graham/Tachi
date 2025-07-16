// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title CrawlNFT - Soulbound License Token for Tachi Protocol
/// @notice A non-fungible token representing a content license for publishers
/// @dev Each publisher gets one CrawlNFT as a credential of their participation
contract CrawlNFT is ERC721, Ownable {
    /// @notice Counter for token IDs
    uint256 private _tokenIdCounter;
    
    /// @notice Mapping from token ID to terms URI
    mapping(uint256 => string) private _tokenTermsURI;
    
    /// @notice Mapping from publisher address to their token ID
    mapping(address => uint256) private _publisherTokenId;
    
    /// @notice Mapping to track if a publisher already has a license
    mapping(address => bool) private _hasLicense;
    
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
    
    /// @notice Update the terms URI for a token (owner only)
    /// @param tokenId The token ID to update
    /// @param newTermsURI The new terms URI
    /// @dev This allows for terms updates in case of legal changes
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
    /// @param tokenId The token ID to query
    /// @return The token URI (same as terms URI)
    function tokenURI(uint256 tokenId) 
        public 
        view 
        override 
        returns (string memory) 
    {
        require(_ownerOf(tokenId) != address(0), "CrawlNFT: Token does not exist");
        return _tokenTermsURI[tokenId];
    }
    
    /// @notice Override _update to make tokens soulbound (non-transferable)
    /// @param to The address tokens are being transferred to
    /// @param tokenId The token ID being transferred
    /// @param auth The address authorized to perform the transfer
    /// @dev Allows minting but prevents all other transfers
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
        
        // If burning (to == address(0)), update tracking
        if (to == address(0) && from != address(0)) {
            _hasLicense[from] = false;
            _publisherTokenId[from] = 0;
        }
        
        return super._update(to, tokenId, auth);
    }
    
    /// @notice Burn a license token (owner only)
    /// @param tokenId The token ID to burn
    /// @dev Allows revocation of licenses if needed
    function burn(uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "CrawlNFT: Token does not exist");
        _burn(tokenId);
    }
    
    /// @notice Override supportsInterface to include ERC721 interfaces
    /// @param interfaceId The interface ID to check
    /// @return True if the interface is supported
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC721) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}
