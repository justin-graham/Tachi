# Tachi API Reference

Complete API documentation for Tachi Protocol v2.

**Base URL:** `https://api.tachi.ai` (or your deployed API URL)

---

## Authentication

Most endpoints accept optional authentication via API key.

```
Authorization: Bearer <api_key>
```

- Crawlers receive an API key during registration
- Publishers can use their wallet address as API key (temporary MVP solution)
- Unauthenticated requests are rate-limited more aggressively

---

## Rate Limiting

- **Limit:** 60 requests per minute per API key (or IP if unauthenticated)
- **Headers:** Rate limit info included in response headers
- **429 Response:** Returns retry-after time in seconds

Example 429 response:
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Try again in 45 seconds.",
  "limit": 60,
  "retryAfter": 45
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error type",
  "message": "Human-readable description",
  "details": [] // Optional: validation errors
}
```

**Common Status Codes:**
- `400` - Bad Request (validation failed)
- `401` - Unauthorized (invalid/missing API key)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## Endpoints

### Health Check

**GET** `/health`

Check API status.

**Response:**
```json
{
  "status": "ok",
  "service": "Tachi API v2",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

### Publishers

#### Register Publisher

**POST** `/api/publishers/register`

Register a new publisher.

**Request Body:**
```json
{
  "domain": "example.com",
  "name": "Example Publisher",
  "email": "publisher@example.com",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "pricePerRequest": 0.01
}
```

**Field Requirements:**
- `domain` (required): Valid domain name
- `name` (required): 2-100 characters
- `email` (required): Valid email
- `walletAddress` (required): Valid Ethereum address (0x + 40 hex chars)
- `pricePerRequest` (optional): 0-1000, defaults to 0.01

**Response (200):**
```json
{
  "success": true,
  "publisher": {
    "id": "uuid",
    "domain": "example.com",
    "name": "Example Publisher",
    "email": "publisher@example.com",
    "wallet_address": "0x...",
    "price_per_request": "0.01",
    "status": "active",
    "total_earnings": "0",
    "total_requests": 0,
    "created_at": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error (400):**
```json
{
  "error": "Validation failed",
  "details": [
    {"field": "email", "message": "Invalid email format"},
    {"field": "walletAddress", "message": "Invalid Ethereum address"}
  ]
}
```

**Error (409):**
```json
{
  "error": "Domain already registered"
}
```

---

#### List Publishers

**GET** `/api/publishers`

Get all active publishers.

**Response:**
```json
{
  "success": true,
  "publishers": [
    {
      "id": "uuid",
      "domain": "example.com",
      "name": "Example Publisher",
      "price_per_request": "0.01",
      "wallet_address": "0x...",
      "total_earnings": "12.50",
      "total_requests": 1250
    }
  ]
}
```

---

#### Get Publisher

**GET** `/api/publishers/:id`

Get publisher by ID.

**Response:**
```json
{
  "success": true,
  "publisher": {
    "id": "uuid",
    "domain": "example.com",
    "name": "Example Publisher",
    "email": "publisher@example.com",
    "wallet_address": "0x...",
    "price_per_request": "0.01",
    "status": "active",
    "total_earnings": "12.50",
    "total_requests": 1250,
    "created_at": "2025-01-15T10:30:00.000Z",
    "updated_at": "2025-01-20T15:45:00.000Z"
  }
}
```

---

#### Update Publisher

**PATCH** `/api/publishers/:id`

Update publisher settings.

**Request Body:**
```json
{
  "name": "New Name",
  "email": "newemail@example.com",
  "pricePerRequest": 0.02
}
```

All fields optional. Only provided fields will be updated.

**Response:**
```json
{
  "success": true,
  "publisher": { /* updated publisher object */ }
}
```

---

### Crawlers

#### Register Crawler

**POST** `/api/crawlers/register`

Register a new crawler and receive API key.

**Request Body:**
```json
{
  "name": "My Crawler Bot",
  "email": "crawler@example.com",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response:**
```json
{
  "success": true,
  "crawler": {
    "id": "uuid",
    "name": "My Crawler Bot",
    "email": "crawler@example.com",
    "wallet_address": "0x...",
    "status": "active",
    "total_spent": "0",
    "total_requests": 0,
    "created_at": "2025-01-15T10:30:00.000Z"
  },
  "apiKey": "tk_abc123def456..."
}
```

**⚠️ Important:** Save the `apiKey` - it's only shown once!

---

#### List Crawlers

**GET** `/api/crawlers`

Get all active crawlers (API keys not included).

---

#### Get Crawler

**GET** `/api/crawlers/:id`

Get crawler by ID (API key not included).

---

### Payments

#### Log Payment

**POST** `/api/payments/log`

Log a payment transaction.

**Request Body:**
```json
{
  "txHash": "0x1234567890abcdef...",
  "crawlerAddress": "0x...",
  "publisherAddress": "0x...",
  "amount": "0.01"
}
```

**Validation:**
- `txHash`: Valid 0x + 64 hex chars
- Addresses: Valid Ethereum addresses
- `amount`: Positive number 0-1000

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "uuid",
    "tx_hash": "0x...",
    "crawler_address": "0x...",
    "publisher_address": "0x...",
    "amount": "0.01",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "onchain_logged": false
  }
}
```

**Error (409):** Payment already logged

---

#### Get Payments

**GET** `/api/payments`

Query payments with optional filters.

**Query Parameters:**
- `publisherAddress` - Filter by publisher
- `crawlerAddress` - Filter by crawler
- `limit` - Max results (default: 50)

**Example:**
```
GET /api/payments?publisherAddress=0x...&limit=100
```

**Response:**
```json
{
  "success": true,
  "payments": [
    {
      "id": "uuid",
      "tx_hash": "0x...",
      "crawler_address": "0x...",
      "publisher_address": "0x...",
      "amount": "0.01",
      "timestamp": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### Dashboard

#### Get Publisher Stats

**GET** `/api/dashboard/stats/:publisherAddress`

Get today's and all-time stats for a publisher.

**Parameters:**
- `publisherAddress` - Valid Ethereum address

**Response:**
```json
{
  "success": true,
  "stats": {
    "todayRequests": 45,
    "todayRevenue": "0.45",
    "totalRequests": 1250,
    "totalRevenue": "12.50",
    "avgPrice": "0.01",
    "activePublishers": 1
  }
}
```

---

#### Get Recent Requests

**GET** `/api/dashboard/requests/:publisherAddress`

Get recent crawl requests for a publisher.

**Query Parameters:**
- `limit` - Max results (default: 50)

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "id": "uuid",
      "tx_hash": "0x...",
      "path": "/article/ai-training",
      "crawler_address": "0x...",
      "timestamp": "2025-01-15T10:30:00.000Z",
      "amount": "0.01"
    }
  ]
}
```

---

#### Get Revenue Data

**GET** `/api/dashboard/revenue/:publisherAddress`

Get daily revenue breakdown.

**Query Parameters:**
- `days` - Number of days (default: 7)

**Response:**
```json
{
  "success": true,
  "revenue": [
    {
      "date": "2025-01-15",
      "amount": 1.25,
      "requests": 125
    },
    {
      "date": "2025-01-16",
      "amount": 2.10,
      "requests": 210
    }
  ]
}
```

---

## SDK Usage

Use the official [@tachiprotocol/sdk](https://www.npmjs.com/package/@tachiprotocol/sdk) for easy integration:

```typescript
import {TachiSDK} from '@tachiprotocol/sdk';

const tachi = new TachiSDK({
  network: 'base',
  privateKey: process.env.PRIVATE_KEY,
  rpcUrl: 'https://mainnet.base.org'
});

// Auto-payment fetch
const response = await tachi.fetch('https://tachi-gateway.com/content');
```

---

## Support

- **Issues:** [GitHub Issues](https://github.com/tachiprotocol/tachi/issues)
- **Docs:** [docs.tachi.ai](https://docs.tachi.ai)
