/**
 * Web Conversation Repository - Infrastructure layer
 * Handles web conversation data operations
 */
class WebConversationRepository {
  constructor ({ db, logger }) {
    this.db = db
    this.logger = logger
  }

  /**
   * Create a new web conversation
   * @param {Object} conversationData - Conversation data
   * @returns {Promise<Object>} - Created conversation
   */
  async create (conversationData) {
    try {
      const {
        webAppId,
        sessionId,
        userIdentifier,
        userName,
        userEmail,
        userMetadata,
        status = 'active'
      } = conversationData

      const query = `
        INSERT INTO web_conversations (
          web_app_id, session_id, user_identifier, user_name, user_email, 
          user_metadata, status, last_message_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        RETURNING *
      `

      const result = await this.db.query(query, [
        webAppId,
        sessionId,
        userIdentifier,
        userName,
        userEmail,
        userMetadata ? JSON.stringify(userMetadata) : null,
        status
      ])

      this.logger.info('Web conversation created', {
        conversationId: result.rows[0].id,
        webAppId,
        sessionId
      })

      return result.rows[0]
    } catch (error) {
      this.logger.error('Failed to create web conversation', { error: error.message })
      throw error
    }
  }

  /**
   * Find conversation by ID
   * @param {number} id - Conversation ID
   * @returns {Promise<Object|null>} - Conversation object or null
   */
  async findById (id) {
    try {
      const query = 'SELECT * FROM web_conversations WHERE id = $1'
      const result = await this.db.query(query, [id])

      return result.rows[0] || null
    } catch (error) {
      this.logger.error('Failed to find web conversation by ID', { id, error: error.message })
      throw error
    }
  }

  /**
   * Find conversation by session ID
   * @param {string} sessionId - Session ID
   * @param {number} webAppId - Web App ID
   * @returns {Promise<Object|null>} - Conversation object or null
   */
  async findBySessionId (sessionId, webAppId) {
    try {
      const query = `
        SELECT * FROM web_conversations 
        WHERE session_id = $1 AND web_app_id = $2
        ORDER BY created_at DESC
        LIMIT 1
      `
      const result = await this.db.query(query, [sessionId, webAppId])

      return result.rows[0] || null
    } catch (error) {
      this.logger.error('Failed to find web conversation by session ID', {
        sessionId,
        webAppId,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Update conversation
   * @param {number} id - Conversation ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} - Updated conversation
   */
  async update (id, updateData) {
    try {
      const {
        userName,
        userEmail,
        userMetadata,
        chatwootConversationId,
        chatwootContactId,
        difyConversationId,
        status,
        lastMessageAt
      } = updateData

      const query = `
        UPDATE web_conversations 
        SET user_name = COALESCE($1, user_name),
            user_email = COALESCE($2, user_email),
            user_metadata = COALESCE($3, user_metadata),
            chatwoot_conversation_id = COALESCE($4, chatwoot_conversation_id),
            chatwoot_contact_id = COALESCE($5, chatwoot_contact_id),
            dify_conversation_id = COALESCE($6, dify_conversation_id),
            status = COALESCE($7, status),
            last_message_at = COALESCE($8, last_message_at),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
        RETURNING *
      `

      const result = await this.db.query(query, [
        userName,
        userEmail,
        userMetadata ? JSON.stringify(userMetadata) : undefined,
        chatwootConversationId,
        chatwootContactId,
        difyConversationId,
        status,
        lastMessageAt,
        id
      ])

      if (result.rows.length === 0) {
        throw new Error('Web conversation not found')
      }

      this.logger.info('Web conversation updated', { conversationId: id })
      return result.rows[0]
    } catch (error) {
      this.logger.error('Failed to update web conversation', { id, error: error.message })
      throw error
    }
  }

  /**
   * Update Dify conversation ID
   * @param {number} id - Conversation ID
   * @param {string} difyConversationId - Dify conversation ID
   * @returns {Promise<Object>} - Updated conversation
   */
  async updateDifyConversationId (id, difyConversationId) {
    try {
      const query = `
        UPDATE web_conversations 
        SET dify_conversation_id = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `

      const result = await this.db.query(query, [difyConversationId, id])

      if (result.rows.length === 0) {
        throw new Error('Web conversation not found')
      }

      this.logger.info('Web conversation Dify ID updated', { conversationId: id, difyConversationId })
      return result.rows[0]
    } catch (error) {
      this.logger.error('Failed to update Dify conversation ID', { id, error: error.message })
      throw error
    }
  }

  /**
   * Get all conversations for a web app with pagination
   * @param {number} webAppId - Web App ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Conversations and pagination info
   */
  async findByWebAppId (webAppId, options = {}) {
    try {
      const { page = 1, limit = 10, status = null, sortBy = 'last_message_at.desc' } = options
      const offset = (page - 1) * limit

      let whereClause = 'WHERE web_app_id = $1'
      const params = [webAppId]
      let paramCount = 1

      if (status) {
        paramCount++
        whereClause += ` AND status = $${paramCount}`
        params.push(status)
      }

      // Handle sorting
      let orderBy = 'ORDER BY last_message_at DESC'
      if (sortBy) {
        const [field, direction] = sortBy.split('.')
        const validFields = ['created_at', 'last_message_at', 'status']
        const validDirections = ['asc', 'desc']

        if (validFields.includes(field) && validDirections.includes(direction)) {
          orderBy = `ORDER BY ${field} ${direction.toUpperCase()}`
        }
      }

      const countQuery = `SELECT COUNT(*) as total FROM web_conversations ${whereClause}`
      const countResult = await this.db.query(countQuery, params)
      const total = parseInt(countResult.rows[0].total)

      const query = `
        SELECT * FROM web_conversations 
        ${whereClause}
        ${orderBy}
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `

      const result = await this.db.query(query, [...params, limit, offset])

      return {
        conversations: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      this.logger.error('Failed to find conversations by web app ID', {
        webAppId,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Delete conversation
   * @param {number} id - Conversation ID
   * @returns {Promise<boolean>} - Success status
   */
  async delete (id) {
    try {
      const query = 'DELETE FROM web_conversations WHERE id = $1'
      const result = await this.db.query(query, [id])

      const deleted = result.rowCount > 0
      if (deleted) {
        this.logger.info('Web conversation deleted', { conversationId: id })
      }

      return deleted
    } catch (error) {
      this.logger.error('Failed to delete web conversation', { id, error: error.message })
      throw error
    }
  }
}

module.exports = WebConversationRepository
