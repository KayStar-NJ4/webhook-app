/**
 * Telegram Controller - Presentation layer
 * Handles Telegram-related HTTP requests (API + Admin CRUD)
 */
class TelegramController {
  constructor ({ telegramBotRepository, telegramService, configurationService, logger }) {
    this.telegramBotRepository = telegramBotRepository
    this.telegramService = telegramService
    this.configurationService = configurationService
    this.logger = logger
  }

  // ==================== ADMIN CRUD METHODS ====================

  async getAll (req, res) {
    try {
      const { page = 1, limit = 10, search = '', isActive, sort_by = 'created_at.desc' } = req.query
      const result = await this.telegramBotRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        isActive: isActive ? isActive === 'true' : null,
        sortBy: sort_by
      })

      res.json({ success: true, data: result })
    } catch (error) {
      this.logger.error('Get telegram bots failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async create (req, res) {
    try {
      const { name, botToken, secretToken, webhookUrl, apiUrl, isActive = true, botUsername } = req.body

      if (!name || !botToken) {
        return res.status(400).json({ success: false, message: 'Name and bot token are required' })
      }

      const bot = await this.telegramBotRepository.create({
        name, botToken, secretToken, botUsername, webhookUrl,
        apiUrl: apiUrl || 'https://api.telegram.org',
        isActive,
        createdBy: req.user.userId
      })

      res.status(201).json({ success: true, message: 'Telegram bot created successfully', data: bot })
    } catch (error) {
      this.logger.error('Create telegram bot failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async getById (req, res) {
    try {
      const { id } = req.params
      const bot = await this.telegramBotRepository.findById(id)

      if (!bot) {
        return res.status(404).json({ success: false, message: 'Telegram bot not found' })
      }

      const mappings = await this.telegramBotRepository.getMappings(id)

      res.json({ success: true, data: { ...bot, mappings } })
    } catch (error) {
      this.logger.error('Get telegram bot by ID failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async update (req, res) {
    try {
      const { id } = req.params
      const { name, botToken, webhookUrl, apiUrl, isActive, secretToken, botUsername } = req.body

      const bot = await this.telegramBotRepository.update(id, {
        name, botToken, webhookUrl, apiUrl, isActive, secretToken, botUsername
      })

      res.json({ success: true, message: 'Telegram bot updated successfully', data: bot })
    } catch (error) {
      this.logger.error('Update telegram bot failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async delete (req, res) {
    try {
      const { id } = req.params
      const deleted = await this.telegramBotRepository.delete(id)

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Telegram bot not found' })
      }

      res.json({ success: true, message: 'Telegram bot deleted successfully' })
    } catch (error) {
      this.logger.error('Delete telegram bot failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async getActive (req, res) {
    try {
      const bots = await this.telegramBotRepository.findActive()
      res.json({ success: true, data: bots })
    } catch (error) {
      this.logger.error('Get active telegram bots failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async testConnection (req, res) {
    try {
      const { id } = req.params

      const bot = await this.telegramBotRepository.findById(id)
      if (!bot) {
        return res.status(404).json({ success: false, message: 'Telegram bot not found' })
      }

      const originalConfig = {
        botToken: this.telegramService.botToken,
        apiUrl: this.telegramService.apiUrl
      }

      this.telegramService.botToken = bot.bot_token
      this.telegramService.apiUrl = `https://api.telegram.org/bot${bot.bot_token}`

      try {
        const result = await this.telegramService.getBotInfo()
        
        if (!result) {
          return res.json({ success: false, data: { connected: false, message: 'Connection failed', botInfo: null } })
        }

        let webhookConfigured = false
        let webhookUrl = null

        try {
          const axios = require('axios')
          let appUrl = process.env.APP_URL
          if (!appUrl) {
            try {
              appUrl = await this.configurationService.get('app_url')
            } catch (configError) {
              // Ignore error - will use default APP_URL below
            }
          }
          
          appUrl = appUrl || 'https://webhook-bot.turbo.vn'
          webhookUrl = `${appUrl}/webhook/telegram/${bot.id}`
          
          const webhookResponse = await axios.post(`https://api.telegram.org/bot${bot.bot_token}/setWebhook`, {
            url: webhookUrl,
            allowed_updates: ['message']
          }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          })

          if (webhookResponse.data.ok) {
            webhookConfigured = true
          }
        } catch (webhookErr) {
          this.logger.error('Error setting Telegram webhook', { botId: bot.id, error: webhookErr.message })
        }

        res.json({ success: true, data: { connected: true, message: webhookConfigured ? 'Connection successful and webhook configured' : 'Connection successful but webhook setup failed', botInfo: result, webhookConfigured, webhookUrl } })
      } finally {
        this.telegramService.botToken = originalConfig.botToken
        this.telegramService.apiUrl = originalConfig.apiUrl
      }
    } catch (error) {
      this.logger.error('Test Telegram bot connection failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Connection test failed: ' + error.message })
    }
  }

  // ==================== API METHODS ====================

  /**
   * Setup Telegram webhook
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async setupWebhook (req, res) {
    try {
      const { webhookUrl, botToken, secretToken } = req.body

      if (!webhookUrl) {
        return res.status(400).json({
          success: false,
          error: 'webhookUrl is required'
        })
      }

      this.logger.info('Setting up Telegram webhook', { webhookUrl, hasBotToken: !!botToken })

      let result
      if (botToken) {
        result = await this.telegramService.setWebhookForBot(botToken, webhookUrl, secretToken)
      } else {
        result = await this.telegramService.setWebhook(webhookUrl)
      }

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      this.logger.error('Failed to setup Telegram webhook', {
        error: error.message,
        body: req.body
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * Setup webhooks for all active bots using base URL
   */
  async setupAllWebhooks (req, res) {
    try {
      const { webhookUrl } = req.body
      if (!webhookUrl) {
        return res.status(400).json({ success: false, error: 'webhookUrl is required' })
      }
      const baseUrl = webhookUrl.replace(/\/$/, '')
      const results = await this.telegramService.setWebhookForAllBots(baseUrl)
      res.status(200).json({ success: true, data: results })
    } catch (error) {
      this.logger.error('Failed to setup all Telegram webhooks', { error: error.message })
      res.status(500).json({ success: false, error: error.message })
    }
  }

  /**
   * Get webhook info
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getWebhookInfo (req, res) {
    try {
      this.logger.info('Getting Telegram webhook info')

      const result = await this.telegramService.getWebhookInfo()

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      this.logger.error('Failed to get Telegram webhook info', {
        error: error.message
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * Delete webhook
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async deleteWebhook (req, res) {
    try {
      this.logger.info('Deleting Telegram webhook')

      const result = await this.telegramService.deleteWebhook()

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      this.logger.error('Failed to delete Telegram webhook', {
        error: error.message
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * Get bot info
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getBotInfo (req, res) {
    try {
      this.logger.info('Getting Telegram bot info')

      const result = await this.telegramService.getBotInfo()

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      this.logger.error('Failed to get Telegram bot info', {
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
      const { chatId, message } = req.body

      if (!chatId || !message) {
        return res.status(400).json({
          success: false,
          error: 'chatId and message are required'
        })
      }

      this.logger.info('Testing Telegram message', { chatId, message })

      const result = await this.telegramService.sendMessage(chatId, message)

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      this.logger.error('Failed to test Telegram message', {
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

module.exports = TelegramController
