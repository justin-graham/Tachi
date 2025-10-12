import { expect } from "chai";
import { ethers } from "hardhat";
import type { Contract } from "ethers";

describe("CrawlNFT Gas Optimizations", function () {
  let contract: Contract;
  let owner: any;
  let publisher1: any;
  let publisher2: any;

  beforeEach(async function () {
    [owner, publisher1, publisher2] = await ethers.getSigners();

    const CrawlNFTFactory = await ethers.getContractFactory("CrawlNFT");
    contract = await CrawlNFTFactory.deploy();
    await contract.waitForDeployment();
  });

  describe("Gas Optimization Tests", function () {
    it("Should efficiently pack license data in storage", async function () {
      const termsURI = "https://example.com/terms/1";
      
      // Mint a license
      await contract.mintLicense(publisher1.address, termsURI);
      
      // Get the packed license data
      const licenseData = await contract.getLicenseData(1);
      
      expect(licenseData.publisher).to.equal(publisher1.address);
      expect(licenseData.isActive).to.equal(true);
      expect(licenseData.mintTimestamp).to.be.gt(0);
      expect(licenseData.lastUpdated).to.be.gt(0);
    });

    it("Should demonstrate gas savings with batch operations", async function () {
      const publishers = [publisher1.address, publisher2.address];
      const termsURIs = ["https://example.com/terms/1", "https://example.com/terms/2"];

      // Measure gas for individual mints
      const individual1 = await contract.mintLicense.estimateGas(publishers[0], termsURIs[0]);
      
      // Reset for batch test (deploy new contract)
      const CrawlNFTFactory = await ethers.getContractFactory("CrawlNFT");
      const batchContract = await CrawlNFTFactory.deploy();
      await batchContract.waitForDeployment();

      // Measure gas for batch mint
      const batch = await batchContract.batchMintLicenses.estimateGas(publishers, termsURIs);
      
      // Batch should be more efficient per-item than individual mints
      const individualTotal = individual1 * BigInt(2);
      console.log(`Individual total gas: ${individualTotal}`);
      console.log(`Batch gas: ${batch}`);
      
      // Expect some gas savings (batch should be less than 2x individual)
      expect(batch).to.be.lt(individualTotal);
    });

    it("Should use custom errors for gas efficiency", async function () {
      // Test ZeroAddress error
      await expect(
        contract.mintLicense(ethers.ZeroAddress, "https://example.com/terms")
      ).to.be.revertedWithCustomError(contract, "ZeroAddress");

      // Test EmptyTermsURI error
      await expect(
        contract.mintLicense(publisher1.address, "")
      ).to.be.revertedWithCustomError(contract, "EmptyTermsURI");
    });

    it("Should prevent transfers (soulbound)", async function () {
      const termsURI = "https://example.com/terms/1";
      
      // Mint a license
      await contract.mintLicense(publisher1.address, termsURI);
      
      // Try to transfer - should fail
      await expect(
        (contract as any).connect(publisher1).transferFrom(publisher1.address, publisher2.address, 1)
      ).to.be.revertedWithCustomError(contract, "TransferNotAllowed");
    });

    it("Should efficiently handle storage updates", async function () {
      const termsURI = "https://example.com/terms/1";
      const newTermsURI = "https://example.com/terms/updated";
      
      // Mint a license
      await contract.mintLicense(publisher1.address, termsURI);
      
      // Update terms URI
      await contract.updateTermsURI(1, newTermsURI);
      
      // Verify the update
      expect(await contract.getTermsURI(1)).to.equal(newTermsURI);
      
      // Verify lastUpdated was changed in packed struct
      const licenseData = await contract.getLicenseData(1);
      expect(licenseData.lastUpdated).to.be.gt(licenseData.mintTimestamp);
    });
  });

  describe("Batch Operations Validation", function () {
    it("Should mint multiple licenses in batch", async function () {
      const publishers = [publisher1.address, publisher2.address];
      const termsURIs = ["https://example.com/terms/1", "https://example.com/terms/2"];

      await contract.batchMintLicenses(publishers, termsURIs);

      expect(await contract.totalSupply()).to.equal(2);
      expect(await contract.hasLicense(publisher1.address)).to.be.true;
      expect(await contract.hasLicense(publisher2.address)).to.be.true;
    });

    it("Should revert on array length mismatch", async function () {
      const publishers = [publisher1.address];
      const termsURIs = ["https://example.com/terms/1", "https://example.com/terms/2"];

      await expect(
        contract.batchMintLicenses(publishers, termsURIs)
      ).to.be.revertedWithCustomError(contract, "ArrayLengthMismatch");
    });
  });

  describe("Storage Packing Validation", function () {
    it("Should demonstrate efficient storage packing", async function () {
      const termsURI = "https://example.com/terms/1";
      
      // Mint license
      await contract.mintLicense(publisher1.address, termsURI);
      
      // Test that all data is retrievable from packed struct
      const licenseData = await contract.getLicenseData(1);
      expect(licenseData.publisher).to.equal(publisher1.address);
      expect(licenseData.isActive).to.equal(true);
      
      // Test deactivation updates packed struct
      await contract.deactivateLicense(1);
      const deactivatedData = await contract.getLicenseData(1);
      expect(deactivatedData.isActive).to.equal(false);
      
      // Test reactivation updates packed struct  
      await contract.reactivateLicense(1);
      const reactivatedData = await contract.getLicenseData(1);
      expect(reactivatedData.isActive).to.equal(true);
    });
  });
});
