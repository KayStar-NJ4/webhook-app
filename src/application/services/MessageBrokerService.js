/**
 * Message Broker Service
 * Coordinates message processing across different platforms
 */
class MessageBrokerService {
  constructor({
    processMessageUseCase,
    logger
  }) {
    this.processMessageUseCase = processMessageUseCase
    this.logger = logger
  }

  /**
   * Handle incoming message from any platform
   * @param {string} platform - Platform name
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} - Processing result
   */
  async handleMessage(platform, messageData) {
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
        conversation_id: messageData.conversationId
      })
      throw error
    }
  }

  /**
   * Handle Telegram webhook
   * @param {Object} telegramData - Telegram webhook data
   * @returns {Promise<Object>} - Processing result
   */
  async handleTelegramWebhook(telegramData) {
    try {
      const messageData = this.parseTelegramMessage(telegramData)
      return await this.handleMessage('telegram', messageData)
    } catch (error) {
      this.logger.error('Failed to handle Telegram webhook', {
        error: error.message,
        telegramData
      })
      throw error
    }
  }

  /**
   * Handle Chatwoot webhook
   * @param {Object} chatwootData - Chatwoot webhook data
   * @returns {Promise<Object>} - Processing result
   */
  async handleChatwootWebhook(chatwootData) {
    try {
      const messageData = this.parseChatwootMessage(chatwootData)
      
      // If parsing returns null (unhandled event or no message), just log and return success
      if (!messageData) {
        this.logger.info('Chatwoot webhook processed but no message to handle', {
          event: chatwootData.event,
          chatwootData
        })
        return { success: true, message: 'Webhook processed but no message to handle' }
      }
      
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
  parseTelegramMessage(telegramData) {
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

    // Skip bot messages to prevent loops
    if (from.is_bot) {
      this.logger.info('Skipping bot message to prevent loops', { 
        messageId: message.message_id,
        botId: from.id 
      })
      throw new Error('Bot message skipped to prevent loops')
    }

    // Skip messages without text content
    if (!message.text || !message.text.trim()) {
      this.logger.info('Skipping non-text message', { 
        messageId: message.message_id,
        hasText: !!message.text,
        messageType: message.content_type || 'unknown'
      })
      throw new Error('Non-text message skipped')
    }

    const isGroupChat = chat.type === 'group' || chat.type === 'supergroup'
    const conversationId = isGroupChat ? chat.id.toString() : from.id.toString()

    this.logger.info('Parsing Telegram message', {
      messageId: message.message_id,
      chatId: chat.id,
      userId: from.id,
      isGroupChat,
      conversationId,
      hasText: !!message.text,
      textLength: message.text?.length || 0
    })

    return {
      id: `${message.message_id}_${conversationId}`,
      content: message.text,
      senderId: from.id.toString(),
      senderName: `${from.first_name || ''} ${from.last_name || ''}`.trim() || from.username || `User ${from.id}`,
      conversationId,
      metadata: {
        isGroupChat,
        groupTitle: isGroupChat ? chat.title : null,
        messageId: message.message_id,
        chatId: chat.id.toString(),
        userId: from.id.toString(),
        username: from.username,
        firstName: from.first_name,
        lastName: from.last_name,
        languageCode: from.language_code,
        botId: telegramData.__bot_id ? Number(telegramData.__bot_id) : undefined,
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
  }

  /**
   * Parse Chatwoot message data
   * @param {Object} chatwootData - Raw Chatwoot data
   * @returns {Object} - Parsed message data
   */
  parseChatwootMessage(chatwootData) {
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
  parseMessageCreatedEvent(chatwootData) {
    const message = chatwootData
    const conversation = message.conversation
    const sender = message.sender

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
          username: sender.additional_attributes?.username,
          language_code: sender.additional_attributes?.language_code,
          is_bot: false
        }
      }
    }
  }

  /**
   * Parse conversation_updated event
   * @param {Object} chatwootData - Raw Chatwoot data
   * @returns {Object} - Parsed message data
   */
  parseConversationUpdatedEvent(chatwootData) {
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
          username: sender.additional_attributes?.username,
          language_code: sender.additional_attributes?.language_code,
          is_bot: false
        }
      }
    }
  }

  /**
   * Parse contact_updated event
   * @param {Object} chatwootData - Raw Chatwoot data
   * @returns {Object|null} - Parsed message data or null if should not be processed
   */
  parseContactUpdatedEvent(chatwootData) {
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
