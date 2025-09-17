const express = require('express')
const router = express.Router()

/**
 * Log Routes - Presentation layer
 * API endpoints for log management
 */
class LogRoutes {
  constructor (logController) {
    this.logController = logController
    this.setupRoutes()
  }

  setupRoutes () {
    // Get recent logs
    router.get('/', async (req, res) => {
      await this.logController.getLogs(req, res)
    })

    // Get error logs
    router.get('/errors', async (req, res) => {
      await this.logController.getErrorLogs(req, res)
    })

    // Get log statistics
    router.get('/stats', async (req, res) => {
      await this.logController.getLogStats(req, res)
    })

    // Clean old logs
    router.delete('/clean', async (req, res) => {
      await this.logController.cleanOldLogs(req, res)
    })
  }

  getRouter () {
    return router
  }
}

module.exports = LogRoutes
