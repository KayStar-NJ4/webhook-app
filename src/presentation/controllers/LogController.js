/**
 * Log Controller - Presentation layer
 * Handles log-related API endpoints
 */
class LogController {
  constructor (logRepository) {
    this.logRepository = logRepository
  }

  /**
   * Get recent logs
   * GET /api/logs
   */
  async getLogs (req, res) {
    try {
      const { limit = 100, level } = req.query
      const logs = await this.logRepository.getLogs(parseInt(limit), level)

      res.json({
        success: true,
        data: logs,
        count: logs.length
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve logs',
        message: error.message
      })
    }
  }

  /**
   * Get recent error logs
   * GET /api/logs/errors
   */
  async getErrorLogs (req, res) {
    try {
      const { limit = 100 } = req.query
      const errorLogs = await this.logRepository.getErrorLogs(parseInt(limit))

      res.json({
        success: true,
        data: errorLogs,
        count: errorLogs.length
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve error logs',
        message: error.message
      })
    }
  }

  /**
   * Clean old logs
   * DELETE /api/logs/clean
   */
  async cleanOldLogs (req, res) {
    try {
      const { days = 30 } = req.body
      const cleanedLogs = await this.logRepository.cleanOldLogs(parseInt(days))
      const cleanedErrorLogs = await this.logRepository.cleanOldErrorLogs(parseInt(days))

      res.json({
        success: true,
        message: `Cleaned ${cleanedLogs + cleanedErrorLogs} old log entries`,
        data: {
          cleanedLogs,
          cleanedErrorLogs,
          totalCleaned: cleanedLogs + cleanedErrorLogs
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to clean old logs',
        message: error.message
      })
    }
  }

  /**
   * Get log statistics
   * GET /api/logs/stats
   */
  async getLogStats (req, res) {
    try {
      // Get recent logs for statistics
      const recentLogs = await this.logRepository.getLogs(1000)
      const recentErrors = await this.logRepository.getErrorLogs(1000)

      // Calculate statistics
      const stats = {
        totalLogs: recentLogs.length,
        totalErrors: recentErrors.length,
        logsByLevel: {},
        errorsByComponent: {},
        recentActivity: {
          last24h: 0,
          last7d: 0
        }
      }

      // Count by level
      recentLogs.forEach(log => {
        stats.logsByLevel[log.level] = (stats.logsByLevel[log.level] || 0) + 1
      })

      // Count errors by component
      recentErrors.forEach(error => {
        const component = error.component || 'Unknown'
        stats.errorsByComponent[component] = (stats.errorsByComponent[component] || 0) + 1
      })

      // Calculate recent activity (last 24h and 7d)
      const now = new Date()
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      recentLogs.forEach(log => {
        const logDate = new Date(log.timestamp)
        if (logDate >= last24h) stats.recentActivity.last24h++
        if (logDate >= last7d) stats.recentActivity.last7d++
      })

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve log statistics',
        message: error.message
      })
    }
  }
}

module.exports = LogController
