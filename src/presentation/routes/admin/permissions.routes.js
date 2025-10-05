const express = require('express')
const PermissionController = require('../../controllers/PermissionController')

/**
 * Permissions Routes - Admin API
 * Handles permission management routes
 */
class PermissionsRoutes {
  constructor ({
    permissionService,
    userRepository,
    authMiddleware,
    permissionMiddleware,
    logger
  }) {
    this.router = express.Router()
    this.permissionController = new PermissionController({ permissionService, userRepository, logger })
    this.authMiddleware = authMiddleware
    this.permissionMiddleware = permissionMiddleware
    this.logger = logger

    this.setupRoutes()
  }

  setupRoutes () {
    // Permission management API routes
    this.router.get('/',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('permissions', 'read'),
      (req, res) => this.permissionController.getPermissions(req, res)
    )
    
    this.router.get('/grouped',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('permissions', 'read'),
      (req, res) => this.permissionController.getPermissionsGrouped(req, res)
    )
    
    this.router.get('/user-permissions',
      this.authMiddleware.verifyToken,
      (req, res) => this.permissionController.getUserPermissions(req, res)
    )
    
    this.router.get('/for-assignment',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('permissions', 'read'),
      (req, res) => this.permissionController.getPermissionsForAssignment(req, res)
    )
    
    this.router.post('/assign-role',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requireSuperAdmin(),
      (req, res) => this.permissionController.assignRoleToUser(req, res)
    )
    
    this.router.post('/remove-role',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requireSuperAdmin(),
      (req, res) => this.permissionController.removeRoleFromUser(req, res)
    )
    
    this.router.get('/check-permission',
      this.authMiddleware.verifyToken,
      (req, res) => this.permissionController.checkPermission(req, res)
    )
    
    this.router.put('/update-by-role/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('roles', 'manage_permissions'),
      (req, res) => this.permissionController.updateRolePermissions(req, res)
    )
  }

  getRouter () {
    return this.router
  }
}

module.exports = PermissionsRoutes
