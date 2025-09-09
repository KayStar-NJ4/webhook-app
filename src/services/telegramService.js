const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class TelegramService {
  constructor() {
    this.botToken = config.telegram.botToken;
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    this.botUsername = null; // Sẽ được lấy từ getBotInfo()
  }

  /**
   * Gửi tin nhắn đến Telegram
   * @param {string} chatId - ID của chat
   * @param {string} text - Nội dung tin nhắn
   * @param {object} options - Các tùy chọn khác
   */
  async sendMessage(chatId, text, options = {}) {
    try {
      const payload = {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        ...options
      };

      const response = await axios.post(`${this.baseUrl}/sendMessage`, payload);
      
      logger.info('Telegram message sent successfully', {
        chatId,
        messageId: response.data.result.message_id
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to send Telegram message', {
        chatId,
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Thiết lập webhook cho Telegram bot
   * @param {string} webhookUrl - URL webhook
   */
  async setWebhook(webhookUrl) {
    try {
      const response = await axios.post(`${this.baseUrl}/setWebhook`, {
        url: webhookUrl,
        allowed_updates: ['message', 'edited_message', 'callback_query']
      });

      logger.info('Telegram webhook set successfully', { webhookUrl });
      return response.data;
    } catch (error) {
      logger.error('Failed to set Telegram webhook', {
        webhookUrl,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Lấy thông tin webhook hiện tại
   */
  async getWebhookInfo() {
    try {
      const response = await axios.get(`${this.baseUrl}/getWebhookInfo`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get Telegram webhook info', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Xóa webhook
   */
  async deleteWebhook() {
    try {
      const response = await axios.post(`${this.baseUrl}/deleteWebhook`);
      logger.info('Telegram webhook deleted successfully');
      return response.data;
    } catch (error) {
      logger.error('Failed to delete Telegram webhook', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Lấy thông tin bot
   */
  async getBotInfo() {
    try {
      const response = await axios.get(`${this.baseUrl}/getMe`);
      this.botUsername = response.data.result.username;
      return response.data;
    } catch (error) {
      logger.error('Failed to get Telegram bot info', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Xử lý tin nhắn từ Telegram webhook
   * @param {object} update - Update object từ Telegram
   */
  processMessage(update) {
    if (!update.message) {
      return null;
    }

    const message = update.message;
    const chat = message.chat;
    const from = message.from;

    // Bỏ qua tin nhắn từ bot
    if (from.is_bot) {
      return null;
    }

    // Xác định loại chat và tạo identifier phù hợp
    const isGroupChat = chat.type === 'group' || chat.type === 'supergroup';
    const conversationId = isGroupChat ? chat.id.toString() : from.id.toString();
    
    // Tạo tên hiển thị của người gửi (không phải tên group)
    const senderDisplayName = `${from.first_name || ''} ${from.last_name || ''}`.trim() || from.username || `User ${from.id}`;
    
    // Kiểm tra xem bot có được mention trong group chat không
    let shouldProcess = false;
    if (isGroupChat) {
      // Trong group chat, chỉ xử lý khi bot được mention hoặc reply
      const botMention = message.text && (
        message.text.includes('@' + (this.botUsername || 'bot')) ||
        message.text.startsWith('/') ||
        message.reply_to_message?.from?.is_bot ||
        message.entities?.some(entity => entity.type === 'mention')
      );
      shouldProcess = botMention;
    } else {
      // Trong private chat, xử lý tất cả tin nhắn
      shouldProcess = true;
    }

    // Chỉ trả về tin nhắn nếu cần xử lý
    if (!shouldProcess) {
      return null;
    }

    return {
      messageId: message.message_id,
      chatId: chat.id.toString(),
      userId: from.id.toString(),
      conversationId: conversationId, // ID để tracking conversation
      username: from.username,
      firstName: from.first_name,
      lastName: from.last_name,
      senderDisplayName: senderDisplayName, // Tên người gửi
      text: message.text,
      timestamp: message.date,
      chatType: chat.type,
      isGroupChat: isGroupChat,
      groupTitle: chat.title,
      isBot: from.is_bot
    };
  }
}

module.exports = new TelegramService();
