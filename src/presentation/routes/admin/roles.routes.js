const express = require('express')
const RoleController = require('../../controllers/RoleController')

/**
 * Roles Routes - Admin API
 * Handles role management routes
 */
class RolesRoutes {
  constructor ({
    roleRepository,
    permissionRepository,
    userRepository,
    authMiddleware,
    permissionMiddleware,
    logger
  }) {
    this.router = express.Router()
    this.roleController = new RoleController({
      roleRepository,
      permissionRepository,
      userRepository,
      logger
    })
    this.authMiddleware = authMiddleware
    this.permissionMiddleware = permissionMiddleware
    this.logger = logger

    this.setupRoutes()
  }

  setupRoutes () {
    // Role management API
    this.router.get('/',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('roles', 'read'),
      (req, res) => this.roleController.getRoles(req, res)
    )
    
    this.router.post('/',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('roles', 'create'),
      (req, res) => this.roleController.createRole(req, res)
    )
    
    this.router.put('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('roles', 'update'),
      (req, res) => this.roleController.updateRole(req, res)
    )
    
    this.router.delete('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('roles', 'delete'),
      (req, res) => this.roleController.deleteRole(req, res)
    )
    
    this.router.get('/:id/users',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('roles', 'read'),
      (req, res) => this.roleController.getRoleUsers(req, res)
    )
    
    this.router.post('/:id/users',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('users', 'manage_permissions'),
      (req, res) => this.roleController.assignRoleToUser(req, res)
    )
    
    this.router.delete('/:roleId/users/:userId',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('users', 'manage_roles'),
      (req, res) => this.roleController.removeRoleFromUser(req, res)
    )
    
    this.router.get('/:id/permissions',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('roles', 'read'),
      (req, res) => this.roleController.getRolePermissions(req, res)
    )
    
    this.router.put('/:id/permissions',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('roles', 'manage_permissions'),
      (req, res) => this.roleController.updateRolePermissions(req, res)
    )
  }

  getRouter () {
    return this.router
  }
}

module.exports = RolesRoutes
