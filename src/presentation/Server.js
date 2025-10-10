const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const SecurityMiddleware = require('./middleware/SecurityMiddleware')
const MetricsMiddleware = require('./middleware/MetricsMiddleware')
const Validation = require('./middleware/Validation')

/**
 * Server - Presentation layer
 * Express server with clean architecture
 */
class Server {
  constructor ({
    config,
    logger,
    webhookRoutes,
    apiRoutes,
    metricsRoutes,
    webRoutes,
    adminRoutes,
    errorHandler,
    metrics,
    securityMiddleware,
    metricsMiddleware,
    webhookController,
    validation,
    webAppRepository
  }) {
    this.config = config
    this.logger = logger
    this.webhookRoutes = webhookRoutes
    this.apiRoutes = apiRoutes
    this.metricsRoutes = metricsRoutes
    this.webRoutes = webRoutes
    this.adminRoutes = adminRoutes
    this.errorHandler = errorHandler
    this.metrics = metrics
    this.securityMiddleware = securityMiddleware
    this.metricsMiddleware = metricsMiddleware
    this.webhookController = webhookController
    this.validation = validation
    this.webAppRepository = webAppRepository
    this.app = express()
    this.port = config.get('server.port')
    this.host = config.get('server.host')

    // Cache for active domains (refresh every 5 minutes)
    this.allowedOrigins = []
    this.lastOriginsRefresh = null
    this.ORIGINS_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

    this.setupMiddleware()
    this.setupRoutes()
    this.setupErrorHandling()
    this.startMetricsCollection()
    this.startOriginsRefresh()
  }

  /**
   * Setup middleware
   */
  setupMiddleware () {
    // Trust proxy (for reverse proxy like nginx)
    this.app.set('trust proxy', 1)

    // Security middleware
    this.app.use(this.securityMiddleware.getHelmetConfig())
    this.app.use(this.securityMiddleware.getSecurityHeaders())
    this.app.use(this.securityMiddleware.getRequestSizeLimiter())
    this.app.use(this.securityMiddleware.securityLogger.bind(this.securityMiddleware))

    // CORS middleware - allow from active web apps domains in database
    this.app.use(cors({
      origin: async (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) {
          return callback(null, true)
        }

        // Refresh origins if cache expired
        await this.refreshOriginsIfNeeded()

        // Get current allowed origins
        const allowedOrigins = this.getAllowedOrigins()
        
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true)
        } else {
          // Log rejected origin for debugging
          this.logger.warn('CORS: Origin not allowed', { 
            origin, 
            allowedOrigins,
            message: 'Add this domain to web_apps table with is_active=true'
          })
          callback(null, true) // Still allow but log for monitoring
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
      exposedHeaders: ['X-Request-ID'],
      maxAge: 86400 // 24 hours
    }))

    // Handle preflight requests explicitly
    this.app.options('*', cors())

    // Request ID middleware
    this.app.use((req, res, next) => {
      req.requestId = req.get('X-Request-ID') || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      res.set('X-Request-ID', req.requestId)
      next()
    })

