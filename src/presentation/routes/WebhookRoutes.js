const express = require('express')
const Validation = require('../middleware/Validation')

/**
 * Webhook Routes
 * Defines webhook-related routes
 */
class WebhookRoutes {
  constructor ({ webhookController, validation, errorHandler }) {
    this.webhookController = webhookController
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
    this.router.get('/health', this.errorHandler.asyncHandler(
      (req, res) => this.webhookController.healthCheck(req, res)
    ))

    // Telegram webhook - auto-detect bot ID
    this.router.post('/telegram',
      this.validation.validate(Validation.schemas.telegramWebhook, 'body'),
      this.errorHandler.asyncHandler(
        (req, res) => this.webhookController.handleTelegramWebhook(req, res)
      )
    )

    // Telegram webhook with explicit botId in URL (optional)
    this.router.post('/telegram/:botId',
      this.validation.validate(Validation.schemas.telegramWebhook, 'body'),
      this.errorHandler.asyncHandler(
        (req, res) => this.webhookController.handleTelegramWebhook(req, res)
      )
    )

    // Chatwoot webhook - GET for verification, POST for events
    this.router.get('/chatwoot',
      this.errorHandler.asyncHandler(
        (req, res) => this.webhookController.handleChatwootVerification(req, res)
      )
    )

    this.router.post('/chatwoot',
      this.validation.validate(Validation.schemas.chatwootWebhook, 'body'),
      this.errorHandler.asyncHandler(
        (req, res) => this.webhookController.handleChatwootWebhook(req, res)
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

module.exports = WebhookRoutes
