const express = require('express')
const DifyController = require('../../controllers/DifyController')

/**
 * Dify Routes - Admin API
 * Handles Dify app management routes
 */
class DifyRoutes {
  constructor ({
    difyAppRepository,
    difyService,
    authMiddleware,
    permissionMiddleware,
    logger
  }) {
    this.router = express.Router()
    this.controller = new DifyController({
      difyAppRepository,
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
      (req, res) => this.controller.getAll(req, res)
    )
    
    this.router.get('/active',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('dify', 'read'),
      (req, res) => this.controller.getActive(req, res)
    )
    
    this.router.get('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('dify', 'read'),
      (req, res) => this.controller.getById(req, res)
    )
    
    this.router.post('/',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('dify', 'create'),
      (req, res) => this.controller.create(req, res)
    )
    
    this.router.put('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('dify', 'update'),
      (req, res) => this.controller.update(req, res)
    )
    
    this.router.delete('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('dify', 'delete'),
      (req, res) => this.controller.delete(req, res)
    )
    
    this.router.post('/:id/test-connection',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('dify', 'read'),
      (req, res) => this.controller.testConnection(req, res)
    )
  }

  getRouter () {
    return this.router
  }
}

module.exports = DifyRoutes
