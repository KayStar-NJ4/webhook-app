const axios = require('axios')

/**
 * Telegram Service - Infrastructure layer
 * Handles communication with Telegram Bot API
 */
class TelegramService {
  constructor ({ config, configurationService, logger, databaseService = null }) {
    this.config = config
    this.configurationService = configurationService
    this.logger = logger
    this.databaseService = databaseService
    this.apiUrl = null
    this.botToken = null
    this.timeout = this.config.getApiTimeout ? this.config.getApiTimeout('telegram') : 10000
  }

  /**
   * Initialize service - no global config, will be set per request
   */
  async initialize () {
    // Try to get timeout from database configuration first
    try {
      const dbTimeout = await this.configurationService.getApiTimeout('telegram')
      if (dbTimeout) {
        this.timeout = dbTimeout
        this.logger.info('Telegram timeout loaded from database', { timeout: this.timeout })
      }
    } catch (error) {
      this.logger.warn('Failed to load Telegram timeout from database, using default', { error: error.message })
    }
    // Telegram service will be initialized per request based on platform mapping
    this.logger.info('Telegram service initialized (per-request configuration)')
  }

  /**
   * Initialize service with specific Telegram bot ID
   * @param {number} botId - Telegram bot ID
   */
  async initializeWithBotId (botId) {
    try {
      let result
      if (this.databaseService) {
        result = await this.databaseService.query('SELECT * FROM telegram_bots WHERE id = $1', [botId])
      } else {
        const { Pool } = require('pg')
        const pool = new Pool({
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          database: process.env.DB_NAME,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          ssl: process.env.DB_SSL === 'true'
        })
        result = await pool.query('SELECT * FROM telegram_bots WHERE id = $1', [botId])
        await pool.end()
      }

      if (result.rows.length === 0) {
        throw new Error(`Telegram bot with ID ${botId} not found`)
      }

      const bot = result.rows[0]
      this.botToken = bot.bot_token
      this.apiUrl = `https://api.telegram.org/bot${this.botToken}`

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
        timeout: this.timeout
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
    const response = await axios.post(url, payload, { timeout: this.timeout })
    return response.data
  }

  /**
   * Set webhook for all active bots using system configuration
   */
  async setWebhookForAllBots () {
    // Get webhook URL from system configuration
    const baseUrl = await this.configurationService.get('system.webhook_url', '')
    if (!baseUrl) {
      throw new Error('System webhook URL not configured. Please set it in system configuration.')
    }

    let result
    if (this.databaseService) {
      try {
        result = await this.databaseService.query('SELECT id, bot_token, secret_token FROM telegram_bots WHERE is_active = true')
      } catch (e) {
        if (e?.code === '42703' || /secret_token/.test(e?.message || '')) {
          this.logger.warn('secret_token column missing; proceeding without secret tokens. Please run migrations.', { error: e.message })
          result = await this.databaseService.query('SELECT id, bot_token FROM telegram_bots WHERE is_active = true')
        } else {
          throw e
        }
      }
    } else {
      const { Pool } = require('pg')
      const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true'
      })
      try {
        result = await pool.query('SELECT id, bot_token, secret_token FROM telegram_bots WHERE is_active = true')
      } catch (e) {
        if (e?.code === '42703' || /secret_token/.test(e?.message || '')) {
          this.logger.warn('secret_token column missing; proceeding without secret tokens. Please run migrations.', { error: e.message })
          result = await pool.query('SELECT id, bot_token FROM telegram_bots WHERE is_active = true')
        } else {
          await pool.end()
          throw e
        }
      }
      await pool.end()
    }
    const outcomes = []
    const baseEndpoint = `${baseUrl.replace(/\/$/, '')}/webhook/telegram`
    
    // Get system webhook secret token
    const systemSecretToken = await this.configurationService.get('system.webhook_secret_token', '')
    
    for (const row of result.rows) {
      const url = `${baseEndpoint}/${row.id}`
      // Use bot-specific secret token if available, otherwise use system secret token
      const secretToken = row.secret_token || systemSecretToken
      try {
        const setRes = await this.setWebhookForBot(row.bot_token, url, secretToken)
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
      // Skip if no token configured
      if (!this.botToken || this.botToken === 'your-telegram-bot-token') {
        this.logger.warn('Telegram bot token not configured, skipping bot info check')
        return null
      }

      // Construct API URL if not already set
      let apiUrl = this.apiUrl
      if (!apiUrl) {
        // Try to get base URL from configuration or use default
        const baseApiUrl = await this.configurationService.get('telegram.apiUrl', 'https://api.telegram.org')
        apiUrl = `${baseApiUrl}/bot${this.botToken}`
      }

      this.logger.info('Getting bot info from Telegram API', {
        apiUrl: apiUrl.replace(this.botToken, '***'),
        hasBotToken: !!this.botToken
      })

      const response = await axios.get(`${apiUrl}/getMe`, {
        timeout: this.timeout
      })

      if (response.data.ok) {
        this.logger.info('Successfully retrieved bot info', {
          botId: response.data.result.id,
          botUsername: response.data.result.username
        })
        return response.data.result
      } else {
        this.logger.warn('Telegram API returned error for getMe', {
          error: response.data.description
        })
        return null
      }
    } catch (error) {
      this.logger.error('Failed to get bot info from Telegram API', {
        error: error.message,
        response: error.response?.data
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
