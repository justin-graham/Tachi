# Base Sepolia Testnet End-to-End Test Plan
## Pay-Per-Crawl Protocol Final Dress Rehearsal

> **Test Environment:** Base Sepolia Testnet  
> **Date:** August 6, 2025  
> **Purpose:** Complete end-to-end validation of Pay-Per-Crawl protocol before mainnet deployment

---

## 🎯 Test Overview

This comprehensive test validates the complete Pay-Per-Crawl protocol flow:
1. Publisher mints NFT and deploys worker
2. Crawler registers, gets API key, and performs paid crawl
3. On-chain verification of payments and event logging

---

## 📋 Pre-Test Setup Checklist

### Environment Verification
- [ ] Base Sepolia RPC endpoint is accessible
- [ ] MetaMask connected to Base Sepolia network
- [ ] Test wallets have sufficient Base Sepolia ETH
  - [ ] Publisher wallet: `0x...` (minimum 0.01 ETH)
  - [ ] Crawler wallet: `0x...` (minimum 0.005 ETH)
- [ ] Contracts deployed to Base Sepolia
  - [ ] CrawlNFT contract address: `0x...`
  - [ ] Block explorer link verified
- [ ] Dashboard deployed to staging environment
- [ ] Developer portal accessible
- [ ] Subgraph deployed to staging indexer

### Test Data Collection
- [ ] Record starting ETH balances for both wallets
- [ ] Note current block height on Base Sepolia
- [ ] Verify staging URLs are accessible:
  - [ ] Dashboard: `https://staging-dashboard.tachi.com`
  - [ ] Developer Portal: `https://staging-dev.tachi.com`
  - [ ] Subgraph endpoint: `https://staging-graph.tachi.com`

---

## 🏗️ Section 1: Publisher Flow

### 1.1 Wallet Connection & Setup
- [ ] **Navigate to Dashboard**
  - [ ] Open `https://staging-dashboard.tachi.com`
  - [ ] Verify page loads without errors
  - [ ] Check network indicator shows "Base Sepolia"

- [ ] **Connect Publisher Wallet**
  - [ ] Click "Connect Wallet" button
  - [ ] Select MetaMask option
  - [ ] Approve connection in MetaMask popup
  - [ ] Verify wallet address displays correctly: `0x...`
  - [ ] Verify balance shows sufficient ETH

- [ ] **Network Verification**
  - [ ] Confirm "Base Sepolia" network is active
  - [ ] If not, dashboard should prompt network switch
  - [ ] Approve network switch in MetaMask if prompted

### 1.2 CrawlNFT Minting Process
- [ ] **Mint NFT Interface**
  - [ ] Click "Create New Crawl License" or similar button
  - [ ] NFT minting form appears with fields:
    - [ ] Website URL input field
    - [ ] Price per crawl input field
    - [ ] Optional description field

- [ ] **Fill NFT Details**
  - [ ] Enter test website URL: `https://example-publisher-site.com`
  - [ ] Set price: `0.001` ETH (1000000000000000 wei)
  - [ ] Add description: "E2E Test Crawl License - Base Sepolia"
  - [ ] Verify price conversion displays correctly in USD

- [ ] **Execute Minting Transaction**
  - [ ] Click "Mint NFT" button
  - [ ] MetaMask popup appears with transaction details
  - [ ] Verify gas estimate is reasonable (< 0.001 ETH)
  - [ ] Verify contract address matches deployed CrawlNFT
  - [ ] Click "Confirm" in MetaMask
  - [ ] Wait for transaction confirmation

- [ ] **Verify Minting Success**
  - [ ] Dashboard shows success message
  - [ ] NFT ID is displayed: `Token ID: #...`
  - [ ] Transaction hash is provided: `0x...`
  - [ ] Click transaction hash to open in Base Sepolia block explorer
  - [ ] Verify transaction is confirmed on block explorer

### 1.3 Cloudflare Worker Deployment
- [ ] **Worker Configuration**
  - [ ] After successful NFT mint, worker deployment form appears
  - [ ] Verify NFT ID is pre-populated
  - [ ] Enter Cloudflare account details:
    - [ ] Account ID: `your-cloudflare-account-id`
    - [ ] API Token: `your-cloudflare-api-token`
  - [ ] Verify worker name is auto-generated: `tachi-crawl-{nft-id}`

- [ ] **Deploy Worker**
  - [ ] Click "Deploy Worker" button
  - [ ] Monitor deployment status in dashboard
  - [ ] Wait for "Deployment Successful" message
  - [ ] Worker URL is provided: `https://tachi-crawl-{nft-id}.your-subdomain.workers.dev`

