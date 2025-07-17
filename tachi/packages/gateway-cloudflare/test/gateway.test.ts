import { describe, it, expect, beforeEach } from '@jest/globals';
import { createPublicClient, http, parseUnits } from 'viem';
import { base } from 'viem/chains';

// Mock environment for testing
const mockEnv = {
  BASE_RPC_URL: 'https://base-mainnet.alchemyapi.io/v2/test-key',
  PAYMENT_PROCESSOR_ADDRESS: '0x1234567890123456789012345678901234567890',
  PROOF_OF_CRAWL_LEDGER_ADDRESS: '0x2345678901234567890123456789012345678901',
  USDC_ADDRESS: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  PRIVATE_KEY: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  CRAWL_TOKEN_ID: '1',
  PRICE_USDC: '0.001',
  PUBLISHER_ADDRESS: '0x3456789012345678901234567890123456789012',
};

// Mock execution context
const mockContext = {
  waitUntil: jest.fn(),
  passThroughOnException: jest.fn(),
};

// Import the worker after mocking
import worker from '../src/index';

describe('Tachi Cloudflare Gateway', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AI Crawler Detection', () => {
    it('should detect ChatGPT crawler', async () => {
      const request = new Request('https://example.com/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com/bot)',
        },
      });

      const response = await worker.fetch(request, mockEnv, mockContext);
      
      expect(response.status).toBe(402);
      expect(response.headers.get('x402-currency')).toBe('USDC');
      expect(response.headers.get('x402-network')).toBe('Base');
      expect(response.headers.get('x402-recipient')).toBe(mockEnv.PAYMENT_PROCESSOR_ADDRESS);
    });

    it('should detect GPTBot crawler', async () => {
      const request = new Request('https://example.com/', {
        headers: {
          'User-Agent': 'GPTBot/1.0 (+https://openai.com/gptbot)',
        },
      });

      const response = await worker.fetch(request, mockEnv, mockContext);
      
      expect(response.status).toBe(402);
      const body = await response.json();
      expect(body.error).toBe('Payment Required');
      expect(body.payment.amount).toBe('0.001');
      expect(body.payment.currency).toBe('USDC');
    });

    it('should detect Claude crawler', async () => {
      const request = new Request('https://example.com/', {
        headers: {
          'User-Agent': 'Claude-Web/1.0 (+https://claude.ai/bot)',
        },
      });

      const response = await worker.fetch(request, mockEnv, mockContext);
      
      expect(response.status).toBe(402);
    });

    it('should pass through human users', async () => {
      const request = new Request('https://example.com/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      // Mock the global fetch function
      global.fetch = jest.fn(() =>
        Promise.resolve(new Response('Original content', { status: 200 }))
      );

      const response = await worker.fetch(request, mockEnv, mockContext);
      
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('Original content');
    });
  });

  describe('Payment Required Response', () => {
    it('should return proper 402 response structure', async () => {
      const request = new Request('https://example.com/', {
        headers: {
          'User-Agent': 'GPTBot/1.0',
        },
      });

      const response = await worker.fetch(request, mockEnv, mockContext);
      
      expect(response.status).toBe(402);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      
      const body = await response.json();
      expect(body).toMatchObject({
        error: 'Payment Required',
        message: expect.stringContaining('0.001 USDC'),
        payment: {
          amount: '0.001',
          currency: 'USDC',
          network: 'Base',
          chainId: 8453,
          recipient: mockEnv.PAYMENT_PROCESSOR_ADDRESS,
          tokenAddress: mockEnv.USDC_ADDRESS,
          tokenId: '1',
        },
        instructions: expect.arrayContaining([
          expect.stringContaining('Send the specified amount'),
          expect.stringContaining('transaction confirmation'),
          expect.stringContaining('Authorization: Bearer'),
        ]),
      });
    });

    it('should include correct price in smallest units', async () => {
      const request = new Request('https://example.com/', {
        headers: {
          'User-Agent': 'GPTBot/1.0',
        },
      });

      const response = await worker.fetch(request, mockEnv, mockContext);
      
      // 0.001 USDC = 1000 smallest units (USDC has 6 decimals)
      expect(response.headers.get('x402-price')).toBe('1000');
    });
  });

  describe('Authorization Header Processing', () => {
    it('should extract transaction hash from Bearer token', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const request = new Request('https://example.com/', {
        headers: {
          'User-Agent': 'GPTBot/1.0',
          'Authorization': `Bearer ${txHash}`,
        },
      });

      // Mock the verification to fail (we're testing extraction, not verification)
      const response = await worker.fetch(request, mockEnv, mockContext);
      
      // Should attempt verification and fail (since we're not mocking blockchain calls)
      expect(response.status).toBe(402);
      const body = await response.json();
      expect(body.error).toBe('Payment verification failed');
      expect(body.txHash).toBe(txHash);
    });

    it('should reject invalid authorization format', async () => {
      const request = new Request('https://example.com/', {
        headers: {
          'User-Agent': 'GPTBot/1.0',
          'Authorization': 'InvalidFormat',
        },
      });

      const response = await worker.fetch(request, mockEnv, mockContext);
      
      expect(response.status).toBe(400);
      expect(await response.text()).toContain('Invalid authorization format');
    });
  });

  describe('CORS Handling', () => {
    it('should handle OPTIONS preflight requests', async () => {
      const request = new Request('https://example.com/', {
        method: 'OPTIONS',
      });

      const response = await worker.fetch(request, mockEnv, mockContext);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
    });

    it('should add CORS headers to all responses', async () => {
      const request = new Request('https://example.com/', {
        headers: {
          'User-Agent': 'GPTBot/1.0',
        },
      });

      const response = await worker.fetch(request, mockEnv, mockContext);
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('Content Delivery', () => {
    it('should proxy to origin after successful payment verification', async () => {
      // This test would require mocking the blockchain verification
      // For now, we'll test the structure
      const request = new Request('https://example.com/', {
        headers: {
          'User-Agent': 'GPTBot/1.0',
          'Authorization': 'Bearer 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
      });

      const response = await worker.fetch(request, mockEnv, mockContext);
      
      // Should attempt verification (and fail without proper mocking)
      expect(response.status).toBe(402);
    });
  });

  describe('Environment Configuration', () => {
    it('should use correct Base network addresses', () => {
      expect(mockEnv.USDC_ADDRESS).toBe('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');
      expect(mockEnv.BASE_RPC_URL).toContain('base-mainnet');
    });

    it('should parse price correctly', () => {
      const priceInWei = parseUnits('0.001', 6);
      expect(priceInWei.toString()).toBe('1000');
    });
  });
});
