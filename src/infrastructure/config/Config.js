require('dotenv').config()
const Joi = require('joi')

/**
 * Configuration class with validation
 */
class Config {
  constructor() {
    this.schema = this.createValidationSchema()
    this.config = this.loadAndValidateConfig()
  }

  /**
   * Create Joi validation schema
   */
  createValidationSchema() {
    return Joi.object({
      server: Joi.object({
        port: Joi.number().port().default(3000),
        nodeEnv: Joi.string().valid('development', 'production', 'test').default('development'),
        host: Joi.string().default('0.0.0.0')
      }).required(),

      logging: Joi.object({
        level: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
        format: Joi.string().valid('json', 'simple').default('json')
      }).required(),

      database: Joi.object({
        host: Joi.string().required(),
        port: Joi.number().port().required(),
        name: Joi.string().required(),
        user: Joi.string().required(),
        password: Joi.string().allow(''),
        ssl: Joi.boolean().default(false),
        connectionString: Joi.string().allow('')
      }).required()
    })
  }

  /**
   * Load and validate configuration
   */
  loadAndValidateConfig() {
    const rawConfig = {
      server: {
        port: process.env.PORT,
        nodeEnv: process.env.NODE_ENV,
        host: process.env.HOST
      },
      logging: {
        level: process.env.LOG_LEVEL,
        format: process.env.LOG_FORMAT
      },
      database: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL,
        connectionString: process.env.DATABASE_URL
      }
    }

    const { error, value } = this.schema.validate(rawConfig, {
      abortEarly: false,
      stripUnknown: true
    })

    if (error) {
      const errorMessages = error.details.map(detail => detail.message).join(', ')
      throw new Error(`Configuration validation failed: ${errorMessages}`)
    }

    return value
  }

  /**
   * Get configuration value by path
   * @param {string} path - Dot notation path (e.g., 'server.port')
   * @returns {any} - Configuration value
   */
  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.config)
  }

  /**
   * Get all configuration
   * @returns {Object} - Complete configuration
   */
  getAll() {
    return { ...this.config }
  }

  /**
   * Check if running in development mode
   * @returns {boolean}
   */
  isDevelopment() {
    return this.config.server.nodeEnv === 'development'
  }

  /**
   * Check if running in production mode
   * @returns {boolean}
   */
  isProduction() {
    return this.config.server.nodeEnv === 'production'
  }

  /**
   * Check if running in test mode
   * @returns {boolean}
   */
  isTest() {
    return this.config.server.nodeEnv === 'test'
  }

  /**
   * Get database connection configuration
   * @returns {Object} - Database configuration
   */
  getDatabase() {
    const dbConfig = this.config.database
    
    if (dbConfig.connectionString) {
      return { connectionString: dbConfig.connectionString }
    }
    
    return {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.name,
      user: dbConfig.user,
      password: dbConfig.password,
      ssl: dbConfig.ssl
    }
  }
}

module.exports = Config
