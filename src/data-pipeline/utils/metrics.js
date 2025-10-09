class MetricsCollector {
    metrics;
    constructor() {
        this.metrics = new Map();
    }
    increment(key) {
        const currentValue = this.metrics.get(key) || 0;
        this.metrics.set(key, currentValue + 1);
    }
    getMetricsObject() {
        return Object.fromEntries(this.metrics);
    }
}
export const metricsCollector = new MetricsCollector();
