class MetricsCollector {
  private metrics: Map<string, number>;

  constructor() {
    this.metrics = new Map<string, number>();
  }

  increment(key: string): void {
    const currentValue = this.metrics.get(key) || 0;
    this.metrics.set(key, currentValue + 1);
  }

  getSummary(): string {
    let summary = '\n--- Pipeline Metrics Summary ---\n';
    for (const [key, value] of this.metrics.entries()) {
      summary += `${key}: ${value}\n`;
    }
    summary += '------------------------------\n';
    return summary;
  }
}

export const metricsCollector = new MetricsCollector();
