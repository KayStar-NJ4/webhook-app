const express = require('express')
const ConfigurationController = require('../../controllers/ConfigurationController')

/**
 * Configurations Routes - Admin API
 * Handles configuration management routes
 */
class ConfigsRoutes {
  constructor ({
    userRepository,
    chatwootAccountRepository,
    telegramBotRepository,
    difyAppRepository,
    configurationRepository,
    authMiddleware,
    permissionMiddleware,
    logger
  }) {
    this.router = express.Router()
    this.configurationController = new ConfigurationController({
      userRepository,
      chatwootAccountRepository,
      telegramBotRepository,
      difyAppRepository,
      configurationRepository,
      logger
    })
    this.authMiddleware = authMiddleware
    this.permissionMiddleware = permissionMiddleware
    this.logger = logger

    this.setupRoutes()
  }

  setupRoutes () {
    // Configuration management API routes
    this.router.get('/user',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('mappings', 'read'),
      (req, res) => this.configurationController.getUserConfigurations(req, res)
    )
    
    this.router.post('/user',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('mappings', 'create'),
      (req, res) => this.configurationController.createUserConfiguration(req, res)
    )
    
    this.router.put('/user/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('mappings', 'update'),
      (req, res) => this.configurationController.updateUserConfiguration(req, res)
    )
    
    this.router.delete('/user/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('mappings', 'delete'),
      (req, res) => this.configurationController.deleteUserConfiguration(req, res)
    )
    
    this.router.get('/resources',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('mappings', 'read'),
      (req, res) => this.configurationController.getAvailableResources(req, res)
    )
    
    this.router.get('/system',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('configurations', 'read'),
      (req, res) => this.configurationController.getSystemConfigurations(req, res)
    )
    
    this.router.put('/system',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('configurations', 'update'),
      (req, res) => this.configurationController.updateSystemConfiguration(req, res)
    )
    
    this.router.get('/system/:key',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('configurations', 'read'),
      (req, res) => this.configurationController.getSystemConfigurationByKey(req, res)
    )
    
    this.router.delete('/system/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('configurations', 'delete'),
      (req, res) => this.configurationController.deleteSystemConfiguration(req, res)
    )
    
    this.router.get('/test/:type/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('mappings', 'read'),
      (req, res) => this.configurationController.testConfiguration(req, res)
    )
  }

  getRouter () {
    return this.router
  }
}

module.exports = ConfigsRoutes
