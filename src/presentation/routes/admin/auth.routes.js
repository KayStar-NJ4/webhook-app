const express = require('express')
const AuthController = require('../../controllers/AuthController')

/**
 * Auth Routes - Admin API
 * Handles authentication routes
 */
class AuthRoutes {
  constructor ({
    userRepository,
    configurationService,
    authMiddleware,
    logger
  }) {
    this.router = express.Router()
    this.authController = new AuthController({ userRepository, logger, configurationService })
    this.authMiddleware = authMiddleware
    this.logger = logger

    this.setupRoutes()
  }

  setupRoutes () {
    // Auth routes
    this.router.post('/login', (req, res) => this.authController.login(req, res))
    this.router.get('/me', this.authMiddleware.verifyToken, (req, res) => this.authController.getCurrentUser(req, res))
    this.router.post('/logout', this.authMiddleware.verifyToken, (req, res) => this.authController.logout(req, res))
    this.router.post('/change-password', this.authMiddleware.verifyToken, (req, res) => this.authController.changePassword(req, res))
  }

  getRouter () {
    return this.router
  }
}

module.exports = AuthRoutes
