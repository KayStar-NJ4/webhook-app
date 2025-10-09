/**
 * Web Service - Infrastructure layer
 * Handles web platform message processing and integration with Chatwoot/Dify
 */
class WebService {
  constructor ({
    webAppRepository,
    webConversationRepository,
    webMessageRepository,
    platformMappingService,
    chatwootService,
    difyService,
    logger
  }) {
    this.webAppRepository = webAppRepository
    this.webConversationRepository = webConversationRepository
    this.webMessageRepository = webMessageRepository
    this.platformMappingService = platformMappingService
    this.chatwootService = chatwootService
    this.difyService = difyService
    this.logger = logger
  }

  /**
   * Initialize service
   */
  async initialize () {
    this.logger.info('Web service initialized')
  }

  /**
   * Process incoming message from web client
   * @param {Object} messageData - Message data from web client
   * @returns {Promise<Object>} - Response from Dify or Chatwoot
   */
  async processMessage (messageData) {
    try {
      const { apiKey, sessionId, content, userInfo = {} } = messageData

      // Validate API key and get web app
      const webApp = await this.webAppRepository.findByApiKey(apiKey)
      if (!webApp) {
        throw new Error('Invalid API key')
      }

      if (!webApp.is_active) {
        throw new Error('Web app is not active')
      }

      this.logger.info('Processing web message', {
        webAppId: webApp.id,
        sessionId,
        contentLength: content.length
      })

      // Get or create conversation
      let conversation = await this.webConversationRepository.findBySessionId(sessionId, webApp.id)

      if (!conversation) {
        conversation = await this.webConversationRepository.create({
          webAppId: webApp.id,
          sessionId,
          userIdentifier: userInfo.identifier || `anonymous_${sessionId}`,
          userName: userInfo.name,
          userEmail: userInfo.email,
          userMetadata: {
            browser: userInfo.browser,
            platform: userInfo.platform,
            language: userInfo.language,
            referrer: userInfo.referrer,
            ip: userInfo.ip
          }
        })

        this.logger.info('Created new web conversation', {
          conversationId: conversation.id,
          sessionId
        })
      }

      // Save user message
      await this.webMessageRepository.create({
        webConversationId: conversation.id,
        content,
        messageType: 'user'
      })

      // Get platform mapping for this web app
      const mapping = await this.platformMappingService.findBySourcePlatform(
        'web',
        webApp.id
      )

      let response = null

      if (mapping && mapping.dify_app_id) {
        // Send to Dify
        response = await this.sendToDify(conversation, content, mapping.dify_app_id)
      } else {
        // Default response if no mapping
        response = {
          response: 'Xin chào! Tôi là chatbot hỗ trợ. Bạn cần giúp đỡ gì?',
          conversationId: conversation.dify_conversation_id
        }
      }

      // Save bot response
      await this.webMessageRepository.create({
        webConversationId: conversation.id,
        content: response.response,
        messageType: 'bot',
        difyMessageId: response.metadata?.messageId
      })

      // Update conversation last message time
      await this.webConversationRepository.update(conversation.id, {
        lastMessageAt: new Date(),
        difyConversationId: response.conversationId
      })

      // If there's Chatwoot mapping, sync to Chatwoot
      if (mapping && mapping.chatwoot_account_id) {
        await this.syncToChatwoot(conversation, content, response.response, mapping)
      }

      return {
        success: true,
        data: {
          response: response.response,
          conversationId: conversation.id,
          sessionId: conversation.session_id,
          metadata: response.metadata
        }
      }
    } catch (error) {
      this.logger.error('Failed to process web message', {
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }

  /**
   * Send message to Dify
   * @param {Object} conversation - Web conversation
   * @param {string} content - Message content
   * @param {number} difyAppId - Dify app ID
   * @returns {Promise<Object>} - Dify response
   */
  async sendToDify (conversation, content, difyAppId) {
    try {
      this.logger.info('Sending message to Dify', {
        conversationId: conversation.id,
        difyAppId
      })

      const difyResponse = await this.difyService.sendMessage(
        {
          id: conversation.id,
          difyId: conversation.dify_conversation_id
        },
        content,
        { difyAppId }
      )

      this.logger.info('Received response from Dify', {
        conversationId: conversation.id,
        difyConversationId: difyResponse.conversationId
      })

      return difyResponse
    } catch (error) {
      this.logger.error('Failed to send message to Dify', {
        error: error.message,
        conversationId: conversation.id
      })

      // Return fallback response
      return {
        response: 'Xin lỗi, hiện tại hệ thống đang bận. Vui lòng thử lại sau.',
        conversationId: conversation.dify_conversation_id,
        metadata: { error: true }
      }
    }
  }

  /**
   * Sync conversation to Chatwoot
   * @param {Object} conversation - Web conversation
   * @param {string} userMessage - User message
   * @param {string} botResponse - Bot response
   * @param {Object} mapping - Platform mapping
   */
  async syncToChatwoot (conversation, userMessage, botResponse, mapping) {
    try {
      this.logger.info('Syncing to Chatwoot', {
        conversationId: conversation.id,
        chatwootAccountId: mapping.chatwoot_account_id
      })

      // Initialize Chatwoot service with account
      await this.chatwootService.initializeWithAccountId(mapping.chatwoot_account_id)

      // Create or get Chatwoot conversation
      if (!conversation.chatwoot_conversation_id) {
        // Create contact first
        const contact = await this.chatwootService.createContact({
          name: conversation.user_name || conversation.user_identifier,
          email: conversation.user_email,
          identifier: conversation.user_identifier,
          custom_attributes: conversation.user_metadata
        })

        // Create conversation
        const chatwootConv = await this.chatwootService.createConversation({
          contact_id: contact.id,
          inbox_id: mapping.chatwoot_inbox_id,
          status: 'open',
          custom_attributes: {
            web_app_id: conversation.web_app_id,
            session_id: conversation.session_id
          }
        })

        // Update web conversation with Chatwoot IDs
        await this.webConversationRepository.update(conversation.id, {
          chatwootConversationId: chatwootConv.id,
          chatwootContactId: contact.id
        })

        conversation.chatwoot_conversation_id = chatwootConv.id
      }

      // Send messages to Chatwoot
      await this.chatwootService.sendMessage(
        conversation.chatwoot_conversation_id,
        userMessage,
        'incoming'
      )

      await this.chatwootService.sendMessage(
        conversation.chatwoot_conversation_id,
        botResponse,
        'outgoing',
        { private: false, message_type: 'bot' }
      )

      this.logger.info('Synced to Chatwoot successfully', {
        conversationId: conversation.id,
        chatwootConversationId: conversation.chatwoot_conversation_id
      })
    } catch (error) {
      this.logger.error('Failed to sync to Chatwoot', {
        error: error.message,
        conversationId: conversation.id
      })
      // Don't throw - continue even if Chatwoot sync fails
    }
  }

  /**
   * Get conversation history
   * @param {string} sessionId - Session ID
   * @param {string} apiKey - API key
   * @returns {Promise<Array>} - Message history
   */
  async getConversationHistory (sessionId, apiKey) {
    try {
      const webApp = await this.webAppRepository.findByApiKey(apiKey)
      if (!webApp) {
        throw new Error('Invalid API key')
      }

      const conversation = await this.webConversationRepository.findBySessionId(
        sessionId,
        webApp.id
      )

      if (!conversation) {
        return []
      }

      const messages = await this.webMessageRepository.findByConversationId(
        conversation.id,
        { limit: 100, order: 'ASC' }
      )

      return messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        messageType: msg.message_type,
        createdAt: msg.created_at
      }))
    } catch (error) {
      this.logger.error('Failed to get conversation history', {
        error: error.message,
        sessionId
      })
      throw error
    }
  }

