# Tachi Pay-Per-Crawl API

A robust Node.js API server that enables publishers to monetize their content and AI companies/crawlers to access premium content through a pay-per-request model.

## 🚀 Features

- **Publisher Management**: Register websites, set pricing, track earnings
- **Crawler Authentication**: API key-based authentication with JWT tokens
- **Content Serving**: Secure content delivery with payment verification
- **Payment Processing**: Stripe integration for credit purchases
- **Analytics Dashboard**: Comprehensive usage and revenue analytics
- **Rate Limiting**: Configurable rate limits for API protection
- **Database Integration**: Supabase/PostgreSQL for data persistence

## 📋 Prerequisites

- Node.js 18.x or higher
- PNPM (recommended) or npm
- Supabase account and project
- Stripe account for payment processing

## 🛠️ Installation

1. **Install dependencies**:
   ```bash
   cd packages/api
   pnpm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual configuration
   ```

3. **Set up database**:
   - Create a new Supabase project
   - Run the SQL schema in `database/schema.sql`
   - Configure RLS policies as needed

4. **Start the development server**:
   ```bash
   pnpm dev
   ```

## 🏗️ API Endpoints

### Health Check
- `GET /health` - Server health status

### Publishers
- `POST /api/publishers/register` - Register a new publisher
- `GET /api/publishers/profile/:id` - Get publisher profile
- `PUT /api/publishers/profile/:id` - Update publisher profile
- `GET /api/publishers/directory` - Public publisher directory

### Crawlers/AI Companies
- `POST /api/crawlers/register` - Register a new crawler
- `POST /api/crawlers/auth` - Authenticate with API key
- `GET /api/crawlers/profile/:id` - Get crawler profile
- `POST /api/crawlers/credits/add` - Add credits to account

### Content Serving
- `GET /api/content/:domain/*` - Serve content with payment verification
- `GET /api/content/pricing/:domain` - Get pricing for domain
- `POST /api/content/batch` - Batch content requests

### Payments
- `POST /api/payments/create-payment-intent` - Create Stripe payment intent
- `POST /api/payments/webhook` - Stripe webhook handler
- `GET /api/payments/history` - Payment history
- `GET /api/payments/balance` - Current credit balance
- `POST /api/payments/setup-payout` - Publisher payout setup

### Analytics
- `GET /api/analytics/crawler/:id` - Crawler usage analytics
- `GET /api/analytics/publisher/:id` - Publisher earnings analytics
- `GET /api/analytics/platform` - Platform-wide analytics (admin)

## 🔐 Authentication

The API uses a two-step authentication process:

1. **API Key Registration**: Crawlers register and receive an API key
2. **JWT Token**: Use API key to get a JWT token for requests

```javascript
// Step 1: Register crawler
const response = await fetch('/api/crawlers/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'crawler@company.com',
    companyName: 'AI Company',
    type: 'startup'
  })
});
const { apiKey } = await response.json();

// Step 2: Get JWT token
const authResponse = await fetch('/api/crawlers/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ apiKey })
});
const { token } = await authResponse.json();

// Step 3: Use token for requests
const contentResponse = await fetch('/api/content/example.com/article', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## 💳 Payment Flow

1. **Credit Purchase**: Crawlers buy credits via Stripe
2. **Content Request**: Each request deducts credits based on publisher pricing
3. **Revenue Distribution**: Publishers earn from content access
4. **Analytics**: Track usage and earnings in real-time

## 📊 Database Schema

The API uses PostgreSQL (via Supabase) with the following main tables:

- `publishers` - Publisher profiles and settings
- `crawlers` - Crawler/AI company accounts
- `transactions` - Individual content requests
- `payments` - Credit purchases via Stripe
- `usage_analytics` - Aggregated usage statistics

## 🔧 Configuration

Key environment variables:

```bash
# Server
PORT=3001
NODE_ENV=development

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Security
JWT_SECRET=your_jwt_secret
```

## 🏃‍♂️ Usage Examples

### Register a Publisher
```bash
curl -X POST http://localhost:3001/api/publishers/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "publisher@example.com",
    "name": "Example News",
    "domain": "example.com",
    "pricePerRequest": 0.002
  }'
```

### Crawl Content
```bash
curl -X GET http://localhost:3001/api/content/example.com/article \
  -H "Authorization: Bearer your_jwt_token"
```

### Get Analytics
```bash
curl -X GET http://localhost:3001/api/analytics/crawler/crawler_id?period=7d \
  -H "Authorization: Bearer your_jwt_token"
```

## 🚦 Rate Limits

- **General API**: 100 requests per 15 minutes
- **Content Serving**: 60 requests per minute
- **Configurable** via environment variables

## 📈 Monitoring & Logging

- **Winston** for structured logging
- **Health check** endpoint for monitoring
- **Error tracking** with detailed error responses
- **Request analytics** for usage insights

## 🔒 Security Features

- **Helmet** for HTTP security headers
- **CORS** protection with configurable origins
- **Rate limiting** to prevent abuse
- **JWT** authentication with expiration
- **API key** hashing with bcrypt
- **Input validation** with Joi schemas

## 🐛 Error Handling

The API returns structured error responses:

```json
{
  "error": "Insufficient credits",
  "required": 0.002,
  "available": 0.001,
  "message": "Please add credits to your account"
}
```

## 📝 API Documentation

Full API documentation is available at:
- **Local**: `GET http://localhost:3001/api/docs`
- **Interactive**: Use tools like Postman or curl for testing

## 🤝 Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation as needed
4. Ensure all environment variables are documented

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
- Check the API documentation at `/api/docs`
- Review error messages for specific guidance
- Monitor logs for debugging information
