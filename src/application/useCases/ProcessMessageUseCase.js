const Message = require('../../domain/entities/Message')
const Conversation = require('../../domain/entities/Conversation')
const Platform = require('../../domain/valueObjects/Platform')

/**
 * Process Message Use Case
 * Handles the core business logic for processing messages
 */
class ProcessMessageUseCase {
  constructor ({
    conversationRepository,
    messageRepository,
    webConversationRepository,
    webMessageRepository,
    telegramService,
    chatwootService,
    difyService,
    configurationService,
    platformMappingService,
    databaseService,
    logger
  }) {
    this.conversationRepository = conversationRepository
    this.messageRepository = messageRepository
    this.webConversationRepository = webConversationRepository
    this.webMessageRepository = webMessageRepository
    this.telegramService = telegramService
    this.chatwootService = chatwootService
    this.difyService = difyService
    this.configurationService = configurationService
    this.platformMappingService = platformMappingService
    this.databaseService = databaseService
    this.logger = logger

    // Rate limiting để tránh trả lời liên tục
    this.responseCooldown = new Map() // conversationId -> lastResponseTime
    this.processingMessages = new Set() // Set of message IDs currently being processed
    this.processedMessages = new Set() // Set of message IDs already processed
    this.difyMessageIds = new Map() // chatwootMessageId -> { timestamp, conversationId } - Track Dify messages để prevent duplicate forward
  }

  /**
   * Check if message is from bot itself to prevent self-loop
   * @param {Object} messageData - Raw message data
   * @returns {boolean} - True if message is from bot
   */
  isBotMessage (messageData) {
    // 1. TELEGRAM: Check from.is_bot (most reliable for Telegram)
    if (messageData.metadata?.sender?.is_bot === true) {
      return true
    }

    // 2. CHATWOOT: Check sender.type = 'agent_bot' (ONLY for AI bots, NOT real agents)
    // Real agents have sender.type = 'user' and should NOT be treated as bots
    if (messageData.metadata?.sender?.type === 'agent_bot') {
      return true
    }

    // 3. CHATWOOT: Check sender.is_bot flag (fallback)
    if (messageData.metadata?.sender?.is_bot === true) {
      return true
    }

    // ❌ DO NOT check isOutgoing or messageType === 'outgoing'
    // Because real agents also send outgoing messages!

    return false
  }

  /**
   * Execute the use case
   * @param {Object} messageData - Raw message data
   * @returns {Promise<Object>} - Processing result
   */
  async execute (messageData) {
    try {
      this.logger.info('Processing message', { messageData })

      // 1. Create message entity
      const message = this.createMessageEntity(messageData)
      message.validate()

      // 1.5. PREVENT SELF-LOOP: Check if message is from bot itself
      const isBot = this.isBotMessage(messageData)
      this.logger.info('SELF-LOOP PREVENTION: Checking if message is from bot', {
        messageId: message.id,
        conversation_id: message.conversationId,
        platform: message.platform,
        isBot,
        senderType: messageData.sender?.type || 'unknown',
        senderName: messageData.sender?.name || 'unknown',
        isOutgoing: messageData.metadata?.isOutgoing,
        messageType: messageData.metadata?.messageType,
        content: messageData.content?.substring(0, 50) || 'N/A'
      })

      if (isBot) {
        this.logger.warn('SELF-LOOP PREVENTION: Message is from bot itself, skipping', {
          messageId: message.id,
          conversation_id: message.conversationId,
          platform: message.platform,
          senderType: messageData.sender?.type || 'unknown',
          senderName: messageData.sender?.name || 'unknown',
          isOutgoing: messageData.metadata?.isOutgoing,
          messageType: messageData.metadata?.messageType
        })
        return { success: true, message: 'SELF-LOOP PREVENTED - Message is from bot itself', skipped: true }
      }

      // 2. STRONG DEDUPLICATION: Check if message is currently being processed
      if (this.processingMessages.has(message.id)) {
        this.logger.warn('DUPLICATE PREVENTION: Message is currently being processed, skipping', {
          messageId: message.id,
          conversation_id: message.conversationId,
          platform: message.platform
        })
        return { success: true, message: 'DUPLICATE PREVENTED - Message is being processed', duplicate: true }
      }

      // 3. STRONG DEDUPLICATION: Check if message already processed (in-memory)
      if (this.processedMessages.has(message.id)) {
        this.logger.warn('DUPLICATE PREVENTION: Message already processed in session, skipping', {
          messageId: message.id,
          conversation_id: message.conversationId,
          platform: message.platform
        })
        return { success: true, message: 'DUPLICATE PREVENTED - Message already processed in session', duplicate: true }
      }

      // 4. STRONG DEDUPLICATION: Check if message already processed (database)
      const messageExists = await this.messageRepository.exists(message.id)
      if (messageExists) {
        this.logger.warn('DUPLICATE PREVENTION: Message already processed in database, skipping', {
          messageId: message.id,
          conversation_id: message.conversationId,
          platform: message.platform
        })
        return { success: true, message: 'DUPLICATE PREVENTED - Message already processed in database', duplicate: true }
      }

      // 5. Mark message as being processed
      this.processingMessages.add(message.id)

      // 3. Get or create conversation
      const conversation = await this.getOrCreateConversation(message)

      // 6. Save message
      await this.messageRepository.save(message)

      // 7. Process based on platform (includes platform mappings)
      const result = await this.processByPlatform(message, conversation)

      // 8. Mark message as processed
      this.processedMessages.add(message.id)
      this.processingMessages.delete(message.id)

      this.logger.info('Message processed successfully', {
        messageId: message.id,
        conversationId: conversation.id,
        conversation_id: message.conversationId
      })

      return result
    } catch (error) {
      // Cleanup on error - use the same key as when adding to processingMessages
      const message = this.createMessageEntity(messageData)
      this.processingMessages.delete(message.id)

      this.logger.error('Failed to process message', {
        error: error.message,
        stack: error.stack,
        messageData,
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
        conversation_id: messageData.conversationId,
        platform: messageData.platform,
        messageId: messageData.id,
        senderId: messageData.senderId
      })
      throw error
    }
  }

