# Tachi Protocol Developer Portal

A comprehensive developer portal for the Tachi Protocol that provides secure API key management, usage analytics, and account management for AI companies and developers.

## ✨ Features

### 🔐 **Secure API Key Management**
- Create, view, and delete API keys
- Secure key hashing with bcrypt (12 salt rounds)
- One-time key display with copy-to-clipboard
- Key prefix identification for easy management
- 10 API keys per user limit

### 📊 **Usage Analytics & Monitoring**
- Real-time usage statistics
- Monthly request tracking
- Success rate monitoring
- Rate limiting information
- Historical usage data

### 👤 **User Profile Management**
- Company information management
- Wallet address integration
- Contact details and website
- Account preferences

### 🛡️ **Security Features**
- Session-based authentication
- API key hashing and secure storage
- Request rate limiting
- Usage monitoring and alerts
- Single-display security policy

## 🏗️ Architecture

### Database Schema (Prisma)
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  company       String?
  website       String?
  walletAddress String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  apiKeys  ApiKey[]
  accounts Account[]
  sessions Session[]
}

model ApiKey {
  id              String    @id @default(cuid())
  userId          String
  name            String
  keyHash         String    // bcrypt hashed key
  keyPrefix       String    // First 16 chars for identification
  totalRequests   Int       @default(0)
  monthlyRequests Int       @default(0)
  lastUsedAt      DateTime?
  expiresAt       DateTime?
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### API Endpoints

#### **POST /api/keys/create**
Create a new API key
```typescript
// Request
{
  "name": "My API Key"
}

// Response
{
  "success": true,
  "apiKey": {
    "id": "...",
    "name": "My API Key",
    "prefix": "sk_test_1234567890...",
    "key": "sk_test_1234567890abcdef...", // Only on creation
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastUsedAt": null,
    "totalRequests": 0,
    "monthlyRequests": 0
  }
}
```

#### **GET /api/keys/create**
List user's API keys
```typescript
// Response
{
  "success": true,
  "apiKeys": [
    {
      "id": "...",
      "name": "My API Key",
      "prefix": "sk_test_1234567890...",
      "totalRequests": 150,
      "monthlyRequests": 45,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastUsedAt": "2024-01-02T12:34:56.000Z"
    }
  ]
}
```

#### **DELETE /api/keys/[id]**
Delete an API key
```typescript
// Response
{
  "success": true,
  "message": "API key deleted successfully"
}
```

## 🚀 Usage

### For Developers

1. **Access the Developer Portal**
   ```
   http://localhost:3003/developer-portal
   ```

2. **Create an API Key**
   - Navigate to the "API Keys" tab
   - Click "Create New API Key"
   - Enter a descriptive name
   - **Important**: Save the key immediately - it's only shown once!

3. **Use Your API Key**
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" \
        https://api.tachi.com/v1/crawl
   ```

### For AI Companies

The developer portal is specifically designed for AI companies that need:
- **Automated Web Crawling**: Pay-per-request crawling services
- **Scalable Infrastructure**: Handle high-volume requests
- **Usage Monitoring**: Track and optimize crawling costs
- **Secure Access**: Enterprise-grade security standards

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- pnpm 8+
- PostgreSQL (or mock database for development)

### Installation
```bash
# Install dependencies
pnpm install

# Install required packages
pnpm add bcryptjs @radix-ui/react-dialog

# Start development server
pnpm dev
```

### Environment Variables
```bash
# .env.local
WALLETCONNECT_PROJECT_ID=your_project_id
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3003
```

### Mock Development
For development, the portal uses mock authentication and database:
- **Mock Auth**: `src/lib/auth.ts`
- **Mock Database**: `src/lib/mock-prisma.ts`

## 📁 File Structure

```
src/
├── app/
│   ├── developer-portal/
│   │   └── page.tsx              # Main portal page
│   └── api/
│       └── keys/
│           ├── create/route.ts   # Create/list API keys
│           └── [id]/route.ts     # Delete API key
├── components/
│   ├── api-key-manager-simple.tsx   # API key management UI
│   └── ui/                          # Reusable UI components
├── lib/
│   ├── auth.ts                      # Mock authentication
│   └── mock-prisma.ts               # Mock database
└── types/
    └── bcryptjs.d.ts                # bcryptjs type declarations
```

## 🛡️ Security Best Practices

### API Key Security
1. **Hashing**: All keys are hashed with bcrypt (12 salt rounds)
2. **One-time Display**: Keys are only shown once during creation
3. **Prefix Storage**: Only key prefixes are stored for identification
4. **Secure Storage**: Never store raw keys in the database

### Authentication
1. **Session Management**: Secure session handling
2. **Rate Limiting**: Request rate limiting per user
3. **Input Validation**: All inputs are validated and sanitized
4. **CORS Protection**: Proper CORS configuration

### Database Security
1. **Parameterized Queries**: All database queries use parameters
2. **Soft Deletion**: Keys are marked inactive instead of hard deletion
3. **User Isolation**: Users can only access their own keys
4. **Audit Logging**: Usage tracking and monitoring

## 🚀 Production Deployment

### Database Migration
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy
```

### Replace Mock Systems
1. **Authentication**: Replace mock auth with NextAuth
2. **Database**: Replace mock with real Prisma/PostgreSQL
3. **Environment**: Update production environment variables

### Security Checklist
- [ ] Enable HTTPS
- [ ] Set up proper CORS
- [ ] Configure rate limiting
- [ ] Enable database encryption
- [ ] Set up monitoring and alerts
- [ ] Implement backup strategies

## 📊 Analytics & Monitoring

The portal tracks:
- **API Usage**: Request counts and success rates
- **User Activity**: Login patterns and feature usage
- **Performance Metrics**: Response times and error rates
- **Security Events**: Failed authentication attempts

## 🎯 Future Enhancements

- [ ] Two-factor authentication
- [ ] API key expiration dates
- [ ] Usage alerts and notifications
- [ ] Billing and payment integration
- [ ] Advanced analytics dashboard
- [ ] Team collaboration features
- [ ] API key scoping and permissions
- [ ] Webhook integrations

## 📝 License

Copyright © 2024 Tachi Protocol. All rights reserved.
