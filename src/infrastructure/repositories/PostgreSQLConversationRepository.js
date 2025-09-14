const ConversationRepository = require('../../domain/repositories/ConversationRepository')
const Conversation = require('../../domain/entities/Conversation')
const { Pool } = require('pg')

/**
 * PostgreSQL Conversation Repository Implementation
 * Stores conversations in PostgreSQL database with detailed information
 */
class PostgreSQLConversationRepository extends ConversationRepository {
  constructor({ config, logger }) {
    super()
    this.config = config
    this.logger = logger
    this.pool = null
  }

  /**
   * Initialize PostgreSQL connection
   */
  async initialize() {
    try {
      this.pool = new Pool({
        host: this.config.get('database.host'),
        port: this.config.get('database.port'),
        database: this.config.get('database.name'),
        user: this.config.get('database.user'),
        password: this.config.get('database.password'),
        ssl: this.config.get('database.ssl') ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      })

      this.pool.on('error', (err) => {
        this.logger.error('PostgreSQL pool error', { error: err.message })
      })

      // Test connection
      const client = await this.pool.connect()
      await client.query('SELECT NOW()')
      client.release()

      // PostgreSQL connected successfully
      
      // Create table if not exists
      await this.createTable()
    } catch (error) {
      this.logger.error('Failed to initialize PostgreSQL', { error: error.message })
      throw error
    }
  }

  /**
   * Create conversations table if not exists
   */
  async createTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(255) PRIMARY KEY,
        platform VARCHAR(50) NOT NULL,
        chat_type VARCHAR(20) NOT NULL CHECK (chat_type IN ('private', 'group', 'supergroup', 'channel')),
        
        -- Thông tin cuộc trò chuyện
        chat_id VARCHAR(255) NOT NULL,
        chat_title VARCHAR(500),
        chat_username VARCHAR(255),
        chat_description TEXT,
        
        -- Thông tin người gửi tin nhắn đầu tiên
        sender_id VARCHAR(255),
        sender_username VARCHAR(255),
        sender_first_name VARCHAR(255),
        sender_last_name VARCHAR(255),
        sender_language_code VARCHAR(10),
        sender_is_bot BOOLEAN DEFAULT FALSE,
        
        -- Thông tin nhóm (nếu là group chat)
        group_id VARCHAR(255),
        group_title VARCHAR(500),
        group_username VARCHAR(255),
        group_description TEXT,
        group_member_count INTEGER,
        group_is_verified BOOLEAN DEFAULT FALSE,
        group_is_restricted BOOLEAN DEFAULT FALSE,
        
        -- Thông tin kết nối với các hệ thống khác
        chatwoot_id VARCHAR(255),
        chatwoot_inbox_id VARCHAR(255),
        dify_id VARCHAR(255),
        
        -- Metadata bổ sung
        participants JSONB DEFAULT '[]'::jsonb,
        platform_metadata JSONB DEFAULT '{}'::jsonb,
        chatwoot_metadata JSONB DEFAULT '{}'::jsonb,
        
        -- Trạng thái
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked', 'deleted')),
        is_active BOOLEAN DEFAULT TRUE,
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_message_at TIMESTAMP,
        
