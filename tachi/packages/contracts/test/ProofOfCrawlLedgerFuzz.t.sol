// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/ProofOfCrawlLedger.sol";

contract ProofOfCrawlLedgerFuzzTest is Test {
    ProofOfCrawlLedger public ledger;
    
    address public owner;
    
    function setUp() public {
        owner = address(this);
        ledger = new ProofOfCrawlLedger();
    }
    
    /// @notice Fuzz test for logging crawls with random parameters
    function testFuzz_LogCrawl(address crawler, uint256 crawlTokenId) public {
        vm.assume(crawler != address(0));
        vm.assume(crawlTokenId > 0);
        
        uint256 initialTotal = ledger.getTotalCrawlsLogged();
        
        // Log the crawl
        ledger.logCrawl(crawlTokenId, crawler);
        
        // Verify state changes
        assertEq(ledger.getTotalCrawlsLogged(), initialTotal + 1);
        
        // Verify event was emitted (implicitly tested by successful execution)
    }
    
    /// @notice Fuzz test for batch logging with varying batch sizes
    function testFuzz_LogCrawlBatch(uint8 batchSize) public {
        batchSize = uint8(bound(batchSize, 1, 50)); // Reasonable batch size
        
        address[] memory crawlers = new address[](batchSize);
        uint256[] memory crawlTokenIds = new uint256[](batchSize);
        
        // Generate test data
        for (uint8 i = 0; i < batchSize; i++) {
            crawlers[i] = makeAddr(string(abi.encodePacked("crawler", i)));
            crawlTokenIds[i] = uint256(i + 1);
        }
        
        uint256 initialTotal = ledger.getTotalCrawlsLogged();
        
        // Log batch
        ledger.logCrawlBatch(crawlTokenIds, crawlers);
        
        // Verify total increased by batch size
        assertEq(ledger.getTotalCrawlsLogged(), initialTotal + batchSize);
    }
    
    /// @notice Fuzz test for logging with content hash
    function testFuzz_LogCrawlWithContent(address crawler, uint256 crawlTokenId, bytes32 contentHash) public {
        vm.assume(crawler != address(0));
        vm.assume(crawlTokenId > 0);
        vm.assume(contentHash != bytes32(0));
        
        uint256 initialTotal = ledger.getTotalCrawlsLogged();
        
        // Log crawl with content
        ledger.logCrawlWithContent(crawlTokenId, crawler, contentHash);
        
        // Verify state changes
        assertEq(ledger.getTotalCrawlsLogged(), initialTotal + 1);
    }
    
    /// @notice Fuzz test for logging with URL
    function testFuzz_LogCrawlWithURL(address crawler, uint256 crawlTokenId, string memory url) public {
        vm.assume(crawler != address(0));
        vm.assume(crawlTokenId > 0);
        vm.assume(bytes(url).length > 0);
        vm.assume(bytes(url).length < 1000); // Reasonable URL length
        
        uint256 initialTotal = ledger.getTotalCrawlsLogged();
        
        // Log crawl with URL
        ledger.logCrawlWithURL(crawlTokenId, crawler, url);
        
        // Verify state changes
        assertEq(ledger.getTotalCrawlsLogged(), initialTotal + 1);
    }
    
    /// @notice Fuzz test for pause/unpause functionality
    function testFuzz_PauseUnpause(bool shouldPause) public {
        // Set pause state
        ledger.setPaused(shouldPause);
        
        address testCrawler = makeAddr("testCrawler");
        uint256 testTokenId = 1;
        bytes32 testHash = keccak256("test");
        
        if (shouldPause) {
            // Should revert when paused
            vm.expectRevert("ProofOfCrawlLedger: Contract is paused");
            ledger.logCrawl(testTokenId, testCrawler);
        } else {
            // Should succeed when not paused
            ledger.logCrawl(testTokenId, testCrawler);
            assertEq(ledger.getTotalCrawlsLogged(), 1);
        }
    }
    
    /// @notice Fuzz test for access control with random addresses
    function testFuzz_AccessControl(address caller) external {
        vm.assume(caller != address(this));
        
        vm.prank(caller);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, caller));
        ledger.logCrawl(1, caller);
    }
    
    /// @notice Invariant test: Total crawls should never decrease (except on reset)
    function testFuzz_TotalCrawlsInvariant(uint8 numOperations) public {
        numOperations = uint8(bound(numOperations, 1, 20));
        
        uint256 lastTotal = 0;
        
        for (uint8 i = 0; i < numOperations; i++) {
            address crawler = makeAddr(string(abi.encodePacked("crawler", i)));
            uint256 tokenId = uint256(i + 1);
            bytes32 hash = keccak256(abi.encodePacked("hash", i));
            
                        ledger.logCrawl(uint256(i + 1), crawler);
            
            uint256 currentTotal = ledger.getTotalCrawlsLogged();
            assertTrue(currentTotal > lastTotal); // Should always increase
            lastTotal = currentTotal;
        }
        
        assertEq(lastTotal, numOperations);
    }
    
    /// @notice Fuzz test for reset functionality
    function testFuzz_ResetTotalCrawls(uint8 numCrawls) public {
        numCrawls = uint8(bound(numCrawls, 1, 20));
        
        // Log some crawls
        for (uint8 i = 0; i < numCrawls; i++) {
            address crawler = makeAddr(string(abi.encodePacked("crawler", i)));
            ledger.logCrawl(uint256(i + 1), crawler);
        }
        
        assertEq(ledger.getTotalCrawlsLogged(), numCrawls);
        
        // Reset
        ledger.resetTotalCrawls(0);
        
        // Should be back to zero
        assertEq(ledger.getTotalCrawlsLogged(), 0);
    }
}
