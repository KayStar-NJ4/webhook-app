const axios = require('axios')

/**
 * Chatwoot Service - Infrastructure layer
 * Handles communication with Chatwoot API
 */
class ChatwootService {
  constructor ({ config, configurationService, logger, databaseService = null }) {
    this.config = config
    this.configurationService = configurationService
    this.logger = logger
    this.databaseService = databaseService
    this.baseUrl = null
    this.accessToken = null
    this.accountId = null
    this.inboxId = null // Auto-detected
    this.timeout = this.config.getApiTimeout ? this.config.getApiTimeout('chatwoot') : 30000
  }

  async initialize () {
    // Try to get timeout from database configuration first
    try {
      const dbTimeout = await this.configurationService.getApiTimeout('chatwoot')
      if (dbTimeout) {
        this.timeout = dbTimeout
        this.logger.info('Chatwoot timeout loaded from database', { timeout: this.timeout })
      }
    } catch (error) {
      this.logger.warn('Failed to load Chatwoot timeout from database, using default', { error: error.message })
    }
    this.logger.info('Chatwoot service initialized (per-request configuration)')
  }

  /**
   * Initialize with specific account ID
   * @param {number} accountId - Chatwoot account ID
   */
  async initializeWithAccountId (accountId) {
    try {
      this.logger.info('Starting ChatwootService initialization', {
        accountId,
        currentBaseUrl: this.baseUrl,
        currentAccountId: this.accountId
      })

      let result
      if (this.databaseService) {
        result = await this.databaseService.query('SELECT * FROM chatwoot_accounts WHERE id = $1', [accountId])
      } else {
        const { Pool } = require('pg')
        const pool = new Pool({
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          database: process.env.DB_NAME,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          ssl: process.env.DB_SSL === 'true'
        })
        result = await pool.query('SELECT * FROM chatwoot_accounts WHERE id = $1', [accountId])
        await pool.end()
      }

      if (result.rows.length === 0) throw new Error(`Chatwoot account with ID ${accountId} not found`)

      const account = result.rows[0]
      this.baseUrl = account.base_url
      this.accessToken = account.access_token
      this.accountId = account.account_id

      this.logger.info('Chatwoot account data loaded', {
        accountId: this.accountId,
        baseUrl: this.baseUrl,
        hasAccessToken: !!this.accessToken,
        accessTokenPreview: this.accessToken ? this.accessToken.substring(0, 10) + '...' : 'null'
      })

      // Validate configuration
      this.validateConfiguration()

      this.logger.info('Chatwoot service initialized with account', {
        accountId: this.accountId,
        baseUrl: this.baseUrl,
        accessToken: this.accessToken ? '***' : 'null'
      })
    } catch (error) {
      this.logger.error('Failed to initialize Chatwoot service with account', {
        accountId,
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code,
        errno: error.errno,
        syscall: error.syscall,
        hostname: error.hostname,
        port: error.port,
        path: error.path,
        method: error.method,
        headers: error.config?.headers,
        url: error.config?.url
      })
      throw error
    }
  }


