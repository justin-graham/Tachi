/**
 * Database Security Test
 * Tests the security implementations including SQL injection protection
 */

import { InputSanitizer, QueryValidator, SecurityAuditLogger } from './sanitizer.js';
import { publishersService, crawlersService } from './services.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();

// Test malicious inputs
const MALICIOUS_INPUTS = [
  // SQL injection attempts
  "'; DROP TABLE publishers; --",
  "1' OR '1'='1",
  "admin'; DELETE FROM crawlers; --",
  "UNION SELECT * FROM pg_user",
  "1; INSERT INTO publishers (name) VALUES ('hacked');",
  
  // XSS attempts  
  "<script>alert('xss')</script>",
  "javascript:alert('xss')",
  "<iframe src='malicious.com'></iframe>",
  
  // Path traversal
  "../../../etc/passwd",
  "..\\..\\windows\\system32",
  
  // Encoding attempts
  "%27%20OR%20%271%27%3D%271",
  "0x41646D696E",
  
  // Special characters
  "test\x00null",
  "test\n\rinjection"
];

/**
 * Test input sanitization
 */
export async function testInputSanitization() {
  logger.info('Testing input sanitization...');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  for (const maliciousInput of MALICIOUS_INPUTS) {
    try {
      // Test with strict mode
      const sanitized = InputSanitizer.sanitize(maliciousInput, { strictMode: true });
      
      // In strict mode, malicious patterns should throw errors
      if (maliciousInput.includes('DROP') || maliciousInput.includes('DELETE') || 
          maliciousInput.includes('UNION') || maliciousInput.includes("OR '1'='1")) {
        results.failed++;
        results.errors.push(`Malicious input not blocked: ${maliciousInput}`);
      } else {
        results.passed++;
        logger.debug('Input sanitized successfully', { 
          original: maliciousInput,
          sanitized 
        });
      }
      
    } catch (error) {
      if (error.message.includes('potentially malicious')) {
        results.passed++;
        logger.debug('Malicious input correctly blocked', { 
          input: maliciousInput,
          error: error.message 
        });
      } else {
        results.failed++;
        results.errors.push(`Unexpected error for input '${maliciousInput}': ${error.message}`);
      }
    }
  }

  logger.info('Input sanitization test completed', { 
    passed: results.passed,
    failed: results.failed,
    total: MALICIOUS_INPUTS.length
  });

  return results;
}

/**
 * Test query validation
 */
export async function testQueryValidation() {
  logger.info('Testing query validation...');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  // Test table name validation
  const maliciousTables = [
    'users; DROP TABLE publishers',
    '../../../etc/passwd',
    'pg_user',
    'information_schema.tables'
  ];

  for (const table of maliciousTables) {
    try {
      QueryValidator.validateTableName(table);
      results.failed++;
      results.errors.push(`Malicious table name not blocked: ${table}`);
    } catch (error) {
      results.passed++;
      logger.debug('Malicious table name correctly blocked', { 
        table,
        error: error.message 
      });
    }
  }

  // Test column name validation
  const maliciousColumns = [
    'name; DROP TABLE users',
    '../../config',
    'password/*',
    'admin\x00'
  ];

  for (const column of maliciousColumns) {
    try {
      QueryValidator.validateColumnName(column);
      results.failed++;
      results.errors.push(`Malicious column name not blocked: ${column}`);
    } catch (error) {
      results.passed++;
      logger.debug('Malicious column name correctly blocked', { 
        column,
        error: error.message 
      });
    }
  }

  // Test UUID validation
  const invalidUUIDs = [
    'not-a-uuid',
    '12345',
    'aaaa-bbbb-cccc-dddd',
    "'; DROP TABLE users; --"
  ];

  for (const uuid of invalidUUIDs) {
    try {
      QueryValidator.validateUUID(uuid);
      results.failed++;
      results.errors.push(`Invalid UUID not blocked: ${uuid}`);
    } catch (error) {
      results.passed++;
      logger.debug('Invalid UUID correctly blocked', { 
        uuid,
        error: error.message 
      });
    }
  }

  logger.info('Query validation test completed', { 
    passed: results.passed,
    failed: results.failed,
    total: maliciousTables.length + maliciousColumns.length + invalidUUIDs.length
  });

  return results;
}

