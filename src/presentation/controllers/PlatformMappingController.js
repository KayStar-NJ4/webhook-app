/**
 * Platform Mapping Controller
 * Handles HTTP requests for platform mapping operations
 */
class PlatformMappingController {
  constructor ({
    platformMappingService,
    logger
  }) {
    this.platformMappingService = platformMappingService
    this.logger = logger
  }

  /**
   * Create a new platform mapping
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async createMapping (req, res) {
    try {
      const mappingData = req.body
      const user = req.user

      // Support new flow-based model: source + at least one target (chatwoot or dify)
      const hasFlowBased = mappingData.sourcePlatform && mappingData.sourceId && 
                          (mappingData.enableChatwoot || mappingData.enableDify)
      const hasLegacy = mappingData.telegramBotId && mappingData.chatwootAccountId && mappingData.difyAppId

      if (!hasFlowBased && !hasLegacy) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: sourcePlatform, sourceId, and at least one of (enableChatwoot, enableDify)'
        })
      }

      const mapping = await this.platformMappingService.createMapping(mappingData, user)

      res.status(201).json({
        success: true,
        data: mapping,
        message: 'Platform mapping created successfully'
      })
    } catch (error) {
      this.logger.error('Failed to create platform mapping', {
        error: error.message,
        body: req.body,
        userId: req.user?.id
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * Get all platform mappings
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getAllMappings (req, res) {
    try {
      const filters = {
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        telegramBotId: req.query.telegramBotId ? parseInt(req.query.telegramBotId) : undefined,
        chatwootAccountId: req.query.chatwootAccountId ? parseInt(req.query.chatwootAccountId) : undefined,
        difyAppId: req.query.difyAppId ? parseInt(req.query.difyAppId) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset) : undefined
      }

      const mappings = await this.platformMappingService.getAllMappings(filters)

      res.json({
        success: true,
        data: mappings,
        count: mappings.length
      })
    } catch (error) {
      this.logger.error('Failed to get platform mappings', {
        error: error.message,
        query: req.query,
        userId: req.user?.id
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * Get mappings by Telegram bot ID
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getMappingsByTelegramBot (req, res) {
    try {
      const telegramBotId = parseInt(req.params.telegramBotId)

      if (isNaN(telegramBotId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Telegram bot ID'
        })
      }

      const mappings = await this.platformMappingService.getMappingsByTelegramBot(telegramBotId)

      res.json({
        success: true,
        data: mappings,
        count: mappings.length
      })
    } catch (error) {
      this.logger.error('Failed to get mappings by Telegram bot', {
        error: error.message,
        telegramBotId: req.params.telegramBotId,
        userId: req.user?.id
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * Get mappings by Chatwoot account ID
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getMappingsByChatwootAccount (req, res) {
    try {
      const chatwootAccountId = parseInt(req.params.chatwootAccountId)

      if (isNaN(chatwootAccountId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Chatwoot account ID'
        })
      }

      const mappings = await this.platformMappingService.getMappingsByChatwootAccount(chatwootAccountId)

      res.json({
        success: true,
        data: mappings,
        count: mappings.length
      })
    } catch (error) {
      this.logger.error('Failed to get mappings by Chatwoot account', {
        error: error.message,
        chatwootAccountId: req.params.chatwootAccountId,
        userId: req.user?.id
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * Get mappings by Dify app ID
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getMappingsByDifyApp (req, res) {
    try {
      const difyAppId = parseInt(req.params.difyAppId)

      if (isNaN(difyAppId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Dify app ID'
        })
      }

      const mappings = await this.platformMappingService.getMappingsByDifyApp(difyAppId)

      res.json({
        success: true,
        data: mappings,
        count: mappings.length
      })
    } catch (error) {
      this.logger.error('Failed to get mappings by Dify app', {
        error: error.message,
        difyAppId: req.params.difyAppId,
        userId: req.user?.id
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * Get routing configuration for a Telegram bot
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getRoutingConfiguration (req, res) {
    try {
      const telegramBotId = parseInt(req.params.telegramBotId)

      if (isNaN(telegramBotId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Telegram bot ID'
        })
      }

      const routingConfig = await this.platformMappingService.getRoutingConfiguration(telegramBotId)

      res.json({
        success: true,
        data: routingConfig
      })
    } catch (error) {
      this.logger.error('Failed to get routing configuration', {
        error: error.message,
        telegramBotId: req.params.telegramBotId,
        userId: req.user?.id
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * Update platform mapping
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async updateMapping (req, res) {
    try {
      const mappingId = parseInt(req.params.id)
      const updateData = req.body
      const user = req.user

      if (isNaN(mappingId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid mapping ID'
        })
      }

      const mapping = await this.platformMappingService.updateMapping(mappingId, updateData, user)

      res.json({
        success: true,
        data: mapping,
        message: 'Platform mapping updated successfully'
      })
    } catch (error) {
      this.logger.error('Failed to update platform mapping', {
        error: error.message,
        mappingId: req.params.id,
        body: req.body,
        userId: req.user?.id
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * Delete platform mapping
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async deleteMapping (req, res) {
    try {
      const mappingId = parseInt(req.params.id)
      const user = req.user

      if (isNaN(mappingId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid mapping ID'
        })
      }

      const success = await this.platformMappingService.deleteMapping(mappingId, user)

      if (success) {
        res.json({
          success: true,
          message: 'Platform mapping deleted successfully'
        })
      } else {
        res.status(404).json({
          success: false,
          error: 'Platform mapping not found'
        })
      }
    } catch (error) {
      this.logger.error('Failed to delete platform mapping', {
        error: error.message,
        mappingId: req.params.id,
        userId: req.user?.id
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * Get available platforms for mapping
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getAvailablePlatforms (req, res) {
    try {
      const platforms = await this.platformMappingService.getAvailablePlatforms()

      res.json({
        success: true,
        data: platforms
      })
    } catch (error) {
      this.logger.error('Failed to get available platforms', {
        error: error.message,
        userId: req.user?.id
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * Test platform mapping connection
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */

  async testConnection (req, res) {
    try {
      const { id } = req.params

      const result = await this.platformMappingService.testConnection(parseInt(id))

      res.json({
        success: result.success,
        data: result,
        message: result.success ? 'Connection test successful' : 'Connection test failed'
      })
    } catch (error) {
      this.logger.error('Failed to test platform mapping connection', {
        error: error.message,
        mappingId: req.params.id
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }
}

module.exports = PlatformMappingController
