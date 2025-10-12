// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {CrawlNFT} from "../src/CrawlNFT.sol";

contract CrawlNFTTest is Test {
  CrawlNFT public crawlNFT;
  address public owner = address(1);
  address public publisher = address(2);

  function setUp() public {
    vm.prank(owner);
    crawlNFT = new CrawlNFT();
  }

  function testMintLicense() public {
    vm.prank(owner);
    crawlNFT.mintLicense(publisher, "ipfs://terms");

    assertEq(crawlNFT.publisherTokenId(publisher), 1);
    assertEq(crawlNFT.hasLicense(publisher), true);
    assertEq(crawlNFT.totalSupply(), 1);
  }

  function testCannotTransfer() public {
    vm.prank(owner);
    crawlNFT.mintLicense(publisher, "ipfs://terms");

    vm.prank(publisher);
    vm.expectRevert(CrawlNFT.TransferNotAllowed.selector);
    crawlNFT.transferFrom(publisher, address(3), 1);
  }

  function testDeactivateLicense() public {
    vm.prank(owner);
    crawlNFT.mintLicense(publisher, "ipfs://terms");

    vm.prank(owner);
    crawlNFT.deactivateLicense(1);

    assertEq(crawlNFT.hasLicense(publisher), false);
  }

  function testOnlyOwnerCanMint() public {
    vm.prank(publisher);
    vm.expectRevert();
    crawlNFT.mintLicense(publisher, "ipfs://terms");
  }
}