  /**
   * Create message entity from raw data
   * @param {Object} messageData - Raw message data
   * @returns {Message}
   */
  createMessageEntity (messageData) {
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
  async getOrCreateConversation (message) {
    // Tìm conversation dựa trên platform và chat_id
    this.logger.info('Searching for existing conversation', {
      platform: message.platform,
      conversationId: message.conversationId,
      chatId: message.metadata?.chatId
    })

    let conversation = null

    // For Chatwoot messages, first try to find by chatwootId
    if (message.platform === 'chatwoot' && message.metadata?.conversationId) {
      this.logger.info('Looking up conversation by Chatwoot ID', {
        chatwootId: message.metadata.conversationId
      })
      conversation = await this.conversationRepository.findByChatwootId(message.metadata.conversationId)
      
      if (conversation) {
        this.logger.info('Found conversation by Chatwoot ID', {
          conversationId: conversation.id,
          chatwootId: conversation.chatwootId,
          platform: conversation.platform,
          chatId: conversation.chatId
        })
      }
    }

    // If not found by chatwootId, try the standard platform lookup
    if (!conversation) {
      // For Web platform, conversation already created in WebController, skip creation
      if (message.platform === 'web' && message.metadata?.webConversationId) {
        // Web conversation already exists in database - load it to get chatwoot_id and dify_id
        const webDbConversation = await this.webConversationRepository.findById(message.metadata.webConversationId)
        
        const webConversationId = `web_${message.conversationId}` // web_sessionId
        conversation = new Conversation({
          id: webConversationId,
          platform: 'web',
          chatType: 'private', // Web conversations are always private
          chatId: message.conversationId,
          senderId: message.senderId,
          senderName: message.senderName,
          // Load existing IDs from database
          chatwootId: webDbConversation?.chatwoot_conversation_id || null,
          chatwootInboxId: webDbConversation?.chatwoot_inbox_id || null,
          difyId: webDbConversation?.dify_conversation_id || null,
          participants: [{
            id: message.senderId,
            name: message.senderName,
            role: 'user'
          }],
          platformMetadata: message.metadata
        })
        
        this.logger.info('Web conversation loaded from database', {
          conversationId: webConversationId,
          webDbId: message.metadata.webConversationId,
          hasChatwootId: !!conversation.chatwootId,
          hasDifyId: !!conversation.difyId
        })
        
        // Save to repository
        await this.conversationRepository.save(conversation)
      }
      // For Telegram messages, try to find by conversation ID (which already includes bot ID)
      else if (message.platform === 'telegram') {
        const fullConversationId = `${message.platform}_${message.conversationId}`
        conversation = await this.conversationRepository.findById(fullConversationId)
      }
      
      // Fallback to standard lookup
      if (!conversation && message.platform !== 'web') {
        conversation = await this.conversationRepository.findByPlatformChatId(
          message.platform,
          message.conversationId,
          message.metadata?.botId
        )
      }
    }

    if (!conversation) {
      // Web conversations should already exist - this shouldn't happen
      if (message.platform === 'web') {
        throw new Error(`Web conversation not found for sessionId: ${message.conversationId}`)
      }
      
      this.logger.info('No existing conversation found, creating new one', {
        platform: message.platform,
        conversationId: message.conversationId
      })
      // Tạo conversation mới với thông tin chi tiết
      conversation = await this.createNewConversation(message)
    } else {
      this.logger.info('Found existing conversation', {
        conversationId: conversation.id,
        chatwootId: conversation.chatwootId,
        platform: conversation.platform,
        chatId: conversation.chatId,
        hasChatwootId: !!conversation.chatwootId
      })

      if (!conversation.chatwootId) {
        this.logger.warn('Existing conversation found but no chatwootId, will create new Chatwoot conversation', {
          conversationId: conversation.id
        })
      }

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
  async createNewConversation (message) {
    // Conversation ID already includes bot ID from MessageBrokerService
    const conversationId = `${message.platform}_${message.conversationId}`
    const botId = message.metadata?.botId
    
    const conversationData = {
      id: conversationId,
      platform: message.platform,
      chatId: message.conversationId,
      botId: botId,
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
    } else if (message.platform === 'web') {
      // Web conversations should be created in WebController already
      throw new Error('Web conversations should not be created here')
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
  async updateConversationInfo (conversation, message) {
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
  async enrichTelegramConversationData (conversationData, message) {
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
  async enrichChatwootConversationData (conversationData, message) {
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
  async processByPlatform (message, conversation) {
    const platform = new Platform(message.platform)

    if (platform.isTelegram()) {
      return await this.processTelegramMessage(message, conversation)
    } else if (platform.isChatwoot()) {
      return await this.processChatwootMessage(message, conversation)
    } else if (platform.isWeb()) {
      return await this.processWebMessage(message, conversation)
    } else {
      throw new Error(`Unsupported platform: ${message.platform}`)
    }
  }

  /**
   * Handle email command from user
   * @param {Message} message - Message entity
   * @param {Conversation} conversation - Conversation entity
   * @returns {Promise<Object>}
   */
  async handleEmailCommand (message, conversation) {
    try {
      const content = message.content?.trim().toLowerCase()
      
      // Check if message starts with /email command
      if (!content?.startsWith('/email')) {
        return { handled: false }
      }

      // Extract email from command: /email user@example.com
      const emailMatch = content.match(/\/email\s+(.+)/)
      if (!emailMatch) {
        // Send help message
        await this.telegramService.sendMessage(conversation.chatId, 
          '📧 <b>Cách sử dụng lệnh email:</b>\n\n' +
          '<code>/email your.email@example.com</code>\n\n' +
          'Ví dụ: <code>/email john.doe@gmail.com</code>\n\n' +
          'Email này sẽ được sử dụng để tạo contact trong hệ thống hỗ trợ.',
          { botToken: message.metadata?.botToken }
        )
        return { handled: true, success: true, message: 'Email help sent' }
      }

      const email = emailMatch[1].trim()
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        await this.telegramService.sendMessage(conversation.chatId,
          '❌ <b>Email không hợp lệ!</b>\n\n' +
          'Vui lòng nhập email đúng định dạng:\n' +
          '<code>/email your.email@example.com</code>',
          { botToken: message.metadata?.botToken }
        )
        return { handled: true, success: false, message: 'Invalid email format' }
      }

      // Update conversation with email
      await this.conversationRepository.updateFields(conversation.id, {
        sender_email: email
      })

      // Send confirmation
      await this.telegramService.sendMessage(conversation.chatId,
        '✅ <b>Email đã được cập nhật thành công!</b>\n\n' +
        `Email: <code>${email}</code>\n\n` +
        'Email này sẽ được sử dụng để tạo contact trong hệ thống hỗ trợ.',
        { botToken: message.metadata?.botToken }
      )

      this.logger.info('Email updated for conversation', {
        conversationId: conversation.id,
        email,
        senderId: message.senderId
      })

      return { handled: true, success: true, message: 'Email updated successfully' }
    } catch (error) {
      this.logger.error('Failed to handle email command', {
        error: error.message,
        conversationId: conversation.id,
        messageId: message.id
      })
      
      // Send error message to user
      try {
        await this.telegramService.sendMessage(conversation.chatId,
          '❌ <b>Có lỗi xảy ra khi cập nhật email!</b>\n\n' +
          'Vui lòng thử lại sau.',
          { botToken: message.metadata?.botToken }
        )
      } catch (sendError) {
        this.logger.error('Failed to send error message', { error: sendError.message })
      }
      
      return { handled: true, success: false, message: 'Failed to update email' }
    }
  }

  /**
   * Process Telegram message
   * @param {Message} message - Message entity
   * @param {Conversation} conversation - Conversation entity
   * @returns {Promise<Object>}
   */
  async processTelegramMessage (message, conversation) {
    try {
      // 0. Check if this is an email command from user
      const emailResult = await this.handleEmailCommand(message, conversation)
      if (emailResult.handled) {
        return emailResult
      }

      // 1. Get platform mapping configuration for this Telegram bot
      const telegramBotId = await this.getTelegramBotIdFromMessage(message)
      const routingConfig = await this.platformMappingService.getRoutingConfiguration(telegramBotId)

      if (!routingConfig.hasMapping) {
        this.logger.warn('No platform mapping found for Telegram bot', {
          telegramBotId,
          conversationId: conversation.id
        })
        return {
          success: false,
          error: 'No platform mapping configured for this Telegram bot'
        }
      }

      // 2. Process based on routing configuration
      const results = {
        chatwootConversationId: null,
        difyConversationId: null,
        responses: []
      }

      // Process each mapping
      for (const mapping of routingConfig.mappings) {
        const mappingResult = await this.processTelegramMessageWithMapping(
          message,
          conversation,
          mapping
        )

        if (mappingResult.chatwootConversationId) {
          results.chatwootConversationId = mappingResult.chatwootConversationId
        }
        if (mappingResult.difyConversationId) {
          results.difyConversationId = mappingResult.difyConversationId
        }
        if (mappingResult.response) {
          results.responses.push(mappingResult.response)
        }
      }

      return {
        success: true,
        ...results,
        note: 'Message processed with platform routing'
      }
    } catch (error) {
      this.logger.error('Failed to process Telegram message with routing', {
        error: error.message,
        conversationId: conversation.id,
        messageId: message.id
      })
      throw error
    }
  }

  /**
   * Process Telegram message with specific mapping
   * @param {Message} message - Message entity
   * @param {Conversation} conversation - Conversation entity
   * @param {Object} mapping - Platform mapping configuration
   * @returns {Promise<Object>}
   */
  async processTelegramMessageWithMapping (message, conversation, mapping) {
    const results = {
      chatwootConversationId: null,
      difyConversationId: null,
      response: null
    }

    try {
      // 1. Handle Chatwoot routing or auto-connect
      const shouldConnectChatwoot = (mapping.routing.telegramToChatwoot || mapping.autoConnect?.telegramChatwoot) && mapping.chatwootAccountId
      if (shouldConnectChatwoot) {
        const chatwootResult = await this.processTelegramToChatwoot(
          message,
          conversation,
          mapping.chatwootAccountId
        )
        results.chatwootConversationId = chatwootResult.conversationId
      }

      // 2. Handle Dify routing or auto-connect
      // Check if bot was mentioned in group chat (or if it's a private chat)
      const shouldRespondWithDify = message.metadata?.shouldRespondWithDify ?? true // Use metadata value, default to true if not set
      
      this.logger.info('Debug shouldRespondWithDify in ProcessMessageUseCase', {
        messageMetadataShouldRespondWithDify: message.metadata?.shouldRespondWithDify,
        finalShouldRespondWithDify: shouldRespondWithDify,
        messageMetadataKeys: Object.keys(message.metadata || {}),
        isGroupChat: message.metadata?.isGroupChat,
        isBotMentioned: message.metadata?.isBotMentioned
      })
      
      this.logger.info('Checking Dify routing configuration', {
        mappingId: mapping.id,
        hasTelegramToDify: !!mapping.routing?.telegramToDify,
        hasDifyAppId: !!mapping.difyAppId,
        difyAppId: mapping.difyAppId,
        routing: mapping.routing,
        fullMapping: mapping,
        isGroupChat: !!message.metadata?.isGroupChat,
        isBotMentioned: !!message.metadata?.isBotMentioned,
        shouldRespondWithDify
      })

      const shouldConnectDify = (mapping.routing.telegramToDify || mapping.autoConnect?.telegramDify) && mapping.difyAppId && shouldRespondWithDify
      if (shouldConnectDify) {
        this.logger.info('Processing message to Dify', {
          conversationId: conversation.id,
          difyAppId: mapping.difyAppId,
          isGroupChat: message.metadata?.isGroupChat,
          isBotMentioned: message.metadata?.isBotMentioned
        })

        try {
          const difyResult = await this.processTelegramToDify(
            message,
            conversation,
            mapping.difyAppId
          )
          results.difyConversationId = difyResult.conversationId
          results.response = difyResult.response

          this.logger.info('Dify processing completed successfully', {
            conversationId: conversation.id,
            difyConversationId: difyResult.conversationId
          })

          // If configured, forward Dify response back to Telegram immediately
          if (mapping.routing?.difyToTelegram && difyResult.response && conversation.chatId) {
            try {
              await this.telegramService.sendMessage(
                conversation.chatId,
                difyResult.response,
                { botToken: await this.getTelegramBotToken(mapping.telegramBotId) }
              )
              this.logger.info('Dify response forwarded to Telegram (Telegram-origin message)', {
                chatId: conversation.chatId,
                conversationId: conversation.id
              })
            } catch (e) {
              this.logger.error('Failed to forward Dify response to Telegram (Telegram-origin message)', { error: e.message })
            }
          }
        } catch (difyError) {
          this.logger.error('Dify processing failed, continuing without it', {
            error: difyError.message,
            conversationId: conversation.id,
            stack: difyError.stack
          })
          // Continue without Dify
        }
      } else {
        this.logger.info('Dify routing not configured, disabled, or bot not mentioned in group', {
          mappingId: mapping.id,
          hasTelegramToDify: !!mapping.routing?.telegramToDify,
          hasDifyAppId: !!mapping.difyAppId,
          shouldRespondWithDify,
          reason: !shouldRespondWithDify ? 'Bot not mentioned in group chat' :
                  !mapping.difyAppId ? 'No Dify app ID configured' :
                  'Dify routing disabled'
        })
      }

      // 3. Handle combined routing (Telegram -> Chatwoot + Dify -> Chatwoot)
      if (mapping.routing.telegramToChatwoot &&
          mapping.routing.telegramToDify &&
          mapping.routing.difyToChatwoot &&
          results.chatwootConversationId &&
          results.difyConversationId &&
          results.response) {
        await this.processDifyResponseToChatwoot(
          results.response,
          results.chatwootConversationId,
          conversation.id
        )
      }

      return results
    } catch (error) {
      this.logger.error('Failed to process Telegram message with mapping', {
        error: error.message,
        mappingId: mapping.id,
        conversationId: conversation.id
      })
      throw error
    }
  }

  /**
   * Process Web message (from landing page chat widget)
   * Similar to processTelegramMessage - uses platform routing
   * @param {Message} message - Message entity
   * @param {Conversation} conversation - Conversation entity
   * @returns {Promise<Object>}
   */
  async processWebMessage (message, conversation) {
    try {
      this.logger.info('Processing web message', {
        messageId: message.id,
        conversationId: conversation.id,
        webAppId: message.metadata?.webAppId
      })

      // 1. Get platform mapping configuration for this Web App
      const webAppId = message.metadata?.webAppId
      if (!webAppId) {
        throw new Error('Web app ID not found in message metadata')
      }

      // Find platform mappings for this web app (similar to Telegram routing)
      const mappings = await this.platformMappingService.findBySourcePlatform('web', webAppId)

      if (!mappings || mappings.length === 0) {
        this.logger.error('No platform mapping configured for Web app', {
          webAppId,
          conversationId: conversation.id
        })
        
        // Throw error instead of returning default message
        // Web app must be properly configured with platform mappings
        throw new Error(`No platform mapping configured for web app ID ${webAppId}. Please configure routing in admin panel.`)
      }

      // 2. Process with the first available mapping (similar to Telegram)
      const mapping = mappings[0]
      
      this.logger.info('Found platform mapping for web app', {
        mappingId: mapping.id,
        hasChatwoot: !!mapping.chatwoot_account_id,
        hasDify: !!mapping.dify_app_id,
        webAppId
      })

      const results = {
        chatwootConversationId: null,
        difyConversationId: null,
        response: null
      }

      // 3. Save user message to web_messages table
      const webConversationId = message.metadata?.webConversationId
      if (webConversationId && this.webMessageRepository) {
        try {
          await this.webMessageRepository.create({
            webConversationId,
            content: message.content,
            messageType: 'user',
            metadata: {
              userInfo: message.sender
            }
          })
          this.logger.info('User message saved to web_messages', {
            webConversationId,
            conversationId: conversation.id
          })
        } catch (error) {
          this.logger.error('Failed to save user message to web_messages', {
            error: error.message,
            webConversationId,
            conversationId: conversation.id
          })
          // Continue even if save fails
        }
      }

      // 4. Send to Chatwoot if configured
      if (mapping.chatwoot_account_id) {
        try {
          const chatwootResult = await this.processWebToChatwoot(
            message,
            conversation,
            mapping.chatwoot_account_id
          )
          results.chatwootConversationId = chatwootResult.conversationId
          
          // Update web_conversations table with Chatwoot IDs
          if (webConversationId && this.webConversationRepository) {
            try {
              await this.webConversationRepository.update(webConversationId, {
                chatwootConversationId: results.chatwootConversationId,
                chatwootContactId: chatwootResult.contactId
              })
              this.logger.info('web_conversations updated with Chatwoot IDs', {
                webConversationId,
                chatwootConversationId: results.chatwootConversationId
              })
            } catch (updateError) {
              this.logger.error('Failed to update web_conversations with Chatwoot IDs', {
                error: updateError.message,
                webConversationId
              })
            }
          }
          
          this.logger.info('Web message sent to Chatwoot successfully', {
            chatwootConversationId: results.chatwootConversationId,
            conversationId: conversation.id
          })
        } catch (error) {
          this.logger.error('Failed to send web message to Chatwoot', {
            error: error.message,
            conversationId: conversation.id
          })
          // Continue even if Chatwoot fails - still try Dify
        }
      }

      // 5. Send to Dify if configured
      if (mapping.dify_app_id) {
        try {
          const difyResult = await this.processWebToDify(
            message,
            conversation,
            mapping.dify_app_id
          )
          results.difyConversationId = difyResult.conversationId
          results.response = difyResult.response

          // 5a. Update conversation with Dify conversation ID for future messages
          if (difyResult.conversationId && conversation.difyId !== difyResult.conversationId) {
            conversation.difyId = difyResult.conversationId
            
            try {
              await this.conversationRepository.updateFields(conversation.id, {
                dify_id: difyResult.conversationId
              })
              this.logger.info('Conversation updated with Dify ID', {
                conversationId: conversation.id,
                difyId: difyResult.conversationId
              })
            } catch (updateError) {
              this.logger.error('Failed to update conversation with Dify ID', {
                error: updateError.message,
                conversationId: conversation.id
              })
            }

            // Also update web_conversations table
            if (webConversationId && this.webConversationRepository) {
              try {
                await this.webConversationRepository.update(webConversationId, {
                  difyConversationId: difyResult.conversationId
                })
                this.logger.info('web_conversations updated with Dify ID', {
                  webConversationId,
                  difyConversationId: difyResult.conversationId
                })
              } catch (updateError) {
                this.logger.error('Failed to update web_conversations with Dify ID', {
                  error: updateError.message,
                  webConversationId
                })
              }
            }
          }

          this.logger.info('Web message sent to Dify successfully', {
            difyConversationId: results.difyConversationId,
            hasResponse: !!results.response,
            responseLength: results.response?.length,
            conversationId: conversation.id
          })

          // 5b. Save AI response to web_messages table
          if (results.response && webConversationId && this.webMessageRepository) {
            try {
              await this.webMessageRepository.create({
                webConversationId,
                content: results.response,
                messageType: 'ai',
                difyMessageId: results.difyConversationId,
                metadata: {
                  source: 'dify',
                  difyConversationId: results.difyConversationId
                }
              })
              this.logger.info('AI response saved to web_messages', {
                webConversationId,
                conversationId: conversation.id,
                responseLength: results.response.length
              })
            } catch (error) {
              this.logger.error('Failed to save AI response to web_messages', {
                error: error.message,
                webConversationId
              })
              // Continue even if save fails
            }
          }

          // 5c. Forward Dify response to Chatwoot if both are configured
          if (results.chatwootConversationId && results.response) {
            try {
              await this.processDifyResponseToChatwoot(
                results.response,
                results.chatwootConversationId,
                conversation.id
              )
              this.logger.info('Dify response forwarded to Chatwoot', {
                chatwootConversationId: results.chatwootConversationId,
                conversationId: conversation.id
              })
            } catch (fwdError) {
              this.logger.error('Failed to forward Dify response to Chatwoot', {
                error: fwdError.message,
                conversationId: conversation.id
              })
              // Don't fail the whole request if forwarding fails
            }
          }
        } catch (error) {
          this.logger.error('Failed to send web message to Dify', {
            error: error.message,
            stack: error.stack,
            conversationId: conversation.id
          })
          
          // If Dify fails, throw error (no default fallback message)
          throw new Error(`Failed to process message with AI: ${error.message}`)
        }
      }

      // 6. Require at least one valid response
      if (!results.response) {
        this.logger.error('No response generated from any platform', {
          hasChatwoot: !!mapping.chatwoot_account_id,
          hasDify: !!mapping.dify_app_id,
          conversationId: conversation.id
        })
        throw new Error('No response generated. Please check platform mapping configuration.')
      }

      return {
        success: true,
        ...results,
        note: 'Web message processed with platform routing (similar to Telegram)'
      }
    } catch (error) {
      this.logger.error('Failed to process Web message', {
        error: error.message,
        stack: error.stack,
        conversationId: conversation.id,
        messageId: message.id
      })
      
      // Re-throw error to be handled by caller
      throw error
    }
  }

  /**
   * Process Web message to Chatwoot
   * @param {Message} message - Message entity
   * @param {Conversation} conversation - Conversation entity
   * @param {number} chatwootAccountId - Chatwoot account ID
   * @returns {Promise<Object>}
   */
  async processWebToChatwoot (message, conversation, chatwootAccountId) {
    try {
      // Similar to Telegram -> Chatwoot flow
      await this.chatwootService.initializeWithAccountId(chatwootAccountId)

      let chatwootConversation
      try {
        chatwootConversation = await this.chatwootService.createOrUpdateConversation(
          conversation,
          message,
          chatwootAccountId
        )

        this.logger.info('Chatwoot conversation created/updated for web', {
          conversationId: conversation.id,
          chatwootConversationId: chatwootConversation.id
        })
      } catch (error) {
        this.logger.error('Failed to create/update Chatwoot conversation for web', {
          error: error.message,
          conversationId: conversation.id
        })
        throw error
      }

      // Update conversation with Chatwoot ID
      conversation.chatwootId = chatwootConversation.id
      conversation.chatwootInboxId = chatwootConversation.inbox_id || 'auto-created'
      
      try {
        await this.conversationRepository.updateFields(conversation.id, {
          chatwoot_id: chatwootConversation.id,
          chatwoot_inbox_id: chatwootConversation.inbox_id || 'auto-created'
        })
        this.logger.info('Web conversation updated with Chatwoot IDs', {
          conversationId: conversation.id,
          chatwootId: chatwootConversation.id
        })
      } catch (updateError) {
        this.logger.error('Failed to update conversation with Chatwoot IDs', {
          error: updateError.message,
          conversationId: conversation.id
        })
        // Continue even if update fails
      }

      // NOTE: Message already sent in createOrUpdateConversation, no need to send again
      // This prevents duplicate messages in Chatwoot

      this.logger.info('Web message sent to Chatwoot', {
        conversationId: conversation.id,
        chatwootConversationId: chatwootConversation.id
      })

      return { 
        conversationId: chatwootConversation.id,
        contactId: chatwootConversation.meta?.sender?.id 
      }
    } catch (error) {
      this.logger.error('Failed to process web to Chatwoot', {
        error: error.message,
        conversationId: conversation.id
      })
      throw error
    }
  }

  /**
   * Process Web message to Dify
   * @param {Message} message - Message entity
   * @param {Conversation} conversation - Conversation entity
   * @param {number} difyAppId - Dify app ID
   * @returns {Promise<Object>}
   */
  async processWebToDify (message, conversation, difyAppId) {
    try {
      await this.difyService.initializeWithAppId(difyAppId)

      const difyResult = await this.difyService.sendMessage(
        conversation,
        message.content,
        { difyAppId }
      )

      this.logger.info('Web message sent to Dify', {
        conversationId: conversation.id,
        difyConversationId: difyResult.conversationId
      })

      return {
        conversationId: difyResult.conversationId,
        response: difyResult.response
      }
    } catch (error) {
      this.logger.error('Failed to process web to Dify', {
        error: error.message,
        conversationId: conversation.id
      })
      throw error
    }
  }

  /**
   * Process Telegram to Chatwoot routing
   * @param {Message} message - Message entity
   * @param {Conversation} conversation - Conversation entity
   * @param {number} chatwootAccountId - Chatwoot account ID
   * @returns {Promise<Object>}
   */
  async processTelegramToChatwoot (message, conversation, chatwootAccountId) {
    try {
      // Create/update Chatwoot conversation
      this.logger.info('Starting Chatwoot conversation creation/update', {
        conversationId: conversation.id,
        chatwootAccountId,
        hasChatwootId: !!conversation.chatwootId
      })

      let chatwootConversation
      try {
        chatwootConversation = await this.chatwootService.createOrUpdateConversation(
          conversation,
          message,
          chatwootAccountId
        )

        this.logger.info('Chatwoot conversation created/updated successfully', {
          conversationId: conversation.id,
          chatwootConversationId: chatwootConversation.id
        })
      } catch (conversationError) {
        this.logger.error('Failed to create/update Chatwoot conversation', {
          error: conversationError.message,
          conversationId: conversation.id,
          stack: conversationError.stack
        })
        throw conversationError
      }

      // Update conversation with Chatwoot ID and Inbox ID
      this.logger.info('Updating conversation with Chatwoot IDs', {
        conversationId: conversation.id,
        chatwootId: chatwootConversation.id,
        chatwootInboxId: chatwootConversation.inbox_id || 'auto-created'
      })

      conversation.chatwootId = chatwootConversation.id
      conversation.chatwootInboxId = chatwootConversation.inbox_id || 'auto-created'

      try {
        await this.conversationRepository.updateFields(conversation.id, {
          chatwoot_id: chatwootConversation.id,
          chatwoot_inbox_id: chatwootConversation.inbox_id || 'auto-created'
        })
        this.logger.info('Conversation updated successfully with Chatwoot IDs', {
          conversationId: conversation.id,
          chatwootId: chatwootConversation.id,
          chatwootInboxId: chatwootConversation.inbox_id || 'auto-created'
        })
      } catch (updateError) {
        this.logger.error('Failed to update conversation with Chatwoot IDs', {
          error: updateError.message,
          conversationId: conversation.id,
          chatwootId: conversation.chatwootId,
          chatwootInboxId: conversation.chatwootInboxId,
          stack: updateError.stack
        })
        throw updateError
      }

      // Send auto-reply from bot (like old code)
      this.logger.info('Attempting to send bot reply', {
        conversationId: conversation.id,
        chatId: conversation.chatId,
        messageId: message.metadata?.messageId
      })

      // Skip bot reply for now to test conversation creation
      this.logger.info('Skipping bot reply for now to test conversation creation', {
        conversationId: conversation.id
      })

      return {
        conversationId: chatwootConversation.id
      }
    } catch (error) {
      this.logger.error('Failed to process Telegram to Chatwoot', {
        error: error.message,
        conversationId: conversation.id,
        messageId: message.id
      })
      throw error
    }
  }

  /**
   * Send bot reply to Telegram (like old code)
   * @param {Message} message - Message entity
   * @param {Conversation} conversation - Conversation entity
   */
  async sendBotReply (message, conversation) {
    try {
      // Simple auto-reply logic (like old code)
      const replyText = 'Cảm ơn bạn đã liên hệ! Tin nhắn của bạn đã được gửi đến đội ngũ hỗ trợ. Chúng tôi sẽ phản hồi sớm nhất có thể. 🙏'

      // Get bot token for this conversation
      const telegramBotId = await this.getTelegramBotIdFromMessage(message)
      const botToken = await this.getTelegramBotToken(telegramBotId)

      // Send reply to Telegram
      await this.telegramService.sendMessage(
        conversation.chatId,
        replyText,
        {
          reply_to_message_id: message.metadata.messageId,
          botToken
        }
      )

      this.logger.info('Bot reply sent to Telegram', {
        conversationId: conversation.id,
        chatId: conversation.chatId,
        messageId: message.metadata.messageId,
        telegramBotId
      })
    } catch (error) {
      this.logger.error('Failed to send bot reply to Telegram', {
        error: error.message,
        conversationId: conversation.id,
        chatId: conversation.chatId
      })
      throw error
    }
  }

  /**
   * Process Telegram to Dify routing
   * @param {Message} message - Message entity
   * @param {Conversation} conversation - Conversation entity
   * @param {number} difyAppId - Dify app ID
   * @returns {Promise<Object>}
   */
  async processTelegramToDify (message, conversation, difyAppId) {
    // Send message to Dify
    const difyResponse = await this.difyService.sendMessage(
      conversation,
      message.getFormattedContent(),
      { difyAppId }
    )

    // Update conversation with Dify conversation_id from API response
    this.logger.info('Updating conversation with Dify conversation_id from API response', {
      dbConversationId: conversation.id,
      difyConversationId: difyResponse.conversationId,
      note: 'difyResponse.conversationId comes from Dify API response.data.conversation_id'
    })

    conversation.difyId = difyResponse.conversationId

    await this.conversationRepository.update(conversation)

    this.logger.info('Conversation updated successfully with Dify ID', {
      conversationId: conversation.id,
      difyId: conversation.difyId
    })

    return {
      conversationId: difyResponse.conversationId,
      response: difyResponse.response
    }
  }

  /**
   * Process Dify response to Chatwoot
   * @param {string} response - Dify response
   * @param {string} chatwootConversationId - Chatwoot conversation ID
   * @param {string} conversationId - Internal conversation ID
   * @returns {Promise<void>}
   */
  async processDifyResponseToChatwoot (response, chatwootConversationId, conversationId) {
    if (!response || !response.trim()) {
      return
    }

    // Check cooldown
    const difyConfig = await this.configurationService.getDifyConfig()
    const now = Date.now()
    const lastResponseTime = this.responseCooldown.get(conversationId) || 0

    if (now - lastResponseTime < difyConfig.cooldownPeriod) {
      this.logger.info('Response skipped due to cooldown', {
        conversationId,
        timeSinceLastResponse: now - lastResponseTime,
        cooldownPeriod: difyConfig.cooldownPeriod
      })
      return
    }

    // Update cooldown
    this.responseCooldown.set(conversationId, now)

    // Send response to Chatwoot as outgoing message (from bot/agent)
    const singleResponse = response.trim()
    const result = await this.chatwootService.sendMessage(
      chatwootConversationId,
      singleResponse,
      { 
        message_type: 'outgoing'
      }
    )

    // GHI NHẬN messageId để tránh forward duplicate về Telegram
    if (result?.id) {
      this.difyMessageIds.set(result.id, {
        timestamp: Date.now(),
        conversationId: chatwootConversationId
      })
      this.logger.info('✅ Tracked Dify message to prevent duplicate forward to Telegram', {
        difyMessageId: result.id,
        chatwootConversationId
      })
    }

    this.logger.info('Dify response sent to Chatwoot', {
      chatwootConversationId,
      responseLength: singleResponse.length,
      messageId: result?.id
    })
  }

  /**
   * Get Telegram bot ID from message
   * @param {Message} message - Message entity
   * @returns {Promise<number>}
   */
  async getTelegramBotIdFromMessage (message) {
    this.logger.info('Getting Telegram bot ID from message', {
      messageKeys: Object.keys(message),
      hasMetadata: !!message.metadata,
      hasBotId: !!message.botId,
      hasMetadataBotId: !!message.metadata?.botId
    })

    // Try to get bot ID from message metadata (if available)
    if (message.botId) {
      this.logger.info('Using bot ID from message', { botId: message.botId })
      return message.botId
    }
    if (message.metadata?.botId) {
      this.logger.info('Using bot ID from message metadata', { botId: message.metadata.botId })
      return message.metadata.botId
    }

    // Try to find bot ID by secret token (recommended) or matching webhook
    try {
      // 1) via secret token if configured
      if (message.metadata?.secretToken) {
        const botId = await this.databaseService.getBotIdBySecretToken(message.metadata.secretToken)
        if (botId) {
          this.logger.info('Resolved Telegram bot by secret token', { botId })
          return botId
        }
      }

      // 2) fallback: get first active bot
      const botId = await this.databaseService.getFirstActiveBotId()
      if (botId) {
        this.logger.info('First active bot ID retrieved', { botId })
        return botId
      }
    } catch (error) {
      this.logger.error('Failed to find Telegram bot from database', { error: error.message })
    }

    // Final fallback
    this.logger.warn('Using fallback bot ID: 1')
    return 1
  }

  /**
   * Process Chatwoot message
   * @param {Message} message - Message entity
   * @param {Conversation} conversation - Conversation entity
   * @returns {Promise<Object>}
   */
  async processChatwootMessage (message, conversation) {
    // Use the same bot detection logic as in execute()
    const isFromBot = this.isBotMessage(message)

    if (isFromBot) {
      this.logger.info('Skipping bot message to prevent loop', {
        messageId: message.id,
        conversationId: conversation.id,
        isOutgoing: message.metadata?.isOutgoing,
        messageType: message.metadata?.messageType,
        senderIsBot: message.metadata?.sender?.is_bot
      })
      return {
        success: true,
        note: 'Bot message skipped to prevent response loop'
      }
    }

    // 0. Load routing configuration via Chatwoot external account id if present
    const chatwootExternalAccountId = message.metadata?.accountId || message.metadata?.account_id
    let routingConfig = { hasMapping: false, mappings: [] }

    this.logger.info('Debug message metadata', {
      hasMetadata: !!message.metadata,
      accountId: message.metadata?.accountId,
      account_id: message.metadata?.account_id,
      chatwootExternalAccountId
    })

    if (chatwootExternalAccountId) {
      try {
        routingConfig = await this.platformMappingService.getRoutingConfigurationByChatwootExternalAccountId(chatwootExternalAccountId)
      } catch (e) {
        this.logger.warn('Failed to load routing config by Chatwoot external account id, continuing with defaults', { error: e.message })
      }
    }

    // 1. Send message to Dify (REALTIME mode - no conversation history) if mapping allows or no mapping present
    let difyResponse = { conversationId: conversation.difyId, response: null }
    const anyMappingAllowsDify = routingConfig.hasMapping ? routingConfig.mappings.some(m => m.routing?.difyToChatwoot || m.routing?.difyToTelegram || m.routing?.telegramToDify) : true

    this.logger.info('Dify processing check (REALTIME mode)', {
      hasMapping: routingConfig.hasMapping,
      anyMappingAllowsDify,
      difyServiceExists: !!this.difyService,
      conversationId: conversation.id,
      messageContent: message.content.substring(0, 50),
      mode: 'REALTIME',
      note: 'Each message processed independently without conversation history',
      hasDifyId: !!conversation.difyId,
      difyId: conversation.difyId
    })

    if (anyMappingAllowsDify) {
      try {
        // Initialize Dify service with specific app ID from routing config
        if (routingConfig.hasMapping && routingConfig.mappings.length > 0) {
          this.logger.info('Debug routing config mappings', {
            mappingCount: routingConfig.mappings.length,
            mappings: routingConfig.mappings.map(m => ({
              id: m.id,
              difyAppId: m.difyAppId,
              chatwootAccountId: m.chatwootAccountId,
              telegramBotId: m.telegramBotId
            }))
          })

          const difyMapping = routingConfig.mappings.find(m => m.difyAppId)
          if (difyMapping && difyMapping.difyAppId) {
            this.logger.info('Initializing Dify service with app ID from routing config', {
              difyAppId: difyMapping.difyAppId
            })
            await this.difyService.initializeWithAppId(difyMapping.difyAppId)
          } else {
            this.logger.warn('No Dify app ID found in routing config, cannot initialize Dify service', {
              availableMappings: routingConfig.mappings.map(m => ({
                id: m.id,
                hasDifyAppId: !!m.difyAppId,
                difyAppId: m.difyAppId
              }))
            })
            throw new Error('No Dify app ID found in routing configuration')
          }
        } else {
          this.logger.warn('No routing config found, cannot initialize Dify service')
          throw new Error('No routing configuration found')
        }

        // Reload conversation from database to get latest difyId before sending to Dify
        const freshConversation = await this.conversationRepository.findById(conversation.id)
        if (freshConversation) {
          this.logger.info('Using fresh conversation data for Dify', {
            dbConversationId: freshConversation.id,
            oldDifyId: conversation.difyId,
            newDifyId: freshConversation.difyId
          })
          // Update conversation object with fresh difyId
          conversation.difyId = freshConversation.difyId
        } else {
          this.logger.warn('Could not reload conversation from database', {
            dbConversationId: conversation.id
          })
        }

        difyResponse = await this.difyService.sendMessage(
          conversation,
          message.content
        )

        this.logger.info('Dify response received', {
          conversationId: difyResponse.conversationId,
          hasResponse: !!difyResponse.response,
          responseLength: difyResponse.response?.length || 0,
          usedConversationId: conversation.difyId,
          newConversationId: difyResponse.conversationId
        })

        // Update conversation with new difyId
        if (difyResponse.conversationId) {
          conversation.difyId = difyResponse.conversationId
        }
      } catch (difyError) {
        this.logger.error('Dify processing failed', {
          error: difyError.message,
          stack: difyError.stack,
          conversationId: conversation.id,
          difyAppId: routingConfig.mappings?.[0]?.difyAppId,
          apiUrl: this.difyService?.apiUrl
        })
        // Continue without Dify response but provide a fallback
        difyResponse = {
          conversationId: conversation.difyId || 'fallback-conversation',
          response: 'Xin lỗi, hệ thống AI đang gặp sự cố. Vui lòng thử lại sau.'
        }
      }
    }

    // 2. Update conversation with difyId để duy trì context trong DB
    if (difyResponse.conversationId) {
      conversation.difyId = difyResponse.conversationId
    }

    try {
      await this.conversationRepository.update(conversation)
      this.logger.info('Conversation updated in database successfully', {
        dbConversationId: conversation.id,
        difyId: conversation.difyId
      })
    } catch (updateError) {
      this.logger.error('Failed to update conversation in database', {
        error: updateError.message,
        dbConversationId: conversation.id,
        difyId: conversation.difyId
      })
    }

    // 3a. Send response back to Chatwoot (chỉ gửi một lần) if mapping allows
    const allowDifyToChatwoot = !routingConfig.hasMapping || routingConfig.mappings.some(m => m.routing?.difyToChatwoot)

    this.logger.info('Checking if should send response to Chatwoot', {
      allowDifyToChatwoot,
      hasDifyResponse: !!difyResponse,
      hasResponse: !!difyResponse?.response,
      responseLength: difyResponse?.response?.length || 0,
      responsePreview: difyResponse?.response?.substring(0, 100) || 'N/A',
      conversation_id: conversation.id
    })

    if (allowDifyToChatwoot && difyResponse?.response && difyResponse.response.trim()) {
      // Get cooldown configuration from database
      const difyConfig = await this.configurationService.getDifyConfig()

      // SMART DEDUPLICATION: Chỉ ngăn duplicate cho cùng 1 message, cho phép tin nhắn mới
      const now = Date.now()
      const lastResponseTime = this.responseCooldown.get(conversation.id) || 0
      const cooldownPeriod = difyConfig.cooldownPeriod || 5000 // 5 seconds default (ngắn hơn)

      // Kiểm tra cooldown ngắn (chỉ 5 giây) để tránh spam
      if (now - lastResponseTime < cooldownPeriod) {
        this.logger.warn('DUPLICATE PREVENTION: Response skipped due to short cooldown', {
          conversationId: conversation.id,
          timeSinceLastResponse: now - lastResponseTime,
          cooldownPeriod,
          conversation_id: conversation.id,
          messageId: message.id
        })
        return {
          success: true,
          difyConversationId: difyResponse.conversationId,
          note: `DUPLICATE PREVENTED - Response skipped due to cooldown (${cooldownPeriod}ms)`,
          skipped: true,
          duplicate: true
        }
      }

      // Cập nhật cooldown
      this.responseCooldown.set(conversation.id, now)

      this.logger.info('DUPLICATE PREVENTION: All checks passed - proceeding with response', {
        conversationId: conversation.id,
        timeSinceLastResponse: now - lastResponseTime,
        cooldownPeriod,
        conversation_id: conversation.id
      })

      // Đảm bảo chỉ gửi 1 tin nhắn duy nhất
      const singleResponse = difyResponse.response.trim()
      this.logger.info('Sending SINGLE response to Chatwoot', {
        conversationId: conversation.chatwootId,
        responseLength: singleResponse.length,
        responsePreview: singleResponse.substring(0, 100) + (singleResponse.length > 100 ? '...' : ''),
        conversation_id: conversation.id
      })

      // Lấy access token từ chatwoot_accounts trước khi gửi tin nhắn
      const chatwootAccount = await this.getChatwootAccountByExternalAccountId(conversation.metadata?.accountId || 1)
      if (chatwootAccount && chatwootAccount.access_token) {
        this.chatwootService.setAccessToken(chatwootAccount.access_token)
      }

      // Khởi tạo ChatwootService với account ID trước khi gửi tin nhắn
      this.logger.info('Initializing ChatwootService before sending message', {
        conversationId: conversation.chatwootId,
        accountId: conversation.metadata?.accountId || 1,
        conversation_id: conversation.id
      })

      // Initialize ChatwootService (it will auto-load bot token from database)
      await this.chatwootService.initializeWithAccountId(conversation.metadata?.accountId || 1)

      // Gửi chỉ 1 tin nhắn duy nhất
      const result = await this.chatwootService.sendMessage(
        conversation.chatwootId,
        singleResponse,
        { 
          message_type: 'outgoing'
        }
      )

      // GHI NHẬN messageId để tránh forward duplicate về Telegram
      if (result?.id) {
        this.difyMessageIds.set(result.id, {
          timestamp: Date.now(),
          conversationId: conversation.chatwootId
        })
        this.logger.info('✅ Tracked Dify message to prevent duplicate forward to Telegram', {
          difyMessageId: result.id,
          chatwootConversationId: conversation.chatwootId
        })
      }

      this.logger.info('Single response sent successfully', {
        conversationId: conversation.chatwootId,
        messageId: message.id,
        difyMessageId: result?.id,
        conversation_id: conversation.id
      })
    } else {
      this.logger.warn('No valid response from Dify to send to Chatwoot', {
        conversationId: conversation.chatwootId,
        difyResponse,
        hasResponse: !!difyResponse?.response,
        responseLength: difyResponse?.response?.length || 0,
        allowDifyToChatwoot,
        conversation_id: conversation.id
      })

      // ✅ CHỈ gửi fallback cho message GỐC từ Telegram/user qua Chatwoot
      // Logic: Nếu message này từ Chatwoot webhook (platform = 'chatwoot'), SKIP fallback
      const isFromChatwootWebhook = message.platform === 'chatwoot'
      
      if (difyResponse?.conversationId && !difyResponse?.response && !isFromChatwootWebhook) {
        this.logger.info('Sending fallback response due to empty Dify response', {
          conversationId: conversation.chatwootId,
          conversation_id: conversation.id,
          messageOrigin: message.platform
        })

        try {
          const fallbackMessage = 'Xin lỗi, tôi không thể tạo phản hồi phù hợp lúc này. Vui lòng thử lại sau.'

          // Get access token from chatwoot_accounts
          const chatwootAccount = await this.getChatwootAccountByExternalAccountId(conversation.metadata?.accountId || 1)
          if (chatwootAccount && chatwootAccount.access_token) {
            this.chatwootService.setAccessToken(chatwootAccount.access_token)
          }

          // Khởi tạo ChatwootService với account ID trước khi gửi fallback message
          this.logger.info('Initializing ChatwootService for fallback message', {
            conversationId: conversation.chatwootId,
            accountId: conversation.metadata?.accountId || 1,
            conversation_id: conversation.id
          })

          // Initialize ChatwootService (it will auto-load bot token from database)
          await this.chatwootService.initializeWithAccountId(conversation.metadata?.accountId || 1)

          const fallbackResult = await this.chatwootService.sendMessage(
            conversation.chatwootId,
            fallbackMessage,
            { 
              message_type: 'outgoing'
            }
          )

          // GHI NHẬN fallback messageId
          if (fallbackResult?.id) {
            this.difyMessageIds.set(fallbackResult.id, {
              timestamp: Date.now(),
              conversationId: conversation.chatwootId
            })
            this.logger.info('✅ Tracked Dify fallback message to prevent duplicate forward to Telegram', {
              fallbackMessageId: fallbackResult.id,
              chatwootConversationId: conversation.chatwootId
            })
          }

          this.logger.info('Fallback response sent to Chatwoot', {
            conversationId: conversation.chatwootId,
            fallbackMessageId: fallbackResult?.id,
            conversation_id: conversation.id
          })
        } catch (fallbackError) {
          this.logger.error('Failed to send fallback response to Chatwoot', {
            error: fallbackError.message,
            conversationId: conversation.chatwootId,
            conversation_id: conversation.id
          })
        }
      } else if (isFromChatwootWebhook) {
        this.logger.info('Skipping fallback response for Chatwoot agent message (prevent spam loop)', {
          conversationId: conversation.chatwootId,
          messageId: message.id,
          conversation_id: conversation.id
        })
      }
    }

    // 3b. Optionally send response to Telegram if mapping allows
    const allowDifyToTelegram = routingConfig.hasMapping && routingConfig.mappings.some(m => m.routing?.difyToTelegram)
    if (allowDifyToTelegram && difyResponse.response) {
      try {
        // Map Chatwoot conversation to original Telegram chat
        const telegramConversation = await this.conversationRepository.findByChatwootId(conversation.chatwootId)
        if (telegramConversation && telegramConversation.chatId) {
          // Extract bot ID from chatId (format: {userId}_bot_{botId})
          const botIdMatch = telegramConversation.chatId.match(/_bot_(\d+)$/)
          const botId = botIdMatch ? botIdMatch[1] : null
          
          this.logger.info('Extracted bot ID from Telegram chatId for Dify response', {
            chatId: telegramConversation.chatId,
            extractedBotId: botId
          })
          
          // Initialize Telegram service with bot ID from chatId
          const telegramMapping = botId 
            ? routingConfig.mappings.find(m => m.telegramBotId && String(m.telegramBotId) === String(botId))
            : routingConfig.mappings.find(m => m.telegramBotId)
          
          if (telegramMapping && telegramMapping.telegramBotId) {
            await this.telegramService.initializeWithBotId(telegramMapping.telegramBotId)
          }

          await this.telegramService.sendMessage(
            telegramConversation.chatId,
            difyResponse.response
          )
          this.logger.info('Dify response forwarded to Telegram', {
            chatId: telegramConversation.chatId,
            chatwootConversationId: conversation.chatwootId,
            conversationId: conversation.id,
            usedBotId: telegramMapping?.telegramBotId
          })
        } else {
          this.logger.warn('No linked Telegram conversation found to forward Dify response', {
            chatwootConversationId: conversation.chatwootId
          })
        }
      } catch (tgErr) {
        this.logger.error('Failed to forward Dify response to Telegram', { error: tgErr.message })
      }
    }

    // 3c. Forward Chatwoot outgoing messages to Telegram if Chatwoot is configured
    // LOGIC: Nếu có chatwoot_account_id → TỰ ĐỘNG đồng bộ 2 chiều (không cần routing flag)
    // IMPORTANT: Only forward messages from REAL AGENTS, not from Dify (to prevent duplicates)
    const hasChatwootMapping = routingConfig.hasMapping && routingConfig.mappings.some(m => m.chatwootAccountId)
    
    // CRITICAL: Check nếu message này là từ Dify (đã track khi gửi vào Chatwoot)
    const messageId = message.metadata?.messageId
    const isDifyMessage = messageId && this.difyMessageIds.has(messageId)
    const isRealAgentMessage = message.metadata?.isOutgoing && !this.isBotMessage(message) && !isDifyMessage
    
    this.logger.info('Checking if should forward Chatwoot message to Telegram', {
      hasChatwootMapping,
      isOutgoing: message.metadata?.isOutgoing,
      isBotMessage: this.isBotMessage(message),
      isDifyMessage,
      isRealAgentMessage,
      messageId,
      trackedDifyMessages: Array.from(this.difyMessageIds.keys()),
      senderType: message.metadata?.sender?.type,
      messageType: message.metadata?.messageType,
      conversationId: conversation.id,
      hasMapping: routingConfig.hasMapping,
      mappings: routingConfig.mappings?.map(m => ({ id: m.id, chatwootAccountId: m.chatwootAccountId }))
    })
    
    if (hasChatwootMapping && isRealAgentMessage) {
      try {
        // Find the original platform conversation (Telegram or Web) linked by chatwootId
        const platformConversation = await this.conversationRepository.findByChatwootId(conversation.chatwootId)
        
        this.logger.info('Looking for platform conversation to forward agent message', {
          chatwootId: conversation.chatwootId,
          foundConversation: !!platformConversation,
          platform: platformConversation?.platform,
          chatId: platformConversation?.chatId
        })
        
        if (platformConversation && platformConversation.chatId) {
          // Forward to Telegram
          if (platformConversation.platform === 'telegram') {
            // Extract bot ID from chatId (format: {userId}_bot_{botId})
            const botIdMatch = platformConversation.chatId.match(/_bot_(\d+)$/)
            const botId = botIdMatch ? botIdMatch[1] : null
            
            this.logger.info('Extracted bot ID from Telegram chatId', {
              chatId: platformConversation.chatId,
              extractedBotId: botId
            })
            
            // Initialize Telegram service with bot ID from chatId
            const telegramMapping = botId 
              ? routingConfig.mappings.find(m => m.telegramBotId && String(m.telegramBotId) === String(botId))
              : routingConfig.mappings.find(m => m.telegramBotId)
            
            if (telegramMapping && telegramMapping.telegramBotId) {
              this.logger.info('Initializing Telegram service with bot ID', {
                telegramBotId: telegramMapping.telegramBotId,
                matchedByBotId: !!botId
              })
              await this.telegramService.initializeWithBotId(telegramMapping.telegramBotId)
            } else {
              this.logger.warn('No Telegram bot ID found in routing config', {
                extractedBotId: botId,
                availableMappings: routingConfig.mappings?.map(m => ({ id: m.id, botId: m.telegramBotId }))
              })
            }

            await this.telegramService.sendMessage(
              platformConversation.chatId,
              message.content
            )
            this.logger.info('✅ Forwarded Chatwoot AGENT message to Telegram', {
              chatId: platformConversation.chatId,
              chatwootConversationId: conversation.chatwootId,
              conversationId: conversation.id,
              messagePreview: message.content?.substring(0, 50),
              usedBotId: telegramMapping?.telegramBotId
            })
          }
          // Forward to Web
          else if (platformConversation.platform === 'web') {
            await this.forwardChatwootAgentMessageToWeb(platformConversation, message, conversation)
          }
        } else {
          this.logger.warn('No linked platform conversation found to forward Chatwoot message', {
            chatwootConversationId: conversation.chatwootId,
            searchedChatwootId: conversation.chatwootId,
            allConversationFields: {
              id: conversation.id,
              chatwootId: conversation.chatwootId,
              platform: conversation.platform
            }
          })
        }
      } catch (err) {
        this.logger.error('Failed to forward Chatwoot message to Telegram', { 
          error: err.message,
          stack: err.stack,
          conversationId: conversation.id,
          chatwootId: conversation.chatwootId
        })
      }
    } else {
      this.logger.info('Skipping Chatwoot to Telegram forward', {
        hasChatwootMapping,
        isRealAgentMessage,
        isDifyMessage,
        messageId,
        reason: !hasChatwootMapping 
          ? 'No Chatwoot mapping (chatwoot_account_id not set)' 
          : isDifyMessage
            ? '❌ Message from Dify (prevent duplicate - already sent to Telegram)'
            : 'Not a real agent message (bot or incoming)'
      })
    }
    
    // Cleanup old tracked Dify messages (older than 10 minutes)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000
    for (const [msgId, data] of this.difyMessageIds.entries()) {
      if (data.timestamp < tenMinutesAgo) {
        this.difyMessageIds.delete(msgId)
        this.logger.debug('Cleaned up old Dify message tracking', { messageId: msgId })
      }
    }

    return {
      success: true,
      difyConversationId: difyResponse.conversationId,
      note: 'REALTIME response - each message processed independently without conversation history',
      mode: 'REALTIME'
    }
  }

  /**
   * Resolve Telegram bot token from mapping id
   */
  async getTelegramBotToken (telegramBotId) {
    try {
      if (!telegramBotId) return null
      return await this.databaseService.getBotToken(telegramBotId)
    } catch (e) {
      this.logger.warn('Failed to resolve Telegram bot token', { error: e.message, telegramBotId })
      return null
    }
  }

  /**
   * Forward Chatwoot agent message to Web
   * @param {Conversation} webConversation - Web conversation
   * @param {Message} message - Agent message from Chatwoot
   * @param {Conversation} chatwootConversation - Chatwoot conversation
   */
  async forwardChatwootAgentMessageToWeb (webConversation, message, chatwootConversation) {
    try {
      // Get web_conversation_id from platformMetadata
      const webConversationId = webConversation.platformMetadata?.webConversationId
      const sessionId = webConversation.chatId // chatId is the sessionId for web
      
      this.logger.info('Forwarding Chatwoot agent message to Web', {
        webConversationId,
        sessionId,
        chatwootConversationId: chatwootConversation.chatwootId,
        messagePreview: message.content?.substring(0, 50)
      })

      if (!webConversationId) {
        this.logger.error('No web_conversation_id found in platformMetadata', {
          webConversationPlatformMetadata: webConversation.platformMetadata
        })
        return
      }

      // Get repositories from service registry (they're already injected)
      const { Pool } = require('pg')
      const dbConfig = this.databaseService?.config || require('../infrastructure/config/Config')
      const pool = new Pool(dbConfig.getDatabase ? dbConfig.getDatabase() : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      })

      // Save agent message to web_messages table
      const query = `
        INSERT INTO web_messages (web_conversation_id, content, message_type, chatwoot_message_id, metadata)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `

      const result = await pool.query(query, [
        webConversationId,
        message.content,
        'agent', // message_type: agent (from Chatwoot)
        message.metadata?.messageId || message.id,
        JSON.stringify({
          sender: message.senderName || 'Agent',
          chatwootConversationId: chatwootConversation.chatwootId
        })
      ])

      // Update last_message_at in web_conversations
      await pool.query(
        'UPDATE web_conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1',
        [webConversationId]
      )

      await pool.end()

      this.logger.info('✅ Saved Chatwoot agent message to web_messages', {
        messageId: result.rows[0].id,
        webConversationId,
        sessionId,
        chatwootConversationId: chatwootConversation.chatwootId
      })
    } catch (error) {
      this.logger.error('Failed to forward Chatwoot agent message to Web', {
        error: error.message,
        stack: error.stack,
        webConversationId: webConversation.platformMetadata?.webConversationId
      })
    }
  }

  /**
   * Get Chatwoot account by external account ID
   * @param {number} externalAccountId - External account ID
   * @returns {Promise<Object|null>} - Chatwoot account
   */
  async getChatwootAccountByExternalAccountId (externalAccountId) {
    try {
      return await this.databaseService.getChatwootAccountByExternalAccountId(externalAccountId)
    } catch (error) {
      this.logger.error('Failed to get Chatwoot account by external account ID', {
        error: error.message,
        externalAccountId
      })
      return null
    }
  }
}

module.exports = ProcessMessageUseCase
