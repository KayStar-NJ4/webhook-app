const express = require('express')
const ZaloOAController = require('../../controllers/ZaloOAController')

/**
 * Zalo OA Routes - Admin API
 * Handles Zalo Official Account management routes
 */
class ZaloOARoutes {
  constructor ({
    zaloOARepository,
    zaloOAService,
    configurationService,
    authMiddleware,
    permissionMiddleware
  }) {
    this.zaloOARepository = zaloOARepository
    this.zaloOAService = zaloOAService
    this.configurationService = configurationService
    this.authMiddleware = authMiddleware
    this.permissionMiddleware = permissionMiddleware

    this.router = express.Router()
    this.controller = new ZaloOAController({
      zaloOARepository,
      zaloOAService,
      configurationService,
      logger: { error: () => {}, info: () => {} }
    })
    this.setupRoutes()
  }

  setupRoutes () {
    // Zalo OA management API
    this.router.get('/',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('zalo_oa', 'read'),
      (req, res) => this.controller.getAll(req, res)
    )

    this.router.get('/active',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('zalo_oa', 'read'),
      (req, res) => this.controller.getActive(req, res)
    )

    this.router.get('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('zalo_oa', 'read'),
      (req, res) => this.controller.getById(req, res)
    )

    this.router.post('/',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('zalo_oa', 'create'),
      (req, res) => this.controller.create(req, res)
    )

    this.router.put('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('zalo_oa', 'update'),
      (req, res) => this.controller.update(req, res)
    )

    this.router.delete('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('zalo_oa', 'delete'),
      (req, res) => this.controller.delete(req, res)
    )

    this.router.post('/:id/test-connection',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('zalo_oa', 'read'),
      (req, res) => this.controller.testConnection(req, res)
    )
  }

  getRouter () {
    return this.router
  }
}

module.exports = ZaloOARoutes

