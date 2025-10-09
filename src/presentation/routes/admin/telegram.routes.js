const express = require('express')
const TelegramController = require('../../controllers/TelegramController')

/**
 * Telegram Routes - Admin API
 * Handles telegram bot management routes
 */
class TelegramRoutes {
  constructor ({
    telegramBotRepository,
    telegramService,
    configurationService,
    authMiddleware,
    permissionMiddleware,
    logger
  }) {
    this.router = express.Router()
    this.controller = new TelegramController({
      telegramBotRepository,
      telegramService,
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
      (req, res) => this.controller.getAll(req, res)
    )
    
    this.router.get('/active',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('telegram', 'read'),
      (req, res) => this.controller.getActive(req, res)
    )
    
    this.router.get('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('telegram', 'read'),
      (req, res) => this.controller.getById(req, res)
    )
    
    this.router.post('/',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('telegram', 'create'),
      (req, res) => this.controller.create(req, res)
    )
    
    this.router.put('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('telegram', 'update'),
      (req, res) => this.controller.update(req, res)
    )
    
    this.router.delete('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('telegram', 'delete'),
      (req, res) => this.controller.delete(req, res)
    )
    
    this.router.post('/:id/test-connection',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('telegram', 'read'),
      (req, res) => this.controller.testConnection(req, res)
    )
  }

  getRouter () {
    return this.router
  }
}

module.exports = TelegramRoutes
