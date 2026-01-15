const fs = require('fs');
const path = require('path');

// Structured logging system for Phish Train Lite
// Integrates with popular logging services like Winston, Pino, or Datadog

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logLevels = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

class Logger {
  constructor() {
    this.logFile = path.join(logsDir, `app-${new Date().toISOString().split('T')[0]}.log`);
  }

  formatLog(level, message, metadata = {}) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...metadata,
      environment: process.env.NODE_ENV || 'development',
      service: 'phish-train-lite'
    });
  }

  writeLog(level, message, metadata = {}) {
    const logEntry = this.formatLog(level, message, metadata);

    // Write to file
    fs.appendFileSync(this.logFile, logEntry + '\n');

    // Also output to console in development
    if (process.env.NODE_ENV !== 'production') {
      const color = {
        error: '\x1b[31m',
        warn: '\x1b[33m',
        info: '\x1b[36m',
        debug: '\x1b[90m'
      }[level] || '\x1b[0m';

      console.log(`${color}[${level.toUpperCase()}]\x1b[0m ${message}`, metadata);
    }

    // Send to external monitoring service if configured
    if (process.env.ERROR_MONITORING_URL && level === 'error') {
      this.sendToMonitoring(message, metadata);
    }
  }

  error(message, metadata = {}) {
    this.writeLog(logLevels.ERROR, message, metadata);
  }

  warn(message, metadata = {}) {
    this.writeLog(logLevels.WARN, message, metadata);
  }

  info(message, metadata = {}) {
    this.writeLog(logLevels.INFO, message, metadata);
  }

  debug(message, metadata = {}) {
    this.writeLog(logLevels.DEBUG, message, metadata);
  }

  async sendToMonitoring(message, metadata = {}) {
    try {
      // Example integration with error monitoring services
      // (Sentry, Datadog, New Relic, etc.)
      await fetch(process.env.ERROR_MONITORING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          metadata,
          timestamp: new Date().toISOString(),
          service: 'phish-train-lite'
        })
      });
    } catch (error) {
      console.error('Failed to send error to monitoring service:', error);
    }
  }

  // Log rotation: Delete logs older than 30 days
  rotateLogs() {
    const files = fs.readdirSync(logsDir);
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    files.forEach(file => {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);

      if (stats.mtimeMs < thirtyDaysAgo) {
        fs.unlinkSync(filePath);
        this.info(`Rotated old log file: ${file}`);
      }
    });
  }
}

const logger = new Logger();

// Rotate logs daily
setInterval(() => {
  logger.rotateLogs();
}, 24 * 60 * 60 * 1000);

module.exports = logger;
