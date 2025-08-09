/**
 * Gateway Optimization Suggestions for Cloudflare Worker
 * 
 * Performance improvements without losing functionality or security:
 */

// 1. Connection Pooling & HTTP Keep-Alive
export const optimizedHttpClient = {
  // Reuse HTTP connections
  keepAlive: true,
  maxSockets: 10,
  maxFreeSockets: 5,
  timeout: 30000,
  
  // Use HTTP/2 when possible
  protocol: 'h2',
  
  // Connection pool management
  agent: {
    keepAlive: true,
    keepAliveMsecs: 30000,
    maxSockets: 50,
    maxFreeSockets: 10
  }
};

// 2. Caching Strategy Optimization
export const cacheOptimization = {
  // Multi-tier caching
  tiers: {
    memory: {
      maxSize: '100MB',
      ttl: 300, // 5 minutes
      strategy: 'lru'
    },
    cloudflare: {
      ttl: 3600, // 1 hour
      bypassOnError: true
    },
    edge: {
      ttl: 86400, // 24 hours for static content
      respectHeaders: true
    }
  },
  
  // Smart cache keys
  keyStrategy: (request: Request) => {
    const url = new URL(request.url);
    const userAgent = request.headers.get('user-agent') || '';
    const isAIBot = /bot|crawler|spider|scrapy/i.test(userAgent);
    
    // Different cache keys for AI bots vs regular traffic
    const segment = isAIBot ? 'ai' : 'web';
    return `${segment}:${url.pathname}:${url.search}`;
  }
};

// 3. Batch RPC Calls
export class OptimizedRPCClient {
  private pendingCalls: Array<{
    method: string;
    params: any[];
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  
  private batchTimer: number | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_TIMEOUT = 50; // 50ms
  
  async call(method: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.pendingCalls.push({ method, params, resolve, reject });
      
      if (this.pendingCalls.length >= this.BATCH_SIZE) {
        this.processBatch();
      } else if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.processBatch(), this.BATCH_TIMEOUT) as any;
      }
    });
  }
  
  private async processBatch(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    if (this.pendingCalls.length === 0) return;
    
    const batch = this.pendingCalls.splice(0);
    
    // Group similar calls
    const grouped = this.groupSimilarCalls(batch);
    
    for (const group of grouped) {
      try {
        const results = await this.executeBatchCall(group);
        group.forEach((call, index) => {
          call.resolve(results[index]);
        });
      } catch (error) {
        group.forEach(call => call.reject(error));
      }
    }
  }
  
  private groupSimilarCalls(calls: any[]): any[][] {
    const groups = new Map<string, any[]>();
    
    calls.forEach(call => {
      const key = `${call.method}:${JSON.stringify(call.params)}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(call);
    });
    
    return Array.from(groups.values());
  }
  
  private async executeBatchCall(group: any[]): Promise<any[]> {
    // If all calls are identical, make single call and return same result
    if (group.length > 1 && this.areCallsIdentical(group)) {
      const result = await this.makeSingleRPCCall(group[0].method, group[0].params);
      return new Array(group.length).fill(result);
    }
    
    // Otherwise make individual calls (could be optimized further with JSON-RPC batch)
    return Promise.all(
      group.map(call => this.makeSingleRPCCall(call.method, call.params))
    );
  }
  
  private areCallsIdentical(calls: any[]): boolean {
    if (calls.length <= 1) return true;
    
    const first = calls[0];
    return calls.every(call => 
      call.method === first.method && 
      JSON.stringify(call.params) === JSON.stringify(first.params)
    );
  }
  
  private async makeSingleRPCCall(method: string, params: any[]): Promise<any> {
    // Your actual RPC implementation here
    // This is just a placeholder
    return fetch('your-rpc-endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method, params })
    }).then(r => r.json());
  }
}

// 4. Request Deduplication
export class RequestDeduplicator {
  private activeRequests = new Map<string, Promise<any>>();
  
  async dedupe<T>(key: string, factory: () => Promise<T>): Promise<T> {
    if (this.activeRequests.has(key)) {
      return this.activeRequests.get(key) as Promise<T>;
    }
    
    const promise = factory();
    this.activeRequests.set(key, promise);
    
    // Clean up after completion
    promise.finally(() => {
      this.activeRequests.delete(key);
    });
    
    return promise;
  }
  
  generateKey(request: Request): string {
    const url = new URL(request.url);
    const relevantHeaders = [
      'user-agent',
      'x-payment-tx',
      'authorization'
    ].map(header => `${header}:${request.headers.get(header) || ''}`)
     .join('|');
    
    return `${request.method}:${url.pathname}:${url.search}:${relevantHeaders}`;
  }
}

// 5. Memory-Efficient Data Structures
export class LRUCache<K, V> {
  private maxSize: number;
  private cache = new Map<K, V>();
  
  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }
  
  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      // Move to end (most recent)
      const value = this.cache.get(key)!;
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }
  
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, value);
  }
  
  has(key: K): boolean {
    return this.cache.has(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

// 6. Optimized Response Handling
export const optimizedResponse = {
  // Compress responses
  compression: {
    enabled: true,
    level: 6, // Good balance of speed vs compression
    threshold: 1024 // Only compress responses > 1KB
  },
  
  // Streaming for large responses
  streaming: {
    enabled: true,
    chunkSize: 8192 // 8KB chunks
  },
  
  // Response headers optimization
  headers: {
    'cache-control': 'public, max-age=300, stale-while-revalidate=86400',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'x-xss-protection': '1; mode=block'
  }
};

// 7. Async Processing Pipeline
export class AsyncPipeline {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;
  private concurrency = 3;
  
  add(task: () => Promise<void>): void {
    this.queue.push(task);
    this.process();
  }
  
  private async process(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.concurrency);
      await Promise.all(batch.map(task => task().catch(console.error)));
    }
    
    this.processing = false;
  }
}

// Usage example:
export const optimizedGatewayHandler = {
  deduplicator: new RequestDeduplicator(),
  rpcClient: new OptimizedRPCClient(),
  cache: new LRUCache<string, any>(1000),
  pipeline: new AsyncPipeline(),
  
  async handleRequest(request: Request): Promise<Response> {
    const cacheKey = this.deduplicator.generateKey(request);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return new Response(cached.body, {
        status: cached.status,
        headers: { ...cached.headers, 'x-cache': 'HIT' }
      });
    }
    
    // Deduplicate concurrent identical requests
    return this.deduplicator.dedupe(cacheKey, async () => {
      const response = await this.processRequest(request);
      
      // Cache successful responses
      if (response.ok) {
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        
        this.cache.set(cacheKey, {
          body: await response.clone().text(),
          status: response.status,
          headers: responseHeaders
        });
      }
      
      return response;
    });
  },
  
  async processRequest(_request: Request): Promise<Response> {
    // Your actual request processing logic here
    return new Response('OK');
  }
};
