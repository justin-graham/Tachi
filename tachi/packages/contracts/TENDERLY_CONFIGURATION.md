# Tenderly Configuration for Tachi Protocol

## Project Setup
- **Account:** tachi
- **Project:** project  
- **API Key:** jmX9rCnJMgJ1rt1NhMGPo11lVn0JI6T-

## Deployed Contracts to Monitor

### Base Sepolia (Testnet)
```
PaymentProcessorUpgradeable: 0x5a9c9Aa7feC1DF9f5702BcCEB21492be293E5d5F
ProofOfCrawlLedgerUpgradeable: 0xeC3311cCd41B450a12404E7D14165D0dfa0725c3
TachiMultiSig (Owner): 0x1C5a9A0228efc875484Bca44df3987bB6A2aca23
```

## API Configuration
```bash
# Add contracts to Tenderly project
curl -X POST https://api.tenderly.co/api/v1/account/tachi/project/project/contracts \
  -H "X-Access-Key: jmX9rCnJMgJ1rt1NhMGPo11lVn0JI6T-" \
  -H "Content-Type: application/json" \
  -d '{
    "contracts": [
      {
        "address": "0x5a9c9Aa7feC1DF9f5702BcCEB21492be293E5d5F",
        "network_id": "84532",
        "display_name": "PaymentProcessorUpgradeable"
      },
      {
        "address": "0xeC3311cCd41B450a12404E7D14165D0dfa0725c3",
        "network_id": "84532", 
        "display_name": "ProofOfCrawlLedgerUpgradeable"
      },
      {
        "address": "0x1C5a9A0228efc875484Bca44df3987bB6A2aca23",
        "network_id": "84532",
        "display_name": "TachiMultiSig"
      }
    ]
  }'
```

## Alert Rules to Configure

### 1. Payment Processing Alerts
- **Event:** Payment received in PaymentProcessor
- **Condition:** Any failed transaction
- **Severity:** High
- **Notification:** Slack + Email

### 2. Upgrade Alerts  
- **Event:** Contract upgrade attempted
- **Condition:** Any upgrade function call
- **Severity:** Critical
- **Notification:** Slack + PagerDuty

### 3. Multi-Sig Alerts
- **Event:** Multi-sig transaction
- **Condition:** Any transaction execution
- **Severity:** Medium
- **Notification:** Slack

### 4. Gas Monitoring
- **Event:** High gas usage
- **Condition:** Gas > 500,000
- **Severity:** Warning
- **Notification:** Slack

## Webhook Configuration
```json
{
  "url": "https://your-dashboard.com/api/tenderly-webhook",
  "events": ["transaction", "contract_call", "alert"],
  "secret": "your-webhook-secret"
}
```
