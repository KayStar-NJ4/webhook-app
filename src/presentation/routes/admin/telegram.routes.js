const express = require('express')
const AdminController = require('../../controllers/AdminController')

/**
 * Telegram Routes - Admin API
 * Handles telegram bot management routes
 */
class TelegramRoutes {
  constructor ({
    userRepository,
    telegramBotRepository,
    chatwootAccountRepository,
    difyAppRepository,
    telegramService,
    chatwootService,
    difyService,
    configurationService,
    authMiddleware,
    permissionMiddleware,
    logger
  }) {
    this.router = express.Router()
    this.adminController = new AdminController({
      userRepository,
      telegramBotRepository,
      chatwootAccountRepository,
      difyAppRepository,
      telegramService,
      chatwootService,
      difyService,
      configurationService,
      logger
    })
    this.authMiddleware = authMiddleware
    this.permissionMiddleware = permissionMiddleware
    this.logger = logger

    this.setupRoutes()
  }

  setupRoutes () {
    // Telegram bot management API
    this.router.get('/',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('telegram', 'read'),
      (req, res) => this.adminController.getTelegramBots(req, res)
    )
    
    this.router.get('/active',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('telegram', 'read'),
      (req, res) => this.adminController.getActiveTelegramBots(req, res)
    )
    
    this.router.get('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('telegram', 'read'),
      (req, res) => this.adminController.getTelegramBotById(req, res)
    )
    
    this.router.post('/',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('telegram', 'create'),
      (req, res) => this.adminController.createTelegramBot(req, res)
    )
    
    this.router.put('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('telegram', 'update'),
      (req, res) => this.adminController.updateTelegramBot(req, res)
    )
    
    this.router.delete('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('telegram', 'delete'),
      (req, res) => this.adminController.deleteTelegramBot(req, res)
    )
    
    this.router.post('/:id/test-connection',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('telegram', 'read'),
      (req, res) => this.adminController.testTelegramBotConnection(req, res)
    )
  }

  getRouter () {
    return this.router
  }
}

module.exports = TelegramRoutes
