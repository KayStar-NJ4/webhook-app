const express = require('express')

/**
 * Admin Routes Index - Mount all admin route modules
 * Handles admin panel API routes organization
 */
class AdminRoutesIndex {
  constructor ({
    userRepository,
    telegramBotRepository,
    chatwootAccountRepository,
    difyAppRepository,
    webAppRepository,
    webConversationRepository,
    webMessageRepository,
    roleRepository,
    permissionRepository,
    configurationRepository,
    configurationService,
    logsService,
    permissionService,
    platformMappingService,
    telegramService,
    chatwootService,
    difyService,
    logger
  }) {
    this.router = express.Router()
    this.logger = logger

    // Initialize middleware
    const AuthMiddleware = require('../../middleware/AuthMiddleware')
    const PermissionMiddleware = require('../../middleware/PermissionMiddleware')
    
    this.authMiddleware = new AuthMiddleware({ logger, configurationService })
    this.permissionMiddleware = new PermissionMiddleware({ permissionService, logger })

    // Initialize route modules
    const AuthRoutes = require('./auth.routes')
    const UsersRoutes = require('./users.routes')
    const RolesRoutes = require('./roles.routes')
    const PermissionsRoutes = require('./permissions.routes')
    const TelegramRoutes = require('./telegram.routes')
    const ChatwootRoutes = require('./chatwoot.routes')
    const DifyRoutes = require('./dify.routes')
    const WebRoutes = require('./web.routes')
    const ConfigsRoutes = require('./configs.routes')
    const LogsRoutes = require('./logs.routes')
    const PlatformRoutes = require('./platform.routes')

    this.authRoutes = new AuthRoutes({
      userRepository,
      configurationService,
      authMiddleware: this.authMiddleware,
      logger
    })

    this.usersRoutes = new UsersRoutes({
      userRepository,
      authMiddleware: this.authMiddleware,
      permissionMiddleware: this.permissionMiddleware,
      logger
    })

    this.rolesRoutes = new RolesRoutes({
      roleRepository,
      permissionRepository,
      userRepository,
      authMiddleware: this.authMiddleware,
      permissionMiddleware: this.permissionMiddleware,
      logger
    })

    this.permissionsRoutes = new PermissionsRoutes({
      permissionService,
      userRepository,
      authMiddleware: this.authMiddleware,
      permissionMiddleware: this.permissionMiddleware,
      logger
    })

    this.telegramRoutes = new TelegramRoutes({
      telegramBotRepository,
      telegramService,
      configurationService,
      authMiddleware: this.authMiddleware,
      permissionMiddleware: this.permissionMiddleware,
      logger
    })

    this.chatwootRoutes = new ChatwootRoutes({
      chatwootAccountRepository,
      chatwootService,
      authMiddleware: this.authMiddleware,
      permissionMiddleware: this.permissionMiddleware,
      logger
    })

    this.difyRoutes = new DifyRoutes({
      difyAppRepository,
      difyService,
      authMiddleware: this.authMiddleware,
      permissionMiddleware: this.permissionMiddleware,
      logger
    })

    this.configsRoutes = new ConfigsRoutes({
      configurationRepository,
      authMiddleware: this.authMiddleware,
      permissionMiddleware: this.permissionMiddleware,
      logger
    })

    this.logsRoutes = new LogsRoutes({
      logsService,
      authMiddleware: this.authMiddleware,
      permissionMiddleware: this.permissionMiddleware,
      logger
    })

    this.platformRoutes = new PlatformRoutes({
      platformMappingService,
      authMiddleware: this.authMiddleware,
      permissionMiddleware: this.permissionMiddleware,
      logger
    })

    this.webRoutes = new WebRoutes({
      webAppRepository,
      webConversationRepository,
      webMessageRepository,
      authMiddleware: this.authMiddleware,
      permissionMiddleware: this.permissionMiddleware,
      logger
    })

    this.setupRoutes()
  }

  async initialize () {
    // Initialize middleware with database config
    await this.authMiddleware.initialize()
  }

  setupRoutes () {
    // Mount all admin route modules
    this.router.use('/auth', this.authRoutes.getRouter())
    this.router.use('/users', this.usersRoutes.getRouter())
    this.router.use('/web-apps', this.webRoutes.getRouter())
    this.router.use('/roles', this.rolesRoutes.getRouter())
    this.router.use('/permissions', this.permissionsRoutes.getRouter())
    this.router.use('/telegram-bots', this.telegramRoutes.getRouter())
    this.router.use('/chatwoot-accounts', this.chatwootRoutes.getRouter())
    this.router.use('/dify-apps', this.difyRoutes.getRouter())
    this.router.use('/configurations', this.configsRoutes.getRouter())
    this.router.use('/logs', this.logsRoutes.getRouter())
    this.router.use('/platform-mappings', this.platformRoutes.getRouter())
  }

  getRouter () {
    return this.router
  }
}

module.exports = AdminRoutesIndex