  /**
   * Validate origin against allowed origins
   * @param {string} origin - Request origin
   * @param {Object} webApp - Web app
   * @returns {boolean} - Valid or not
   */
  validateOrigin (origin, webApp) {
    if (!webApp.allowed_origins || webApp.allowed_origins.length === 0) {
      return true // Allow all if not configured
    }

    return webApp.allowed_origins.includes(origin) ||
           webApp.allowed_origins.includes('*')
  }

  /**
   * Test web app configuration
   * @param {number} webAppId - Web app ID
   * @returns {Promise<Object>} - Test result
   */
  async testWebAppConfiguration (webAppId) {
    try {
      const webApp = await this.webAppRepository.findById(webAppId)
      if (!webApp) {
        return { success: false, error: 'Web app not found' }
      }

      const mapping = await this.platformMappingService.findBySourcePlatform(
        'web',
        webApp.id
      )

      const result = {
        webApp: {
          id: webApp.id,
          name: webApp.name,
          domain: webApp.domain,
          isActive: webApp.is_active
        },
        mapping: mapping ? {
          hasDify: !!mapping.dify_app_id,
          hasChatwoot: !!mapping.chatwoot_account_id
        } : null,
        tests: {
          webAppActive: webApp.is_active,
          hasPlatformMapping: !!mapping,
          canSendToDify: !!(mapping && mapping.dify_app_id),
          canSendToChatwoot: !!(mapping && mapping.chatwoot_account_id)
        }
      }

      return { success: true, data: result }
    } catch (error) {
      this.logger.error('Failed to test web app configuration', {
        error: error.message,
        webAppId
      })
      return { success: false, error: error.message }
    }
  }
}

module.exports = WebService
