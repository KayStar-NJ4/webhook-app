const axios = require('axios')

/**
 * Telegram Service - Infrastructure layer
 * Handles communication with Telegram Bot API
 */
class TelegramService {
  constructor({ config, configurationService, logger }) {
    this.config = config
    this.configurationService = configurationService
    this.logger = logger
    this.apiUrl = null
    this.botToken = null
  }

  /**
   * Initialize service with configuration from database
   */
  async initialize() {
    try {
      const apiUrl = await this.configurationService.get('telegram.apiUrl', 'https://api.telegram.org')
      const botToken = await this.configurationService.get('telegram.botToken')
      
      if (!botToken) {
        this.logger.info('Telegram bot token not configured, service will be disabled')
        this.apiUrl = null
        this.botToken = null
        return
      }
      
      this.apiUrl = `${apiUrl}/bot${botToken}`
      this.botToken = botToken
      
      this.logger.info('Telegram service initialized', { apiUrl })
    } catch (error) {
      this.logger.warn('Failed to initialize Telegram service, continuing without it', { error: error.message })
      this.apiUrl = null
      this.botToken = null
    }
  }

  /**
   * Send message to Telegram
   * @param {string} chatId - Chat ID
   * @param {string} text - Message text
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - API response
   */
  async sendMessage(chatId, text, options = {}) {
    try {
      if (!this.apiUrl) {
        await this.initialize()
      }
      
      this.logger.info('Sending message to Telegram', { chatId, text: text.substring(0, 100) })

      const payload = {
        chat_id: chatId,
        text,
        parse_mode: options.parseMode || 'HTML',
        ...options
      }

      const response = await axios.post(`${this.apiUrl}/sendMessage`, payload, {
        timeout: 10000
      })

      this.logger.info('Message sent to Telegram successfully', {
        chatId,
        messageId: response.data.result.message_id
      })

      return response.data.result

    } catch (error) {
      this.logger.error('Failed to send message to Telegram', {
        error: error.message,
        chatId,
        text: text.substring(0, 100)
      })
      throw new Error(`Telegram API error: ${error.message}`)
    }
  }

  /**
   * Set webhook
   * @param {string} webhookUrl - Webhook URL
   * @returns {Promise<Object>} - API response
   */
  async setWebhook(webhookUrl) {
    try {
      this.logger.info('Setting Telegram webhook', { webhookUrl })

      const payload = {
        url: webhookUrl,
        allowed_updates: ['message']
      }

      const response = await axios.post(`${this.apiUrl}/setWebhook`, payload)

      this.logger.info('Telegram webhook set successfully', { webhookUrl })
      return response.data

    } catch (error) {
      this.logger.error('Failed to set Telegram webhook', {
        error: error.message,
        webhookUrl
      })
      throw new Error(`Failed to set webhook: ${error.message}`)
    }
  }

  /**
   * Get webhook info
   * @returns {Promise<Object>} - Webhook info
   */
  async getWebhookInfo() {
    try {
      const response = await axios.get(`${this.apiUrl}/getWebhookInfo`)
      return response.data.result

    } catch (error) {
      this.logger.error('Failed to get Telegram webhook info', {
        error: error.message
      })
      throw new Error(`Failed to get webhook info: ${error.message}`)
    }
  }

  /**
   * Delete webhook
   * @returns {Promise<Object>} - API response
   */
  async deleteWebhook() {
    try {
      this.logger.info('Deleting Telegram webhook')

      const response = await axios.post(`${this.apiUrl}/deleteWebhook`)

      this.logger.info('Telegram webhook deleted successfully')
      return response.data

    } catch (error) {
      this.logger.error('Failed to delete Telegram webhook', {
        error: error.message
      })
      throw new Error(`Failed to delete webhook: ${error.message}`)
    }
  }

  /**
   * Get bot info
   * @returns {Promise<Object>} - Bot info
   */
  async getBotInfo() {
    try {
      // Skip if no token configured
      if (!this.token || this.token === 'your-telegram-bot-token') {
        this.logger.info('Telegram bot token not configured, skipping bot info check')
        return null
      }

      const response = await axios.get(`${this.apiUrl}/getMe`)
      return response.data.result

    } catch (error) {
      this.logger.warn('Failed to get bot info, continuing without Telegram service', {
        error: error.message
      })
      return null
    }
  }

  /**
   * Validate webhook data
   * @param {Object} data - Webhook data
   * @returns {boolean} - Is valid
   */
  validateWebhookData(data) {
    return data && data.message && data.message.chat && data.message.from
  }
}

module.exports = TelegramService
