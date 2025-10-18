class MetricsCollector {
  private metrics: Map<string, number>;

  constructor() {
    this.metrics = new Map<string, number>();
  }

  increment(key: string): void {
    const currentValue = this.metrics.get(key) || 0;
    this.metrics.set(key, currentValue + 1);
  }

  getMetricsObject(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
}

export const metricsCollector = new MetricsCollector();
