const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class DifyService {
  constructor() {
    this.apiUrl = config.dify.apiUrl;
    this.apiKey = config.dify.apiKey;
    this.appId = config.dify.appId;
    
    this.apiClient = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Gửi tin nhắn đến Dify AI và nhận phản hồi
   * @param {string} message - Nội dung tin nhắn
   * @param {string} userId - ID của user (để Dify theo dõi conversation)
   * @param {object} additionalData - Dữ liệu bổ sung
   */
  async sendMessage(message, userId, additionalData = {}) {
    try {
      const payload = {
        inputs: {
          query: message,
          ...additionalData
        },
        query: message,
        response_mode: 'blocking', // hoặc 'streaming' nếu muốn streaming response
        user: userId,
        conversation_id: '', // Dify sẽ tự tạo nếu để trống
        files: [] // Có thể thêm file attachments nếu cần
      };

      const response = await this.apiClient.post(`/chat-messages`, payload);
      
      logger.info('Message sent to Dify AI successfully', {
        userId,
        messageId: response.data.id,
        conversationId: response.data.conversation_id
      });

      return {
        id: response.data.id,
        conversationId: response.data.conversation_id,
        answer: response.data.answer,
        metadata: response.data.metadata,
        usage: response.data.usage
      };
    } catch (error) {
      logger.error('Failed to send message to Dify AI', {
        userId,
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Lấy lịch sử conversation từ Dify
   * @param {string} conversationId - ID của conversation
   * @param {string} userId - ID của user
   */
  async getConversationHistory(conversationId, userId) {
    try {
      const response = await this.apiClient.get(`/messages`, {
        params: {
          conversation_id: conversationId,
          user: userId,
          first_id: '',
          limit: 20
        }
      });

      return response.data.data || [];
    } catch (error) {
      logger.error('Failed to get conversation history from Dify', {
        conversationId,
        userId,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Tạo conversation mới trong Dify
   * @param {string} userId - ID của user
   * @param {string} name - Tên conversation (optional)
   */
  async createConversation(userId, name = '') {
    try {
      const payload = {
        name: name || `Conversation ${new Date().toISOString()}`,
        inputs: {},
        query: '',
        response_mode: 'blocking',
        user: userId
      };

      const response = await this.apiClient.post(`/conversations`, payload);
      
      logger.info('Conversation created in Dify successfully', {
        conversationId: response.data.id,
        userId
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to create conversation in Dify', {
        userId,
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Lấy danh sách conversations của user
   * @param {string} userId - ID của user
   */
  async getUserConversations(userId) {
    try {
      const response = await this.apiClient.get(`/conversations`, {
        params: {
          user: userId,
          first_id: '',
          limit: 20
        }
      });

      return response.data.data || [];
    } catch (error) {
      logger.error('Failed to get user conversations from Dify', {
        userId,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Xóa conversation
   * @param {string} conversationId - ID của conversation
   */
  async deleteConversation(conversationId) {
    try {
      const response = await this.apiClient.delete(`/conversations/${conversationId}`);
      
      logger.info('Conversation deleted from Dify successfully', {
        conversationId
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to delete conversation from Dify', {
        conversationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Lấy thông tin app
   */
  async getAppInfo() {
    try {
      const response = await this.apiClient.get(`/parameters`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get Dify app info', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Xử lý streaming response (nếu cần)
   * @param {string} message - Nội dung tin nhắn
   * @param {string} userId - ID của user
   * @param {function} onData - Callback function để xử lý data streaming
   */
  async sendMessageStreaming(message, userId, onData) {
    try {
      const payload = {
        inputs: {
          query: message
        },
        query: message,
        response_mode: 'streaming',
        user: userId,
        conversation_id: ''
      };

      const response = await this.apiClient.post(`/chat-messages`, payload, {
        responseType: 'stream'
      });

      return new Promise((resolve, reject) => {
        let fullResponse = '';
        
        response.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.event === 'message') {
                  fullResponse += data.answer;
                  onData(data.answer);
                } else if (data.event === 'message_end') {
                  resolve({
                    id: data.task_id,
                    conversationId: data.conversation_id,
                    answer: fullResponse,
                    metadata: data.metadata
                  });
                }
              } catch (e) {
                // Ignore parsing errors for incomplete chunks
              }
            }
          }
        });

        response.data.on('error', reject);
      });
    } catch (error) {
      logger.error('Failed to send streaming message to Dify AI', {
        userId,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new DifyService();
