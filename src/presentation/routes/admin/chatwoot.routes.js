const express = require('express')
const AdminController = require('../../controllers/AdminController')

/**
 * Chatwoot Routes - Admin API
 * Handles chatwoot account management routes
 */
class ChatwootRoutes {
  constructor ({
    userRepository,
    telegramBotRepository,
    chatwootAccountRepository,
    difyAppRepository,
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
      (req, res) => this.adminController.getChatwootAccounts(req, res)
    )
    
    this.router.post('/',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('chatwoot', 'create'),
      (req, res) => this.adminController.createChatwootAccount(req, res)
    )
    
    this.router.put('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('chatwoot', 'update'),
      (req, res) => this.adminController.updateChatwootAccount(req, res)
    )
    
    this.router.delete('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('chatwoot', 'delete'),
      (req, res) => this.adminController.deleteChatwootAccount(req, res)
    )
  }

  getRouter () {
    return this.router
  }
}

module.exports = ChatwootRoutes
