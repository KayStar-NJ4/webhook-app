/**
 * Dify Controller - Manages Dify apps
 */
class DifyController {
  constructor ({ difyAppRepository, difyService, logger }) {
    this.difyAppRepository = difyAppRepository
    this.difyService = difyService
    this.logger = logger
  }

  async getAll (req, res) {
    try {
      const { page = 1, limit = 10, search = '', isActive, sort_by = 'created_at.desc' } = req.query
      const result = await this.difyAppRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        isActive: isActive ? isActive === 'true' : null,
        sortBy: sort_by
      })

      res.json({ success: true, data: result })
    } catch (error) {
      this.logger.error('Get dify apps failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async create (req, res) {
    try {
      const { name, apiUrl, apiKey, appId, timeout, isActive } = req.body

      if (!name || !apiUrl || !apiKey || !appId) {
        return res.status(400).json({ success: false, message: 'Name, API URL, API key and app ID are required' })
      }

      const app = await this.difyAppRepository.create({
        name, apiUrl, apiKey, appId,
        timeout: timeout || 30000,
        isActive: isActive !== undefined ? isActive : true,
        createdBy: req.user.userId
      })

      res.status(201).json({ success: true, message: 'Dify app created successfully', data: app })
    } catch (error) {
      this.logger.error('Create dify app failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async getById (req, res) {
    try {
      const { id } = req.params
      const app = await this.difyAppRepository.findById(id)

      if (!app) {
        return res.status(404).json({ success: false, message: 'Dify app not found' })
      }

      const mappings = await this.difyAppRepository.getMappings(id)

      res.json({ success: true, data: { ...app, mappings } })
    } catch (error) {
      this.logger.error('Get Dify app by ID failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async update (req, res) {
    try {
      const { id } = req.params
      const { name, apiUrl, apiKey, appId, timeout, isActive } = req.body

      const existingApp = await this.difyAppRepository.findById(id)
      if (!existingApp) {
        return res.status(404).json({ success: false, message: 'Dify app not found' })
      }

      if (appId && appId !== existingApp.app_id) {
        const conflictApp = await this.difyAppRepository.findByAppId(appId)
        if (conflictApp) {
          return res.status(409).json({ success: false, message: 'Dify app with this App ID already exists' })
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

      res.json({ success: true, message: 'Dify app updated successfully', data: app })
    } catch (error) {
      this.logger.error('Update Dify app failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async delete (req, res) {
    try {
      const { id } = req.params

      const existingApp = await this.difyAppRepository.findById(id)
      if (!existingApp) {
        return res.status(404).json({ success: false, message: 'Dify app not found' })
      }

      const deleted = await this.difyAppRepository.delete(id)

      if (!deleted) {
        return res.status(500).json({ success: false, message: 'Failed to delete Dify app' })
      }

      res.json({ success: true, message: 'Dify app deleted successfully' })
    } catch (error) {
      this.logger.error('Delete Dify app failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async getActive (req, res) {
    try {
      const apps = await this.difyAppRepository.findActive()
      res.json({ success: true, data: apps })
    } catch (error) {
      this.logger.error('Get active Dify apps failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async testConnection (req, res) {
    try {
      const { id } = req.params

      const app = await this.difyAppRepository.findById(id)
      if (!app) {
        return res.status(404).json({ success: false, message: 'Dify app not found' })
      }

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
        res.json({ success: true, data: { connected: isConnected, message: isConnected ? 'Connection successful' : 'Connection failed' } })
      } finally {
        this.difyService.apiUrl = originalConfig.apiUrl
        this.difyService.apiKey = originalConfig.apiKey
        this.difyService.appId = originalConfig.appId
      }
    } catch (error) {
      this.logger.error('Test Dify app connection failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Connection test failed: ' + error.message })
    }
  }
}

module.exports = DifyController