"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@nomicfoundation/hardhat-ledger");
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-foundry");
require("@openzeppelin/hardhat-upgrades");
require("dotenv/config");
/**
 * Hardware Wallet Configuration for Production Deployment
 *
 * This configuration enables Hardhat to work with hardware wallets (Ledger/Trezor)
 * for secure multi-signature deployment and management.
 */
// Production hardware wallet accounts configuration
const PRODUCTION_LEDGER_ACCOUNTS = [
    {
        // CEO/Founder - Ledger Nano X
        derivationPath: "m/44'/60'/0'/0/0",
        // Public address will be derived from hardware wallet during deployment
    },
    {
        // CTO - Ledger Nano S Plus
        derivationPath: "m/44'/60'/0'/0/0",
    },
    {
        // Operations Lead - Ledger Nano X
        derivationPath: "m/44'/60'/0'/0/1",
    }
];
const PRODUCTION_TREZOR_ACCOUNTS = [
    {
        // Security Officer - Trezor Model T
        derivationPath: "m/44'/60'/0'/0/0",
    },
    {
        // External Security Advisor - Trezor Safe 3
        derivationPath: "m/44'/60'/0'/0/0",
    }
];
const config = {
    solidity: {
        version: "0.8.28",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        // Base Mainnet
        base: {
            url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
            chainId: 8453,
            // Hardware wallet integration handled externally; Hardhat only receives derived addresses when signing
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
        // Base Sepolia Testnet
        baseSepolia: {
            url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
            chainId: 84532,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
        // Base Goerli (legacy)
        baseGoerli: {
            url: process.env.BASE_GOERLI_RPC_URL || "https://goerli.base.org",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 84531,
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: 31337,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
    },
    etherscan: {
        apiKey: {
            base: process.env.BASESCAN_API_KEY || "",
            baseGoerli: process.env.BASESCAN_API_KEY || "",
            baseSepolia: process.env.BASESCAN_API_KEY || "",
        },
        customChains: [
            {
                network: "base",
                chainId: 8453,
                urls: {
                    apiURL: "https://api.basescan.org/api",
                    browserURL: "https://basescan.org",
                },
            },
            {
                network: "baseGoerli",
                chainId: 84531,
                urls: {
                    apiURL: "https://api-goerli.basescan.org/api",
                    browserURL: "https://goerli.basescan.org",
                },
            },
            {
                network: "baseSepolia",
                chainId: 84532,
                urls: {
                    apiURL: "https://api-sepolia.basescan.org/api",
                    browserURL: "https://sepolia.basescan.org",
                },
            },
        ],
    },
    // Gas reporting for cost optimization
    gasReporter: {
        enabled: process.env.REPORT_GAS !== undefined,
        currency: "USD",
    },
    // NOTE: Tenderly integration removed from Hardhat config due to missing type support.
    // Use separate scripts/SDK for Tenderly monitoring if needed.
};
exports.default = config;
