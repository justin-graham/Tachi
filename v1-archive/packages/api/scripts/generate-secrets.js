#!/usr/bin/env node

/**
 * Security Setup Script for Tachi API
 * Generates cryptographically secure secrets for production deployment
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function generateSecureSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

function generateApiKey(prefix = 'tachi_', length = 32) {
  const randomBytes = crypto.randomBytes(length);
  const key = randomBytes.toString('base64')
    .replace(/[+/=]/g, '')
    .substring(0, length);
  return prefix + key;
}

function generateJWTSecret() {
  // JWT secrets should be at least 256 bits (32 bytes)
  return generateSecureSecret(32);
}

function generateSessionSecret() {
  return generateSecureSecret(32);
}

function generateWebhookSecret() {
  return generateSecureSecret(24);
}

function generateDatabasePassword() {
  // Generate a strong database password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 32; i++) {
    password += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return password;
}

function createSecureEnvFile() {
  const secrets = {
    JWT_SECRET: generateJWTSecret(),
    JWT_REFRESH_SECRET: generateJWTSecret(),
    SESSION_SECRET: generateSessionSecret(),
    WEBHOOK_SECRET: generateWebhookSecret(),
    BACKUP_ENCRYPTION_KEY: generateSecureSecret(32),
    API_MASTER_KEY: generateApiKey('tachi_master_', 48),
    DATABASE_PASSWORD: generateDatabasePassword(),
    REDIS_PASSWORD: generateDatabasePassword(),
    CRYPTO_ENCRYPTION_KEY: generateSecureSecret(32)
  };

  const envPath = path.join(__dirname, '..', '.env.secrets');
  
  let envContent = `# Generated secrets for Tachi API
# Generated on: ${new Date().toISOString()}
# CRITICAL: Keep these secrets secure and never commit to version control!

# JWT Secrets (256-bit minimum)
JWT_SECRET=${secrets.JWT_SECRET}
JWT_REFRESH_SECRET=${secrets.JWT_REFRESH_SECRET}

# Session Management
SESSION_SECRET=${secrets.SESSION_SECRET}

# Webhooks
WEBHOOK_SECRET=${secrets.WEBHOOK_SECRET}

# Database & Cache
DATABASE_PASSWORD=${secrets.DATABASE_PASSWORD}
REDIS_PASSWORD=${secrets.REDIS_PASSWORD}

# Encryption
BACKUP_ENCRYPTION_KEY=${secrets.BACKUP_ENCRYPTION_KEY}
CRYPTO_ENCRYPTION_KEY=${secrets.CRYPTO_ENCRYPTION_KEY}

# API Keys
API_MASTER_KEY=${secrets.API_MASTER_KEY}

# Additional Secure Values
RATE_LIMIT_SECRET=${generateSecureSecret(16)}
CSRF_SECRET=${generateSecureSecret(16)}
`;

  try {
    fs.writeFileSync(envPath, envContent, { mode: 0o600 });
    log(`✓ Secure environment file created: ${envPath}`, 'green');
    return secrets;
  } catch (error) {
    log(`✗ Failed to create secure environment file: ${error.message}`, 'red');
    throw error;
  }
}

function generateSSLCertificateCommand() {
  return `# Generate SSL certificate for development
openssl req -x509 -newkey rsa:4096 -keyout tachi-dev.key -out tachi-dev.crt -days 365 -nodes -subj "/C=US/ST=CA/L=San Francisco/O=Tachi/CN=localhost"

# For production, use Let's Encrypt:
# certbot certonly --nginx -d api.tachi.network`;
}

function generateDockerSecrets() {
  const secrets = {
    jwt_secret: generateJWTSecret(),
    jwt_refresh_secret: generateJWTSecret(),
    session_secret: generateSessionSecret(),
    database_password: generateDatabasePassword(),
    redis_password: generateDatabasePassword()
  };

  const dockerComposePath = path.join(__dirname, '..', 'docker-secrets.yml');
  
  const dockerContent = `# Docker secrets for Tachi API
# Use with: docker-compose -f docker-compose.yml -f docker-secrets.yml up
version: '3.8'

secrets:
  jwt_secret:
    environment: JWT_SECRET
  jwt_refresh_secret:
    environment: JWT_REFRESH_SECRET
  session_secret:
    environment: SESSION_SECRET
  database_password:
    environment: DATABASE_PASSWORD
  redis_password:
    environment: REDIS_PASSWORD

services:
  api:
    secrets:
      - jwt_secret
      - jwt_refresh_secret
      - session_secret
      - database_password
      - redis_password
    environment:
      JWT_SECRET_FILE: /run/secrets/jwt_secret
      JWT_REFRESH_SECRET_FILE: /run/secrets/jwt_refresh_secret
      SESSION_SECRET_FILE: /run/secrets/session_secret
      DATABASE_PASSWORD_FILE: /run/secrets/database_password
      REDIS_PASSWORD_FILE: /run/secrets/redis_password
`;

  try {
    fs.writeFileSync(dockerComposePath, dockerContent);
    log(`✓ Docker secrets file created: ${dockerComposePath}`, 'green');
    
    // Create individual secret files
    const secretsDir = path.join(__dirname, '..', 'secrets');
    if (!fs.existsSync(secretsDir)) {
      fs.mkdirSync(secretsDir, { mode: 0o700 });
    }
    
    Object.entries(secrets).forEach(([key, value]) => {
      const secretPath = path.join(secretsDir, key);
      fs.writeFileSync(secretPath, value, { mode: 0o600 });
    });
    
    log(`✓ Docker secret files created in: ${secretsDir}`, 'green');
  } catch (error) {
    log(`✗ Failed to create Docker secrets: ${error.message}`, 'red');
  }
}

function createSecurityChecklist() {
  const checklistPath = path.join(__dirname, '..', 'SECURITY_CHECKLIST.md');
  
  const checklist = `# Tachi API Security Checklist

## Pre-Production Security Requirements

### Environment & Secrets
- [ ] Generated secure JWT secrets (min 256-bit)
- [ ] Configured unique session secrets
- [ ] Set strong database passwords
- [ ] Configured Redis authentication
- [ ] Set up backup encryption keys
- [ ] Secured all API keys and tokens

### Authentication & Authorization
- [ ] Implemented secure JWT token generation
- [ ] Configured proper token expiration (15min access, 7d refresh)
- [ ] Set up session management and invalidation
- [ ] Implemented rate limiting on auth endpoints
- [ ] Added progressive rate limiting for repeat offenders
- [ ] Configured account lockout policies

### Input Validation & Sanitization
- [ ] Implemented Joi validation on all endpoints
- [ ] Added input sanitization middleware
- [ ] Configured honeypot validation for forms
- [ ] Set up file upload validation and limits
- [ ] Implemented XSS protection

### Database Security
- [ ] Configured SSL/TLS for database connections
- [ ] Implemented connection pooling with limits
- [ ] Set up query parameterization (no SQL injection)
- [ ] Configured database user with minimal privileges
- [ ] Set up regular automated backups

### Network Security
- [ ] Configured HTTPS with strong TLS (min 1.2)
- [ ] Set up proper CORS policies
- [ ] Implemented security headers (HSTS, CSP, etc.)
- [ ] Configured reverse proxy with security features
- [ ] Set up DDoS protection

### Logging & Monitoring
- [ ] Implemented security event logging
- [ ] Set up error tracking (Sentry)
- [ ] Configured performance monitoring
- [ ] Set up automated security alerts
- [ ] Implemented audit logging for sensitive operations

### Data Protection
- [ ] Configured data encryption at rest
- [ ] Implemented secure data transmission
- [ ] Set up PII data protection
- [ ] Configured GDPR compliance features
- [ ] Implemented secure data deletion

### API Security
- [ ] Implemented API key authentication
- [ ] Set up API versioning
- [ ] Configured request/response validation
- [ ] Implemented API rate limiting
- [ ] Set up API documentation with security notes

### Infrastructure Security
- [ ] Secured server access (SSH keys only)
- [ ] Implemented firewall rules
- [ ] Set up intrusion detection
- [ ] Configured automated security updates
- [ ] Implemented container security scanning

### Compliance & Legal
- [ ] Implemented terms of service acceptance tracking
- [ ] Set up privacy policy compliance
- [ ] Configured user consent management
- [ ] Implemented data retention policies
- [ ] Set up user data export functionality

### Testing & Validation
- [ ] Performed security penetration testing
- [ ] Conducted code security review
- [ ] Tested authentication flows
- [ ] Validated rate limiting effectiveness
- [ ] Tested input validation boundaries

### Deployment Security
- [ ] Secured CI/CD pipeline
- [ ] Implemented secure deployment process
- [ ] Set up environment separation
- [ ] Configured secure secret management
- [ ] Implemented rollback procedures

### Incident Response
- [ ] Created incident response plan
- [ ] Set up security contact information
- [ ] Implemented breach notification procedures
- [ ] Configured emergency access procedures
- [ ] Set up forensic logging

## Post-Deployment Monitoring

### Daily Checks
- [ ] Review security logs for anomalies
- [ ] Monitor failed authentication attempts
- [ ] Check rate limiting effectiveness
- [ ] Verify SSL certificate status

### Weekly Checks
- [ ] Review user access patterns
- [ ] Check for new security vulnerabilities
- [ ] Monitor system performance metrics
- [ ] Review backup integrity

### Monthly Checks
- [ ] Rotate API keys and secrets
- [ ] Update security dependencies
- [ ] Review access control policies
- [ ] Conduct security metrics review

### Quarterly Checks
- [ ] Perform security assessment
- [ ] Review and update security policies
- [ ] Conduct employee security training
- [ ] Test incident response procedures

## Emergency Contacts

- Security Team: security@tachi.network
- Infrastructure Team: infra@tachi.network
- Legal Team: legal@tachi.network
- Emergency Hotline: +1-XXX-XXX-XXXX

## Security Tools & Resources

- Vulnerability Database: https://nvd.nist.gov/
- Security Headers Test: https://securityheaders.com/
- SSL Test: https://www.ssllabs.com/ssltest/
- OWASP Resources: https://owasp.org/

---
Generated on: ${new Date().toISOString()}
`;

  try {
    fs.writeFileSync(checklistPath, checklist);
    log(`✓ Security checklist created: ${checklistPath}`, 'green');
  } catch (error) {
    log(`✗ Failed to create security checklist: ${error.message}`, 'red');
  }
}

// Main execution
function main() {
  log('\n🔒 Tachi API Security Setup', 'cyan');
  log('=' .repeat(50), 'cyan');
  
  try {
    log('\n1. Generating secure secrets...', 'yellow');
    const secrets = createSecureEnvFile();
    
    log('\n2. Creating Docker secrets...', 'yellow');
    generateDockerSecrets();
    
    log('\n3. Creating security checklist...', 'yellow');
    createSecurityChecklist();
    
    log('\n4. Summary:', 'magenta');
    log('✓ JWT Secret generated (256-bit)', 'green');
    log('✓ Session secrets created', 'green');
    log('✓ Database passwords generated', 'green');
    log('✓ API keys created', 'green');
    log('✓ Docker secrets configured', 'green');
    log('✓ Security checklist created', 'green');
    
    log('\n📋 Next Steps:', 'yellow');
    log('1. Review and update .env.production file with generated secrets', 'bright');
    log('2. Configure your database with the generated password', 'bright');
    log('3. Set up Redis with the generated password', 'bright');
    log('4. Review the security checklist before deployment', 'bright');
    log('5. Run security tests and penetration testing', 'bright');
    
    log('\n⚠️  Security Reminders:', 'red');
    log('• Never commit .env.secrets to version control', 'red');
    log('• Rotate secrets regularly in production', 'red');
    log('• Use a proper secret management system for production', 'red');
    log('• Monitor logs for security events', 'red');
    
    log('\n🎯 SSL Certificate Generation:', 'blue');
    log(generateSSLCertificateCommand(), 'bright');
    
  } catch (error) {
    log(`\n💥 Setup failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the script
main();