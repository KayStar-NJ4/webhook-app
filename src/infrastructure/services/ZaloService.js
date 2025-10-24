const axios = require('axios')

/**
 * Zalo Service - Infrastructure layer
 * Handles communication with Zalo Bot API (bot.zapps.me)
 */
class ZaloService {
  constructor ({ config, configurationService, logger }) {
    this.config = config
    this.configurationService = configurationService
    this.logger = logger
    this.apiUrl = null
    this.botToken = null
    this.timeout = this.config.getApiTimeout ? this.config.getApiTimeout('zalo') : 10000
  }

  /**
   * Initialize service - no global config, will be set per request
   */
  async initialize () {
    // Try to get timeout from database configuration first
    try {
      const dbTimeout = await this.configurationService.getApiTimeout('zalo')
      if (dbTimeout) {
        this.timeout = dbTimeout
        this.logger.info('Zalo timeout loaded from database', { timeout: this.timeout })
      }
    } catch (error) {
      this.logger.warn('Failed to load Zalo timeout from database, using default', { error: error.message })
    }
    // Zalo service will be initialized per request based on platform mapping
    this.logger.info('Zalo service initialized (per-request configuration)')
  }

  /**
   * Initialize service with specific Zalo bot ID
   * @param {number} botId - Zalo bot ID
   */
  async initializeWithBotId (botId) {
    try {
      // Get bot configuration from zalo_bots table
      const { Pool } = require('pg')
      const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true'
      })

      const result = await pool.query('SELECT * FROM zalo_bots WHERE id = $1', [botId])
      await pool.end()

      if (result.rows.length === 0) {
        throw new Error(`Zalo bot with ID ${botId} not found`)
      }

      const bot = result.rows[0]
      this.botToken = bot.bot_token
      // Zalo API URL format: https://bot-api.zapps.me/bot{token}
      const baseUrl = bot.api_url || 'https://bot-api.zapps.me'
      this.apiUrl = `${baseUrl}/bot${this.botToken}`

