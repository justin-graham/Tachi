// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/core/CrawlNFT.sol";
import "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

contract CrawlNFTFuzzTest is Test {
    CrawlNFT public crawlNFT;

    address public owner;

    function setUp() public {
        owner = address(this);
        crawlNFT = new CrawlNFT();
    }

    /// @notice Fuzz test for minting licenses to random addresses
    function testFuzz_MintLicense(address publisher, string memory termsURI) public {
        // Skip zero address and empty terms
        vm.assume(publisher != address(0));
        vm.assume(bytes(termsURI).length > 0);
        vm.assume(bytes(termsURI).length < 1000); // Reasonable URI length
        vm.assume(publisher.code.length == 0); // Only EOAs to avoid IERC721Receiver issues

        // Should succeed for valid inputs
        crawlNFT.mintLicense(publisher, termsURI);

        // Verify token was minted
        assertEq(crawlNFT.ownerOf(1), publisher);
        assertEq(crawlNFT.getTermsURI(1), termsURI);
        assertEq(crawlNFT.balanceOf(publisher), 1);
        assertTrue(crawlNFT.hasPublisherLicense(publisher));
    }

    /// @notice Fuzz test for updating terms URI with random strings
    function testFuzz_UpdateTermsURI(address publisher, string memory originalTerms, string memory newTerms) public {
        vm.assume(publisher != address(0));
        vm.assume(publisher.code.length == 0); // Only EOAs
        vm.assume(bytes(originalTerms).length > 0 && bytes(originalTerms).length < 1000);
        vm.assume(bytes(newTerms).length > 0 && bytes(newTerms).length < 1000);
        vm.assume(keccak256(bytes(originalTerms)) != keccak256(bytes(newTerms))); // Different strings

        // Mint initial license
        crawlNFT.mintLicense(publisher, originalTerms);
        uint256 tokenId = 1;

        // Update terms
        crawlNFT.updateTermsURI(tokenId, newTerms);

        // Verify update
        assertEq(crawlNFT.getTermsURI(tokenId), newTerms);
        assertEq(crawlNFT.ownerOf(tokenId), publisher); // Owner shouldn't change
    }

    /// @notice Fuzz test for burning tokens with random token IDs
    function testFuzz_BurnToken(uint256 tokenIdToBurn, uint8 numTokens) public {
        numTokens = uint8(bound(numTokens, 1, 10)); // Mint 1-10 tokens

        // Mint multiple tokens
        for (uint8 i = 0; i < numTokens; i++) {
            address publisher = address(uint160(uint256(keccak256(abi.encodePacked("publisher", i, block.timestamp)))));
            crawlNFT.mintLicense(publisher, string(abi.encodePacked("terms", i)));
        }

        tokenIdToBurn = bound(tokenIdToBurn, 1, numTokens);

        address originalOwner = crawlNFT.ownerOf(tokenIdToBurn);

        // Burn the token
        crawlNFT.burn(tokenIdToBurn);

        // Verify token was burned
        vm.expectRevert(abi.encodeWithSelector(IERC721Errors.ERC721NonexistentToken.selector, tokenIdToBurn));
        crawlNFT.ownerOf(tokenIdToBurn);

        // Verify publisher no longer has license
        assertFalse(crawlNFT.hasPublisherLicense(originalOwner));
        assertEq(crawlNFT.balanceOf(originalOwner), 0);
    }

    /// @notice Fuzz test that soulbound property is maintained regardless of inputs
    function testFuzz_SoulboundTransferRestrictions(address from, address to, uint256 tokenId) public {
        // Assume valid addresses
        vm.assume(from != address(0) && to != address(0) && from != to);
        vm.assume(from.code.length == 0 && to.code.length == 0); // Only EOAs

        // Mint token to 'from' address
        crawlNFT.mintLicense(from, "test-terms");
        tokenId = 1; // We know token ID is 1

        vm.startPrank(from);

        // All transfer attempts should fail
        vm.expectRevert(CrawlNFT.TransferNotAllowed.selector);
        crawlNFT.transferFrom(from, to, tokenId);

        vm.expectRevert(CrawlNFT.TransferNotAllowed.selector);
        crawlNFT.safeTransferFrom(from, to, tokenId);

        vm.expectRevert(CrawlNFT.TransferNotAllowed.selector);
        crawlNFT.safeTransferFrom(from, to, tokenId, "");

        vm.stopPrank();

        // Verify token is still owned by original owner
        assertEq(crawlNFT.ownerOf(tokenId), from);
    }

    /// @notice Invariant: Each publisher can only have one license at a time
    function testFuzz_SingleLicenseInvariant(address publisher1, address publisher2, uint8 attempts) public {
        vm.assume(publisher1 != address(0) && publisher2 != address(0));
        vm.assume(publisher1 != publisher2); // Ensure different publishers
        vm.assume(publisher1.code.length == 0); // Exclude contracts that might not implement IERC721Receiver
        vm.assume(publisher2.code.length == 0); // Exclude contracts that might not implement IERC721Receiver
        attempts = uint8(bound(attempts, 1, 5));

        // Publisher 1 mints license
        crawlNFT.mintLicense(publisher1, "terms1");
        assertTrue(crawlNFT.hasPublisherLicense(publisher1));

        // Publisher 1 cannot mint another license
        for (uint8 i = 0; i < attempts; i++) {
            vm.expectRevert(CrawlNFT.PublisherAlreadyHasLicense.selector);
            crawlNFT.mintLicense(publisher1, string(abi.encodePacked("terms", i)));
        }

        // Publisher 2 can mint their own license
        crawlNFT.mintLicense(publisher2, "terms2");
        assertTrue(crawlNFT.hasPublisherLicense(publisher2));

        // Both should still have exactly one license
        assertEq(crawlNFT.balanceOf(publisher1), 1);
        assertEq(crawlNFT.balanceOf(publisher2), 1);
    }

    /// @notice Fuzz test for access control with random callers
    function testFuzz_AccessControl(address publisher) external {
        vm.assume(publisher != address(this));

        vm.prank(publisher);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, publisher));
        crawlNFT.mintLicense(publisher, "terms");
    }
}
