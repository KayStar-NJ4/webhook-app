const express = require('express')
const UserController = require('../../controllers/UserController')

/**
 * Users Routes - Admin API
 * Handles user management routes
 */
class UsersRoutes {
  constructor ({
    userRepository,
    authMiddleware,
    permissionMiddleware,
    logger
  }) {
    this.router = express.Router()
    this.userController = new UserController({ userRepository, logger })
    this.authMiddleware = authMiddleware
    this.permissionMiddleware = permissionMiddleware
    this.logger = logger

    this.setupRoutes()
  }

  setupRoutes () {
    // User management API
    this.router.get('/',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('users', 'read'),
      (req, res) => this.userController.getUsers(req, res)
    )
    
    this.router.get('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('users', 'read'),
      (req, res) => this.userController.getUserById(req, res)
    )
    
    this.router.post('/',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('users', 'create'),
      (req, res) => this.userController.createUser(req, res)
    )
    
    this.router.put('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('users', 'update'),
      (req, res) => this.userController.updateUser(req, res)
    )
    
    this.router.delete('/:id',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('users', 'delete'),
      (req, res) => this.userController.deleteUser(req, res)
    )
    
    this.router.post('/:id/change-password',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('users', 'update'),
      (req, res) => this.userController.changePassword(req, res)
    )
    
    this.router.patch('/:id/status',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('users', 'update'),
      (req, res) => this.userController.updateUserStatus(req, res)
    )
    
    this.router.get('/:id/roles',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('users', 'read'),
      (req, res) => this.userController.getUserRoles(req, res)
    )
    
    this.router.post('/:id/roles',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('users', 'manage_roles'),
      (req, res) => this.userController.addUserRole(req, res)
    )
    
    this.router.delete('/:id/roles/:roleId',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('users', 'manage_roles'),
      (req, res) => this.userController.removeUserRole(req, res)
    )
    
    this.router.put('/:id/roles',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('users', 'manage_roles'),
      (req, res) => this.userController.updateUserRoles(req, res)
    )
    
    this.router.get('/:id/permissions',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('users', 'read'),
      (req, res) => this.userController.getUserPermissions(req, res)
    )
    
    this.router.put('/:id/permissions',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.requirePermission('users', 'manage_permissions'),
      (req, res) => this.userController.updateUserPermissions(req, res)
    )
  }

  getRouter () {
    return this.router
  }
}

module.exports = UsersRoutes
