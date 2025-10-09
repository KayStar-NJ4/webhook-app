const express = require('express')

/**
 * Web Routes
 * Defines web platform webhook routes
 */
class WebRoutes {
  constructor ({ webController, validation, errorHandler }) {
    this.webController = webController
    this.validation = validation
    this.errorHandler = errorHandler
    this.router = express.Router()
    this.setupRoutes()
  }

  /**
   * Setup routes
   */
  setupRoutes () {
    // Health check
    this.router.get('/health',
      this.errorHandler.asyncHandler(
        (req, res) => this.webController.healthCheck(req, res)
      )
    )

    // Handle incoming message from web client
    this.router.post('/',
      this.errorHandler.asyncHandler(
        (req, res) => this.webController.handleMessage(req, res)
      )
    )

    // Get conversation history
    this.router.get('/history/:sessionId',
      this.errorHandler.asyncHandler(
        (req, res) => this.webController.getHistory(req, res)
      )
    )

    // Test web app configuration
    this.router.get('/test/:appId',
      this.errorHandler.asyncHandler(
        (req, res) => this.webController.testConfiguration(req, res)
      )
    )
  }

  /**
   * Get router instance
   * @returns {express.Router}
   */
  getRouter () {
    return this.router
  }
}

module.exports = WebRoutes
