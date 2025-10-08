/**
 * Web Message Repository - Infrastructure layer
 * Handles web message data operations
 */
class WebMessageRepository {
  constructor ({ db, logger }) {
    this.db = db
    this.logger = logger
  }

  /**
   * Create a new message
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} - Created message
   */
  async create (messageData) {
    try {
      const {
        webConversationId,
        content,
        messageType,
        metadata,
        chatwootMessageId,
        difyMessageId
      } = messageData

      const query = `
        INSERT INTO web_messages (
          web_conversation_id, content, message_type, metadata, 
          chatwoot_message_id, dify_message_id
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `

      const result = await this.db.query(query, [
        webConversationId,
        content,
        messageType,
        metadata ? JSON.stringify(metadata) : null,
        chatwootMessageId,
        difyMessageId
      ])

      this.logger.info('Web message created', {
        messageId: result.rows[0].id,
        conversationId: webConversationId,
        messageType
      })

      return result.rows[0]
    } catch (error) {
      this.logger.error('Failed to create web message', { error: error.message })
      throw error
    }
  }

  /**
   * Find message by ID
   * @param {number} id - Message ID
   * @returns {Promise<Object|null>} - Message object or null
   */
  async findById (id) {
    try {
      const query = 'SELECT * FROM web_messages WHERE id = $1'
      const result = await this.db.query(query, [id])

      return result.rows[0] || null
    } catch (error) {
      this.logger.error('Failed to find web message by ID', { id, error: error.message })
      throw error
    }
  }

  /**
   * Get messages for a conversation
   * @param {number} conversationId - Conversation ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of messages
   */
  async findByConversationId (conversationId, options = {}) {
    try {
      const { limit = 50, offset = 0, order = 'ASC' } = options

      const query = `
        SELECT * FROM web_messages 
        WHERE web_conversation_id = $1
        ORDER BY created_at ${order}
        LIMIT $2 OFFSET $3
      `

      const result = await this.db.query(query, [conversationId, limit, offset])

      return result.rows
    } catch (error) {
      this.logger.error('Failed to find messages by conversation ID', {
        conversationId,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Get message count for a conversation
   * @param {number} conversationId - Conversation ID
   * @returns {Promise<number>} - Message count
   */
  async countByConversationId (conversationId) {
    try {
      const query = 'SELECT COUNT(*) as count FROM web_messages WHERE web_conversation_id = $1'
      const result = await this.db.query(query, [conversationId])

      return parseInt(result.rows[0].count)
    } catch (error) {
      this.logger.error('Failed to count messages', { conversationId, error: error.message })
      throw error
    }
  }

  /**
   * Update message
   * @param {number} id - Message ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} - Updated message
   */
  async update (id, updateData) {
    try {
      const { content, metadata, chatwootMessageId, difyMessageId } = updateData

      const query = `
        UPDATE web_messages 
        SET content = COALESCE($1, content),
            metadata = COALESCE($2, metadata),
            chatwoot_message_id = COALESCE($3, chatwoot_message_id),
            dify_message_id = COALESCE($4, dify_message_id)
        WHERE id = $5
        RETURNING *
      `

      const result = await this.db.query(query, [
        content,
        metadata ? JSON.stringify(metadata) : undefined,
        chatwootMessageId,
        difyMessageId,
        id
      ])

      if (result.rows.length === 0) {
        throw new Error('Web message not found')
      }

      this.logger.info('Web message updated', { messageId: id })
      return result.rows[0]
    } catch (error) {
      this.logger.error('Failed to update web message', { id, error: error.message })
      throw error
    }
  }

  /**
   * Delete message
   * @param {number} id - Message ID
   * @returns {Promise<boolean>} - Success status
   */
  async delete (id) {
    try {
      const query = 'DELETE FROM web_messages WHERE id = $1'
      const result = await this.db.query(query, [id])

      const deleted = result.rowCount > 0
      if (deleted) {
        this.logger.info('Web message deleted', { messageId: id })
      }

      return deleted
    } catch (error) {
      this.logger.error('Failed to delete web message', { id, error: error.message })
      throw error
    }
  }

  /**
   * Delete all messages for a conversation
   * @param {number} conversationId - Conversation ID
   * @returns {Promise<number>} - Number of deleted messages
   */
  async deleteByConversationId (conversationId) {
    try {
      const query = 'DELETE FROM web_messages WHERE web_conversation_id = $1'
      const result = await this.db.query(query, [conversationId])

      const deletedCount = result.rowCount
      if (deletedCount > 0) {
        this.logger.info('Web messages deleted', { conversationId, count: deletedCount })
      }

      return deletedCount
    } catch (error) {
      this.logger.error('Failed to delete messages by conversation ID', {
        conversationId,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Get latest message for a conversation
   * @param {number} conversationId - Conversation ID
   * @returns {Promise<Object|null>} - Latest message or null
   */
  async findLatestByConversationId (conversationId) {
    try {
      const query = `
        SELECT * FROM web_messages 
        WHERE web_conversation_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `
      const result = await this.db.query(query, [conversationId])

      return result.rows[0] || null
    } catch (error) {
      this.logger.error('Failed to find latest message', { conversationId, error: error.message })
      throw error
    }
  }
}

module.exports = WebMessageRepository
