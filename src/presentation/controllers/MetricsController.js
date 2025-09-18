/**
 * Metrics Controller - Presentation layer
 * Handles metrics-related HTTP requests
 */
class MetricsController {
  constructor ({ metrics, logger }) {
    this.metrics = metrics
    this.logger = logger
  }

  /**
   * Get metrics summary
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getMetrics (req, res) {
    try {
      const summary = this.metrics.getSummary()

      res.status(200).json({
        success: true,
        data: summary,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      this.logger.error('Failed to get metrics', {
        error: error.message,
        stack: error.stack
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * Get health status with metrics
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getHealth (req, res) {
    try {
      const summary = this.metrics.getSummary()
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '2.0.0',
        metrics: {
          requests: summary.requests.total,
          messages: summary.messages.processed,
          errors: summary.errors.total,
          successRate: summary.requests.successRate
        }
      }

      // Check if application is healthy based on metrics
      if (summary.errors.total > 100 && summary.requests.total > 0) {
        const errorRate = (summary.errors.total / summary.requests.total) * 100
        if (errorRate > 10) {
          health.status = 'unhealthy'
          health.reason = 'High error rate detected'
        }
      }

      res.status(health.status === 'healthy' ? 200 : 503).json(health)
    } catch (error) {
      this.logger.error('Health check failed', {
        error: error.message,
        stack: error.stack
      })

      res.status(500).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Reset metrics
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async resetMetrics (req, res) {
    try {
      this.metrics.reset()

      this.logger.info('Metrics reset requested', {
        requestId: req.requestId,
        userAgent: req.get('User-Agent')
      })

      res.status(200).json({
        success: true,
        message: 'Metrics reset successfully',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      this.logger.error('Failed to reset metrics', {
        error: error.message,
        stack: error.stack
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * Get Prometheus metrics format
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getPrometheusMetrics (req, res) {
    try {
      const summary = this.metrics.getSummary()

      const prometheusMetrics = [
        '# HELP http_requests_total Total number of HTTP requests',
        '# TYPE http_requests_total counter',
        `http_requests_total{status="success"} ${summary.requests.successful}`,
        `http_requests_total{status="error"} ${summary.requests.failed}`,
        '',
        '# HELP http_request_duration_seconds HTTP request duration in seconds',
        '# TYPE http_request_duration_seconds histogram',
        `http_request_duration_seconds_bucket{le="0.1"} ${summary.performance.avgResponseTime}`,
        '',
        '# HELP messages_processed_total Total number of messages processed',
        '# TYPE messages_processed_total counter',
        `messages_processed_total ${summary.messages.processed}`,
        '',
        '# HELP errors_total Total number of errors',
        '# TYPE errors_total counter',
        `errors_total ${summary.errors.total}`,
        '',
        '# HELP nodejs_memory_usage_bytes Node.js memory usage in bytes',
        '# TYPE nodejs_memory_usage_bytes gauge',
        `nodejs_memory_usage_bytes{type="rss"} ${summary.performance.memoryUsage.rss || 0}`,
        `nodejs_memory_usage_bytes{type="heapTotal"} ${summary.performance.memoryUsage.heapTotal || 0}`,
        `nodejs_memory_usage_bytes{type="heapUsed"} ${summary.performance.memoryUsage.heapUsed || 0}`,
        '',
        '# HELP nodejs_uptime_seconds Node.js uptime in seconds',
        '# TYPE nodejs_uptime_seconds gauge',
        `nodejs_uptime_seconds ${summary.performance.uptime}`
      ].join('\n')

      res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
      res.status(200).send(prometheusMetrics)
    } catch (error) {
      this.logger.error('Failed to get Prometheus metrics', {
        error: error.message,
        stack: error.stack
      })

      res.status(500).send(`# ERROR: ${error.message}\n`)
    }
  }
}

module.exports = MetricsController
