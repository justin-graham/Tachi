import { createLogger } from '../utils/logger.js';
import { EventEmitter } from 'events';
import { URL } from 'url';
import { performance } from 'perf_hooks';

const logger = createLogger();

export class PerformanceTestSuite extends EventEmitter {
  constructor() {
    super();
    this.isInitialized = false;
    this.config = {
      // Test configuration
      baseUrl: process.env.PERF_TEST_BASE_URL || 'http://localhost:3001',
      
      // Load test parameters
      loadTest: {
        maxConcurrentUsers: parseInt(process.env.PERF_MAX_CONCURRENT) || 100,
        rampUpTimeMs: parseInt(process.env.PERF_RAMP_UP_MS) || 10000, // 10 seconds
        testDurationMs: parseInt(process.env.PERF_DURATION_MS) || 60000, // 1 minute
        requestIntervalMs: parseInt(process.env.PERF_REQUEST_INTERVAL) || 1000 // 1 second
      },
      
      // Stress test parameters
      stressTest: {
        maxConcurrentUsers: parseInt(process.env.PERF_STRESS_MAX_CONCURRENT) || 500,
        rampUpTimeMs: parseInt(process.env.PERF_STRESS_RAMP_UP_MS) || 30000, // 30 seconds
        testDurationMs: parseInt(process.env.PERF_STRESS_DURATION_MS) || 300000, // 5 minutes
        requestIntervalMs: parseInt(process.env.PERF_STRESS_REQUEST_INTERVAL) || 500 // 0.5 seconds
      },
      
      // Performance thresholds
      thresholds: {
        averageResponseTime: parseInt(process.env.PERF_AVG_RESPONSE_TIME) || 1000, // 1 second
        maxResponseTime: parseInt(process.env.PERF_MAX_RESPONSE_TIME) || 5000, // 5 seconds
        errorRatePercent: parseFloat(process.env.PERF_ERROR_RATE) || 5, // 5%
        throughputPerSecond: parseInt(process.env.PERF_THROUGHPUT) || 100, // 100 req/sec
        cpuUsagePercent: parseFloat(process.env.PERF_CPU_USAGE) || 80, // 80%
        memoryUsageMB: parseInt(process.env.PERF_MEMORY_USAGE) || 1024 // 1GB
      },
      
      // Test endpoints
      endpoints: [
        { path: '/health', method: 'GET', weight: 10 },
        { path: '/api/docs', method: 'GET', weight: 5 },
        { path: '/api/publishers/directory', method: 'GET', weight: 20 },
        { path: '/api/content/example.com/test', method: 'GET', weight: 30, requiresAuth: true },
        { path: '/api/monitoring/health', method: 'GET', weight: 10 },
        { path: '/api/content-protection/stats', method: 'GET', weight: 15, requiresAuth: true },
        { path: '/api/database/health', method: 'GET', weight: 10, requiresAuth: true }
      ]
    };
    
    // Test state
    this.activeTests = new Map();
    this.testResults = new Map();
    this.systemMetrics = [];
    
    // Statistics
    this.stats = {
      testsRun: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      lastTestRun: null
    };
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      logger.info('Initializing performance test suite...');
      
      // Validate base URL
      await this.validateBaseUrl();
      
      // Set up system monitoring
      this.setupSystemMonitoring();
      
      this.isInitialized = true;
      this.emit('initialized');
      
      logger.info('Performance test suite initialized successfully', {
        baseUrl: this.config.baseUrl,
        endpoints: this.config.endpoints.length,
        loadTestConfig: this.config.loadTest,
        stressTestConfig: this.config.stressTest
      });
      
    } catch (error) {
      logger.error('Failed to initialize performance test suite:', error);
      throw error;
    }
  }

  async validateBaseUrl() {
    try {
      const response = await this.makeRequest('GET', '/health');
      if (response.status !== 200) {
        throw new Error(`Health check failed with status ${response.status}`);
      }
      logger.info('Base URL validation successful');
    } catch (error) {
      logger.error('Base URL validation failed:', error);
      throw new Error(`Cannot connect to ${this.config.baseUrl}: ${error.message}`);
    }
  }

  setupSystemMonitoring() {
    // Monitor system metrics during tests
    this.systemMonitorInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 5000); // Every 5 seconds
  }

  collectSystemMetrics() {
    const metrics = {
      timestamp: new Date(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime()
    };
    
    this.systemMetrics.push(metrics);
    
    // Keep only last 24 hours of metrics
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.systemMetrics = this.systemMetrics.filter(m => m.timestamp > cutoff);
  }

  async runLoadTest(options = {}) {
    const testId = this.generateTestId();
    const config = { ...this.config.loadTest, ...options };
    
    logger.info(`Starting load test ${testId}`, config);
    
    const testResult = {
      testId,
      type: 'load',
      config,
      startTime: new Date(),
      endTime: null,
      status: 'running',
      requests: [],
      summary: null,
      systemMetrics: []
    };
    
    this.activeTests.set(testId, testResult);
    this.emit('testStarted', { testId, type: 'load' });
    
    try {
      await this.executeTest(testId, config);
      
      testResult.endTime = new Date();
      testResult.status = 'completed';
      testResult.summary = this.generateTestSummary(testResult);
      
      this.testResults.set(testId, testResult);
      this.stats.testsRun++;
      this.stats.lastTestRun = new Date();
      
      logger.info(`Load test ${testId} completed`, testResult.summary);
      this.emit('testCompleted', { testId, summary: testResult.summary });
      
      return testResult;
      
    } catch (error) {
      testResult.endTime = new Date();
      testResult.status = 'failed';
      testResult.error = error.message;
      
      logger.error(`Load test ${testId} failed:`, error);
      this.emit('testFailed', { testId, error: error.message });
      
      throw error;
    } finally {
      this.activeTests.delete(testId);
    }
  }

  async runStressTest(options = {}) {
    const testId = this.generateTestId();
    const config = { ...this.config.stressTest, ...options };
    
    logger.info(`Starting stress test ${testId}`, config);
    
    const testResult = {
      testId,
      type: 'stress',
      config,
      startTime: new Date(),
      endTime: null,
      status: 'running',
      requests: [],
      summary: null,
      systemMetrics: []
    };
    
    this.activeTests.set(testId, testResult);
    this.emit('testStarted', { testId, type: 'stress' });
    
    try {
      await this.executeTest(testId, config);
      
      testResult.endTime = new Date();
      testResult.status = 'completed';
      testResult.summary = this.generateTestSummary(testResult);
      
      this.testResults.set(testId, testResult);
      this.stats.testsRun++;
      this.stats.lastTestRun = new Date();
      
      logger.info(`Stress test ${testId} completed`, testResult.summary);
      this.emit('testCompleted', { testId, summary: testResult.summary });
      
      return testResult;
      
    } catch (error) {
      testResult.endTime = new Date();
      testResult.status = 'failed';
      testResult.error = error.message;
      
      logger.error(`Stress test ${testId} failed:`, error);
      this.emit('testFailed', { testId, error: error.message });
      
      throw error;
    } finally {
      this.activeTests.delete(testId);
    }
  }

  async executeTest(testId, config) {
    const testResult = this.activeTests.get(testId);
    const { maxConcurrentUsers, rampUpTimeMs, testDurationMs, requestIntervalMs } = config;
    
    const usersPerInterval = Math.ceil(maxConcurrentUsers / (rampUpTimeMs / 1000));
    const startTime = Date.now();
    const endTime = startTime + testDurationMs;
    
    let activeUsers = 0;
    const userPromises = [];
    
    // Ramp up users gradually
    const rampUpInterval = setInterval(() => {
      const usersToAdd = Math.min(usersPerInterval, maxConcurrentUsers - activeUsers);
      
      for (let i = 0; i < usersToAdd; i++) {
        const userPromise = this.simulateUser(testId, requestIntervalMs, endTime);
        userPromises.push(userPromise);
        activeUsers++;
      }
      
      if (activeUsers >= maxConcurrentUsers || Date.now() >= startTime + rampUpTimeMs) {
        clearInterval(rampUpInterval);
      }
    }, 1000); // Add users every second
    
    // Wait for test duration to complete
    await new Promise(resolve => setTimeout(resolve, testDurationMs));
    
    // Wait for all users to finish
    await Promise.allSettled(userPromises);
    
    clearInterval(rampUpInterval);
  }

  async simulateUser(testId, requestIntervalMs, endTime) {
    const testResult = this.activeTests.get(testId);
    if (!testResult) return;
    
    while (Date.now() < endTime && testResult.status === 'running') {
      try {
        const endpoint = this.selectRandomEndpoint();
        const requestStart = performance.now();
        
        const response = await this.makeRequest(endpoint.method, endpoint.path, {
          requiresAuth: endpoint.requiresAuth
        });
        
        const requestEnd = performance.now();
        const responseTime = requestEnd - requestStart;
        
        const requestData = {
          timestamp: new Date(),
          endpoint: endpoint.path,
          method: endpoint.method,
          status: response.status,
          responseTime,
          success: response.status < 400
        };
        
        testResult.requests.push(requestData);
        
        if (requestData.success) {
          this.stats.successfulRequests++;
        } else {
          this.stats.failedRequests++;
        }
        this.stats.totalRequests++;
        
        // Emit progress update
        if (testResult.requests.length % 100 === 0) {
          this.emit('testProgress', {
            testId,
            totalRequests: testResult.requests.length,
            averageResponseTime: this.calculateAverageResponseTime(testResult.requests),
            errorRate: this.calculateErrorRate(testResult.requests)
          });
        }
        
      } catch (error) {
        const requestData = {
          timestamp: new Date(),
          endpoint: 'unknown',
          method: 'unknown',
          status: 0,
          responseTime: 0,
          success: false,
          error: error.message
        };
        
        testResult.requests.push(requestData);
        this.stats.failedRequests++;
        this.stats.totalRequests++;
      }
      
      // Wait before next request
      await new Promise(resolve => setTimeout(resolve, requestIntervalMs));
    }
  }

  selectRandomEndpoint() {
    const totalWeight = this.config.endpoints.reduce((sum, ep) => sum + ep.weight, 0);
    let randomWeight = Math.random() * totalWeight;
    
    for (const endpoint of this.config.endpoints) {
      randomWeight -= endpoint.weight;
      if (randomWeight <= 0) {
        return endpoint;
      }
    }
    
    return this.config.endpoints[0]; // Fallback
  }

  async makeRequest(method, path, options = {}) {
    const url = new URL(path, this.config.baseUrl);
    
    // Mock HTTP request implementation
    // In production, replace with actual HTTP client
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      setTimeout(() => {
        const responseTime = Date.now() - startTime;
        
        // Simulate varying response times and occasional errors
        const isError = Math.random() < 0.05; // 5% error rate
        const simulatedResponseTime = Math.random() * 500 + 50; // 50-550ms
        
        if (isError) {
          reject(new Error('Simulated server error'));
        } else {
          resolve({
            status: 200,
            headers: { 'content-type': 'application/json' },
            data: { message: 'Performance test response', path, responseTime: simulatedResponseTime }
          });
        }
      }, Math.random() * 100 + 50); // 50-150ms network delay
    });
  }

  generateTestSummary(testResult) {
    const requests = testResult.requests;
    if (requests.length === 0) {
      return { error: 'No requests completed' };
    }
    
    const successfulRequests = requests.filter(r => r.success);
    const failedRequests = requests.filter(r => !r.success);
    
    const responseTimes = successfulRequests.map(r => r.responseTime);
    const averageResponseTime = responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    
    // Calculate percentiles
    const sortedResponseTimes = responseTimes.sort((a, b) => a - b);
    const p95ResponseTime = this.calculatePercentile(sortedResponseTimes, 95);
    const p99ResponseTime = this.calculatePercentile(sortedResponseTimes, 99);
    
    const testDurationMs = testResult.endTime.getTime() - testResult.startTime.getTime();
    const throughput = (requests.length / testDurationMs) * 1000; // requests per second
    
    const errorRate = (failedRequests.length / requests.length) * 100;
    
    const summary = {
      testDuration: testDurationMs,
      totalRequests: requests.length,
      successfulRequests: successfulRequests.length,
      failedRequests: failedRequests.length,
      errorRate: Math.round(errorRate * 100) / 100,
      throughput: Math.round(throughput * 100) / 100,
      responseTime: {
        average: Math.round(averageResponseTime * 100) / 100,
        min: Math.round(minResponseTime * 100) / 100,
        max: Math.round(maxResponseTime * 100) / 100,
        p95: Math.round(p95ResponseTime * 100) / 100,
        p99: Math.round(p99ResponseTime * 100) / 100
      },
      thresholdViolations: this.checkThresholds({
        averageResponseTime,
        maxResponseTime,
        errorRate,
        throughput
      })
    };
    
    return summary;
  }

  calculatePercentile(sortedArray, percentile) {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)] || 0;
  }

  calculateAverageResponseTime(requests) {
    const successfulRequests = requests.filter(r => r.success);
    if (successfulRequests.length === 0) return 0;
    
    const sum = successfulRequests.reduce((total, r) => total + r.responseTime, 0);
    return sum / successfulRequests.length;
  }

  calculateErrorRate(requests) {
    if (requests.length === 0) return 0;
    const failedRequests = requests.filter(r => !r.success).length;
    return (failedRequests / requests.length) * 100;
  }

  checkThresholds(metrics) {
    const violations = [];
    
    if (metrics.averageResponseTime > this.config.thresholds.averageResponseTime) {
      violations.push({
        metric: 'averageResponseTime',
        value: metrics.averageResponseTime,
        threshold: this.config.thresholds.averageResponseTime
      });
    }
    
    if (metrics.maxResponseTime > this.config.thresholds.maxResponseTime) {
      violations.push({
        metric: 'maxResponseTime',
        value: metrics.maxResponseTime,
        threshold: this.config.thresholds.maxResponseTime
      });
    }
    
    if (metrics.errorRate > this.config.thresholds.errorRatePercent) {
      violations.push({
        metric: 'errorRate',
        value: metrics.errorRate,
        threshold: this.config.thresholds.errorRatePercent
      });
    }
    
    if (metrics.throughput < this.config.thresholds.throughputPerSecond) {
      violations.push({
        metric: 'throughput',
        value: metrics.throughput,
        threshold: this.config.thresholds.throughputPerSecond
      });
    }
    
    return violations;
  }

  generateTestId() {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getTestResults(testId) {
    if (testId) {
      return this.testResults.get(testId) || this.activeTests.get(testId);
    }
    
    return Array.from(this.testResults.values());
  }

  getActiveTests() {
    return Array.from(this.activeTests.values());
  }

  stopTest(testId) {
    const test = this.activeTests.get(testId);
    if (test) {
      test.status = 'stopped';
      logger.info(`Test ${testId} stopped by user`);
      this.emit('testStopped', { testId });
      return true;
    }
    return false;
  }

  getStats() {
    return {
      ...this.stats,
      activeTests: this.activeTests.size,
      totalTestResults: this.testResults.size,
      configuration: {
        baseUrl: this.config.baseUrl,
        endpoints: this.config.endpoints.length,
        thresholds: this.config.thresholds
      }
    };
  }

  getHealth() {
    return {
      status: this.isInitialized ? 'healthy' : 'initializing',
      activeTests: this.activeTests.size,
      testsRun: this.stats.testsRun,
      lastTestRun: this.stats.lastTestRun,
      systemMetricsCollected: this.systemMetrics.length,
      configuration: {
        baseUrl: this.config.baseUrl,
        endpointsConfigured: this.config.endpoints.length
      }
    };
  }

  async cleanup() {
    if (this.systemMonitorInterval) {
      clearInterval(this.systemMonitorInterval);
    }
    
    // Stop all active tests
    for (const [testId] of this.activeTests) {
      this.stopTest(testId);
    }
    
    logger.info('Performance test suite cleanup completed');
  }
}

// Singleton instance
let performanceTestInstance = null;

export const getPerformanceTestSuite = () => {
  if (!performanceTestInstance) {
    performanceTestInstance = new PerformanceTestSuite();
  }
  return performanceTestInstance;
};

export default getPerformanceTestSuite();