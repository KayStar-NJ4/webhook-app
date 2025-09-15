const winston = require('winston')
const path = require('path')

/**
 * Logger - Infrastructure layer
 * Centralized logging with structured format and database storage
 */
class Logger {
  constructor(component = 'Logger', logRepository = null) {
    this.component = component
    this.logRepository = logRepository
    this.logger = this.createLogger()
  }

  /**
   * Create Winston logger instance
   * @returns {winston.Logger}
   */
  createLogger() {
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

    const transports = []
    
    // Only add console transport if not silent
    if (logLevel !== 'silent') {
      transports.push(new winston.transports.Console({
        level: logLevel,
        format
      }))
    }

    return winston.createLogger({
      level: logLevel,
      format,
      transports,
      exitOnError: false
    })
  }

  /**
   * Log info message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  async info(message, meta = {}) {
    this.logger.info(message, { component: this.component, ...meta })
    
    // Also log to database if repository is available
    if (this.logRepository) {
      await this.logRepository.log('info', message, { component: this.component, ...meta })
    }
  }

  /**
   * Log error message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  async error(message, meta = {}) {
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
  async warn(message, meta = {}) {
    this.logger.warn(message, { component: this.component, ...meta })
    
    // Also log to database if repository is available
    if (this.logRepository) {
      await this.logRepository.log('warn', message, { component: this.component, ...meta })
    }
  }


  /**
   * Log HTTP request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {number} responseTime - Response time in ms
   */
  async logRequest(req, res, responseTime) {
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
  child(context) {
    return {
      info: async (message, meta = {}) => await this.info(message, { ...context, ...meta }),
      error: async (message, meta = {}) => await this.error(message, { ...context, ...meta }),
      warn: async (message, meta = {}) => await this.warn(message, { ...context, ...meta }),
    }
  }
}

module.exports = Logger
