const { Pool } = require('pg')
const Logger = require('../logging/Logger')

/**
 * PostgreSQL Log Repository
 * Manages application logs in database
 */
class LogRepository {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'chatwoot_webhook',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    })
    
    this.logger = new Logger('LogRepository')
  }

  /**
   * Initialize the repository
   */
  async initialize() {
    try {
      await this.pool.query('SELECT 1')
      // Log repository connected successfully
    } catch (error) {
      this.logger.error('Failed to connect to log repository', { error: error.message })
      throw error
    }
  }

  /**
   * Log a message to the logs table
   */
  async log(level, message, metadata = {}) {
    try {
      const query = `
        INSERT INTO logs (level, message, component, metadata, timestamp)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `
      
      const values = [
        level,
        message,
        metadata.component || null,
        JSON.stringify(metadata),
        new Date()
      ]

      const result = await this.pool.query(query, values)
      return result.rows[0].id
    } catch (error) {
      console.error('Failed to log message:', error.message)
      // Fallback to console if database logging fails
      // Log entry created
    }
  }

  /**
   * Log an error to the error_logs table
   */
  async logError(error, metadata = {}) {
    try {
      const query = `
        INSERT INTO error_logs (level, message, stack, component, url, method, status_code, metadata, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `
      
      const values = [
        'error',
        error.message || 'Unknown error',
        error.stack || null,
        metadata.component || null,
        metadata.url || null,
        metadata.method || null,
        metadata.statusCode || null,
        JSON.stringify(metadata),
        new Date()
      ]

      const result = await this.pool.query(query, values)
      return result.rows[0].id
    } catch (dbError) {
      console.error('Failed to log error to database:', dbError.message)
      // Fallback to console if database logging fails
      console.error('Original error:', error.message, error.stack)
    }
  }

  /**
   * Get recent logs
   */
  async getLogs(limit = 100, level = null) {
    try {
      let query = 'SELECT * FROM logs'
      const values = []
      
      if (level) {
        query += ' WHERE level = $1'
        values.push(level)
      }
      
      query += ' ORDER BY timestamp DESC LIMIT $' + (values.length + 1)
      values.push(limit)

      const result = await this.pool.query(query, values)
      return result.rows
    } catch (error) {
      this.logger.error('Failed to get logs', { error: error.message })
      return []
    }
  }

  /**
   * Get recent error logs
   */
  async getErrorLogs(limit = 100) {
    try {
      const query = `
        SELECT * FROM error_logs 
        ORDER BY timestamp DESC 
        LIMIT $1
      `
      
      const result = await this.pool.query(query, [limit])
      return result.rows
    } catch (error) {
      this.logger.error('Failed to get error logs', { error: error.message })
      return []
    }
  }

  /**
   * Clean old logs (older than specified days)
   */
  async cleanOldLogs(days = 30) {
    try {
      const query = `
        DELETE FROM logs 
        WHERE timestamp < NOW() - INTERVAL '${days} days'
      `
      
      const result = await this.pool.query(query)
      this.logger.info(`Cleaned ${result.rowCount} old log entries`)
      return result.rowCount
    } catch (error) {
      this.logger.error('Failed to clean old logs', { error: error.message })
      return 0
    }
  }

  /**
   * Clean old error logs (older than specified days)
   */
  async cleanOldErrorLogs(days = 30) {
    try {
      const query = `
        DELETE FROM error_logs 
        WHERE timestamp < NOW() - INTERVAL '${days} days'
      `
      
      const result = await this.pool.query(query)
      this.logger.info(`Cleaned ${result.rowCount} old error log entries`)
      return result.rowCount
    } catch (error) {
      this.logger.error('Failed to clean old error logs', { error: error.message })
      return 0
    }
  }

  /**
   * Close the database connection
   */
  async close() {
    try {
      await this.pool.end()
      this.logger.info('Log repository connection closed')
    } catch (error) {
      this.logger.error('Error closing log repository', { error: error.message })
    }
  }
}

module.exports = LogRepository
