const express = require('express')
const AdminController = require('../../controllers/AdminController')

/**
 * Dify Routes - Admin API
 * Handles Dify app management routes
 */
class DifyRoutes {
  constructor ({
    userRepository,
    telegramBotRepository,
    chatwootAccountRepository,
    difyAppRepository,
    telegramService,
    chatwootService,
    difyService,
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
      logger
    })
    this.authMiddleware = authMiddleware
    this.permissionMiddleware = permissionMiddleware
    this.logger = logger

    this.setupRoutes()
  }

  setupRoutes () {
    // Dify app management API
    this.router.get('/',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('dify', 'read'),
      (req, res) => this.adminController.getDifyApps(req, res)
    )
    
    this.router.get('/active',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('dify', 'read'),
      (req, res) => this.adminController.getActiveDifyApps(req, res)
    )
    
    this.router.get('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('dify', 'read'),
      (req, res) => this.adminController.getDifyAppById(req, res)
    )
    
    this.router.post('/',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('dify', 'create'),
      (req, res) => this.adminController.createDifyApp(req, res)
    )
    
    this.router.put('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('dify', 'update'),
      (req, res) => this.adminController.updateDifyApp(req, res)
    )
    
    this.router.delete('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('dify', 'delete'),
      (req, res) => this.adminController.deleteDifyApp(req, res)
    )
    
    this.router.post('/mappings',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('dify', 'create'),
      (req, res) => this.adminController.createMapping(req, res)
    )
    
    this.router.delete('/mappings/:mappingId',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('dify', 'delete'),
      (req, res) => this.adminController.deleteMapping(req, res)
    )
    
    this.router.post('/:id/test-connection',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('dify', 'read'),
      (req, res) => this.adminController.testDifyAppConnection(req, res)
    )
  }

  getRouter () {
    return this.router
  }
}

module.exports = DifyRoutes