- [ ] **Test Worker Endpoint**
  - [ ] Copy worker URL
  - [ ] Open new browser tab
  - [ ] Navigate to worker URL
  - [ ] Verify default response (should show 402 or info message)
  - [ ] Note: This should NOT return actual content without payment

### 1.4 Publisher Flow Verification
- [ ] **Dashboard State Check**
  - [ ] Publisher dashboard shows active NFT
  - [ ] NFT details are correctly displayed:
    - [ ] Token ID
    - [ ] Website URL
    - [ ] Price per crawl
    - [ ] Worker URL
    - [ ] Deployment status: "Active"

- [ ] **Record Publisher Data**
  - [ ] NFT Token ID: `#...`
  - [ ] Contract Address: `0x...`
  - [ ] Worker URL: `https://...`
  - [ ] Transaction Hash: `0x...`
  - [ ] Publisher Wallet: `0x...`
  - [ ] Initial ETH Balance: `... ETH`

---

## 🤖 Section 2: Crawler Flow

### 2.1 Developer Portal Registration
- [ ] **Access Developer Portal**
  - [ ] Open new browser window/incognito mode
  - [ ] Navigate to `https://staging-dev.tachi.com`
  - [ ] Verify page loads without errors

- [ ] **Create Developer Account**
  - [ ] Click "Sign Up" or "Register" button
  - [ ] Fill registration form:
    - [ ] Email: `test-crawler-{timestamp}@example.com`
    - [ ] Password: Strong test password
    - [ ] Company/Organization: "E2E Test Crawler"
    - [ ] Use case description: "Testing Pay-Per-Crawl protocol"
  - [ ] Submit registration form
  - [ ] Handle email verification if required

- [ ] **Account Verification**
  - [ ] Login with created credentials
  - [ ] Dashboard loads successfully
  - [ ] Profile shows correct information

### 2.2 API Key Generation
- [ ] **Generate API Key**
  - [ ] Navigate to "API Keys" section in dev portal
  - [ ] Click "Generate New API Key"
  - [ ] Fill API key details:
    - [ ] Key name: "E2E Test Key - Base Sepolia"
    - [ ] Description: "End-to-end testing on Base Sepolia"
    - [ ] Rate limit: Default or test-appropriate limit
  - [ ] Click "Generate"

- [ ] **Record API Key**
  - [ ] Copy API key: `tachi_...`
  - [ ] Store securely for test execution
  - [ ] Verify key appears in dashboard list
  - [ ] Note creation timestamp

### 2.3 Initial Crawl Request (402 Challenge)
- [ ] **Prepare Crawl Request**
  - [ ] Open terminal or API testing tool (Postman/curl)
  - [ ] Prepare HTTP request:
    ```bash
    curl -X GET \
      "https://tachi-crawl-{nft-id}.your-subdomain.workers.dev" \
      -H "Authorization: Bearer tachi_your_api_key" \
      -H "Accept: application/json" \
      -v
    ```

- [ ] **Execute Initial Request**
  - [ ] Send the HTTP request
  - [ ] Verify response status: `402 Payment Required`
  - [ ] Verify response headers include:
    - [ ] `WWW-Authenticate: Ethereum`
    - [ ] `X-Payment-Address: 0x...` (should match NFT owner)
    - [ ] `X-Payment-Amount: 1000000000000000` (wei amount)
    - [ ] `X-NFT-Contract: 0x...` (CrawlNFT contract address)
    - [ ] `X-NFT-Token-Id: ...` (Token ID)

- [ ] **Record Challenge Details**
  - [ ] Payment address: `0x...`
  - [ ] Payment amount (wei): `...`
  - [ ] Payment amount (ETH): `... ETH`
  - [ ] NFT Contract: `0x...`
  - [ ] Token ID: `#...`
  - [ ] Challenge timestamp: `...`

### 2.4 On-Chain Payment Execution
- [ ] **Switch to Crawler Wallet**
  - [ ] Open MetaMask
  - [ ] Switch to crawler wallet account
  - [ ] Verify Base Sepolia network is selected
  - [ ] Check ETH balance is sufficient for payment + gas

- [ ] **Record Pre-Payment State**
  - [ ] Crawler ETH balance: `... ETH`
  - [ ] Publisher ETH balance: `... ETH`
  - [ ] Current block number: `...`

- [ ] **Execute Payment Transaction**
  - [ ] Open MetaMask "Send" feature
  - [ ] Enter payment details:
    - [ ] To: `0x...` (publisher address from 402 response)
    - [ ] Amount: `0.001 ETH` (from X-Payment-Amount header)
    - [ ] Data: Leave empty (simple ETH transfer)
  - [ ] Review transaction details
  - [ ] Confirm gas fee is reasonable
  - [ ] Click "Confirm"

