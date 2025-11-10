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

    // Zalo webhook verification (GET request)
    this.router.get('/zalo',
      this.errorHandler.asyncHandler(
        (req, res) => this.webhookController.handleZaloVerification(req, res)
      )
    )

    this.router.get('/zalo/:botId',
      this.errorHandler.asyncHandler(
        (req, res) => this.webhookController.handleZaloVerification(req, res)
      )
    )

    // Zalo webhook - auto-detect bot ID
    this.router.post('/zalo',
      this.validation.validate(Validation.schemas.zaloWebhook, 'body'), // Use Zalo schema
      this.errorHandler.asyncHandler(
        (req, res) => this.webhookController.handleZaloWebhook(req, res)
      )
    )

    // Zalo webhook with explicit botId in URL (optional)
    this.router.post('/zalo/:botId',
      this.validation.validate(Validation.schemas.zaloWebhook, 'body'), // Use Zalo schema
      this.errorHandler.asyncHandler(
        (req, res) => this.webhookController.handleZaloWebhook(req, res)
      )
    )

    // Zalo OA webhook - auto-detect OA ID
    this.router.post('/zalo-oa',
      this.validation.validate(Validation.schemas.zaloOAWebhook, 'body'),
      this.errorHandler.asyncHandler(
        (req, res) => this.webhookController.handleZaloOAWebhook(req, res)
      )
    )

    // Zalo OA webhook with explicit oaId in URL (optional)
    this.router.post('/zalo-oa/:oaId',
      this.validation.validate(Validation.schemas.zaloOAWebhook, 'body'),
      this.errorHandler.asyncHandler(
        (req, res) => this.webhookController.handleZaloOAWebhook(req, res)
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

    // Chatwoot Bot webhook - for Dify messages via Bot
    this.router.post('/chatwoot/bot',
      this.validation.validate(Validation.schemas.chatwootWebhook, 'body'),
      this.errorHandler.asyncHandler(
        (req, res) => this.webhookController.handleChatwootBotWebhook(req, res)
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
