const express = require('express')
const LogsController = require('../../controllers/LogsController')

/**
 * Logs Routes - Admin API
 * Handles logs management routes
 */
class LogsRoutes {
  constructor ({
    logsService,
    authMiddleware,
    permissionMiddleware,
    logger
  }) {
    this.router = express.Router()
    this.logsController = new LogsController({ logService: logsService, logger })
    this.authMiddleware = authMiddleware
    this.permissionMiddleware = permissionMiddleware
    this.logger = logger

    this.setupRoutes()
  }

  setupRoutes () {
    // Logs routes
    this.router.get('/',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('system', 'logs'),
      (req, res) => this.logsController.getLogs(req, res)
    )
    
    this.router.get('/errors',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('system', 'logs'),
      (req, res) => this.logsController.getErrorLogs(req, res)
    )
    
    this.router.get('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('system', 'logs'),
      (req, res) => this.logsController.getLogById(req, res)
    )
    
    this.router.delete('/cleanup',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('system', 'admin'),
      (req, res) => this.logsController.clearOldLogs(req, res)
    )
  }

  getRouter () {
    return this.router
  }
}

module.exports = LogsRoutes
