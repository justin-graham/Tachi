"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const hardhat_1 = __importDefault(require("hardhat"));
describe("Tachi Protocol Integration Tests", function () {
    let owner;
    let publisher;
    let crawler;
    let unauthorizedUser;
    let crawlNFT;
    let paymentProcessor;
    let proofOfCrawlLedger;
    let mockUSDC;
    let ownerAddress;
    let publisherAddress;
    let crawlerAddress;
    const PUBLISHER_TERMS_URI = "https://example.com/terms";
    const UPDATED_TERMS_URI = "https://example.com/updated-terms";
    const CRAWL_URL = "https://example.com/content";
    const PAYMENT_AMOUNT = hardhat_1.default.ethers.parseUnits("10", 6); // 10 USDC (6 decimals)
    beforeEach(async function () {
        // Get signers
        const signers = await hardhat_1.default.ethers.getSigners();
        [owner, publisher, crawler, unauthorizedUser] = signers;
        ownerAddress = await owner.getAddress();
        publisherAddress = await publisher.getAddress();
        crawlerAddress = await crawler.getAddress();
        // Deploy MockUSDC
        const MockUSDCFactory = await hardhat_1.default.ethers.getContractFactory("MockUSDC");
        mockUSDC = await MockUSDCFactory.deploy("Mock USDC", "USDC");
        await mockUSDC.waitForDeployment();
        // Deploy CrawlNFT
        const CrawlNFTFactory = await hardhat_1.default.ethers.getContractFactory("CrawlNFT");
        crawlNFT = (await CrawlNFTFactory.deploy());
        await crawlNFT.waitForDeployment();
        // Deploy PaymentProcessor
        const PaymentProcessorFactory = await hardhat_1.default.ethers.getContractFactory("PaymentProcessor");
        paymentProcessor = (await PaymentProcessorFactory.deploy(await mockUSDC.getAddress()));
        await paymentProcessor.waitForDeployment();
        // Deploy ProofOfCrawlLedger
        const ProofOfCrawlLedgerFactory = await hardhat_1.default.ethers.getContractFactory("ProofOfCrawlLedger");
        proofOfCrawlLedger = (await ProofOfCrawlLedgerFactory.deploy());
        await proofOfCrawlLedger.waitForDeployment();
        // Setup: Give crawler some USDC tokens
        await mockUSDC.mint(crawlerAddress, hardhat_1.default.ethers.parseUnits("1000", 6)); // 1000 USDC
    });
    describe("Complete Crawl Payment Flow", function () {
        it("Should complete the full crawl payment workflow", async function () {
            // Step 1: Owner mints a CrawlNFT license for the publisher
            await crawlNFT.connect(owner).mintLicense(publisherAddress, PUBLISHER_TERMS_URI);
            // Verify publisher has a license
            (0, chai_1.expect)(await crawlNFT.hasLicense(publisherAddress)).to.be.true;
            (0, chai_1.expect)(await crawlNFT.balanceOf(publisherAddress)).to.equal(1);
            // Get the token ID (it will be 1 since it's the first minted)
            const tokenId = 1n;
            (0, chai_1.expect)(await crawlNFT.ownerOf(tokenId)).to.equal(publisherAddress);
            (0, chai_1.expect)(await crawlNFT.tokenURI(tokenId)).to.equal(PUBLISHER_TERMS_URI);
            // Step 2: Crawler approves PaymentProcessor to spend USDC
            await mockUSDC.connect(crawler).approve(await paymentProcessor.getAddress(), PAYMENT_AMOUNT);
            // Verify allowance
            const allowance = await mockUSDC.allowance(crawlerAddress, await paymentProcessor.getAddress());
            (0, chai_1.expect)(allowance).to.equal(PAYMENT_AMOUNT);
            // Step 3: Crawler makes payment to publisher via PaymentProcessor
            const publisherInitialBalance = await mockUSDC.balanceOf(publisherAddress);
            const crawlerInitialBalance = await mockUSDC.balanceOf(crawlerAddress);
            // Make payment using the NFT token ID
            await (0, chai_1.expect)(paymentProcessor.connect(crawler).payPublisherByNFT(await crawlNFT.getAddress(), tokenId, PAYMENT_AMOUNT)).to.emit(paymentProcessor, "Payment")
                .withArgs(crawlerAddress, publisherAddress, PAYMENT_AMOUNT);
            // Verify payment was transferred
            const publisherFinalBalance = await mockUSDC.balanceOf(publisherAddress);
            const crawlerFinalBalance = await mockUSDC.balanceOf(crawlerAddress);
            (0, chai_1.expect)(publisherFinalBalance).to.equal(publisherInitialBalance + PAYMENT_AMOUNT);
            (0, chai_1.expect)(crawlerFinalBalance).to.equal(crawlerInitialBalance - PAYMENT_AMOUNT);
            // Step 4: Protocol owner logs the crawl to ProofOfCrawlLedger
            await (0, chai_1.expect)(proofOfCrawlLedger.connect(owner).logCrawlWithURL(tokenId, crawlerAddress, CRAWL_URL)).to.emit(proofOfCrawlLedger, "CrawlLoggedWithURL");
            // Verify crawl was logged
            (0, chai_1.expect)(await proofOfCrawlLedger.totalCrawlsLogged()).to.equal(1);
        });
        it("Should handle direct publisher payment without NFT lookup", async function () {
            // Step 1: Mint license for publisher
            await crawlNFT.connect(owner).mintLicense(publisherAddress, PUBLISHER_TERMS_URI);
            const tokenId = 1n;
            // Step 2: Crawler approves and pays publisher directly
            await mockUSDC.connect(crawler).approve(await paymentProcessor.getAddress(), PAYMENT_AMOUNT);
            const publisherInitialBalance = await mockUSDC.balanceOf(publisherAddress);
            await (0, chai_1.expect)(paymentProcessor.connect(crawler).payPublisher(publisherAddress, PAYMENT_AMOUNT)).to.emit(paymentProcessor, "Payment")
                .withArgs(crawlerAddress, publisherAddress, PAYMENT_AMOUNT);
            // Verify payment
            const publisherFinalBalance = await mockUSDC.balanceOf(publisherAddress);
            (0, chai_1.expect)(publisherFinalBalance).to.equal(publisherInitialBalance + PAYMENT_AMOUNT);
            // Step 3: Log crawl with content hash
            const contentHash = hardhat_1.default.ethers.keccak256(hardhat_1.default.ethers.toUtf8Bytes(CRAWL_URL));
            await (0, chai_1.expect)(proofOfCrawlLedger.connect(owner).logCrawlWithContent(tokenId, crawlerAddress, contentHash)).to.emit(proofOfCrawlLedger, "CrawlLoggedWithContent");
        });
        it("Should handle batch crawl logging", async function () {
            // Setup: Create multiple publishers and payments
            const signers = await hardhat_1.default.ethers.getSigners();
            const publisher2 = signers[4];
            const crawler2 = signers[5];
            const publisher2Address = await publisher2.getAddress();
            const crawler2Address = await crawler2.getAddress();
            // Mint licenses for both publishers
            await crawlNFT.connect(owner).mintLicense(publisherAddress, PUBLISHER_TERMS_URI);
            await crawlNFT.connect(owner).mintLicense(publisher2Address, PUBLISHER_TERMS_URI);
            const tokenId1 = 1n;
            const tokenId2 = 2n;
            // Give crawler2 some USDC
            await mockUSDC.mint(crawler2Address, hardhat_1.default.ethers.parseUnits("1000", 6));
            // Make payments
            await mockUSDC.connect(crawler).approve(await paymentProcessor.getAddress(), PAYMENT_AMOUNT);
            await mockUSDC.connect(crawler2).approve(await paymentProcessor.getAddress(), PAYMENT_AMOUNT);
            await paymentProcessor.connect(crawler).payPublisher(publisherAddress, PAYMENT_AMOUNT);
            await paymentProcessor.connect(crawler2).payPublisher(publisher2Address, PAYMENT_AMOUNT);
            // Batch log crawls
            const tokenIds = [tokenId1, tokenId2];
            const crawlers = [crawlerAddress, crawler2Address];
            await (0, chai_1.expect)(proofOfCrawlLedger.connect(owner).logCrawlBatch(tokenIds, crawlers)).to.emit(proofOfCrawlLedger, "CrawlLogged");
            (0, chai_1.expect)(await proofOfCrawlLedger.totalCrawlsLogged()).to.equal(2);
        });
    });
    describe("Error Handling and Edge Cases", function () {
        it("Should fail if publisher doesn't have a license", async function () {
            // Try to pay a publisher without a license
            await mockUSDC.connect(crawler).approve(await paymentProcessor.getAddress(), PAYMENT_AMOUNT);
            // This should fail because publisher doesn't have a CrawlNFT
            await (0, chai_1.expect)(paymentProcessor.connect(crawler).payPublisherByNFT(await crawlNFT.getAddress(), 1, // Non-existent token ID
            PAYMENT_AMOUNT)).to.be.revertedWith("PaymentProcessor: Invalid CrawlNFT token ID or contract");
        });
        it("Should fail if crawler has insufficient USDC", async function () {
            // Mint license for publisher
            await crawlNFT.connect(owner).mintLicense(publisherAddress, PUBLISHER_TERMS_URI);
            const tokenId = 1n;
            // Try to pay more than crawler has
            const largeAmount = hardhat_1.default.ethers.parseUnits("10000", 6); // 10,000 USDC
            await mockUSDC.connect(crawler).approve(await paymentProcessor.getAddress(), largeAmount);
            await (0, chai_1.expect)(paymentProcessor.connect(crawler).payPublisherByNFT(await crawlNFT.getAddress(), tokenId, largeAmount)).to.be.revertedWith("PaymentProcessor: Insufficient USDC balance");
        });
        it("Should fail if crawler hasn't approved PaymentProcessor", async function () {
            // Mint license for publisher
            await crawlNFT.connect(owner).mintLicense(publisherAddress, PUBLISHER_TERMS_URI);
            const tokenId = 1n;
            // Don't approve PaymentProcessor
            await (0, chai_1.expect)(paymentProcessor.connect(crawler).payPublisherByNFT(await crawlNFT.getAddress(), tokenId, PAYMENT_AMOUNT)).to.be.revertedWith("PaymentProcessor: Insufficient USDC allowance");
        });
        it("Should fail if unauthorized user tries to log crawl", async function () {
            // Mint license for publisher
            await crawlNFT.connect(owner).mintLicense(publisherAddress, PUBLISHER_TERMS_URI);
            const tokenId = 1n;
            // Try to log crawl as unauthorized user
            await (0, chai_1.expect)(proofOfCrawlLedger.connect(unauthorizedUser).logCrawl(tokenId, crawlerAddress)).to.be.revertedWithCustomError(proofOfCrawlLedger, "OwnableUnauthorizedAccount");
        });
        it("Should fail if contract is paused", async function () {
            // Mint license for publisher
            await crawlNFT.connect(owner).mintLicense(publisherAddress, PUBLISHER_TERMS_URI);
            const tokenId = 1n;
            // Pause the ProofOfCrawlLedger
            await proofOfCrawlLedger.connect(owner).setPaused(true);
            // Try to log crawl while paused
            await (0, chai_1.expect)(proofOfCrawlLedger.connect(owner).logCrawl(tokenId, crawlerAddress)).to.be.revertedWith("ProofOfCrawlLedger: Contract is paused");
        });
    });
    describe("Soulbound Token Behavior", function () {
        it("Should prevent CrawlNFT transfers after minting", async function () {
            // Mint license for publisher
            await crawlNFT.connect(owner).mintLicense(publisherAddress, PUBLISHER_TERMS_URI);
            const tokenId = 1n;
            // Try to transfer the soulbound token
            await (0, chai_1.expect)(crawlNFT.connect(publisher).transferFrom(publisherAddress, crawlerAddress, tokenId)).to.be.revertedWith("CrawlNFT: Token is soulbound and cannot be transferred");
        });
        it("Should allow license updates by owner", async function () {
            // Mint license for publisher
            await crawlNFT.connect(owner).mintLicense(publisherAddress, PUBLISHER_TERMS_URI);
            const tokenId = 1n;
            // Update terms URI
            await crawlNFT.connect(owner).updateTermsURI(tokenId, UPDATED_TERMS_URI);
            // Verify update
            (0, chai_1.expect)(await crawlNFT.tokenURI(tokenId)).to.equal(UPDATED_TERMS_URI);
            (0, chai_1.expect)(await crawlNFT.getTermsURI(tokenId)).to.equal(UPDATED_TERMS_URI);
        });
    });
    describe("Contract Deployment Validation", function () {
        it("Should have correct initial states after deployment", async function () {
            // CrawlNFT checks
            (0, chai_1.expect)(await crawlNFT.owner()).to.equal(ownerAddress);
            (0, chai_1.expect)(await crawlNFT.name()).to.equal("Tachi Content License");
            (0, chai_1.expect)(await crawlNFT.symbol()).to.equal("CRAWL");
            (0, chai_1.expect)(await crawlNFT.totalSupply()).to.equal(0);
            // PaymentProcessor checks
            (0, chai_1.expect)(await paymentProcessor.getUSDCTokenAddress()).to.equal(await mockUSDC.getAddress());
            // ProofOfCrawlLedger checks
            (0, chai_1.expect)(await proofOfCrawlLedger.owner()).to.equal(ownerAddress);
            (0, chai_1.expect)(await proofOfCrawlLedger.totalCrawlsLogged()).to.equal(0);
            (0, chai_1.expect)(await proofOfCrawlLedger.isPaused()).to.equal(false);
            (0, chai_1.expect)(await proofOfCrawlLedger.getVersion()).to.equal("1.0.0");
        });
    });
});
