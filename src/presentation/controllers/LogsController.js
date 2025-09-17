/**
 * Logs Controller - Presentation layer
 * Handles HTTP requests for system logs
 */
class LogsController {
  constructor ({ logService, logger }) {
    this.logService = logService
    this.logger = logger
  }

  /**
   * Get system logs with pagination and filtering
   * GET /api/logs
   */
  async getLogs (req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        level,
        component,
        startDate,
        endDate
      } = req.query

      const filters = {
        level,
        component,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      }

      const result = await this.logService.getLogs({
        page: parseInt(page),
        limit: parseInt(limit),
        filters
      })

      res.json({
        success: true,
        data: {
          logs: result.logs,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages
          }
        }
      })
    } catch (error) {
      this.logger.error('Failed to get logs', {
        error: error.message,
        stack: error.stack
      })

      res.status(500).json({
        success: false,
        error: 'Failed to get logs',
        message: error.message
      })
    }
  }

  /**
   * Get error logs with pagination and filtering
   * GET /api/logs/errors
   */
  async getErrorLogs (req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        component,
        startDate,
        endDate
      } = req.query

      const filters = {
        level: 'error',
        component,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      }

      const result = await this.logService.getLogs({
        page: parseInt(page),
        limit: parseInt(limit),
        filters
      })

      res.json({
        success: true,
        data: {
          logs: result.logs,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages
          }
        }
      })
    } catch (error) {
      this.logger.error('Failed to get error logs', {
        error: error.message,
        stack: error.stack
      })

      res.status(500).json({
        success: false,
        error: 'Failed to get error logs',
        message: error.message
      })
    }
  }

  /**
   * Get log details by ID
   * GET /api/logs/:id
   */
  async getLogById (req, res) {
    try {
      const { id } = req.params

      const log = await this.logService.getLogById(id)

      if (!log) {
        return res.status(404).json({
          success: false,
          error: 'Log not found'
        })
      }

      res.json({
        success: true,
        data: { log }
      })
    } catch (error) {
      this.logger.error('Failed to get log by ID', {
        error: error.message,
        stack: error.stack,
        logId: req.params.id
      })

      res.status(500).json({
        success: false,
        error: 'Failed to get log',
        message: error.message
      })
    }
  }

  /**
   * Clear old logs
   * DELETE /api/logs/cleanup
   */
  async clearOldLogs (req, res) {
    try {
      const { days = 30 } = req.body

      const result = await this.logService.clearOldLogs(parseInt(days))

      res.json({
        success: true,
        data: {
          deletedCount: result.deletedCount,
          message: `Cleared ${result.deletedCount} logs older than ${days} days`
        }
      })
    } catch (error) {
      this.logger.error('Failed to clear old logs', {
        error: error.message,
        stack: error.stack
      })

      res.status(500).json({
        success: false,
        error: 'Failed to clear old logs',
        message: error.message
      })
    }
  }
}

module.exports = LogsController
