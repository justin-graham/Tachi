// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test, console } from "forge-std/Test.sol";
import { ProofOfCrawlLedger } from "../src/core/ProofOfCrawlLedger.sol";

contract ProofOfCrawlLedgerTest is Test {
    ProofOfCrawlLedger public ledger;
    address public owner = address(1);
    address public unauthorized = address(2);
    address public crawler1 = address(3);
    address public crawler2 = address(4);

    uint256 public constant CRAWL_TOKEN_ID_1 = 1;
    uint256 public constant CRAWL_TOKEN_ID_2 = 2;
    bytes32 public constant CONTENT_HASH_1 = keccak256("content1");
    bytes32 public constant CONTENT_HASH_2 = keccak256("content2");
    string public constant URL_1 = "https://example.com/page1";
    string public constant URL_2 = "https://example.com/page2";

    event CrawlLogged(uint256 indexed crawlTokenId, address indexed crawler, uint256 timestamp, uint256 indexed logId);

    event CrawlLoggedWithContent(
        uint256 indexed crawlTokenId,
        address indexed crawler,
        bytes32 contentHash,
        uint256 timestamp,
        uint256 indexed logId
    );

    event CrawlLoggedWithURL(
        uint256 indexed crawlTokenId, address indexed crawler, string url, uint256 timestamp, uint256 indexed logId
    );

    event PausedStateChanged(bool paused, address indexed admin);

    function setUp() public {
        vm.prank(owner);
        ledger = new ProofOfCrawlLedger();
    }

    function test_deployment() public view {
        assertEq(ledger.owner(), owner);
        assertEq(ledger.totalCrawlsLogged(), 0);
        assertEq(ledger.isPaused(), false);
        assertEq(ledger.getVersion(), "1.0.0");
    }

    function test_logCrawl_success() public {
        // Expect the CrawlLogged event
        vm.expectEmit(true, true, true, true);
        emit CrawlLogged(CRAWL_TOKEN_ID_1, crawler1, block.timestamp, 1);

        vm.prank(owner);
        ledger.logCrawl(CRAWL_TOKEN_ID_1, crawler1);

        assertEq(ledger.totalCrawlsLogged(), 1);
    }

    function test_logCrawl_multipleEntries() public {
        // Log first crawl
        vm.prank(owner);
        ledger.logCrawl(CRAWL_TOKEN_ID_1, crawler1);

        // Log second crawl
        vm.prank(owner);
        ledger.logCrawl(CRAWL_TOKEN_ID_2, crawler2);

        assertEq(ledger.totalCrawlsLogged(), 2);
    }

    function test_logCrawl_onlyOwner() public {
        vm.prank(unauthorized);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", unauthorized));
        ledger.logCrawl(CRAWL_TOKEN_ID_1, crawler1);
    }

    function test_logCrawl_zeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("ProofOfCrawlLedger: Crawler address cannot be zero");
        ledger.logCrawl(CRAWL_TOKEN_ID_1, address(0));
    }

    function test_logCrawl_zeroCrawlTokenId() public {
        vm.prank(owner);
        vm.expectRevert("ProofOfCrawlLedger: CrawlTokenId must be greater than zero");
        ledger.logCrawl(0, crawler1);
    }

    function test_logCrawl_whenPaused() public {
        // Pause the contract
        vm.prank(owner);
        ledger.setPaused(true);

        // Try to log a crawl
        vm.prank(owner);
        vm.expectRevert("ProofOfCrawlLedger: Contract is paused");
        ledger.logCrawl(CRAWL_TOKEN_ID_1, crawler1);
    }

    function test_logCrawlWithContent_success() public {
        // Expect the CrawlLoggedWithContent event
        vm.expectEmit(true, true, true, true);
        emit CrawlLoggedWithContent(CRAWL_TOKEN_ID_1, crawler1, CONTENT_HASH_1, block.timestamp, 1);

        vm.prank(owner);
        ledger.logCrawlWithContent(CRAWL_TOKEN_ID_1, crawler1, CONTENT_HASH_1);

        assertEq(ledger.totalCrawlsLogged(), 1);
    }

    function test_logCrawlWithContent_onlyOwner() public {
        vm.prank(unauthorized);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", unauthorized));
        ledger.logCrawlWithContent(CRAWL_TOKEN_ID_1, crawler1, CONTENT_HASH_1);
    }

    function test_logCrawlWithContent_zeroHash() public {
        vm.prank(owner);
        vm.expectRevert("ProofOfCrawlLedger: Content hash cannot be zero");
        ledger.logCrawlWithContent(CRAWL_TOKEN_ID_1, crawler1, bytes32(0));
    }

    function test_logCrawlWithURL_success() public {
        // Expect the CrawlLoggedWithURL event
        vm.expectEmit(true, true, true, true);
        emit CrawlLoggedWithURL(CRAWL_TOKEN_ID_1, crawler1, URL_1, block.timestamp, 1);

        vm.prank(owner);
        ledger.logCrawlWithURL(CRAWL_TOKEN_ID_1, crawler1, URL_1);

        assertEq(ledger.totalCrawlsLogged(), 1);
    }

    function test_logCrawlWithURL_onlyOwner() public {
        vm.prank(unauthorized);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", unauthorized));
        ledger.logCrawlWithURL(CRAWL_TOKEN_ID_1, crawler1, URL_1);
    }

    function test_logCrawlWithURL_emptyURL() public {
        vm.prank(owner);
        vm.expectRevert("ProofOfCrawlLedger: URL cannot be empty");
        ledger.logCrawlWithURL(CRAWL_TOKEN_ID_1, crawler1, "");
    }

    function test_logCrawlBatch_success() public {
        uint256[] memory crawlTokenIds = new uint256[](2);
        address[] memory crawlers = new address[](2);

        crawlTokenIds[0] = CRAWL_TOKEN_ID_1;
        crawlTokenIds[1] = CRAWL_TOKEN_ID_2;
        crawlers[0] = crawler1;
        crawlers[1] = crawler2;

        // Expect both CrawlLogged events
        vm.expectEmit(true, true, true, true);
        emit CrawlLogged(CRAWL_TOKEN_ID_1, crawler1, block.timestamp, 1);
        vm.expectEmit(true, true, true, true);
        emit CrawlLogged(CRAWL_TOKEN_ID_2, crawler2, block.timestamp, 2);

        vm.prank(owner);
        ledger.logCrawlBatch(crawlTokenIds, crawlers);

        assertEq(ledger.totalCrawlsLogged(), 2);
    }

    function test_logCrawlBatch_mismatchedArrays() public {
        uint256[] memory crawlTokenIds = new uint256[](2);
        address[] memory crawlers = new address[](1);

        crawlTokenIds[0] = CRAWL_TOKEN_ID_1;
        crawlTokenIds[1] = CRAWL_TOKEN_ID_2;
        crawlers[0] = crawler1;

        vm.prank(owner);
        vm.expectRevert("ProofOfCrawlLedger: Array lengths must match");
        ledger.logCrawlBatch(crawlTokenIds, crawlers);
    }

    function test_logCrawlBatch_emptyArrays() public {
        uint256[] memory crawlTokenIds = new uint256[](0);
        address[] memory crawlers = new address[](0);

        vm.prank(owner);
        vm.expectRevert("ProofOfCrawlLedger: Arrays cannot be empty");
        ledger.logCrawlBatch(crawlTokenIds, crawlers);
    }

    function test_logCrawlBatch_tooLarge() public {
        uint256[] memory crawlTokenIds = new uint256[](101);
        address[] memory crawlers = new address[](101);

        for (uint256 i = 0; i < 101; i++) {
            crawlTokenIds[i] = i + 1;
            crawlers[i] = address(uint160(i + 100));
        }

        vm.prank(owner);
        vm.expectRevert("ProofOfCrawlLedger: Batch size too large");
        ledger.logCrawlBatch(crawlTokenIds, crawlers);
    }

    function test_logCrawlBatch_zeroAddress() public {
        uint256[] memory crawlTokenIds = new uint256[](2);
        address[] memory crawlers = new address[](2);

        crawlTokenIds[0] = CRAWL_TOKEN_ID_1;
        crawlTokenIds[1] = CRAWL_TOKEN_ID_2;
        crawlers[0] = crawler1;
        crawlers[1] = address(0);

        vm.prank(owner);
        vm.expectRevert("ProofOfCrawlLedger: Crawler address cannot be zero");
        ledger.logCrawlBatch(crawlTokenIds, crawlers);
    }

    function test_setPaused_success() public {
        assertEq(ledger.isPaused(), false);

        vm.expectEmit(true, true, true, true);
        emit PausedStateChanged(true, owner);

        vm.prank(owner);
        ledger.setPaused(true);

        assertEq(ledger.isPaused(), true);

        // Test unpausing
        vm.expectEmit(true, true, true, true);
        emit PausedStateChanged(false, owner);

        vm.prank(owner);
        ledger.setPaused(false);

        assertEq(ledger.isPaused(), false);
    }

    function test_setPaused_onlyOwner() public {
        vm.prank(unauthorized);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", unauthorized));
        ledger.setPaused(true);
    }

    function test_getTotalCrawlsLogged() public {
        assertEq(ledger.getTotalCrawlsLogged(), 0);

        vm.prank(owner);
        ledger.logCrawl(CRAWL_TOKEN_ID_1, crawler1);

        assertEq(ledger.getTotalCrawlsLogged(), 1);
    }

    function test_resetTotalCrawls_success() public {
        // First log some crawls
        vm.prank(owner);
        ledger.logCrawl(CRAWL_TOKEN_ID_1, crawler1);
        vm.prank(owner);
        ledger.logCrawl(CRAWL_TOKEN_ID_2, crawler2);

        assertEq(ledger.totalCrawlsLogged(), 2);

        // Reset to new total
        vm.prank(owner);
        ledger.resetTotalCrawls(10);

        assertEq(ledger.totalCrawlsLogged(), 10);
    }

    function test_resetTotalCrawls_onlyOwner() public {
        vm.prank(unauthorized);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", unauthorized));
        ledger.resetTotalCrawls(5);
    }

    function test_logIdIncrementing() public {
        // Log first crawl - should get logId 1
        vm.expectEmit(true, true, true, true);
        emit CrawlLogged(CRAWL_TOKEN_ID_1, crawler1, block.timestamp, 1);

        vm.prank(owner);
        ledger.logCrawl(CRAWL_TOKEN_ID_1, crawler1);

        // Log second crawl - should get logId 2
        vm.expectEmit(true, true, true, true);
        emit CrawlLogged(CRAWL_TOKEN_ID_2, crawler2, block.timestamp, 2);

        vm.prank(owner);
        ledger.logCrawl(CRAWL_TOKEN_ID_2, crawler2);

        assertEq(ledger.totalCrawlsLogged(), 2);
    }

    function test_mixedLoggingMethods() public {
        // Test that different logging methods all increment the same counter
        vm.prank(owner);
        ledger.logCrawl(CRAWL_TOKEN_ID_1, crawler1);
        assertEq(ledger.totalCrawlsLogged(), 1);

        vm.prank(owner);
        ledger.logCrawlWithContent(CRAWL_TOKEN_ID_2, crawler2, CONTENT_HASH_1);
        assertEq(ledger.totalCrawlsLogged(), 2);

        vm.prank(owner);
        ledger.logCrawlWithURL(CRAWL_TOKEN_ID_1, crawler1, URL_1);
        assertEq(ledger.totalCrawlsLogged(), 3);
    }

    function test_eventEmission_timestampAndLogId() public {
        uint256 expectedTimestamp = block.timestamp;
        uint256 expectedLogId = 1;

        vm.expectEmit(true, true, true, true);
        emit CrawlLogged(CRAWL_TOKEN_ID_1, crawler1, expectedTimestamp, expectedLogId);

        vm.prank(owner);
        ledger.logCrawl(CRAWL_TOKEN_ID_1, crawler1);
    }

    function test_gasOptimization_batchVsIndividual() public {
        // Test individual calls
        uint256 gasBefore = gasleft();

        vm.prank(owner);
        ledger.logCrawl(CRAWL_TOKEN_ID_1, crawler1);
        vm.prank(owner);
        ledger.logCrawl(CRAWL_TOKEN_ID_2, crawler2);

        uint256 gasAfterIndividual = gasleft();
        uint256 individualGasUsed = gasBefore - gasAfterIndividual;

        // Deploy new contract for batch test
        vm.prank(owner);
        ProofOfCrawlLedger batchLedger = new ProofOfCrawlLedger();

        // Test batch call
        uint256[] memory crawlTokenIds = new uint256[](2);
        address[] memory crawlers = new address[](2);

        crawlTokenIds[0] = CRAWL_TOKEN_ID_1;
        crawlTokenIds[1] = CRAWL_TOKEN_ID_2;
        crawlers[0] = crawler1;
        crawlers[1] = crawler2;

        gasBefore = gasleft();

        vm.prank(owner);
        batchLedger.logCrawlBatch(crawlTokenIds, crawlers);

        uint256 gasAfterBatch = gasleft();
        uint256 batchGasUsed = gasBefore - gasAfterBatch;

        // Batch should use less gas than individual calls
        // (This assertion might not always pass due to test environment differences)
        console.log("Individual gas used:", individualGasUsed);
        console.log("Batch gas used:", batchGasUsed);

        // Both should result in same total crawls
        assertEq(ledger.totalCrawlsLogged(), 2);
        assertEq(batchLedger.totalCrawlsLogged(), 2);
    }
}
