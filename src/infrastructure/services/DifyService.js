const axios = require('axios')

/**
 * Dify Service - Infrastructure layer
 * Handles communication with Dify AI API
 */
class DifyService {
  constructor({ config, configurationService, logger }) {
    this.config = config
    this.configurationService = configurationService
    this.logger = logger
    this.apiUrl = null
    this.apiKey = null
    this.appId = null
    this.timeout = 30000
  }

  /**
   * Initialize service with configuration from database
   */
  async initialize() {
    try {
      this.apiUrl = await this.configurationService.get('dify.apiUrl')
      this.apiKey = await this.configurationService.get('dify.apiKey')
      this.appId = await this.configurationService.get('dify.appId')
      this.timeout = await this.configurationService.get('dify.timeout', 30000)
      
      if (!this.apiUrl || !this.apiKey || !this.appId) {
        // Dify configuration not complete, service will be disabled
        this.apiUrl = null
        this.apiKey = null
        this.appId = null
        return
      }
      
      this.logger.info('Dify service initialized', { apiUrl: this.apiUrl, appId: this.appId })
    } catch (error) {
      this.logger.warn('Failed to initialize Dify service, continuing without it', { error: error.message })
      this.apiUrl = null
      this.apiKey = null
      this.appId = null
    }
  }

