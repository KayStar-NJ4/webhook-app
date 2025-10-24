/**
 * Webhook Controller - Presentation layer
 * Handles HTTP requests for webhooks
 */
class WebhookController {
  constructor ({ messageBrokerService, logger }) {
    this.messageBrokerService = messageBrokerService
    this.logger = logger
  }

  /**
   * Handle Telegram webhook
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async handleTelegramWebhook (req, res) {
    try {
      const botIdFromPath = req.params?.botId
      const secretToken = req.headers['x-telegram-bot-api-secret-token']

      this.logger.info('Received Telegram webhook', {
        body: req.body,
        botIdFromPath,
        hasSecretToken: !!secretToken,
        hasMessage: !!req.body.message,
        messageId: req.body.message?.message_id,
        chatId: req.body.message?.chat?.id,
        chatType: req.body.message?.chat?.type,
        chatTitle: req.body.message?.chat?.title,
        userId: req.body.message?.from?.id,
        userName: req.body.message?.from?.first_name,
        hasText: !!req.body.message?.text,
        textPreview: req.body.message?.text?.substring(0, 50)
      })

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
   * Handle Zalo webhook
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async handleZaloWebhook (req, res) {
    try {
      const botIdFromPath = req.params?.botId
      const secretToken = req.headers['x-zalo-bot-api-secret-token']

      this.logger.info('Received Zalo webhook', {
        body: req.body,
        botIdFromPath,
        hasSecretToken: !!secretToken,
        hasMessage: !!req.body.message,
        messageId: req.body.message?.message_id,
        chatId: req.body.message?.chat?.id,
        chatType: req.body.message?.chat?.type,
        chatTitle: req.body.message?.chat?.title,
        userId: req.body.message?.from?.id,
        userName: req.body.message?.from?.first_name,
        hasText: !!req.body.message?.text,
        textPreview: req.body.message?.text?.substring(0, 50)
      })

      // Attach botId to body metadata if provided
      const body = { ...req.body }
      if (botIdFromPath) {
        body.__bot_id = botIdFromPath
      }
      if (secretToken) {
        body.__secret_token = secretToken
      }

      const result = await this.messageBrokerService.handleZaloWebhook(body)

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      this.logger.error('Zalo webhook error', {
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
  async handleChatwootVerification (req, res) {
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
  async handleChatwootWebhook (req, res) {
    try {
      this.logger.info('Received Chatwoot webhook', {
        event: req.body.event,
        body: req.body,
        headers: req.headers,
        method: req.method,
        url: req.url
      })

      // Log detailed webhook payload for debugging
      this.logger.info('Webhook payload details', {
        event: req.body.event,
        hasMessage: !!req.body.id,
        hasConversation: !!req.body.conversation,
        hasSender: !!req.body.sender,
        hasAccount: !!req.body.account,
        messageId: req.body.id,
        conversationId: req.body.conversation?.id,
        senderId: req.body.sender?.id,
        accountId: req.body.account?.id,
        content: req.body.content?.substring(0, 100),
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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
        body: req.body,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code,
        errno: error.errno,
        syscall: error.syscall,
        hostname: error.hostname,
        port: error.port,
        path: error.path,
        method: error.method,
        headers: error.config?.headers,
        url: error.config?.url,
        conversation_id: req.body.conversation?.id
      })

      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Handle Chatwoot Bot webhook (for Dify messages via Bot)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async handleChatwootBotWebhook (req, res) {
    try {
      this.logger.info('Received Chatwoot Bot webhook', {
        event: req.body.event,
        body: req.body,
        headers: req.headers,
        method: req.method,
        url: req.url
      })

      // For bot webhook, we don't process messages back to Telegram
      // This is only for Dify to send messages via Chatwoot Bot
      this.logger.info('Chatwoot Bot webhook received - no processing needed', {
        event: req.body.event,
        messageId: req.body.id,
        conversationId: req.body.conversation?.id
      })

      res.status(200).json({
        success: true,
        message: 'Bot webhook received - no processing needed',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      this.logger.error('Chatwoot Bot webhook error', {
        error: error.message,
        stack: error.stack,
        body: req.body
      })

      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Health check endpoint
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async healthCheck (req, res) {
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
