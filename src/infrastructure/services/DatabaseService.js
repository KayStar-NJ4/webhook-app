const { Pool } = require('pg')

/**
 * Database Service
 * Centralizes database access and caches frequently requested values
 */
class DatabaseService {
  constructor ({ logger = null, config = null } = {}) {
    this.logger = logger
    this.config = config
    this.pool = null
    this.botTokenCache = new Map()
    this.botTokenCacheExpiry = new Map()
    this.botUsernameCache = new Map()
    this.botUsernameCacheExpiry = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
  }

  /**
   * Initialize shared pool
   */
  initialize () {
    if (this.pool) {
      return this.pool
    }

    const baseConfig = this.config?.getDatabase?.()
      ? this.config.getDatabase()
      : {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          database: process.env.DB_NAME,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          ssl: process.env.DB_SSL === 'true'
        }

    const poolConfig = {
      max: Number(process.env.DB_MAX_CLIENTS) || 20,
      idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS) || 30000,
      connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS) || 2000,
      ...baseConfig
    }

    if (typeof poolConfig.ssl === 'boolean') {
      poolConfig.ssl = poolConfig.ssl ? { rejectUnauthorized: false } : false
    }

    this.pool = new Pool(poolConfig)

    this.pool.on('error', (err) => {
      this.logger?.error?.('Unexpected error on idle client', { error: err.message })
    })

    this.logger?.info?.('Database pool initialized', {
      poolConfig: {
        max: poolConfig.max,
        idleTimeoutMillis: poolConfig.idleTimeoutMillis
      }
    })

    return this.pool
  }

  /**
   * Get shared pool instance
   */
  getPool () {
    if (!this.pool) {
      this.initialize()
    }
    return this.pool
  }

  /**
   * Run query helper
   */
  async query (text, params = []) {
    const pool = this.getPool()
    return pool.query(text, params)
  }

  /**
   * Get bot token with cache layer
   */
  async getBotToken (botId) {
    if (!botId) return null

    const cacheKey = `bot_token_${botId}`
    const cached = this.botTokenCache.get(cacheKey)
    const expiry = this.botTokenCacheExpiry.get(cacheKey)

    if (cached && expiry && Date.now() < expiry) {
      this.logger?.info?.('Bot token retrieved from cache', { botId })
      return cached
    }

    try {
      const result = await this.query('SELECT bot_token FROM telegram_bots WHERE id = $1 AND is_active = true', [botId])

      this.logger?.info?.('Bot token query result', {
        botId,
        rowsCount: result.rows.length,
        hasToken: result.rows.length > 0 ? !!result.rows[0].bot_token : false
      })

      if (result.rows.length === 0) {
        this.logger?.warn?.('Bot not found or inactive', { botId })
        return null
      }

      const token = result.rows[0].bot_token
      this.botTokenCache.set(cacheKey, token)
      this.botTokenCacheExpiry.set(cacheKey, Date.now() + this.cacheTimeout)

      this.logger?.info?.('Bot token retrieved from database and cached', { botId })
      return token
    } catch (error) {
      this.logger?.error?.('Failed to get bot token', { error: error.message, botId })
      return null
    }
  }

  /**
   * Get bot ID by secret token (with cache)
   */
  async getBotIdBySecretToken (secretToken) {
    if (!secretToken) return null

    const cacheKey = `bot_id_${secretToken}`
    const cached = this.botTokenCache.get(cacheKey)
    const expiry = this.botTokenCacheExpiry.get(cacheKey)

    if (cached && expiry && Date.now() < expiry) {
      this.logger?.info?.('Bot ID retrieved from cache', { secretToken })
      return cached
    }

    try {
      const result = await this.query(
        'SELECT id FROM telegram_bots WHERE secret_token = $1 AND is_active = true LIMIT 1',
        [secretToken]
      )

      if (result.rows.length === 0) {
        this.logger?.warn?.('Bot not found for secret token', { secretToken })
        return null
      }

      const botId = result.rows[0].id
      this.botTokenCache.set(cacheKey, botId)
      this.botTokenCacheExpiry.set(cacheKey, Date.now() + this.cacheTimeout)

      this.logger?.info?.('Bot ID retrieved from database and cached', { secretToken, botId })
      return botId
    } catch (error) {
      this.logger?.error?.('Failed to get bot ID by secret token', { error: error.message, secretToken })
      return null
    }
  }

  /**
   * Get first active bot id
   */
  async getFirstActiveBotId () {
    try {
      const result = await this.query('SELECT id FROM telegram_bots WHERE is_active = true ORDER BY id LIMIT 1')

      if (result.rows.length === 0) {
        this.logger?.warn?.('No active bots found')
        return null
      }

      const botId = result.rows[0].id
      this.logger?.info?.('First active bot ID retrieved', { botId })
      return botId
    } catch (error) {
      this.logger?.error?.('Failed to get first active bot ID', { error: error.message })
      return null
    }
  }

  /**
   * Get bot username with cache
   */
  async getBotUsername (botId) {
    if (!botId) return null

    const cacheKey = `bot_username_${botId}`
    const cached = this.botUsernameCache.get(cacheKey)
    const expiry = this.botUsernameCacheExpiry.get(cacheKey)

    if (cached && expiry && Date.now() < expiry) {
      this.logger?.info?.('Bot username retrieved from cache', { botId, username: cached, component: 'Application' })
      return cached
    }

    try {
      const result = await this.query(
        'SELECT bot_username FROM telegram_bots WHERE id = $1 AND is_active = true',
        [botId]
      )

      if (result.rows.length === 0) {
        this.logger?.warn?.('Bot not found or inactive', { botId, component: 'Application' })
        return null
      }

      const username = result.rows[0].bot_username

      if (!username) {
        this.logger?.warn?.('Bot username is empty', { botId, component: 'Application' })
        return null
      }

      this.botUsernameCache.set(cacheKey, username)
      this.botUsernameCacheExpiry.set(cacheKey, Date.now() + this.cacheTimeout)

      this.logger?.info?.('Bot username retrieved from database and cached', {
        botId,
        username,
        component: 'Application'
      })

      return username
    } catch (error) {
      this.logger?.error?.('Failed to get bot username', { error: error.message, botId, component: 'Application' })
      return null
    }
  }

  /**
   * Get Chatwoot account by external id
   */
  async getChatwootAccountByExternalAccountId (externalAccountId) {
    try {
      const result = await this.query('SELECT * FROM chatwoot_accounts WHERE account_id = $1', [externalAccountId])

      if (result.rows.length === 0) {
        this.logger?.warn?.('Chatwoot account not found for external account ID', { externalAccountId })
        return null
      }

      return result.rows[0]
    } catch (error) {
      this.logger?.error?.('Failed to get Chatwoot account by external account ID', {
        error: error.message,
        externalAccountId
      })
      return null
    }
  }

  clearCache () {
    this.botTokenCache.clear()
    this.botTokenCacheExpiry.clear()
    this.botUsernameCache.clear()
    this.botUsernameCacheExpiry.clear()
    this.logger?.info?.('Database cache cleared')
  }

  async close () {
    if (this.pool) {
      await this.pool.end()
      this.pool = null
      this.logger?.info?.('Database pool closed')
    }
  }
}

module.exports = DatabaseService