- [ ] **Monitor Payment Transaction**
  - [ ] Copy transaction hash: `0x...`
  - [ ] Open Base Sepolia block explorer
  - [ ] Paste transaction hash
  - [ ] Monitor confirmation status
  - [ ] Wait for at least 1 confirmation
  - [ ] Record final confirmation count

### 2.5 Retry Crawl Request (Success Flow)
- [ ] **Wait for Transaction Confirmation**
  - [ ] Ensure payment transaction has at least 1 confirmation
  - [ ] Note: System may require 2-3 confirmations for finality

- [ ] **Retry Crawl Request**
  - [ ] Execute the same curl command as before:
    ```bash
    curl -X GET \
      "https://tachi-crawl-{nft-id}.your-subdomain.workers.dev" \
      -H "Authorization: Bearer tachi_your_api_key" \
      -H "Accept: application/json" \
      -v
    ```

- [ ] **Verify Successful Response**
  - [ ] Response status: `200 OK`
  - [ ] Response contains actual crawled content
  - [ ] Response headers include:
    - [ ] `Content-Type: application/json` or appropriate type
    - [ ] `X-Crawl-Status: success`
    - [ ] `X-Payment-Verified: true`
    - [ ] Standard security headers from gateway hardening

- [ ] **Validate Content Quality**
  - [ ] Response body contains expected website content
  - [ ] JSON structure is valid (if applicable)
  - [ ] Content appears to be genuine crawl data
  - [ ] No error messages in response body

### 2.6 Crawler Flow Verification
- [ ] **Record Successful Crawl Data**
  - [ ] Final response status: `200`
  - [ ] Content length: `... bytes`
  - [ ] Response timestamp: `...`
  - [ ] Payment transaction: `0x...`
  - [ ] API key used: `tachi_...`

---

## ✅ Section 3: Verification Flow

### 3.1 Block Explorer Verification
- [ ] **Publisher Payment Verification**
  - [ ] Open Base Sepolia block explorer (BaseScan)
  - [ ] Navigate to publisher wallet address: `0x...`
  - [ ] Locate the incoming payment transaction
  - [ ] Verify transaction details:
    - [ ] From: Crawler wallet address
    - [ ] To: Publisher wallet address
    - [ ] Value: `0.001 ETH` (exact amount)
    - [ ] Status: Success ✅
    - [ ] Block number: `...`
    - [ ] Gas used: `21000` (standard transfer)

- [ ] **Balance Change Verification**
  - [ ] Publisher balance increased by payment amount (minus gas if they paid)
  - [ ] Crawler balance decreased by payment amount + gas fees
  - [ ] Calculate total gas costs for all transactions

- [ ] **Transaction Timeline**
  - [ ] Record all transaction timestamps
  - [ ] Verify chronological order:
    1. NFT minting transaction
    2. Payment transaction
    3. Successful crawl timestamp

### 3.2 Smart Contract Event Verification
- [ ] **CrawlNFT Contract Verification**
  - [ ] Navigate to CrawlNFT contract on block explorer: `0x...`
  - [ ] Go to "Events" or "Logs" tab
  - [ ] Locate `Transfer` event from NFT mint:
    - [ ] From: `0x000...000` (zero address)
    - [ ] To: Publisher address
    - [ ] Token ID: Matches minted NFT

- [ ] **Look for CrawlLogged Events** (if implemented)
  - [ ] Search for custom events related to crawl execution
  - [ ] Verify event parameters match expected values:
    - [ ] NFT Token ID
    - [ ] Crawler address
    - [ ] Payment amount
    - [ ] Timestamp

### 3.3 Subgraph Verification
- [ ] **Access Staging Subgraph**
  - [ ] Open GraphQL playground or client
  - [ ] Connect to staging subgraph endpoint
  - [ ] Verify connection is successful

- [ ] **Query NFT Data**
  ```graphql
  query {
    crawlNFTs(where: {tokenId: "YOUR_TOKEN_ID"}) {
      id
      tokenId
      owner
      websiteUrl
      pricePerCrawl
      createdAt
      transactionHash
    }
  }
  ```
  - [ ] Execute query
  - [ ] Verify results match expected data:
    - [ ] Token ID matches minted NFT
    - [ ] Owner address matches publisher wallet
    - [ ] Website URL matches input
    - [ ] Price matches set value
    - [ ] Transaction hash matches mint transaction

