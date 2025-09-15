/**
 * Dify Controller - Presentation layer
 * Handles Dify app management endpoints
 */
class DifyController {
  constructor({ 
    difyAppRepository,
    difyService,
    userRepository,
    logger 
  }) {
    this.difyAppRepository = difyAppRepository
    this.difyService = difyService
    this.userRepository = userRepository
    this.logger = logger
  }

  /**
   * Get all Dify apps with pagination
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getDifyApps(req, res) {
    try {
      const { page = 1, limit = 10, search = '', isActive } = req.query
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        isActive: isActive !== undefined ? isActive === 'true' : null
      }

      const result = await this.difyAppRepository.findAll(options)

      res.json({
        success: true,
        data: result.apps,
        pagination: result.pagination
      })

    } catch (error) {
      this.logger.error('Get Dify apps failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Get Dify app by ID
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getDifyAppById(req, res) {
    try {
      const { id } = req.params
      const app = await this.difyAppRepository.findById(id)

      if (!app) {
        return res.status(404).json({
          success: false,
          message: 'Dify app not found'
        })
      }

      // Get mappings with Chatwoot accounts
      const mappings = await this.difyAppRepository.getMappings(id)

      res.json({
        success: true,
        data: {
          ...app,
          mappings
        }
      })

    } catch (error) {
      this.logger.error('Get Dify app by ID failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Create new Dify app
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async createDifyApp(req, res) {
    try {
      const userId = req.user.userId
      const { name, apiUrl, apiKey, appId, timeout = 30000, isActive = true } = req.body

      // Validation
      if (!name || !apiUrl || !apiKey || !appId) {
        return res.status(400).json({
          success: false,
          message: 'Name, API URL, API Key, and App ID are required'
        })
      }

      // Check if app ID already exists
      const existingApp = await this.difyAppRepository.findByAppId(appId)
      if (existingApp) {
        return res.status(409).json({
          success: false,
          message: 'Dify app with this App ID already exists'
        })
      }

      const appData = {
        name,
        apiUrl,
        apiKey,
        appId,
        timeout: parseInt(timeout),
        isActive: Boolean(isActive),
        createdBy: userId
      }

      const app = await this.difyAppRepository.create(appData)

      this.logger.info('Dify app created', { 
        appId: app.id, 
        name: app.name,
        createdBy: userId 
      })

      res.status(201).json({
        success: true,
        message: 'Dify app created successfully',
        data: app
      })

    } catch (error) {
      this.logger.error('Create Dify app failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Update Dify app
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async updateDifyApp(req, res) {
    try {
      const { id } = req.params
      const { name, apiUrl, apiKey, appId, timeout, isActive } = req.body

      // Check if app exists
      const existingApp = await this.difyAppRepository.findById(id)
      if (!existingApp) {
        return res.status(404).json({
          success: false,
          message: 'Dify app not found'
        })
      }

      // Check if new app ID conflicts with existing apps
      if (appId && appId !== existingApp.app_id) {
        const conflictApp = await this.difyAppRepository.findByAppId(appId)
        if (conflictApp) {
          return res.status(409).json({
            success: false,
            message: 'Dify app with this App ID already exists'
          })
        }
      }

      const updateData = {}
      if (name !== undefined) updateData.name = name
      if (apiUrl !== undefined) updateData.apiUrl = apiUrl
      if (apiKey !== undefined) updateData.apiKey = apiKey
      if (appId !== undefined) updateData.appId = appId
      if (timeout !== undefined) updateData.timeout = parseInt(timeout)
      if (isActive !== undefined) updateData.isActive = Boolean(isActive)

      const app = await this.difyAppRepository.update(id, updateData)

      this.logger.info('Dify app updated', { 
        appId: id,
        updatedBy: req.user.userId 
      })

      res.json({
        success: true,
        message: 'Dify app updated successfully',
        data: app
      })

    } catch (error) {
      this.logger.error('Update Dify app failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Delete Dify app
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async deleteDifyApp(req, res) {
    try {
      const { id } = req.params

      // Check if app exists
      const existingApp = await this.difyAppRepository.findById(id)
      if (!existingApp) {
        return res.status(404).json({
          success: false,
          message: 'Dify app not found'
        })
      }

      const deleted = await this.difyAppRepository.delete(id)

      if (!deleted) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete Dify app'
        })
      }

      this.logger.info('Dify app deleted', { 
        appId: id,
        deletedBy: req.user.userId 
      })

      res.json({
        success: true,
        message: 'Dify app deleted successfully'
      })

    } catch (error) {
      this.logger.error('Delete Dify app failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Get active Dify apps
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getActiveDifyApps(req, res) {
    try {
      const apps = await this.difyAppRepository.findActive()

      res.json({
        success: true,
        data: apps
      })

    } catch (error) {
      this.logger.error('Get active Dify apps failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Test Dify app connection
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async testDifyAppConnection(req, res) {
    try {
      const { id } = req.params

      const app = await this.difyAppRepository.findById(id)
      if (!app) {
        return res.status(404).json({
          success: false,
          message: 'Dify app not found'
        })
      }

      // Temporarily set service configuration for testing
      const originalConfig = {
        apiUrl: this.difyService.apiUrl,
        apiKey: this.difyService.apiKey,
        appId: this.difyService.appId
      }

      this.difyService.apiUrl = app.api_url
      this.difyService.apiKey = app.api_key
      this.difyService.appId = app.app_id

      try {
        const isConnected = await this.difyService.testConnection()
        
        res.json({
          success: true,
          data: {
            connected: isConnected,
            message: isConnected ? 'Connection successful' : 'Connection failed'
          }
        })
      } finally {
        // Restore original configuration
        this.difyService.apiUrl = originalConfig.apiUrl
        this.difyService.apiKey = originalConfig.apiKey
        this.difyService.appId = originalConfig.appId
      }

    } catch (error) {
      this.logger.error('Test Dify app connection failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Create Dify-Chatwoot mapping
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async createMapping(req, res) {
    try {
      const userId = req.user.userId
      const { difyAppId, chatwootAccountId, isActive = true } = req.body

      if (!difyAppId || !chatwootAccountId) {
        return res.status(400).json({
          success: false,
          message: 'Dify App ID and Chatwoot Account ID are required'
        })
      }

      // Verify Dify app exists
      const difyApp = await this.difyAppRepository.findById(difyAppId)
      if (!difyApp) {
        return res.status(404).json({
          success: false,
          message: 'Dify app not found'
        })
      }

      // Verify Chatwoot account exists
      const chatwootAccount = await this.userRepository.db.query(
        'SELECT id FROM chatwoot_accounts WHERE id = $1',
        [chatwootAccountId]
      )
      if (chatwootAccount.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Chatwoot account not found'
        })
      }

      const mappingData = {
        difyAppId,
        chatwootAccountId,
        isActive: Boolean(isActive),
        createdBy: userId
      }

      const mapping = await this.difyAppRepository.createMapping(mappingData)

      res.status(201).json({
        success: true,
        message: 'Mapping created successfully',
        data: mapping
      })

    } catch (error) {
      this.logger.error('Create Dify mapping failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Delete Dify-Chatwoot mapping
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async deleteMapping(req, res) {
    try {
      const { mappingId } = req.params

      const deleted = await this.difyAppRepository.deleteMapping(mappingId)

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Mapping not found'
        })
      }

      res.json({
        success: true,
        message: 'Mapping deleted successfully'
      })

    } catch (error) {
      this.logger.error('Delete Dify mapping failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }
}

module.exports = DifyController
