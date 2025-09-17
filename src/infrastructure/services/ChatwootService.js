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
    this.inboxId = null // Auto-detected
  }

  async initialize() {
    this.logger.info('Chatwoot service initialized (per-request configuration)')
  }

  async initializeWithAccountId(accountId) {
    try {
      const { Pool } = require('pg')
      const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true'
      })

      const result = await pool.query('SELECT * FROM chatwoot_accounts WHERE id = $1', [accountId])
      await pool.end()

      if (result.rows.length === 0) throw new Error(`Chatwoot account with ID ${accountId} not found`)

      const account = result.rows[0]
      this.baseUrl = account.base_url
      this.accessToken = account.access_token
      this.accountId = account.account_id

      this.inboxId = await this.getOrCreateApiInbox()

      this.logger.info('Chatwoot service initialized with account', {
        accountId: this.accountId,
        baseUrl: this.baseUrl,
        accessToken: this.accessToken ? '***' : 'null'
      })
    } catch (error) {
      this.logger.error('Failed to initialize Chatwoot service with account', { accountId, error: error.message })
      throw error
    }
  }

  validateConfiguration() {
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

  setAccessToken(accessToken) {
    this.accessToken = accessToken
    this.logger.info('Chatwoot access token set', {
      hasToken: !!accessToken,
      tokenPreview: accessToken ? accessToken.substring(0, 10) + '...' : 'none'
    })
  }

  getHeaders() {
    return { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' }
  }

  async getOrCreateApiInbox() {
    try {
      this.logger.info('Looking for existing API inbox...')
      const response = await axios.get(`${this.baseUrl}/api/v1/accounts/${this.accountId}/inboxes`, {
        headers: this.getHeaders()
      })

      const inboxes = response.data.payload || []
      const apiInbox = inboxes.find(inbox => inbox.channel_type === 'Channel::Api')
      if (apiInbox) {
        this.logger.info('Found existing API inbox', { inboxId: apiInbox.id, inboxName: apiInbox.name })
        return apiInbox.id.toString()
      }

      this.logger.info('API inbox not found, creating new one...')
      const createResponse = await axios.post(
        `${this.baseUrl}/api/v1/accounts/${this.accountId}/inboxes`,
        { name: 'API Inbox', channel: { type: 'api' } },
        { headers: this.getHeaders() }
      )
      return createResponse.data.id.toString()
    } catch (error) {
      this.logger.error('Failed to get or create API inbox', {
        error: error.message,
        status: error.response?.status,
        responseData: error.response?.data
      })
      throw new Error(`Failed to get API inbox: ${error.message}`)
    }
  }

  async createOrUpdateConversation(conversation, message, chatwootAccountId = null) {
    try {
      if (chatwootAccountId) {
        await this.initializeWithAccountId(chatwootAccountId)
      } else if (!this.baseUrl || !this.accessToken || !this.accountId) {
        await this.initialize()
      }

      const inboxId = await this.getOrCreateApiInbox()
      this.logger.info('Using API inbox for conversation', { inboxId })

      let chatwootConversation
      if (conversation.chatwootId) {
        try {
          chatwootConversation = await this.getConversation(conversation.chatwootId)
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
        let existingConversation = await this.findConversationBySourceId(conversation.id, inboxId)
        if (!existingConversation && conversation.senderId)
          existingConversation = await this.findConversationBySourceId(conversation.senderId, inboxId)
        if (!existingConversation && conversation.chatId)
          existingConversation = await this.findConversationBySourceId(conversation.chatId, inboxId)

        const uniqueSourceId = `telegram_${conversation.chatId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        try {
          chatwootConversation = await this.createConversation(conversation, message, inboxId, uniqueSourceId)
        } catch {
          chatwootConversation = await this.createConversationWithoutInbox(conversation, message)
        }
      }

      try {
        await this.sendMessage(chatwootConversation.id, message.content, {
          sender: { id: message.senderId, name: message.senderName }
        })
      } catch (sendError) {
        this.logger.error('Failed to send message to Chatwoot conversation', { error: sendError.message })
      }

      return chatwootConversation
    } catch (error) {
      this.logger.error('Failed to create/update Chatwoot conversation', { error: error.message })
      throw new Error(`Chatwoot API error: ${error.message}`)
    }
  }

  async findConversationBySourceId(sourceId, inboxId) {
    try {
      const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations`
      const response = await axios.get(url, { headers: this.getHeaders(), params: { inbox_id: inboxId, source_id: sourceId } })
      const conversations = Array.isArray(response.data.data) ? response.data.data : []
      return conversations.length > 0 ? conversations[0] : null
    } catch {
      return null
    }
  }

  async createConversation(conversation, message, inboxId, customSourceId = null) {
    const contactName = conversation.getChatDisplayName() || message.senderName || 'Unknown'
    const senderId = conversation.senderId || message.senderId || message.metadata?.userId
    const chatId = conversation.chatId || message.metadata?.chatId
    const senderUsername = conversation.senderUsername || message.metadata?.username

    const payload = {
      source_id: customSourceId || conversation.id,
      inbox_id: inboxId,
      contact: {
        name: contactName,
        identifier: senderId,
        email: senderUsername ? `${senderUsername}_${Date.now()}@telegram.local` : null,
        phone_number: senderId
      },
      additional_attributes: { platform: conversation.platform || 'telegram', conversation_id: conversation.id }
    }

    const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations`
    const response = await axios.post(url, payload, { headers: this.getHeaders() })
    return response.data.payload || response.data.data || response.data
  }

  async createConversationWithoutInbox(conversation, message) {
    const contactName = conversation.getChatDisplayName()
    const contactIdentifier = conversation.id
    let contactId

    try {
      const contactResponse = await axios.post(
        `${this.baseUrl}/api/v1/accounts/${this.accountId}/contacts`,
        { name: contactName, email: `${contactIdentifier}_${Date.now()}@telegram.local` },
        { headers: this.getHeaders() }
      )
      contactId = contactResponse.data.payload?.contact?.id || contactResponse.data.payload?.id || contactResponse.data.id
    } catch (error) {
      throw error
    }

    const payload = { source_id: contactIdentifier, contact_id: contactId, inbox_id: await this.getOrCreateApiInbox() }
    const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations`
    const response = await axios.post(url, payload, { headers: this.getHeaders() })
    return response.data.payload || response.data.data || response.data
  }

  async getConversation(conversationId) {
    const response = await axios.get(
      `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversationId}`,
      { headers: this.getHeaders() }
    )
    return response.data.payload
  }

  async sendMessage(conversationId, content, options = {}) {
    const payload = {
      content,
      message_type: options.message_type || 'outgoing',
      private: false,
      content_type: 'text',
      ...options
    }
    const url = `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations/${conversationId}/messages`
    const response = await axios.post(url, payload, { headers: this.getHeaders() })
    return response.data
  }

  async getConversations(options = {}) {
    const inboxId = await this.getOrCreateApiInbox()
    const response = await axios.get(
      `${this.baseUrl}/api/v1/accounts/${this.accountId}/conversations?inbox_id=${inboxId}`,
      { headers: this.getHeaders(), params: options }
    )
    return response.data
  }

  async testConnection() {
    try {
      await axios.get(`${this.baseUrl}/api/v1/accounts/${this.accountId}`, { headers: this.getHeaders() })
      const inboxId = await this.getOrCreateApiInbox()
      await axios.get(`${this.baseUrl}/api/v1/accounts/${this.accountId}/inboxes/${inboxId}`, {
        headers: this.getHeaders()
      })
      return true
    } catch {
      return false
    }
  }

  validateWebhookData(data) {
    return data && data.message && data.conversation
  }
}

module.exports = ChatwootService
