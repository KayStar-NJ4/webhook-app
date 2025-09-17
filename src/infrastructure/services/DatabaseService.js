const { Pool } = require('pg')

/**
 * Database Service
 * Manages database connections and provides caching for frequently accessed data
 */
class DatabaseService {
  constructor({ logger }) {
    this.logger = logger
    this.pool = null
    this.botTokenCache = new Map() // Cache for bot tokens
    this.botTokenCacheExpiry = new Map() // Cache expiry times
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes cache timeout
  }

  /**
   * Initialize database pool
   */
  initialize() {
    if (this.pool) {
      return this.pool
    }

    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true',
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    })

    this.pool.on('error', (err) => {
      this.logger.error('Unexpected error on idle client', err)
    })

    this.logger.info('Database pool initialized')
    return this.pool
  }

  /**
   * Get database pool (initialize if needed)
   * @returns {Pool} - Database pool
   */
  getPool() {
    if (!this.pool) {
      this.initialize()
    }
    return this.pool
  }

  /**
   * Get bot token with caching
   * @param {number} botId - Bot ID
   * @returns {Promise<string|null>} - Bot token or null
   */
  async getBotToken(botId) {
    if (!botId) return null

    // Check cache first
    const cacheKey = `bot_token_${botId}`
    const cached = this.botTokenCache.get(cacheKey)
    const expiry = this.botTokenCacheExpiry.get(cacheKey)
    
    if (cached && expiry && Date.now() < expiry) {
      this.logger.debug('Bot token retrieved from cache', { botId })
      return cached
    }

    try {
      const pool = this.getPool()
      const result = await pool.query('SELECT bot_token FROM telegram_bots WHERE id = $1 AND is_active = true', [botId])
      
      if (result.rows.length === 0) {
        this.logger.warn('Bot not found or inactive', { botId })
        return null
      }

      const token = result.rows[0].bot_token
      
      // Cache the token
      this.botTokenCache.set(cacheKey, token)
      this.botTokenCacheExpiry.set(cacheKey, Date.now() + this.cacheTimeout)
      
      this.logger.debug('Bot token retrieved from database and cached', { botId })
      return token
    } catch (error) {
      this.logger.error('Failed to get bot token', { error: error.message, botId })
      return null
    }
  }

  /**
   * Get bot ID by secret token with caching
   * @param {string} secretToken - Secret token
   * @returns {Promise<number|null>} - Bot ID or null
   */
  async getBotIdBySecretToken(secretToken) {
    if (!secretToken) return null

    // Check cache first
    const cacheKey = `bot_id_${secretToken}`
    const cached = this.botTokenCache.get(cacheKey)
    const expiry = this.botTokenCacheExpiry.get(cacheKey)
    
    if (cached && expiry && Date.now() < expiry) {
      this.logger.debug('Bot ID retrieved from cache', { secretToken })
      return cached
    }

    try {
      const pool = this.getPool()
      const result = await pool.query(
        'SELECT id FROM telegram_bots WHERE secret_token = $1 AND is_active = true LIMIT 1',
        [secretToken]
      )
      
      if (result.rows.length === 0) {
        this.logger.warn('Bot not found for secret token', { secretToken })
        return null
      }

      const botId = result.rows[0].id
      
      // Cache the bot ID
      this.botTokenCache.set(cacheKey, botId)
      this.botTokenCacheExpiry.set(cacheKey, Date.now() + this.cacheTimeout)
      
      this.logger.debug('Bot ID retrieved from database and cached', { secretToken, botId })
      return botId
    } catch (error) {
      this.logger.error('Failed to get bot ID by secret token', { error: error.message, secretToken })
      return null
    }
  }

  /**
   * Get first active bot ID
   * @returns {Promise<number|null>} - Bot ID or null
   */
  async getFirstActiveBotId() {
    try {
      const pool = this.getPool()
      const result = await pool.query('SELECT id FROM telegram_bots WHERE is_active = true ORDER BY id LIMIT 1')
      
      if (result.rows.length === 0) {
        this.logger.warn('No active bots found')
        return null
      }

      const botId = result.rows[0].id
      this.logger.debug('First active bot ID retrieved', { botId })
      return botId
    } catch (error) {
      this.logger.error('Failed to get first active bot ID', { error: error.message })
      return null
    }
  }

  /**
   * Get Chatwoot account by external account ID
   * @param {number} externalAccountId - External account ID
   * @returns {Promise<Object|null>} - Chatwoot account or null
   */
  async getChatwootAccountByExternalAccountId(externalAccountId) {
    try {
      const pool = this.getPool()
      const result = await pool.query('SELECT * FROM chatwoot_accounts WHERE account_id = $1', [externalAccountId])
      
      if (result.rows.length === 0) {
        this.logger.warn('Chatwoot account not found for external account ID', { externalAccountId })
        return null
      }
      
      return result.rows[0]
    } catch (error) {
      this.logger.error('Failed to get Chatwoot account by external account ID', {
        error: error.message,
        externalAccountId
      })
      return null
    }
  }

  /**
   * Clear cache (useful for testing or when data changes)
   */
  clearCache() {
    this.botTokenCache.clear()
    this.botTokenCacheExpiry.clear()
    this.logger.info('Database cache cleared')
  }

  /**
   * Close database pool
   */
  async close() {
    if (this.pool) {
      await this.pool.end()
      this.pool = null
      this.logger.info('Database pool closed')
    }
  }
}

module.exports = DatabaseService
