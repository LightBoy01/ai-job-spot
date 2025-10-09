class MetricsCollector {
    metrics;
    constructor() {
        this.metrics = new Map();
    }
    increment(key) {
        const currentValue = this.metrics.get(key) || 0;
        this.metrics.set(key, currentValue + 1);
    }
    getSummary() {
        let summary = '\n--- Pipeline Metrics Summary ---\n';
        for (const [key, value] of this.metrics.entries()) {
            summary += `${key}: ${value}\n`;
        }
        summary += '------------------------------\n';
        return summary;
    }
}
export const metricsCollector = new MetricsCollector();
