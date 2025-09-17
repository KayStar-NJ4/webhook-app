/**
 * Metrics Collection for Application Monitoring
 */
class Metrics {
  constructor({ logger }) {
    this.logger = logger
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byEndpoint: new Map(),
        byMethod: new Map()
      },
      messages: {
        processed: 0,
        byPlatform: new Map(),
        processingTime: []
      },
      errors: {
        total: 0,
        byType: new Map(),
        byEndpoint: new Map()
      },
      performance: {
        responseTime: [],
        memoryUsage: [],
        cpuUsage: []
      }
    }
  }

  /**
   * Record HTTP request
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {number} responseTime - Response time in ms
   */
  recordRequest(req, res, responseTime) {
    this.metrics.requests.total++
    
    if (res.statusCode >= 400) {
      this.metrics.requests.failed++
    } else {
      this.metrics.requests.successful++
    }

    // Record by endpoint
    const endpoint = `${req.method} ${req.route?.path || req.path}`
    const endpointCount = this.metrics.requests.byEndpoint.get(endpoint) || 0
    this.metrics.requests.byEndpoint.set(endpoint, endpointCount + 1)

    // Record by method
    const methodCount = this.metrics.requests.byMethod.get(req.method) || 0
    this.metrics.requests.byMethod.set(req.method, methodCount + 1)

    // Record response time
    this.metrics.performance.responseTime.push(responseTime)
    if (this.metrics.performance.responseTime.length > 1000) {
      this.metrics.performance.responseTime.shift()
    }
  }

  /**
   * Record message processing
   * @param {string} platform - Platform name
   * @param {number} processingTime - Processing time in ms
   */
  recordMessage(platform, processingTime) {
    this.metrics.messages.processed++
    
    const platformCount = this.metrics.messages.byPlatform.get(platform) || 0
    this.metrics.messages.byPlatform.set(platform, platformCount + 1)

    this.metrics.messages.processingTime.push(processingTime)
    if (this.metrics.messages.processingTime.length > 1000) {
      this.metrics.messages.processingTime.shift()
    }
  }

  /**
   * Record error
   * @param {Error} error - Error object
   * @param {string} endpoint - Endpoint where error occurred
   */
  recordError(error, endpoint) {
    this.metrics.errors.total++
    
    const errorType = error.constructor.name
    const typeCount = this.metrics.errors.byType.get(errorType) || 0
    this.metrics.errors.byType.set(errorType, typeCount + 1)

    const endpointCount = this.metrics.errors.byEndpoint.get(endpoint) || 0
    this.metrics.errors.byEndpoint.set(endpoint, endpointCount + 1)
  }

  /**
   * Record system metrics
   */
  recordSystemMetrics() {
    const memUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    this.metrics.performance.memoryUsage.push({
      timestamp: Date.now(),
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external
    })

    this.metrics.performance.cpuUsage.push({
      timestamp: Date.now(),
      user: cpuUsage.user,
      system: cpuUsage.system
    })

    // Keep only last 100 records
    if (this.metrics.performance.memoryUsage.length > 100) {
      this.metrics.performance.memoryUsage.shift()
    }
    if (this.metrics.performance.cpuUsage.length > 100) {
      this.metrics.performance.cpuUsage.shift()
    }
  }

  /**
   * Get metrics summary
   * @returns {Object} - Metrics summary
   */
  getSummary() {
    const responseTimes = this.metrics.performance.responseTime
    const processingTimes = this.metrics.messages.processingTime

    return {
      requests: {
        total: this.metrics.requests.total,
        successful: this.metrics.requests.successful,
        failed: this.metrics.requests.failed,
        successRate: this.metrics.requests.total > 0 
          ? (this.metrics.requests.successful / this.metrics.requests.total * 100).toFixed(2) + '%'
          : '0%',
        byEndpoint: Object.fromEntries(this.metrics.requests.byEndpoint),
        byMethod: Object.fromEntries(this.metrics.requests.byMethod)
      },
      messages: {
        processed: this.metrics.messages.processed,
        byPlatform: Object.fromEntries(this.metrics.messages.byPlatform),
        avgProcessingTime: processingTimes.length > 0 
          ? (processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length).toFixed(2) + 'ms'
          : '0ms'
      },
      errors: {
        total: this.metrics.errors.total,
        byType: Object.fromEntries(this.metrics.errors.byType),
        byEndpoint: Object.fromEntries(this.metrics.errors.byEndpoint)
      },
      performance: {
        avgResponseTime: responseTimes.length > 0 
          ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2) + 'ms'
          : '0ms',
        p95ResponseTime: responseTimes.length > 0 
          ? this.percentile(responseTimes, 95).toFixed(2) + 'ms'
          : '0ms',
        memoryUsage: this.metrics.performance.memoryUsage.slice(-1)[0] || {},
        uptime: process.uptime()
      }
    }
  }

  /**
   * Calculate percentile
   * @param {Array} arr - Array of numbers
   * @param {number} p - Percentile (0-100)
   * @returns {number} - Percentile value
   */
  percentile(arr, p) {
    const sorted = [...arr].sort((a, b) => a - b)
    const index = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[index] || 0
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byEndpoint: new Map(),
        byMethod: new Map()
      },
      messages: {
        processed: 0,
        byPlatform: new Map(),
        processingTime: []
      },
      errors: {
        total: 0,
        byType: new Map(),
        byEndpoint: new Map()
      },
      performance: {
        responseTime: [],
        memoryUsage: [],
        cpuUsage: []
      }
    }
  }

  /**
   * Start system metrics collection
   * @param {number} interval - Collection interval in ms
   */
  startSystemMetricsCollection(interval = 30000) {
    setInterval(() => {
      this.recordSystemMetrics()
    }, interval)
  }
}

module.exports = Metrics
