/**
 * Web Controller - Presentation layer
 * Handles web platform webhook requests + Admin CRUD
 * Note: messageBrokerService and webService are optional (only needed for webhook handling)
 */
class WebController {
  constructor ({ messageBrokerService = null, webAppRepository, webConversationRepository, webMessageRepository, webService = null, logger }) {
    this.messageBrokerService = messageBrokerService
    this.webAppRepository = webAppRepository
    this.webConversationRepository = webConversationRepository
    this.webMessageRepository = webMessageRepository
    this.webService = webService
    this.logger = logger
  }

  // ==================== ADMIN CRUD METHODS ====================

  async getAll (req, res) {
    try {
      const { page = 1, limit = 10, search = '', isActive, sort_by = 'created_at.desc' } = req.query
      const result = await this.webAppRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        isActive: isActive ? isActive === 'true' : null,
        sortBy: sort_by
      })

      res.json({ success: true, data: result })
    } catch (error) {
      this.logger.error('Get web apps failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async create (req, res) {
    try {
      const { name, domain, apiKey, isActive = true } = req.body

      if (!name || !domain) {
        return res.status(400).json({ success: false, message: 'Name and domain are required' })
      }

      const { randomUUID } = require('crypto')
      const generatedApiKey = apiKey || `web_${randomUUID()}`

      const app = await this.webAppRepository.create({
        name, domain,
        apiKey: generatedApiKey,
        isActive,
        createdBy: req.user?.id
      })

      res.json({ success: true, message: 'Web app created successfully', data: app })
    } catch (error) {
      this.logger.error('Create web app failed', { error: error.message })
      
      if (error.message.includes('duplicate') || error.code === '23505') {
        return res.status(409).json({ success: false, message: 'Web app with this API key already exists' })
      }

      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async update (req, res) {
    try {
      const { id } = req.params
      const { name, domain, apiKey, isActive } = req.body

      const updateData = {}
      if (name !== undefined) updateData.name = name
      if (domain !== undefined) updateData.domain = domain
      if (apiKey !== undefined && apiKey) updateData.apiKey = apiKey
      if (isActive !== undefined) updateData.isActive = Boolean(isActive)

      const app = await this.webAppRepository.update(id, updateData)

      res.json({ success: true, message: 'Web app updated successfully', data: app })
    } catch (error) {
      this.logger.error('Update web app failed', { error: error.message })
      
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, message: 'Web app not found' })
      }

      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async delete (req, res) {
    try {
      const { id } = req.params
      const deleted = await this.webAppRepository.delete(id)

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Web app not found' })
      }

      res.json({ success: true, message: 'Web app deleted successfully' })
    } catch (error) {
      this.logger.error('Delete web app failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async getById (req, res) {
    try {
      const { id } = req.params
      const app = await this.webAppRepository.findById(id)

      if (!app) {
        return res.status(404).json({ success: false, message: 'Web app not found' })
      }

      res.json({ success: true, data: app })
    } catch (error) {
      this.logger.error('Get web app by ID failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async getActive (req, res) {
    try {
      const apps = await this.webAppRepository.findActive()
      res.json({ success: true, data: apps })
    } catch (error) {
      this.logger.error('Get active web apps failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async getStatistics (req, res) {
    try {
      const { id } = req.params
      const stats = await this.webAppRepository.getStatistics(id)
      res.json({ success: true, data: stats })
    } catch (error) {
      this.logger.error('Get web app statistics failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  async getConversations (req, res) {
    try {
      const { id } = req.params
      const { page = 1, limit = 10, status } = req.query

      const result = await this.webConversationRepository.findByWebAppId(id, {
        page: parseInt(page),
        limit: parseInt(limit),
        status
      })

      res.json({ success: true, data: result })
    } catch (error) {
      this.logger.error('Get web app conversations failed', { error: error.message })
      res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  // ==================== WEBHOOK METHODS ====================

  /**
   * Handle incoming message from web client (webhook style)
   * POST /webhook/web
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async handleMessage (req, res) {
    try {
      const { apiKey, sessionId, content, userInfo } = req.body

      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: 'API key is required'
        })
      }

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID is required'
        })
      }

      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Message content is required'
        })
      }

      this.logger.info('Received web webhook', {
        sessionId,
        contentLength: content.length,
        hasUserInfo: !!userInfo
      })

      // Validate API key and get web app
      const webApp = await this.webAppRepository.findByApiKey(apiKey)
      if (!webApp) {
        return res.status(401).json({
          success: false,
          error: 'Invalid API key'
        })
      }

      if (!webApp.is_active) {
        return res.status(403).json({
          success: false,
          error: 'Web app is not active'
        })
      }

      // No need to validate origin - CORS is handled by Server middleware

      // Get or create conversation
      let conversation = await this.webConversationRepository.findBySessionId(sessionId, webApp.id)
      if (!conversation) {
        conversation = await this.webConversationRepository.create({
          webAppId: webApp.id,
          sessionId,
          userIdentifier: userInfo?.identifier || `anonymous_${sessionId}`,
          userName: userInfo?.name,
          userEmail: userInfo?.email,
          userMetadata: {
            browser: userInfo?.platform,
            language: userInfo?.language,
            referrer: userInfo?.referrer,
            userAgent: userInfo?.userAgent
          }
        })
      }

      // Prepare webhook data
      const webData = {
        apiKey,
        sessionId,
        content,
        userInfo,
        webAppId: webApp.id,
        webConversationId: conversation.id // Database ID from web_conversations
      }

      // Process through MessageBroker (like Telegram webhook)
      if (!this.messageBrokerService) {
        return res.status(500).json({
          success: false,
          error: 'MessageBroker service not initialized'
        })
      }

      const result = await this.messageBrokerService.handleWebWebhook(webData)

      res.json(result)
    } catch (error) {
      this.logger.error('Failed to handle web webhook', {
        error: error.message,
        stack: error.stack,
        sessionId: req.body?.sessionId
      })

      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      })
    }
  }

  /**
   * Get conversation history
   * GET /webhook/web/history/:sessionId
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getHistory (req, res) {
    try {
      const { sessionId } = req.params
      const { apiKey } = req.query

      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: 'API key is required'
        })
      }

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID is required'
        })
      }

      // Validate API key
      const webApp = await this.webAppRepository.findByApiKey(apiKey)
      if (!webApp) {
        return res.status(401).json({
          success: false,
          error: 'Invalid API key'
        })
      }

      // Get web conversation
      const conversation = await this.webConversationRepository.findBySessionId(sessionId, webApp.id)
      if (!conversation) {
        return res.json({
          success: true,
          data: {
            messages: [],
            sessionId
          }
        })
      }

      // Get all messages including agent messages
      const messages = await this.webMessageRepository.findByConversationId(
        conversation.id,
        { limit: 100, order: 'ASC' }
      )

      res.json({
        success: true,
        data: {
          messages: messages.map(msg => ({
            id: msg.id,
            content: msg.content,
            messageType: msg.message_type,
            createdAt: msg.created_at
          })),
          sessionId
        }
      })
    } catch (error) {
      this.logger.error('Failed to get conversation history', {
        error: error.message,
        sessionId: req.params?.sessionId
      })

      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      })
    }
  }

  /**
   * Health check endpoint
   * GET /webhook/web/health
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async healthCheck (req, res) {
    try {
      const activeApps = await this.webAppRepository.findActive()

      res.json({
        success: true,
        data: {
          status: 'healthy',
          activeWebApps: activeApps.length,
          timestamp: new Date().toISOString()
        }
      })
    } catch (error) {
      this.logger.error('Health check failed', { error: error.message })

      res.status(500).json({
        success: false,
        error: 'Service unavailable'
      })
    }
  }

  /**
   * Test web app configuration
   * GET /webhook/web/test/:appId
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async testConfiguration (req, res) {
    try {
      const { appId } = req.params

      const result = await this.webService.testWebAppConfiguration(parseInt(appId))

      res.json(result)
    } catch (error) {
      this.logger.error('Failed to test configuration', {
        error: error.message,
        appId: req.params?.appId
      })

      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      })
    }
  }
}

module.exports = WebController