      this.logger.info('Zalo service initialized with bot', {
        botId,
        apiUrl: this.apiUrl,
        hasBotToken: !!this.botToken
      })
    } catch (error) {
      this.logger.warn('Failed to initialize Zalo service with bot ID', {
        error: error.message,
        botId
      })
      this.apiUrl = null
      this.botToken = null
    }
  }

  /**
   * Send message to Zalo
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
        const baseApiUrl = await this.configurationService.get('zalo.apiUrl', 'https://bot-api.zapps.me')
        requestApiUrl = `${baseApiUrl}/bot${options.botToken}`
      } else if (!requestApiUrl) {
        await this.initialize()
        requestApiUrl = this.apiUrl
      }

      // If still no API URL after initialization, try to get bot token from database
      if (!requestApiUrl) {
        this.logger.warn('No Zalo API URL configured, trying to get from database')
        const botToken = await this.configurationService.get('zalo.botToken')
        if (botToken) {
          const baseApiUrl = await this.configurationService.get('zalo.apiUrl', 'https://bot-api.zapps.me')
          requestApiUrl = `${baseApiUrl}/bot${botToken}`
          this.logger.info('Using bot token from database for Zalo API')
        }
      }

      if (!requestApiUrl) {
        throw new Error('No Zalo bot token configured')
      }

      this.logger.info('Sending message to Zalo', {
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

      this.logger.info('Message sent to Zalo successfully', {
        chatId,
        messageId: response.data.result?.message_id
      })

      return response.data.result
    } catch (error) {
      this.logger.error('Failed to send message to Zalo', {
        error: error.message,
        chatId,
        text: text.substring(0, 100),
        response: error.response?.data
      })
      throw new Error(`Zalo API error: ${error.message}`)
    }
  }

  /**
   * Set webhook
   * @param {string} webhookUrl - Webhook URL
   * @returns {Promise<Object>} - API response
   */
  async setWebhook (webhookUrl) {
    try {
      this.logger.info('Setting Zalo webhook', { webhookUrl })

      const payload = {
        url: webhookUrl,
        allowed_updates: ['message'],
        secret_token: await this.configurationService.get('zalo.secretToken', '') || undefined
      }

      const response = await axios.post(`${this.apiUrl}/setWebhook`, payload)

      this.logger.info('Zalo webhook set successfully', { webhookUrl })
      return response.data
    } catch (error) {
      this.logger.error('Failed to set Zalo webhook', {
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
      this.logger.error('Failed to get Zalo webhook info', {
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
      this.logger.info('Deleting Zalo webhook')

      const response = await axios.post(`${this.apiUrl}/deleteWebhook`)

      this.logger.info('Zalo webhook deleted successfully')
      return response.data
    } catch (error) {
      this.logger.error('Failed to delete Zalo webhook', {
        error: error.message
      })
      throw new Error(`Failed to delete webhook: ${error.message}`)
    }
  }

  /**
   * Set webhook for a specific bot token and secret token
   * @param {string} botToken - Zalo bot token
   * @param {string} webhookUrl - Fully qualified webhook URL
   * @param {string} secretToken - Optional secret token
   */
  async setWebhookForBot (botToken, webhookUrl, secretToken) {
    const baseApiUrl = await this.configurationService.get('zalo.apiUrl', 'https://bot-api.zapps.me')
    // Zalo API format: https://bot-api.zapps.me/bot{token}/setWebhook
    const url = `${baseApiUrl}/bot${botToken}/setWebhook`
    const payload = {
      url: webhookUrl
    }
    
    // Add bot token to headers instead
    const headers = {
      'X-API-Key': botToken
    }
    
    // Only add secret_token if provided and valid format
    // Zalo requires: 8-256 characters, only A-Z, a-z, 0-9, _ and - are allowed
    if (secretToken) {
      const secretTokenPattern = /^[A-Za-z0-9_-]{8,256}$/
      if (secretTokenPattern.test(secretToken)) {
        payload.secret_token = secretToken
      } else {
        this.logger.warn('Secret token format invalid, omitting from webhook', {
          tokenLength: secretToken.length,
          hasSpecialChars: !secretTokenPattern.test(secretToken)
        })
      }
    }
    
    this.logger.info('Setting Zalo webhook', { 
      url: url.replace(botToken, '***'),
      webhookUrl,
      hasSecretToken: !!secretToken
    })
    
    const response = await axios.post(url, payload, { 
      timeout: this.timeout,
      headers: headers
    })
    
    // Check if webhook was set successfully
    if (response.data.ok !== false) {
      this.logger.info('Zalo webhook set successfully', { 
        response: response.data 
      })
    } else {
      this.logger.error('Failed to set Zalo webhook', { 
        error: response.data.description,
        errorCode: response.data.error_code,
        response: response.data 
      })
    }
    
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
      result = await pool.query('SELECT id, bot_token, secret_token FROM zalo_bots WHERE is_active = true')
    } catch (e) {
      // Fallback if secret_token column does not exist yet
      if (e?.code === '42703' || /secret_token/.test(e?.message || '')) {
        this.logger.warn('secret_token column missing; proceeding without secret tokens. Please run migrations.', { error: e.message })
        result = await pool.query('SELECT id, bot_token FROM zalo_bots WHERE is_active = true')
      } else {
        await pool.end()
        throw e
      }
    }
    await pool.end()
    const outcomes = []
    const baseEndpoint = `${baseUrl.replace(/\/$/, '')}/webhook/zalo`
    
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
      if (!this.botToken || this.botToken === 'your-zalo-bot-token') {
        this.logger.warn('Zalo bot token not configured, skipping bot info check')
        return null
      }

      // Construct API URL if not already set
      let apiUrl = this.apiUrl
      if (!apiUrl) {
        // Try to get base URL from configuration or use default
        const baseApiUrl = await this.configurationService.get('zalo.apiUrl', 'https://bot-api.zapps.me')
        // Zalo API URL format: https://bot-api.zapps.me/bot{token}
        apiUrl = `${baseApiUrl}/bot${this.botToken}`
      }

      this.logger.info('Getting bot info from Zalo API', {
        apiUrl: apiUrl.replace(this.botToken, '***'),
        hasBotToken: !!this.botToken
      })

      // Zalo Bot Platform doesn't have a direct "get bot info" endpoint like Telegram
      // So we just return basic info extracted from the token
      const oauthId = this.botToken.split(':')[0] || 'unknown'
      
      this.logger.info('Successfully retrieved Zalo bot info from token', {
        oauthId
      })
      
      return {
        id: oauthId,
        username: 'zalo_bot',
        name: 'Zalo Bot',
        is_bot: true
      }
    } catch (error) {
      this.logger.error('Failed to get bot info from Zalo API', {
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

module.exports = ZaloService

