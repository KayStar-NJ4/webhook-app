/**
 * Application Entry Point
 * Initializes and starts the application with clean architecture
 */
const ServiceRegistry = require('./infrastructure/container/ServiceRegistry')

// Controllers
const WebhookController = require('./presentation/controllers/WebhookController')
const ConversationController = require('./presentation/controllers/ConversationController')
const TelegramController = require('./presentation/controllers/TelegramController')
const MetricsController = require('./presentation/controllers/MetricsController')
const LogController = require('./presentation/controllers/LogController')

// Middleware
const ErrorHandler = require('./presentation/middleware/ErrorHandler')
const RequestLogger = require('./presentation/middleware/RequestLogger')
const Validation = require('./presentation/middleware/Validation')
const SecurityMiddleware = require('./presentation/middleware/SecurityMiddleware')
const MetricsMiddleware = require('./presentation/middleware/MetricsMiddleware')

// Routes
const WebhookRoutes = require('./presentation/routes/WebhookRoutes')
const ApiRoutes = require('./presentation/routes/ApiRoutes')
const MetricsRoutes = require('./presentation/routes/MetricsRoutes')
const LogRoutes = require('./presentation/routes/LogRoutes')

// Infrastructure
const Metrics = require('./infrastructure/monitoring/Metrics')

// Server
const Server = require('./presentation/Server')

/**
 * Application class
 */
class Application {
  constructor () {
    this.serviceRegistry = new ServiceRegistry()
    this.server = null
  }

  /**
   * Initialize the application
   * @returns {Promise<void>}
   */
  async initialize () {
    try {
      // Initialize services
      await this.serviceRegistry.initialize()

      // Get core services
      const config = this.serviceRegistry.get('config')
      const logger = this.serviceRegistry.get('logger')

      // Initialize external services with database configuration
      const telegramService = this.serviceRegistry.get('telegramService')
      const chatwootService = this.serviceRegistry.get('chatwootService')
      const difyService = this.serviceRegistry.get('difyService')

      await Promise.all([
        telegramService.initialize(),
        chatwootService.initialize(),
        difyService.initialize()
      ])

      // Initialize metrics
      const metrics = new Metrics({
        logger: logger.child({ component: 'Metrics' })
      })

      // Initialize controllers
      const webhookController = new WebhookController({
        messageBrokerService: this.serviceRegistry.get('messageBrokerService'),
        logger: logger.child({ component: 'WebhookController' })
      })

      const conversationController = new ConversationController({
        getConversationsUseCase: this.serviceRegistry.get('getConversationsUseCase'),
        logger: logger.child({ component: 'ConversationController' })
      })

      const telegramController = new TelegramController({
        telegramService: this.serviceRegistry.get('telegramService'),
        logger: logger.child({ component: 'TelegramController' })
      })

      const metricsController = new MetricsController({
        metrics,
        logger: logger.child({ component: 'MetricsController' })
      })

      const logController = new LogController(
        this.serviceRegistry.get('logRepository')
      )

      // Initialize middleware
      const errorHandler = new ErrorHandler({
        logger: logger.child({ component: 'ErrorHandler' })
      })

      const requestLogger = new RequestLogger({
        logger: logger.child({ component: 'RequestLogger' })
      })

      const validation = new Validation({
        logger: logger.child({ component: 'Validation' })
      })

      const securityMiddleware = new SecurityMiddleware({
        config,
        logger: logger.child({ component: 'SecurityMiddleware' })
      })

      const metricsMiddleware = new MetricsMiddleware({
        metrics,
        logger: logger.child({ component: 'MetricsMiddleware' })
      })

      // Initialize routes
      const webhookRoutes = new WebhookRoutes({
        webhookController,
        validation,
        errorHandler
      })

      const apiRoutes = new ApiRoutes({
        conversationController,
        telegramController,
        validation,
        errorHandler
      })

      const metricsRoutes = new MetricsRoutes({
        metricsController,
        validation,
        errorHandler
      })

      const logRoutes = new LogRoutes(logController)

      // Initialize admin routes
      const AdminRoutes = require('./presentation/routes/AdminRoutes')
      const adminRoutes = new AdminRoutes({
        userRepository: this.serviceRegistry.get('userRepository'),
        telegramBotRepository: this.serviceRegistry.get('telegramBotRepository'),
        chatwootAccountRepository: this.serviceRegistry.get('chatwootAccountRepository'),
        difyAppRepository: this.serviceRegistry.get('difyAppRepository'),
        roleRepository: this.serviceRegistry.get('roleRepository'),
        permissionRepository: this.serviceRegistry.get('permissionRepository'),
        configurationRepository: this.serviceRegistry.get('configurationRepository'),
        configurationService: this.serviceRegistry.get('configurationService'),
        logRepository: this.serviceRegistry.get('logRepository'),
        logsService: this.serviceRegistry.get('logsService'),
        permissionService: this.serviceRegistry.get('permissionService'),
        platformMappingService: this.serviceRegistry.get('platformMappingService'),
        logger: logger.child({ component: 'AdminRoutes' })
      })

      // Initialize admin routes with database config
      await adminRoutes.initialize()

      // Initialize server
      this.server = new Server({
        config,
        logger: logger.child({ component: 'Server' }),
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
      })

      // Application initialized successfully
    } catch (error) {
      // Silent failure path uses process exit without console noise
      try {
        const logger = this.serviceRegistry?.get?.('logger') || { error: () => {} }
        logger.error('Failed to initialize application', { error: error.message, stack: error.stack })
      } catch (_) { void 0 }
      process.exit(1)
    }
  }

  /**
   * Start the application
   * @returns {Promise<void>}
   */
  async start () {
    try {
      await this.initialize()
      await this.server.start()
    } catch (error) {
      try {
        const logger = this.serviceRegistry?.get?.('logger') || { error: () => {} }
        logger.error('Failed to start application', { error: error.message, stack: error.stack })
      } catch (_) { void 0 }
      process.exit(1)
    }
  }

  /**
   * Stop the application
   * @returns {Promise<void>}
   */
  async stop () {
    try {
      if (this.server) {
        await this.server.stop()
      }
    } catch (error) {
      try {
        const logger = this.serviceRegistry?.get?.('logger') || { error: () => {} }
        logger.error('Failed to stop application', { error: error.message, stack: error.stack })
      } catch (_) { void 0 }
    }
  }
}

// Start application if this file is run directly
if (require.main === module) {
  const app = new Application()
  app.start()
}

module.exports = Application
