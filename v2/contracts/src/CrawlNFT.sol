// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title CrawlNFT - Publisher License NFT for Tachi Protocol
/// @notice Soulbound NFT representing a publisher's license to receive payments
/// @dev Gas-optimized with packed storage and custom errors
contract CrawlNFT is ERC721, Ownable {
  /// @notice Current token ID counter
  uint256 private _tokenIdCounter;

  /// @notice Packed license data (fits in 1 storage slot)
  struct License {
    address publisher; // 20 bytes
    bool isActive;     // 1 byte
    uint32 mintedAt;   // 4 bytes
    uint32 updatedAt;  // 4 bytes
  }

  /// @notice Token ID => License data
  mapping(uint256 => License) public licenses;

  /// @notice Publisher address => Token ID (one license per publisher)
  mapping(address => uint256) public publisherTokenId;

  /// @notice Token ID => Terms URI
  mapping(uint256 => string) public termsURI;

  // Custom errors (gas efficient)
  error ZeroAddress();
  error EmptyTermsURI();
  error PublisherAlreadyHasLicense();
  error TokenNotFound();
  error TransferNotAllowed();
  error Unauthorized();

  // Events
  event LicenseMinted(address indexed publisher, uint256 indexed tokenId, string termsURI);
  event LicenseDeactivated(uint256 indexed tokenId);
  event LicenseReactivated(uint256 indexed tokenId);
  event TermsURIUpdated(uint256 indexed tokenId, string newTermsURI);

  constructor() ERC721("Tachi Publisher License", "TACHI") Ownable(msg.sender) {
    _tokenIdCounter = 1; // Start at 1
  }

  /// @notice Mint a new publisher license NFT
  /// @param publisher The publisher's wallet address
  /// @param _termsURI URI containing license terms
  function mintLicense(address publisher, string calldata _termsURI) external onlyOwner {
    if (publisher == address(0)) revert ZeroAddress();
    if (bytes(_termsURI).length == 0) revert EmptyTermsURI();
    if (publisherTokenId[publisher] != 0) revert PublisherAlreadyHasLicense();

    uint256 tokenId = _tokenIdCounter;

    licenses[tokenId] = License({
      publisher: publisher,
      isActive: true,
      mintedAt: uint32(block.timestamp),
      updatedAt: uint32(block.timestamp)
    });

    termsURI[tokenId] = _termsURI;
    publisherTokenId[publisher] = tokenId;

    _mint(publisher, tokenId);

    unchecked {
      _tokenIdCounter++;
    }

    emit LicenseMinted(publisher, tokenId, _termsURI);
  }

  /// @notice Update license terms URI
  /// @param tokenId The token ID to update
  /// @param newTermsURI The new terms URI
  function updateTermsURI(uint256 tokenId, string calldata newTermsURI) external onlyOwner {
    if (!_exists(tokenId)) revert TokenNotFound();
    if (bytes(newTermsURI).length == 0) revert EmptyTermsURI();

    licenses[tokenId].updatedAt = uint32(block.timestamp);
    termsURI[tokenId] = newTermsURI;

    emit TermsURIUpdated(tokenId, newTermsURI);
  }

  /// @notice Deactivate a license
  /// @param tokenId The token ID to deactivate
  function deactivateLicense(uint256 tokenId) external onlyOwner {
    if (!_exists(tokenId)) revert TokenNotFound();

    licenses[tokenId].isActive = false;
    licenses[tokenId].updatedAt = uint32(block.timestamp);

    emit LicenseDeactivated(tokenId);
  }

  /// @notice Reactivate a license
  /// @param tokenId The token ID to reactivate
  function reactivateLicense(uint256 tokenId) external onlyOwner {
    if (!_exists(tokenId)) revert TokenNotFound();

    licenses[tokenId].isActive = true;
    licenses[tokenId].updatedAt = uint32(block.timestamp);

    emit LicenseReactivated(tokenId);
  }

  /// @notice Check if a publisher has an active license
  /// @param publisher The publisher's address
  /// @return True if publisher has an active license
  function hasLicense(address publisher) external view returns (bool) {
    uint256 tokenId = publisherTokenId[publisher];
    return tokenId != 0 && licenses[tokenId].isActive;
  }

  /// @notice Get total supply of minted licenses
  /// @return The total number of licenses minted
  function totalSupply() external view returns (uint256) {
    return _tokenIdCounter - 1;
  }

  /// @notice Check if a token exists
  /// @param tokenId The token ID to check
  /// @return True if token exists
  function _exists(uint256 tokenId) internal view returns (bool) {
    return licenses[tokenId].publisher != address(0);
  }

  /// @notice Override tokenURI to return terms URI
  function tokenURI(uint256 tokenId) public view override returns (string memory) {
    if (!_exists(tokenId)) revert TokenNotFound();
    return termsURI[tokenId];
  }

  /// @notice Override _update to make tokens soulbound (non-transferable)
  function _update(address to, uint256 tokenId, address auth)
    internal
    override
    returns (address)
  {
    address from = _ownerOf(tokenId);

    // Allow minting (from == 0) and burning (to == 0), but no transfers
    if (from != address(0) && to != address(0)) {
      revert TransferNotAllowed();
    }

    return super._update(to, tokenId, auth);
  }

  /// @notice Override transferFrom to prevent transfers
  function transferFrom(address, address, uint256) public pure override {
    revert TransferNotAllowed();
  }

  /// @notice Override safeTransferFrom to prevent transfers
  function safeTransferFrom(address, address, uint256, bytes memory)
    public
    pure
    override
  {
    revert TransferNotAllowed();
  }
}
