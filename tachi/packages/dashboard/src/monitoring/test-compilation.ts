// Simple compilation test without external dependencies
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

  get length(): number {
    return this.size;
  }
}

export class PerformanceMonitorCore {
  private readonly metrics = new Map<string, CircularBuffer<MetricPoint>>();
  private readonly MAX_METRIC_POINTS = 100;
  
  constructor() {
    console.log("✅ PerformanceMonitor - Memory efficient monitoring system ready");
  }

  addMetric(name: string, value: number): void {
    const buffer = this.getOrCreateBuffer(name);
    buffer.push({ value, timestamp: Date.now() });
  }

  private getOrCreateBuffer(name: string): CircularBuffer<MetricPoint> {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, new CircularBuffer<MetricPoint>(this.MAX_METRIC_POINTS));
    }
    return this.metrics.get(name)!;
  }

  getMetricsCount(): number {
    return Array.from(this.metrics.values())
      .reduce((sum, buffer) => sum + buffer.length, 0);
  }
}

console.log("🔧 Core optimization logic compiled successfully");
