// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../src/core/CrawlNFT.sol";

contract CrawlNFTTest is Test {
    CrawlNFT public crawlNFT;
    address public owner;
    address public publisher1;
    address public publisher2;
    address public unauthorizedUser;

    string constant TERMS_URI_1 = "ipfs://QmTest1234567890abcdef";
    string constant TERMS_URI_2 = "ipfs://QmTest0987654321fedcba";
    string constant UPDATED_TERMS_URI = "ipfs://QmUpdated123456789abcdef";

    event LicenseMinted(address indexed publisher, uint256 indexed tokenId, string termsURI);

    event TermsURIUpdated(uint256 indexed tokenId, string newTermsURI);

    function setUp() public {
        owner = address(this);
        publisher1 = address(0x1);
        publisher2 = address(0x2);
        unauthorizedUser = address(0x3);

        crawlNFT = new CrawlNFT();
    }

    function testInitialState() public view {
        assertEq(crawlNFT.name(), "Tachi Content License");
        assertEq(crawlNFT.symbol(), "CRAWL");
        assertEq(crawlNFT.owner(), owner);
        assertEq(crawlNFT.totalSupply(), 0);
    }

    function testMintLicense() public {
        // Test successful minting
        vm.expectEmit(true, true, false, true);
        emit LicenseMinted(publisher1, 1, TERMS_URI_1);

        crawlNFT.mintLicense(publisher1, TERMS_URI_1);

        // Verify the token was minted correctly
        assertEq(crawlNFT.balanceOf(publisher1), 1);
        assertEq(crawlNFT.ownerOf(1), publisher1);
        assertEq(crawlNFT.getTermsURI(1), TERMS_URI_1);
        assertEq(crawlNFT.tokenURI(1), TERMS_URI_1);
        assertEq(crawlNFT.getPublisherTokenId(publisher1), 1);
        assertTrue(crawlNFT.hasLicense(publisher1));
        assertEq(crawlNFT.totalSupply(), 1);
    }

    function testMintSecondLicense() public {
        // Mint first license
        crawlNFT.mintLicense(publisher1, TERMS_URI_1);

        // Mint second license
        vm.expectEmit(true, true, false, true);
        emit LicenseMinted(publisher2, 2, TERMS_URI_2);

        crawlNFT.mintLicense(publisher2, TERMS_URI_2);

        // Verify both tokens exist
        assertEq(crawlNFT.balanceOf(publisher1), 1);
        assertEq(crawlNFT.balanceOf(publisher2), 1);
        assertEq(crawlNFT.ownerOf(1), publisher1);
        assertEq(crawlNFT.ownerOf(2), publisher2);
        assertEq(crawlNFT.totalSupply(), 2);
    }

    function testOnlyOwnerCanMint() public {
        vm.prank(unauthorizedUser);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, unauthorizedUser));
        crawlNFT.mintLicense(publisher1, TERMS_URI_1);
    }

    function testCannotMintToZeroAddress() public {
        vm.expectRevert(CrawlNFT.ZeroAddress.selector);
        crawlNFT.mintLicense(address(0), TERMS_URI_1);
    }

    function testCannotMintWithEmptyTermsURI() public {
        vm.expectRevert(CrawlNFT.EmptyTermsURI.selector);
        crawlNFT.mintLicense(publisher1, "");
    }

    function testCannotMintDuplicateLicense() public {
        // Mint first license
        crawlNFT.mintLicense(publisher1, TERMS_URI_1);

        // Try to mint another license to the same publisher
        vm.expectRevert(CrawlNFT.PublisherAlreadyHasLicense.selector);
        crawlNFT.mintLicense(publisher1, TERMS_URI_2);
    }

    function testSoulboundTransferRestrictions() public {
        // Mint a license
        crawlNFT.mintLicense(publisher1, TERMS_URI_1);

        // Try to transfer - should revert with TransferNotAllowed
        vm.prank(publisher1);
        vm.expectRevert(CrawlNFT.TransferNotAllowed.selector);
        crawlNFT.transferFrom(publisher1, publisher2, 1);

        // Try safeTransferFrom with data - should also revert with TransferNotAllowed
        vm.prank(publisher1);
        vm.expectRevert(CrawlNFT.TransferNotAllowed.selector);
        crawlNFT.safeTransferFrom(publisher1, publisher2, 1, "");

        // Try safeTransferFrom without data - should also revert via the virtual override
        vm.prank(publisher1);
        vm.expectRevert(CrawlNFT.TransferNotAllowed.selector);
        crawlNFT.safeTransferFrom(publisher1, publisher2, 1);
    }

    function testApprovalStillWorksButTransferFails() public {
        // Mint a license
        crawlNFT.mintLicense(publisher1, TERMS_URI_1);

        // Approval should work
        vm.prank(publisher1);
        crawlNFT.approve(publisher2, 1);
        assertEq(crawlNFT.getApproved(1), publisher2);

        // But transfer should still fail
        vm.prank(publisher2);
        vm.expectRevert(CrawlNFT.TransferNotAllowed.selector);
        crawlNFT.transferFrom(publisher1, publisher2, 1);
    }

    function testUpdateTermsURI() public {
        // Mint a license
        crawlNFT.mintLicense(publisher1, TERMS_URI_1);

        // Update terms URI
        vm.expectEmit(true, false, false, true);
        emit TermsURIUpdated(1, UPDATED_TERMS_URI);

        crawlNFT.updateTermsURI(1, UPDATED_TERMS_URI);

        // Verify update
        assertEq(crawlNFT.getTermsURI(1), UPDATED_TERMS_URI);
        assertEq(crawlNFT.tokenURI(1), UPDATED_TERMS_URI);
    }

    function testOnlyOwnerCanUpdateTermsURI() public {
        // Mint a license
        crawlNFT.mintLicense(publisher1, TERMS_URI_1);

        // Try to update as non-owner
        vm.prank(unauthorizedUser);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, unauthorizedUser));
        crawlNFT.updateTermsURI(1, UPDATED_TERMS_URI);
    }

    function testCannotUpdateNonExistentToken() public {
        vm.expectRevert(CrawlNFT.TokenNotFound.selector);
        crawlNFT.updateTermsURI(999, UPDATED_TERMS_URI);
    }

    function testCannotUpdateTermsURIToEmpty() public {
        // Mint a license
        crawlNFT.mintLicense(publisher1, TERMS_URI_1);

        // Try to update to empty string
        vm.expectRevert(CrawlNFT.EmptyTermsURI.selector);
        crawlNFT.updateTermsURI(1, "");
    }

    function testBurnToken() public {
        // Mint a license
        crawlNFT.mintLicense(publisher1, TERMS_URI_1);

        // Verify initial state
        assertTrue(crawlNFT.hasLicense(publisher1));
        assertEq(crawlNFT.getPublisherTokenId(publisher1), 1);
        assertEq(crawlNFT.balanceOf(publisher1), 1);

        // Burn the token
        crawlNFT.burn(1);

        // Verify token is burned and tracking is updated
        assertFalse(crawlNFT.hasLicense(publisher1));
        assertEq(crawlNFT.getPublisherTokenId(publisher1), 0);
        assertEq(crawlNFT.balanceOf(publisher1), 0);

        // Verify token no longer exists
        vm.expectRevert();
        crawlNFT.ownerOf(1);
    }

    function testOnlyOwnerCanBurn() public {
        // Mint a license
        crawlNFT.mintLicense(publisher1, TERMS_URI_1);

        // Try to burn as non-owner
        vm.prank(unauthorizedUser);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, unauthorizedUser));
        crawlNFT.burn(1);
    }

    function testCannotBurnNonExistentToken() public {
        vm.expectRevert(CrawlNFT.TokenNotFound.selector);
        crawlNFT.burn(999);
    }

    function testGetTermsURINonExistentToken() public {
        vm.expectRevert(CrawlNFT.TokenNotFound.selector);
        crawlNFT.getTermsURI(999);
    }

    function testTokenURINonExistentToken() public {
        vm.expectRevert(CrawlNFT.TokenNotFound.selector);
        crawlNFT.tokenURI(999);
    }

    function testPublisherWithoutLicense() public {
        assertFalse(crawlNFT.hasLicense(publisher1));
        assertEq(crawlNFT.getPublisherTokenId(publisher1), 0);
    }

    function testSupportsInterface() public view {
        // Test ERC721 interface
        assertTrue(crawlNFT.supportsInterface(0x80ac58cd));
        // Test ERC721Metadata interface
        assertTrue(crawlNFT.supportsInterface(0x5b5e139f));
        // Test ERC165 interface
        assertTrue(crawlNFT.supportsInterface(0x01ffc9a7));
    }

    function testCanMintAfterBurn() public {
        // Mint a license
        crawlNFT.mintLicense(publisher1, TERMS_URI_1);

        // Burn the token
        crawlNFT.burn(1);

        // Should be able to mint a new license to the same publisher
        crawlNFT.mintLicense(publisher1, TERMS_URI_2);

        // Verify new token
        assertTrue(crawlNFT.hasLicense(publisher1));
        assertEq(crawlNFT.getPublisherTokenId(publisher1), 2);
        assertEq(crawlNFT.ownerOf(2), publisher1);
        assertEq(crawlNFT.getTermsURI(2), TERMS_URI_2);
    }
}
