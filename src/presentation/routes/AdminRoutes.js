const express = require('express')
const AdminController = require('../controllers/AdminController')
const AuthController = require('../controllers/AuthController')
const AuthMiddleware = require('../middleware/AuthMiddleware')
const PermissionMiddleware = require('../middleware/PermissionMiddleware')

// Import admin routes
const AdminRoutesIndex = require('./admin')

/**
 * Admin Routes - Main router that combines all admin routes
 * Handles admin panel API routes organization
 */
class AdminRoutes {
  constructor ({
    userRepository,
    customerService,
    telegramBotRepository,
    zaloBotRepository,
    chatwootAccountRepository,
    difyAppRepository,
    webAppRepository,
    webConversationRepository,
    webMessageRepository,
    roleRepository,
    permissionRepository,
    configurationRepository,
    configurationService,
    logRepository,
    logsService,
    permissionService,
    platformMappingService,
    telegramService,
    zaloService,
    chatwootService,
    difyService,
    logger
  }) {
    this.router = express.Router()
    this.logger = logger

    // Initialize middleware
    this.authMiddleware = new AuthMiddleware({ logger, configurationService })
    this.permissionMiddleware = new PermissionMiddleware({ permissionService, logger })

    // Initialize controllers
    this.adminController = new AdminController({
      userRepository,
      telegramBotRepository,
      chatwootAccountRepository,
      difyAppRepository,
      webAppRepository,
      logger
    })

    this.authController = new AuthController({
      userRepository,
      configurationService,
      logger
    })

    // Initialize admin routes
    this.adminRoutes = new AdminRoutesIndex({
      userRepository,
      customerService,
      telegramBotRepository,
      zaloBotRepository,
      chatwootAccountRepository,
      difyAppRepository,
      webAppRepository,
      webConversationRepository,
      webMessageRepository,
      roleRepository,
      permissionRepository,
      configurationRepository,
      configurationService,
      logRepository,
      logsService,
      permissionService,
      platformMappingService,
      telegramService,
      zaloService,
      chatwootService,
      difyService,
      logger
    })

    this.setupRoutes()
  }

  async initialize () {
    // Initialize middleware with database config
    await this.authMiddleware.initialize()
    await this.adminRoutes.initialize()
  }

  setupRoutes () {
    // Auth routes (direct access for frontend)
    this.router.post('/auth/login', (req, res) => this.authController.login(req, res))
    this.router.get('/auth/me', this.authMiddleware.verifyToken, (req, res) => this.authController.getCurrentUser(req, res))
    this.router.post('/auth/logout', this.authMiddleware.verifyToken, (req, res) => this.authController.logout(req, res))
    this.router.post('/auth/change-password', this.authMiddleware.verifyToken, (req, res) => this.authController.changePassword(req, res))

    // Admin dashboard route
    this.router.get('/api/admin/dashboard',
      this.authMiddleware.verifyToken,
      this.permissionMiddleware.addUserPermissions(),
      (req, res) => this.adminController.getDashboard(req, res)
    )

    // Mount all admin API routes
    this.router.use('/api/admin', this.adminRoutes.getRouter())

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

  getRouter () {
    return this.router
  }
}

module.exports = AdminRoutes