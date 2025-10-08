const express = require('express')
const WebController = require('../../controllers/WebController')

/**
 * Web Routes - Admin API
 * Handles web app management routes (CRUD only, no webhook)
 */
class WebRoutes {
  constructor ({
    webAppRepository,
    webConversationRepository,
    webMessageRepository,
    authMiddleware,
    permissionMiddleware,
    logger
  }) {
    this.router = express.Router()
    // Only inject repositories for admin CRUD, no broker/service needed
    this.controller = new WebController({
      webAppRepository,
      webConversationRepository,
      webMessageRepository,
      logger
    })
    this.authMiddleware = authMiddleware
    this.permissionMiddleware = permissionMiddleware
    this.logger = logger

    this.setupRoutes()
  }

  setupRoutes () {
    // Web app management API
    this.router.get('/',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('web', 'read'),
      (req, res) => this.controller.getAll(req, res)
    )
    
    this.router.get('/active',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('web', 'read'),
      (req, res) => this.controller.getActive(req, res)
    )
    
    this.router.get('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('web', 'read'),
      (req, res) => this.controller.getById(req, res)
    )
    
    this.router.post('/',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('web', 'create'),
      (req, res) => this.controller.create(req, res)
    )
    
    this.router.put('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('web', 'update'),
      (req, res) => this.controller.update(req, res)
    )
    
    this.router.delete('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('web', 'delete'),
      (req, res) => this.controller.delete(req, res)
    )
    
    this.router.get('/:id/statistics',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('web', 'read'),
      (req, res) => this.controller.getStatistics(req, res)
    )
    
    this.router.get('/:id/conversations',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('web', 'manage_conversations'),
      (req, res) => this.controller.getConversations(req, res)
    )
  }

  getRouter () {
    return this.router
  }
}

module.exports = WebRoutes
