const express = require('express')
const AuthController = require('../controllers/AuthController')
const AdminController = require('../controllers/AdminController')
const UserController = require('../controllers/UserController')
const RoleController = require('../controllers/RoleController')
const PermissionController = require('../controllers/PermissionController')
const ConfigurationController = require('../controllers/ConfigurationController')
const LogsController = require('../controllers/LogsController')
const AuthMiddleware = require('../middleware/AuthMiddleware')
const PermissionMiddleware = require('../middleware/PermissionMiddleware')

/**
 * Admin Routes - Presentation layer
 * Handles admin panel API routes
 */
class AdminRoutes {
  constructor({ 
    userRepository, 
    telegramBotRepository, 
    chatwootAccountRepository, 
    difyAppRepository, 
    roleRepository,
    permissionRepository,
    configurationRepository,
    configurationService,
    logRepository,
    logsService,
    permissionService,
    logger 
  }) {
    this.router = express.Router()
    this.logger = logger
    
    // Initialize controllers
    this.authController = new AuthController({ userRepository, logger, configurationService })
    this.adminController = new AdminController({ 
      userRepository, 
      telegramBotRepository, 
      chatwootAccountRepository, 
      difyAppRepository, 
      logger 
    })
    this.userController = new UserController({ 
      userRepository, 
      logger 
    })
    this.roleController = new RoleController({ 
      roleRepository, 
      permissionRepository, 
      userRepository, 
      logger 
    })
    this.permissionController = new PermissionController({ 
      permissionService, 
      userRepository, 
      logger 
    })
    this.configurationController = new ConfigurationController({
      userRepository,
      chatwootAccountRepository,
      telegramBotRepository,
      difyAppRepository,
      configurationRepository,
      logger
    })
    this.logsController = new LogsController({ 
      logService: logsService, 
      logger 
    })
    this.authMiddleware = new AuthMiddleware({ logger, configurationService })
    this.permissionMiddleware = new PermissionMiddleware({ permissionService, logger })
    
    this.setupRoutes()
  }

  async initialize() {
    // Initialize auth components with database config
    await this.authController.initialize()
    await this.authMiddleware.initialize()
  }

