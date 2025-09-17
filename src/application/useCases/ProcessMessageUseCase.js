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
    platformMappingService,
    logger
  }) {
    this.conversationRepository = conversationRepository
    this.messageRepository = messageRepository
    this.telegramService = telegramService
    this.chatwootService = chatwootService
    this.difyService = difyService
    this.configurationService = configurationService
    this.platformMappingService = platformMappingService
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
    this.logger.info('Searching for existing conversation', {
      platform: message.platform,
      conversationId: message.conversationId,
      chatId: message.metadata?.chatId
    })
    
    let conversation = await this.conversationRepository.findByPlatformChatId(
      message.platform,
      message.conversationId
    )

    if (!conversation) {
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
    try {
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
  async processTelegramMessageWithMapping(message, conversation, mapping) {
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
      this.logger.info('Checking Dify routing configuration', {
        mappingId: mapping.id,
        hasTelegramToDify: !!mapping.routing?.telegramToDify,
        hasDifyAppId: !!mapping.difyAppId,
        difyAppId: mapping.difyAppId,
        routing: mapping.routing,
        fullMapping: mapping
      })
      
      const shouldConnectDify = (mapping.routing.telegramToDify || mapping.autoConnect?.telegramDify) && mapping.difyAppId
      if (shouldConnectDify) {
        this.logger.info('Processing message to Dify', {
          conversationId: conversation.id,
          difyAppId: mapping.difyAppId
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
        this.logger.info('Dify routing not configured or disabled', {
          mappingId: mapping.id,
          hasTelegramToDify: !!mapping.routing?.telegramToDify,
          hasDifyAppId: !!mapping.difyAppId
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
   * Process Telegram to Chatwoot routing
   * @param {Message} message - Message entity
   * @param {Conversation} conversation - Conversation entity
   * @param {number} chatwootAccountId - Chatwoot account ID
   * @returns {Promise<Object>}
   */
  async processTelegramToChatwoot(message, conversation, chatwootAccountId) {
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
        chatwootInboxId: chatwootConversation.inbox_id
      })
      
      conversation.chatwootId = chatwootConversation.id
      conversation.chatwootInboxId = chatwootConversation.inbox_id
      
      try {
        await this.conversationRepository.update(conversation)
        this.logger.info('Conversation updated successfully with Chatwoot IDs', {
          conversationId: conversation.id,
          chatwootId: conversation.chatwootId,
          chatwootInboxId: conversation.chatwootInboxId
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
  async sendBotReply(message, conversation) {
    try {
      // Simple auto-reply logic (like old code)
      const replyText = `Cảm ơn bạn đã liên hệ! Tin nhắn của bạn đã được gửi đến đội ngũ hỗ trợ. Chúng tôi sẽ phản hồi sớm nhất có thể. 🙏`
      
      // Get bot token for this conversation
      const telegramBotId = await this.getTelegramBotIdFromMessage(message)
      const botToken = await this.getTelegramBotToken(telegramBotId)
      
      // Send reply to Telegram
      await this.telegramService.sendMessage(
        conversation.chatId,
        replyText,
        {
          reply_to_message_id: message.metadata.messageId,
          botToken: botToken
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
  async processTelegramToDify(message, conversation, difyAppId) {
    // Send message to Dify
    const difyResponse = await this.difyService.sendMessage(
      conversation,
      message.getFormattedContent(),
      { difyAppId }
    )

    // Update conversation with Dify ID
    this.logger.info('Updating conversation with Dify ID', {
      conversationId: conversation.id,
      difyId: difyResponse.conversationId
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
  async processDifyResponseToChatwoot(response, chatwootConversationId, conversationId) {
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
    
    // Send response to Chatwoot
    const singleResponse = response.trim()
    await this.chatwootService.sendMessage(
      chatwootConversationId,
      singleResponse
    )
    
    this.logger.info('Dify response sent to Chatwoot', {
      chatwootConversationId,
      responseLength: singleResponse.length
    })
  }

  /**
   * Get Telegram bot ID from message
   * @param {Message} message - Message entity
   * @returns {Promise<number>}
   */
  async getTelegramBotIdFromMessage(message) {
    this.logger.info('Getting Telegram bot ID from message', { 
      messageKeys: Object.keys(message)
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
      const { Pool } = require('pg')
      const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true'
      })
      
      // 1) via secret token if configured
      if (message.metadata?.secretToken) {
        const resToken = await pool.query(
          'SELECT id FROM telegram_bots WHERE secret_token = $1 AND is_active = true LIMIT 1',
          [message.metadata.secretToken]
        )
        if (resToken.rows.length > 0) {
          const botId = resToken.rows[0].id
          await pool.end()
          this.logger.info('Resolved Telegram bot by secret token', { botId })
          return botId
        }
      }

      // 2) fallback: get first active bot
      const result = await pool.query('SELECT id FROM telegram_bots WHERE is_active = true ORDER BY id LIMIT 1')
      
      await pool.end()
      
      if (result.rows.length > 0) {
        const botId = result.rows[0].id
        this.logger.info('Found active Telegram bot', { botId })
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

    // 1. Send message to Dify (real-time mode - no conversation history) if mapping allows or no mapping present
    let difyResponse = { conversationId: conversation.difyId, response: null }
    const anyMappingAllowsDify = routingConfig.hasMapping ? routingConfig.mappings.some(m => m.routing?.difyToChatwoot || m.routing?.difyToTelegram || m.routing?.telegramToDify) : true
    
    this.logger.info('Dify processing check', {
      hasMapping: routingConfig.hasMapping,
      anyMappingAllowsDify,
      difyServiceExists: !!this.difyService,
      conversationId: conversation.id,
      messageContent: message.content.substring(0, 50)
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
        
        difyResponse = await this.difyService.sendMessage(
          conversation,
          message.content
        )
        
        this.logger.info('Dify response received', {
          conversationId: difyResponse.conversationId,
          hasResponse: !!difyResponse.response,
          responseLength: difyResponse.response?.length || 0
        })
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
    conversation.difyId = difyResponse.conversationId
    await this.conversationRepository.update(conversation)

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
      
      await this.chatwootService.initializeWithAccountId(conversation.metadata?.accountId || 1)
      
      // Gửi chỉ 1 tin nhắn duy nhất
      await this.chatwootService.sendMessage(
        conversation.chatwootId,
        singleResponse
      )
      
      this.logger.info('Single response sent successfully', {
        conversationId: conversation.chatwootId,
        messageId: message.id,
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
      
      // If we have a Dify conversation but no response, send a fallback message
      if (difyResponse?.conversationId && !difyResponse?.response) {
        this.logger.info('Sending fallback response due to empty Dify response', {
          conversationId: conversation.chatwootId,
          conversation_id: conversation.id
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
          
          await this.chatwootService.initializeWithAccountId(conversation.metadata?.accountId || 1)
          
          await this.chatwootService.sendMessage(
            conversation.chatwootId,
            fallbackMessage
          )
          
          this.logger.info('Fallback response sent to Chatwoot', {
            conversationId: conversation.chatwootId,
            conversation_id: conversation.id
          })
        } catch (fallbackError) {
          this.logger.error('Failed to send fallback response to Chatwoot', {
            error: fallbackError.message,
            conversationId: conversation.chatwootId,
            conversation_id: conversation.id
          })
        }
      }
    }

    // 3b. Optionally send response to Telegram if mapping allows
    const allowDifyToTelegram = routingConfig.hasMapping && routingConfig.mappings.some(m => m.routing?.difyToTelegram)
    if (allowDifyToTelegram && difyResponse.response) {
      try {
        // Map Chatwoot conversation to original Telegram chat
        const telegramConversation = await this.conversationRepository.findByChatwootId(conversation.chatwootId)
        if (telegramConversation && telegramConversation.chatId) {
          // Initialize Telegram service with bot ID from routing config
          const telegramMapping = routingConfig.mappings.find(m => m.telegramBotId)
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
            conversationId: conversation.id
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

    // 3c. Forward Chatwoot outgoing messages to Telegram if configured (Chatwoot -> Telegram)
    const allowChatwootToTelegram = routingConfig.hasMapping && routingConfig.mappings.some(m => m.routing?.chatwootToTelegram)
    if (allowChatwootToTelegram && message.metadata?.isOutgoing) {
      try {
        // Find the original Telegram conversation linked by chatwootId
        const telegramConversation = await this.conversationRepository.findByChatwootId(conversation.chatwootId)
        if (telegramConversation && telegramConversation.chatId) {
          // Initialize Telegram service with bot ID from routing config
          const telegramMapping = routingConfig.mappings.find(m => m.telegramBotId)
          if (telegramMapping && telegramMapping.telegramBotId) {
            await this.telegramService.initializeWithBotId(telegramMapping.telegramBotId)
          }
          
          await this.telegramService.sendMessage(
            telegramConversation.chatId,
            message.content
          )
          this.logger.info('Forwarded Chatwoot outgoing message to Telegram', {
            chatId: telegramConversation.chatId,
            chatwootConversationId: conversation.chatwootId,
            conversationId: conversation.id
          })
        } else {
          this.logger.warn('No linked Telegram conversation found to forward Chatwoot message', {
            chatwootConversationId: conversation.chatwootId
          })
        }
      } catch (err) {
        this.logger.error('Failed to forward Chatwoot message to Telegram', { error: err.message })
      }
    }

    return {
      success: true,
      difyConversationId: difyResponse.conversationId,
      note: 'Real-time response - no conversation history used'
    }
  }

  /**
   * Resolve Telegram bot token from mapping id
   */
  async getTelegramBotToken(telegramBotId) {
    try {
      if (!telegramBotId) return null
      // Direct DB query to fetch token to avoid circular DI; using pg like other helpers
      const { Pool } = require('pg')
      const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true'
      })
      const result = await pool.query('SELECT bot_token FROM telegram_bots WHERE id = $1', [telegramBotId])
      await pool.end()
      return result.rows[0]?.bot_token || null
    } catch (e) {
      this.logger.warn('Failed to resolve Telegram bot token', { error: e.message, telegramBotId })
      return null
    }
  }

  /**
   * Get Chatwoot account by external account ID
   * @param {number} externalAccountId - External account ID
   * @returns {Promise<Object|null>} - Chatwoot account
   */
  async getChatwootAccountByExternalAccountId(externalAccountId) {
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
      
      const result = await pool.query('SELECT * FROM chatwoot_accounts WHERE account_id = $1', [externalAccountId])
      await pool.end()
      
      if (result.rows.length === 0) {
        this.logger.warn('Chatwoot account not found for external account ID', { externalAccountId })
        return null
      }
      
      return result.rows[0]
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
