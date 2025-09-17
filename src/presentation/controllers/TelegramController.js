/**
 * Telegram Controller - Presentation layer
 * Handles Telegram-related HTTP requests
 */
class TelegramController {
  constructor ({ telegramService, logger }) {
    this.telegramService = telegramService
    this.logger = logger
  }

  /**
   * Setup Telegram webhook
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async setupWebhook (req, res) {
    try {
      const { webhookUrl, botToken, secretToken } = req.body

      if (!webhookUrl) {
        return res.status(400).json({
          success: false,
          error: 'webhookUrl is required'
        })
      }

      this.logger.info('Setting up Telegram webhook', { webhookUrl, hasBotToken: !!botToken })

      let result
      if (botToken) {
        result = await this.telegramService.setWebhookForBot(botToken, webhookUrl, secretToken)
      } else {
        result = await this.telegramService.setWebhook(webhookUrl)
      }

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      this.logger.error('Failed to setup Telegram webhook', {
        error: error.message,
        body: req.body
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * Setup webhooks for all active bots using base URL
   */
  async setupAllWebhooks (req, res) {
    try {
      const { webhookUrl } = req.body
      if (!webhookUrl) {
        return res.status(400).json({ success: false, error: 'webhookUrl is required' })
      }
      const baseUrl = webhookUrl.replace(/\/$/, '')
      const results = await this.telegramService.setWebhookForAllBots(baseUrl)
      res.status(200).json({ success: true, data: results })
    } catch (error) {
      this.logger.error('Failed to setup all Telegram webhooks', { error: error.message })
      res.status(500).json({ success: false, error: error.message })
    }
  }

  /**
   * Get webhook info
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getWebhookInfo (req, res) {
    try {
      this.logger.info('Getting Telegram webhook info')

      const result = await this.telegramService.getWebhookInfo()

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      this.logger.error('Failed to get Telegram webhook info', {
        error: error.message
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * Delete webhook
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async deleteWebhook (req, res) {
    try {
      this.logger.info('Deleting Telegram webhook')

      const result = await this.telegramService.deleteWebhook()

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      this.logger.error('Failed to delete Telegram webhook', {
        error: error.message
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * Get bot info
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getBotInfo (req, res) {
    try {
      this.logger.info('Getting Telegram bot info')

      const result = await this.telegramService.getBotInfo()

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      this.logger.error('Failed to get Telegram bot info', {
        error: error.message
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * Test message sending
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async testMessage (req, res) {
    try {
      const { chatId, message } = req.body

      if (!chatId || !message) {
        return res.status(400).json({
          success: false,
          error: 'chatId and message are required'
        })
      }

      this.logger.info('Testing Telegram message', { chatId, message })

      const result = await this.telegramService.sendMessage(chatId, message)

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      this.logger.error('Failed to test Telegram message', {
        error: error.message,
        body: req.body
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }
}

module.exports = TelegramController