  validateConfiguration () {
    const missing = []
    if (!this.baseUrl) missing.push('chatwoot.baseUrl')
    if (!this.accessToken) missing.push('chatwoot.accessToken')
    if (!this.accountId) missing.push('chatwoot.accountId')
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

  setAccessToken (accessToken) {
    this.accessToken = accessToken
    this.logger.info('Chatwoot access token set', {
      hasToken: !!accessToken,
      tokenPreview: accessToken ? accessToken.substring(0, 10) + '...' : 'none'
    })
  }

  getHeaders () {
    return { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' }
  }


  async getOrCreatePlatformInbox (platform) {
    try {
      // Normalize platform name
      const platformName = this.getPlatformDisplayName(platform)
      
      this.logger.info(`Looking for existing ${platformName} inbox...`)
      const response = await axios.get(`${this.baseUrl}/api/v1/accounts/${this.accountId}/inboxes`, {
        headers: this.getHeaders(),
        timeout: this.timeout
      })

      const inboxes = response.data.payload || []
      const platformInbox = inboxes.find(inbox => 
        inbox.channel_type === 'Channel::Api' && 
        inbox.name === platformName
      )
      
      if (platformInbox) {
        this.logger.info(`Found existing ${platformName} inbox`, { 
          inboxId: platformInbox.id, 
          inboxName: platformInbox.name,
          platform 
        })
        return platformInbox.id.toString()
      }

      this.logger.info(`${platformName} inbox not found, creating new one...`)
      const createResponse = await axios.post(
        `${this.baseUrl}/api/v1/accounts/${this.accountId}/inboxes`,
        { name: platformName, channel: { type: 'api' } },
        { headers: this.getHeaders(), timeout: this.timeout }
      )
      
      this.logger.info(`Created new ${platformName} inbox`, {
        inboxId: createResponse.data.id,
        platform
      })
      
      return createResponse.data.id.toString()
    } catch (error) {
      this.logger.error(`Failed to get or create ${platform} inbox`, {
        error: error.message,
        platform,
        status: error.response?.status,
        responseData: error.response?.data
      })
      throw new Error(`Failed to get ${platform} inbox: ${error.message}`)
    }
  }

  getPlatformDisplayName (platform) {
    const platformNames = {
      'telegram': 'Telegram',
      'zalo': 'Zalo',
      'facebook': 'Facebook Messenger',
      'whatsapp': 'WhatsApp',
      'web': 'Website',
      'line': 'LINE'
    }
    return platformNames[platform] || platform.charAt(0).toUpperCase() + platform.slice(1)
  }

  async updateConversationInbox (conversationId, newInboxId) {
    try {
      this.logger.info('Updating conversation inbox', {
        conversationId,
        newInboxId
      })

      const response = await axios.patch(
        `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversationId}`,
        {
          inbox_id: parseInt(newInboxId)
        },
        {
          headers: this.getHeaders(),
          timeout: this.timeout
        }
      )

      this.logger.info('Conversation inbox updated successfully', {
        conversationId,
        newInboxId
      })

      return response.data
    } catch (error) {
      this.logger.error('Failed to update conversation inbox', {
        error: error.message,
        conversationId,
        newInboxId,
        status: error.response?.status,
        responseData: error.response?.data
      })
      throw new Error(`Failed to update conversation inbox: ${error.message}`)
    }
  }

  async getOrCreateTelegramInbox () {
    return this.getOrCreatePlatformInbox('telegram')
  }

  async getOrCreateApiInbox () {
    // Fallback to Telegram inbox for backward compatibility
    return this.getOrCreateTelegramInbox()
  }

  async createOrUpdateConversation (conversation, message, chatwootAccountId = null) {
    try {
      this.logger.info('Starting createOrUpdateConversation', {
        conversationId: conversation.id,
        messageId: message.id,
        chatwootAccountId,
        conversation_id: conversation.id
      })

      if (chatwootAccountId) {
        await this.initializeWithAccountId(chatwootAccountId)
      } else if (!this.baseUrl || !this.accessToken || !this.accountId) {
        await this.initialize()
      }

      // Get platform-specific inbox
      const platform = conversation.platform || 'telegram'
      const inboxId = await this.getOrCreatePlatformInbox(platform)
      this.logger.info(`Using ${platform} inbox for conversation`, { inboxId, platform })

      let chatwootConversation
      if (conversation.chatwootId) {
        try {
          chatwootConversation = await this.getConversation(conversation.chatwootId)
          
          // Check if conversation is in the wrong inbox
          if (chatwootConversation && chatwootConversation.inbox_id && 
              chatwootConversation.inbox_id.toString() !== inboxId.toString()) {
            this.logger.warn('Conversation is in wrong inbox, will search for or create correct one', {
              conversationId: conversation.id,
              chatwootId: conversation.chatwootId,
              currentInboxId: chatwootConversation.inbox_id,
              expectedInboxId: inboxId,
              platform
            })
            
            // Chatwoot doesn't allow moving conversations between inboxes
            // So we need to search for existing conversation in correct inbox or create new one
            const correctInboxConversation = await this.findConversationBySourceId(conversation.id, inboxId)
            
            if (correctInboxConversation) {
              this.logger.info('Found existing conversation in correct inbox', {
                chatwootId: correctInboxConversation.id,
                inboxId: inboxId
              })
              chatwootConversation = correctInboxConversation
            } else {
              this.logger.info('Creating new conversation in correct inbox', {
                inboxId: inboxId,
                platform
              })
              try {
                chatwootConversation = await this.createConversation(conversation, message, inboxId)
              } catch (createError) {
                this.logger.error('Failed to create conversation in correct inbox, using existing', {
                  error: createError.message
                })
                // Fall back to using existing conversation (even if in wrong inbox)
                chatwootConversation = await this.getConversation(conversation.chatwootId)
              }
            }
          }
        } catch {
          const existingConversation = await this.findConversationBySourceId(conversation.id, inboxId)
          if (existingConversation) {
            chatwootConversation = existingConversation
          } else {
            try {
              chatwootConversation = await this.createConversation(conversation, message, inboxId)
            } catch {
              chatwootConversation = await this.createConversationWithoutInbox(conversation, message)
            }
          }
        }
      } else {
        // Try multiple source_id patterns to find existing conversation
        let existingConversation = await this.findConversationBySourceId(conversation.id, inboxId)
        if (!existingConversation && conversation.senderId) { 
          existingConversation = await this.findConversationBySourceId(conversation.senderId, inboxId) 
        }
        if (!existingConversation && conversation.chatId) { 
          existingConversation = await this.findConversationBySourceId(conversation.chatId, inboxId) 
        }
        if (!existingConversation) {
          // Try with telegram_ prefix
          existingConversation = await this.findConversationBySourceId(`telegram_${conversation.chatId}`, inboxId)
        }

        if (existingConversation) {
          this.logger.info('Found existing Chatwoot conversation', {
            conversationId: conversation.id,
            chatwootId: existingConversation.id,
            sourceId: existingConversation.source_id
          })
          chatwootConversation = existingConversation
        } else {
          // Create new conversation with original source_id first
          try {
            chatwootConversation = await this.createConversation(conversation, message, inboxId)
          } catch (createError) {
            this.logger.warn('Failed to create conversation with original source_id, trying unique source_id', {
              error: createError.message,
              sourceId: conversation.id
            })
            
            // If that fails, try with unique source_id
            const uniqueSourceId = `telegram_${conversation.chatId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            try {
              chatwootConversation = await this.createConversation(conversation, message, inboxId, uniqueSourceId)
            } catch (uniqueError) {
              this.logger.warn('Failed to create conversation with unique source_id, trying without inbox', {
                error: uniqueError.message,
                uniqueSourceId
              })
              chatwootConversation = await this.createConversationWithoutInbox(conversation, message)
            }
          }
        }
      }

      try {
        await this.sendMessage(chatwootConversation.id, message.content, {
          sender: { id: message.senderId, name: message.senderName }
        })
      } catch (sendError) {
        this.logger.error('Failed to send message to Chatwoot conversation', { error: sendError.message })
        // Don't throw, just log the error and continue
      }

      if (!chatwootConversation) {
        throw new Error('Failed to create Chatwoot conversation: no conversation returned')
      }

      // Update conversation in database with chatwootId if we have one
      if (chatwootConversation.id && !conversation.chatwootId) {
        try {
          // This will be handled by the calling code to update the conversation
          this.logger.info('Chatwoot conversation created/found, should update database conversation', {
            conversationId: conversation.id,
            chatwootId: chatwootConversation.id
          })
        } catch (updateError) {
          this.logger.warn('Failed to update conversation with chatwootId', {
            error: updateError.message,
            conversationId: conversation.id,
            chatwootId: chatwootConversation.id
          })
        }
      }
      
      return chatwootConversation
    } catch (error) {
      this.logger.error('Failed to create/update Chatwoot conversation', {
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code,
        errno: error.errno,
        syscall: error.syscall,
        hostname: error.hostname,
        port: error.port,
        path: error.path,
        method: error.method,
        headers: error.config?.headers,
        url: error.config?.url,
        conversation_id: conversation.id,
        messageId: message.id,
        chatwootAccountId
      })
      throw new Error(`Chatwoot API error: ${error.message}`)
    }
  }

  async findConversationBySourceId (sourceId, inboxId) {
    try {
      const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations`
      const response = await axios.get(url, { headers: this.getHeaders(), params: { inbox_id: inboxId, source_id: sourceId }, timeout: this.timeout })
      const conversations = Array.isArray(response.data.data) ? response.data.data : []
      return conversations.length > 0 ? conversations[0] : null
    } catch {
      return null
    }
  }

  async findContactByIdentifier (identifier) {
    try {
      const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts/search`
      const response = await axios.get(url, { 
        headers: this.getHeaders(), 
        params: { q: identifier }, 
        timeout: this.timeout 
      })
      const contacts = response.data.payload || []
      // Find exact match
      const contact = contacts.find(c => c.identifier === identifier || c.phone_number === identifier)
      return contact || null
    } catch (error) {
      this.logger.warn('Failed to search contact', { error: error.message, identifier })
      return null
    }
  }

  async createContactInbox (contactId, inboxId, sourceId) {
    try {
      this.logger.info('Creating contact_inbox', { contactId, inboxId, sourceId })
      
      const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts/${contactId}/contact_inboxes`
      const response = await axios.post(url, {
        inbox_id: parseInt(inboxId),
        source_id: sourceId
      }, { 
        headers: this.getHeaders(), 
        timeout: this.timeout 
      })
      
      this.logger.info('Contact inbox created successfully', { 
        contactId, 
        inboxId,
        contactInboxId: response.data?.id 
      })
      
      return response.data
    } catch (error) {
      // Contact inbox might already exist, that's okay
      if (error.response?.status === 422 || error.response?.status === 409) {
        this.logger.info('Contact inbox already exists', { contactId, inboxId })
        return null
      }
      
      this.logger.warn('Failed to create contact_inbox', { 
        error: error.message,
        contactId,
        inboxId,
        status: error.response?.status,
        data: error.response?.data
      })
      return null
    }
  }

  async createConversation (conversation, message, inboxId, customSourceId = null) {
    // Use Telegram user info for contact name
    const firstName = message.metadata?.firstName || conversation.senderFirstName || ''
    const lastName = message.metadata?.lastName || conversation.senderLastName || ''
    const username = message.metadata?.username || conversation.senderUsername || ''
    
    // Create display name based on platform
    const platform = conversation.platform || 'telegram'
    const senderId = conversation.senderId || message.senderId || message.metadata?.userId
    
    let contactName = platform === 'web' ? 'Web User' : 'Telegram User'
    
    if (firstName || lastName) {
      contactName = `${firstName} ${lastName}`.trim()
    } else if (username) {
      contactName = `@${username}`
    }
    
    // IMPORTANT: Add platform prefix to contact name to avoid matching with contacts from other platforms
    // This ensures web contacts and telegram contacts are treated as separate entities
    if (!firstName && !lastName && !username) {
      // For anonymous users, add platform prefix to the sender ID
      contactName = `${platform === 'web' ? 'Web' : 'Telegram'} ${senderId}`
    }
    
    // Add bot ID to contact name to distinguish between different bots
    if (conversation.platformMetadata?.botId) {
      contactName = `${contactName} (Bot ${conversation.platformMetadata.botId})`
    }


    // IMPORTANT: Use platform-specific identifier to avoid inbox conflicts
    // Chatwoot will always use the first contact_inbox it finds for a contact
    // So we need different identifiers for different platforms
    const platformSpecificIdentifier = `${platform}_${senderId}`

    // Include bot ID in additional attributes for better tracking
    const additionalAttributes = { 
      platform: platform, 
      conversation_id: conversation.id,
      telegram_username: username,
      telegram_user_id: senderId
    }
    
    // Add bot ID if available in platform metadata
    if (conversation.platformMetadata?.botId) {
      additionalAttributes.telegram_bot_id = conversation.platformMetadata.botId
    }

    // STEP 1: Create or find contact with platform-specific identifier
    let contact
    try {
      contact = await this.findContactByIdentifier(platformSpecificIdentifier)
      if (contact) {
        this.logger.info('Found existing contact for platform', { 
          contactId: contact.id, 
          identifier: platformSpecificIdentifier,
          platform 
        })
      } else {
        // Create new contact
        const contactPayload = {
          name: contactName,
          identifier: platformSpecificIdentifier
        }
        
        const contactResponse = await axios.post(
          `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts`,
          contactPayload,
          { headers: this.getHeaders(), timeout: this.timeout }
        )
        contact = contactResponse.data.payload?.contact || contactResponse.data.payload || contactResponse.data
        this.logger.info('Created new contact for platform', { 
          contactId: contact.id,
          identifier: platformSpecificIdentifier,
          platform 
        })
      }

      // STEP 2: Create contact_inbox for this inbox
      await this.createContactInbox(contact.id, inboxId, conversation.id)
      
    } catch (error) {
      this.logger.error('Failed to create/find contact and contact_inbox', { 
        error: error.message,
        identifier: platformSpecificIdentifier 
      })
      throw error
    }

    // STEP 3: Create conversation with contact_id (not inline contact)
    const payload = {
      source_id: customSourceId || conversation.id,
      inbox_id: parseInt(inboxId),
      contact_id: contact.id,
      additional_attributes: additionalAttributes
    }

    this.logger.info('Creating Chatwoot conversation with contact_id', {
      contactId: contact.id,
      contactName,
      senderId,
      username,
      inboxId,
      platform,
      identifier: platformSpecificIdentifier
    })

    const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations`
    const response = await axios.post(url, payload, { headers: this.getHeaders(), timeout: this.timeout })
    
    this.logger.info('Chatwoot createConversation API response', {
      status: response.status,
      data: response.data,
      hasPayload: !!response.data.payload,
      hasData: !!response.data.data,
      responseKeys: Object.keys(response.data || {}),
      inboxId: response.data?.inbox_id || response.data?.payload?.inbox_id || response.data?.data?.inbox_id
    })
    
    const result = response.data.payload || response.data.data || response.data
    if (!result) {
      throw new Error(`Chatwoot API returned empty response: ${JSON.stringify(response.data)}`)
    }
    
    return result
  }

  async createConversationWithoutInbox (conversation, message) {
    const contactName = conversation.getChatDisplayName()
    const contactIdentifier = conversation.id
    let contactId

    try {
      // Telegram API doesn't provide real email addresses for privacy reasons
      // We'll leave email as null and let Chatwoot handle it
      const contactResponse = await axios.post(
        `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts`,
        { name: contactName, email: null },
        { headers: this.getHeaders(), timeout: this.timeout }
      )
      contactId = contactResponse.data.payload?.contact?.id || contactResponse.data.payload?.id || contactResponse.data.id
    } catch (error) {
      this.logger.error('Error in Chatwoot service', { error: error.message })
      throw error
    }

    const payload = { source_id: contactIdentifier, contact_id: contactId, inbox_id: await this.getOrCreateApiInbox() }
    const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations`
    const response = await axios.post(url, payload, { headers: this.getHeaders(), timeout: this.timeout })
    
    const result = response.data.payload || response.data.data || response.data
    if (!result) {
      throw new Error(`Chatwoot API returned empty response: ${JSON.stringify(response.data)}`)
    }
    
    return result
  }

  async getConversation (conversationId) {
    const response = await axios.get(
      `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversationId}`,
      { headers: this.getHeaders(), timeout: this.timeout }
    )
    
    this.logger.info('Chatwoot getConversation API response', {
      status: response.status,
      data: response.data,
      hasPayload: !!response.data.payload,
      hasData: !!response.data.data,
      responseKeys: Object.keys(response.data || {})
    })
    
    // Chatwoot API returns data directly, not wrapped in payload
    const result = response.data
    if (!result) {
      throw new Error(`Chatwoot getConversation API returned empty response: ${JSON.stringify(response.data)}`)
    }
    
    return result
  }

  async sendMessage (conversationId, content, options = {}) {
    try {
      this.logger.info('Sending message to Chatwoot', {
        conversationId,
        content: content.substring(0, 100),
        messageType: options.message_type || 'incoming',
        conversation_id: conversationId
      })

      const payload = {
        content,
        message_type: options.message_type || 'incoming',
        private: false,
        content_type: 'text',
        ...options
      }
      const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversationId}/messages`

      this.logger.info('Chatwoot send message request', {
        url,
        payload,
        conversation_id: conversationId
      })

      const response = await axios.post(url, payload, { headers: this.getHeaders(), timeout: this.timeout })

      this.logger.info('Message sent to Chatwoot successfully', {
        conversationId,
        responseId: response.data?.id,
        conversation_id: conversationId
      })

      return response.data
    } catch (error) {
      this.logger.error('Failed to send message to Chatwoot', {
        error: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code,
        errno: error.errno,
        syscall: error.syscall,
        hostname: error.hostname,
        port: error.port,
        path: error.path,
        method: error.method,
        headers: error.config?.headers,
        url: error.config?.url,
        conversation_id: conversationId,
        content: content.substring(0, 100)
      })
      throw error
    }
  }

  async getConversations (options = {}) {
    const inboxId = await this.getOrCreateApiInbox()
    const response = await axios.get(
      `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations?inbox_id=${inboxId}`,
      { headers: this.getHeaders(), params: options, timeout: this.timeout }
    )
    return response.data
  }

  async testConnection () {
    try {
      this.logger.info('Testing Chatwoot connection', {
        url: `${this.baseUrl}/api/v1/accounts/${this.accountId}`,
        headers: this.getHeaders(),
        accountId: this.accountId,
        baseUrl: this.baseUrl
      })

      // Test 1: Check if account exists and is accessible
      const accountResponse = await axios.get(`${this.baseUrl}/api/v1/accounts/${this.accountId}`, { 
        headers: this.getHeaders(),
        timeout: this.timeout
      })
      
      this.logger.info('Account access successful', {
        accountName: accountResponse.data?.payload?.name || 'Unknown',
        accountId: this.accountId
      })

      // Test 2: Check if we can list inboxes (without creating new ones)
      const inboxesResponse = await axios.get(`${this.baseUrl}/api/v1/accounts/${this.accountId}/inboxes`, {
        headers: this.getHeaders(),
        timeout: this.timeout
      })
      
      this.logger.info('Inboxes access successful', {
        inboxesCount: inboxesResponse.data?.payload?.length || 0
      })
      
      this.logger.info('Chatwoot connection test successful')
      return true
    } catch (error) {
      this.logger.error('Chatwoot connection test failed', {
        error: error.message || 'Unknown error',
        errorName: error.name || 'Error',
        errorCode: error.code,
        syscall: error.syscall,
        hostname: error.hostname,
        url: `${this.baseUrl}/api/v1/accounts/${this.accountId}`,
        accountId: this.accountId,
        response: error.response?.data,
        responseStatus: error.response?.status,
        responseStatusText: error.response?.statusText,
        requestTimeout: this.timeout,
        isAxiosError: error.isAxiosError,
        isTimeout: error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT',
        stack: error.stack
      })
      return false
    }
  }

  validateWebhookData (data) {
    return data && data.message && data.conversation
  }
}

module.exports = ChatwootService