- [ ] **Query Crawl Events** (if indexed)
  ```graphql
  query {
    crawlEvents(
      where: {nftTokenId: "YOUR_TOKEN_ID"}
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      nftTokenId
      crawler
      publisher
      paymentAmount
      timestamp
      transactionHash
      success
    }
  }
  ```
  - [ ] Execute query
  - [ ] Verify crawl event was indexed:
    - [ ] NFT Token ID matches
    - [ ] Crawler address matches crawler wallet
    - [ ] Publisher address matches NFT owner
    - [ ] Payment amount matches expected value
    - [ ] Success status is true
    - [ ] Timestamp is reasonable
    - [ ] Transaction hash matches payment transaction

### 3.4 End-to-End Data Consistency
- [ ] **Cross-Reference All Data**
  - [ ] Block explorer transaction data
  - [ ] Subgraph indexed data
  - [ ] Dashboard displayed data
  - [ ] API response data
  - [ ] All sources show consistent information

- [ ] **Verify Business Logic**
  - [ ] Publisher received exact payment amount set in NFT
  - [ ] Crawler successfully accessed content after payment
  - [ ] No unauthorized access occurred before payment
  - [ ] Rate limiting and security headers functioned correctly

---

## 📊 Test Results Summary

### Test Execution Summary
- [ ] **Test Start Time:** `...`
- [ ] **Test End Time:** `...`
- [ ] **Total Duration:** `... minutes`
- [ ] **Network Used:** Base Sepolia
- [ ] **Overall Result:** ✅ PASS / ❌ FAIL

### Key Metrics
- [ ] **NFT Mint Gas Cost:** `... ETH`
- [ ] **Payment Transaction Gas:** `... ETH`
- [ ] **Total Gas Spent:** `... ETH`
- [ ] **Payment Amount:** `0.001 ETH`
- [ ] **Response Time (302 → 200):** `... seconds`
- [ ] **Subgraph Indexing Delay:** `... minutes`

### Critical Components Tested
- [ ] ✅ Wallet connection and network switching
- [ ] ✅ NFT minting with custom parameters
- [ ] ✅ Cloudflare Worker deployment automation
- [ ] ✅ Developer portal registration and API key generation
- [ ] ✅ 402 Payment Required challenge system
- [ ] ✅ On-chain payment verification
- [ ] ✅ Content delivery after payment verification
- [ ] ✅ Block explorer transaction verification
- [ ] ✅ Subgraph event indexing and querying

### Issues Encountered
- [ ] **Issue 1:** `...`
  - [ ] Severity: High/Medium/Low
  - [ ] Resolution: `...`
- [ ] **Issue 2:** `...`
  - [ ] Severity: High/Medium/Low
  - [ ] Resolution: `...`

### Performance Observations
- [ ] **Dashboard Load Time:** `... seconds`
- [ ] **NFT Mint Confirmation Time:** `... seconds`
- [ ] **Worker Deployment Time:** `... minutes`
- [ ] **Payment Verification Time:** `... seconds`
- [ ] **Subgraph Indexing Time:** `... minutes`

---

## 🚀 Production Readiness Checklist

Based on this E2E test, verify these items before mainnet deployment:

### Smart Contracts
- [ ] All contract addresses are production-ready
- [ ] Gas costs are optimized and reasonable
- [ ] Contract verification on block explorer is complete
- [ ] Emergency pause mechanisms work (if implemented)

### Infrastructure
- [ ] Dashboard handles mainnet network switching
- [ ] Cloudflare Worker deployment is automated and reliable
- [ ] Developer portal scales for expected user load
- [ ] Subgraph indexing is fast and reliable

### Security
- [ ] Rate limiting is properly configured
- [ ] API key management is secure
- [ ] Payment verification cannot be bypassed
- [ ] All security headers are properly implemented

### User Experience
- [ ] Error messages are clear and helpful
- [ ] Transaction confirmations provide adequate feedback
- [ ] Documentation matches actual behavior
- [ ] Support channels are ready for user questions

---

## 📝 Test Sign-Off

**Test Executed By:** `...`  
**Date Completed:** `...`  
**Environment:** Base Sepolia Testnet  
**Version Tested:** `...`

**Final Recommendation:**
- [ ] ✅ **APPROVED** - Ready for mainnet deployment
- [ ] ⚠️ **APPROVED WITH CONDITIONS** - Address issues before mainnet
- [ ] ❌ **NOT APPROVED** - Critical issues must be resolved

**Approver Signature:** `...`  
**Date:** `...`

---

*This completes the comprehensive End-to-End test plan for the Tachi Protocol Pay-Per-Crawl system on Base Sepolia testnet.*
