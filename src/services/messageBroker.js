const telegramService = require('./telegramService');
const chatwootService = require('./chatwootService');
const difyService = require('./difyService');
const logger = require('../utils/logger');

class MessageBroker {
  constructor() {
    this.conversationMap = new Map(); // Lưu mapping giữa platform conversation và Chatwoot conversation
    this.difyConversationMap = new Map(); // Lưu mapping giữa platform conversation và Dify conversation
    this.processedMessages = new Set(); // Tracking tin nhắn đã xử lý để tránh trả lời trùng lặp
    this.processedChatwootMessages = new Set(); // Tracking tin nhắn Chatwoot đã xử lý
  }

  /**
   * Xử lý tin nhắn từ Telegram
   * @param {object} telegramMessage - Tin nhắn từ Telegram
   */
  async handleTelegramMessage(telegramMessage) {
    try {
      // Tạo unique key cho tin nhắn để tracking
      const messageKey = `${telegramMessage.conversationId}_${telegramMessage.messageId}`;
      
      // Kiểm tra xem tin nhắn đã được xử lý chưa
      if (this.processedMessages.has(messageKey)) {
        logger.info('Message already processed, skipping', { messageKey });
        return;
      }

      logger.info('Processing Telegram message', {
        chatId: telegramMessage.chatId,
        conversationId: telegramMessage.conversationId,
        userId: telegramMessage.userId,
        senderDisplayName: telegramMessage.senderDisplayName,
        isGroupChat: telegramMessage.isGroupChat,
        text: telegramMessage.text,
        messageId: telegramMessage.messageId
      });

      // 1. Lấy hoặc tạo conversation dựa trên conversationId
      let conversation;
      if (this.conversationMap.has(telegramMessage.conversationId)) {
        // Sử dụng conversation đã có
        const chatwootConversationId = this.conversationMap.get(telegramMessage.conversationId);
        conversation = { id: chatwootConversationId };
        logger.info('Using existing conversation', { 
          conversationId: telegramMessage.conversationId, 
          chatwootConversationId: chatwootConversationId 
        });
      } else {
        // Tạo conversation mới với thông tin phù hợp
        const contactData = telegramMessage.isGroupChat ? {
          name: telegramMessage.groupTitle || `Group ${telegramMessage.chatId}`,
          firstName: telegramMessage.groupTitle || 'Group',
          lastName: '',
          username: `group_${telegramMessage.chatId}`,
          email: `group_${telegramMessage.chatId}@telegram.local`,
          isGroup: true
        } : {
          name: telegramMessage.senderDisplayName,
          firstName: telegramMessage.firstName,
          lastName: telegramMessage.lastName,
          username: telegramMessage.username,
          email: `${telegramMessage.userId}@telegram.local`,
          isGroup: false
        };

        conversation = await chatwootService.getOrCreateConversation(
          telegramMessage.conversationId, // Sử dụng conversationId thay vì userId
          contactData,
          telegramMessage.conversationId
        );
        
        // Lưu mapping conversation
        this.conversationMap.set(telegramMessage.conversationId, conversation.id);
        logger.info('Created new conversation', { 
          conversationId: telegramMessage.conversationId, 
          chatwootConversationId: conversation.id,
          isGroupChat: telegramMessage.isGroupChat
        });
      }

      // Lưu tin nhắn vào Chatwoot với thông tin người gửi
      const messageContent = telegramMessage.isGroupChat 
        ? `[${telegramMessage.senderDisplayName}]: ${telegramMessage.text}`
        : telegramMessage.text;

      await chatwootService.sendMessage(
        conversation.id,
        messageContent,
        'incoming',
        {
          sender: {
            type: 'contact',
            additional_attributes: {
              platform: 'telegram',
              telegram_user_id: telegramMessage.userId,
              telegram_chat_id: telegramMessage.chatId,
              telegram_conversation_id: telegramMessage.conversationId,
              is_group_chat: telegramMessage.isGroupChat,
              sender_display_name: telegramMessage.senderDisplayName,
              group_title: telegramMessage.groupTitle
            }
          }
        }
      );

      // 2. Gửi tin nhắn đến Dify AI
      const difyResponse = await difyService.sendMessage(
        telegramMessage.text,
        telegramMessage.conversationId, // Sử dụng conversationId thay vì userId
        {
          platform: 'telegram',
          chat_id: telegramMessage.chatId,
          conversation_id: this.getDifyConversationId(telegramMessage.conversationId),
          is_group_chat: telegramMessage.isGroupChat,
          sender_name: telegramMessage.senderDisplayName
        }
      );
      
      // Lưu Dify conversation ID
      if (difyResponse.conversationId) {
        this.difyConversationMap.set(telegramMessage.conversationId, difyResponse.conversationId);
      }

      // 3. Lưu phản hồi AI vào Chatwoot (Chatwoot webhook sẽ gửi về Telegram)
      await chatwootService.sendMessage(
        conversation.id,
        difyResponse.answer,
        'outgoing',
        {
          sender: {
            type: 'agent_bot',
            additional_attributes: {
              platform: 'dify_ai',
              dify_message_id: difyResponse.id,
              dify_conversation_id: difyResponse.conversationId,
              telegram_conversation_id: telegramMessage.conversationId,
              is_group_chat: telegramMessage.isGroupChat
            }
          }
        }
      );

      // 4. Đánh dấu tin nhắn đã được xử lý
      this.processedMessages.add(messageKey);
      
      logger.info('Telegram message processed successfully - Dify response saved to Chatwoot', {
        messageKey,
        chatId: telegramMessage.chatId,
        conversationId: telegramMessage.conversationId,
        chatwootConversationId: conversation.id,
        difyConversationId: difyResponse.conversationId,
        isGroupChat: telegramMessage.isGroupChat,
        processedMessagesCount: this.processedMessages.size,
        note: 'Chatwoot webhook will sync response to Telegram'
      });

      return {
        success: true,
        conversationId: conversation.id,
        difyConversationId: difyResponse.conversationId
      };

    } catch (error) {
      logger.error('Failed to process Telegram message', {
        chatId: telegramMessage.chatId,
        error: error.message,
        stack: error.stack
      });

      // Không gửi tin nhắn lỗi về Telegram vì Chatwoot webhook sẽ xử lý
      // việc gửi tin nhắn trả lời từ Dify AI
      logger.info('Skipping error message to Telegram - Chatwoot webhook will handle response');

      throw error;
    }
  }

