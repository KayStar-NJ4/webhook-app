const axios = require('axios')

/**
 * Chatwoot Service - Infrastructure layer
 * Handles communication with Chatwoot API
 */
class ChatwootService {
  constructor({ config, configurationService, logger }) {
    this.config = config
    this.configurationService = configurationService
    this.logger = logger
    this.baseUrl = null
    this.accessToken = null
    this.accountId = null
    this.inboxId = null // Will be auto-detected
  }

  /**
   * Initialize service with configuration from database
   */
  async initialize() {
    try {
      this.baseUrl = await this.configurationService.get('chatwoot.baseUrl')
      this.accessToken = await this.configurationService.get('chatwoot.accessToken')
      this.accountId = await this.configurationService.get('chatwoot.accountId')
      this.inboxId = await this.configurationService.get('chatwoot.inboxId', 1)
      
      // Validate configuration
      if (!this.baseUrl || !this.accessToken || !this.accountId) {
        this.logger.info('Chatwoot configuration not complete, service will be disabled')
        this.baseUrl = null
        this.accessToken = null
        this.accountId = null
        this.inboxId = null
        return
      }
      
      this.logger.info('Chatwoot service initialized', { baseUrl: this.baseUrl, accountId: this.accountId })
    } catch (error) {
      this.logger.warn('Failed to initialize Chatwoot service, continuing without it', { error: error.message })
      this.baseUrl = null
      this.accessToken = null
      this.accountId = null
      this.inboxId = null
    }
  }

  /**
   * Validate Chatwoot configuration
   */
  validateConfiguration() {
    const missing = []
    
    if (!this.baseUrl) missing.push('chatwoot.baseUrl')
    if (!this.accessToken) missing.push('chatwoot.accessToken')
    if (!this.accountId) missing.push('chatwoot.accountId')
    // inboxId will be auto-detected, not required in config
    
    if (missing.length > 0) {
      const error = `Missing required Chatwoot configuration: ${missing.join(', ')}`
      this.logger.error(error)
      throw new Error(error)
    }
    
    this.logger.info('Chatwoot configuration validated', {
      baseUrl: this.baseUrl,
      accountId: this.accountId,
      hasAccessToken: !!this.accessToken
    })
  }

