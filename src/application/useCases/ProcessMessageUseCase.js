const Message = require('../../domain/entities/Message')
const Conversation = require('../../domain/entities/Conversation')
const Platform = require('../../domain/valueObjects/Platform')

/**
 * Process Message Use Case
 * Handles the core business logic for processing messages
 */
class ProcessMessageUseCase {
  constructor({
    conversationRepository,
    messageRepository,
    telegramService,
    chatwootService,
    difyService,
    configurationService,
    logger
  }) {
    this.conversationRepository = conversationRepository
    this.messageRepository = messageRepository
    this.telegramService = telegramService
    this.chatwootService = chatwootService
    this.difyService = difyService
    this.configurationService = configurationService
    this.logger = logger
    
    // Rate limiting để tránh trả lời liên tục
    this.responseCooldown = new Map() // conversationId -> lastResponseTime
  }

  /**
   * Execute the use case
   * @param {Object} messageData - Raw message data
   * @returns {Promise<Object>} - Processing result
   */
  async execute(messageData) {
    try {
      this.logger.info('Processing message', { messageData })

      // 1. Create message entity
      const message = this.createMessageEntity(messageData)
      message.validate()

      // 2. Check if message already processed
      const messageExists = await this.messageRepository.exists(message.id)
      if (messageExists) {
        this.logger.info('Message already processed, skipping to avoid duplicate responses', { messageId: message.id })
        return { success: true, message: 'Message already processed - duplicate response prevented' }
      }

      // 3. Get or create conversation
      const conversation = await this.getOrCreateConversation(message)

      // 4. Save message
      await this.messageRepository.save(message)

      // 5. Process based on platform
      const result = await this.processByPlatform(message, conversation)

      this.logger.info('Message processed successfully', {
        messageId: message.id,
        conversationId: conversation.id
      })

      return result

    } catch (error) {
      this.logger.error('Failed to process message', {
        error: error.message,
        stack: error.stack,
        messageData
      })
      throw error
    }
  }

  /**
   * Create message entity from raw data
   * @param {Object} messageData - Raw message data
   * @returns {Message}
   */
  createMessageEntity(messageData) {
    const platform = new Platform(messageData.platform)
    
    return new Message({
      id: messageData.id,
      content: messageData.content,
      senderId: messageData.senderId,
      senderName: messageData.senderName,
      conversationId: messageData.conversationId,
      platform: platform.toString(),
      timestamp: messageData.timestamp,
      metadata: messageData.metadata || {}
    })
  }

  /**
   * Get or create conversation
   * @param {Message} message - Message entity
   * @returns {Promise<Conversation>}
   */
  async getOrCreateConversation(message) {
    // Tìm conversation dựa trên platform và chat_id
    let conversation = await this.conversationRepository.findByPlatformChatId(
      message.platform,
      message.conversationId
    )

    if (!conversation) {
      // Tạo conversation mới với thông tin chi tiết
      conversation = await this.createNewConversation(message)
    } else {
      // Cập nhật thông tin conversation nếu cần
      conversation = await this.updateConversationInfo(conversation, message)
    }

    // Cập nhật last message timestamp
    conversation.updateLastMessageAt()
    await this.conversationRepository.update(conversation)

    return conversation
  }

  /**
   * Create new conversation with detailed information
   * @param {Message} message - Message entity
   * @returns {Promise<Conversation>}
   */
  async createNewConversation(message) {
    const conversationData = {
      id: `${message.platform}_${message.conversationId}`,
      platform: message.platform,
      chatId: message.conversationId,
      participants: [{
        id: message.senderId,
        name: message.senderName,
        role: 'user'
      }],
      platformMetadata: message.metadata || {}
    }

    // Thêm thông tin chi tiết dựa trên platform
    if (message.platform === 'telegram') {
      await this.enrichTelegramConversationData(conversationData, message)
    } else if (message.platform === 'chatwoot') {
      await this.enrichChatwootConversationData(conversationData, message)
    }

    const conversation = new Conversation(conversationData)
    return await this.conversationRepository.save(conversation)
  }

  /**
   * Update conversation information if needed
   * @param {Conversation} conversation - Existing conversation
   * @param {Message} message - New message
   * @returns {Promise<Conversation>}
   */
  async updateConversationInfo(conversation, message) {
    let needsUpdate = false

    // Cập nhật thông tin sender nếu chưa có hoặc thay đổi
    if (!conversation.senderId || conversation.senderId !== message.senderId) {
      conversation.senderId = message.senderId
      conversation.senderUsername = message.metadata?.sender?.username
      conversation.senderFirstName = message.metadata?.sender?.first_name
      conversation.senderLastName = message.metadata?.sender?.last_name
      conversation.senderLanguageCode = message.metadata?.sender?.language_code
      conversation.senderIsBot = message.metadata?.sender?.is_bot || false
      needsUpdate = true
    }

    // Cập nhật thông tin chat nếu chưa có
    if (!conversation.chatTitle && message.metadata?.chat?.title) {
      conversation.chatTitle = message.metadata.chat.title
      conversation.chatUsername = message.metadata.chat.username
      conversation.chatDescription = message.metadata.chat.description
      needsUpdate = true
    }

    // Cập nhật thông tin group nếu là group chat
    if (conversation.isGroupChat() && message.metadata?.chat) {
      if (!conversation.groupTitle && message.metadata.chat.title) {
        conversation.groupTitle = message.metadata.chat.title
        conversation.groupUsername = message.metadata.chat.username
        conversation.groupDescription = message.metadata.chat.description
        conversation.groupMemberCount = message.metadata.chat.member_count
        needsUpdate = true
      }
    }

    // Cập nhật participants
    const existingParticipant = conversation.participants.find(p => p.id === message.senderId)
    if (!existingParticipant) {
      conversation.addParticipant({
        id: message.senderId,
        name: message.senderName,
        role: 'user',
        ...message.metadata?.sender
      })
      needsUpdate = true
    }

    if (needsUpdate) {
      return await this.conversationRepository.update(conversation)
    }

    return conversation
  }

