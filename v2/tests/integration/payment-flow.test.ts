import {test, describe} from 'node:test';
import assert from 'node:assert';

/**
 * Integration tests for payment flow
 * Tests: SDK payment → Gateway verification → Content return
 */

const GATEWAY_URL = process.env.GATEWAY_URL || 'https://tachi-gateway.jgrahamsport16.workers.dev';
const TEST_CONTENT_PATH = '/article/ai-training';

describe('Payment Flow Integration', () => {
  test('Gateway returns 402 Payment Required without payment', async () => {
    const response = await fetch(`${GATEWAY_URL}${TEST_CONTENT_PATH}`);

    assert.strictEqual(response.status, 402, 'Should return 402 without payment');

    const data = await response.json();
    assert.strictEqual(data.error, 'Payment required');
    assert.ok(data.payment, 'Should include payment details');
    assert.ok(data.payment.recipient, 'Should include recipient address');
    assert.ok(data.payment.amount, 'Should include amount');
  });

  test('Gateway returns 402 with invalid payment hash', async () => {
    const invalidTxHash = '0x' + '0'.repeat(64);
    const response = await fetch(`${GATEWAY_URL}${TEST_CONTENT_PATH}`, {
      headers: {
        Authorization: `Bearer ${invalidTxHash}`
      }
    });

    assert.strictEqual(response.status, 402, 'Should return 402 with invalid payment');

    const data = await response.json();
    assert.strictEqual(data.error, 'Payment verification failed');
  });

  test('Gateway validates payment transaction structure', async () => {
    // Test with malformed tx hash
    const response = await fetch(`${GATEWAY_URL}${TEST_CONTENT_PATH}`, {
      headers: {
        Authorization: 'Bearer invalid-hash'
      }
    });

    assert.strictEqual(response.status, 402, 'Should reject malformed hash');
  });

  test('Gateway includes correct CORS headers', async () => {
    const response = await fetch(`${GATEWAY_URL}${TEST_CONTENT_PATH}`);

    assert.ok(
      response.headers.get('access-control-allow-origin'),
      'Should include CORS headers'
    );
  });

  test('Gateway health check works', async () => {
    const response = await fetch(`${GATEWAY_URL}/health`);
    assert.strictEqual(response.status, 200, 'Health check should return 200');

    const data = await response.json();
    assert.strictEqual(data.status, 'ok');
    assert.strictEqual(data.service, 'Tachi Gateway');
  });

  test('Gateway returns catalog', async () => {
    const response = await fetch(`${GATEWAY_URL}/catalog`);
    assert.strictEqual(response.status, 200);

    const data = await response.json();
    assert.ok(Array.isArray(data.catalog), 'Should return catalog array');
    assert.ok(data.catalog.length > 0, 'Catalog should not be empty');
    assert.ok(data.catalog[0].path, 'Catalog items should have path');
    assert.ok(data.catalog[0].price, 'Catalog items should have price');
  });

  test('Gateway rate limiting', async () => {
    // Make multiple rapid requests to test rate limiting
    const promises = Array(105).fill(null).map(() =>
      fetch(`${GATEWAY_URL}/health`)
    );

    const responses = await Promise.all(promises);
    const rateLimited = responses.some(r => r.status === 429);

    assert.ok(rateLimited, 'Should rate limit after 100 requests');
  });
});

// Note: Testing with real USDC payment requires running mainnet test script
// See: tests/mainnet/real-usdc-test.ts
