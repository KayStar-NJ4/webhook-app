/**
 * Metrics Middleware
 * Collects application metrics for monitoring
 */
class MetricsMiddleware {
  constructor ({ metrics, logger }) {
    this.metrics = metrics
    this.logger = logger
  }

  /**
   * Express middleware to collect request metrics
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next function
   */
  middleware (req, res, next) {
    const startTime = Date.now()
    const endpoint = `${req.method} ${req.route?.path || req.path}`

    // Override res.end to collect metrics
    const originalEnd = res.end
    res.end = (chunk, encoding) => {
      const responseTime = Date.now() - startTime

      try {
        this.metrics.recordRequest(req, res, responseTime)
      } catch (error) {
        this.logger.error('Failed to record request metrics', {
          error: error.message,
          endpoint
        })
      }

      originalEnd.call(res, chunk, encoding)
    }

    next()
  }

  /**
   * Error metrics middleware
   * @param {Error} error - Error object
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next function
   */
  errorMiddleware (error, req, res, next) {
    const endpoint = `${req.method} ${req.route?.path || req.path}`

    try {
      this.metrics.recordError(error, endpoint)
    } catch (metricsError) {
      this.logger.error('Failed to record error metrics', {
        error: metricsError.message,
        originalError: error.message,
        endpoint
      })
    }

    next(error)
  }

  /**
   * Message processing metrics
   * @param {string} platform - Platform name
   * @param {number} processingTime - Processing time in ms
   */
  recordMessageProcessing (platform, processingTime) {
    try {
      this.metrics.recordMessage(platform, processingTime)
    } catch (error) {
      this.logger.error('Failed to record message metrics', {
        error: error.message,
        platform,
        processingTime
      })
    }
  }
}

module.exports = MetricsMiddleware
