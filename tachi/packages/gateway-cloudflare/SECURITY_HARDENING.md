# Gateway Security Hardening Documentation

## Overview

The Tachi Protocol Cloudflare Worker gateway has been enhanced with comprehensive security features to protect against common web vulnerabilities and abuse. This document outlines the implemented security measures.

## 🛡️ Security Features Implemented

### 1. **Rate Limiting**

#### Cloudflare Rate Limiter Integration
- **Primary**: Uses Cloudflare's native Rate Limiter API binding
- **Fallback**: KV-based rate limiting for reliability
- **Default Limit**: 100 requests per minute per IP
- **Response**: HTTP 429 with proper rate limit headers

#### Configuration
```toml
# wrangler.toml
[[rate_limiting]]
binding = "RATE_LIMITER"
```

#### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
Retry-After: 60
```

### 2. **Security Headers**

All responses include comprehensive security headers:

#### Transport Security
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

#### Content Protection
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; media-src 'self'; child-src 'none';
```

#### Additional Security
```
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

### 3. **Request Validation**

#### Size Limiting
- **Default**: 1MB maximum request size
- **Configurable**: Via `MAX_REQUEST_SIZE` environment variable
- **Response**: HTTP 413 for oversized requests

#### Input Sanitization
- User-Agent string sanitization
- Authorization header validation
- Removal of dangerous characters and scripts

### 4. **Enhanced Error Responses**

#### Security Headers in Errors
All error responses include the same security headers as successful responses.

#### Rate Limit Errors
```json
{
  "error": "Rate limit exceeded",
  "details": "Rate limit of 100 requests per minute exceeded"
}
```

#### Headers
```
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640995200
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
```

### 5. **CORS Security**

CORS preflight responses include security headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
```

## 🔧 Configuration

### Environment Variables

```bash
# Rate limiting
RATE_LIMIT_REQUESTS=100          # requests per minute
MAX_REQUEST_SIZE=1048576         # 1MB in bytes

# Security
ENABLE_LOGGING=true              # Enable security logging

# Environment
ENVIRONMENT=production           # Controls error detail exposure
```

### Wrangler Configuration

```toml
# Rate Limiter binding
[[rate_limiting]]
binding = "RATE_LIMITER"

# KV namespace for fallback rate limiting
[[kv_namespaces]]
binding = "USED_TX_HASHES"
id = "your-kv-namespace-id"
```

## 🧪 Testing

### Security Test Suite

Run the comprehensive security test suite:

```bash
# Test with local development server
pnpm test:security:local

# Test against deployed worker
pnpm test:security
```

### Test Coverage

The security test suite validates:

1. **Security Headers**: All required headers present and properly configured
2. **Rate Limiting**: Proper 429 responses with correct headers
3. **CORS Security**: Security headers in preflight responses
4. **Request Size Limits**: Large request rejection
5. **Error Response Security**: Security headers in error responses

### Example Test Output

```
🛡️  Tachi Protocol Gateway Security Test Suite
================================================
Testing gateway at: http://localhost:8787

🔒 Testing Security Headers
✅ Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
✅ X-Content-Type-Options: nosniff
✅ X-Frame-Options: DENY
✅ Content-Security-Policy: default-src 'self'; ...
✅ HSTS properly configured with 1-year max-age
✅ X-Frame-Options set to DENY
✅ X-Content-Type-Options set to nosniff

Security Headers: 7/7 tests passed

🚦 Testing Rate Limiting
Sending 15 rapid requests...
✅ 10 requests succeeded
⚠️  5 requests rate limited (429)
✅ Rate limiting is working
✅ Retry-After header set correctly

📊 Test Results Summary
=======================
✅ PASS Security Headers
✅ PASS Rate Limiting
✅ PASS CORS Security
✅ PASS Request Size Limits
✅ PASS Error Response Security

Overall: 5/5 tests passed

🎉 All security tests passed! Gateway is properly hardened.
```

## 🚀 Deployment Checklist

### Pre-deployment

- [ ] Configure `RATE_LIMITER` binding in production
- [ ] Set appropriate `RATE_LIMIT_REQUESTS` for production load
- [ ] Configure KV namespace for rate limiting fallback
- [ ] Set `ENVIRONMENT=production` to limit error exposure
- [ ] Enable security logging with `ENABLE_LOGGING=true`

### Post-deployment

- [ ] Run security test suite against production
- [ ] Monitor rate limiting effectiveness
- [ ] Review security logs for anomalies
- [ ] Test CORS functionality with real clients
- [ ] Verify all security headers are present

## 🔍 Monitoring

### Security Metrics

Monitor these metrics to ensure security effectiveness:

1. **Rate Limit Hits**: Number of 429 responses
2. **Large Request Blocks**: Number of 413 responses
3. **Error Rates**: Overall error response patterns
4. **Security Header Coverage**: Percentage of responses with headers

### Logging

Security events logged include:
- Rate limit violations
- Oversized request attempts
- Invalid authorization attempts
- Suspicious user agent patterns

### Alerts

Set up alerts for:
- Unusual rate limit hit patterns
- Spikes in 413 responses
- Missing security headers
- High error rates

## 🔄 Maintenance

### Regular Tasks

1. **Review Rate Limits**: Adjust based on legitimate usage patterns
2. **Update CSP**: Modify Content-Security-Policy as needed
3. **Security Header Updates**: Keep headers current with best practices
4. **Test Suite Updates**: Enhance tests as threats evolve

### Security Updates

1. **Monitor OWASP Guidelines**: Stay current with web security best practices
2. **Cloudflare Features**: Leverage new Cloudflare security features
3. **Dependency Updates**: Keep Cloudflare Workers runtime updated
4. **Penetration Testing**: Regular security assessments

## ⚠️ Known Limitations

1. **Rate Limiting Granularity**: Per-IP rate limiting may affect legitimate users behind NAT
2. **CSP Strictness**: Very strict CSP may require adjustments for some integrations
3. **Error Information**: Production mode limits error details for security

## 📚 References

- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [Cloudflare Rate Limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [HTTP Security Headers](https://securityheaders.com/)

## 🆘 Troubleshooting

### Common Issues

**Rate Limiting Too Strict**
```bash
# Increase rate limit
export RATE_LIMIT_REQUESTS=200
```

**CSP Blocking Resources**
```bash
# Review and adjust CSP in addSecurityHeaders function
```

**Missing Security Headers**
```bash
# Ensure addSecurityHeaders() is called for all responses
```

**Rate Limiter Binding Errors**
```bash
# Check wrangler.toml configuration
# Verify binding is deployed correctly
```
