const express = require('express')
const Validation = require('../middleware/Validation')

/**
 * API Routes
 * Defines API-related routes
 */
class ApiRoutes {
  constructor ({
    conversationController,
    telegramController,
    validation,
    errorHandler
  }) {
    this.conversationController = conversationController
    this.telegramController = telegramController
    this.validation = validation
    this.errorHandler = errorHandler
    this.router = express.Router()
    this.setupRoutes()
  }

  /**
   * Setup routes
   */
  setupRoutes () {
    // Status endpoint
    this.router.get('/status', (req, res) => {
      res.json({
        success: true,
        data: {
          status: 'running',
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        }
      })
    })

    // Conversation routes
    this.router.get('/conversations',
      this.validation.validate(Validation.schemas.conversationQuery, 'query'),
      this.errorHandler.asyncHandler(
        (req, res) => this.conversationController.getConversations(req, res)
      )
    )

    this.router.get('/conversations/:id',
      this.errorHandler.asyncHandler(
        (req, res) => this.conversationController.getConversationById(req, res)
      )
    )

    // Telegram routes
    this.router.post('/telegram/setup',
      this.validation.validate(Validation.schemas.webhookSetup, 'body'),
      this.errorHandler.asyncHandler(
        (req, res) => this.telegramController.setupWebhook(req, res)
      )
    )

    // Setup all active bots with base URL (appends /webhook/telegram/:botId)
    this.router.post('/telegram/setup-all',
      this.validation.validate(Validation.schemas.webhookSetup, 'body'),
      this.errorHandler.asyncHandler(
        (req, res) => this.telegramController.setupAllWebhooks(req, res)
      )
    )

    this.router.get('/telegram/webhook-info',
      this.errorHandler.asyncHandler(
        (req, res) => this.telegramController.getWebhookInfo(req, res)
      )
    )

    this.router.delete('/telegram/webhook',
      this.errorHandler.asyncHandler(
        (req, res) => this.telegramController.deleteWebhook(req, res)
      )
    )

    this.router.get('/telegram/bot-info',
      this.errorHandler.asyncHandler(
        (req, res) => this.telegramController.getBotInfo(req, res)
      )
    )

    this.router.post('/telegram/test',
      this.validation.validate(Validation.schemas.testMessage, 'body'),
      this.errorHandler.asyncHandler(
        (req, res) => this.telegramController.testMessage(req, res)
      )
    )

    // Test routes
    this.router.post('/test/telegram',
      this.validation.validate(Validation.schemas.testMessage, 'body'),
      this.errorHandler.asyncHandler(
        (req, res) => this.telegramController.testMessage(req, res)
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

module.exports = ApiRoutes
