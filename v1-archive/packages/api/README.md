# Tachi Pay-Per-Crawl API (Simplified)

The Tachi API provides a lean pay-per-crawl backend that lets publishers monetize premium content and lets crawlers unlock pages using prepaid credits. The backend is built around a small set of modules (`auth`, `publishers`, `crawlers`, `content`, and `payments`) and Supabase handles persistence.

## Requirements

- Node.js 20+
- PNPM 8+
- Supabase project with tables for `publishers`, `crawlers`, `payments`, and `content_requests`
- Stripe account for credit purchases (optional during development)

## Environment Variables

Create `packages/api/.env` or `.env.local` and define:

| Variable | Description |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `JWT_SECRET` | Secret used to sign crawler auth tokens (32+ chars) |
| `CRAWLER_API_KEY_PREFIX` | Prefix for generated crawler keys (default `ck`) |
| `BCRYPT_ROUNDS` | Hash cost for secrets (default `10`) |
| `DEFAULT_CONTENT_PRICE` | Credits charged when publisher price is missing (default `1`) |
| `CONTENT_FETCH_TIMEOUT` | Milliseconds before a content request times out (default `15000`) |
| `STRIPE_SECRET_KEY` | Stripe secret for creating payment intents |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret for payment confirmation |
| `CORS_ORIGINS` | Comma-separated list of allowed origins (`http://localhost:3000` by default) |

## Getting Started

```bash
cd packages/api
pnpm install
pnpm dev
```

The dev server runs on `http://localhost:3001`. Use `/health` to confirm the service is up.

## Supabase Tables

The API expects the following tables (simplified schema):

- `publishers` (`id`, `name`, `domain`, `email`, `price_per_request`, `management_token_hash`, `status`, `created_at`, `updated_at`)
- `crawlers` (`id`, `name`, `email`, `company`, `type`, `credits`, `api_key_id`, `api_key_secret_hash`, `last_authenticated_at`, `created_at`, `updated_at`)
- `payments` (`id`, `crawler_id`, `amount_cents`, `currency`, `status`, `stripe_payment_intent_id`, `confirmed_at`, `created_at`)
- `content_requests` (`id`, `crawler_id`, `publisher_id`, `url`, `status`, `response_status`, `response_time_ms`, `price_paid`, `error_message`, `fetched_at`)

Foreign keys are optional but recommended.

## API Overview

All responses are JSON and require a Bearer token unless noted. Obtain a crawler token by exchanging an API key with `/api/auth/token`.

### Crawlers

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/crawlers/register` | Create a crawler and receive an API key |
| `POST` | `/api/crawlers/auth` | Exchange an API key for a short-lived Bearer token |
| `GET` | `/api/crawlers/profile/:id` | Fetch crawler profile (auth required) |
| `POST` | `/api/crawlers/credits/add` | Manually add credits (auth required) |

### Auth

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/auth/token` | Exchange an API key for a Bearer token |

### Publishers

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/publishers/directory` | Public list of active publishers |
| `GET` | `/api/publishers/profile/:id` | Detailed publisher profile |
| `POST` | `/api/publishers/register` | Register a publisher and receive a management token |
| `PUT` | `/api/publishers/profile/:id` | Update publisher details (requires management token) |

### Content

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/content/pricing/:domain` | Retrieve current price per request for a domain |
| `GET` | `/api/content/:domain/*` | Fetch content, deducting credits (auth required) |
| `POST` | `/api/content/batch` | Fetch multiple URLs sequentially (auth required) |

`GET /api/content/:domain/*` expects the target URL as part of the path and query string. Credits are deducted before the fetch; if the origin request fails, credits are refunded automatically.

### Payments

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/payments/create-payment-intent` | Create a Stripe PaymentIntent (auth required) |
| `POST` | `/api/payments/webhook` | Stripe webhook endpoint (raw body) |
| `GET` | `/api/payments/history` | List recent payments for the crawler (auth required) |
| `GET` | `/api/payments/balance` | Return crawler credit balance (auth required) |

When a Stripe payment succeeds, credits equal to the charged amount (in USD) are added to the crawler account.

## Gateway Adapters

- `@tachi/gateway-core` exposes the reusable crawl engine.
- `@tachi/gateway-cloudflare` and `@tachi/gateway-vercel` provide thin wrappers using the same core logic. Both accept a `url` query parameter plus optional `publisherAddress`, `crawlTokenId`, and `crawlerAddress`.

## Development Tips

- Use `CORS_ORIGINS` to whitelist local dashboards.
- Rotate crawler API keys by updating the crawler record in Supabase.
- Stripe webhooks need the raw body; when testing locally, proxy through `stripe listen`.
- Credits are stored as decimals—round to four decimal places when displaying to users.

## License

MIT © Tachi Protocol
