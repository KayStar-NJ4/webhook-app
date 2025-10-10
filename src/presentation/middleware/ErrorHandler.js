/**
 * Error Handler Middleware
 * Centralized error handling for the application
 */
class ErrorHandler {
  constructor ({ logger }) {
    this.logger = logger
  }

  /**
   * Express error handler middleware
   * @param {Error} error - Error object
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next function
   */
  handle (error, req, res, next) {
    // Prevent sending response twice
    if (res.headersSent) {
      return next(error)
    }

    this.logger.error('Unhandled error', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      query: req.query,
      params: req.params
    })

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development'

    const errorResponse = {
      success: false,
      error: isDevelopment ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    }

    if (isDevelopment) {
      errorResponse.stack = error.stack
    }

    // Set appropriate status code
    let statusCode = 500
    if (error.statusCode) {
      statusCode = error.statusCode
    } else if (error.name === 'ValidationError') {
      statusCode = 400
    } else if (error.name === 'UnauthorizedError') {
      statusCode = 401
    } else if (error.name === 'ForbiddenError') {
      statusCode = 403
    } else if (error.name === 'NotFoundError') {
      statusCode = 404
    }

    // Force JSON response
    res.setHeader('Content-Type', 'application/json')
    res.status(statusCode).json(errorResponse)
  }

  /**
   * 404 Not Found handler
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next function
   */
  notFound (req, res, next) {
    // For API routes, return JSON directly
    if (req.url.startsWith('/webhook/') || req.url.startsWith('/api/')) {
      this.logger.warn('API route not found', {
        method: req.method,
        url: req.url,
        query: req.query
      })
      
      return res.status(404).json({
        success: false,
        error: `Route not found: ${req.method} ${req.url}`,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      })
    }
    
    // For other routes, pass to next middleware
    const error = new Error(`Route not found: ${req.method} ${req.url}`)
    error.statusCode = 404
    error.name = 'NotFoundError'
    next(error)
  }

  /**
   * Async error wrapper
   * @param {Function} fn - Async function to wrap
   * @returns {Function} - Wrapped function
   */
  asyncHandler (fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next)
    }
  }
}

module.exports = ErrorHandler
