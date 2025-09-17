/**
 * Webhook Controller - Presentation layer
 * Handles HTTP requests for webhooks
 */
class WebhookController {
  constructor({ messageBrokerService, logger }) {
    this.messageBrokerService = messageBrokerService
    this.logger = logger
  }

  /**
   * Handle Telegram webhook
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async handleTelegramWebhook(req, res) {
    try {
      const botIdFromPath = req.params?.botId
      const secretToken = req.headers['x-telegram-bot-api-secret-token']
      this.logger.info('Received Telegram webhook', { body: req.body, botIdFromPath, hasSecretToken: !!secretToken })

      // Attach botId to body metadata if provided
      const body = { ...req.body }
      if (botIdFromPath) {
        body.__bot_id = botIdFromPath
      }
      if (secretToken) {
        body.__secret_token = secretToken
      }

      const result = await this.messageBrokerService.handleTelegramWebhook(body)

      res.status(200).json({
        success: true,
        data: result
      })

    } catch (error) {
      this.logger.error('Telegram webhook error', {
        error: error.message,
        stack: error.stack,
        body: req.body
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * Handle Chatwoot webhook verification (GET request)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async handleChatwootVerification(req, res) {
    try {
      this.logger.info('Received Chatwoot webhook verification', { 
        query: req.query,
        headers: req.headers 
      })

      // Chatwoot sends GET request for webhook verification
      // Just return 200 OK to confirm webhook is working
      res.status(200).json({
        success: true,
        message: 'Chatwoot webhook verified successfully',
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      this.logger.error('Chatwoot webhook verification error', {
        error: error.message,
        query: req.query
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * Handle Chatwoot webhook
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async handleChatwootWebhook(req, res) {
    try {
      this.logger.info('Received Chatwoot webhook', { 
        event: req.body.event,
        body: req.body 
      })

      const result = await this.messageBrokerService.handleChatwootWebhook(req.body)

      res.status(200).json({
        success: true,
        data: result
      })

    } catch (error) {
      this.logger.error('Chatwoot webhook error', {
        error: error.message,
        stack: error.stack,
        body: req.body
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * Health check endpoint
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async healthCheck(req, res) {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
      }

      res.status(200).json(health)

    } catch (error) {
      this.logger.error('Health check error', { error: error.message })

      res.status(500).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
  }
}

module.exports = WebhookController
