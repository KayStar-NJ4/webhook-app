const express = require('express')
const PlatformMappingController = require('../../controllers/PlatformMappingController')

/**
 * Platform Routes - Admin API
 * Handles platform mapping management routes
 */
class PlatformRoutes {
  constructor ({
    platformMappingService,
    authMiddleware,
    permissionMiddleware,
    logger
  }) {
    this.router = express.Router()
    this.platformMappingController = new PlatformMappingController({ platformMappingService, logger })
    this.authMiddleware = authMiddleware
    this.permissionMiddleware = permissionMiddleware
    this.logger = logger

    this.setupRoutes()
  }

  setupRoutes () {
    // Platform mapping management API
    this.router.get('/',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('platform_mappings', 'read'),
      (req, res) => this.platformMappingController.getAllMappings(req, res)
    )
    
    this.router.get('/available-platforms',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('platform_mappings', 'read'),
      (req, res) => this.platformMappingController.getAvailablePlatforms(req, res)
    )
    
    this.router.post('/',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('platform_mappings', 'create'),
      (req, res) => this.platformMappingController.createMapping(req, res)
    )
    
    this.router.get('/telegram-bot/:telegramBotId',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('platform_mappings', 'read'),
      (req, res) => this.platformMappingController.getMappingsByTelegramBot(req, res)
    )
    
    this.router.get('/chatwoot-account/:chatwootAccountId',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('platform_mappings', 'read'),
      (req, res) => this.platformMappingController.getMappingsByChatwootAccount(req, res)
    )
    
    this.router.get('/dify-app/:difyAppId',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('platform_mappings', 'read'),
      (req, res) => this.platformMappingController.getMappingsByDifyApp(req, res)
    )
    
    this.router.get('/telegram-bot/:telegramBotId/routing',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('platform_mappings', 'read'),
      (req, res) => this.platformMappingController.getRoutingConfiguration(req, res)
    )
    
    this.router.put('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('platform_mappings', 'update'),
      (req, res) => this.platformMappingController.updateMapping(req, res)
    )
    
    
    this.router.post('/:id/test-message-flow',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('platform_mappings', 'read'),
      (req, res) => this.platformMappingController.testMessageFlow(req, res)
    )
    
    this.router.delete('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('platform_mappings', 'delete'),
      (req, res) => this.platformMappingController.deleteMapping(req, res)
    )
    
    this.router.post('/:id/test-connection',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('platform_mappings', 'read'),
      (req, res) => this.platformMappingController.testConnection(req, res)
    )
  }

  getRouter () {
    return this.router
  }
}

module.exports = PlatformRoutes
