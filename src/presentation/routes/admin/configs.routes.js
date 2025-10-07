const express = require('express')
const ConfigurationController = require('../../controllers/ConfigurationController')

/**
 * Configuration Routes - Admin API
 * Handles system configuration routes
 */
class ConfigsRoutes {
  constructor ({
    configurationRepository,
    authMiddleware,
    permissionMiddleware,
    logger
  }) {
    this.router = express.Router()
    
    this.configurationController = new ConfigurationController({
      configurationRepository,
      logger
    })
    this.authMiddleware = authMiddleware
    this.permissionMiddleware = permissionMiddleware
    this.logger = logger

    this.setupRoutes()
  }

  setupRoutes () {
    // System configuration management API
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
    
    this.router.delete('/system/:key',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('configurations', 'delete'),
      (req, res) => this.configurationController.deleteSystemConfiguration(req, res)
    )
  }

  getRouter () {
    return this.router
  }
}

module.exports = ConfigsRoutes
