const axios = require('axios')

/**
 * Telegram Service - Infrastructure layer
 * Handles communication with Telegram Bot API
 */
class TelegramService {
  constructor ({ config, configurationService, logger }) {
    this.config = config
    this.configurationService = configurationService
    this.logger = logger
    this.apiUrl = null
    this.botToken = null
  }

  /**
   * Initialize service - no global config, will be set per request
   */
  async initialize () {
    // Telegram service will be initialized per request based on platform mapping
    this.logger.info('Telegram service initialized (per-request configuration)')
  }

  /**
   * Initialize service with specific Telegram bot ID
   * @param {number} botId - Telegram bot ID
   */
  async initializeWithBotId (botId) {
    try {
      // Get bot configuration from telegram_bots table
      const { Pool } = require('pg')
      const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true'
      })

      const result = await pool.query('SELECT * FROM telegram_bots WHERE id = $1', [botId])
      await pool.end()

      if (result.rows.length === 0) {
        throw new Error(`Telegram bot with ID ${botId} not found`)
      }

      const bot = result.rows[0]
      this.botToken = bot.bot_token
      this.apiUrl = `${bot.api_url || 'https://api.telegram.org'}/bot${this.botToken}`

      this.logger.info('Telegram service initialized with bot', {
        botId,
        apiUrl: this.apiUrl,
        hasBotToken: !!this.botToken
      })
    } catch (error) {
      this.logger.warn('Failed to initialize Telegram service with bot ID', {
        error: error.message,
        botId
      })
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
  async sendMessage (chatId, text, options = {}) {
    try {
      // Support per-bot token override for multi-bot setups
      let requestApiUrl = this.apiUrl
      if (options.botToken) {
        const baseApiUrl = await this.configurationService.get('telegram.apiUrl', 'https://api.telegram.org')
        requestApiUrl = `${baseApiUrl}/bot${options.botToken}`
      } else if (!requestApiUrl) {
        await this.initialize()
        requestApiUrl = this.apiUrl
      }

      // If still no API URL after initialization, try to get bot token from database
      if (!requestApiUrl) {
        this.logger.warn('No Telegram API URL configured, trying to get from database')
        const botToken = await this.configurationService.get('telegram.botToken')
        if (botToken) {
          const baseApiUrl = await this.configurationService.get('telegram.apiUrl', 'https://api.telegram.org')
          requestApiUrl = `${baseApiUrl}/bot${botToken}`
          this.logger.info('Using bot token from database for Telegram API')
        }
      }

      if (!requestApiUrl) {
        throw new Error('No Telegram bot token configured')
      }

      this.logger.info('Sending message to Telegram', {
        chatId,
        text: text.substring(0, 100),
        hasApiUrl: !!requestApiUrl
      })

      // Ensure chat_id is a number for private chats, string for group chats
      const chatIdFormatted = typeof chatId === 'string' && !isNaN(chatId) ? parseInt(chatId) : chatId

      const payload = {
        chat_id: chatIdFormatted,
        text,
        parse_mode: options.parseMode || 'HTML',
        ...options
      }

      const response = await axios.post(`${requestApiUrl}/sendMessage`, payload, {
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
        text: text.substring(0, 100),
        response: error.response?.data
      })
      throw new Error(`Telegram API error: ${error.message}`)
    }
  }

  /**
   * Set webhook
   * @param {string} webhookUrl - Webhook URL
   * @returns {Promise<Object>} - API response
   */
  async setWebhook (webhookUrl) {
    try {
      this.logger.info('Setting Telegram webhook', { webhookUrl })

      const payload = {
        url: webhookUrl,
        allowed_updates: ['message'],
        secret_token: await this.configurationService.get('telegram.secretToken', '') || undefined
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
  async getWebhookInfo () {
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
  async deleteWebhook () {
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
   * Set webhook for a specific bot token and secret token
   * @param {string} botToken - Telegram bot token
   * @param {string} webhookUrl - Fully qualified webhook URL
   * @param {string} secretToken - Optional secret token
   */
  async setWebhookForBot (botToken, webhookUrl, secretToken) {
    const baseApiUrl = await this.configurationService.get('telegram.apiUrl', 'https://api.telegram.org')
    const url = `${baseApiUrl}/bot${botToken}/setWebhook`
    const payload = {
      url: webhookUrl,
      allowed_updates: ['message'],
      secret_token: secretToken || undefined
    }
    const response = await axios.post(url, payload, { timeout: 10000 })
    return response.data
  }

  /**
   * Set webhook for all active bots using base URL
   * @param {string} baseUrl - e.g. https://<ngrok>.ngrok-free.app
   */
  async setWebhookForAllBots (baseUrl) {
    // lazy import to avoid circular dep
    const { Pool } = require('pg')
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true'
    })
    let result
    try {
      result = await pool.query('SELECT id, bot_token, secret_token FROM telegram_bots WHERE is_active = true')
    } catch (e) {
      // Fallback if secret_token column does not exist yet
      if (e?.code === '42703' || /secret_token/.test(e?.message || '')) {
        this.logger.warn('secret_token column missing; proceeding without secret tokens. Please run migrations.', { error: e.message })
        result = await pool.query('SELECT id, bot_token FROM telegram_bots WHERE is_active = true')
      } else {
        await pool.end()
        throw e
      }
    }
    await pool.end()
    const outcomes = []
    const endpoint = `${baseUrl.replace(/\/$/, '')}/webhook/telegram`
    for (const row of result.rows) {
      const url = endpoint
      try {
        const setRes = await this.setWebhookForBot(row.bot_token, url, row.secret_token)
        outcomes.push({ botId: row.id, ok: setRes.ok !== false, result: setRes })
      } catch (e) {
        outcomes.push({ botId: row.id, ok: false, error: e.message })
      }
    }
    return outcomes
  }

  /**
   * Get bot info
   * @returns {Promise<Object>} - Bot info
   */
  async getBotInfo () {
    try {
      // Initialize if not already done
      if (!this.apiUrl) {
        await this.initialize()
      }

      // Skip if no token configured
      if (!this.botToken || this.botToken === 'your-telegram-bot-token') {
        this.logger.warn('Telegram bot token not configured, skipping bot info check')
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
  validateWebhookData (data) {
    return data && data.message && data.message.chat && data.message.from
  }
}

module.exports = TelegramService
