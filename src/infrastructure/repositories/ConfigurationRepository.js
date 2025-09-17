/**
 * Configuration Repository - Infrastructure layer
 * Handles database operations for application configuration
 */
class ConfigurationRepository {
  constructor({ db, logger }) {
    this.db = db
    this.logger = logger
  }

  /**
   * Find configuration by key
   * @param {string} key - Configuration key
   * @returns {Promise<Object|null>} - Configuration object
   */
  async findByKey(key) {
    try {
      const query = 'SELECT * FROM configurations WHERE key = $1'
      const result = await this.db.query(query, [key])
      
      if (result.rows.length === 0) {
        return null
      }

      const config = result.rows[0]
      return {
        id: config.id,
        key: config.key,
        value: this.parseValue(config.value, config.type),
        type: config.type,
        description: config.description,
        createdAt: config.created_at,
        updatedAt: config.updated_at
      }

    } catch (error) {
      this.logger.error('Failed to find configuration by key', {
        key,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Find configurations by type
   * @param {string} type - Configuration type
   * @returns {Promise<Array>} - Array of configuration objects
   */
  async findByType(type) {
    try {
      const query = 'SELECT * FROM configurations WHERE type = $1'
      const result = await this.db.query(query, [type])
      
      return result.rows.map(config => ({
        id: config.id,
        key: config.key,
        value: this.parseValue(config.value, config.type),
        type: config.type,
        description: config.description,
        createdAt: config.created_at,
        updatedAt: config.updated_at
      }))

    } catch (error) {
      this.logger.error('Failed to find configurations by type', {
        type,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Upsert configuration
   * @param {string} key - Configuration key
   * @param {*} value - Configuration value
   * @param {string} type - Configuration type (optional, auto-detected if not provided)
   * @param {string} description - Configuration description
   * @returns {Promise<Object>} - Configuration object
   */
  async upsert(key, value, type = null, description = null) {
    try {
      let finalType = type
      let serializedValue
      
      if (type) {
        // Use provided type
        serializedValue = this.serializeValueByType(value, type)
      } else {
        // Auto-detect type
        const serialized = this.serializeValue(value)
        finalType = serialized.type
        serializedValue = serialized.serializedValue
      }
      
      const query = `
        INSERT INTO configurations (key, value, type, description, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (key) 
        DO UPDATE SET 
          value = EXCLUDED.value,
          type = EXCLUDED.type,
          description = COALESCE(EXCLUDED.description, configurations.description),
          updated_at = NOW()
        RETURNING *
      `
      
      const result = await this.db.query(query, [key, serializedValue, finalType, description])
      const config = result.rows[0]

      this.logger.info('Configuration upserted', {
        key,
        type: finalType,
        value: value
      })

      return {
        id: config.id,
        key: config.key,
        value: this.parseValue(config.value, config.type),
        type: config.type,
        description: config.description,
        createdAt: config.created_at,
        updatedAt: config.updated_at
      }

    } catch (error) {
      this.logger.error('Failed to upsert configuration', {
        key,
        value,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Find all configurations
   * @returns {Promise<Array>} - Array of configuration objects
   */
  async findAll() {
    try {
      const query = 'SELECT * FROM configurations ORDER BY key'
      const result = await this.db.query(query)

      return result.rows.map(config => ({
        id: config.id,
        key: config.key,
        value: this.parseValue(config.value, config.type),
        type: config.type,
        description: config.description,
        createdAt: config.created_at,
        updatedAt: config.updated_at
      }))

    } catch (error) {
      this.logger.error('Failed to find all configurations', {
        error: error.message
      })
      throw error
    }
  }

  /**
   * Delete configuration by key
   * @param {string} key - Configuration key
   * @returns {Promise<boolean>} - Success status
   */
  async delete(key) {
    try {
      const query = 'DELETE FROM configurations WHERE key = $1'
      const result = await this.db.query(query, [key])

      this.logger.info('Configuration deleted', { key })
      return result.rowCount > 0

    } catch (error) {
      this.logger.error('Failed to delete configuration', {
        key,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Delete configuration by ID
   * @param {number} id - Configuration ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteById(id) {
    try {
      const query = 'DELETE FROM configurations WHERE id = $1'
      const result = await this.db.query(query, [id])

      this.logger.info('Configuration deleted by ID', { id })
      return result.rowCount > 0

    } catch (error) {
      this.logger.error('Failed to delete configuration by ID', {
        id,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Serialize value for database storage
   * @param {*} value - Value to serialize
   * @returns {Object} - Serialized value and type
   */
  serializeValue(value) {
    if (typeof value === 'boolean') {
      return { type: 'boolean', serializedValue: value.toString() }
    } else if (typeof value === 'number') {
      return { type: 'number', serializedValue: value.toString() }
    } else if (typeof value === 'object') {
      return { type: 'json', serializedValue: JSON.stringify(value) }
    } else {
      return { type: 'string', serializedValue: String(value) }
    }
  }

  /**
   * Serialize value by specific type
   * @param {*} value - Value to serialize
   * @param {string} type - Target type
   * @returns {string} - Serialized value
   */
  serializeValueByType(value, type) {
    switch (type) {
      case 'boolean':
        return value.toString()
      case 'number':
        return value.toString()
      case 'json':
        return typeof value === 'string' ? value : JSON.stringify(value)
      default:
        return String(value)
    }
  }

  /**
   * Parse value from database storage
   * @param {string} value - Serialized value
   * @param {string} type - Value type
   * @returns {*} - Parsed value
   */
  parseValue(value, type) {
    switch (type) {
      case 'boolean':
        return value === 'true'
      case 'number':
        return Number(value)
      case 'json':
        try {
          return JSON.parse(value)
        } catch {
          return value
        }
      default:
        return value
    }
  }

  /**
   * Initialize default configurations
   * @returns {Promise<void>}
   */
  async initializeDefaults() {
    const defaultConfigs = [
      // Server configurations
      { key: 'server.port', value: 3000, type: 'number', description: 'Server port number' },
      { key: 'server.host', value: '0.0.0.0', type: 'string', description: 'Server host' },
      { key: 'server.nodeEnv', value: 'development', type: 'string', description: 'Node.js environment' },
      
      // Security configurations
      { key: 'security.jwtSecret', value: 'your-super-secret-jwt-key-change-this-in-production', type: 'string', description: 'JWT secret key' },
      { key: 'security.jwtExpiry', value: '24h', type: 'string', description: 'JWT token expiry' },
      { key: 'security.corsOrigins', value: 'http://localhost:3000,http://localhost:8080', type: 'string', description: 'Allowed CORS origins' },
      
      // Rate limiting configurations
      { key: 'rateLimit.windowMs', value: 900000, type: 'number', description: 'Rate limit window in milliseconds' },
      { key: 'rateLimit.max', value: 100, type: 'number', description: 'Maximum requests per window' },
      
      // Logging configurations
      { key: 'logging.level', value: 'info', type: 'string', description: 'Log level' },
      { key: 'logging.format', value: 'json', type: 'string', description: 'Log format' },
      
      // Application configurations
      { key: 'dify.maxResponseLength', value: 1000, type: 'number', description: 'Maximum length for Dify responses' },
      { key: 'dify.simpleGreetingMaxLength', value: 200, type: 'number', description: 'Maximum length for simple greeting responses' },
      { key: 'dify.cooldownPeriod', value: 5000, type: 'number', description: 'Cooldown period between responses in milliseconds' },
      { key: 'dify.enableConversationHistory', value: false, type: 'boolean', description: 'Enable conversation history in Dify' },
      { key: 'telegram.maxMessageLength', value: 4096, type: 'number', description: 'Maximum length for Telegram messages' },
      { key: 'telegram.parseMode', value: 'HTML', type: 'string', description: 'Parse mode for Telegram messages' },
      { key: 'chatwoot.maxMessageLength', value: 10000, type: 'number', description: 'Maximum length for Chatwoot messages' },
      { key: 'chatwoot.messageType', value: 'outgoing', type: 'string', description: 'Default message type for Chatwoot' }
    ]

    for (const config of defaultConfigs) {
      try {
        await this.upsert(config.key, config.value, config.type, config.description)
      } catch (error) {
        this.logger.warn('Failed to initialize default configuration', {
          key: config.key,
          error: error.message
        })
      }
    }

    this.logger.info('Default configurations initialized')
  }
}

module.exports = ConfigurationRepository
