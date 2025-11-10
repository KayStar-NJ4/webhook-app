const axios = require('axios')
const crypto = require('crypto')

/**
 * Zalo OA Service - Infrastructure layer
 * Handles communication with Zalo Official Account API (openapi.zalo.me)
 */
class ZaloOAService {
  constructor ({ config, configurationService, logger }) {
    this.config = config
    this.configurationService = configurationService
    this.logger = logger
    this.apiUrl = null
    this.accessToken = null
    this.oaId = null
    this.timeout = this.config.getApiTimeout ? this.config.getApiTimeout('zalo_oa') : 10000
  }

  /**
   * Initialize service - no global config, will be set per request
   */
  async initialize () {
    // Try to get timeout from database configuration first
    try {
      const dbTimeout = await this.configurationService.getApiTimeout('zalo_oa')
      if (dbTimeout) {
        this.timeout = dbTimeout
        this.logger.info('Zalo OA timeout loaded from database', { timeout: this.timeout })
      }
    } catch (error) {
      this.logger.warn('Failed to load Zalo OA timeout from database, using default', { error: error.message })
    }
    // Zalo OA service will be initialized per request based on platform mapping
    this.logger.info('Zalo OA service initialized (per-request configuration)')
  }

  /**
   * Initialize service with specific Zalo OA ID
   * @param {number} oaId - Zalo OA ID
   */
  async initializeWithOAId (oaId) {
    try {
      // Get OA configuration from zalo_oas table
      const { Pool } = require('pg')
      const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true'
      })

      const result = await pool.query('SELECT * FROM zalo_oas WHERE id = $1', [oaId])
      await pool.end()

      if (result.rows.length === 0) {
        throw new Error(`Zalo OA with ID ${oaId} not found`)
      }

      const oa = result.rows[0]
      this.accessToken = oa.access_token
      this.oaId = oa.oa_id
      // Zalo OA API URL format: https://openapi.zalo.me
      const baseUrl = oa.api_url || 'https://openapi.zalo.me'
      this.apiUrl = baseUrl

      this.logger.info('Zalo OA service initialized with OA', {
        oaId,
        apiUrl: this.apiUrl,
        hasAccessToken: !!this.accessToken,
        zaloOAId: this.oaId
      })
    } catch (error) {
      this.logger.warn('Failed to initialize Zalo OA service with OA ID', {
        error: error.message,
        oaId
      })
      this.apiUrl = null
      this.accessToken = null
      this.oaId = null
    }
  }

  /**
   * Send message to Zalo OA
   * @param {string} userId - Zalo user ID
   * @param {string} text - Message text
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - API response
   */
  async sendMessage (userId, text, options = {}) {
    try {
      // Support per-OA token override for multi-OA setups
      let requestAccessToken = this.accessToken
      let requestOAId = this.oaId
      let requestApiUrl = this.apiUrl

      if (options.accessToken) {
        requestAccessToken = options.accessToken
        requestOAId = options.oaId || this.oaId
      } else if (!requestAccessToken) {
        await this.initialize()
        requestAccessToken = this.accessToken
        requestOAId = this.oaId
        requestApiUrl = this.apiUrl
      }

      // If still no access token after initialization, try to get from database
      if (!requestAccessToken) {
        this.logger.warn('No Zalo OA access token configured, trying to get from database')
        const accessToken = await this.configurationService.get('zalo_oa.accessToken')
        if (accessToken) {
          requestAccessToken = accessToken
          requestOAId = await this.configurationService.get('zalo_oa.oaId') || this.oaId
          this.logger.info('Using access token from database for Zalo OA API')
        }
      }

      if (!requestAccessToken || !requestOAId) {
        throw new Error('No Zalo OA access token or OA ID configured')
      }

      const baseApiUrl = requestApiUrl || 'https://openapi.zalo.me'

      this.logger.info('Sending message to Zalo OA', {
        userId,
        oaId: requestOAId,
        text: text.substring(0, 100),
        hasAccessToken: !!requestAccessToken
      })

      // Zalo OA API endpoint: POST https://openapi.zalo.me/v2.0/oa/message
      const payload = {
        recipient: {
          user_id: userId
        },
        message: {
          text: text
        }
      }

      const response = await axios.post(
        `${baseApiUrl}/v2.0/oa/message`,
        payload,
        {
          headers: {
            'access_token': requestAccessToken,
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        }
      )

      this.logger.info('Message sent to Zalo OA successfully', {
        userId,
        messageId: response.data.message?.message_id
      })

      return response.data
    } catch (error) {
      this.logger.error('Failed to send message to Zalo OA', {
        error: error.message,
        userId,
        text: text.substring(0, 100),
        response: error.response?.data
      })
      throw new Error(`Zalo OA API error: ${error.message}`)
    }
  }

  /**
   * Verify webhook signature
   * @param {string} signature - Webhook signature from header
   * @param {string} body - Raw webhook body
   * @param {string} secretKey - Secret key
   * @returns {boolean} - Is valid
   */
  verifyWebhookSignature (signature, body, secretKey) {
    try {
      if (!secretKey || !signature) {
        return false
      }

      const hmac = crypto.createHmac('sha256', secretKey)
      hmac.update(body)
      const calculatedSignature = hmac.digest('hex')

      return calculatedSignature === signature
    } catch (error) {
      this.logger.error('Failed to verify webhook signature', { error: error.message })
      return false
    }
  }

  /**
   * Get OA info
   * @returns {Promise<Object>} - OA info
   */
  async getOAInfo () {
    try {
      // Skip if no token configured
      if (!this.accessToken || !this.oaId) {
        this.logger.warn('Zalo OA access token or OA ID not configured, skipping OA info check')
        return null
      }

      const baseApiUrl = this.apiUrl || 'https://openapi.zalo.me'

      this.logger.info('Getting OA info from Zalo API', {
        apiUrl: baseApiUrl,
        hasAccessToken: !!this.accessToken,
        oaId: this.oaId
      })

      // Zalo OA API endpoint: GET https://openapi.zalo.me/v2.0/oa/getoa
      const response = await axios.get(
        `${baseApiUrl}/v2.0/oa/getoa`,
        {
          headers: {
            'access_token': this.accessToken
          },
          timeout: this.timeout
        }
      )

      this.logger.info('Successfully retrieved Zalo OA info', {
        oaId: this.oaId,
        response: response.data
      })

      return response.data
    } catch (error) {
      this.logger.error('Failed to get OA info from Zalo API', {
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
    return data && (
      (data.event === 'user_send_text' && data.recipient && data.sender) ||
      (data.event === 'user_send_image' && data.recipient && data.sender) ||
      (data.event === 'user_send_attachment' && data.recipient && data.sender)
    )
  }

  /**
   * Refresh access token (if refresh_token is available)
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} - New access token
   */
  async refreshAccessToken (refreshToken) {
    try {
      const baseApiUrl = this.apiUrl || 'https://openapi.zalo.me'

      // Zalo OA token refresh endpoint
      const response = await axios.post(
        `${baseApiUrl}/oauth/token`,
        {
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        },
        {
          timeout: this.timeout
        }
      )

      this.logger.info('Access token refreshed successfully')

      return response.data
    } catch (error) {
      this.logger.error('Failed to refresh access token', {
        error: error.message,
        response: error.response?.data
      })
      throw new Error(`Failed to refresh access token: ${error.message}`)
    }
  }
}

module.exports = ZaloOAService

