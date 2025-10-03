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
  }
] as const

export const PAYMENT_PROCESSOR_ABI = [
  // Read functions
  {
    inputs: [],
    name: "baseCrawlFee",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "protocolFeePercent",
    outputs: [{ name: "", type: "uint256" }],
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
    inputs: [{ name: "publisher", type: "address" }],
    name: "publisherBalances",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserEscrowBalance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "requestId", type: "bytes32" }],
    name: "getCrawlRequest",
    outputs: [
      { name: "user", type: "address" },
      { name: "publisher", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "protocolFee", type: "uint256" },
      { name: "targetUrl", type: "string" },
      { name: "isCompleted", type: "bool" },
      { name: "timestamp", type: "uint256" }
    ],
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
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "requestId", type: "bytes32" },
      { name: "success", type: "bool" },
      { name: "resultHash", type: "string" }
    ],
    name: "completeCrawl",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "depositFunds",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "withdrawFunds",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "withdrawPublisherBalance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "requestId", type: "bytes32" },
      { indexed: true, name: "user", type: "address" },
      { indexed: true, name: "publisher", type: "address" },
      { indexed: false, name: "tokenId", type: "uint256" },
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
      { indexed: true, name: "requestId", type: "bytes32" },
      { indexed: true, name: "user", type: "address" },
      { indexed: true, name: "publisher", type: "address" },
      { indexed: false, name: "success", type: "bool" },
      { indexed: false, name: "resultHash", type: "string" }
    ],
    name: "CrawlCompleted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "amount", type: "uint256" }
    ],
    name: "FundsDeposited",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "amount", type: "uint256" }
    ],
    name: "FundsWithdrawn",
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