// Error Monitoring & Performance Tracking Configuration
// Integrates with Sentry, Datadog, New Relic, or custom monitoring solutions

const logger = require('./logger');

class ErrorMonitoring {
  constructor() {
    this.enabled = !!process.env.ERROR_MONITORING_URL;
    this.monitoringUrl = process.env.ERROR_MONITORING_URL;
    this.environment = process.env.NODE_ENV || 'development';

    if (this.enabled) {
      logger.info('Error monitoring initialized', {
        url: this.monitoringUrl,
        environment: this.environment
      });
    }
  }

  // Capture exception with context
  captureException(error, context = {}) {
    logger.error(error.message, {
      stack: error.stack,
      ...context
    });

    if (this.enabled) {
      this.sendToService({
        type: 'exception',
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        context,
        timestamp: new Date().toISOString(),
        environment: this.environment
      });
    }
  }

  // Track performance metrics
  trackMetric(name, value, tags = {}) {
    logger.debug(`Metric: ${name} = ${value}`, tags);

    if (this.enabled) {
      this.sendToService({
        type: 'metric',
        name,
        value,
        tags,
        timestamp: new Date().toISOString(),
        environment: this.environment
      });
    }
  }

  // Track user actions and events
  trackEvent(eventName, properties = {}) {
    logger.info(`Event: ${eventName}`, properties);

    if (this.enabled) {
      this.sendToService({
        type: 'event',
        name: eventName,
        properties,
        timestamp: new Date().toISOString(),
        environment: this.environment
      });
    }
  }

  // Send data to monitoring service
  async sendToService(payload) {
    try {
      await fetch(this.monitoringUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MONITORING_API_KEY || ''}`
        },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      // Avoid infinite loop - don't report monitoring failures
      console.error('Failed to send data to monitoring service:', error.message);
    }
  }

  // Express middleware for automatic error tracking
  expressMiddleware() {
    return (err, req, res, next) => {
      this.captureException(err, {
        method: req.method,
        url: req.url,
        user: req.user?.username,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });

      next(err);
    };
  }

  // Track response times
  performanceMiddleware() {
    return (req, res, next) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        this.trackMetric('http.response_time', duration, {
          method: req.method,
          path: req.path,
          status: res.statusCode
        });
      });

      next();
    };
  }
}

const monitoring = new ErrorMonitoring();

// Example integrations:
//
// Sentry:
// const Sentry = require('@sentry/node');
// Sentry.init({ dsn: process.env.SENTRY_DSN });
//
// Datadog:
// const tracer = require('dd-trace').init();
//
// New Relic:
// require('newrelic');

module.exports = monitoring;
