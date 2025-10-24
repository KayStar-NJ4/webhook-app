/**
 * Zalo Controller - Presentation layer
 * Handles Zalo-related HTTP requests (API + Admin CRUD)
 */
class ZaloController {
  constructor ({ zaloBotRepository, zaloService, configurationService, logger }) {
    this.zaloBotRepository = zaloBotRepository
    this.zaloService = zaloService
    this.configurationService = configurationService
    this.logger = logger
  }

  // ==================== ADMIN CRUD METHODS ====================

  async getAll (req, res) {
    try {
      const { page = 1, limit = 10, search = '', isActive, sort_by = 'created_at.desc' } = req.query
      const result = await this.zaloBotRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        isActive: isActive ? isActive === 'true' : null,
        sortBy: sort_by
      })

      res.json({ success: true, data: result })
    } catch (error) {
      this.logger.error('Get Zalo bots failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async create (req, res) {
    try {
      const { name, botToken, secretToken, isActive = true } = req.body

      if (!name || !botToken) {
        return res.status(400).json({ success: false, message: 'Name and bot token are required' })
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

      const bot = await this.zaloBotRepository.create({
        name, 
        botToken, 
        secretToken, 
        webhookUrl: null, // Will be set later when we know the bot ID
        apiUrl: 'https://bot-api.zapps.me', // Fixed API URL
        isActive,
        createdBy: req.user.userId
      })

      // Update webhook URL with bot ID
      const webhookUrl = `${appUrl}/webhook/zalo/${bot.id}`
      const updatedBot = await this.zaloBotRepository.update(bot.id, { webhookUrl })

      // Try to set webhook automatically
      try {
        await this.zaloService.setWebhookForBot(botToken, webhookUrl, secretToken)
        this.logger.info('Webhook set successfully for Zalo bot', { botId: bot.id })
      } catch (webhookError) {
        this.logger.warn('Failed to set webhook automatically', { 
          botId: bot.id, 
          error: webhookError.message 
        })
        // Don't fail the bot creation if webhook setup fails
      }

      res.status(201).json({ 
        success: true, 
        message: 'Zalo bot created successfully', 
        data: updatedBot
      })
    } catch (error) {
      this.logger.error('Create Zalo bot failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async getById (req, res) {
    try {
      const { id } = req.params
      const bot = await this.zaloBotRepository.findById(id)

      if (!bot) {
        return res.status(404).json({ success: false, message: 'Zalo bot not found' })
      }

      res.json({ success: true, data: bot })
    } catch (error) {
      this.logger.error('Get Zalo bot by ID failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async update (req, res) {
    try {
      const { id } = req.params
      const { name, botToken, isActive, secretToken } = req.body

      // Don't allow changing apiUrl and webhookUrl - they're auto-managed
      const bot = await this.zaloBotRepository.update(id, {
        name, botToken, isActive, secretToken
      })

      res.json({ success: true, message: 'Zalo bot updated successfully', data: bot })
    } catch (error) {
      this.logger.error('Update Zalo bot failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async delete (req, res) {
    try {
      const { id } = req.params
      const deleted = await this.zaloBotRepository.delete(id)

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Zalo bot not found' })
      }

      res.json({ success: true, message: 'Zalo bot deleted successfully' })
    } catch (error) {
      this.logger.error('Delete Zalo bot failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async getActive (req, res) {
    try {
      const bots = await this.zaloBotRepository.findActive()
      res.json({ success: true, data: bots })
    } catch (error) {
      this.logger.error('Get active Zalo bots failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async testConnection (req, res) {
    try {
      const { id } = req.params

      const bot = await this.zaloBotRepository.findById(id)
      if (!bot) {
        return res.status(404).json({ success: false, message: 'Zalo bot not found' })
      }

      const originalConfig = {
        botToken: this.zaloService.botToken,
        apiUrl: this.zaloService.apiUrl
      }

      this.zaloService.botToken = bot.bot_token
      // Zalo API URL format: https://bot-api.zapps.me/bot{token}
      const baseUrl = bot.api_url || 'https://bot-api.zapps.me'
      this.zaloService.apiUrl = `${baseUrl}/bot${bot.bot_token}`

      try {
        const result = await this.zaloService.getBotInfo()
        
        if (!result) {
          return res.json({ success: false, data: { connected: false, message: 'Bot token invalid', botInfo: null } })
        }

        // Generate webhook URL (don't actually set it since Zalo requires manual setup)
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
          webhookUrl = `${appUrl}/webhook/zalo/${bot.id}`
        } catch (webhookErr) {
          this.logger.error('Error generating webhook URL', { botId: bot.id, error: webhookErr.message })
        }

        // Try to set webhook automatically
        let webhookSetResult = null
        if (webhookUrl) {
          try {
            webhookSetResult = await this.zaloService.setWebhookForBot(bot.bot_token, webhookUrl, bot.secret_token)
            
            // Check if webhook was actually set successfully
            if (webhookSetResult.ok !== false) {
              this.logger.info('Webhook set successfully during test', { botId: bot.id })
            } else {
              this.logger.warn('Webhook set failed during test', { 
                botId: bot.id, 
                error: webhookSetResult.description,
                errorCode: webhookSetResult.error_code
              })
            }
          } catch (webhookError) {
            this.logger.warn('Failed to set webhook during test', { 
              botId: bot.id, 
              error: webhookError.message 
            })
          }
        }

        const webhookSuccess = webhookSetResult && webhookSetResult.ok !== false
        
        res.json({ 
          success: true, 
          data: { 
            connected: true, 
            message: webhookSuccess ? 'Bot token valid and webhook configured successfully' : (webhookSetResult ? `Bot token valid but webhook setup failed: ${webhookSetResult.description}` : 'Bot token is valid. Please configure webhook manually in Zalo Bot Platform.'), 
            botInfo: result, 
            webhookConfigured: webhookSuccess, 
            webhookUrl,
            webhookResult: webhookSetResult,
            note: webhookSuccess ? 'Webhook configured successfully. Try sending a message to the bot.' : (webhookSetResult ? 'Please check secret token format (only A-Z, a-z, 0-9, _, - allowed)' : 'Zalo Bot Platform requires manual webhook configuration through their dashboard')
          } 
        })
      } finally {
        this.zaloService.botToken = originalConfig.botToken
        this.zaloService.apiUrl = originalConfig.apiUrl
      }
    } catch (error) {
      this.logger.error('Test Zalo bot connection failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Connection test failed: ' + error.message })
    }
  }

  // ==================== API METHODS ====================

  /**
   * Setup Zalo webhook
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

      this.logger.info('Setting up Zalo webhook', { webhookUrl, hasBotToken: !!botToken })

      let result
      if (botToken) {
        result = await this.zaloService.setWebhookForBot(botToken, webhookUrl, secretToken)
      } else {
        result = await this.zaloService.setWebhook(webhookUrl)
      }

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      this.logger.error('Failed to setup Zalo webhook', {
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
      const results = await this.zaloService.setWebhookForAllBots(baseUrl)
      res.status(200).json({ success: true, data: results })
    } catch (error) {
      this.logger.error('Failed to setup all Zalo webhooks', { error: error.message })
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
      this.logger.info('Getting Zalo webhook info')

      const result = await this.zaloService.getWebhookInfo()

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      this.logger.error('Failed to get Zalo webhook info', {
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
      this.logger.info('Deleting Zalo webhook')

      const result = await this.zaloService.deleteWebhook()

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      this.logger.error('Failed to delete Zalo webhook', {
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
      this.logger.info('Getting Zalo bot info')

      const result = await this.zaloService.getBotInfo()

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      this.logger.error('Failed to get Zalo bot info', {
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

      this.logger.info('Testing Zalo message', { chatId, message })

      const result = await this.zaloService.sendMessage(chatId, message)

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      this.logger.error('Failed to test Zalo message', {
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

module.exports = ZaloController

