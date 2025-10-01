import { createLogger } from '../utils/logger.js';
import { EventEmitter } from 'events';
import http from 'http';
import https from 'https';
import { URL } from 'url';

const logger = createLogger();

export class LoadBalancer extends EventEmitter {
  constructor() {
    super();
    this.isInitialized = false;
    this.config = {
      // Load balancing algorithms
      algorithm: process.env.LB_ALGORITHM || 'round_robin', // round_robin, least_connections, weighted_round_robin, ip_hash
      
      // Server pool configuration
      servers: this.parseServerPool(process.env.LB_SERVERS || ''),
      
      // Health check configuration
      healthCheck: {
        enabled: process.env.LB_HEALTH_CHECK_ENABLED !== 'false',
        interval: parseInt(process.env.LB_HEALTH_CHECK_INTERVAL) || 30000, // 30 seconds
        timeout: parseInt(process.env.LB_HEALTH_CHECK_TIMEOUT) || 5000, // 5 seconds
        path: process.env.LB_HEALTH_CHECK_PATH || '/health',
        expectedStatus: parseInt(process.env.LB_HEALTH_CHECK_STATUS) || 200,
        retries: parseInt(process.env.LB_HEALTH_CHECK_RETRIES) || 3
      },
      
      // Circuit breaker configuration
      circuitBreaker: {
        enabled: process.env.LB_CIRCUIT_BREAKER_ENABLED !== 'false',
        failureThreshold: parseInt(process.env.LB_FAILURE_THRESHOLD) || 5,
        resetTimeout: parseInt(process.env.LB_RESET_TIMEOUT) || 60000, // 1 minute
        halfOpenMaxRequests: parseInt(process.env.LB_HALF_OPEN_MAX) || 3
      },
      
      // Request retry configuration
      retry: {
        enabled: process.env.LB_RETRY_ENABLED !== 'false',
        maxRetries: parseInt(process.env.LB_MAX_RETRIES) || 3,
        backoffMs: parseInt(process.env.LB_BACKOFF_MS) || 1000
      },
      
      // Session affinity (sticky sessions)
      sessionAffinity: {
        enabled: process.env.LB_SESSION_AFFINITY_ENABLED === 'true',
        cookieName: process.env.LB_SESSION_COOKIE || 'lb_session',
        ttl: parseInt(process.env.LB_SESSION_TTL) || 3600000 // 1 hour
      }
    };
    
    // Server state tracking
    this.serverStates = new Map();
    this.currentIndex = 0; // For round robin
    this.connections = new Map(); // Track active connections per server
    this.sessionMap = new Map(); // For session affinity
    
    // Statistics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retries: 0,
      circuitBreakerTrips: 0,
      averageResponseTime: 0,
      lastReset: new Date()
    };
    
