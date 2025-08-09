import { TachiSecurityMonitor } from "./TachiSecurityMonitor";

/**
 * Performance Monitor with Memory Management
 * 
 * Improvements:
 * 1. Circular buffers instead of growing arrays
 * 2. Lazy metric calculation
 * 3. Batch operations
 * 4. Memory-efficient data structures
 */

interface MetricPoint {
  value: number;
  timestamp: number;
}

class CircularBuffer<T> {
  private buffer: T[];
  private head: number = 0;
  private size: number = 0;
  private readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this.size < this.capacity) {
      this.size++;
    }
  }

  getAll(): T[] {
    if (this.size < this.capacity) {
      return this.buffer.slice(0, this.size);
    }
    return [...this.buffer.slice(this.head), ...this.buffer.slice(0, this.head)];
  }

  getLast(count: number): T[] {
    const all = this.getAll();
    return all.slice(-count);
  }

  get length(): number {
    return this.size;
  }
}

export class PerformanceMonitor {
  private readonly monitor: TachiSecurityMonitor;
  private readonly metrics = new Map<string, CircularBuffer<MetricPoint>>();
  private readonly alertBuffer = new CircularBuffer<any>(50); // Last 50 alerts only
  
  // Batch processing
  private metricsQueue: Array<{ name: string; value: number }> = [];
  private batchTimer: NodeJS.Timeout | null = null;
  
  // Memory thresholds
  private readonly MAX_METRIC_POINTS = 100; // Reduced from 1000
  private readonly BATCH_SIZE = 10;
  
  constructor(securityMonitor: TachiSecurityMonitor) {
    this.monitor = securityMonitor;
    
    // Initialize key metrics with circular buffers
    this.initializeMetrics();
    
    // Start periodic cleanup
    setInterval(() => this.optimizeMemory(), 300000); // 5 minutes
    
    // Start collecting system metrics
    this.startSystemMetricsCollection();
  }

  /**
   * Start collecting system performance metrics
   */
  private startSystemMetricsCollection(): void {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      // Add metrics to batch queue
      this.addMetric('system_memory', memUsage.heapUsed / 1024 / 1024); // MB
      this.addMetric('system_cpu', cpuUsage.user / 1000); // Convert to ms
      
      // Monitor heap growth
      const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      this.addMetric('heap_usage_percent', heapPercent);
      
    }, 30000); // 30 seconds
  }

  private initializeMetrics(): void {
    const metricNames = [
      'gas_price', 'network_response_time', 'block_number',
      'system_memory', 'system_cpu', 'alerts_per_hour'
    ];
    
    metricNames.forEach(name => {
      this.metrics.set(name, new CircularBuffer<MetricPoint>(this.MAX_METRIC_POINTS));
    });
  }

  /**
   * Add metric to batch queue for efficient processing
   */
  addMetric(name: string, value: number): void {
    this.metricsQueue.push({ name, value });
    
    // Process batch when queue is full or after timeout
    if (this.metricsQueue.length >= this.BATCH_SIZE) {
      this.processBatch();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.processBatch(), 1000);
    }
  }

  /**
   * Process queued metrics in batch
   */
  private processBatch(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const timestamp = Date.now();
    
    // Group metrics by name for efficient processing
    const groupedMetrics = new Map<string, number[]>();
    
    for (const { name, value } of this.metricsQueue) {
      if (!groupedMetrics.has(name)) {
        groupedMetrics.set(name, []);
      }
      groupedMetrics.get(name)!.push(value);
    }

    // Process each metric group
    groupedMetrics.forEach((values, name) => {
      const buffer = this.getOrCreateBuffer(name);
      
      // Add average of batch for smoother data
      const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
      buffer.push({ value: avgValue, timestamp });
    });

    // Clear queue
    this.metricsQueue = [];
  }

  private getOrCreateBuffer(name: string): CircularBuffer<MetricPoint> {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, new CircularBuffer<MetricPoint>(this.MAX_METRIC_POINTS));
    }
    return this.metrics.get(name)!;
  }

  /**
   * Get dashboard data with optimized calculations
   */
  getDashboardData(): any {
    const now = Date.now();
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();

    return {
      systemHealth: {
        status: this.calculateSystemStatus(),
        uptime,
        memoryUsage: {
          rss: memUsage.rss,
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal
        }
      },
      networkMetrics: {
        gasPrice: this.getLatestValue('gas_price'),
        rpcResponseTime: this.getLatestValue('network_response_time'),
        blockNumber: this.getLatestValue('block_number')
      },
      alertsSummary: {
        critical: this.countRecentAlerts('critical', 3600000), // Last hour
        total: this.alertBuffer.length
      },
      performance: {
        memoryEfficiency: this.calculateMemoryEfficiency(),
        metricsCount: this.getTotalMetricsCount()
      }
    };
  }

  private calculateSystemStatus(): string {
    const criticalAlerts = this.countRecentAlerts('critical', 3600000);
    const memUsage = process.memoryUsage();
    const memPercent = memUsage.heapUsed / memUsage.heapTotal;

    if (criticalAlerts > 0 || memPercent > 0.9) return 'critical';
    if (memPercent > 0.7) return 'warning';
    return 'healthy';
  }

  private getLatestValue(metricName: string): number {
    const buffer = this.metrics.get(metricName);
    if (!buffer || buffer.length === 0) return 0;
    
    const latest = buffer.getLast(1)[0];
    return latest ? latest.value : 0;
  }

  private countRecentAlerts(severity: string, timeWindow: number): number {
    const now = Date.now();
    return this.alertBuffer.getAll()
      .filter(alert => 
        alert.severity === severity && 
        (now - alert.timestamp) <= timeWindow
      ).length;
  }

  private calculateMemoryEfficiency(): number {
    const totalPoints = Array.from(this.metrics.values())
      .reduce((sum, buffer) => sum + buffer.length, 0);
    
    return Math.min(100, (totalPoints / (this.metrics.size * this.MAX_METRIC_POINTS)) * 100);
  }

  private getTotalMetricsCount(): number {
    return Array.from(this.metrics.values())
      .reduce((sum, buffer) => sum + buffer.length, 0);
  }

  /**
   * Optimize memory usage by cleaning old data
   */
  private optimizeMemory(): void {
    console.log('🧹 Optimizing memory usage...');
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Log memory stats
    const memUsage = process.memoryUsage();
    console.log(`Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB used / ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB total`);
    console.log(`Metrics tracked: ${this.metrics.size} series, ${this.getTotalMetricsCount()} total points`);
  }

  /**
   * Record alert in circular buffer
   */
  recordAlert(severity: string, type: string, description: string): void {
    this.alertBuffer.push({
      id: Date.now().toString(),
      severity,
      type,
      description,
      timestamp: Date.now()
    });
  }
}
