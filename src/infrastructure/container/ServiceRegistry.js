const Container = require('./Container')
const Config = require('../config/Config')
const Logger = require('../logging/Logger')

// Repositories
const PostgreSQLConversationRepository = require('../repositories/PostgreSQLConversationRepository')
const InMemoryMessageRepository = require('../repositories/InMemoryMessageRepository')
const LogRepository = require('../repositories/LogRepository')
const ConfigurationRepository = require('../repositories/ConfigurationRepository')
const UserRepository = require('../repositories/UserRepository')
const TelegramBotRepository = require('../repositories/TelegramBotRepository')
const ChatwootAccountRepository = require('../repositories/ChatwootAccountRepository')
const DifyAppRepository = require('../repositories/DifyAppRepository')
const RoleRepository = require('../repositories/RoleRepository')
const PermissionRepository = require('../repositories/PermissionRepository')
const PlatformMappingRepository = require('../repositories/PlatformMappingRepository')
const WebAppRepository = require('../repositories/WebAppRepository')
const WebConversationRepository = require('../repositories/WebConversationRepository')
const WebMessageRepository = require('../repositories/WebMessageRepository')
const CustomerRepository = require('../repositories/CustomerRepository')

// Services
const TelegramService = require('../services/TelegramService')
const ChatwootService = require('../services/ChatwootService')
const DifyService = require('../services/DifyService')
const DatabaseService = require('../services/DatabaseService')
const LogsService = require('../../application/services/LogsService')
const ConfigurationService = require('../services/ConfigurationService')
const PlatformMappingService = require('../services/PlatformMappingService')
const WebService = require('../services/WebService')

// Use Cases
const ProcessMessageUseCase = require('../../application/useCases/ProcessMessageUseCase')
const GetConversationsUseCase = require('../../application/useCases/GetConversationsUseCase')

// Application Services
const MessageBrokerService = require('../../application/services/MessageBrokerService')
const PermissionService = require('../../application/services/PermissionService')
const CustomerService = require('../../application/services/CustomerService')

/**
 * Service Registry - Configures and registers all services
 */
class ServiceRegistry {
  constructor () {
    this.container = new Container()
    this.registerServices()
  }