  /**
   * Get headers for API requests
   * @returns {Object} - Headers
   */
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    }
  }

  /**
   * Get or create Telegram inbox
   * @returns {Promise<string>} - Inbox ID
   */
  async getOrCreateTelegramInbox() {
    if (this.inboxId) {
      return this.inboxId
    }

    try {
      this.logger.info('Looking for existing Telegram inbox...')
      
      // Get all inboxes
      const response = await axios.get(
        `${this.baseUrl}/api/v1/accounts/${this.accountId}/inboxes`,
        { headers: this.getHeaders() }
      )

      const inboxes = response.data.payload || []
      const telegramInbox = inboxes.find(inbox => inbox.channel_type === 'Channel::Telegram')

      if (telegramInbox) {
        this.inboxId = telegramInbox.id
        this.logger.info('Found existing Telegram inbox', {
          inboxId: this.inboxId,
          inboxName: telegramInbox.name
        })
        return this.inboxId
      }

      // Create new Telegram inbox if not found
      this.logger.info('Telegram inbox not found, creating new one...')
      const createPayload = {
        name: 'Telegram Bot',
        channel: {
          type: 'telegram',
          bot_token: this.config.get('telegram.botToken') || 'your_telegram_bot_token'
        }
      }

      const createResponse = await axios.post(
        `${this.baseUrl}/api/v1/accounts/${this.accountId}/inboxes`,
        createPayload,
        { headers: this.getHeaders() }
      )

      this.inboxId = createResponse.data.id
      this.logger.info('Created new Telegram inbox', {
        inboxId: this.inboxId,
        inboxName: createResponse.data.name
      })

      return this.inboxId

    } catch (error) {
      this.logger.error('Failed to get or create Telegram inbox', {
        error: error.message,
        status: error.response?.status,
        responseData: error.response?.data
      })
      throw new Error(`Failed to get Telegram inbox: ${error.message}`)
    }
  }

  /**
   * Create or update conversation
   * @param {Conversation} conversation - Conversation entity
   * @param {Message} message - Message entity
   * @returns {Promise<Object>} - Chatwoot conversation
   */
  async createOrUpdateConversation(conversation, message) {
    try {
      // Get or create Telegram inbox
      const inboxId = await this.getOrCreateTelegramInbox()
      
      // Debug logging for configuration
      this.logger.info('Creating/updating Chatwoot conversation', {
        conversationId: conversation.id,
        messageId: message.id,
        chatDisplayName: conversation.getChatDisplayName(),
        config: {
          baseUrl: this.baseUrl,
          accountId: this.accountId,
          inboxId: inboxId,
          hasAccessToken: !!this.accessToken
        }
      })

      let chatwootConversation

      if (conversation.chatwootId) {
        // Update existing conversation
        try {
          chatwootConversation = await this.getConversation(conversation.chatwootId)
          this.logger.info('Found existing Chatwoot conversation', {
            conversationId: conversation.id,
            chatwootConversationId: chatwootConversation.id
          })
        } catch (error) {
          // Conversation không tồn tại, tạo mới
          this.logger.warn('Existing Chatwoot conversation not found, creating new one', {
            conversationId: conversation.id,
            error: error.message
          })
          chatwootConversation = await this.createConversation(conversation, message, inboxId)
        }
      } else {
        // Tìm conversation dựa trên source_id trước khi tạo mới
        const existingConversation = await this.findConversationBySourceId(conversation.id, inboxId)
        if (existingConversation) {
          chatwootConversation = existingConversation
          this.logger.info('Found existing Chatwoot conversation by source_id', {
            conversationId: conversation.id,
            chatwootConversationId: chatwootConversation.id
          })
        } else {
          // Create new conversation
          chatwootConversation = await this.createConversation(conversation, message, inboxId)
        }
      }

      // Send message to conversation
      await this.sendMessage(chatwootConversation.id, message.content, {
        sender: {
          id: message.senderId,
          name: message.senderName
        }
      })

      this.logger.info('Chatwoot conversation processed successfully', {
        conversationId: conversation.id,
        chatwootConversationId: chatwootConversation.id,
        chatDisplayName: conversation.getChatDisplayName()
      })

      return chatwootConversation

    } catch (error) {
      this.logger.error('Failed to create/update Chatwoot conversation', {
        error: error.message,
        conversationId: conversation.id,
        chatDisplayName: conversation.getChatDisplayName()
      })
      throw new Error(`Chatwoot API error: ${error.message}`)
    }
  }

  /**
   * Find conversation by source_id
   * @param {string} sourceId - Source ID to search for
   * @param {string} inboxId - Inbox ID to search in
   * @returns {Promise<Object|null>} - Found conversation or null
   */
  async findConversationBySourceId(sourceId, inboxId) {
    try {
      const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations`
      const params = {
        inbox_id: inboxId,
        source_id: sourceId
      }
      
      this.logger.info('Searching for existing conversation', {
        url,
        params,
        sourceId
      })

      const response = await axios.get(url, {
        headers: this.getHeaders(),
        params
      })

      const conversations = response.data.data || []
      this.logger.info('Search result', {
        sourceId,
        foundCount: conversations.length,
        conversations: conversations.map(c => ({ id: c.id, source_id: c.source_id }))
      })
      
      return conversations.length > 0 ? conversations[0] : null
    } catch (error) {
      this.logger.warn('Failed to find conversation by source_id', {
        sourceId,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      })
      return null
    }
  }

  /**
   * Create new conversation
   * @param {Conversation} conversation - Conversation entity
   * @param {Message} message - Message entity
   * @param {string} inboxId - Inbox ID to create conversation in
   * @returns {Promise<Object>} - Created conversation
   */
  async createConversation(conversation, message, inboxId) {
    const contactName = conversation.getChatDisplayName()
    const contactIdentifier = conversation.isPrivateChat() 
      ? conversation.senderId 
      : `${conversation.platform}_${conversation.chatId}`

    const payload = {
      source_id: conversation.id,
      inbox_id: inboxId,
      contact: {
        name: contactName,
        identifier: contactIdentifier,
        email: conversation.senderUsername ? `${conversation.senderUsername}@telegram.local` : null,
        phone_number: conversation.senderId,
        custom_attributes: {
          platform: conversation.platform,
          chat_type: conversation.chatType,
          chat_id: conversation.chatId,
          sender_id: conversation.senderId,
          sender_username: conversation.senderUsername,
          sender_first_name: conversation.senderFirstName,
          sender_last_name: conversation.senderLastName,
          sender_language_code: conversation.senderLanguageCode,
          group_title: conversation.groupTitle,
          group_username: conversation.groupUsername,
          group_member_count: conversation.groupMemberCount
        }
      },
      additional_attributes: {
        platform: conversation.platform,
        conversation_id: conversation.id,
        chat_type: conversation.chatType,
        chat_display_name: contactName,
        is_group_chat: conversation.isGroupChat(),
        is_private_chat: conversation.isPrivateChat()
      }
    }

    const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations`
    
    this.logger.info('Creating new Chatwoot conversation', {
      conversationId: conversation.id,
      contactName,
      contactIdentifier,
      chatType: conversation.chatType,
      url,
      payload: {
        ...payload,
        contact: {
          ...payload.contact,
          custom_attributes: payload.contact.custom_attributes
        }
      }
    })

    try {
      const response = await axios.post(url, payload, { headers: this.getHeaders() })

      this.logger.info('Chatwoot conversation created successfully', {
        conversationId: conversation.id,
        chatwootConversationId: response.data.payload.id,
        contactName
      })

      return response.data.payload
    } catch (error) {
      this.logger.error('Failed to create Chatwoot conversation', {
        conversationId: conversation.id,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        url,
        payload
      })
      throw error
    }
  }

  /**
   * Get conversation by ID
   * @param {string} conversationId - Chatwoot conversation ID
   * @returns {Promise<Object>} - Conversation data
   */
  async getConversation(conversationId) {
    const response = await axios.get(
      `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversationId}`,
      { headers: this.getHeaders() }
    )

    return response.data.payload
  }

  /**
   * Send message to conversation
   * @param {string} conversationId - Chatwoot conversation ID
   * @param {string} content - Message content
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Message data
   */
  async sendMessage(conversationId, content, options = {}) {
    try {
      this.logger.info('Sending message to Chatwoot', {
        conversationId,
        content: content.substring(0, 100)
      })

      const payload = {
        content,
        message_type: 'outgoing',
        private: false,
        ...options
      }

      const response = await axios.post(
        `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversationId}/messages`,
        payload,
        { headers: this.getHeaders() }
      )

      this.logger.info('Message sent to Chatwoot successfully', {
        conversationId,
        messageId: response.data.id
      })

      return response.data

    } catch (error) {
      this.logger.error('Failed to send message to Chatwoot', {
        error: error.message,
        conversationId
      })
      throw new Error(`Failed to send message: ${error.message}`)
    }
  }

  /**
   * Get conversations
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Conversations data
   */
  async getConversations(options = {}) {
    const inboxId = await this.getOrCreateTelegramInbox()
    const params = new URLSearchParams({
      inbox_id: inboxId,
      ...options
    })

    const response = await axios.get(
      `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations?${params}`,
      { headers: this.getHeaders() }
    )

    return response.data
  }

  /**
   * Test Chatwoot API connection
   * @returns {Promise<boolean>} - Connection status
   */
  async testConnection() {
    try {
      this.logger.info('Testing Chatwoot API connection')
      
      // Test account access
      const accountResponse = await axios.get(
        `${this.baseUrl}/api/v1/accounts/${this.accountId}`,
        { headers: this.getHeaders() }
      )
      
      this.logger.info('Account access test successful', {
        accountId: this.accountId,
        accountName: accountResponse.data.name
      })
      
      // Test inbox access (get or create first)
      const inboxId = await this.getOrCreateTelegramInbox()
      const inboxResponse = await axios.get(
        `${this.baseUrl}/api/v1/accounts/${this.accountId}/inboxes/${inboxId}`,
        { headers: this.getHeaders() }
      )
      
      this.logger.info('Inbox access test successful', {
        inboxId: inboxId,
        inboxName: inboxResponse.data.name,
        inboxType: inboxResponse.data.channel_type
      })
      
      return true
    } catch (error) {
      this.logger.error('Chatwoot API connection test failed', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      })
      return false
    }
  }

  /**
   * Validate webhook data
   * @param {Object} data - Webhook data
   * @returns {boolean} - Is valid
   */
  validateWebhookData(data) {
    return data && data.message && data.conversation
  }
}

module.exports = ChatwootService
