// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./TachiMultiSig.sol";

/// @title CrawlNFTMultiSig - Multi-Sig Compatible Soulbound License Token for Tachi Protocol
/// @notice A non-fungible token representing a content license for publishers with multi-signature governance
/// @dev Each publisher gets one CrawlNFT as a credential of their participation
contract CrawlNFTMultiSig is ERC721, AccessControl {
    /// @notice Role identifier for multi-signature wallet
    bytes32 public constant MULTISIG_ROLE = keccak256("MULTISIG_ROLE");
    
    /// @notice Role identifier for operators (can perform non-critical operations)
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /// @notice Address of the controlling multi-signature wallet
    address public multiSigWallet;

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

    /// @notice Event emitted when multi-sig wallet is updated
    /// @param oldMultiSig Previous multi-sig wallet address
    /// @param newMultiSig New multi-sig wallet address
    event MultiSigWalletUpdated(
        address indexed oldMultiSig,
        address indexed newMultiSig
    );

    /// @dev Custom errors
    error OnlyMultiSig();
    error InvalidMultiSigWallet();
    error PublisherAlreadyHasLicense();
    error PublisherHasNoLicense();
    error TokenDoesNotExist();
    error TransferNotAllowed();

    /// @notice Modifier to restrict access to multi-signature wallet only
    modifier onlyMultiSig() {
        if (msg.sender != multiSigWallet) revert OnlyMultiSig();
        _;
    }

    /// @dev Constructor sets the name and symbol for the NFT collection
    /// @param _multiSigWallet Address of the multi-signature wallet
    constructor(address _multiSigWallet) ERC721("Tachi Content License", "CRAWL") {
        if (_multiSigWallet == address(0)) revert InvalidMultiSigWallet();
        
        multiSigWallet = _multiSigWallet;
        
        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, _multiSigWallet);
        _grantRole(MULTISIG_ROLE, _multiSigWallet);
        
        _tokenIdCounter = 1; // Start token IDs at 1
    }

    /// @notice Mint a new content license to a publisher
    /// @dev Only callable by multi-signature wallet, ensures one license per publisher
    /// @param publisher The address of the publisher receiving the license
    /// @param termsURI IPFS hash or URI pointing to the license terms document
    /// @return tokenId The unique token ID assigned to this license
    function mintLicense(
        address publisher, 
        string calldata termsURI
    ) external onlyMultiSig returns (uint256 tokenId) {
        if (_hasLicense[publisher]) revert PublisherAlreadyHasLicense();
        
        tokenId = _tokenIdCounter++;
        
        // Mint the soulbound token
        _safeMint(publisher, tokenId);
        
        // Store license metadata
        _tokenTermsURI[tokenId] = termsURI;
        _publisherTokenId[publisher] = tokenId;
        _hasLicense[publisher] = true;
        
        emit LicenseMinted(publisher, tokenId, termsURI);
        
        return tokenId;
    }

    /// @notice Update the terms URI for an existing license
    /// @dev Only callable by multi-signature wallet
    /// @param tokenId The token ID to update
    /// @param newTermsURI The new IPFS hash or URI for updated terms
    function updateTermsURI(
        uint256 tokenId, 
        string calldata newTermsURI
    ) external onlyMultiSig {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist();
        
        string memory oldTermsURI = _tokenTermsURI[tokenId];
        _tokenTermsURI[tokenId] = newTermsURI;
        
        emit TermsURIUpdated(tokenId, oldTermsURI, newTermsURI);
    }

    /// @notice Burn a license token (emergency function)
    /// @dev Only callable by multi-signature wallet, updates all mappings
    /// @param tokenId The token ID to burn
    function burn(uint256 tokenId) external onlyMultiSig {
        address owner = _ownerOf(tokenId);
        if (owner == address(0)) revert TokenDoesNotExist();
        
        // Clear publisher mappings
        _hasLicense[owner] = false;
        _publisherTokenId[owner] = 0;
        delete _tokenTermsURI[tokenId];
        
        // Burn the token
        _burn(tokenId);
    }

    /// @notice Update the multi-signature wallet address
    /// @dev Only callable by current multi-sig wallet
    /// @param newMultiSig Address of the new multi-signature wallet
    function updateMultiSigWallet(address newMultiSig) external onlyMultiSig {
        if (newMultiSig == address(0)) revert InvalidMultiSigWallet();
        
        address oldMultiSig = multiSigWallet;
        multiSigWallet = newMultiSig;
        
        // Transfer roles
        _revokeRole(DEFAULT_ADMIN_ROLE, oldMultiSig);
        _revokeRole(MULTISIG_ROLE, oldMultiSig);
        _grantRole(DEFAULT_ADMIN_ROLE, newMultiSig);
        _grantRole(MULTISIG_ROLE, newMultiSig);
        
        emit MultiSigWalletUpdated(oldMultiSig, newMultiSig);
    }

    /// @notice Grant operator role to an address
    /// @dev Only callable by multi-signature wallet
    /// @param operator Address to grant operator role
    function grantOperatorRole(address operator) external onlyMultiSig {
        _grantRole(OPERATOR_ROLE, operator);
    }

    /// @notice Revoke operator role from an address
    /// @dev Only callable by multi-signature wallet
    /// @param operator Address to revoke operator role
    function revokeOperatorRole(address operator) external onlyMultiSig {
        _revokeRole(OPERATOR_ROLE, operator);
    }

    /// @notice Get the terms URI for a specific token
    /// @param tokenId The token ID to query
    /// @return termsURI The IPFS hash or URI containing the license terms
    function getTermsURI(uint256 tokenId) external view returns (string memory termsURI) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist();
        return _tokenTermsURI[tokenId];
    }

    /// @notice Check if a publisher has a license
    /// @param publisher The publisher address to check
    /// @return True if the publisher has a license
    function hasLicense(address publisher) external view returns (bool) {
        return _hasLicense[publisher];
    }

    /// @notice Get a publisher's token ID
    /// @param publisher The publisher address to query
    /// @return tokenId The token ID owned by the publisher (0 if none)
    function getPublisherTokenId(address publisher) external view returns (uint256 tokenId) {
        return _publisherTokenId[publisher];
    }

    /// @notice Get the current token counter value
    /// @return counter Current value of the token ID counter
    function getTokenCounter() external view returns (uint256 counter) {
        return _tokenIdCounter;
    }

    /// @notice Override tokenURI to include terms reference
    /// @param tokenId The token ID to get URI for
    /// @return uri The complete token URI including metadata
    function tokenURI(uint256 tokenId) public view override returns (string memory uri) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist();
        
        string memory baseURI = _baseURI();
        string memory termsURI = _tokenTermsURI[tokenId];
        
        return bytes(baseURI).length > 0 
            ? string(abi.encodePacked(baseURI, _toString(tokenId), "?terms=", termsURI))
            : termsURI;
    }

    /// @dev Override transfer functions to make tokens soulbound
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) and burning (to == address(0))
        // Block all other transfers
        if (from != address(0) && to != address(0)) {
            revert TransferNotAllowed();
        }
        
        return super._update(to, tokenId, auth);
    }

    /// @dev Required override for AccessControl
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /// @dev Convert uint256 to string
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
