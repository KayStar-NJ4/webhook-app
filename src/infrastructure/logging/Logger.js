const winston = require('winston')
const path = require('path')
const { Writable } = require('stream')
const { Pool } = require('pg')

/**
 * Logger - Infrastructure layer
 * Centralized logging with structured format and database storage
 */
class Logger {
  constructor (component = 'Logger', logRepository = null, config = null, databaseService = null) {
    this.component = component
    this.logRepository = logRepository
    this.config = config
    this.databaseService = databaseService
    this.logger = this.createLogger()
    this.debugCache = { value: false, timestamp: 0, ttlMs: 0 }
    this.dbPool = null
  }

  /**
   * Create Winston logger instance
   * @returns {winston.Logger}
   */
  createLogger () {
    const logLevel = process.env.LOG_LEVEL || 'silent'
    const logFormat = process.env.LOG_FORMAT || 'simple'

    const format = logFormat === 'json'
      ? winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
      : winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
          return `${timestamp} [${level}]: ${message} ${metaStr}`
        })
      )

    // Provide a no-op transport to avoid winston warnings and terminal output
    const transports = []

    const devNull = new Writable({
      write (_chunk, _encoding, callback) { callback() }
    })

    transports.push(new winston.transports.Stream({
      stream: devNull,
      level: logLevel,
      format
    }))

    return winston.createLogger({
      level: logLevel,
      format,
      transports,
      exitOnError: false
    })
  }

  async isDebugEnabled () {
    const now = Date.now()
    if (this.debugCache.ttlMs > 0 && (now - this.debugCache.timestamp < this.debugCache.ttlMs)) {
      return this.debugCache.value
    }

    let debugEnabled = false
    try {
      if (this.databaseService) {
        const result = await this.databaseService.query('SELECT value, type FROM configurations WHERE key = $1', ['debug_mode'])
        if (result.rows.length > 0) {
          const row = result.rows[0]
          const raw = String(row.value).toLowerCase()
          if (row.type === 'boolean') {
            debugEnabled = raw === 'true' || raw === 't' || raw === '1' || raw === 'yes' || raw === 'y'
          } else if (row.type === 'number') {
            debugEnabled = Number(row.value) !== 0
          } else {
            debugEnabled = raw === 'true' || raw === '1' || raw === 'yes'
          }
        }
      } else if (this.config) {
        if (!this.dbPool) {
          const db = this.config.getDatabase()
          this.dbPool = new Pool(db)
        }
        const result = await this.dbPool.query('SELECT value, type FROM configurations WHERE key = $1', ['debug_mode'])
        if (result.rows.length > 0) {
          const row = result.rows[0]
          const raw = String(row.value).toLowerCase()
          if (row.type === 'boolean') {
            debugEnabled = raw === 'true' || raw === 't' || raw === '1' || raw === 'yes' || raw === 'y'
          } else if (row.type === 'number') {
            debugEnabled = Number(row.value) !== 0
          } else {
            debugEnabled = raw === 'true' || raw === '1' || raw === 'yes'
          }
        }
      }
    } catch (_) {
      // ignore and keep debugEnabled as false
    }

    this.debugCache = { value: debugEnabled, timestamp: now, ttlMs: 60000 }
    return debugEnabled
  }

  /**
   * Log info message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  async info (message, meta = {}) {
    this.logger.info(message, { component: this.component, ...meta })

    // Log to database only when debug_mode is enabled
    if (this.logRepository && await this.isDebugEnabled()) {
      await this.logRepository.log('info', message, { component: this.component, ...meta })
    }
  }

  /**
   * Log error message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  async error (message, meta = {}) {
    this.logger.error(message, { component: this.component, ...meta })

    // Also log to database if repository is available
    if (this.logRepository) {
      await this.logRepository.logError(new Error(message), { component: this.component, ...meta })
    }
  }

  /**
   * Log warning message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  async warn (message, meta = {}) {
    this.logger.warn(message, { component: this.component, ...meta })

    // Log to database only when debug_mode is enabled
    if (this.logRepository && await this.isDebugEnabled()) {
      await this.logRepository.log('warn', message, { component: this.component, ...meta })
    }
  }

  /**
   * Log HTTP request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {number} responseTime - Response time in ms
   */
  async logRequest (req, res, responseTime) {
    const meta = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    }

    if (res.statusCode >= 400) {
      await this.error('HTTP Request Error', meta)
    } else {
      await this.info('HTTP Request', meta)
    }
  }

  /**
   * Get child logger with additional context
   * @param {Object} context - Additional context
   * @returns {Object} - Child logger
   */
  child (context) {
    return {
      info: async (message, meta = {}) => await this.info(message, { ...context, ...meta }),
      error: async (message, meta = {}) => await this.error(message, { ...context, ...meta }),
      warn: async (message, meta = {}) => await this.warn(message, { ...context, ...meta })
    }
  }
}

module.exports = Logger
