# Better Uptime Configuration for Tachi Protocol

## Monitoring Strategy

### 1. HTTP Endpoint Monitoring

#### Dashboard Availability
```yaml
Monitor Type: HTTP
URL: https://dashboard.tachiprotocol.com
Check Frequency: 30 seconds
Locations: Multiple (US-East, EU-West, Asia-Pacific)
Expected Status: 200
Timeout: 10 seconds

Failure Conditions:
- HTTP status code ≠ 200
- Response time > 5 seconds
- SSL certificate expiring in < 7 days
```

#### API Health Checks
```yaml
Monitor Type: HTTP
URL: https://dashboard.tachiprotocol.com/api/health
Method: GET
Check Frequency: 60 seconds
Expected Response: {"status": "healthy", "timestamp": "..."}

Advanced Checks:
- JSON response validation
- Database connectivity check
- External service dependencies
```

#### Gateway Worker Health
```yaml
Monitor Type: HTTP  
URL: https://gateway.tachiprotocol.com/health
Method: GET
Check Frequency: 60 seconds
Expected Response: {"status": "ok", "version": "1.0.0"}

Headers to Include:
- User-Agent: BetterUptime/1.0
- Accept: application/json
```

### 2. Heartbeat Monitoring (Critical Async Processes)

#### Crawl Logging Heartbeat
```javascript
// Cloudflare Worker Implementation
async function logCrawlToBlockchain(crawlData, env) {
  try {
    // 1. Submit transaction to blockchain
    const txHash = await submitLogCrawlTransaction(crawlData);
    
    // 2. Wait for confirmation
    await waitForTransactionConfirmation(txHash);
    
    // 3. Send heartbeat on success
    await fetch(env.BETTER_UPTIME_CRAWL_HEARTBEAT_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Tachi-Gateway-Worker/1.0'
      }
    });
    
    return txHash;
  } catch (error) {
    // Heartbeat will timeout, triggering alert
    console.error('Crawl logging failed:', error);
    throw error;
  }
}
```

#### Heartbeat Configuration
```yaml
Monitor Type: Heartbeat
Name: "Crawl Logging Process"
Expected Frequency: Every 5 minutes
Grace Period: 2 minutes
Alert After: 7 minutes without heartbeat

URL: https://betteruptime.com/api/v1/heartbeat/{unique-token}
Method: GET (triggered by worker)
```

#### Payment Processing Heartbeat
```javascript
// Dashboard API Route: /api/payment/heartbeat
export default async function handler(req, res) {
  try {
    // Check payment processor health
    const paymentProcessor = getPaymentProcessorContract();
    const isHealthy = await paymentProcessor.owner() !== ADDRESS_ZERO;
    
    if (isHealthy) {
      // Send heartbeat
      await fetch(process.env.BETTER_UPTIME_PAYMENT_HEARTBEAT_URL);
      res.status(200).json({ status: 'healthy' });
    } else {
      res.status(500).json({ status: 'unhealthy', reason: 'contract_issue' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
}
```

### 3. Advanced Monitoring Setup

#### Multi-Step Transaction Monitoring
```yaml
Monitor Type: Multi-step
Name: "End-to-End Payment Flow"
Steps:
  1. GET /api/publisher/auth (expect 200)
  2. POST /api/payment/initiate (expect 201)
  3. GET /api/payment/status/{id} (expect 200, status: "completed")
  
Frequency: Every 10 minutes
Locations: US-East, EU-West
```

#### Database Connectivity Check
```yaml
Monitor Type: HTTP
URL: https://dashboard.tachiprotocol.com/api/health/database
Expected Response: {"db_status": "connected", "query_time_ms": < 100}
Check Frequency: 2 minutes
```

#### Blockchain Connectivity Check
```yaml
Monitor Type: HTTP
URL: https://dashboard.tachiprotocol.com/api/health/blockchain
Expected Response: {"rpc_status": "connected", "latest_block": "> 0"}
Check Frequency: 1 minute
```

### 4. Alert Configuration

#### Alert Routing
```yaml
Escalation Policy:
  Level 1 (0-5 min): Slack #alerts-critical
  Level 2 (5-15 min): PagerDuty + SMS to on-call engineer
  Level 3 (15+ min): Escalate to engineering manager

Notification Channels:
  - Slack Integration: #alerts-critical, #alerts-general
  - Email: engineering@tachiprotocol.com
  - SMS: On-call rotation
  - Webhook: Custom incident management system
```

#### Alert Conditions
```yaml
Critical Alerts (Immediate):
  - Dashboard down for > 1 minute
  - Payment API returning 5xx for > 2 minutes
  - Crawl logging heartbeat missed for > 7 minutes
  - SSL certificate expiring in < 24 hours

Warning Alerts (5-minute delay):
  - Response time > 3 seconds for > 5 minutes
  - Error rate > 5% for > 10 minutes
  - Database query time > 500ms for > 5 minutes

Info Alerts (15-minute delay):
  - Response time > 2 seconds for > 15 minutes
  - Maintenance mode activated
  - New deployment detected
```

### 5. Implementation Scripts

#### Setup Script
```bash
#!/bin/bash
# setup-better-uptime.sh

echo "🔧 Setting up Better Uptime monitoring..."

# Environment variables needed
BETTER_UPTIME_API_KEY="your-api-key"
DASHBOARD_URL="https://dashboard.tachiprotocol.com"
GATEWAY_URL="https://gateway.tachiprotocol.com"

# Create HTTP monitors via API
curl -X POST "https://betteruptime.com/api/v2/monitors" \
  -H "Authorization: Bearer ${BETTER_UPTIME_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "monitor_type": "http",
    "url": "'${DASHBOARD_URL}'",
    "check_frequency": 30,
    "call": true,
    "sms": true,
    "email": true,
    "push": true
  }'

# Create heartbeat monitors
curl -X POST "https://betteruptime.com/api/v2/heartbeats" \
  -H "Authorization: Bearer ${BETTER_UPTIME_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Crawl Logging Process",
    "period": 300,
    "grace": 120
  }'

echo "✅ Better Uptime monitors created!"
```

#### Health Check Endpoints
```javascript
// pages/api/health/index.js
export default function handler(req, res) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  };
  
  res.status(200).json(health);
}

// pages/api/health/database.js
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const queryTime = Date.now() - start;
    
    res.status(200).json({
      db_status: 'connected',
      query_time_ms: queryTime
    });
  } catch (error) {
    res.status(500).json({
      db_status: 'error',
      error: error.message
    });
  }
}

// pages/api/health/blockchain.js
import { ethers } from 'ethers';

export default async function handler(req, res) {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const latestBlock = await provider.getBlockNumber();
    
    res.status(200).json({
      rpc_status: 'connected',
      latest_block: latestBlock,
      network: await provider.getNetwork()
    });
  } catch (error) {
    res.status(500).json({
      rpc_status: 'error',
      error: error.message
    });
  }
}
```

### 6. Integration Benefits

#### Proactive Issue Detection
- Service outages detected within 30 seconds
- Failed async processes caught via heartbeat timeouts
- Performance degradation alerts before user impact

#### Comprehensive Coverage
- Frontend availability monitoring
- API endpoint health checks
- Database connectivity verification
- Blockchain RPC connectivity
- SSL certificate expiration tracking

#### Operational Intelligence
- Response time trends and SLA tracking
- Incident correlation with deployments
- Geographic performance variations
- Service dependency mapping
