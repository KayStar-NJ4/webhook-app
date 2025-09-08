const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class ChatwootService {
  constructor() {
    this.baseUrl = config.chatwoot.baseUrl;
    this.accessToken = config.chatwoot.accessToken;
    this.accountId = config.chatwoot.accountId;
    
    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Tạo hoặc lấy conversation cho contact
   * @param {string} sourceId - ID của contact từ platform (Telegram user ID)
   * @param {object} contactData - Thông tin contact
   * @param {string} platformConversationId - ID conversation từ platform (Telegram chat ID)
   */
  async getOrCreateConversation(sourceId, contactData, platformConversationId = null) {
    try {
      // Tìm contact theo source_id
      const contacts = await this.findContactBySourceId(sourceId);
      
      if (contacts.length > 0) {
        const contact = contacts[0];
        // Tìm conversation active
        const conversations = await this.getContactConversations(contact.id);
        const activeConversation = conversations.find(conv => conv.status === 'open');
        
        if (activeConversation) {
          return activeConversation;
        }
        
        // Tạo conversation mới với source_id từ platform
        return await this.createConversation(contact.id, platformConversationId);
      } else {
        // Tạo contact mới
        const contact = await this.createContact(sourceId, contactData);
        return await this.createConversation(contact.id, platformConversationId);
      }
    } catch (error) {
      logger.error('Failed to get or create conversation', {
        sourceId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Tìm contact theo source_id
   * @param {string} sourceId - ID của contact từ platform
   */
  async findContactBySourceId(sourceId) {
    try {
      const response = await this.apiClient.get(`/api/v1/accounts/${this.accountId}/contacts/search`, {
        params: {
          q: sourceId,
          sort: 'created_at'
        }
      });
      
      return response.data.payload || [];
    } catch (error) {
      logger.error('Failed to find contact by source ID', {
        sourceId,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Tạo contact mới
   * @param {string} sourceId - ID của contact từ platform
   * @param {object} contactData - Thông tin contact
   */
  async createContact(sourceId, contactData) {
    try {
      const payload = {
        name: contactData.name || `${contactData.firstName} ${contactData.lastName}`.trim(),
        email: contactData.email || `${sourceId}@telegram.local`,
        phone_number: contactData.phoneNumber,
        custom_attributes: {
          source_id: sourceId,
          platform: 'telegram',
          username: contactData.username,
          first_name: contactData.firstName,
          last_name: contactData.lastName
        }
      };

      const response = await this.apiClient.post(`/api/v1/accounts/${this.accountId}/contacts`, payload);
      
      logger.info('Contact created successfully', {
        contactId: response.data.payload.id,
        sourceId
      });

      return response.data.payload;
    } catch (error) {
      logger.error('Failed to create contact', {
        sourceId,
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Tìm hoặc tạo API inbox
   */
  async getOrCreateApiInbox() {
    try {
      // Lấy danh sách inboxes
      const response = await this.apiClient.get(`/api/v1/accounts/${this.accountId}/inboxes`);
      const inboxes = response.data.payload || [];
      
      logger.info('Found inboxes', { 
        count: inboxes.length,
        inboxes: inboxes.map(inbox => ({ id: inbox.id, name: inbox.name, type: inbox.channel_type }))
      });
      
      // Tìm API inbox
      let apiInbox = inboxes.find(inbox => inbox.channel_type === 'api');
      
      if (!apiInbox) {
        logger.info('No API inbox found, creating new one');
        // Tạo API inbox mới
        const createResponse = await this.apiClient.post(`/api/v1/accounts/${this.accountId}/inboxes`, {
          name: 'Xiu xiu',
          channel: {
            type: 'api'
          }
        });
        apiInbox = createResponse.data;
        logger.info('Created new API inbox', { inboxId: apiInbox.id });
      } else {
        logger.info('Using existing API inbox', { inboxId: apiInbox.id, name: apiInbox.name });
      }
      
      return apiInbox.id;
    } catch (error) {
      logger.error('Failed to get or create API inbox', {
        error: error.message,
        response: error.response?.data
      });
      // Fallback to config inbox ID
      logger.info('Falling back to config inbox ID', { inboxId: config.chatwoot.inboxId });
      return config.chatwoot.inboxId;
    }
  }

  /**
   * Lấy danh sách conversations của contact
   * @param {number} contactId - ID của contact
   */
  async getContactConversations(contactId) {
    try {
      const response = await this.apiClient.get(`/api/v1/accounts/${this.accountId}/contacts/${contactId}/conversations`);
      return response.data.data || [];
    } catch (error) {
      logger.error('Failed to get contact conversations', {
        contactId,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Tạo conversation mới
   * @param {number} contactId - ID của contact
   * @param {string} platformConversationId - ID conversation từ platform
   */
  async createConversation(contactId, platformConversationId = null) {
    try {
      // Tìm hoặc tạo API inbox
      const inboxId = await this.getOrCreateApiInbox();
      
      const payload = {
        source_id: platformConversationId || `telegram_${Date.now()}`,
        inbox_id: inboxId,
        contact_id: contactId
      };

      const response = await this.apiClient.post(`/api/v1/accounts/${this.accountId}/conversations`, payload);
      
      logger.info('Conversation created successfully', {
        conversationId: response.data.id,
        contactId
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to create conversation', {
        contactId,
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Gửi tin nhắn vào conversation
   * @param {number} conversationId - ID của conversation
   * @param {string} message - Nội dung tin nhắn
   * @param {string} messageType - Loại tin nhắn (incoming/outgoing)
   * @param {object} additionalData - Dữ liệu bổ sung
   */
  async sendMessage(conversationId, message, messageType = 'incoming', additionalData = {}) {
    try {
      const payload = {
        content: message,
        message_type: messageType,
        private: false,
        ...additionalData
      };

      const response = await this.apiClient.post(
        `/api/v1/accounts/${this.accountId}/conversations/${conversationId}/messages`,
        payload
      );

      logger.info('Message sent to Chatwoot successfully', {
        conversationId,
        messageType,
        messageId: response.data.id
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to send message to Chatwoot', {
        conversationId,
        messageType,
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Lấy danh sách tin nhắn của conversation
   * @param {number} conversationId - ID của conversation
   */
  async getMessages(conversationId) {
    try {
      const response = await this.apiClient.get(
        `/api/v1/accounts/${this.accountId}/conversations/${conversationId}/messages`
      );
      return response.data.data || [];
    } catch (error) {
      logger.error('Failed to get messages from Chatwoot', {
        conversationId,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Cập nhật trạng thái conversation
   * @param {number} conversationId - ID của conversation
   * @param {string} status - Trạng thái mới (open/resolved)
   */
  async updateConversationStatus(conversationId, status) {
    try {
      const payload = { status };

      const response = await this.apiClient.put(
        `/api/v1/accounts/${this.accountId}/conversations/${conversationId}`,
        payload
      );

      logger.info('Conversation status updated', {
        conversationId,
        status
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to update conversation status', {
        conversationId,
        status,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new ChatwootService();