    // Health check timer
    this.healthCheckTimer = null;
  }

  parseServerPool(serverString) {
    if (!serverString) {
      // Default to localhost variations for development
      return [
        { url: 'http://localhost:3001', weight: 1 },
        { url: 'http://localhost:3002', weight: 1 },
        { url: 'http://localhost:3003', weight: 1 }
      ];
    }
    
    return serverString.split(',').map(server => {
      const parts = server.trim().split(':');
      const url = parts[0];
      const weight = parseInt(parts[1]) || 1;
      return { url, weight };
    });
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      logger.info('Initializing load balancer...');
      
      // Initialize server states
      this.initializeServerStates();
      
      // Start health checks if enabled
      if (this.config.healthCheck.enabled) {
        this.startHealthChecks();
      }
      
      // Set up cleanup handlers
      this.setupCleanupHandlers();
      
      this.isInitialized = true;
      this.emit('initialized');
      
      logger.info('Load balancer initialized successfully', {
        algorithm: this.config.algorithm,
        serverCount: this.config.servers.length,
        healthCheckEnabled: this.config.healthCheck.enabled,
        circuitBreakerEnabled: this.config.circuitBreaker.enabled
      });
      
    } catch (error) {
      logger.error('Failed to initialize load balancer:', error);
      throw error;
    }
  }

  initializeServerStates() {
    for (const server of this.config.servers) {
      this.serverStates.set(server.url, {
        ...server,
        healthy: true,
        lastHealthCheck: null,
        consecutiveFailures: 0,
        circuitState: 'closed', // closed, open, half-open
        lastCircuitStateChange: new Date(),
        responseTime: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0
      });
      
      this.connections.set(server.url, 0);
    }
  }

  startHealthChecks() {
    const interval = this.config.healthCheck.interval;
    
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, interval);
    
    // Perform initial health check
    setTimeout(() => this.performHealthChecks(), 1000);
    
    logger.info('Health checks started', { interval });
  }

  async performHealthChecks() {
    const healthCheckPromises = Array.from(this.serverStates.keys()).map(async (serverUrl) => {
      try {
        const isHealthy = await this.checkServerHealth(serverUrl);
        this.updateServerHealth(serverUrl, isHealthy);
      } catch (error) {
        logger.error(`Health check failed for ${serverUrl}:`, error);
        this.updateServerHealth(serverUrl, false);
      }
    });
    
    await Promise.allSettled(healthCheckPromises);
    
    const healthyServers = Array.from(this.serverStates.values())
      .filter(server => server.healthy).length;
    
    this.emit('healthCheckCompleted', {
      totalServers: this.serverStates.size,
      healthyServers,
      unhealthyServers: this.serverStates.size - healthyServers
    });
  }

  async checkServerHealth(serverUrl) {
    const server = this.serverStates.get(serverUrl);
    const checkUrl = new URL(this.config.healthCheck.path, serverUrl);
    
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest({
        method: 'GET',
        url: checkUrl.toString(),
        timeout: this.config.healthCheck.timeout
      });
      
      const responseTime = Date.now() - startTime;
      server.responseTime = responseTime;
      
      const isHealthy = response.status === this.config.healthCheck.expectedStatus;
      
      if (isHealthy) {
        logger.debug(`Health check passed for ${serverUrl}`, { responseTime });
      } else {
        logger.warn(`Health check failed for ${serverUrl}`, { 
          status: response.status, 
          expected: this.config.healthCheck.expectedStatus 
        });
      }
      
      return isHealthy;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.warn(`Health check error for ${serverUrl}:`, error.message);
      return false;
    }
  }

  updateServerHealth(serverUrl, isHealthy) {
    const server = this.serverStates.get(serverUrl);
    if (!server) return;
    
    server.lastHealthCheck = new Date();
    
    if (isHealthy) {
      if (!server.healthy) {
        logger.info(`Server ${serverUrl} is now healthy`);
        this.emit('serverHealthy', { serverUrl });
      }
      server.healthy = true;
      server.consecutiveFailures = 0;
      
      // Reset circuit breaker if in open state
      if (server.circuitState === 'open') {
        server.circuitState = 'half-open';
        server.lastCircuitStateChange = new Date();
        logger.info(`Circuit breaker half-opened for ${serverUrl}`);
      }
    } else {
      if (server.healthy) {
        logger.warn(`Server ${serverUrl} is now unhealthy`);
        this.emit('serverUnhealthy', { serverUrl });
      }
      server.healthy = false;
      server.consecutiveFailures++;
      
      // Check circuit breaker threshold
      if (this.config.circuitBreaker.enabled && 
          server.consecutiveFailures >= this.config.circuitBreaker.failureThreshold &&
          server.circuitState === 'closed') {
        server.circuitState = 'open';
        server.lastCircuitStateChange = new Date();
        this.stats.circuitBreakerTrips++;
        logger.warn(`Circuit breaker opened for ${serverUrl}`, {
          consecutiveFailures: server.consecutiveFailures
        });
      }
    }
  }

  getNextServer(req) {
    const availableServers = Array.from(this.serverStates.values())
      .filter(server => this.isServerAvailable(server));
    
    if (availableServers.length === 0) {
      throw new Error('No healthy servers available');
    }
    
    // Check for session affinity
    if (this.config.sessionAffinity.enabled) {
      const sessionServer = this.getSessionAffinityServer(req);
      if (sessionServer && this.isServerAvailable(sessionServer)) {
        return sessionServer;
      }
    }
    
    // Apply load balancing algorithm
    switch (this.config.algorithm) {
      case 'round_robin':
        return this.getRoundRobinServer(availableServers);
      
      case 'least_connections':
        return this.getLeastConnectionsServer(availableServers);
      
      case 'weighted_round_robin':
        return this.getWeightedRoundRobinServer(availableServers);
      
      case 'ip_hash':
        return this.getIpHashServer(availableServers, req);
      
      default:
        return this.getRoundRobinServer(availableServers);
    }
  }

  isServerAvailable(server) {
    if (!server.healthy) return false;
    
    // Check circuit breaker state
    if (this.config.circuitBreaker.enabled) {
      if (server.circuitState === 'open') {
        // Check if circuit breaker should transition to half-open
        const timeSinceOpen = Date.now() - server.lastCircuitStateChange.getTime();
        if (timeSinceOpen >= this.config.circuitBreaker.resetTimeout) {
          server.circuitState = 'half-open';
          server.lastCircuitStateChange = new Date();
          logger.info(`Circuit breaker half-opened for ${server.url}`);
          return true;
        }
        return false;
      }
    }
    
    return true;
  }

  getRoundRobinServer(servers) {
    const server = servers[this.currentIndex % servers.length];
    this.currentIndex = (this.currentIndex + 1) % servers.length;
    return server;
  }

  getLeastConnectionsServer(servers) {
    return servers.reduce((least, current) => {
      const leastConnections = this.connections.get(least.url) || 0;
      const currentConnections = this.connections.get(current.url) || 0;
      return currentConnections < leastConnections ? current : least;
    });
  }

  getWeightedRoundRobinServer(servers) {
    const totalWeight = servers.reduce((sum, server) => sum + server.weight, 0);
    let randomWeight = Math.random() * totalWeight;
    
    for (const server of servers) {
      randomWeight -= server.weight;
      if (randomWeight <= 0) {
        return server;
      }
    }
    
    return servers[0]; // Fallback
  }

  getIpHashServer(servers, req) {
    const clientIp = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const hash = this.hashString(clientIp);
    const index = hash % servers.length;
    return servers[index];
  }

  getSessionAffinityServer(req) {
    const sessionId = req.cookies?.[this.config.sessionAffinity.cookieName];
    if (!sessionId) return null;
    
    const sessionData = this.sessionMap.get(sessionId);
    if (!sessionData) return null;
    
    // Check if session is expired
    if (Date.now() - sessionData.timestamp > this.config.sessionAffinity.ttl) {
      this.sessionMap.delete(sessionId);
      return null;
    }
    
    return this.serverStates.get(sessionData.serverUrl);
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  async forwardRequest(req, res) {
    const startTime = Date.now();
    this.stats.totalRequests++;
    
    let lastError;
    let attempts = 0;
    const maxAttempts = this.config.retry.enabled ? this.config.retry.maxRetries + 1 : 1;
    
    while (attempts < maxAttempts) {
      try {
        const server = this.getNextServer(req);
        const result = await this.makeServerRequest(server, req, res);
        
        // Update statistics
        const responseTime = Date.now() - startTime;
        this.updateRequestStats(server, true, responseTime);
        this.stats.successfulRequests++;
        
        // Set session affinity cookie if enabled
        if (this.config.sessionAffinity.enabled && !req.cookies?.[this.config.sessionAffinity.cookieName]) {
          this.setSessionAffinity(res, server);
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        attempts++;
        this.stats.retries++;
        
        logger.warn(`Request attempt ${attempts} failed:`, error.message);
        
        if (attempts < maxAttempts) {
          await this.sleep(this.config.retry.backoffMs * attempts);
        }
      }
    }
    
    // All attempts failed
    this.stats.failedRequests++;
    throw lastError || new Error('All server attempts failed');
  }

  async makeServerRequest(server, req, res) {
    // Increment connection count
    const currentConnections = this.connections.get(server.url) || 0;
    this.connections.set(server.url, currentConnections + 1);
    
    try {
      const targetUrl = new URL(req.originalUrl, server.url);
      
      const proxyReq = await this.makeRequest({
        method: req.method,
        url: targetUrl.toString(),
        headers: this.prepareHeaders(req.headers, server),
        body: req.body,
        timeout: 30000 // 30 seconds
      });
      
      // Forward response
      res.status(proxyReq.status);
      
      // Copy response headers
      Object.entries(proxyReq.headers).forEach(([key, value]) => {
        res.set(key, value);
      });
      
      return res.send(proxyReq.data);
      
    } finally {
      // Decrement connection count
      const connections = this.connections.get(server.url) || 1;
      this.connections.set(server.url, Math.max(0, connections - 1));
    }
  }

  prepareHeaders(headers, server) {
    const proxyHeaders = { ...headers };
    
    // Remove hop-by-hop headers
    delete proxyHeaders.connection;
    delete proxyHeaders['proxy-connection'];
    delete proxyHeaders['keep-alive'];
    delete proxyHeaders['proxy-authenticate'];
    delete proxyHeaders['proxy-authorization'];
    delete proxyHeaders.te;
    delete proxyHeaders.trailer;
    delete proxyHeaders['transfer-encoding'];
    delete proxyHeaders.upgrade;
    
    // Add forwarding headers
    proxyHeaders['X-Forwarded-For'] = headers['x-forwarded-for'] || headers['x-real-ip'] || '';
    proxyHeaders['X-Forwarded-Proto'] = headers['x-forwarded-proto'] || 'http';
    proxyHeaders['X-Forwarded-Host'] = headers.host;
    proxyHeaders['X-Real-IP'] = headers['x-real-ip'] || '';
    
    return proxyHeaders;
  }

  setSessionAffinity(res, server) {
    const sessionId = this.generateSessionId();
    
    this.sessionMap.set(sessionId, {
      serverUrl: server.url,
      timestamp: Date.now()
    });
    
    res.cookie(this.config.sessionAffinity.cookieName, sessionId, {
      maxAge: this.config.sessionAffinity.ttl,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
  }

  generateSessionId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  updateRequestStats(server, success, responseTime) {
    server.totalRequests++;
    
    if (success) {
      server.successfulRequests++;
      
      // Update circuit breaker state for successful requests
      if (server.circuitState === 'half-open') {
        server.circuitState = 'closed';
        server.lastCircuitStateChange = new Date();
        server.consecutiveFailures = 0;
        logger.info(`Circuit breaker closed for ${server.url}`);
      }
    } else {
      server.failedRequests++;
      server.consecutiveFailures++;
    }
    
    // Update average response time
    const avgResponseTime = this.stats.averageResponseTime;
    const totalRequests = this.stats.totalRequests;
    this.stats.averageResponseTime = ((avgResponseTime * (totalRequests - 1)) + responseTime) / totalRequests;
  }

  async makeRequest(options) {
    // Mock HTTP request implementation
    // In production, replace with actual HTTP client like axios or node-fetch
    
    const { method, url, headers = {}, body, timeout = 5000 } = options;
    
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, timeout);
      
      // Simulate HTTP request
      setTimeout(() => {
        clearTimeout(timer);
        
        // Simulate random success/failure for testing
        const isSuccess = Math.random() > 0.1; // 90% success rate
        
        if (isSuccess) {
          resolve({
            status: 200,
            headers: { 'content-type': 'application/json' },
            data: { message: 'Load balanced response', server: url }
          });
        } else {
          reject(new Error('Simulated server error'));
        }
      }, Math.random() * 100 + 50); // 50-150ms response time
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setupCleanupHandlers() {
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  async shutdown() {
    logger.info('Shutting down load balancer...');
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    this.emit('shutdown');
    logger.info('Load balancer shutdown complete');
  }

  getStats() {
    const serverStats = Array.from(this.serverStates.entries()).map(([url, server]) => ({
      url,
      healthy: server.healthy,
      circuitState: server.circuitState,
      responseTime: server.responseTime,
      totalRequests: server.totalRequests,
      successfulRequests: server.successfulRequests,
      failedRequests: server.failedRequests,
      successRate: server.totalRequests > 0 
        ? Math.round((server.successfulRequests / server.totalRequests) * 100) 
        : 0,
      activeConnections: this.connections.get(url) || 0
    }));
    
    return {
      ...this.stats,
      algorithm: this.config.algorithm,
      totalServers: this.serverStates.size,
      healthyServers: serverStats.filter(s => s.healthy).length,
      serverStats,
      sessionAffinityEnabled: this.config.sessionAffinity.enabled,
      activeSessions: this.sessionMap.size
    };
  }

  getHealth() {
    const healthyServers = Array.from(this.serverStates.values())
      .filter(server => server.healthy).length;
    
    const status = healthyServers > 0 ? 'healthy' : 'unhealthy';
    
    return {
      status,
      healthyServers,
      totalServers: this.serverStates.size,
      algorithm: this.config.algorithm,
      circuitBreakerEnabled: this.config.circuitBreaker.enabled,
      healthCheckEnabled: this.config.healthCheck.enabled,
      sessionAffinityEnabled: this.config.sessionAffinity.enabled,
      uptime: Date.now() - this.stats.lastReset.getTime()
    };
  }
}

// Singleton instance
let loadBalancerInstance = null;

export const getLoadBalancer = () => {
  if (!loadBalancerInstance) {
    loadBalancerInstance = new LoadBalancer();
  }
  return loadBalancerInstance;
};

export default getLoadBalancer();