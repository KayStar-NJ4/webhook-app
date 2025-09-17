/**
 * Logs Service - Application layer
 * Handles business logic for system logs
 */
class LogsService {
  constructor({ logRepository, logger }) {
    this.logRepository = logRepository
    this.logger = logger
  }

  /**
   * Get logs with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Paginated logs result
   */
  async getLogs({ page = 1, limit = 20, filters = {} }) {
    try {
      const offset = (page - 1) * limit
      
      const result = await this.logRepository.findWithPagination({
        offset,
        limit,
        filters
      })

      const totalPages = Math.ceil(result.total / limit)

      return {
        logs: result.logs,
        page,
        limit,
        total: result.total,
        totalPages
      }

    } catch (error) {
      this.logger.error('Failed to get logs', {
        error: error.message,
        filters
      })
      throw error
    }
  }

  /**
   * Get log by ID
   * @param {string} id - Log ID
   * @returns {Promise<Object|null>} - Log object or null
   */
  async getLogById(id) {
    try {
      return await this.logRepository.findById(id)
    } catch (error) {
      this.logger.error('Failed to get log by ID', {
        error: error.message,
        logId: id
      })
      throw error
    }
  }

  /**
   * Clear old logs
   * @param {number} days - Number of days to keep
   * @returns {Promise<Object>} - Cleanup result
   */
  async clearOldLogs(days = 30) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      const result = await this.logRepository.deleteOldLogs(cutoffDate)

      this.logger.info('Cleared old logs', {
        deletedCount: result.deletedCount,
        cutoffDate: cutoffDate.toISOString()
      })

      return result

    } catch (error) {
      this.logger.error('Failed to clear old logs', {
        error: error.message,
        days
      })
      throw error
    }
  }

  /**
   * Get log statistics
   * @returns {Promise<Object>} - Log statistics
   */
  async getLogStatistics() {
    try {
      const stats = await this.logRepository.getStatistics()

      return {
        totalLogs: stats.totalLogs,
        errorCount: stats.errorCount,
        warningCount: stats.warningCount,
        infoCount: stats.infoCount,
        debugCount: stats.debugCount,
        last24Hours: stats.last24Hours,
        last7Days: stats.last7Days
      }

    } catch (error) {
      this.logger.error('Failed to get log statistics', {
        error: error.message
      })
      throw error
    }
  }

  /**
   * Export logs to CSV
   * @param {Object} filters - Export filters
   * @returns {Promise<string>} - CSV content
   */
  async exportLogs(filters = {}) {
    try {
      const logs = await this.logRepository.findWithPagination({
        offset: 0,
        limit: 10000, // Large limit for export
        filters
      })

      const csvHeader = 'Timestamp,Level,Component,Message,Metadata\n'
      const csvRows = logs.logs.map(log => {
        const timestamp = new Date(log.timestamp).toISOString()
        const level = log.level || ''
        const component = log.component || ''
        const message = (log.message || '').replace(/"/g, '""')
        const metadata = JSON.stringify(log.metadata || {}).replace(/"/g, '""')
        
        return `"${timestamp}","${level}","${component}","${message}","${metadata}"`
      }).join('\n')

      return csvHeader + csvRows

    } catch (error) {
      this.logger.error('Failed to export logs', {
        error: error.message,
        filters
      })
      throw error
    }
  }
}

module.exports = LogsService