  /**
   * Xử lý tin nhắn từ Chatwoot (agent trả lời)
   * @param {object} chatwootMessage - Tin nhắn từ Chatwoot
   */
  async handleChatwootMessage(chatwootMessage) {
    try {
      // Tạo unique key cho tin nhắn Chatwoot để tracking
      const messageKey = `chatwoot_${chatwootMessage.conversationId}_${chatwootMessage.id}`;
      
      // Kiểm tra xem tin nhắn đã được xử lý chưa
      if (this.processedChatwootMessages.has(messageKey)) {
        logger.info('Chatwoot message already processed, skipping', {
          messageKey,
          conversationId: chatwootMessage.conversationId,
          messageId: chatwootMessage.id
        });
        return { success: true, message: 'Message already processed' };
      }

      logger.info('Processing Chatwoot message', {
        conversationId: chatwootMessage.conversationId,
        messageType: chatwootMessage.messageType,
        content: chatwootMessage.content,
        messageKey
      });

      // Chỉ xử lý tin nhắn outgoing từ agent
      if (chatwootMessage.messageType !== 'outgoing') {
        return { success: true, message: 'Message type not supported' };
      }

      // Tìm platform conversation ID từ mapping
      let platformConversationId = null;
      for (const [conversationId, chatwootConversationId] of this.conversationMap.entries()) {
        if (chatwootConversationId === chatwootMessage.conversationId) {
          platformConversationId = conversationId;
          break;
        }
      }

      if (!platformConversationId) {
        logger.warn('No platform conversation found for Chatwoot conversation', {
          conversationId: chatwootMessage.conversationId
        });
        return { success: false, message: 'Platform conversation not found' };
      }

      // Gửi tin nhắn về Telegram
      await telegramService.sendMessage(
        platformConversationId,
        chatwootMessage.content
      );

      // Đánh dấu tin nhắn đã được xử lý
      this.processedChatwootMessages.add(messageKey);

      logger.info('Chatwoot message forwarded to Telegram successfully', {
        conversationId: chatwootMessage.conversationId,
        platformConversationId,
        messageKey,
        processedChatwootMessagesCount: this.processedChatwootMessages.size
      });

      return {
        success: true,
        platformConversationId
      };

    } catch (error) {
      logger.error('Failed to process Chatwoot message', {
        conversationId: chatwootMessage.conversationId,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Lấy thông tin conversation mapping
   * @param {string} platformConversationId - ID conversation từ platform
   */
  getConversationMapping(platformConversationId) {
    return this.conversationMap.get(platformConversationId);
  }

  /**
   * Lấy Dify conversation ID
   * @param {string} platformConversationId - ID conversation từ platform
   */
  getDifyConversationId(platformConversationId) {
    return this.difyConversationMap.get(platformConversationId);
  }

  /**
   * Lưu conversation mapping
   * @param {string} platformConversationId - ID conversation từ platform
   * @param {number} chatwootConversationId - ID conversation từ Chatwoot
   */
  setConversationMapping(platformConversationId, chatwootConversationId) {
    this.conversationMap.set(platformConversationId, chatwootConversationId);
  }

  /**
   * Xóa conversation mapping
   * @param {string} platformConversationId - ID conversation từ platform
   */
  removeConversationMapping(platformConversationId) {
    this.conversationMap.delete(platformConversationId);
  }

  /**
   * Lấy tất cả conversation mappings
   */
  getAllConversationMappings() {
    return Array.from(this.conversationMap.entries()).map(([platformId, chatwootId]) => ({
      platformConversationId: platformId,
      chatwootConversationId: chatwootId
    }));
  }

  /**
   * Xử lý tin nhắn từ platform khác (mở rộng cho Facebook, Zalo, etc.)
   * @param {string} platform - Tên platform
   * @param {object} message - Tin nhắn từ platform
   */
  async handlePlatformMessage(platform, message) {
    try {
      logger.info(`Processing ${platform} message`, {
        platform,
        messageId: message.messageId,
        userId: message.userId
      });

      // Tạo conversation trong Chatwoot
      const conversation = await chatwootService.getOrCreateConversation(
        message.userId,
        {
          name: message.name || `${message.firstName} ${message.lastName}`.trim(),
          firstName: message.firstName,
          lastName: message.lastName,
          email: `${message.userId}@${platform}.local`
        }
      );

      // Lưu mapping
      this.conversationMap.set(message.conversationId, conversation.id);

      // Lưu tin nhắn vào Chatwoot
      await chatwootService.sendMessage(
        conversation.id,
        message.text,
        'incoming',
        {
          sender: {
            type: 'contact',
            additional_attributes: {
              platform: platform,
              [`${platform}_user_id`]: message.userId,
              [`${platform}_conversation_id`]: message.conversationId
            }
          }
        }
      );

      // Gửi đến Dify AI
      const difyResponse = await difyService.sendMessage(
        message.text,
        message.userId,
        {
          platform: platform,
          conversation_id: message.conversationId
        }
      );

      // Gửi phản hồi về platform (cần implement service cho từng platform)
      // await this.sendToPlatform(platform, message.conversationId, difyResponse.answer);

      // Lưu phản hồi AI vào Chatwoot
      await chatwootService.sendMessage(
        conversation.id,
        difyResponse.answer,
        'outgoing',
        {
          sender: {
            type: 'agent_bot',
            additional_attributes: {
              platform: 'dify_ai',
              dify_message_id: difyResponse.id,
              dify_conversation_id: difyResponse.conversationId
            }
          }
        }
      );

      return {
        success: true,
        conversationId: conversation.id,
        difyConversationId: difyResponse.conversationId
      };

    } catch (error) {
      logger.error(`Failed to process ${platform} message`, {
        platform,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }
}

module.exports = new MessageBroker();
