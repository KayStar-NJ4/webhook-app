/**
 * Request Logger Middleware
 * Logs HTTP requests with structured format
 */
class RequestLogger {
  constructor({ logger }) {
    this.logger = logger
  }

  /**
   * Express middleware to log requests
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next function
   */
  middleware(req, res, next) {
    const startTime = Date.now()

    // Generate request ID if not present
    if (!req.requestId) {
      req.requestId = this.generateRequestId()
    }

    // Log request start
    this.logger.info('Request started', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      body: this.sanitizeBody(req.body)
    })

    // Override res.end to log response
    const originalEnd = res.end
    res.end = (chunk, encoding) => {
      const responseTime = Date.now() - startTime
      
      this.logger.info('Request completed', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        contentLength: res.get('Content-Length')
      })

      originalEnd.call(res, chunk, encoding)
    }

    next()
  }

  /**
   * Generate unique request ID
   * @returns {string} - Request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Sanitize request body for logging
   * @param {Object} body - Request body
   * @returns {Object} - Sanitized body
   */
  sanitizeBody(body) {
    if (!body) return body

    const sanitized = { ...body }
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization']
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]'
      }
    })

    // Truncate long strings
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 200) {
        sanitized[key] = sanitized[key].substring(0, 200) + '...'
      }
    })

    return sanitized
  }
}

module.exports = RequestLogger
