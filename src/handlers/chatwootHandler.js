const messageBroker = require('../services/messageBroker');
const logger = require('../utils/logger');

class ChatwootHandler {
  /**
   * Xử lý webhook từ Chatwoot
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  async handleWebhook(req, res) {
    try {
      const webhookData = req.body;
      
      logger.info('Received Chatwoot webhook', {
        event: webhookData.event,
        messageId: webhookData.message?.id,
        conversationId: webhookData.conversation?.id
      });

      // Xử lý các loại event khác nhau
      switch (webhookData.event) {
        case 'message_created':
          await this.handleMessageCreated(webhookData);
          break;
          
        case 'conversation_created':
          await this.handleConversationCreated(webhookData);
          break;
          
        case 'conversation_updated':
          await this.handleConversationUpdated(webhookData);
          break;
          
        case 'conversation_status_changed':
          await this.handleConversationStatusChanged(webhookData);
          break;
          
        default:
          logger.info('Unhandled Chatwoot webhook event', {
            event: webhookData.event
          });
      }

      res.status(200).json({ status: 'ok' });

    } catch (error) {
      logger.error('Failed to handle Chatwoot webhook', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });

      res.status(500).json({ 
        status: 'error', 
        message: 'Internal server error' 
      });
    }
  }

  /**
   * Xử lý event message_created
   * @param {object} webhookData - Dữ liệu webhook
   */
  async handleMessageCreated(webhookData) {
    try {
      const { message, conversation, account } = webhookData;
      
      if (!message || !conversation) {
        logger.warn('Missing message or conversation data in webhook');
        return;
      }

      // Chỉ xử lý tin nhắn từ agent (outgoing)
      if (message.message_type !== 'outgoing') {
        logger.info('Ignoring incoming message from webhook', {
          messageId: message.id,
          messageType: message.message_type
        });
        return;
      }

      // Kiểm tra xem tin nhắn có phải từ bot không
      if (message.sender?.type === 'agent_bot') {
        logger.info('Ignoring bot message from webhook', {
          messageId: message.id
        });
        return;
      }

      const chatwootMessage = {
        id: message.id,
        conversationId: conversation.id,
        content: message.content,
        messageType: message.message_type,
        sender: message.sender,
        createdAt: message.created_at,
        accountId: account.id
      };

      // Xử lý tin nhắn thông qua message broker
      await messageBroker.handleChatwootMessage(chatwootMessage);

      logger.info('Chatwoot message processed successfully', {
        messageId: message.id,
        conversationId: conversation.id
      });

    } catch (error) {
      logger.error('Failed to handle message created event', {
        error: error.message,
        webhookData: webhookData
      });
    }
  }

  /**
   * Xử lý event conversation_created
   * @param {object} webhookData - Dữ liệu webhook
   */
  async handleConversationCreated(webhookData) {
    try {
      const { conversation, contact, account } = webhookData;
      
      logger.info('New conversation created in Chatwoot', {
        conversationId: conversation.id,
        contactId: contact.id,
        accountId: account.id,
        status: conversation.status
      });

      // Có thể thêm logic xử lý khi tạo conversation mới
      // Ví dụ: gửi tin nhắn chào mừng, thiết lập metadata, etc.

    } catch (error) {
      logger.error('Failed to handle conversation created event', {
        error: error.message,
        webhookData: webhookData
      });
    }
  }

  /**
   * Xử lý event conversation_updated
   * @param {object} webhookData - Dữ liệu webhook
   */
  async handleConversationUpdated(webhookData) {
    try {
      const { conversation, account } = webhookData;
      
      logger.info('Conversation updated in Chatwoot', {
        conversationId: conversation.id,
        accountId: account.id,
        changes: webhookData.changes
      });

      // Có thể thêm logic xử lý khi conversation được cập nhật
      // Ví dụ: đồng bộ metadata, cập nhật trạng thái, etc.

    } catch (error) {
      logger.error('Failed to handle conversation updated event', {
        error: error.message,
        webhookData: webhookData
      });
    }
  }

  /**
   * Xử lý event conversation_status_changed
   * @param {object} webhookData - Dữ liệu webhook
   */
  async handleConversationStatusChanged(webhookData) {
    try {
      const { conversation, account } = webhookData;
      
      logger.info('Conversation status changed in Chatwoot', {
        conversationId: conversation.id,
        accountId: account.id,
        oldStatus: webhookData.changes?.status?.[0],
        newStatus: webhookData.changes?.status?.[1]
      });

      // Có thể thêm logic xử lý khi trạng thái conversation thay đổi
      // Ví dụ: thông báo cho platform, cập nhật mapping, etc.

    } catch (error) {
      logger.error('Failed to handle conversation status changed event', {
        error: error.message,
        webhookData: webhookData
      });
    }
  }

  /**
   * Xử lý tin nhắn từ agent Chatwoot
   * @param {object} messageData - Dữ liệu tin nhắn
   */
  async handleAgentMessage(messageData) {
    try {
      const { conversationId, content, sender } = messageData;
      
      logger.info('Processing agent message from Chatwoot', {
        conversationId,
        senderId: sender?.id,
        senderType: sender?.type
      });

      const chatwootMessage = {
        conversationId: conversationId,
        content: content,
        messageType: 'outgoing',
        sender: sender
      };

      await messageBroker.handleChatwootMessage(chatwootMessage);

    } catch (error) {
      logger.error('Failed to handle agent message', {
        error: error.message,
        messageData: messageData
      });
    }
  }

  /**
   * Xử lý tin nhắn từ bot Chatwoot
   * @param {object} messageData - Dữ liệu tin nhắn
   */
  async handleBotMessage(messageData) {
    try {
      const { conversationId, content, sender } = messageData;
      
      logger.info('Processing bot message from Chatwoot', {
        conversationId,
        senderId: sender?.id,
        senderType: sender?.type
      });

      // Có thể thêm logic xử lý tin nhắn từ bot
      // Ví dụ: gửi đến platform, cập nhật trạng thái, etc.

    } catch (error) {
      logger.error('Failed to handle bot message', {
        error: error.message,
        messageData: messageData
      });
    }
  }

  /**
   * Xác thực webhook từ Chatwoot
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   * @param {function} next - Next middleware function
   */
  async verifyWebhook(req, res, next) {
    try {
      // Có thể thêm logic xác thực webhook nếu cần
      // Ví dụ: kiểm tra signature, token, etc.
      
      const signature = req.headers['x-chatwoot-signature'];
      const timestamp = req.headers['x-chatwoot-timestamp'];
      
      if (!signature || !timestamp) {
        logger.warn('Missing webhook signature or timestamp');
        // Có thể trả về lỗi hoặc tiếp tục tùy theo yêu cầu bảo mật
      }

      next();

    } catch (error) {
      logger.error('Failed to verify Chatwoot webhook', {
        error: error.message
      });
      
      res.status(401).json({ 
        status: 'error', 
        message: 'Unauthorized' 
      });
    }
  }
}

module.exports = new ChatwootHandler();
