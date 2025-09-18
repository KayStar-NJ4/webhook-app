const axios = require('axios')

/**
 * Dify Service - Infrastructure layer
 * Handles communication with Dify AI API
 */
class DifyService {
  constructor ({ config, configurationService, difyAppRepository, logger }) {
    this.config = config
    this.configurationService = configurationService
    this.difyAppRepository = difyAppRepository
    this.logger = logger

    this.apiUrl = null
    this.apiKey = null
    this.appId = null
    this.timeout = 30000

    // Config mặc định (có thể override từ config)
    this.settings = {
      simpleGreetingMaxLength: 80,
      maxResponseLength: 1000
    }
  }

  /**
   * Initialize service - no global config, will be set per request
   */
  async initialize () {
    this.logger.info('Dify service initialized (per-request configuration)')
  }

  /**
   * Initialize service with specific Dify app ID
   * @param {number} difyAppId - Dify app ID
   */
  async initializeWithAppId (difyAppId) {
    try {
      const difyApp = await this.difyAppRepository.findById(difyAppId)
      if (!difyApp) throw new Error(`Dify app with ID ${difyAppId} not found`)

      this.apiUrl = difyApp.api_url
      this.apiKey = difyApp.api_key
      this.appId = difyApp.app_id
      this.timeout = difyApp.timeout || 30000

      this.logger.info('Dify service initialized with specific app', {
        difyAppId,
        apiUrl: this.apiUrl,
        appId: this.appId
      })
    } catch (error) {
      this.logger.error('Failed to initialize Dify service with app ID', {
        error: error.message,
        stack: error.stack,
        difyAppId
      })
      throw error
    }
  }

