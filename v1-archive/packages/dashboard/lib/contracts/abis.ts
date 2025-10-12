// Contract ABIs for Tachi Protocol
// Generated from the smart contracts in packages/contracts/src/

export const CRAWL_NFT_ABI = [
  // Read functions
  {
    inputs: [{ name: "publisher", type: "address" }],
    name: "hasLicense",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "publisher", type: "address" }],
    name: "getPublisherTokenId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getLicenseData",
    outputs: [
      { name: "publisher", type: "address" },
      { name: "isActive", type: "bool" },
      { name: "mintTimestamp", type: "uint32" },
      { name: "lastUpdated", type: "uint32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getTermsURI",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  // Owner functions
  {
    inputs: [
      { name: "publisher", type: "address" },
      { name: "termsURI", type: "string" }
    ],
    name: "mintLicense",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "publishers", type: "address[]" },
      { name: "termsURIs", type: "string[]" }
    ],
    name: "batchMintLicenses",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "publisher", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "termsURI", type: "string" }
    ],
    name: "LicenseMinted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" }
    ],
    name: "Transfer",
    type: "event"
  }
] as const

export const PAYMENT_PROCESSOR_ABI = [
  // Read functions
  {
    inputs: [],
    name: "baseCrawlFee",
    outputs: [{ name: "", type: "uint128" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "protocolFeePercent",
    outputs: [{ name: "", type: "uint96" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "publisher", type: "address" }],
    name: "publisherBalances",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "publisher", type: "address" }],
    name: "getPublisherStats",
    outputs: [
      { name: "balance", type: "uint256" },
      { name: "totalCrawls", type: "uint256" },
      { name: "totalFees", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "calculateFees",
    outputs: [
      { name: "protocolFee", type: "uint256" },
      { name: "publisherAmount", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getUSDCTokenAddress",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "feeRecipient",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  // Write functions
  {
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "targetUrl", type: "string" },
      { name: "amount", type: "uint256" }
    ],
    name: "requestCrawl",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "publisher", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "payPublisher",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "crawlNFT", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "amount", type: "uint256" }
    ],
    name: "payPublisherByNFT",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "tokenIds", type: "uint256[]" },
      { name: "amounts", type: "uint256[]" }
    ],
    name: "batchPayCrawlFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "withdrawFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "withdrawProtocolFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "newFee", type: "uint256" }],
    name: "setBaseCrawlFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "newPercent", type: "uint256" }],
    name: "setProtocolFeePercent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "newRecipient", type: "address" }],
    name: "setFeeRecipient",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "emergencyTokenRecovery",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "emergencyWithdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "requester", type: "address" },
      { indexed: true, name: "publisher", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "protocolFee", type: "uint256" },
      { indexed: false, name: "targetUrl", type: "string" }
    ],
    name: "CrawlRequested",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "publisher", type: "address" },
      { indexed: false, name: "amount", type: "uint256" }
    ],
    name: "FeesWithdrawn",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "recipient", type: "address" },
      { indexed: false, name: "amount", type: "uint256" }
    ],
    name: "ProtocolFeesWithdrawn",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "newFee", type: "uint256" }
    ],
    name: "BaseCrawlFeeUpdated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "newPercent", type: "uint256" }
    ],
    name: "ProtocolFeePercentUpdated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "newRecipient", type: "address" }
    ],
    name: "FeeRecipientUpdated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "publisher", type: "address" },
      { indexed: false, name: "amount", type: "uint256" }
    ],
    name: "Payment",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "token", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "amount", type: "uint256" }
    ],
    name: "TokenRecovered",
    type: "event"
  }
] as const

export const USDC_ABI = [
  // ERC20 Standard functions
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "owner", type: "address" }
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function"
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" }
    ],
    name: "Transfer",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "owner", type: "address" },
      { indexed: true, name: "spender", type: "address" },
      { indexed: false, name: "value", type: "uint256" }
    ],
    name: "Approval",
    type: "event"
  }
] as const
