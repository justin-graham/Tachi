# Sentry Configuration for Tachi Protocol

## Dashboard (Next.js) Integration

### 1. Install Sentry
```bash
cd tachi/packages/dashboard
pnpm add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### 2. Client Configuration (sentry.client.config.js)
```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions
  
  // Session Replay
  replaysSessionSampleRate: 0.01, // 1% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of error sessions
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Custom Error Filtering
  beforeSend(event, hint) {
    // Filter out known non-critical errors
    if (event.exception) {
      const error = hint.originalException;
      
      // Ignore network errors from wallet connections
      if (error?.message?.includes('user rejected transaction')) {
        return null;
      }
      
      // Ignore MetaMask connection errors
      if (error?.message?.includes('MetaMask')) {
        return null;
      }
    }
    
    return event;
  },
  
  // Custom Tags
  initialScope: {
    tags: {
      component: "tachi-dashboard",
      version: process.env.npm_package_version,
    },
  },
});
```

### 3. Server Configuration (sentry.server.config.js)
```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 0.1,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Server-specific configuration
  beforeSend(event, hint) {
    // Log server errors with more context
    if (event.level === 'error') {
      console.error('Server Error:', event);
    }
    
    return event;
  },
  
  integrations: [
    // Database monitoring (if applicable)
    new Sentry.Integrations.Prisma({ client: prisma }),
  ],
});
```

### 4. API Route Instrumentation
```javascript
// Example: pages/api/publisher/[...slug].js
import * as Sentry from "@sentry/nextjs";

export default async function handler(req, res) {
  try {
    // Your API logic here
    const result = await processPublisherRequest(req);
    res.status(200).json(result);
  } catch (error) {
    // Custom error context
    Sentry.withScope((scope) => {
      scope.setTag("api_route", "publisher");
      scope.setContext("request", {
        method: req.method,
        url: req.url,
        userAgent: req.headers["user-agent"],
      });
      scope.setLevel("error");
      Sentry.captureException(error);
    });
    
    res.status(500).json({ error: "Internal server error" });
  }
}
```

## Cloudflare Worker Integration

### 1. Install Sentry for Workers
```bash
cd tachi/packages/gateway-cloudflare
pnpm add @sentry/cloudflare-workers
```

### 2. Worker Instrumentation
```javascript
// src/index.ts
import { Sentry } from '@sentry/cloudflare-workers';

// Initialize Sentry
Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: 'production', // or 'development'
  tracesSampleRate: 0.1,
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return Sentry.withScope(async (scope) => {
      scope.setTag('worker', 'tachi-gateway');
      scope.setContext('request', {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
      });
      
      try {
        // Main worker logic
        const response = await handleRequest(request, env);
        
        // Track successful requests
        scope.setLevel('info');
        scope.addBreadcrumb({
          message: 'Request processed successfully',
          level: 'info',
        });
        
        return response;
      } catch (error) {
        // Capture and re-throw error
        scope.setLevel('error');
        scope.setContext('error_details', {
          timestamp: new Date().toISOString(),
          request_id: crypto.randomUUID(),
        });
        
        Sentry.captureException(error);
        throw error;
      }
    });
  },
};

// Enhanced error handling for critical functions
async function logCrawlToBlockchain(crawlData: CrawlData, env: Env) {
  try {
    const result = await submitLogCrawlTransaction(crawlData, env);
    
    // Success - send heartbeat to Better Uptime
    await fetch(env.BETTER_UPTIME_HEARTBEAT_URL);
    
    return result;
  } catch (error) {
    // Critical error - enhanced Sentry context
    Sentry.withScope((scope) => {
      scope.setTag('function', 'logCrawlToBlockchain');
      scope.setLevel('fatal');
      scope.setContext('crawl_data', crawlData);
      scope.setFingerprint(['crawl-logging-failure']);
      
      Sentry.captureException(error);
    });
    
    throw error;
  }
}
```

### 3. Environment Variables
```bash
# .env.local (Dashboard)
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=your-org
SENTRY_PROJECT=tachi-dashboard

# wrangler.toml (Cloudflare Worker)
[vars]
SENTRY_DSN = "https://your-dsn@sentry.io/project-id"
BETTER_UPTIME_HEARTBEAT_URL = "https://betteruptime.com/api/v1/heartbeat/your-token"
```

## Sentry Dashboard Configuration

### 1. Alert Rules
```javascript
// High-Priority Alerts
- Any error in payment processing functions
- Failed blockchain transactions
- Worker timeout errors
- Database connection failures

// Medium-Priority Alerts  
- API rate limit exceeded
- Wallet connection failures
- UI component render errors

// Low-Priority Alerts
- Performance degradation (>2s response time)
- High error rate (>5% over 1 hour)
```

### 2. Issue Grouping & Fingerprinting
```javascript
// Custom fingerprinting for better error grouping
Sentry.withScope((scope) => {
  scope.setFingerprint([
    'payment-processor-error',
    error.contractAddress,
    error.functionName
  ]);
  Sentry.captureException(error);
});
```

### 3. Performance Monitoring
```javascript
// Track critical user flows
const transaction = Sentry.startTransaction({
  name: "Payment Flow",
  op: "user_action",
});

// Track blockchain interactions
const span = transaction.startChild({
  op: "blockchain_call",
  description: "PaymentProcessor.forwardPayment()",
});

try {
  await paymentProcessor.forwardPayment(amount, publisher);
  span.setStatus("ok");
} catch (error) {
  span.setStatus("internal_error");
  throw error;
} finally {
  span.finish();
  transaction.finish();
}
```

## Integration Benefits

### 1. Real-time Error Detection
- Immediate alerts for payment failures
- Stack traces with source maps
- User session replay for debugging

### 2. Performance Insights
- API response time monitoring
- Database query performance
- Blockchain interaction latency

### 3. User Experience Monitoring
- Error impact on user flows
- Browser/device compatibility issues
- Network connectivity problems

### 4. Operational Intelligence
- Error trends and patterns
- Release impact analysis
- Custom business metrics tracking
