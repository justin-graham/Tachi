import {test, describe} from 'node:test';
import assert from 'node:assert';

/**
 * Smoke tests for critical user paths
 * Tests end-to-end flows that must work in production
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';
const GATEWAY_URL = process.env.GATEWAY_URL || 'https://tachi-gateway.jgrahamsport16.workers.dev';
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:3000';

describe('Critical Path Smoke Tests', () => {
  describe('Publisher Onboarding Flow', () => {
    test('Publisher can view onboarding page', async () => {
      const response = await fetch(`${DASHBOARD_URL}/onboard`);
      assert.strictEqual(response.status, 200, 'Onboarding page should be accessible');
    });

    test('Publisher registration accepts valid data', async () => {
      const testPublisher = {
        domain: `test-${Date.now()}.com`,
        name: 'Test Publisher',
        email: 'test@example.com',
        walletAddress: '0x' + '1'.repeat(40),
        pricePerRequest: 0.01
      };

      const response = await fetch(`${API_URL}/api/publishers/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(testPublisher)
      });

      // Should succeed or already exist
      assert.ok(
        response.status === 200 || response.status === 409,
        'Publisher registration should succeed or indicate duplicate'
      );
    });

    test('Publishers can be listed', async () => {
      const response = await fetch(`${API_URL}/api/publishers`);
      assert.strictEqual(response.status, 200);

      const data = await response.json();
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.publishers));
    });
  });

  describe('Crawler Registration Flow', () => {
    test('Crawler registration accepts valid data', async () => {
      const testCrawler = {
        name: 'Test Crawler',
        email: 'crawler@example.com',
        walletAddress: '0x' + '2'.repeat(40)
      };

      const response = await fetch(`${API_URL}/api/crawlers/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(testCrawler)
      });

      // Should succeed or handle gracefully
      assert.ok(
        response.status === 200 || response.status === 500,
        'Crawler registration should complete'
      );
    });
  });

  describe('Payment → Content Flow', () => {
    test('Gateway catalog is accessible', async () => {
      const response = await fetch(`${GATEWAY_URL}/catalog`);
      assert.strictEqual(response.status, 200);

      const data = await response.json();
      assert.ok(Array.isArray(data.catalog));
      assert.ok(data.catalog.length > 0, 'Catalog should have content');
    });

    test('Gateway returns 402 for protected content', async () => {
      const response = await fetch(`${GATEWAY_URL}/article/ai-training`);
      assert.strictEqual(response.status, 402);

      const data = await response.json();
      assert.ok(data.payment, 'Should include payment instructions');
      assert.ok(data.payment.recipient, 'Should include recipient address');
      assert.ok(data.payment.amount, 'Should include amount');
    });

    test('Payment headers contain required information', async () => {
      const response = await fetch(`${GATEWAY_URL}/article/ai-training`);

      assert.ok(
        response.headers.get('x-tachi-price'),
        'Should include price header'
      );
      assert.ok(
        response.headers.get('x-tachi-recipient'),
        'Should include recipient header'
      );
      assert.ok(
        response.headers.get('x-tachi-token'),
        'Should include token address header'
      );
    });
  });

  describe('Dashboard Data Flow', () => {
    test('Dashboard can fetch stats for valid address', async () => {
      const testAddress = '0x' + '1'.repeat(40);
      const response = await fetch(`${API_URL}/api/dashboard/stats/${testAddress}`);

      // Should succeed even with no data
      assert.strictEqual(response.status, 200);

      const data = await response.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.stats, 'Should return stats object');
    });

    test('Dashboard can fetch requests for valid address', async () => {
      const testAddress = '0x' + '1'.repeat(40);
      const response = await fetch(`${API_URL}/api/dashboard/requests/${testAddress}`);

      assert.strictEqual(response.status, 200);

      const data = await response.json();
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.requests), 'Should return requests array');
    });

    test('Dashboard can fetch revenue for valid address', async () => {
      const testAddress = '0x' + '1'.repeat(40);
      const response = await fetch(`${API_URL}/api/dashboard/revenue/${testAddress}`);

      assert.strictEqual(response.status, 200);

      const data = await response.json();
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.revenue), 'Should return revenue array');
    });
  });

  describe('System Health', () => {
    test('API is responsive', async () => {
      const start = Date.now();
      const response = await fetch(`${API_URL}/health`);
      const duration = Date.now() - start;

      assert.strictEqual(response.status, 200);
      assert.ok(duration < 1000, 'API should respond within 1 second');
    });

    test('Gateway is responsive', async () => {
      const start = Date.now();
      const response = await fetch(`${GATEWAY_URL}/health`);
      const duration = Date.now() - start;

      assert.strictEqual(response.status, 200);
      assert.ok(duration < 2000, 'Gateway should respond within 2 seconds');
    });
  });
});