  getHeaders () {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    }
  }

  /**
   * Send message to Dify
   */
  async sendMessage (conversation, content, options = {}) {
    try {
      if (options.difyAppId) {
        await this.initializeWithAppId(options.difyAppId)
      } else if (!this.apiUrl || !this.apiKey || !this.appId) {
        await this.initialize()
      }

      if (!this.apiUrl || !this.apiKey || !this.appId) {
        throw new Error('Dify service not properly initialized. Missing apiUrl, apiKey, or appId.')
      }

      this.logger.info('Sending message to Dify', {
        conversationId: conversation?.id,
        content: content.substring(0, 50),
        difyId: conversation?.difyId
      })

      // Use conversation_id from Dify to maintain conversation context
      const payload = {
        inputs: {},
        query: content,
        response_mode: 'blocking',
        user: `user-${conversation?.id || 'new'}` // Use database conversation ID as user ID
      }

      // Add conversation_id if we have one from previous Dify responses
      if (conversation?.difyId) {
        payload.conversation_id = conversation.difyId
        this.logger.info('Using existing Dify conversation_id', {
          difyConversationId: conversation.difyId
        })
      } else {
        this.logger.info('Starting new Dify conversation')
      }

      this.logger.info('Dify API payload', {
        hasConversationId: !!payload.conversation_id,
        user: payload.user,
        mode: payload.conversation_id ? 'CONTINUOUS' : 'NEW'
      })

      const response = await axios.post(
        `${this.apiUrl}/v1/chat-messages`,
        payload,
        { headers: this.getHeaders(), timeout: this.timeout }
      )

      // Log the response for debugging
      this.logger.info('Dify API response', {
        status: response.status,
        hasAnswer: !!response.data.answer,
        conversation_id: response.data.conversation_id
      })

      // Check if the response indicates an error
      if (response.data.error) {
        this.logger.error('Dify API returned error', {
          error: response.data.error,
          conversationId: conversation?.id,
          conversation_id: conversation?.id
        })
        throw new Error(`Dify API error: ${response.data.error}`)
      }

      let responseText = response.data.answer || ''

      // Nếu là array → lấy phần tử đầu tiên
      if (Array.isArray(responseText)) {
        this.logger.warn('Dify returned multiple responses, taking first only', {
          count: responseText.length,
          first: responseText[0]?.substring(0, 100)
        })
        responseText = responseText[0] || ''
      }

      responseText = String(responseText)

      // Log the response details
      this.logger.info('Dify response processed', {
        responseLength: responseText.length,
        conversation_id: response.data.conversation_id
      })

      // If response is empty or null, provide a default response
      if (!responseText || responseText.trim() === '') {
        this.logger.warn('Dify returned empty response, using default', {
          originalAnswer: response.data.answer,
          conversationId: response.data.conversation_id,
          conversation_id: conversation?.id
        })
        responseText = 'Xin lỗi, tôi không thể xử lý tin nhắn này lúc này. Vui lòng thử lại sau.'
      }

      // Get conversation_id from Dify API response (this is the correct one to use)
      const difyConversationId = response.data.conversation_id || `fallback-${Date.now()}`

      this.logger.info('Dify conversation_id', {
        difyConversationId
      })

      const result = {
        conversationId: difyConversationId, // This is the Dify conversation_id
        response: responseText,
        metadata: {
          messageId: response.data.id,
          usage: response.data.metadata?.usage,
          originalLength: response.data.answer?.length,
          truncated: response.data.answer?.length > this.settings.maxResponseLength,
          fullResponse: response.data,
          responseType: typeof response.data.answer,
          hasMultipleAnswers: Array.isArray(response.data.answer)
        }
      }

      this.logger.info('Dify processing completed', {
        conversationId: result.conversationId,
        responseLength: result.response?.length || 0
      })

      return result
    } catch (error) {
      this.logger.error('Failed to send message to Dify', {
        error: error.message,
        conversationId: conversation?.id
      })
      throw new Error(`Dify API error: ${error.message}`)
    }
  }

  // === HISTORY / INFO / RENAME / DELETE ===
  async getConversationHistory (conversationId, options = {}) {
    try {
      const params = new URLSearchParams({ conversation_id: conversationId, ...options })
      const res = await axios.get(`${this.apiUrl}/v1/messages?${params}`, {
        headers: this.getHeaders()
      })
      return res.data
    } catch (error) {
      this.logger.error('Failed to get Dify conversation history', {
        error: error.message,
        stack: error.stack,
        conversationId
      })
      throw new Error(`Get conversation history failed: ${error.message}`)
    }
  }

  async getConversationInfo (conversationId) {
    try {
      const res = await axios.get(`${this.apiUrl}/v1/conversations/${conversationId}`, {
        headers: this.getHeaders()
      })
      return res.data
    } catch (error) {
      this.logger.error('Failed to get Dify conversation info', {
        error: error.message,
        stack: error.stack,
        conversationId
      })
      throw new Error(`Get conversation info failed: ${error.message}`)
    }
  }

  async renameConversation (conversationId, name) {
    try {
      const res = await axios.post(
        `${this.apiUrl}/v1/conversations/${conversationId}/name`,
        { name },
        { headers: this.getHeaders() }
      )
      this.logger.info('Conversation renamed', { conversationId, name })
      return res.data
    } catch (error) {
      this.logger.error('Failed to rename Dify conversation', {
        error: error.message,
        stack: error.stack,
        conversationId,
        name
      })
      throw new Error(`Rename failed: ${error.message}`)
    }
  }

  async deleteConversation (conversationId) {
    try {
      const res = await axios.delete(`${this.apiUrl}/v1/conversations/${conversationId}`, {
        headers: this.getHeaders()
      })
      this.logger.info('Conversation deleted', { conversationId })
      return res.data
    } catch (error) {
      this.logger.error('Failed to delete Dify conversation', {
        error: error.message,
        stack: error.stack,
        conversationId
      })
      throw new Error(`Delete failed: ${error.message}`)
    }
  }

  async testConnection () {
    try {
      if (!this.apiUrl || !this.apiKey || !this.appId) {
        this.logger.info('Dify service not configured, skip connection test')
        return true
      }
      const res = await axios.get(`${this.apiUrl}/v1/parameters`, {
        headers: this.getHeaders()
      })
      return res.status === 200
    } catch (error) {
      this.logger.warn('Dify API connection test failed', { error: error.message })
      return false
    }
  }
}

module.exports = DifyService
