/**
 * Chatwoot Controller - Manages Chatwoot accounts
 */
class ChatwootController {
  constructor ({ chatwootAccountRepository, chatwootService, logger }) {
    this.chatwootAccountRepository = chatwootAccountRepository
    this.chatwootService = chatwootService
    this.logger = logger
  }

  async getAll (req, res) {
    try {
      const { page = 1, limit = 10, search = '', sort_by } = req.query

      const rawIsActive = (req.query.isActive !== undefined)
        ? req.query.isActive
        : (req.query.is_active !== undefined ? req.query.is_active : null)

      let normalizedIsActive = null
      if (rawIsActive !== null) {
        const val = String(rawIsActive).toLowerCase()
        if (val === 'true' || val === '1') normalizedIsActive = true
        else if (val === 'false' || val === '0') normalizedIsActive = false
      }

      const result = await this.chatwootAccountRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        sort_by,
        isActive: normalizedIsActive
      })

      res.json({
        success: true,
        data: result.accounts || [],
        meta: {
          total_item: result.pagination?.total || 0,
          total_page: result.pagination?.pages || 0
        }
      })
    } catch (error) {
      this.logger.error('Get chatwoot accounts failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async create (req, res) {
    try {
      const { name, baseUrl, accessToken, accountId, aiBotAccessToken } = req.body

      if (!name || !baseUrl || !accessToken || !accountId) {
        return res.status(400).json({ success: false, message: 'Name, base URL, access token and account ID are required' })
      }

      const account = await this.chatwootAccountRepository.create({
        name, baseUrl, accessToken, accountId, aiBotAccessToken,
        isActive: true
      }, req.user)

      res.status(201).json({ success: true, message: 'Chatwoot account created successfully', data: account })
    } catch (error) {
      this.logger.error('Create chatwoot account failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async update (req, res) {
    try {
      const { id } = req.params
      const { name, baseUrl, accessToken, accountId, aiBotAccessToken, isActive } = req.body

      if (!name || !baseUrl || !accessToken || !accountId) {
        return res.status(400).json({ success: false, message: 'Name, base URL, access token and account ID are required' })
      }

      const account = await this.chatwootAccountRepository.update(id, {
        name, baseUrl, accessToken, accountId, aiBotAccessToken,
        isActive: isActive !== undefined ? isActive : true
      }, req.user)

      if (!account) {
        return res.status(404).json({ success: false, message: 'Chatwoot account not found' })
      }

      res.json({ success: true, message: 'Chatwoot account updated successfully', data: account })
    } catch (error) {
      this.logger.error('Update chatwoot account failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async delete (req, res) {
    try {
      const { id } = req.params
      const deleted = await this.chatwootAccountRepository.delete(id)

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Chatwoot account not found' })
      }

      res.json({ success: true, message: 'Chatwoot account deleted successfully' })
    } catch (error) {
      this.logger.error('Delete chatwoot account failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async testConnection (req, res) {
    try {
      const { id } = req.params

      const account = await this.chatwootAccountRepository.findById(id)
      if (!account) {
        return res.status(404).json({ success: false, message: 'Chatwoot account not found' })
      }

      const originalConfig = {
        baseUrl: this.chatwootService.baseUrl,
        accountId: this.chatwootService.accountId,
        accessToken: this.chatwootService.accessToken
      }

      this.chatwootService.baseUrl = account.base_url
      this.chatwootService.accountId = account.account_id
      this.chatwootService.accessToken = account.access_token

      try {
        const isConnected = await this.chatwootService.testConnection()
        res.json({ success: true, data: { connected: isConnected, message: isConnected ? 'Connection successful' : 'Connection failed' } })
      } finally {
        this.chatwootService.baseUrl = originalConfig.baseUrl
        this.chatwootService.accountId = originalConfig.accountId
        this.chatwootService.accessToken = originalConfig.accessToken
      }
    } catch (error) {
      this.logger.error('Test Chatwoot account connection failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Connection test failed: ' + error.message })
    }
  }
}

module.exports = ChatwootController
