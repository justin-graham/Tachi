# Tachi Protocol - Production Deployment Checklist

This checklist ensures safe and successful production deployments of the Tachi Protocol Cloudflare Gateway.

## 🚀 Pre-Deployment Checklist

### 📋 Code Quality
- [ ] All tests passing locally (`npm test`)
- [ ] TypeScript compilation successful (`npm run build`)
- [ ] ESLint checks passing (`npm run lint`)
- [ ] Code reviewed and approved
- [ ] Security audit completed (if applicable)

### 🔧 Environment Configuration
- [ ] Production contract addresses verified
- [ ] Base mainnet RPC URL configured and tested
- [ ] USDC mainnet address verified (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`)
- [ ] All environment variables set correctly
- [ ] Pricing configuration reviewed (`PRICE_USDC`)

### 🔐 Security Verification
- [ ] Production private key stored securely
- [ ] Private key has sufficient ETH balance for gas
- [ ] Multi-signature wallet ownership confirmed
- [ ] Emergency procedures documented and accessible
- [ ] Secrets rotation schedule established

### 🌐 Infrastructure Setup
- [ ] Cloudflare domain configured (`mydapp.com`)
- [ ] DNS records properly set
- [ ] SSL/TLS certificates active
- [ ] CDN configuration optimized
- [ ] Rate limiting configured

### 📊 Monitoring & Observability
- [ ] Sentry production project configured
- [ ] Better Uptime monitors set up
- [ ] Health check endpoints verified
- [ ] Log aggregation configured
- [ ] Alert thresholds established

## 🧪 Staging Verification

### 🔍 Functional Testing
- [ ] Health endpoints responding (`/health`, `/health/detailed`)
- [ ] Crawler API functional testing
- [ ] Payment processing verification
- [ ] NFT minting verification
- [ ] Error handling validation

### 📈 Performance Testing
- [ ] Load testing completed
- [ ] Response time within SLA (< 2s)
- [ ] Memory usage acceptable
- [ ] CPU utilization reasonable
- [ ] Concurrent request handling verified

### 🔗 Integration Testing
- [ ] Smart contract interactions working
- [ ] IPFS uploads successful
- [ ] External API integrations functional
- [ ] Database operations (if applicable)
- [ ] Webhook notifications working

## 🚦 Deployment Process

### 1. Final Pre-Deployment Checks
```bash
# Verify staging is working
curl https://staging.mydapp.com/health

# Run final tests
npm run test:production

# Verify contract addresses
npm run verify:contracts

# Check secret configuration
wrangler secret list --env production
```

### 2. Deploy to Production
```bash
# Navigate to gateway directory
cd tachi/packages/gateway-cloudflare

# Deploy to production
wrangler deploy --env production
```

### 3. Post-Deployment Verification
```bash
# Verify deployment successful
curl https://mydapp.com/health

# Test basic functionality
curl -X POST https://mydapp.com/api/crawl \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "type": "standard"}'

# Check monitoring systems
curl https://mydapp.com/health/detailed
```

## 📊 Production Monitoring

### 🎯 Key Metrics to Monitor
- [ ] Response time (target: < 2 seconds)
- [ ] Error rate (target: < 1%)
- [ ] Uptime (target: 99.9%)
- [ ] Contract interaction success rate
- [ ] Gas usage and costs
- [ ] IPFS upload success rate

### 🚨 Critical Alerts
- [ ] Gateway down/unreachable
- [ ] High error rate (> 5%)
- [ ] Slow response times (> 5 seconds)
- [ ] Contract interaction failures
- [ ] Private key balance low
- [ ] RPC endpoint failures

### 📱 Alert Channels
- [ ] PagerDuty/OpsGenie configured
- [ ] Slack notifications active
- [ ] Email alerts set up
- [ ] SMS alerts for critical issues
- [ ] Escalation procedures documented

## 🔄 Post-Deployment Tasks

### ✅ Immediate (0-1 hour)
- [ ] Monitor initial traffic and responses
- [ ] Verify all endpoints accessible
- [ ] Check error rates and logs
- [ ] Confirm monitoring systems active
- [ ] Test core functionality manually

### 📊 Short-term (1-24 hours)
- [ ] Review performance metrics
- [ ] Monitor gas usage patterns
- [ ] Check user feedback/issues
- [ ] Verify automatic processes
- [ ] Update documentation if needed

### 📈 Medium-term (1-7 days)
- [ ] Analyze usage patterns
- [ ] Review cost efficiency
- [ ] Optimize performance if needed
- [ ] Plan next iteration
- [ ] Update capacity planning

## 🔙 Rollback Procedures

### 🚨 When to Rollback
- Critical functionality broken
- Security vulnerability discovered
- Performance severely degraded
- High error rates (> 10%)
- Contract interaction failures

### 🔄 Rollback Process
```bash
# Quick rollback to previous version
wrangler rollback --env production

# Or deploy specific previous version
git checkout <previous-commit>
wrangler deploy --env production

# Verify rollback successful
curl https://mydapp.com/health
```

### 📋 Post-Rollback Actions
- [ ] Notify stakeholders
- [ ] Document issues encountered
- [ ] Plan fix implementation
- [ ] Update testing procedures
- [ ] Schedule next deployment

## 🛡️ Security Incident Response

### 🚨 Security Incident Detected
1. **Immediate Response**
   - [ ] Assess severity and impact
   - [ ] Isolate affected systems
   - [ ] Notify security team
   - [ ] Document timeline

2. **Containment**
   - [ ] Stop affected processes
   - [ ] Revoke compromised credentials
   - [ ] Block malicious traffic
   - [ ] Preserve evidence

3. **Recovery**
   - [ ] Deploy security patches
   - [ ] Rotate all secrets
   - [ ] Verify system integrity
   - [ ] Resume normal operations

4. **Post-Incident**
   - [ ] Conduct post-mortem
   - [ ] Update security procedures
   - [ ] Implement additional safeguards
   - [ ] Train team on lessons learned

## 📞 Emergency Contacts

### 🎯 Primary Contacts
- **Tech Lead**: [Contact Info]
- **DevOps Engineer**: [Contact Info]
- **Security Officer**: [Contact Info]
- **Product Manager**: [Contact Info]

### 🏢 External Services
- **Cloudflare Support**: [Support Portal]
- **Alchemy Support**: [Support Contact]
- **Base Network**: [Support Channel]
- **Sentry Support**: [Support Info]

## 📚 Related Documentation

- [Environment Setup Guide](./ENVIRONMENT_SETUP_GUIDE.md)
- [Secure Ownership Guide](../contracts/SECURE_OWNERSHIP_GUIDE.md)
- [Multi-Signature Setup Guide](../contracts/MULTISIG_SETUP_GUIDE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

---

**Remember**: Production deployments should always be planned, tested, and executed with proper oversight. When in doubt, consult with the team and follow the established change management process.