  /**
   * Enrich Telegram conversation data
   * @param {Object} conversationData - Conversation data object
   * @param {Message} message - Message entity
   */
  async enrichTelegramConversationData(conversationData, message) {
    const metadata = message.metadata || {}
    const chat = metadata.chat || {}
    const sender = metadata.sender || {}

    // Thông tin chat
    conversationData.chatType = chat.type || 'private'
    conversationData.chatTitle = chat.title
    conversationData.chatUsername = chat.username
    conversationData.chatDescription = chat.description

    // Thông tin sender
    conversationData.senderId = sender.id
    conversationData.senderUsername = sender.username
    conversationData.senderFirstName = sender.first_name
    conversationData.senderLastName = sender.last_name
    conversationData.senderLanguageCode = sender.language_code
    conversationData.senderIsBot = sender.is_bot || false

    // Thông tin group (nếu là group chat)
    if (['group', 'supergroup', 'channel'].includes(chat.type)) {
      conversationData.groupId = chat.id
      conversationData.groupTitle = chat.title
      conversationData.groupUsername = chat.username
      conversationData.groupDescription = chat.description
      conversationData.groupMemberCount = chat.member_count
      conversationData.groupIsVerified = chat.is_verified || false
      conversationData.groupIsRestricted = chat.is_restricted || false
    }
  }

  /**
   * Enrich Chatwoot conversation data
   * @param {Object} conversationData - Conversation data object
   * @param {Message} message - Message entity
   */
  async enrichChatwootConversationData(conversationData, message) {
    const metadata = message.metadata || {}
    const sender = metadata.sender || {}

    // Thông tin chat (Chatwoot conversations are typically private)
    conversationData.chatType = metadata.chatType || 'private'
    conversationData.chatTitle = sender.name || 'Chatwoot Conversation'
    conversationData.chatUsername = sender.username
    conversationData.chatDescription = null

    // Thông tin sender
    conversationData.senderId = sender.id
    conversationData.senderUsername = sender.username
    conversationData.senderFirstName = sender.name
    conversationData.senderLastName = null
    conversationData.senderLanguageCode = sender.language_code
    conversationData.senderIsBot = sender.is_bot || false

    // Thông tin Chatwoot
    conversationData.chatwootId = metadata.conversationId
    conversationData.chatwootInboxId = metadata.inboxId

    // Không có thông tin group cho Chatwoot conversations
    conversationData.groupId = null
    conversationData.groupTitle = null
    conversationData.groupUsername = null
    conversationData.groupDescription = null
    conversationData.groupMemberCount = null
    conversationData.groupIsVerified = false
    conversationData.groupIsRestricted = false
  }

  /**
   * Process message based on platform
   * @param {Message} message - Message entity
   * @param {Conversation} conversation - Conversation entity
   * @returns {Promise<Object>}
   */
  async processByPlatform(message, conversation) {
    const platform = new Platform(message.platform)

    if (platform.isTelegram()) {
      return await this.processTelegramMessage(message, conversation)
    } else if (platform.isChatwoot()) {
      return await this.processChatwootMessage(message, conversation)
    } else {
      throw new Error(`Unsupported platform: ${message.platform}`)
    }
  }