  /**
   * Get headers for API requests
   * @returns {Object} - Headers
   */
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    }
  }

  /**
   * Send message to Dify
   * @param {Conversation} conversation - Conversation entity
   * @param {string} content - Message content
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Dify response
   */
  async sendMessage(conversation, content, options = {}) {
    try {
      if (!this.apiUrl || !this.apiKey || !this.appId) {
        await this.initialize()
      }
      
      // Get configuration from database
      const difyConfig = await this.configurationService.getDifyConfig()
      
      this.logger.info('Sending message to Dify (real-time mode)', {
        conversationId: conversation.id,
        content: content.substring(0, 100),
        enableHistory: difyConfig.enableConversationHistory
      })

      const payload = {
        inputs: {},
        query: content,
        response_mode: 'blocking',
        // Chỉ sử dụng conversation_id nếu enableConversationHistory = true
        conversation_id: difyConfig.enableConversationHistory ? (conversation.difyId || undefined) : undefined,
        user: conversation.id,
        ...options
      }

      const response = await axios.post(
        `${this.apiUrl}/v1/chat-messages`,
        payload,
        {
          headers: this.getHeaders(),
          timeout: this.timeout
        }
      )

      // Xử lý response từ Dify
      let responseText = response.data.answer || ''
      
      // Kiểm tra xem có phải multiple responses không
      if (Array.isArray(responseText)) {
        this.logger.warn('Dify returned multiple responses, taking first one only', {
          responseCount: responseText.length,
          firstResponse: responseText[0]?.substring(0, 100)
        })
        responseText = responseText[0] || ''
      }
      
      // Đảm bảo response là string
      if (typeof responseText !== 'string') {
        responseText = String(responseText)
      }
      
      // Xử lý đặc biệt cho tin nhắn chào hỏi đơn giản
      const simpleGreetings = ['chào', 'hello', 'hi', 'xin chào', 'hey']
      const isSimpleGreeting = simpleGreetings.some(greeting => 
        content.toLowerCase().includes(greeting) && content.length < 20
      )
      
      if (isSimpleGreeting && responseText.length > difyConfig.simpleGreetingMaxLength) {
        // Nếu là chào hỏi đơn giản nhưng response quá dài, cắt ngắn
        responseText = responseText.substring(0, difyConfig.simpleGreetingMaxLength) + '...'
        this.logger.info('Simple greeting detected, response shortened', {
          originalLength: response.data.answer?.length,
          shortenedLength: responseText.length,
          maxLength: difyConfig.simpleGreetingMaxLength
        })
      }
      
      // Giới hạn độ dài response để tránh tin nhắn quá dài
      if (responseText.length > difyConfig.maxResponseLength) {
        responseText = responseText.substring(0, difyConfig.maxResponseLength) + '\n\n[Tin nhắn đã được cắt ngắn do quá dài]'
        this.logger.warn('Dify response too long, truncated', {
          originalLength: response.data.answer?.length,
          truncatedLength: responseText.length,
          maxLength: difyConfig.maxResponseLength
        })
      }

      const result = {
        conversationId: response.data.conversation_id,
        response: responseText,
        metadata: {
          messageId: response.data.id,
          usage: response.data.metadata?.usage,
          originalLength: response.data.answer?.length,
          truncated: response.data.answer?.length > maxLength,
          // Debug info
          fullResponse: response.data,
          responseType: typeof response.data.answer,
          hasMultipleAnswers: Array.isArray(response.data.answer)
        }
      }

      this.logger.info('Message sent to Dify successfully (real-time response)', {
        conversationId: conversation.id,
        difyConversationId: result.conversationId,
        note: 'Each message processed independently for real-time responses'
      })

      return result

    } catch (error) {
      this.logger.error('Failed to send message to Dify', {
        error: error.message,
        conversationId: conversation.id
      })
      throw new Error(`Dify API error: ${error.message}`)
    }
  }

  /**
   * Get conversation history
   * @param {string} conversationId - Dify conversation ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Conversation history
   */
  async getConversationHistory(conversationId, options = {}) {
    try {
      const params = new URLSearchParams({
        conversation_id: conversationId,
        ...options
      })

      const response = await axios.get(
        `${this.apiUrl}/v1/messages?${params}`,
        { headers: this.getHeaders() }
      )

      return response.data

    } catch (error) {
      this.logger.error('Failed to get Dify conversation history', {
        error: error.message,
        conversationId
      })
      throw new Error(`Failed to get conversation history: ${error.message}`)
    }
  }

  /**
   * Get conversation info
   * @param {string} conversationId - Dify conversation ID
   * @returns {Promise<Object>} - Conversation info
   */
  async getConversationInfo(conversationId) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/v1/conversations/${conversationId}`,
        { headers: this.getHeaders() }
      )

      return response.data

    } catch (error) {
      this.logger.error('Failed to get Dify conversation info', {
        error: error.message,
        conversationId
      })
      throw new Error(`Failed to get conversation info: ${error.message}`)
    }
  }

  /**
   * Rename conversation
   * @param {string} conversationId - Dify conversation ID
   * @param {string} name - New conversation name
   * @returns {Promise<Object>} - API response
   */
  async renameConversation(conversationId, name) {
    try {
      const payload = { name }

      const response = await axios.post(
        `${this.apiUrl}/v1/conversations/${conversationId}/name`,
        payload,
        { headers: this.getHeaders() }
      )

      this.logger.info('Dify conversation renamed successfully', {
        conversationId,
        name
      })

      return response.data

    } catch (error) {
      this.logger.error('Failed to rename Dify conversation', {
        error: error.message,
        conversationId,
        name
      })
      throw new Error(`Failed to rename conversation: ${error.message}`)
    }
  }

  /**
   * Delete conversation
   * @param {string} conversationId - Dify conversation ID
   * @returns {Promise<Object>} - API response
   */
  async deleteConversation(conversationId) {
    try {
      const response = await axios.delete(
        `${this.apiUrl}/v1/conversations/${conversationId}`,
        { headers: this.getHeaders() }
      )

      this.logger.info('Dify conversation deleted successfully', {
        conversationId
      })

      return response.data

    } catch (error) {
      this.logger.error('Failed to delete Dify conversation', {
        error: error.message,
        conversationId
      })
      throw new Error(`Failed to delete conversation: ${error.message}`)
    }
  }

  /**
   * Test API connection
   * @returns {Promise<boolean>} - Connection status
   */
  async testConnection() {
    try {
      if (!this.apiUrl || !this.apiKey || !this.appId) {
        // Dify configuration not complete, skipping connection test
        return false
      }

      const response = await axios.get(
        `${this.apiUrl}/v1/parameters`,
        { headers: this.getHeaders() }
      )

      return response.status === 200

    } catch (error) {
      this.logger.warn('Dify API connection test failed', {
        error: error.message
      })
      return false
    }
  }
}

module.exports = DifyService
