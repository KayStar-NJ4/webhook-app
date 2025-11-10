/**
 * Zalo OA Controller - Presentation layer
 * Handles Zalo Official Account-related HTTP requests (API + Admin CRUD)
 */
class ZaloOAController {
  constructor ({ zaloOARepository, zaloOAService, configurationService, logger }) {
    this.zaloOARepository = zaloOARepository
    this.zaloOAService = zaloOAService
    this.configurationService = configurationService
    this.logger = logger
  }

  // ==================== ADMIN CRUD METHODS ====================

  async getAll (req, res) {
    try {
      const { page = 1, limit = 10, search = '', isActive, sort_by = 'created_at.desc' } = req.query
      const result = await this.zaloOARepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        isActive: isActive ? isActive === 'true' : null,
        sortBy: sort_by
      })

      res.json({ success: true, data: result })
    } catch (error) {
      this.logger.error('Get Zalo OAs failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async create (req, res) {
    try {
      const { name, oaId, accessToken, refreshToken, secretKey, isActive = true } = req.body

      if (!name || !oaId || !accessToken) {
        return res.status(400).json({ success: false, message: 'Name, OA ID, and access token are required' })
      }

      // Auto-generate webhook URL from system config
      let appUrl = process.env.APP_URL
      if (!appUrl) {
        try {
          appUrl = await this.configurationService.get('app_url')
        } catch (configError) {
          this.logger.warn('Failed to get app_url from config', { error: configError.message })
        }
      }
      appUrl = appUrl || 'https://webhook-bot.turbo.vn'

      const oa = await this.zaloOARepository.create({
        name,
        oaId,
        accessToken,
        refreshToken,
        secretKey,
        webhookUrl: null, // Will be set later when we know the OA ID
        apiUrl: 'https://openapi.zalo.me', // Fixed API URL
        isActive,
        createdBy: req.user.userId
      })

      // Update webhook URL with OA ID
      const webhookUrl = `${appUrl}/webhook/zalo-oa/${oa.id}`
      const updatedOA = await this.zaloOARepository.update(oa.id, { webhookUrl })

      res.status(201).json({
        success: true,
        message: 'Zalo OA created successfully',
        data: updatedOA
      })
    } catch (error) {
      this.logger.error('Create Zalo OA failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async getById (req, res) {
    try {
      const { id } = req.params
      const oa = await this.zaloOARepository.findById(id)

      if (!oa) {
        return res.status(404).json({ success: false, message: 'Zalo OA not found' })
      }

      // Return full data for admin edit form (admin has update permission to see sensitive data)
      // Security: Only admins with update permission can access this endpoint (via middleware)
      res.json({ success: true, data: oa })
    } catch (error) {
      this.logger.error('Get Zalo OA by ID failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async update (req, res) {
    try {
      const { id } = req.params
      const { name, oaId, accessToken, refreshToken, isActive, secretKey } = req.body

      // Don't allow changing apiUrl and webhookUrl - they're auto-managed
      const oa = await this.zaloOARepository.update(id, {
        name, oaId, accessToken, refreshToken, isActive, secretKey
      })

      // Don't expose sensitive tokens in response
      const safeOA = { ...oa }
      delete safeOA.access_token
      delete safeOA.refresh_token
      delete safeOA.secret_key

      res.json({ success: true, message: 'Zalo OA updated successfully', data: safeOA })
    } catch (error) {
      this.logger.error('Update Zalo OA failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async delete (req, res) {
    try {
      const { id } = req.params
      const deleted = await this.zaloOARepository.delete(id)

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Zalo OA not found' })
      }

      res.json({ success: true, message: 'Zalo OA deleted successfully' })
    } catch (error) {
      this.logger.error('Delete Zalo OA failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async getActive (req, res) {
    try {
      const oas = await this.zaloOARepository.findActive()
      // Don't expose sensitive tokens in response
      const safeOAs = oas.map(oa => {
        const safe = { ...oa }
        delete safe.access_token
        delete safe.refresh_token
        delete safe.secret_key
        return safe
      })
      res.json({ success: true, data: safeOAs })
    } catch (error) {
      this.logger.error('Get active Zalo OAs failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async testConnection (req, res) {
    try {
      const { id } = req.params

      const oa = await this.zaloOARepository.findById(id)
      if (!oa) {
        return res.status(404).json({ success: false, message: 'Zalo OA not found' })
      }

      const originalConfig = {
        accessToken: this.zaloOAService.accessToken,
        oaId: this.zaloOAService.oaId,
        apiUrl: this.zaloOAService.apiUrl
      }

      this.zaloOAService.accessToken = oa.access_token
      this.zaloOAService.oaId = oa.oa_id
      const baseUrl = oa.api_url || 'https://openapi.zalo.me'
      this.zaloOAService.apiUrl = baseUrl

      try {
        const result = await this.zaloOAService.getOAInfo()

        if (!result) {
          return res.json({
            success: false,
            data: {
              connected: false,
              message: 'Access token invalid',
              oaInfo: null
            }
          })
        }

        // Generate webhook URL
        let webhookUrl = null
        try {
          let appUrl = process.env.APP_URL
          if (!appUrl) {
            try {
              appUrl = await this.configurationService.get('app_url')
            } catch (configError) {
              // Ignore error - will use default APP_URL below
            }
          }

          appUrl = appUrl || 'https://webhook-bot.turbo.vn'
          webhookUrl = `${appUrl}/webhook/zalo-oa/${oa.id}`
        } catch (webhookErr) {
          this.logger.error('Error generating webhook URL', { oaId: oa.id, error: webhookErr.message })
        }

        res.json({
          success: true,
          data: {
            connected: true,
            message: 'Access token is valid. Please configure webhook manually in Zalo OA Developer Portal.',
            oaInfo: result,
            webhookUrl,
            note: 'Zalo OA requires manual webhook configuration through their developer portal. Use the webhook URL above.'
          }
        })
      } finally {
        this.zaloOAService.accessToken = originalConfig.accessToken
        this.zaloOAService.oaId = originalConfig.oaId
        this.zaloOAService.apiUrl = originalConfig.apiUrl
      }
    } catch (error) {
      this.logger.error('Test Zalo OA connection failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Connection test failed: ' + error.message })
    }
  }

  // ==================== API METHODS ====================

  /**
   * Get OA info
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getOAInfo (req, res) {
    try {
      this.logger.info('Getting Zalo OA info')

      const result = await this.zaloOAService.getOAInfo()

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      this.logger.error('Failed to get Zalo OA info', {
        error: error.message
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * Test message sending
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async testMessage (req, res) {
    try {
      const { userId, message } = req.body

      if (!userId || !message) {
        return res.status(400).json({
          success: false,
          error: 'userId and message are required'
        })
      }

      this.logger.info('Testing Zalo OA message', { userId, message })

      const result = await this.zaloOAService.sendMessage(userId, message)

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      this.logger.error('Failed to test Zalo OA message', {
        error: error.message,
        body: req.body
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }
}

module.exports = ZaloOAController

