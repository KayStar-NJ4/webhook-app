const express = require('express')
const ZaloController = require('../../controllers/ZaloController')

/**
 * Zalo Routes - Admin API
 * Handles Zalo bot management routes
 */
class ZaloRoutes {
  constructor ({
    zaloBotRepository,
    zaloService,
    configurationService,
    authMiddleware,
    permissionMiddleware
  }) {
    this.zaloBotRepository = zaloBotRepository
    this.zaloService = zaloService
    this.configurationService = configurationService
    this.authMiddleware = authMiddleware
    this.permissionMiddleware = permissionMiddleware

    this.router = express.Router()
    this.controller = new ZaloController({
      zaloBotRepository,
      zaloService,
      configurationService,
      logger: { error: () => {}, info: () => {} }
    })
    this.setupRoutes()
  }

  setupRoutes () {
    // Zalo bot management API
    this.router.get('/',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('zalo', 'read'),
      (req, res) => this.controller.getAll(req, res)
    )

    this.router.get('/active',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('zalo', 'read'),
      (req, res) => this.controller.getActive(req, res)
    )

    this.router.get('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('zalo', 'read'),
      (req, res) => this.controller.getById(req, res)
    )

    this.router.post('/',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('zalo', 'create'),
      (req, res) => this.controller.create(req, res)
    )

    this.router.put('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('zalo', 'update'),
      (req, res) => this.controller.update(req, res)
    )

    this.router.delete('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('zalo', 'delete'),
      (req, res) => this.controller.delete(req, res)
    )

    this.router.post('/:id/test-connection',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('zalo', 'read'),
      (req, res) => this.controller.testConnection(req, res)
    )
  }

  getRouter () {
    return this.router
  }
}

module.exports = ZaloRoutes

