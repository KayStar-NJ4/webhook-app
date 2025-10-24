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
    permissionMiddleware,
    errorHandler
  }) {
    this.zaloBotRepository = zaloBotRepository
    this.zaloService = zaloService
    this.configurationService = configurationService
    this.authMiddleware = authMiddleware
    this.permissionMiddleware = permissionMiddleware
    this.errorHandler = errorHandler

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
    // Apply auth middleware to all routes
    this.router.use(this.authMiddleware.authenticate.bind(this.authMiddleware))

    // Zalo bot management API
    this.router.get('/',
      this.permissionMiddleware.requirePermission('zalo', 'read'),
      this.errorHandler.asyncHandler((req, res) => this.controller.getAll(req, res))
    )

    this.router.get('/active',
      this.permissionMiddleware.requirePermission('zalo', 'read'),
      this.errorHandler.asyncHandler((req, res) => this.controller.getActive(req, res))
    )

    this.router.get('/:id',
      this.permissionMiddleware.requirePermission('zalo', 'read'),
      this.errorHandler.asyncHandler((req, res) => this.controller.getById(req, res))
    )

    this.router.post('/',
      this.permissionMiddleware.requirePermission('zalo', 'create'),
      this.errorHandler.asyncHandler((req, res) => this.controller.create(req, res))
    )

    this.router.put('/:id',
      this.permissionMiddleware.requirePermission('zalo', 'update'),
      this.errorHandler.asyncHandler((req, res) => this.controller.update(req, res))
    )

    this.router.delete('/:id',
      this.permissionMiddleware.requirePermission('zalo', 'delete'),
      this.errorHandler.asyncHandler((req, res) => this.controller.delete(req, res))
    )

    this.router.post('/:id/test-connection',
      this.permissionMiddleware.requirePermission('zalo', 'read'),
      this.errorHandler.asyncHandler((req, res) => this.controller.testConnection(req, res))
    )
  }

  getRouter () {
    return this.router
  }
}

module.exports = ZaloRoutes