  /**
   * Process Telegram message
   * @param {Message} message - Message entity
   * @param {Conversation} conversation - Conversation entity
   * @returns {Promise<Object>}
   */
  async processTelegramMessage(message, conversation) {
    // 1. Create/update Chatwoot conversation
    const chatwootConversation = await this.chatwootService.createOrUpdateConversation(
      conversation,
      message
    )

    // 2. Send message to Dify (real-time mode - no conversation history)
    const difyResponse = await this.difyService.sendMessage(
      conversation,
      message.getFormattedContent()
    )

    // 3. Update conversation with external IDs
    conversation.chatwootId = chatwootConversation.id
    // Lưu difyId vào DB để duy trì conversation context
    conversation.difyId = difyResponse.conversationId
    await this.conversationRepository.update(conversation)

    // 4. Send response to Chatwoot (Chatwoot sẽ tự động sync tới Telegram)
    if (difyResponse.response && difyResponse.response.trim()) {
      // Get cooldown configuration from database
      const difyConfig = await this.configurationService.getDifyConfig()
      
      // Kiểm tra cooldown để tránh trả lời liên tục
      const now = Date.now()
      const lastResponseTime = this.responseCooldown.get(conversation.id) || 0
      
      if (now - lastResponseTime < difyConfig.cooldownPeriod) {
        this.logger.info('Response skipped due to cooldown', {
          conversationId: conversation.id,
          timeSinceLastResponse: now - lastResponseTime,
          cooldownPeriod: difyConfig.cooldownPeriod
        })
        return {
          success: true,
          chatwootConversationId: chatwootConversation.id,
          difyConversationId: difyResponse.conversationId,
          note: 'Response skipped due to cooldown to prevent continuous responses'
        }
      }
      
      // Cập nhật thời gian response cuối
      this.responseCooldown.set(conversation.id, now)
      
      // Đảm bảo chỉ gửi 1 tin nhắn duy nhất
      const singleResponse = difyResponse.response.trim()
      this.logger.info('Sending SINGLE response to Chatwoot (Chatwoot will sync to Telegram)', {
        chatwootConversationId: chatwootConversation.id,
        responseLength: singleResponse.length,
        responsePreview: singleResponse.substring(0, 100) + (singleResponse.length > 100 ? '...' : '')
      })
      
      // Gửi chỉ 1 tin nhắn duy nhất
      await this.chatwootService.sendMessage(
        chatwootConversation.id,
        singleResponse
      )
      
      this.logger.info('Single response sent successfully', {
        chatwootConversationId: chatwootConversation.id,
        messageId: message.id
      })
    } else {
      this.logger.warn('No valid response from Dify to send to Chatwoot', {
        chatwootConversationId: chatwootConversation.id,
        difyResponse
      })
    }

    return {
      success: true,
      chatwootConversationId: chatwootConversation.id,
      difyConversationId: difyResponse.conversationId,
      note: 'Response sent to Chatwoot only - Chatwoot handles Telegram sync'
    }
  }

  /**
   * Process Chatwoot message
   * @param {Message} message - Message entity
   * @param {Conversation} conversation - Conversation entity
   * @returns {Promise<Object>}
   */
  async processChatwootMessage(message, conversation) {
    // Kiểm tra xem có phải tin nhắn từ bot không (để tránh loop)
    const isFromBot = message.metadata?.event === 'message_created' && 
                     message.metadata?.sender?.is_bot === true
    
    if (isFromBot) {
      this.logger.info('Skipping bot message to prevent loop', {
        messageId: message.id,
        conversationId: conversation.id
      })
      return {
        success: true,
        note: 'Bot message skipped to prevent response loop'
      }
    }

    // 1. Send message to Dify (real-time mode - no conversation history)
    const difyResponse = await this.difyService.sendMessage(
      conversation,
      message.content
    )

    // 2. Update conversation with difyId để duy trì context trong DB
    conversation.difyId = difyResponse.conversationId
    await this.conversationRepository.update(conversation)

    // 3. Send response back to Chatwoot (chỉ gửi một lần)
    if (difyResponse.response && difyResponse.response.trim()) {
      // Get cooldown configuration from database
      const difyConfig = await this.configurationService.getDifyConfig()
      
      // Kiểm tra cooldown để tránh trả lời liên tục
      const now = Date.now()
      const lastResponseTime = this.responseCooldown.get(conversation.id) || 0
      
      if (now - lastResponseTime < difyConfig.cooldownPeriod) {
        this.logger.info('Response skipped due to cooldown', {
          conversationId: conversation.id,
          timeSinceLastResponse: now - lastResponseTime,
          cooldownPeriod: difyConfig.cooldownPeriod
        })
        return {
          success: true,
          difyConversationId: difyResponse.conversationId,
          note: 'Response skipped due to cooldown to prevent continuous responses'
        }
      }
      
      // Cập nhật thời gian response cuối
      this.responseCooldown.set(conversation.id, now)
      
      // Đảm bảo chỉ gửi 1 tin nhắn duy nhất
      const singleResponse = difyResponse.response.trim()
      this.logger.info('Sending SINGLE response to Chatwoot', {
        conversationId: conversation.chatwootId,
        responseLength: singleResponse.length,
        responsePreview: singleResponse.substring(0, 100) + (singleResponse.length > 100 ? '...' : '')
      })
      
      // Gửi chỉ 1 tin nhắn duy nhất
      await this.chatwootService.sendMessage(
        conversation.chatwootId,
        singleResponse
      )
      
      this.logger.info('Single response sent successfully', {
        conversationId: conversation.chatwootId,
        messageId: message.id
      })
    } else {
      this.logger.warn('No valid response from Dify to send to Chatwoot', {
        conversationId: conversation.chatwootId,
        difyResponse
      })
    }

    return {
      success: true,
      difyConversationId: difyResponse.conversationId,
      note: 'Real-time response - no conversation history used'
    }
  }
}

module.exports = ProcessMessageUseCase