        -- Indexes
        CONSTRAINT unique_platform_chat UNIQUE (platform, chat_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_conversations_platform ON conversations(platform);
      CREATE INDEX IF NOT EXISTS idx_conversations_chat_type ON conversations(chat_type);
      CREATE INDEX IF NOT EXISTS idx_conversations_chatwoot_id ON conversations(chatwoot_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_dify_id ON conversations(dify_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_sender_id ON conversations(sender_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_group_id ON conversations(group_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
      CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
      CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);
    `

    try {
      await this.pool.query(createTableQuery)
      // Conversations table created/verified successfully
    } catch (error) {
      this.logger.error('Failed to create conversations table', { error: error.message })
      throw error
    }
  }

  /**
   * Find conversation by ID
   * @param {string} id - Conversation ID
   * @returns {Promise<Conversation|null>}
   */
  async findById(id) {
    try {
      const query = 'SELECT * FROM conversations WHERE id = $1'
      const result = await this.pool.query(query, [id])
      
      if (result.rows.length === 0) return null
      
      const row = result.rows[0]
      return this.mapRowToConversation(row)
    } catch (error) {
      this.logger.error('Failed to find conversation by ID', {
        error: error.message,
        id
      })
      throw error
    }
  }

  /**
   * Find conversation by platform and chat ID
   * @param {string} platform - Platform name
   * @param {string} chatId - Chat ID
   * @returns {Promise<Conversation|null>}
   */
  async findByPlatformChatId(platform, chatId) {
    try {
      const query = 'SELECT * FROM conversations WHERE platform = $1 AND chat_id = $2'
      const result = await this.pool.query(query, [platform, chatId])
      
      if (result.rows.length === 0) return null
      
      const row = result.rows[0]
      return this.mapRowToConversation(row)
    } catch (error) {
      this.logger.error('Failed to find conversation by platform and chat ID', {
        error: error.message,
        platform,
        chatId
      })
      throw error
    }
  }

  /**
   * Find conversation by Chatwoot ID
   * @param {string} chatwootId - Chatwoot conversation ID
   * @returns {Promise<Conversation|null>}
   */
  async findByChatwootId(chatwootId) {
    try {
      const query = 'SELECT * FROM conversations WHERE chatwoot_id = $1'
      const result = await this.pool.query(query, [chatwootId])
      
      if (result.rows.length === 0) return null
      
      const row = result.rows[0]
      return this.mapRowToConversation(row)
    } catch (error) {
      this.logger.error('Failed to find conversation by Chatwoot ID', {
        error: error.message,
        chatwootId
      })
      throw error
    }
  }

  /**
   * Save conversation
   * @param {Conversation} conversation - Conversation entity
   * @returns {Promise<Conversation>}
   */
  async save(conversation) {
    try {
      conversation.validate()
      
      const query = `
        INSERT INTO conversations (
          id, platform, chat_type, chat_id, chat_title, chat_username, chat_description,
          sender_id, sender_username, sender_first_name, sender_last_name, sender_language_code, sender_is_bot,
          group_id, group_title, group_username, group_description, group_member_count, group_is_verified, group_is_restricted,
          chatwoot_id, chatwoot_inbox_id, dify_id,
          participants, platform_metadata, chatwoot_metadata,
          status, is_active, created_at, updated_at, last_message_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)
        ON CONFLICT (id) DO UPDATE SET
          platform = EXCLUDED.platform,
          chat_type = EXCLUDED.chat_type,
          chat_id = EXCLUDED.chat_id,
          chat_title = EXCLUDED.chat_title,
          chat_username = EXCLUDED.chat_username,
          chat_description = EXCLUDED.chat_description,
          sender_id = EXCLUDED.sender_id,
          sender_username = EXCLUDED.sender_username,
          sender_first_name = EXCLUDED.sender_first_name,
          sender_last_name = EXCLUDED.sender_last_name,
          sender_language_code = EXCLUDED.sender_language_code,
          sender_is_bot = EXCLUDED.sender_is_bot,
          group_id = EXCLUDED.group_id,
          group_title = EXCLUDED.group_title,
          group_username = EXCLUDED.group_username,
          group_description = EXCLUDED.group_description,
          group_member_count = EXCLUDED.group_member_count,
          group_is_verified = EXCLUDED.group_is_verified,
          group_is_restricted = EXCLUDED.group_is_restricted,
          chatwoot_id = EXCLUDED.chatwoot_id,
          chatwoot_inbox_id = EXCLUDED.chatwoot_inbox_id,
          dify_id = EXCLUDED.dify_id,
          participants = EXCLUDED.participants,
          platform_metadata = EXCLUDED.platform_metadata,
          chatwoot_metadata = EXCLUDED.chatwoot_metadata,
          status = EXCLUDED.status,
          is_active = EXCLUDED.is_active,
          updated_at = EXCLUDED.updated_at,
          last_message_at = EXCLUDED.last_message_at
        RETURNING *
      `
      
      const values = [
        conversation.id,
        conversation.platform,
        conversation.chatType,
        conversation.chatId,
        conversation.chatTitle,
        conversation.chatUsername,
        conversation.chatDescription,
        conversation.senderId,
        conversation.senderUsername,
        conversation.senderFirstName,
        conversation.senderLastName,
        conversation.senderLanguageCode,
        conversation.senderIsBot,
        conversation.groupId,
        conversation.groupTitle,
        conversation.groupUsername,
        conversation.groupDescription,
        conversation.groupMemberCount,
        conversation.groupIsVerified,
        conversation.groupIsRestricted,
        conversation.chatwootId,
        conversation.chatwootInboxId,
        conversation.difyId,
        JSON.stringify(conversation.participants),
        JSON.stringify(conversation.platformMetadata),
        JSON.stringify(conversation.chatwootMetadata),
        conversation.status,
        conversation.isActive,
        conversation.createdAt,
        conversation.updatedAt,
        conversation.lastMessageAt
      ]
      
      const result = await this.pool.query(query, values)
      const savedConversation = this.mapRowToConversation(result.rows[0])
      
      this.logger.info('Conversation saved to PostgreSQL', {
        conversationId: conversation.id,
        platform: conversation.platform,
        chatType: conversation.chatType,
        chatDisplayName: conversation.getChatDisplayName()
      })
      
      return savedConversation
    } catch (error) {
      this.logger.error('Failed to save conversation', {
        error: error.message,
        conversationId: conversation.id
      })
      throw error
    }
  }

  /**
   * Update conversation
   * @param {Conversation} conversation - Conversation entity
   * @returns {Promise<Conversation>}
   */
  async update(conversation) {
    try {
      const existing = await this.findById(conversation.id)
      if (!existing) {
        throw new Error(`Conversation with ID ${conversation.id} not found`)
      }

      conversation.validate()
      
      const query = `
        UPDATE conversations 
        SET 
          platform = $2, chat_type = $3, chat_id = $4, chat_title = $5, chat_username = $6, chat_description = $7,
          sender_id = $8, sender_username = $9, sender_first_name = $10, sender_last_name = $11, sender_language_code = $12, sender_is_bot = $13,
          group_id = $14, group_title = $15, group_username = $16, group_description = $17, group_member_count = $18, group_is_verified = $19, group_is_restricted = $20,
          chatwoot_id = $21, chatwoot_inbox_id = $22, dify_id = $23,
          participants = $24, platform_metadata = $25, chatwoot_metadata = $26,
          status = $27, is_active = $28, updated_at = $29, last_message_at = $30
        WHERE id = $1
        RETURNING *
      `
      
      const values = [
        conversation.id,
        conversation.platform,
        conversation.chatType,
        conversation.chatId,
        conversation.chatTitle,
        conversation.chatUsername,
        conversation.chatDescription,
        conversation.senderId,
        conversation.senderUsername,
        conversation.senderFirstName,
        conversation.senderLastName,
        conversation.senderLanguageCode,
        conversation.senderIsBot,
        conversation.groupId,
        conversation.groupTitle,
        conversation.groupUsername,
        conversation.groupDescription,
        conversation.groupMemberCount,
        conversation.groupIsVerified,
        conversation.groupIsRestricted,
        conversation.chatwootId,
        conversation.chatwootInboxId,
        conversation.difyId,
        JSON.stringify(conversation.participants),
        JSON.stringify(conversation.platformMetadata),
        JSON.stringify(conversation.chatwootMetadata),
        conversation.status,
        conversation.isActive,
        new Date(),
        conversation.lastMessageAt
      ]
      
      const result = await this.pool.query(query, values)
      const updatedConversation = this.mapRowToConversation(result.rows[0])
      
      this.logger.info('Conversation updated in PostgreSQL', {
        conversationId: conversation.id
      })
      
      return updatedConversation
    } catch (error) {
      this.logger.error('Failed to update conversation', {
        error: error.message,
        conversationId: conversation.id
      })
      throw error
    }
  }

  /**
   * Delete conversation
   * @param {string} id - Conversation ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      const query = 'DELETE FROM conversations WHERE id = $1'
      const result = await this.pool.query(query, [id])
      
      const deleted = result.rowCount > 0
      if (deleted) {
        this.logger.info('Conversation deleted from PostgreSQL', { conversationId: id })
      }
      
      return deleted
    } catch (error) {
      this.logger.error('Failed to delete conversation', {
        error: error.message,
        conversationId: id
      })
      throw error
    }
  }

  /**
   * Get all conversations
   * @param {Object} options - Query options
   * @returns {Promise<Conversation[]>}
   */
  async findAll(options = {}) {
    try {
      let query = 'SELECT * FROM conversations'
      const values = []
      const conditions = []

      if (options.platform) {
        conditions.push(`platform = $${values.length + 1}`)
        values.push(options.platform)
      }

      if (options.chatType) {
        conditions.push(`chat_type = $${values.length + 1}`)
        values.push(options.chatType)
      }

      if (options.status) {
        conditions.push(`status = $${values.length + 1}`)
        values.push(options.status)
      }

      if (options.isActive !== undefined) {
        conditions.push(`is_active = $${values.length + 1}`)
        values.push(options.isActive)
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ')
      }

      query += ' ORDER BY last_message_at DESC NULLS LAST, created_at DESC'

      if (options.limit) {
        query += ` LIMIT $${values.length + 1}`
        values.push(options.limit)
      }

      const result = await this.pool.query(query, values)
      return result.rows.map(row => this.mapRowToConversation(row))
    } catch (error) {
      this.logger.error('Failed to find all conversations', {
        error: error.message
      })
      throw error
    }
  }

  /**
   * Get conversations by platform
   * @param {string} platform - Platform name
   * @param {Object} options - Query options
   * @returns {Promise<Conversation[]>}
   */
  async findByPlatform(platform, options = {}) {
    return await this.findAll({ ...options, platform })
  }

  /**
   * Get conversations by chat type
   * @param {string} chatType - Chat type (private, group, supergroup, channel)
   * @param {Object} options - Query options
   * @returns {Promise<Conversation[]>}
   */
  async findByChatType(chatType, options = {}) {
    return await this.findAll({ ...options, chatType })
  }

  /**
   * Get active conversations
   * @param {Object} options - Query options
   * @returns {Promise<Conversation[]>}
   */
  async findActive(options = {}) {
    return await this.findAll({ ...options, isActive: true, status: 'active' })
  }

  /**
   * Update last message timestamp
   * @param {string} id - Conversation ID
   * @param {Date} timestamp - Last message timestamp
   * @returns {Promise<boolean>}
   */
  async updateLastMessageAt(id, timestamp = new Date()) {
    try {
      const query = `
        UPDATE conversations 
        SET last_message_at = $2, updated_at = $3
        WHERE id = $1
      `
      const result = await this.pool.query(query, [id, timestamp, new Date()])
      
      return result.rowCount > 0
    } catch (error) {
      this.logger.error('Failed to update last message timestamp', {
        error: error.message,
        conversationId: id
      })
      throw error
    }
  }

  /**
   * Map database row to Conversation entity
   * @param {Object} row - Database row
   * @returns {Conversation}
   */
  mapRowToConversation(row) {
    return new Conversation({
      id: row.id,
      platform: row.platform,
      chatType: row.chat_type,
      chatId: row.chat_id,
      chatTitle: row.chat_title,
      chatUsername: row.chat_username,
      chatDescription: row.chat_description,
      senderId: row.sender_id,
      senderUsername: row.sender_username,
      senderFirstName: row.sender_first_name,
      senderLastName: row.sender_last_name,
      senderLanguageCode: row.sender_language_code,
      senderIsBot: row.sender_is_bot,
      groupId: row.group_id,
      groupTitle: row.group_title,
      groupUsername: row.group_username,
      groupDescription: row.group_description,
      groupMemberCount: row.group_member_count,
      groupIsVerified: row.group_is_verified,
      groupIsRestricted: row.group_is_restricted,
      chatwootId: row.chatwoot_id,
      chatwootInboxId: row.chatwoot_inbox_id,
      difyId: row.dify_id,
      participants: row.participants || [],
      platformMetadata: row.platform_metadata || {},
      chatwootMetadata: row.chatwoot_metadata || {},
      status: row.status,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastMessageAt: row.last_message_at
    })
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.pool) {
      await this.pool.end()
      this.logger.info('PostgreSQL connection closed')
    }
  }
}

module.exports = PostgreSQLConversationRepository