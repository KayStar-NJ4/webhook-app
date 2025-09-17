const rateLimit = require('express-rate-limit')
const helmet = require('helmet')

/**
 * Security Middleware
 * Provides comprehensive security measures
 */
class SecurityMiddleware {
  constructor({ config, logger }) {
    this.config = config
    this.logger = logger
  }

  /**
   * Get rate limiter configuration
   * @param {Object} options - Rate limit options
   * @returns {Function} - Express rate limiter middleware
   */
  getRateLimiter(options = {}) {
    const defaultOptions = {
      windowMs: this.config.get('rateLimit.windowMs') || 15 * 60 * 1000, // 15 minutes
      max: this.config.get('rateLimit.max') || 100, // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        this.logger.warn('Rate limit exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.url,
          method: req.method
        })
        
        res.status(429).json({
          success: false,
          error: 'Too many requests from this IP, please try again later.',
          retryAfter: Math.round(options.windowMs / 1000)
        })
      }
    }

    return rateLimit({ ...defaultOptions, ...options })
  }

  /**
   * Get webhook rate limiter (more restrictive)
   * @returns {Function} - Express rate limiter middleware
   */
  getWebhookRateLimiter() {
    return this.getRateLimiter({
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 50, // limit each IP to 50 webhook requests per 5 minutes
      message: {
        success: false,
        error: 'Webhook rate limit exceeded'
      }
    })
  }

  /**
   * Get API rate limiter
   * @returns {Function} - Express rate limiter middleware
   */
  getApiRateLimiter() {
    return this.getRateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200, // limit each IP to 200 API requests per 15 minutes
      message: {
        success: false,
        error: 'API rate limit exceeded'
      }
    })
  }

  /**
   * Get helmet configuration
   * @returns {Function} - Helmet middleware
   */
  getHelmetConfig() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com", "https://cdn.jsdelivr.net", "https://code.jquery.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://unpkg.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
          fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    })
  }

  /**
   * IP whitelist middleware
   * @param {Array} allowedIPs - Array of allowed IP addresses
   * @returns {Function} - Express middleware
   */
  getIPWhitelist(allowedIPs = []) {
    return (req, res, next) => {
      const clientIP = req.ip || req.connection.remoteAddress
      
      if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
        this.logger.warn('IP not in whitelist', {
          ip: clientIP,
          userAgent: req.get('User-Agent'),
          url: req.url
        })
        
        return res.status(403).json({
          success: false,
          error: 'Access denied: IP not in whitelist'
        })
      }
      
      next()
    }
  }

  /**
   * API key authentication middleware
   * @param {string} apiKey - Required API key
   * @returns {Function} - Express middleware
   */
  getApiKeyAuth(apiKey) {
    return (req, res, next) => {
      const providedKey = req.get('X-API-Key') || req.query.apiKey
      
      if (!providedKey) {
        return res.status(401).json({
          success: false,
          error: 'API key required'
        })
      }
      
      if (providedKey !== apiKey) {
        this.logger.warn('Invalid API key provided', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.url
        })
        
        return res.status(401).json({
          success: false,
          error: 'Invalid API key'
        })
      }
      
      next()
    }
  }

  /**
   * Request size limiter
   * @param {number} maxSize - Maximum request size in bytes
   * @returns {Function} - Express middleware
   */
  getRequestSizeLimiter(maxSize = 10 * 1024 * 1024) { // 10MB default
    return (req, res, next) => {
      const contentLength = parseInt(req.get('Content-Length') || '0')
      
      if (contentLength > maxSize) {
        this.logger.warn('Request size exceeded', {
          ip: req.ip,
          contentLength,
          maxSize,
          url: req.url
        })
        
        return res.status(413).json({
          success: false,
          error: 'Request entity too large'
        })
      }
      
      next()
    }
  }

  /**
   * Security headers middleware
   * @returns {Function} - Express middleware
   */
  getSecurityHeaders() {
    return (req, res, next) => {
      // Remove X-Powered-By header
      res.removeHeader('X-Powered-By')
      
      // Add security headers
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader('X-Frame-Options', 'DENY')
      res.setHeader('X-XSS-Protection', '1; mode=block')
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
      
      next()
    }
  }

  /**
   * Log security events
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next function
   */
  securityLogger(req, res, next) {
    const startTime = Date.now()
    
    // Log suspicious requests
    const suspiciousPatterns = [
      /\.\./, // Directory traversal
      /<script/i, // XSS attempts
      /union.*select/i, // SQL injection
      /eval\(/i, // Code injection
      /javascript:/i // JavaScript injection
    ]
    
    const requestString = JSON.stringify({
      url: req.url,
      body: req.body,
      query: req.query,
      headers: req.headers
    })
    
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestString))
    
    if (isSuspicious) {
      this.logger.warn('Suspicious request detected', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method,
        body: req.body,
        query: req.query,
        headers: req.headers
      })
    }
    
    // Log response time for performance monitoring
    res.on('finish', () => {
      const responseTime = Date.now() - startTime
      
      if (responseTime > 5000) { // Log slow requests
        this.logger.warn('Slow request detected', {
          ip: req.ip,
          url: req.url,
          method: req.method,
          responseTime: `${responseTime}ms`,
          statusCode: res.statusCode
        })
      }
    })
    
    next()
  }
}

module.exports = SecurityMiddleware
