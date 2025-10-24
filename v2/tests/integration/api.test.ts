import {test, describe} from 'node:test';
import assert from 'node:assert';

/**
 * Integration tests for API endpoints
 * Tests: Auth, validation, rate limiting
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';

describe('API Integration Tests', () => {
  describe('Health Check', () => {
    test('GET /health returns status', async () => {
      const response = await fetch(`${API_URL}/health`);
      assert.strictEqual(response.status, 200);

      const data = await response.json();
      assert.strictEqual(data.status, 'ok');
      assert.strictEqual(data.service, 'Tachi API v2');
    });
  });

  describe('Publisher Routes', () => {
    test('POST /api/publishers/register validates input', async () => {
      const response = await fetch(`${API_URL}/api/publishers/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          domain: 'invalid domain!',
          name: 'Test',
          email: 'invalid-email',
          walletAddress: 'invalid-address'
        })
      });

      assert.strictEqual(response.status, 400);

      const data = await response.json();
      assert.strictEqual(data.error, 'Validation failed');
      assert.ok(Array.isArray(data.details), 'Should return validation errors');
    });

    test('POST /api/publishers/register requires all fields', async () => {
      const response = await fetch(`${API_URL}/api/publishers/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          domain: 'test.com'
        })
      });

      assert.strictEqual(response.status, 400);
    });

    test('GET /api/publishers returns list', async () => {
      const response = await fetch(`${API_URL}/api/publishers`);
      assert.strictEqual(response.status, 200);

      const data = await response.json();
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.publishers));
    });
  });

  describe('Crawler Routes', () => {
    test('POST /api/crawlers/register validates input', async () => {
      const response = await fetch(`${API_URL}/api/crawlers/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: 'T', // Too short
          email: 'not-an-email',
          walletAddress: '0xinvalid'
        })
      });

      assert.strictEqual(response.status, 400);

      const data = await response.json();
      assert.strictEqual(data.error, 'Validation failed');
    });

    test('GET /api/crawlers returns list', async () => {
      const response = await fetch(`${API_URL}/api/crawlers`);
      assert.strictEqual(response.status, 200);

      const data = await response.json();
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.crawlers));
    });
  });

  describe('Payment Routes', () => {
    test('POST /api/payments/log validates tx hash', async () => {
      const response = await fetch(`${API_URL}/api/payments/log`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          txHash: 'invalid-hash',
          crawlerAddress: '0x' + '0'.repeat(40),
          publisherAddress: '0x' + '0'.repeat(40),
          amount: '0.01'
        })
      });

      assert.strictEqual(response.status, 400);

      const data = await response.json();
      assert.strictEqual(data.error, 'Validation failed');
    });

    test('GET /api/payments validates addresses', async () => {
      const response = await fetch(
        `${API_URL}/api/payments?publisherAddress=invalid`
      );

      assert.strictEqual(response.status, 400);

      const data = await response.json();
      assert.strictEqual(data.error, 'Invalid publisher address');
    });
  });

  describe('Dashboard Routes', () => {
    test('GET /api/dashboard/stats/:address validates address', async () => {
      const response = await fetch(`${API_URL}/api/dashboard/stats/invalid-address`);

      assert.strictEqual(response.status, 400);

      const data = await response.json();
      assert.strictEqual(data.error, 'Invalid publisher address');
    });

    test('GET /api/dashboard/requests/:address validates address', async () => {
      const response = await fetch(`${API_URL}/api/dashboard/requests/not-an-address`);

      assert.strictEqual(response.status, 400);
    });

    test('GET /api/dashboard/revenue/:address validates address', async () => {
      const response = await fetch(`${API_URL}/api/dashboard/revenue/0xinvalid`);

      assert.strictEqual(response.status, 400);
    });
  });

  describe('Rate Limiting', () => {
    test('API rate limits requests', async () => {
      // Make 65 rapid requests to exceed limit
      const promises = Array(65).fill(null).map(() =>
        fetch(`${API_URL}/health`)
      );

      const responses = await Promise.all(promises);
      const rateLimited = responses.some(r => r.status === 429);

      assert.ok(rateLimited, 'Should rate limit after 60 requests per minute');
    });
  });

  describe('Error Handling', () => {
    test('404 for unknown routes', async () => {
      const response = await fetch(`${API_URL}/api/nonexistent`);
      assert.strictEqual(response.status, 404);
    });

    test('Returns JSON error responses', async () => {
      const response = await fetch(`${API_URL}/api/publishers/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: 'invalid json'
      });

      assert.ok(response.status >= 400);
      const contentType = response.headers.get('content-type');
      assert.ok(contentType?.includes('application/json'));
    });
  });
});
