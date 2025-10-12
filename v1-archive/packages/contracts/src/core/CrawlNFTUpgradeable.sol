// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title CrawlNFTUpgradeable
 * @dev Upgradeable soulbound NFT representing publisher licenses
 *
 * This contract represents soulbound tokens that cannot be transferred after minting.
 * Each token is tied to a specific domain and publisher.
 */
contract CrawlNFTUpgradeable is
    Initializable,
    ERC721Upgradeable,
    ERC721EnumerableUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    // State variables (using OpenZeppelin's upgrade-safe pattern)
    string private _baseTokenURI;
    uint256 private _nextTokenId;
    mapping(uint256 => string) private _tokenDomains;
    mapping(string => bool) private _domainExists;
    mapping(string => uint256) private _domainToTokenId;

    // Events
    event LicenseMinted(address indexed publisher, uint256 indexed tokenId, string domain);
    event BaseURIUpdated(string newBaseURI);

    // Errors
    error SoulboundTokensCannotBeTransferred();
    error DomainAlreadyLicensed(string domain);
    error InvalidDomain(string domain);
    error Unauthorized();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the contract
     * @param name The name of the NFT collection
     * @param symbol The symbol of the NFT collection
     * @param baseTokenURI The base URI for token metadata
     */
    function initialize(string memory name, string memory symbol, string memory baseTokenURI) public initializer {
        __ERC721_init(name, symbol);
        __ERC721Enumerable_init();
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();

        _baseTokenURI = baseTokenURI;
        _nextTokenId = 1;
    }

    /**
     * @dev Mint a new license for a domain
     * @param publisher The address of the publisher
     * @param domain The domain to license
     */
    function mint(address publisher, string memory domain) external onlyOwner {
        if (bytes(domain).length == 0) {
            revert InvalidDomain(domain);
        }

        if (_domainExists[domain]) {
            revert DomainAlreadyLicensed(domain);
        }

        uint256 tokenId = _nextTokenId;
        _nextTokenId++;

        // Store domain mapping
        _tokenDomains[tokenId] = domain;
        _domainExists[domain] = true;
        _domainToTokenId[domain] = tokenId;

        _safeMint(publisher, tokenId);

        emit LicenseMinted(publisher, tokenId, domain);
    }

    /**
     * @dev Get the domain associated with a token
     * @param tokenId The token ID
     * @return The domain string
     */
    function tokenDomain(uint256 tokenId) external view returns (string memory) {
        _requireOwned(tokenId);
        return _tokenDomains[tokenId];
    }

    /**
     * @dev Check if a domain is already licensed
     * @param domain The domain to check
     * @return True if the domain is licensed
     */
    function isDomainLicensed(string memory domain) external view returns (bool) {
        return _domainExists[domain];
    }

    /**
     * @dev Get the token ID for a domain
     * @param domain The domain to query
     * @return The token ID (0 if not found)
     */
    function getTokenIdByDomain(string memory domain) external view returns (uint256) {
        return _domainToTokenId[domain];
    }

    /**
     * @dev Update the base URI (only owner)
     * @param newBaseURI The new base URI
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * @dev Get the base URI
     * @return The base URI string
     */
    function baseURI() external view returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Override _baseURI to use storage
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Override transfer functions to make tokens soulbound
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (address)
    {
        address from = _ownerOf(tokenId);

        // Allow minting (from == address(0)) but prevent all transfers
        if (from != address(0) && to != address(0)) {
            revert SoulboundTokensCannotBeTransferred();
        }

        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Override to prevent approvals (soulbound tokens don't need them)
     */
    function approve(address, uint256) public pure override(ERC721Upgradeable, IERC721) {
        revert SoulboundTokensCannotBeTransferred();
    }

    /**
     * @dev Override to prevent approvals (soulbound tokens don't need them)
     */
    function setApprovalForAll(address, bool) public pure override(ERC721Upgradeable, IERC721) {
        revert SoulboundTokensCannotBeTransferred();
    }

    /**
     * @dev Required override for supportsInterface
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Required override for _increaseBalance
     */
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super._increaseBalance(account, value);
    }

    /**
     * @dev Authorize upgrade (only owner can upgrade)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner { }
}
