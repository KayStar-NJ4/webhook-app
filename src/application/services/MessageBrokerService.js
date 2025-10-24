/**
 * Message Broker Service
 * Coordinates message processing across different platforms
 */
class MessageBrokerService {
  constructor ({
    processMessageUseCase,
    container,
    logger
  }) {
    this.processMessageUseCase = processMessageUseCase
    this.container = container
    this.logger = logger
  }

  /**
   * Handle incoming message from any platform
   * @param {string} platform - Platform name
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} - Processing result
   */
  async handleMessage (platform, messageData) {
    try {
      this.logger.info('Handling message from platform', {
        platform,
        messageData,
        conversation_id: messageData.conversationId
      })

      const enrichedMessageData = {
        ...messageData,
        platform,
        timestamp: messageData.timestamp || new Date()
      }

      const result = await this.processMessageUseCase.execute(enrichedMessageData)

      this.logger.info('Message handled successfully', {
        platform,
        messageId: messageData.id,
        result,
        conversation_id: messageData.conversationId
      })

      return result
    } catch (error) {
      this.logger.error('Failed to handle message', {
        error: error.message,
        stack: error.stack,
        platform,
        messageData,
        conversation_id: messageData.conversationId,
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

  /**
   * Handle Telegram webhook
   * @param {Object} telegramData - Telegram webhook data
   * @returns {Promise<Object>} - Processing result
   */
  async handleTelegramWebhook (telegramData) {
    try {
      // Get bot info from database if available
      let botInfo = null
      if (telegramData.__bot_id) {
        try {
          // Get bot info from database service
          const databaseService = this.container.get('databaseService')
          const botToken = await databaseService.getBotToken(telegramData.__bot_id)
          const realUsername = await databaseService.getBotUsername(telegramData.__bot_id)
          
          if (botToken) {
            // Extract bot username from token (format: botId:token) as fallback
            const tokenParts = botToken.split(':')
            if (tokenParts.length >= 2) {
              botInfo = {
                id: parseInt(telegramData.__bot_id),
                username: realUsername || `bot${tokenParts[0]}`, // Use real username from DB, fallback to fake
                realUsername: realUsername // Store the real username separately
              }
            }
          }
        } catch (dbError) {
          this.logger.warn('Failed to get bot info from database', { error: dbError.message })
        }
      } else if (telegramData.__secret_token) {
        // Try to resolve bot ID from secret token
        try {
          const databaseService = this.container.get('databaseService')
          const botId = await databaseService.getBotIdBySecretToken(telegramData.__secret_token)
          if (botId) {
            const botToken = await databaseService.getBotToken(botId)
            const realUsername = await databaseService.getBotUsername(botId)
            if (botToken) {
              const tokenParts = botToken.split(':')
              if (tokenParts.length >= 2) {
                botInfo = {
                  id: botId,
                  username: realUsername || `bot${tokenParts[0]}`, // Use real username from DB, fallback to fake
                  realUsername: realUsername
                }
              }
            }
          }
        } catch (dbError) {
          this.logger.warn('Failed to resolve bot ID from secret token', { error: dbError.message })
        }
      } else {
        // Try to resolve bot ID from the message content or other means
        // This is a fallback when no explicit bot ID or secret token is provided
        try {
          const databaseService = this.container.get('databaseService')
          // For now, we'll use the first active bot as fallback
          // But we should improve this to detect the correct bot
          const botId = await databaseService.getFirstActiveBotId()
          if (botId) {
            const botToken = await databaseService.getBotToken(botId)
            const realUsername = await databaseService.getBotUsername(botId)
            if (botToken) {
              const tokenParts = botToken.split(':')
              if (tokenParts.length >= 2) {
                botInfo = {
                  id: botId,
                  username: realUsername || `bot${tokenParts[0]}`, // Use real username from DB, fallback to fake
                  realUsername: realUsername
                }
                this.logger.warn('Using fallback bot ID - webhook should include bot ID or secret token', { 
                  fallbackBotId: botId,
                  realUsername,
                  webhookUrl: 'Consider using /webhook/telegram/:botId or secret token'
                })
              }
            }
          }
        } catch (dbError) {
          this.logger.warn('Failed to get fallback bot ID', { error: dbError.message })
        }
      }

      this.logger.info('Received Telegram webhook', {
        hasMessage: !!telegramData.message,
        messageId: telegramData.message?.message_id,
        chatId: telegramData.message?.chat?.id,
        chatType: telegramData.message?.chat?.type,
        chatTitle: telegramData.message?.chat?.title,
        userId: telegramData.message?.from?.id,
        userName: telegramData.message?.from?.first_name,
        hasText: !!telegramData.message?.text,
        textPreview: telegramData.message?.text?.substring(0, 50),
        botInfo
      })

      // Add bot info to telegramData for parsing
      telegramData.bot = botInfo

      const messageData = this.parseTelegramMessage(telegramData)
      return await this.handleMessage('telegram', messageData)
    } catch (error) {
      // Check if this is a skippable error (special events, non-text messages, bot messages, etc.)
      const isSkippableError = error.message && (
        error.message.includes('skipped') ||
        error.message.includes('Special event message') ||
        error.message.includes('Non-text message') ||
        error.message.includes('not mentioned in group')
      )

      if (isSkippableError) {
        // Return success for skippable messages to prevent Telegram from retrying
        this.logger.info('Telegram webhook processed but message skipped', {
          reason: error.message,
          messageId: telegramData.message?.message_id,
          chatId: telegramData.message?.chat?.id
        })
        return { success: true, message: 'Message skipped', reason: error.message }
      }

      // For real errors, log and throw
      this.logger.error('Failed to handle Telegram webhook', {
        error: error.message,
        stack: error.stack,
        telegramData
      })
      throw error
    }
  }

  /**
   * Handle Web webhook
   * @param {Object} webData - Web webhook data
   * @returns {Promise<Object>} - Processing result
   */
  async handleWebWebhook (webData) {
    try {
      this.logger.info('Received Web webhook', {
        sessionId: webData.sessionId,
        webAppId: webData.webAppId,
        hasContent: !!webData.content,
        contentLength: webData.content?.length,
        userInfo: webData.userInfo
      })

      const messageData = this.parseWebMessage(webData)
      const result = await this.handleMessage('web', messageData)
      
      // Return the response to send back to web client
      // No default message - require proper platform mapping configuration
      return {
        success: result.success !== false,
        response: result.response || null,
        conversationId: result.conversationId,
        metadata: result.metadata,
        error: result.error || null
      }
    } catch (error) {
      this.logger.error('Failed to handle Web webhook', {
        error: error.message,
        stack: error.stack,
        webData
      })
      throw error
    }
  }

  /**
   * Parse Web message to standard format
   * @param {Object} webData - Web webhook data
   * @returns {Object} - Parsed message data
   */
  parseWebMessage (webData) {
    const senderId = webData.userInfo?.identifier || `anonymous_${webData.sessionId}`
    const senderName = webData.userInfo?.name || 'Web User'
    
    return {
      id: `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId: webData.sessionId, // Use sessionId as conversationId
      content: webData.content,
      senderId: senderId, // Required by Message entity
      senderName: senderName, // Required by Message entity
      sender: {
        id: senderId,
        name: senderName,
        email: webData.userInfo?.email,
        platform: 'web'
      },
      chatType: 'private', // Web always private chat
      metadata: {
        webAppId: webData.webAppId,
        webConversationId: webData.webConversationId, // Database ID
        sessionId: webData.sessionId,
        browser: webData.userInfo?.platform,
        language: webData.userInfo?.language,
        referrer: webData.userInfo?.referrer,
        userAgent: webData.userInfo?.userAgent
      }
    }
  }

  /**
   * Handle Zalo webhook
   * @param {Object} zaloData - Raw Zalo webhook data
   * @returns {Promise<Object>} - Processing result
   */
  async handleZaloWebhook (zaloData) {
    try {
      // Get bot info from database if available
      let botInfo = null
      if (zaloData.__bot_id) {
        try {
          // Get bot info from database service
          const databaseService = this.container.get('databaseService')
          const botToken = await databaseService.getZaloBotToken(zaloData.__bot_id)
          
          if (botToken) {
            // Extract bot ID from token (format: oauth_id:token)
            const tokenParts = botToken.split(':')
            if (tokenParts.length >= 2) {
              botInfo = {
                id: parseInt(zaloData.__bot_id),
                username: `bot${tokenParts[0]}`
              }
            }
          }
        } catch (dbError) {
          this.logger.warn('Failed to get bot info from database', { error: dbError.message })
        }
      }

      // Attach bot info to zaloData
      if (botInfo) {
        zaloData.bot = botInfo
      }

      this.logger.info('Processing Zalo webhook', {
        messageId: zaloData.message?.message_id,
        chatId: zaloData.message?.chat?.id,
        timestamp: new Date().toISOString()
      })

      const messageData = this.parseZaloMessage(zaloData)
      return await this.handleMessage('zalo', messageData)
    } catch (error) {
      // Check if this is a skippable error
      const isSkippableError = error.message && (
        error.message.includes('skipped') ||
        error.message.includes('Special event message') ||
        error.message.includes('Non-text message') ||
        error.message.includes('not mentioned in group')
      )

      if (isSkippableError) {
        // Return success for skippable messages to prevent Zalo from retrying
        this.logger.info('Zalo webhook processed but message skipped', {
          reason: error.message,
          messageId: zaloData.message?.message_id,
          chatId: zaloData.message?.chat?.id
        })
        return { success: true, message: 'Message skipped', reason: error.message }
      }

      // For real errors, log and throw
      this.logger.error('Failed to handle Zalo webhook', {
        error: error.message,
        stack: error.stack,
        zaloData
      })
      throw error
    }
  }

  /**
   * Parse Zalo message data
   * @param {Object} zaloData - Raw Zalo data
   * @returns {Object} - Parsed message data
   */
  parseZaloMessage (zaloData) {
    // Validate webhook data structure
    if (!zaloData || !zaloData.message) {
      this.logger.warn('Invalid Zalo webhook data - no message found', { zaloData })
      throw new Error('Invalid Zalo webhook data - no message found')
    }

    const message = zaloData.message
    const chat = message.chat
    const from = message.from

    // Validate required fields
    if (!chat || !from) {
      this.logger.warn('Invalid Zalo message structure', { message })
      throw new Error('Invalid Zalo message structure - missing chat or from data')
    }

    // Skip messages from this bot to prevent loops
    if (from.is_bot && from.id === zaloData.bot?.id) {
      this.logger.info('Skipping message from this bot to prevent loops', {
        messageId: message.message_id,
        botId: from.id,
        isThisBot: true
      })
      throw new Error('Message from this bot skipped to prevent loops')
    }

    // Skip special event messages
    const isSpecialEvent = !!(
      message.new_chat_member ||
      message.new_chat_members ||
      message.new_chat_participant ||
      message.left_chat_member ||
      message.migrate_from_chat_id ||
      message.migrate_to_chat_id ||
      message.group_chat_created ||
      message.supergroup_chat_created ||
      message.channel_chat_created
    )

    if (isSpecialEvent) {
      this.logger.info('Skipping special event message from Zalo', {
        messageId: message.message_id,
        chatId: chat.id,
        chatType: chat.type,
        eventType: message.new_chat_member ? 'new_chat_member' :
                   message.new_chat_members ? 'new_chat_members' :
                   message.left_chat_member ? 'left_chat_member' :
                   message.migrate_from_chat_id ? 'migrate_from_chat_id' :
                   message.migrate_to_chat_id ? 'migrate_to_chat_id' :
                   message.group_chat_created ? 'group_chat_created' :
                   message.supergroup_chat_created ? 'supergroup_chat_created' :
                   message.channel_chat_created ? 'channel_chat_created' : 'unknown'
      })
      throw new Error('Special event message skipped - no processing needed')
    }

    // Skip messages without text content
    if (!message.text || !message.text.trim()) {
      this.logger.info('Skipping non-text message from Zalo', {
        messageId: message.message_id,
        chatId: chat.id,
        hasText: !!message.text
      })
      throw new Error('Non-text message skipped')
    }

    const isGroupChat = chat.type === 'group' || chat.type === 'supergroup'
    
    // Include bot ID in conversation ID to separate conversations between different bots
    const botId = zaloData.bot?.id || zaloData.__bot_id
    const baseConversationId = isGroupChat ? chat.id.toString() : from.id.toString()
    const conversationId = botId ? `${baseConversationId}_bot_${botId}` : baseConversationId

    // For group chats, check if bot is mentioned
    let isBotMentioned = false
    if (isGroupChat && message.text) {
      const botUsername = zaloData.bot?.username
      if (botUsername && message.text.includes(`@${botUsername}`)) {
        isBotMentioned = true
      }
    }

    // For group chats, only respond when bot is mentioned
    if (isGroupChat && !isBotMentioned) {
      this.logger.info('Skipping Zalo group message - bot not mentioned', {
        messageId: message.message_id,
        chatId: chat.id,
        chatTitle: chat.title,
        messageText: message.text.substring(0, 50)
      })
      throw new Error('Bot not mentioned in group message')
    }

    return {
      id: `zalo_${message.message_id}`,
      platform: 'zalo',
      text: message.text,
      timestamp: message.date ? new Date(message.date * 1000).toISOString() : new Date().toISOString(),
      conversationId: conversationId,
      chatId: chat.id.toString(),
      chatType: chat.type,
      chatTitle: chat.title,
      senderId: from.id.toString(),
      senderName: `${from.first_name || ''} ${from.last_name || ''}`.trim() || from.username || 'Unknown',
      senderUsername: from.username,
      isGroupChat: isGroupChat,
      isBotMentioned: isBotMentioned,
      platformMetadata: {
        messageId: message.message_id,
        botId: botId,
        botUsername: zaloData.bot?.username
      }
    }
  }

  /**
   * Handle Chatwoot webhook
   * @param {Object} chatwootData - Chatwoot webhook data
   * @returns {Promise<Object>} - Processing result
   */
  async handleChatwootWebhook (chatwootData) {
    try {
      this.logger.info('Processing Chatwoot webhook', {
        event: chatwootData.event,
        messageId: chatwootData.id,
        conversationId: chatwootData.conversation?.id,
        timestamp: new Date().toISOString()
      })

      const messageData = this.parseChatwootMessage(chatwootData)

      // If parsing returns null (unhandled event or no message), just log and return success
      if (!messageData) {
        this.logger.info('Chatwoot webhook processed but no message to handle', {
          event: chatwootData.event,
          chatwootData
        })
        return { success: true, message: 'Webhook processed but no message to handle' }
      }

      this.logger.info('Chatwoot message parsed successfully', {
        messageId: messageData.id,
        conversationId: messageData.conversationId,
        content: messageData.content?.substring(0, 50),
        platform: 'chatwoot'
      })

      return await this.handleMessage('chatwoot', messageData)
    } catch (error) {
      this.logger.error('Failed to handle Chatwoot webhook', {
        error: error.message,
        chatwootData
      })
      throw error
    }
  }

  /**
   * Parse Telegram message data
   * @param {Object} telegramData - Raw Telegram data
   * @returns {Object} - Parsed message data
   */
  parseTelegramMessage (telegramData) {
    // Validate webhook data structure
    if (!telegramData || !telegramData.message) {
      this.logger.warn('Invalid Telegram webhook data - no message found', { telegramData })
      throw new Error('Invalid Telegram webhook data - no message found')
    }

    const message = telegramData.message
    const chat = message.chat
    const from = message.from

    // Validate required fields
    if (!chat || !from) {
      this.logger.warn('Invalid Telegram message structure', { message })
      throw new Error('Invalid Telegram message structure - missing chat or from data')
    }

    // Skip messages from this bot to prevent loops (but allow other bots in group)
    if (from.is_bot && from.id === telegramData.bot?.id) {
      this.logger.info('Skipping message from this bot to prevent loops', {
        messageId: message.message_id,
        botId: from.id,
        isThisBot: true
      })
      throw new Error('Message from this bot skipped to prevent loops')
    }

    // Skip special event messages (new_chat_member, migrate_from_chat_id, etc.)
    const isSpecialEvent = !!(
      message.new_chat_member ||
      message.new_chat_members ||
      message.new_chat_participant ||
      message.left_chat_member ||
      message.migrate_from_chat_id ||
      message.migrate_to_chat_id ||
      message.group_chat_created ||
      message.supergroup_chat_created ||
      message.channel_chat_created
    )

    if (isSpecialEvent) {
      this.logger.info('Skipping special event message', {
        messageId: message.message_id,
        chatId: chat.id,
        chatType: chat.type,
        eventType: message.new_chat_member ? 'new_chat_member' :
                   message.new_chat_members ? 'new_chat_members' :
                   message.left_chat_member ? 'left_chat_member' :
                   message.migrate_from_chat_id ? 'migrate_from_chat_id' :
                   message.migrate_to_chat_id ? 'migrate_to_chat_id' :
                   message.group_chat_created ? 'group_chat_created' :
                   message.supergroup_chat_created ? 'supergroup_chat_created' :
                   message.channel_chat_created ? 'channel_chat_created' : 'unknown',
        newMember: message.new_chat_member || message.new_chat_members?.[0],
        leftMember: message.left_chat_member,
        migrateFromChatId: message.migrate_from_chat_id,
        migrateToChatId: message.migrate_to_chat_id
      })
      throw new Error('Special event message skipped - no processing needed')
    }

    // Skip messages without text content
    if (!message.text || !message.text.trim()) {
      this.logger.info('Skipping non-text message', {
        messageId: message.message_id,
        chatId: chat.id,
        hasText: !!message.text,
        messageType: message.content_type || 'unknown',
        hasPhoto: !!message.photo,
        hasDocument: !!message.document,
        hasVideo: !!message.video,
        hasAudio: !!message.audio,
        hasVoice: !!message.voice,
        hasSticker: !!message.sticker
      })
      throw new Error('Non-text message skipped')
    }

    const isGroupChat = chat.type === 'group' || chat.type === 'supergroup'
    
    this.logger.info('Debug chat type and group detection', {
      chatType: chat.type,
      isGroupChat: isGroupChat,
      chatId: chat.id,
      chatTitle: chat.title
    })
    // Include bot ID in conversation ID to separate conversations between different bots
    const botId = telegramData.bot?.id || telegramData.__bot_id
    const baseConversationId = isGroupChat ? chat.id.toString() : from.id.toString()
    const conversationId = botId ? `${baseConversationId}_bot_${botId}` : baseConversationId

    // For group chats, only respond when bot is mentioned
    // Use real username from database if available, fallback to fake username
    const botUsername = telegramData.bot?.realUsername || telegramData.bot?.username
    
    // Clean bot username (remove @ if present)
    const cleanBotUsername = botUsername ? botUsername.replace(/^@/, '') : null
    
    // For group chats, check if bot is mentioned
    let isBotMentioned = false
    if (isGroupChat && message.text) {
      // Check for @username mention (botUsername might already have @ from database)
      if (cleanBotUsername && (
        message.text.includes(`@${cleanBotUsername}`) || 
        message.text.includes(botUsername) // In case botUsername already has @
      )) {
        isBotMentioned = true
      }
      // Check for @first_name mention (fallback)
      else if (telegramData.bot?.first_name && message.text.includes(`@${telegramData.bot.first_name}`)) {
        isBotMentioned = true
      }
      // Check entities for proper mention detection
      else if (message.entities?.some(entity => 
        (entity.type === 'mention' || entity.type === 'text_mention') &&
        (
          // Check if mention text matches bot username (clean version)
          (cleanBotUsername && message.text.substring(entity.offset, entity.offset + entity.length).includes(cleanBotUsername)) ||
          // Check if mention text matches full bot username (with @)
          (botUsername && message.text.substring(entity.offset, entity.offset + entity.length).includes(botUsername)) ||
          // Check if entity user ID matches bot ID
          entity.user?.id === telegramData.bot?.id
        )
      )) {
        isBotMentioned = true
      }
    }

    // In private chats, always respond with Dify. In group chats, only respond with Dify when bot is mentioned
    const shouldRespondWithDify = !isGroupChat || isBotMentioned
    
    this.logger.info('Debug mention detection and routing logic', {
      isGroupChat: isGroupChat,
      isBotMentioned: isBotMentioned,
      shouldRespondWithDify: shouldRespondWithDify,
      logicExplanation: isGroupChat ? 
        (isBotMentioned ? 'Group chat + bot mentioned = respond' : 'Group chat + bot NOT mentioned = NO respond') :
        'Private chat = always respond',
      botUsername: botUsername,
      cleanBotUsername: cleanBotUsername,
      messageText: message.text,
      hasEntities: !!message.entities,
      entities: message.entities
    })

    this.logger.info('Parsing Telegram message', {
      messageId: message.message_id,
      chatId: chat.id,
      userId: from.id,
      isGroupChat,
      conversationId,
      hasText: !!message.text,
      textLength: message.text?.length || 0,
      chatType: chat.type,
      chatTitle: chat.title,
      userName: from.first_name,
      userUsername: from.username,
      isBotMentioned,
      botUsername: botUsername,
      cleanBotUsername: cleanBotUsername,
      realBotUsername: telegramData.bot?.realUsername,
      fakeBotUsername: telegramData.bot?.username,
      shouldRespondWithDify,
      messageText: message.text?.substring(0, 100) // Show first 100 chars for debugging
    })

    // NOTE: We DON'T skip messages here anymore
    // All messages are forwarded to Chatwoot for context (even in groups without mention)
    // But only messages with bot mention (or private chats) will be processed by Dify
    // The ProcessMessageUseCase will check metadata.shouldRespondWithDify flag

    const parsedMessage = {
      id: `${message.message_id}_${conversationId}`,
      content: message.text,
      senderId: from.id.toString(),
      senderName: `${from.first_name || ''} ${from.last_name || ''}`.trim() || from.username || `User ${from.id}`,
      conversationId,
      metadata: {
        isGroupChat,
        isBotMentioned, // Flag to indicate if this bot was mentioned
        shouldRespondWithDify, // Flag to control Dify response (true for private or when mentioned in group)
        groupTitle: isGroupChat ? chat.title : null,
        messageId: message.message_id,
        chatId: chat.id.toString(),
        userId: from.id.toString(),
        username: from.username,
        firstName: from.first_name,
        lastName: from.last_name,
        languageCode: from.language_code,
        botId: botId ? Number(botId) : undefined,
        secretToken: telegramData.__secret_token,
        chat: {
          id: chat.id,
          type: chat.type,
          title: chat.title,
          username: chat.username,
          description: chat.description
        },
        sender: {
          id: from.id,
          username: from.username,
          first_name: from.first_name,
          last_name: from.last_name,
          language_code: from.language_code,
          is_bot: from.is_bot
        }
      }
    }

    this.logger.info('MessageBrokerService returning parsed message with metadata', {
      messageId: parsedMessage.id,
      conversationId: parsedMessage.conversationId,
      metadataKeys: Object.keys(parsedMessage.metadata),
      'metadata.shouldRespondWithDify': parsedMessage.metadata.shouldRespondWithDify,
      'metadata.isGroupChat': parsedMessage.metadata.isGroupChat,
      'metadata.isBotMentioned': parsedMessage.metadata.isBotMentioned,
      shouldRespondWithDifyValue: shouldRespondWithDify,
      isGroupChatValue: isGroupChat,
      isBotMentionedValue: isBotMentioned
    })

    return parsedMessage
  }

  /**
   * Parse Chatwoot message data
   * @param {Object} chatwootData - Raw Chatwoot data
   * @returns {Object} - Parsed message data
   */
  parseChatwootMessage (chatwootData) {
    const event = chatwootData.event

    // Handle different webhook event types
    switch (event) {
      case 'message_created':
        return this.parseMessageCreatedEvent(chatwootData)
      case 'conversation_updated':
        return this.parseConversationUpdatedEvent(chatwootData)
      case 'contact_updated':
        return this.parseContactUpdatedEvent(chatwootData)
      default:
        this.logger.warn('Unhandled Chatwoot webhook event type', { event, chatwootData })
        return null
    }
  }

  /**
   * Parse message_created event
   * @param {Object} chatwootData - Raw Chatwoot data
   * @returns {Object} - Parsed message data
   */
  parseMessageCreatedEvent (chatwootData) {
    const message = chatwootData
    const conversation = message.conversation
    const sender = message.sender

    // Log detailed message information for debugging
    this.logger.info('Parsing Chatwoot message_created event', {
      messageId: message.id,
      senderId: sender.id,
      senderName: sender.name,
      messageType: message.message_type,
      isOutgoing: message.message_type === 'outgoing',
      content: message.content?.substring(0, 100),
      conversationId: conversation.id,
      accountId: chatwootData.account?.id || chatwootData.account_id || message?.account_id || 1
    })

    return {
      id: `${message.id}_chatwoot`,
      content: message.content,
      senderId: sender.id.toString(),
      senderName: sender.name,
      conversationId: conversation.id.toString(),
      metadata: {
        isGroupChat: false,
        messageId: message.id,
        conversationId: conversation.id,
        senderId: sender.id,
        inboxId: conversation.inbox_id,
        accountId: chatwootData.account?.id || chatwootData.account_id || message?.account_id || 1,
        messageType: message.message_type,
        isOutgoing: message.message_type === 'outgoing',
        event: 'message_created',
        // Add chat type information for conversation creation
        chatType: 'private', // Chatwoot conversations are typically private
        chatId: conversation.id.toString(),
        // Add sender information for conversation creation
        sender: {
          id: sender.id,
          name: sender.name,
          type: sender.type, // IMPORTANT: 'user' = real agent, 'agent_bot' = AI bot, 'contact' = customer
          username: sender.additional_attributes?.username,
          language_code: sender.additional_attributes?.language_code,
          is_bot: sender.type === 'agent_bot' // Only AI bot (agent_bot), NOT real agents (user)
        }
      }
    }
  }

  /**
   * Parse conversation_updated event
   * @param {Object} chatwootData - Raw Chatwoot data
   * @returns {Object} - Parsed message data
   */
  parseConversationUpdatedEvent (chatwootData) {
    // For conversation_updated, we need to get the latest message
    const messages = chatwootData.messages
    if (!messages || messages.length === 0) {
      this.logger.warn('No messages found in conversation_updated event', { chatwootData })
      return null
    }

    const latestMessage = messages[messages.length - 1]
    const conversation = chatwootData
    const sender = latestMessage.sender

    return {
      id: `${latestMessage.id}_chatwoot`,
      content: latestMessage.content,
      senderId: sender.id.toString(),
      senderName: sender.name,
      conversationId: conversation.id.toString(),
      metadata: {
        isGroupChat: false,
        messageId: latestMessage.id,
        conversationId: conversation.id,
        senderId: sender.id,
        inboxId: conversation.inbox_id,
        accountId: chatwootData.account?.id || chatwootData.account_id || conversation?.account_id || 1,
        messageType: latestMessage.message_type,
        isOutgoing: latestMessage.message_type === 'outgoing',
        event: 'conversation_updated',
        // Add chat type information for conversation creation
        chatType: 'private', // Chatwoot conversations are typically private
        chatId: conversation.id.toString(),
        // Add sender information for conversation creation
        sender: {
          id: sender.id,
          name: sender.name,
          type: sender.type, // IMPORTANT: 'user' = real agent, 'agent_bot' = AI bot, 'contact' = customer
          username: sender.additional_attributes?.username,
          language_code: sender.additional_attributes?.language_code,
          is_bot: sender.type === 'agent_bot' // Only AI bot (agent_bot), NOT real agents (user)
        }
      }
    }
  }

  /**
   * Parse contact_updated event
   * @param {Object} chatwootData - Raw Chatwoot data
   * @returns {Object|null} - Parsed message data or null if should not be processed
   */
  parseContactUpdatedEvent (chatwootData) {
    // Contact_updated events don't have message context, so we don't process them as messages
    // They are just informational updates about contact changes
    this.logger.info('Contact updated event received, skipping message processing', {
      contactId: chatwootData.id,
      contactName: chatwootData.name,
      event: 'contact_updated'
    })

    return null // Don't process contact updates as messages
  }
}

module.exports = MessageBrokerService
