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
      this.logger.info('Handling message from platform', { platform, messageData })

      const enrichedMessageData = {
        ...messageData,
        platform,
        timestamp: messageData.timestamp || new Date()
      }

      const result = await this.processMessageUseCase.execute(enrichedMessageData)

      this.logger.info('Message handled successfully', {
        platform,
        messageId: messageData.id,
        result
      })

      return result

    } catch (error) {
      this.logger.error('Failed to handle message', {
        error: error.message,
        stack: error.stack,
        platform,
        messageData
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
    const message = telegramData.message
    const chat = message.chat
    const from = message.from

    const isGroupChat = chat.type === 'group' || chat.type === 'supergroup'
    const conversationId = isGroupChat ? chat.id.toString() : from.id.toString()

    return {
      id: `${message.message_id}_${conversationId}`,
      content: message.text,
      senderId: from.id.toString(),
      senderName: `${from.first_name} ${from.last_name || ''}`.trim(),
      conversationId,
      metadata: {
        isGroupChat,
        groupTitle: isGroupChat ? chat.title : null,
        messageId: message.message_id,
        chatId: chat.id.toString(),
        userId: from.id.toString(),
        username: from.username
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
