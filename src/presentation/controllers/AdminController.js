/**
 * Admin Controller - Presentation layer
 * Handles admin panel operations
 */
class AdminController {
  constructor({ 
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
  async getDashboard(req, res) {
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
  async getUsers(req, res) {
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
  async createUser(req, res) {
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
  async getTelegramBots(req, res) {
    try {
      const { page = 1, limit = 10, search = '', isActive } = req.query
      const result = await this.telegramBotRepository.findAll({ 
        page: parseInt(page), 
        limit: parseInt(limit), 
        search,
        isActive: isActive ? isActive === 'true' : null
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
  async createTelegramBot(req, res) {
    try {
      const { name, botToken, webhookUrl, apiUrl } = req.body

      if (!name || !botToken) {
        return res.status(400).json({
          success: false,
          message: 'Name and bot token are required'
        })
      }

      const bot = await this.telegramBotRepository.create({
        name,
        botToken,
        webhookUrl,
        apiUrl: apiUrl || 'https://api.telegram.org',
        isActive: true,
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
   * Get chatwoot accounts
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getChatwootAccounts(req, res) {
    try {
      const { page = 1, limit = 10, search = '', isActive } = req.query
      const result = await this.chatwootAccountRepository.findAll({ 
        page: parseInt(page), 
        limit: parseInt(limit), 
        search,
        isActive: isActive ? isActive === 'true' : null
      })

      res.json({
        success: true,
        data: result
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
  async createChatwootAccount(req, res) {
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
        isActive: true,
        createdBy: req.user.userId
      })

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
   * Get dify apps
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getDifyApps(req, res) {
    try {
      const { page = 1, limit = 10, search = '', isActive } = req.query
      const result = await this.difyAppRepository.findAll({ 
        page: parseInt(page), 
        limit: parseInt(limit), 
        search,
        isActive: isActive ? isActive === 'true' : null
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
  async createDifyApp(req, res) {
    try {
      const { name, apiUrl, apiKey, appId, timeout } = req.body

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
        isActive: true,
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
}

module.exports = AdminController
