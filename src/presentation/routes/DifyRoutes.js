/**
 * Dify Routes - Presentation layer
 * Handles Dify app management routes
 */
const express = require('express')
const router = express.Router()

class DifyRoutes {
  constructor({ 
    difyController,
    authMiddleware,
    permissionMiddleware,
    validationMiddleware,
    logger 
  }) {
    this.difyController = difyController
    this.authMiddleware = authMiddleware
    this.permissionMiddleware = permissionMiddleware
    this.validationMiddleware = validationMiddleware
    this.logger = logger
  }

  /**
   * Initialize routes
   */
  initialize() {
    // Apply authentication middleware to all routes
    router.use(this.authMiddleware.authenticate)

    // Dify Apps CRUD routes
    router.get('/', 
      this.permissionMiddleware.checkPermission('dify', 'read'),
      this.difyController.getDifyApps.bind(this.difyController)
    )

    router.get('/active',
      this.permissionMiddleware.checkPermission('dify', 'read'),
      this.difyController.getActiveDifyApps.bind(this.difyController)
    )

    router.get('/:id',
      this.permissionMiddleware.checkPermission('dify', 'read'),
      this.difyController.getDifyAppById.bind(this.difyController)
    )

    router.post('/',
      this.permissionMiddleware.checkPermission('dify', 'create'),
      this.validationMiddleware.validateDifyApp,
      this.difyController.createDifyApp.bind(this.difyController)
    )

    router.put('/:id',
      this.permissionMiddleware.checkPermission('dify', 'update'),
      this.validationMiddleware.validateDifyAppUpdate,
      this.difyController.updateDifyApp.bind(this.difyController)
    )

    router.delete('/:id',
      this.permissionMiddleware.checkPermission('dify', 'delete'),
      this.difyController.deleteDifyApp.bind(this.difyController)
    )

    // Test connection
    router.post('/:id/test',
      this.permissionMiddleware.checkPermission('dify', 'read'),
      this.difyController.testDifyAppConnection.bind(this.difyController)
    )

    // Mapping routes
    router.post('/mappings',
      this.permissionMiddleware.checkPermission('dify', 'create'),
      this.validationMiddleware.validateDifyMapping,
      this.difyController.createMapping.bind(this.difyController)
    )

    router.delete('/mappings/:mappingId',
      this.permissionMiddleware.checkPermission('dify', 'delete'),
      this.difyController.deleteMapping.bind(this.difyController)
    )

    return router
  }
}

module.exports = DifyRoutes
