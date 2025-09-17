const express = require('express')
const Validation = require('../middleware/Validation')

/**
 * Platform Mapping Routes
 * Defines routes for platform mapping operations
 */
class PlatformMappingRoutes {
  constructor({ 
    platformMappingController, 
    validation, 
    errorHandler,
    authMiddleware,
    permissionMiddleware
  }) {
    this.platformMappingController = platformMappingController
    this.validation = validation
    this.errorHandler = errorHandler
    this.authMiddleware = authMiddleware
    this.permissionMiddleware = permissionMiddleware
    this.router = express.Router()
    this.setupRoutes()
  }

  /**
   * Setup routes
   */
  setupRoutes() {
    // Apply authentication middleware to all routes
    this.router.use(this.authMiddleware.authenticate)

    // Get available platforms for mapping
    this.router.get('/available-platforms',
      this.permissionMiddleware.checkPermission('platform_mappings', 'read'),
      this.errorHandler.asyncHandler(
        (req, res) => this.platformMappingController.getAvailablePlatforms(req, res)
      )
    )

    // Get all platform mappings
    this.router.get('/',
      this.permissionMiddleware.checkPermission('platform_mappings', 'read'),
      this.errorHandler.asyncHandler(
        (req, res) => this.platformMappingController.getAllMappings(req, res)
      )
    )

    // Create new platform mapping
    this.router.post('/',
      this.permissionMiddleware.checkPermission('platform_mappings', 'create'),
      this.validation.validate(Validation.schemas.platformMapping, 'body'),
      this.errorHandler.asyncHandler(
        (req, res) => this.platformMappingController.createMapping(req, res)
      )
    )

    // Get mappings by Telegram bot ID
    this.router.get('/telegram-bot/:telegramBotId',
      this.permissionMiddleware.checkPermission('platform_mappings', 'read'),
      this.errorHandler.asyncHandler(
        (req, res) => this.platformMappingController.getMappingsByTelegramBot(req, res)
      )
    )

    // Get mappings by Chatwoot account ID
    this.router.get('/chatwoot-account/:chatwootAccountId',
      this.permissionMiddleware.checkPermission('platform_mappings', 'read'),
      this.errorHandler.asyncHandler(
        (req, res) => this.platformMappingController.getMappingsByChatwootAccount(req, res)
      )
    )

    // Get mappings by Dify app ID
    this.router.get('/dify-app/:difyAppId',
      this.permissionMiddleware.checkPermission('platform_mappings', 'read'),
      this.errorHandler.asyncHandler(
        (req, res) => this.platformMappingController.getMappingsByDifyApp(req, res)
      )
    )

    // Get routing configuration for Telegram bot
    this.router.get('/telegram-bot/:telegramBotId/routing',
      this.permissionMiddleware.checkPermission('platform_mappings', 'read'),
      this.errorHandler.asyncHandler(
        (req, res) => this.platformMappingController.getRoutingConfiguration(req, res)
      )
    )

    // Update platform mapping
    this.router.put('/:id',
      this.permissionMiddleware.checkPermission('platform_mappings', 'update'),
      this.validation.validate(Validation.schemas.platformMappingUpdate, 'body'),
      this.errorHandler.asyncHandler(
        (req, res) => this.platformMappingController.updateMapping(req, res)
      )
    )

    // Test connection for platform mapping
    this.router.post('/:id/test-connection',
      this.permissionMiddleware.checkPermission('platform_mappings', 'read'),
      this.errorHandler.asyncHandler(
        (req, res) => this.platformMappingController.testConnection(req, res)
      )
    )

    // Test connection for specific platform components
    this.router.post('/test/:platform/:component',
      this.permissionMiddleware.checkPermission('platform_mappings', 'read'),
      this.errorHandler.asyncHandler(
        (req, res) => this.platformMappingController.testPlatformConnection(req, res)
      )
    )

    // Delete platform mapping
    this.router.delete('/:id',
      this.permissionMiddleware.checkPermission('platform_mappings', 'delete'),
      this.errorHandler.asyncHandler(
        (req, res) => this.platformMappingController.deleteMapping(req, res)
      )
    )
  }

  /**
   * Get router instance
   * @returns {express.Router}
   */
  getRouter() {
    return this.router
  }
}

module.exports = PlatformMappingRoutes
