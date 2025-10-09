
import pino from 'pino';

// Basic configuration for the logger
// In a real production scenario, you might add more options,
// like transports to send logs to a service, but for now,
// this will produce structured JSON on stdout.
const logger = pino({
  level: 'info', // Default log level
  base: {
    // Add static context to all logs, like the service name
    service: 'data-pipeline',
  },
  timestamp: pino.stdTimeFunctions.isoTime, // Use ISO 8601 format for timestamps
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
});

export default logger;
