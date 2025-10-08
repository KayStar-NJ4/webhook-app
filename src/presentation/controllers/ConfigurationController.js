/**
 * Configuration Controller
 * Handles HTTP requests for system configuration operations
 */
class ConfigurationController {
  constructor ({
    configurationRepository,
    logger
  }) {
    this.configurationRepository = configurationRepository
    this.logger = logger
  }

  /**
   * Get system configurations
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getSystemConfigurations (req, res) {
    try {
      const configurations = await this.configurationRepository.findAll()

      res.json({
        success: true,
        data: configurations
      })
    } catch (error) {
      this.logger.error('Get system configurations failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Update system configuration
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async updateSystemConfiguration (req, res) {
    try {
      // Support both array and single object
      const data = req.body
      const configs = Array.isArray(data) ? data : [data]

      // Update each configuration
      const results = []
      for (const config of configs) {
        const result = await this.configurationRepository.upsert(
          config.key,
          config.value,
          config.type,
          config.description
        )
        results.push(result)
      }

      res.json({
        success: true,
        data: results.length === 1 ? results[0] : results,
        message: 'System configurations updated successfully'
      })
    } catch (error) {
      this.logger.error('Update system configuration failed', { error: error.message, stack: error.stack })
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      })
    }
  }

  /**
   * Get system configuration by key
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getSystemConfigurationByKey (req, res) {
    try {
      const { key } = req.params
      const configuration = await this.configurationRepository.findByKey(key)

      if (!configuration) {
        return res.status(404).json({
          success: false,
          message: 'Configuration not found'
        })
      }

      res.json({
        success: true,
        data: configuration
      })
    } catch (error) {
      this.logger.error('Get system configuration by key failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Delete system configuration
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async deleteSystemConfiguration (req, res) {
    try {
      const { key } = req.params
      const deleted = await this.configurationRepository.delete(key)

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Configuration not found'
        })
      }

      res.json({
        success: true,
        message: 'Configuration deleted successfully'
      })
    } catch (error) {
      this.logger.error('Delete system configuration failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }
}

module.exports = ConfigurationController
