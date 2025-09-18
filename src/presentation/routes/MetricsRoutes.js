const express = require('express')

/**
 * Metrics Routes
 * Defines metrics-related routes
 */
class MetricsRoutes {
  constructor ({ metricsController, validation, errorHandler }) {
    this.metricsController = metricsController
    this.validation = validation
    this.errorHandler = errorHandler
    this.router = express.Router()
    this.setupRoutes()
  }

  /**
   * Setup routes
   */
  setupRoutes () {
    // Get metrics summary
    this.router.get('/',
      this.errorHandler.asyncHandler(
        (req, res) => this.metricsController.getMetrics(req, res)
      )
    )

    // Get health status with metrics
    this.router.get('/health',
      this.errorHandler.asyncHandler(
        (req, res) => this.metricsController.getHealth(req, res)
      )
    )

    // Reset metrics
    this.router.post('/reset',
      this.errorHandler.asyncHandler(
        (req, res) => this.metricsController.resetMetrics(req, res)
      )
    )

    // Get Prometheus metrics
    this.router.get('/prometheus',
      this.errorHandler.asyncHandler(
        (req, res) => this.metricsController.getPrometheusMetrics(req, res)
      )
    )
  }

  /**
   * Get router instance
   * @returns {express.Router}
   */
  getRouter () {
    return this.router
  }
}

module.exports = MetricsRoutes
