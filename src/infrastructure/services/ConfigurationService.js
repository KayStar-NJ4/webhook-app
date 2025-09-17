/**
 * Configuration Service - Infrastructure layer
 * Manages application configuration stored in database
 */
class ConfigurationService {
  constructor({ configRepository, logger }) {
    this.configRepository = configRepository
    this.logger = logger
    this.cache = new Map()
    this.cacheExpiry = 5 * 60 * 1000 // 5 minutes cache
  }

  /**
   * Get configuration value
   * @param {string} key - Configuration key
   * @param {*} defaultValue - Default value if not found
   * @returns {Promise<*>} - Configuration value
   */
  async get(key, defaultValue = null) {
    try {
      // Check cache first
      const cached = this.cache.get(key)
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.value
      }

      // Get from database
      const config = await this.configRepository.findByKey(key)
      const value = config ? config.value : defaultValue

      // Cache the result
      this.cache.set(key, {
        value,
        timestamp: Date.now()
      })

      return value

    } catch (error) {
      this.logger.error('Failed to get configuration', {
        key,
        error: error.message
      })
      return defaultValue
    }
  }

  /**
   * Set configuration value
   * @param {string} key - Configuration key
   * @param {*} value - Configuration value
   * @returns {Promise<void>}
   */
  async set(key, value) {
    try {
      await this.configRepository.upsert(key, value)
      
      // Update cache
      this.cache.set(key, {
        value,
        timestamp: Date.now()
      })

      this.logger.info('Configuration updated', { key, value })

    } catch (error) {
      this.logger.error('Failed to set configuration', {
        key,
        value,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Get Dify configuration
   * @returns {Promise<Object>} - Dify configuration
   */
  async getDifyConfig() {
    return {
      apiUrl: await this.get('dify.apiUrl', 'https://api.dify.ai/v1'),
      apiKey: await this.get('dify.apiKey', ''),
      appId: await this.get('dify.appId', ''),
      timeout: await this.get('dify.timeout', 30000),
      maxResponseLength: await this.get('dify.maxResponseLength', 1000),
      simpleGreetingMaxLength: await this.get('dify.simpleGreetingMaxLength', 200),
      cooldownPeriod: await this.get('dify.cooldownPeriod', 5000),
      enableConversationHistory: await this.get('dify.enableConversationHistory', false)
    }
  }

  /**
   * Get Telegram configuration
   * @returns {Promise<Object>} - Telegram configuration
   */
  async getTelegramConfig() {
    return {
      botToken: await this.get('telegram.botToken', ''),
      webhookUrl: await this.get('telegram.webhookUrl', ''),
      maxMessageLength: await this.get('telegram.maxMessageLength', 4096),
      parseMode: await this.get('telegram.parseMode', 'HTML'),
      webhookTimeout: await this.get('telegram.webhookTimeout', 30)
    }
  }

  /**
   * Get Chatwoot configuration
   * @returns {Promise<Object>} - Chatwoot configuration
   */
  async getChatwootConfig() {
    return {
      baseUrl: await this.get('chatwoot.baseUrl', ''),
      accessToken: await this.get('chatwoot.accessToken', ''),
      accountId: await this.get('chatwoot.accountId', ''),
      inboxId: await this.get('chatwoot.inboxId', '1'),
      maxMessageLength: await this.get('chatwoot.maxMessageLength', 10000),
      messageType: await this.get('chatwoot.messageType', 'outgoing'),
      timeout: await this.get('chatwoot.timeout', 30000)
    }
  }

  /**
   * Get Server configuration
   * @returns {Promise<Object>} - Server configuration
   */
  async getServerConfig() {
    return {
      port: await this.get('server.port', 3000),
      nodeEnv: await this.get('server.nodeEnv', 'development')
    }
  }

  /**
   * Get Database configuration
   * @returns {Promise<Object>} - Database configuration
   */
  async getDatabaseConfig() {
    return {
      host: await this.get('database.host', 'localhost'),
      port: await this.get('database.port', 5432),
      name: await this.get('database.name', 'turbo_chatwoot_webhook'),
      user: await this.get('database.user', 'postgres'),
      ssl: await this.get('database.ssl', false)
    }
  }

  /**
   * Get Security configuration
   * @returns {Promise<Object>} - Security configuration
   */
  async getSecurityConfig() {
    return {
      adminApiKey: await this.get('security.adminApiKey', ''),
      corsOrigins: await this.get('security.corsOrigins', '')
    }
  }

  /**
   * Get Rate Limit configuration
   * @returns {Promise<Object>} - Rate limit configuration
   */
  async getRateLimitConfig() {
    return {
      windowMs: await this.get('rateLimit.windowMs', 900000),
      max: await this.get('rateLimit.max', 100)
    }
  }

  /**
   * Get Logging configuration
   * @returns {Promise<Object>} - Logging configuration
   */
  async getLoggingConfig() {
    return {
      level: await this.get('logging.level', 'info'),
      format: await this.get('logging.format', 'json')
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear()
    this.logger.info('Configuration cache cleared')
  }

  /**
   * Get all configurations
   * @returns {Promise<Object>} - All configurations
   */
  async getAll() {
    try {
      const configs = await this.configRepository.findAll()
      const result = {}
      
      for (const config of configs) {
        result[config.key] = config.value
      }

      return result

    } catch (error) {
      this.logger.error('Failed to get all configurations', {
        error: error.message
      })
      return {}
    }
  }

  /**
   * Get Dify app by ID
   * @param {number} difyAppId - Dify app ID
   * @returns {Promise<Object|null>} - Dify app configuration
   */
  async getDifyAppById(difyAppId) {
    try {
      // This would need to be implemented in the repository
      // For now, we'll use a simple approach
      const difyApps = await this.configRepository.findByType('dify_app')
      return difyApps.find(app => app.id === difyAppId) || null
    } catch (error) {
      this.logger.error('Failed to get Dify app by ID', {
        difyAppId,
        error: error.message
      })
      return null
    }
  }
}

module.exports = ConfigurationService
