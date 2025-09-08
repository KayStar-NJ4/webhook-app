const telegramService = require('../services/telegramService');
const messageBroker = require('../services/messageBroker');
const logger = require('../utils/logger');

class TelegramHandler {
  /**
   * Xử lý webhook từ Telegram
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  async handleWebhook(req, res) {
    try {
      const update = req.body;
      
      logger.info('Received Telegram webhook', {
        updateId: update.update_id,
        hasMessage: !!update.message
      });

      // Xử lý tin nhắn
      if (update.message) {
        const telegramMessage = telegramService.processMessage(update);
        
        if (telegramMessage && !telegramMessage.isBot) {
          // Chỉ xử lý tin nhắn văn bản
          if (telegramMessage.text) {
            await messageBroker.handleTelegramMessage(telegramMessage);
          } else {
            // Xử lý tin nhắn khác (sticker, hình ảnh, etc.)
            await this.handleOtherMessage(update.message);
          }
        }
      }

      // Xử lý callback query (nếu có)
      if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      }

      // Trả về OK để Telegram biết webhook đã được xử lý
      res.status(200).json({ status: 'ok' });

    } catch (error) {
      logger.error('Failed to handle Telegram webhook', {
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
   * Xử lý callback query từ inline keyboard
   * @param {object} callbackQuery - Callback query object
   */
  async handleCallbackQuery(callbackQuery) {
    try {
      const { id, from, data, message } = callbackQuery;
      
      logger.info('Processing Telegram callback query', {
        callbackId: id,
        userId: from.id,
        data: data
      });

      // Answer callback query để xóa loading state
      await telegramService.answerCallbackQuery(id, {
        text: 'Đã xử lý!',
        show_alert: false
      });

      // Xử lý dữ liệu callback
      if (data) {
        await this.processCallbackData(data, from, message);
      }

    } catch (error) {
      logger.error('Failed to handle callback query', {
        error: error.message,
        callbackQuery: callbackQuery
      });
    }
  }

  /**
   * Xử lý dữ liệu callback
   * @param {string} data - Dữ liệu callback
   * @param {object} from - Thông tin user
   * @param {object} message - Tin nhắn gốc
   */
  async processCallbackData(data, from, message) {
    try {
      const chatId = message.chat.id;
      
      // Ví dụ xử lý các loại callback khác nhau
      switch (data) {
        case 'start_conversation':
          await telegramService.sendMessage(
            chatId,
            'Chào mừng bạn! Tôi có thể giúp gì cho bạn?'
          );
          break;
          
        case 'help':
          await telegramService.sendMessage(
            chatId,
            'Đây là menu trợ giúp:\n\n' +
            '• Gửi tin nhắn bất kỳ để bắt đầu trò chuyện\n' +
            '• Sử dụng /help để xem menu này\n' +
            '• Sử dụng /start để bắt đầu lại'
          );
          break;
          
        default:
          await telegramService.sendMessage(
            chatId,
            'Tôi không hiểu lệnh này. Vui lòng thử lại.'
          );
      }

    } catch (error) {
      logger.error('Failed to process callback data', {
        data,
        error: error.message
      });
    }
  }

  /**
   * Xử lý lệnh /start
   * @param {object} message - Tin nhắn từ Telegram
   */
  async handleStartCommand(message) {
    try {
      const chatId = message.chat.id;
      const firstName = message.from.first_name || 'Bạn';

      const welcomeMessage = `Xin chào ${firstName}! 👋\n\n` +
        'Tôi là chatbot được tích hợp với AI. Tôi có thể giúp bạn:\n\n' +
        '• Trả lời câu hỏi\n' +
        '• Hỗ trợ thông tin\n' +
        '• Kết nối với đội ngũ hỗ trợ\n\n' +
        'Hãy gửi tin nhắn để bắt đầu trò chuyện!';

      await telegramService.sendMessage(chatId, welcomeMessage, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🚀 Bắt đầu', callback_data: 'start_conversation' },
              { text: '❓ Trợ giúp', callback_data: 'help' }
            ]
          ]
        }
      });

    } catch (error) {
      logger.error('Failed to handle start command', {
        error: error.message,
        message: message
      });
    }
  }

  /**
   * Xử lý lệnh /help
   * @param {object} message - Tin nhắn từ Telegram
   */
  async handleHelpCommand(message) {
    try {
      const chatId = message.chat.id;

      const helpMessage = '📋 **Menu Trợ Giúp**\n\n' +
        '**Các lệnh có sẵn:**\n' +
        '• `/start` - Bắt đầu trò chuyện\n' +
        '• `/help` - Hiển thị menu này\n\n' +
        '**Cách sử dụng:**\n' +
        '• Gửi tin nhắn bất kỳ để trò chuyện với AI\n' +
        '• Sử dụng nút bên dưới để tương tác nhanh\n\n' +
        '**Liên hệ hỗ trợ:**\n' +
        'Nếu cần hỗ trợ thêm, hãy gửi tin nhắn và đội ngũ sẽ phản hồi sớm nhất!';

      await telegramService.sendMessage(chatId, helpMessage, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔄 Bắt đầu lại', callback_data: 'start_conversation' }
            ]
          ]
        }
      });

    } catch (error) {
      logger.error('Failed to handle help command', {
        error: error.message,
        message: message
      });
    }
  }

  /**
   * Xử lý tin nhắn văn bản thông thường
   * @param {object} message - Tin nhắn từ Telegram
   */
  async handleTextMessage(message) {
    try {
      const telegramMessage = telegramService.processMessage({ message });
      
      if (telegramMessage && !telegramMessage.isBot) {
        await messageBroker.handleTelegramMessage(telegramMessage);
      }

    } catch (error) {
      logger.error('Failed to handle text message', {
        error: error.message,
        message: message
      });
    }
  }

  /**
   * Xử lý các loại tin nhắn khác (hình ảnh, file, etc.)
   * @param {object} message - Tin nhắn từ Telegram
   */
  async handleOtherMessage(message) {
    try {
      const chatId = message.chat.id;
      
      // Xử lý hình ảnh
      if (message.photo) {
        await telegramService.sendMessage(
          chatId,
          'Tôi đã nhận được hình ảnh của bạn. Hiện tại tôi chưa thể xử lý hình ảnh, nhưng tôi có thể trò chuyện với bạn qua tin nhắn văn bản!'
        );
      }
      
      // Xử lý file
      else if (message.document) {
        await telegramService.sendMessage(
          chatId,
          'Tôi đã nhận được file của bạn. Hiện tại tôi chưa thể xử lý file, nhưng tôi có thể trò chuyện với bạn qua tin nhắn văn bản!'
        );
      }
      
      // Xử lý sticker
      else if (message.sticker) {
        await telegramService.sendMessage(
          chatId,
          'Sticker đẹp quá! 😄 Tôi có thể trò chuyện với bạn qua tin nhắn văn bản!'
        );
      }
      
      // Xử lý voice
      else if (message.voice) {
        await telegramService.sendMessage(
          chatId,
          'Tôi đã nhận được tin nhắn thoại của bạn. Hiện tại tôi chưa thể xử lý tin nhắn thoại, nhưng tôi có thể trò chuyện với bạn qua tin nhắn văn bản!'
        );
      }

    } catch (error) {
      logger.error('Failed to handle other message type', {
        error: error.message,
        message: message
      });
    }
  }
}

module.exports = new TelegramHandler();