  setupRoutes() {
    // Auth routes
    this.router.post('/auth/login', (req, res) => this.authController.login(req, res))
    this.router.get('/auth/me', this.authMiddleware.verifyToken, (req, res) => this.authController.getCurrentUser(req, res))
    this.router.post('/auth/logout', this.authMiddleware.verifyToken, (req, res) => this.authController.logout(req, res))
    this.router.post('/auth/change-password', this.authMiddleware.verifyToken, (req, res) => this.authController.changePassword(req, res))

    // Admin API routes (protected) - use /api prefix to avoid conflicts
    this.router.get('/api/admin/dashboard', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.addUserPermissions(),
      (req, res) => this.adminController.getDashboard(req, res)
    )
    
    // User management API
    this.router.get('/api/admin/users', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('users', 'read'),
      (req, res) => this.userController.getUsers(req, res)
    )
    this.router.get('/api/admin/users/:id', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('users', 'read'),
      (req, res) => this.userController.getUserById(req, res)
    )
    this.router.post('/api/admin/users', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('users', 'create'),
      (req, res) => this.userController.createUser(req, res)
    )
    this.router.put('/api/admin/users/:id', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('users', 'update'),
      (req, res) => this.userController.updateUser(req, res)
    )
    this.router.delete('/api/admin/users/:id', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('users', 'delete'),
      (req, res) => this.userController.deleteUser(req, res)
    )
    this.router.post('/api/admin/users/:id/change-password', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('users', 'update'),
      (req, res) => this.userController.changePassword(req, res)
    )
    this.router.patch('/api/admin/users/:id/status', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('users', 'update'),
      (req, res) => this.userController.updateUserStatus(req, res)
    )
    this.router.get('/api/admin/users/:id/roles', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('users', 'read'),
      (req, res) => this.userController.getUserRoles(req, res)
    )
    this.router.post('/api/admin/users/:id/roles', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('users', 'manage_roles'),
      (req, res) => this.userController.addUserRole(req, res)
    )
    this.router.delete('/api/admin/users/:id/roles/:roleId', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('users', 'manage_roles'),
      (req, res) => this.userController.removeUserRole(req, res)
    )
    this.router.put('/api/admin/users/:id/roles', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('users', 'manage_roles'),
      (req, res) => this.userController.updateUserRoles(req, res)
    )
    
    // Role management API
    this.router.get('/api/admin/roles', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('roles', 'read'),
      (req, res) => this.roleController.getRoles(req, res)
    )
    this.router.post('/api/admin/roles', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('roles', 'create'),
      (req, res) => this.roleController.createRole(req, res)
    )
    this.router.put('/api/admin/roles', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('roles', 'update'),
      (req, res) => this.roleController.updateRole(req, res)
    )
    this.router.delete('/api/admin/roles', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('roles', 'delete'),
      (req, res) => this.roleController.deleteRole(req, res)
    )
    this.router.get('/api/admin/roles/:id/users', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('roles', 'read'),
      (req, res) => this.roleController.getRoleUsers(req, res)
    )
    this.router.post('/api/admin/roles/:id/users', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('users', 'manage_permissions'),
      (req, res) => this.roleController.assignRoleToUser(req, res)
    )
    this.router.delete('/api/admin/roles/:roleId/users/:userId', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('users', 'manage_roles'),
      (req, res) => this.roleController.removeRoleFromUser(req, res)
    )
    
    // Telegram bot management API
    this.router.get('/api/admin/telegram-bots', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('telegram', 'read'),
      (req, res) => this.adminController.getTelegramBots(req, res)
    )
    this.router.post('/api/admin/telegram-bots', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('telegram', 'create'),
      (req, res) => this.adminController.createTelegramBot(req, res)
    )
    
    // Chatwoot account management API
    this.router.get('/api/admin/chatwoot-accounts', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('chatwoot', 'read'),
      (req, res) => this.adminController.getChatwootAccounts(req, res)
    )
    this.router.post('/api/admin/chatwoot-accounts', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('chatwoot', 'create'),
      (req, res) => this.adminController.createChatwootAccount(req, res)
    )
    this.router.put('/api/admin/chatwoot-accounts/:id', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('chatwoot', 'update'),
      (req, res) => this.adminController.updateChatwootAccount(req, res)
    )
    this.router.delete('/api/admin/chatwoot-accounts/:id', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('chatwoot', 'delete'),
      (req, res) => this.adminController.deleteChatwootAccount(req, res)
    )
    
    // Dify app management API
    this.router.get('/api/admin/dify-apps', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('dify', 'read'),
      (req, res) => this.adminController.getDifyApps(req, res)
    )
    this.router.post('/api/admin/dify-apps', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('dify', 'create'),
      (req, res) => this.adminController.createDifyApp(req, res)
    )

    // Permission management API routes
    this.router.get('/api/admin/permissions', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('permissions', 'read'),
      (req, res) => this.permissionController.getPermissions(req, res)
    )
    this.router.get('/api/admin/permissions/grouped', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('permissions', 'read'),
      (req, res) => this.permissionController.getPermissionsGrouped(req, res)
    )
    this.router.get('/api/admin/user-permissions', 
      this.authMiddleware.verifyToken, 
      (req, res) => this.permissionController.getUserPermissions(req, res)
    )
    this.router.get('/api/admin/permissions/for-assignment', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('permissions', 'read'),
      (req, res) => this.permissionController.getPermissionsForAssignment(req, res)
    )
    // Removed duplicate role management routes - using RoleController instead
    this.router.post('/api/admin/assign-role', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requireSuperAdmin(),
      (req, res) => this.permissionController.assignRoleToUser(req, res)
    )
    this.router.post('/api/admin/remove-role', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requireSuperAdmin(),
      (req, res) => this.permissionController.removeRoleFromUser(req, res)
    )
    // Removed duplicate role permissions route - using RoleController instead
    this.router.get('/api/admin/users/:id/roles', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requireSuperAdmin(),
      (req, res) => this.permissionController.getUserRoles(req, res)
    )
    this.router.get('/api/admin/check-permission', 
      this.authMiddleware.verifyToken, 
      (req, res) => this.permissionController.checkPermission(req, res)
    )
    this.router.put('/api/admin/permissions/update-by-role/:id', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('roles', 'manage_permissions'),
      (req, res) => this.permissionController.updateRolePermissions(req, res)
    )

    // User permissions management API routes
    this.router.get('/api/admin/users/:id/roles', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('users', 'read'),
      (req, res) => this.userController.getUserRoles(req, res)
    )
    this.router.get('/api/admin/users/:id/permissions', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('users', 'read'),
      (req, res) => this.userController.getUserPermissions(req, res)
    )
    this.router.put('/api/admin/users/:id/permissions', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('users', 'manage_permissions'),
      (req, res) => this.userController.updateUserPermissions(req, res)
    )

    // Configuration management API routes
    this.router.get('/api/admin/configurations/user', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('mappings', 'read'),
      (req, res) => this.configurationController.getUserConfigurations(req, res)
    )
    this.router.post('/api/admin/configurations/user', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('mappings', 'create'),
      (req, res) => this.configurationController.createUserConfiguration(req, res)
    )
    this.router.put('/api/admin/configurations/user/:id', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('mappings', 'update'),
      (req, res) => this.configurationController.updateUserConfiguration(req, res)
    )
    this.router.delete('/api/admin/configurations/user/:id', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('mappings', 'delete'),
      (req, res) => this.configurationController.deleteUserConfiguration(req, res)
    )
    this.router.get('/api/admin/configurations/resources', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('mappings', 'read'),
      (req, res) => this.configurationController.getAvailableResources(req, res)
    )
    this.router.get('/api/admin/configurations/system', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('configurations', 'read'),
      (req, res) => this.configurationController.getSystemConfigurations(req, res)
    )
    this.router.put('/api/admin/configurations/system', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('configurations', 'update'),
      (req, res) => this.configurationController.updateSystemConfiguration(req, res)
    )
    this.router.get('/api/admin/configurations/system/:key', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('configurations', 'read'),
      (req, res) => this.configurationController.getSystemConfigurationByKey(req, res)
    )
    this.router.delete('/api/admin/configurations/system/:id', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('configurations', 'delete'),
      (req, res) => this.configurationController.deleteSystemConfiguration(req, res)
    )
    this.router.get('/api/admin/configurations/test/:type/:id', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('mappings', 'read'),
      (req, res) => this.configurationController.testConfiguration(req, res)
    )

    // Logs routes
    this.router.get('/api/logs', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('system', 'logs'),
      (req, res) => this.logsController.getLogs(req, res)
    )
    this.router.get('/api/logs/errors', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('system', 'logs'),
      (req, res) => this.logsController.getErrorLogs(req, res)
    )
    this.router.get('/api/logs/:id', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('system', 'logs'),
      (req, res) => this.logsController.getLogById(req, res)
    )
    this.router.delete('/api/logs/cleanup', 
      this.authMiddleware.verifyToken, 
      this.permissionMiddleware.requirePermission('system', 'admin'),
      (req, res) => this.logsController.clearOldLogs(req, res)
    )

    // Serve admin static files (JS, CSS, etc.)
    this.router.get('/admin/src/*', (req, res) => {
      const filePath = req.path.replace('/admin/', 'admin/')
      res.sendFile(filePath, { root: 'public' })
    })

    // Serve admin panel
    this.router.get('/admin', (req, res) => {
      res.sendFile('admin/index.html', { root: 'public' })
    })

    // Catch-all for admin routes - serve the SPA
    this.router.get('/admin/*', (req, res) => {
      res.sendFile('admin/index.html', { root: 'public' })
    })
  }

  getRouter() {
    return this.router
  }
}

module.exports = AdminRoutes
