const express = require('express')
const ChatwootController = require('../../controllers/ChatwootController')

/**
 * Chatwoot Routes - Admin API
 * Handles chatwoot account management routes
 */
class ChatwootRoutes {
  constructor ({
    chatwootAccountRepository,
    chatwootService,
    authMiddleware,
    permissionMiddleware,
    logger
  }) {
    this.router = express.Router()
    this.controller = new ChatwootController({
      chatwootAccountRepository,
      chatwootService,
      logger
    })
    this.authMiddleware = authMiddleware
    this.permissionMiddleware = permissionMiddleware
    this.logger = logger

    this.setupRoutes()
  }

  setupRoutes () {
    // Chatwoot account management API
    this.router.get('/',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('chatwoot', 'read'),
      (req, res) => this.controller.getAll(req, res)
    )
    
    this.router.post('/',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('chatwoot', 'create'),
      (req, res) => this.controller.create(req, res)
    )
    
    this.router.put('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('chatwoot', 'update'),
      (req, res) => this.controller.update(req, res)
    )
    
    this.router.delete('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('chatwoot', 'delete'),
      (req, res) => this.controller.delete(req, res)
    )
    
    this.router.post('/:id/test-connection',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('chatwoot', 'read'),
      (req, res) => this.controller.testConnection(req, res)
    )
  }

  getRouter () {
    return this.router
  }
}

module.exports = ChatwootRoutes