    // Metrics middleware
    this.app.use(this.metricsMiddleware.middleware.bind(this.metricsMiddleware))

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }))
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }))
  }

  /**
   * Setup routes
   */
  setupRoutes () {
    // Web platform routes (landing page chat widget)
    this.app.use('/webhook/web',
      this.securityMiddleware.getWebhookRateLimiter(),
      this.webRoutes.getRouter()
    )

    // Webhook routes with rate limiting
    this.app.use('/webhook',
      this.securityMiddleware.getWebhookRateLimiter(),
      this.webhookRoutes.getRouter()
    )

    // API routes with rate limiting
    this.app.use('/api',
      this.securityMiddleware.getApiRateLimiter(),
      this.apiRoutes.getRouter()
    )

    // Log routes are now handled by AdminRoutes

    // Admin routes
    if (this.adminRoutes) {
      this.app.use(this.adminRoutes.getRouter())
    }

    // Serve static files with correct MIME types
    this.app.use(express.static('public', {
      setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
          res.setHeader('Content-Type', 'text/javascript; charset=utf-8')
        } else if (path.endsWith('.vue')) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
        } else if (path.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css; charset=utf-8')
        } else if (path.endsWith('.json')) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
        }
      }
    }))

    // Serve node_modules for admin panel
    this.app.use('/node_modules', express.static('node_modules'))

    // Metrics routes (protected)
    if (this.metricsRoutes) {
      this.app.use('/metrics',
        this.securityMiddleware.getApiKeyAuth(this.config.get('admin.apiKey') || 'admin'),
        this.metricsRoutes.getRouter()
      )
    }

    // Health check endpoint (root level)
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '3.0.0'
      })
    })

    // Root endpoint -> redirect to admin panel
    this.app.get('/', (req, res) => {
      res.redirect('/admin')
    })

    // Root POST endpoint for Chatwoot webhooks (backward compatibility)
    this.app.post('/',
      this.securityMiddleware.getWebhookRateLimiter(),
      this.validation.validate(Validation.schemas.chatwootWebhook, 'body'),
      this.errorHandler.asyncHandler(
        (req, res) => this.webhookController.handleChatwootWebhook(req, res)
      )
    )
  }

  /**
   * Setup error handling
   */
  setupErrorHandling () {
    // Error metrics middleware
    this.app.use(this.metricsMiddleware.errorMiddleware.bind(this.metricsMiddleware))

    // 404 handler
    this.app.use(this.errorHandler.notFound.bind(this.errorHandler))

    // Error handler
    this.app.use(this.errorHandler.handle.bind(this.errorHandler))
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection () {
    if (this.metrics) {
      this.metrics.startSystemMetricsCollection()
      // Metrics collection started
    }
  }

  /**
   * Start the server
   * @returns {Promise<void>}
   */
  async start () {
    try {
      // Ensure logs directory exists
      // No need to create logs directory - using database logging

      this.server = this.app.listen(this.port, this.host, () => {
        // Server started successfully
        this.printStartupInfo()
      })

      // Graceful shutdown
      this.setupGracefulShutdown()
    } catch (error) {
      this.logger.error('Failed to start server', {
        error: error.message,
        stack: error.stack
      })
      process.exit(1)
    }
  }

  /**
   * Print startup information
   */
  printStartupInfo () {
    // Suppressed terminal logs
    this.logger.info('Server started', {
      address: `http://${this.host}:${this.port}`,
      environment: this.config.get('server.nodeEnv')
    })
  }

  /**
   * Setup graceful shutdown
   */
  setupGracefulShutdown () {
    const shutdown = (signal) => {
      this.logger.info(`Received ${signal}, shutting down gracefully...`)

      if (this.server) {
        this.server.close(() => {
          this.logger.info('Server closed successfully')
          process.exit(0)
        })
      } else {
        process.exit(0)
      }
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
  }

  /**
   * Get Express app instance
   * @returns {express.Application}
   */
  getApp () {
    return this.app
  }

  /**
   * Get allowed origins for CORS
   * @returns {Array<string>} - Array of allowed origins
   */
  getAllowedOrigins () {
    // Development mode - allow localhost
    if (this.config.isDevelopment()) {
      return [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:8080',
        ...this.allowedOrigins
      ]
    }

    // Production - return cached origins from database
    return this.allowedOrigins
  }

  /**
   * Refresh allowed origins from database if cache expired
   * @returns {Promise<void>}
   */
  async refreshOriginsIfNeeded () {
    const now = Date.now()
    
    // If cache is still valid, skip
    if (this.lastOriginsRefresh && (now - this.lastOriginsRefresh) < this.ORIGINS_CACHE_TTL) {
      return
    }

    // Refresh from database
    await this.refreshOrigins()
  }

  /**
   * Refresh allowed origins from database
   * @returns {Promise<void>}
   */
  async refreshOrigins () {
    try {
      // Load active web apps from database
      const activeApps = await this.webAppRepository.findActive()
      
      // Extract and normalize domains
      this.allowedOrigins = activeApps
        .map(app => {
          const domain = app.domain
          
          // Normalize domain - add https:// if not present
          if (domain.startsWith('http://') || domain.startsWith('https://')) {
            return domain
          }
          
          // For localhost, keep http
          if (domain.includes('localhost') || domain.includes('127.0.0.1')) {
            return `http://${domain}`
          }
          
          // For production domains, use https
          return `https://${domain}`
        })
        .filter(Boolean)

      this.lastOriginsRefresh = Date.now()
      
      this.logger.info('CORS origins refreshed from database', { 
        count: this.allowedOrigins.length,
        origins: this.allowedOrigins 
      })
    } catch (error) {
      this.logger.error('Failed to refresh CORS origins from database', { 
        error: error.message,
        stack: error.stack
      })
      
      // Keep existing origins on error
    }
  }

  /**
   * Start periodic refresh of allowed origins
   */
  startOriginsRefresh () {
    // Initial refresh
    this.refreshOrigins().catch(error => {
      this.logger.error('Failed initial CORS origins refresh', { error: error.message })
    })

    // Periodic refresh every 5 minutes
    this.originsRefreshInterval = setInterval(() => {
      this.refreshOrigins().catch(error => {
        this.logger.error('Failed periodic CORS origins refresh', { error: error.message })
      })
    }, this.ORIGINS_CACHE_TTL)
  }

  /**
   * Stop the server
   * @returns {Promise<void>}
   */
  async stop () {
    // Clear origins refresh interval
    if (this.originsRefreshInterval) {
      clearInterval(this.originsRefreshInterval)
    }

    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.logger.info('Server stopped')
          resolve()
        })
      } else {
        resolve()
      }
    })
  }
}

module.exports = Server
