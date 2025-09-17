/**
 * Admin Controller - Presentation layer
 * Handles admin panel operations
 */
class AdminController {
  constructor ({
    userRepository,
    telegramBotRepository,
    chatwootAccountRepository,
    difyAppRepository,
    logger
  }) {
    this.userRepository = userRepository
    this.telegramBotRepository = telegramBotRepository
    this.chatwootAccountRepository = chatwootAccountRepository
    this.difyAppRepository = difyAppRepository
    this.logger = logger
  }

  /**
   * Get dashboard data
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getDashboard (req, res) {
    try {
      const [
        usersResult,
        botsResult,
        accountsResult,
        appsResult
      ] = await Promise.all([
        this.userRepository.findAll({ page: 1, limit: 5 }),
        this.telegramBotRepository.findAll({ page: 1, limit: 5 }),
        this.chatwootAccountRepository.findAll({ page: 1, limit: 5 }),
        this.difyAppRepository.findAll({ page: 1, limit: 5 })
      ])

      res.json({
        success: true,
        data: {
          stats: {
            totalUsers: usersResult.pagination.total,
            totalBots: botsResult.pagination.total,
            totalAccounts: accountsResult.pagination.total,
            totalApps: appsResult.pagination.total
          },
          recent: {
            users: usersResult.users,
            bots: botsResult.bots,
            accounts: accountsResult.accounts,
            apps: appsResult.apps
          }
        }
      })
    } catch (error) {
      this.logger.error('Get dashboard failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Get users
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getUsers (req, res) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query
      const result = await this.userRepository.findAll({ page: parseInt(page), limit: parseInt(limit), search })

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      this.logger.error('Get users failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Create user
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async createUser (req, res) {
    try {
      const { username, email, password, fullName } = req.body

      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email and password are required'
        })
      }

      const user = await this.userRepository.create({
        username,
        email,
        password,
        fullName
      })

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      })
    } catch (error) {
      this.logger.error('Create user failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Get telegram bots
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getTelegramBots (req, res) {
    try {
      const { page = 1, limit = 10, search = '', isActive, sort_by = 'created_at.desc' } = req.query
      const result = await this.telegramBotRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        isActive: isActive ? isActive === 'true' : null,
        sortBy: sort_by
      })

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      this.logger.error('Get telegram bots failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Create telegram bot
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async createTelegramBot (req, res) {
    try {
      const { name, botToken, secretToken, webhookUrl, apiUrl, isActive = true } = req.body

      if (!name || !botToken) {
        return res.status(400).json({
          success: false,
          message: 'Name and bot token are required'
        })
      }

      const bot = await this.telegramBotRepository.create({
        name,
        botToken,
        secretToken,
        webhookUrl,
        apiUrl: apiUrl || 'https://api.telegram.org',
        isActive,
        createdBy: req.user.userId
      })

      res.status(201).json({
        success: true,
        message: 'Telegram bot created successfully',
        data: bot
      })
    } catch (error) {
      this.logger.error('Create telegram bot failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Get telegram bot by ID
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getTelegramBotById (req, res) {
    try {
      const { id } = req.params
      const bot = await this.telegramBotRepository.findById(id)

      if (!bot) {
        return res.status(404).json({
          success: false,
          message: 'Telegram bot not found'
        })
      }

      // Get mappings with Chatwoot accounts
      const mappings = await this.telegramBotRepository.getMappings(id)

      res.json({
        success: true,
        data: {
          ...bot,
          mappings
        }
      })
    } catch (error) {
      this.logger.error('Get telegram bot by ID failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Update telegram bot
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async updateTelegramBot (req, res) {
    try {
      const { id } = req.params
      const { name, botToken, webhookUrl, apiUrl, isActive, secretToken } = req.body

      const bot = await this.telegramBotRepository.update(id, {
        name,
        botToken,
        webhookUrl,
        apiUrl,
        isActive,
        secretToken
      })

      res.json({
        success: true,
        message: 'Telegram bot updated successfully',
        data: bot
      })
    } catch (error) {
      this.logger.error('Update telegram bot failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Delete telegram bot
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async deleteTelegramBot (req, res) {
    try {
      const { id } = req.params
      const deleted = await this.telegramBotRepository.delete(id)

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Telegram bot not found'
        })
      }

      res.json({
        success: true,
        message: 'Telegram bot deleted successfully'
      })
    } catch (error) {
      this.logger.error('Delete telegram bot failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Get active telegram bots
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getActiveTelegramBots (req, res) {
    try {
      const bots = await this.telegramBotRepository.findActive()

      res.json({
        success: true,
        data: bots
      })
    } catch (error) {
      this.logger.error('Get active telegram bots failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Get chatwoot accounts
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getChatwootAccounts (req, res) {
    try {
      const { page = 1, limit = 10, search = '', isActive, sort_by } = req.query
      const result = await this.chatwootAccountRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        sort_by,
        isActive: isActive ? isActive === 'true' : null
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
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Create chatwoot account
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async createChatwootAccount (req, res) {
    try {
      const { name, baseUrl, accessToken, accountId, inboxId } = req.body

      if (!name || !baseUrl || !accessToken || !accountId) {
        return res.status(400).json({
          success: false,
          message: 'Name, base URL, access token and account ID are required'
        })
      }

      const account = await this.chatwootAccountRepository.create({
        name,
        baseUrl,
        accessToken,
        accountId,
        inboxId: inboxId || 1,
        isActive: true
      }, req.user)

      res.status(201).json({
        success: true,
        message: 'Chatwoot account created successfully',
        data: account
      })
    } catch (error) {
      this.logger.error('Create chatwoot account failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Update chatwoot account
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async updateChatwootAccount (req, res) {
    try {
      const { id } = req.params
      const { name, baseUrl, accessToken, accountId, inboxId, isActive } = req.body

      if (!name || !baseUrl || !accessToken || !accountId) {
        return res.status(400).json({
          success: false,
          message: 'Name, base URL, access token and account ID are required'
        })
      }

      const account = await this.chatwootAccountRepository.update(id, {
        name,
        baseUrl,
        accessToken,
        accountId,
        inboxId: inboxId || 1,
        isActive: isActive !== undefined ? isActive : true
      }, req.user)

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Chatwoot account not found'
        })
      }

      res.json({
        success: true,
        message: 'Chatwoot account updated successfully',
        data: account
      })
    } catch (error) {
      this.logger.error('Update chatwoot account failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Delete chatwoot account
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async deleteChatwootAccount (req, res) {
    try {
      const { id } = req.params

      const deleted = await this.chatwootAccountRepository.delete(id)

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Chatwoot account not found'
        })
      }

      res.json({
        success: true,
        message: 'Chatwoot account deleted successfully'
      })
    } catch (error) {
      this.logger.error('Delete chatwoot account failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Get dify apps
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getDifyApps (req, res) {
    try {
      const { page = 1, limit = 10, search = '', isActive, sort_by = 'created_at.desc' } = req.query
      const result = await this.difyAppRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        isActive: isActive ? isActive === 'true' : null,
        sortBy: sort_by
      })

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      this.logger.error('Get dify apps failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Create dify app
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async createDifyApp (req, res) {
    try {
      const { name, apiUrl, apiKey, appId, timeout, isActive } = req.body

      if (!name || !apiUrl || !apiKey || !appId) {
        return res.status(400).json({
          success: false,
          message: 'Name, API URL, API key and app ID are required'
        })
      }

      const app = await this.difyAppRepository.create({
        name,
        apiUrl,
        apiKey,
        appId,
        timeout: timeout || 30000,
        isActive: isActive !== undefined ? isActive : true,
        createdBy: req.user.userId
      })

      res.status(201).json({
        success: true,
        message: 'Dify app created successfully',
        data: app
      })
    } catch (error) {
      this.logger.error('Create dify app failed', { error: error.message })
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
  async getDifyAppById (req, res) {
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
   * Update Dify app
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async updateDifyApp (req, res) {
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
  async deleteDifyApp (req, res) {
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
  async getActiveDifyApps (req, res) {
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
   * Create Dify-Chatwoot mapping
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async createMapping (req, res) {
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
  async deleteMapping (req, res) {
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

module.exports = AdminController