/**
 * Test service layer security
 */
export async function testServiceSecurity() {
  logger.info('Testing service layer security...');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  // Use the singleton service instances

  // Test malicious publisher creation
  const maliciousPublisherData = {
    email: "admin'; DROP TABLE publishers; --@test.com",
    name: "<script>alert('xss')</script>",
    domain: "'; UNION SELECT * FROM pg_user; --",
    description: "../../etc/passwd"
  };

  try {
    await publishersService.create(maliciousPublisherData, { 
      testMode: true,
      ip: '127.0.0.1' 
    });
    results.failed++;
    results.errors.push('Malicious publisher creation not blocked');
  } catch (error) {
    results.passed++;
    logger.debug('Malicious publisher creation correctly blocked', { 
      error: error.message 
    });
  }

  // Test malicious ID lookup
  const maliciousIds = [
    "'; DROP TABLE crawlers; --",
    "1 OR 1=1",
    "../../../etc/passwd"
  ];

  for (const id of maliciousIds) {
    try {
      await crawlersService.findById(id, { 
        testMode: true,
        ip: '127.0.0.1' 
      });
      results.failed++;
      results.errors.push(`Malicious ID lookup not blocked: ${id}`);
    } catch (error) {
      results.passed++;
      logger.debug('Malicious ID lookup correctly blocked', { 
        id,
        error: error.message 
      });
    }
  }

  logger.info('Service layer security test completed', { 
    passed: results.passed,
    failed: results.failed,
    total: 1 + maliciousIds.length
  });

  return results;
}

/**
 * Test security audit logging
 */
export async function testSecurityAuditing() {
  logger.info('Testing security audit logging...');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  try {
    // Test SQL injection logging
    SecurityAuditLogger.logSQLInjectionAttempt(
      "'; DROP TABLE users; --",
      [{ type: 'sql_injection', description: 'SQL command injection' }],
      { ip: '127.0.0.1', userId: 'test-user' }
    );
    results.passed++;

    // Test XSS logging
    SecurityAuditLogger.logXSSAttempt(
      "<script>alert('xss')</script>",
      [{ type: 'xss', description: 'Script tag injection' }],
      { ip: '127.0.0.1', userId: 'test-user' }
    );
    results.passed++;

    // Test unauthorized access logging
    SecurityAuditLogger.logUnauthorizedAccess(
      'admin_table',
      'SELECT',
      { ip: '127.0.0.1', userId: 'test-user' }
    );
    results.passed++;

    logger.info('Security audit logging test passed');

  } catch (error) {
    results.failed++;
    results.errors.push(`Audit logging failed: ${error.message}`);
  }

  logger.info('Security audit logging test completed', { 
    passed: results.passed,
    failed: results.failed,
    total: 3
  });

  return results;
}

/**
 * Run all security tests
 */
export async function runSecurityTests() {
  logger.info('Starting comprehensive database security tests...');
  
  const testResults = {
    sanitization: await testInputSanitization(),
    validation: await testQueryValidation(),
    services: await testServiceSecurity(),
    auditing: await testSecurityAuditing()
  };

  const totalPassed = Object.values(testResults).reduce((sum, result) => sum + result.passed, 0);
  const totalFailed = Object.values(testResults).reduce((sum, result) => sum + result.failed, 0);
  const totalTests = totalPassed + totalFailed;

  const overallResults = {
    totalTests,
    totalPassed,
    totalFailed,
    successRate: totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(2) : 0,
    details: testResults
  };

  logger.info('Database security tests completed', overallResults);

  // Log any failures
  if (totalFailed > 0) {
    logger.error('Security test failures detected:');
    Object.entries(testResults).forEach(([testName, result]) => {
      if (result.errors.length > 0) {
        logger.error(`${testName} test errors:`, result.errors);
      }
    });
  }

  return overallResults;
}

// Export for use in other test files
export default {
  testInputSanitization,
  testQueryValidation,
  testServiceSecurity,
  testSecurityAuditing,
  runSecurityTests
};