  /**
   * Register all services in the container
   */
  registerServices () {
    // Core services
    this.container.register('config', () => new Config(), true)

    this.container.register('databaseService', (container) => new DatabaseService({
      config: container.get('config')
    }), true)

    this.container.register('logRepository', (container) => {
      const databaseService = container.get('databaseService')
      return new LogRepository({ db: databaseService.getPool() })
    }, true)

    this.container.register('logger', (container) => {
      const logRepository = container.get('logRepository')
      const config = container.get('config')
      const databaseService = container.get('databaseService')
      return new Logger('Application', logRepository, config, databaseService)
    }, true)

    // Repositories - PostgreSQL only
    this.container.register('conversationRepository', (container) => {
      const databaseService = container.get('databaseService')
      const logger = container.get('logger')
      return new PostgreSQLConversationRepository({ db: databaseService.getPool(), logger })
    }, true)

    this.container.register('messageRepository', () => new InMemoryMessageRepository(), true)

    this.container.register('configurationRepository', (container) => {
      const databaseService = container.get('databaseService')
      const logger = container.get('logger')
      return new ConfigurationRepository({ db: databaseService.getPool(), logger })
    }, true)

    this.container.register('userRepository', (container) => {
      const databaseService = container.get('databaseService')
      const logger = container.get('logger')
      return new UserRepository({ db: databaseService.getPool(), logger })
    }, true)

    this.container.register('telegramBotRepository', (container) => {
      const databaseService = container.get('databaseService')
      const logger = container.get('logger')
      return new TelegramBotRepository({ db: databaseService.getPool(), logger })
    }, true)

    this.container.register('chatwootAccountRepository', (container) => {
      const databaseService = container.get('databaseService')
      const logger = container.get('logger')
      return new ChatwootAccountRepository({ db: databaseService.getPool(), logger })
    }, true)

    this.container.register('difyAppRepository', (container) => {
      const databaseService = container.get('databaseService')
      const logger = container.get('logger')
      return new DifyAppRepository({ db: databaseService.getPool(), logger })
    }, true)

    this.container.register('roleRepository', (container) => {
      const databaseService = container.get('databaseService')
      const logger = container.get('logger')
      return new RoleRepository({ db: databaseService.getPool(), logger })
    }, true)

    this.container.register('permissionRepository', (container) => {
      const databaseService = container.get('databaseService')
      const logger = container.get('logger')
      return new PermissionRepository({ db: databaseService.getPool(), logger })
    }, true)

    this.container.register('platformMappingRepository', (container) => {
      const databaseService = container.get('databaseService')
      const logger = container.get('logger')
      return new PlatformMappingRepository({ db: databaseService.getPool(), logger })
    }, true)

    this.container.register('webAppRepository', (container) => {
      const databaseService = container.get('databaseService')
      const logger = container.get('logger')
      return new WebAppRepository({ db: databaseService.getPool(), logger })
    }, true)

    this.container.register('webConversationRepository', (container) => {
      const databaseService = container.get('databaseService')
      const logger = container.get('logger')
      return new WebConversationRepository({ db: databaseService.getPool(), logger })
    }, true)

    this.container.register('webMessageRepository', (container) => {
      const databaseService = container.get('databaseService')
      const logger = container.get('logger')
      return new WebMessageRepository({ db: databaseService.getPool(), logger })
    }, true)

    this.container.register('customerRepository', (container) => {
      const databaseService = container.get('databaseService')
      const logger = container.get('logger')
      return new CustomerRepository({ db: databaseService.getPool(), logger })
    }, true)

    // External services
    this.container.register('telegramService', (container) => new TelegramService({
      config: container.get('config'),
      configurationService: container.get('configurationService'),
      logger: container.get('logger'),
      databaseService: container.get('databaseService')
    }), true)

    this.container.register('chatwootService', (container) => new ChatwootService({
      config: container.get('config'),
      configurationService: container.get('configurationService'),
      logger: container.get('logger'),
      databaseService: container.get('databaseService')
    }), true)

    this.container.register('configurationService', (container) => new ConfigurationService({
      configRepository: container.get('configurationRepository'),
      logger: container.get('logger')
    }), true)

    this.container.register('difyService', (container) => new DifyService({
      config: container.get('config'),
      configurationService: container.get('configurationService'),
      difyAppRepository: container.get('difyAppRepository'),
      logger: container.get('logger')
    }), true)

    this.container.register('platformMappingService', (container) => new PlatformMappingService({
      platformMappingRepository: container.get('platformMappingRepository'),
      telegramBotRepository: container.get('telegramBotRepository'),
      webAppRepository: container.get('webAppRepository'),
      chatwootAccountRepository: container.get('chatwootAccountRepository'),
      difyAppRepository: container.get('difyAppRepository'),
      telegramService: container.get('telegramService'),
      chatwootService: container.get('chatwootService'),
      difyService: container.get('difyService'),
      configurationService: container.get('configurationService'),
      logger: container.get('logger')
    }), true)

    this.container.register('webService', (container) => new WebService({
      webAppRepository: container.get('webAppRepository'),
      webConversationRepository: container.get('webConversationRepository'),
      webMessageRepository: container.get('webMessageRepository'),
      platformMappingService: container.get('platformMappingService'),
      chatwootService: container.get('chatwootService'),
      difyService: container.get('difyService'),
      logger: container.get('logger')
    }), true)

    // Use Cases
    this.container.register('processMessageUseCase', (container) => new ProcessMessageUseCase({
      conversationRepository: container.get('conversationRepository'),
      messageRepository: container.get('messageRepository'),
      webConversationRepository: container.get('webConversationRepository'),
      webMessageRepository: container.get('webMessageRepository'),
      telegramService: container.get('telegramService'),
      chatwootService: container.get('chatwootService'),
      difyService: container.get('difyService'),
      configurationService: container.get('configurationService'),
      platformMappingService: container.get('platformMappingService'),
      databaseService: container.get('databaseService'),
      logger: container.get('logger')
    }), true)

    this.container.register('getConversationsUseCase', (container) => new GetConversationsUseCase({
      conversationRepository: container.get('conversationRepository'),
      logger: container.get('logger')
    }), true)

    // Application Services
    this.container.register('messageBrokerService', (container) => new MessageBrokerService({
      processMessageUseCase: container.get('processMessageUseCase'),
      container: container,
      logger: container.get('logger')
    }), true)

    this.container.register('permissionService', (container) => new PermissionService({
      userRepository: container.get('userRepository'),
      roleRepository: container.get('roleRepository'),
      permissionRepository: container.get('permissionRepository'),
      logger: container.get('logger')
    }), true)

    this.container.register('logsService', (container) => new LogsService({
      logRepository: container.get('logRepository'),
      logger: container.get('logger')
    }), true)

    this.container.register('customerService', (container) => new CustomerService({
      customerRepository: container.get('customerRepository'),
      logger: container.get('logger')
    }), true)
  }

  /**
   * Get the container instance
   * @returns {Container}
   */
  getContainer () {
    return this.container
  }

  /**
   * Get a service from the container
   * @param {string} name - Service name
   * @returns {any}
   */
  get (name) {
    return this.container.get(name)
  }

  /**
   * Initialize all services
   * @returns {Promise<void>}
   */
  async initialize () {
    const logger = this.get('logger')

    try {
      // Initialize log repository first
      const logRepository = this.get('logRepository')
      await logRepository.initialize()

      // Initialize database service
      const databaseService = this.get('databaseService')
      if (!databaseService.logger && logger?.child) {
        databaseService.logger = logger.child({ component: 'DatabaseService' })
      }
      databaseService.initialize()

      // Initialize conversation repository
      const conversationRepository = this.get('conversationRepository')
      if (conversationRepository.initialize) {
        await conversationRepository.initialize()
      }

      // Test external service connections
      const telegramService = this.get('telegramService')
      const botInfo = await telegramService.getBotInfo()
      if (!botInfo) {
        logger.warn('Telegram service not configured, continuing without it')
      }

      const difyService = this.get('difyService')
      const difyConnected = await difyService.testConnection()
      if (!difyConnected) {
        logger.warn('Dify service connection test failed')
      }
    } catch (error) {
      logger.error('Service initialization failed', { error: error.message })
      throw error
    }
  }
}

module.exports = ServiceRegistry
