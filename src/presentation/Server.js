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
    logRoutes,
    adminRoutes,
    errorHandler,
    metrics,
    securityMiddleware,
    metricsMiddleware,
    webhookController,
    validation
  }) {
    this.config = config
    this.logger = logger
    this.webhookRoutes = webhookRoutes
    this.apiRoutes = apiRoutes
    this.metricsRoutes = metricsRoutes
    this.logRoutes = logRoutes
    this.adminRoutes = adminRoutes
    this.errorHandler = errorHandler
    this.metrics = metrics
    this.securityMiddleware = securityMiddleware
    this.metricsMiddleware = metricsMiddleware
    this.webhookController = webhookController
    this.validation = validation
    this.app = express()
    this.port = config.get('server.port')
    this.host = config.get('server.host')

    this.setupMiddleware()
    this.setupRoutes()
    this.setupErrorHandling()
    this.startMetricsCollection()
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

    // CORS middleware
    this.app.use(cors({
      origin: !!this.config.isDevelopment(),
      credentials: true
    }))

    // Request logging
    if (this.config.isDevelopment()) {
      this.app.use(morgan('combined'))
    }

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

    // Log routes (protected)
    if (this.logRoutes) {
      this.app.use('/api/logs',
        this.securityMiddleware.getApiKeyAuth(this.config.get('admin.apiKey') || 'admin'),
        this.logRoutes.getRouter()
      )
    }

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

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Turbo Chatwoot Webhook',
        version: '3.0.0',
        description: 'Webhook trung gian kết nối các platform với Chatwoot và Dify AI',
        endpoints: {
          health: '/webhook/health',
          telegram: '/webhook/telegram',
          chatwoot: '/webhook/chatwoot',
          api: '/api',
          logs: '/api/logs',
          metrics: '/metrics'
        }
      })
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
    console.log('\n🎉 Turbo Chatwoot Webhook Server v3.0.0 is running!')
    console.log(`📍 Address: http://${this.host}:${this.port}`)
    console.log(`🌍 Environment: ${this.config.get('server.nodeEnv')}`)
    console.log('\n📋 Available endpoints:')
    console.log('   GET  / - API information')
    console.log('   GET  /webhook/health - Health check')
    console.log('   POST /webhook/telegram - Telegram webhook')
    console.log('   POST /webhook/chatwoot - Chatwoot webhook')
    console.log('   GET  /api/status - Server status')
    console.log('   GET  /api/conversations - Get conversations')
    console.log('   POST /api/telegram/setup - Setup Telegram webhook')
    console.log('   GET  /api/telegram/bot-info - Get bot info')
    console.log('   POST /api/telegram/test - Test message')
    console.log('\n🔧 To setup Telegram webhook:')
    console.log(`   curl -X POST http://${this.host}:${this.port}/api/telegram/setup \\`)
    console.log('        -H "Content-Type: application/json" \\')
    console.log('        -d \'{"webhookUrl": "https://your-domain.com/webhook/telegram"}\'')
    console.log('\n')
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
   * Stop the server
   * @returns {Promise<void>}
   */
  async stop () {
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
