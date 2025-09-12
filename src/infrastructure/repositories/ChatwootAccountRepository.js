/**
 * Chatwoot Account Repository - Infrastructure layer
 * Handles chatwoot account data operations
 */
class ChatwootAccountRepository {
  constructor({ db, logger }) {
    this.db = db
    this.logger = logger
  }

  /**
   * Create a new chatwoot account
   * @param {Object} accountData - Account data
   * @returns {Promise<Object>} - Created account
   */
  async create(accountData) {
    try {
      const { name, baseUrl, accessToken, accountId, inboxId, isActive, createdBy } = accountData
      
      const query = `
        INSERT INTO chatwoot_accounts (name, base_url, access_token, account_id, inbox_id, is_active, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, name, base_url, access_token, account_id, inbox_id, is_active, created_at
      `
      
      const result = await this.db.query(query, [name, baseUrl, accessToken, accountId, inboxId, isActive, createdBy])
      
      this.logger.info('Chatwoot account created', { accountId: result.rows[0].id, name })
      return result.rows[0]
      
    } catch (error) {
      this.logger.error('Failed to create chatwoot account', { error: error.message })
      throw error
    }
  }

  /**
   * Find account by ID
   * @param {number} id - Account ID
   * @returns {Promise<Object|null>} - Account object or null
   */
  async findById(id) {
    try {
      const query = 'SELECT * FROM chatwoot_accounts WHERE id = $1'
      const result = await this.db.query(query, [id])
      
      return result.rows[0] || null
      
    } catch (error) {
      this.logger.error('Failed to find chatwoot account by ID', { id, error: error.message })
      throw error
    }
  }

  /**
   * Find account by account ID
   * @param {string} accountId - Chatwoot account ID
   * @returns {Promise<Object|null>} - Account object or null
   */
  async findByAccountId(accountId) {
    try {
      const query = 'SELECT * FROM chatwoot_accounts WHERE account_id = $1'
      const result = await this.db.query(query, [accountId])
      
      return result.rows[0] || null
      
    } catch (error) {
      this.logger.error('Failed to find chatwoot account by account ID', { accountId, error: error.message })
      throw error
    }
  }

  /**
   * Get all accounts with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Accounts and pagination info
   */
  async findAll(options = {}) {
    try {
      const { page = 1, limit = 10, search = '', isActive = null } = options
      const offset = (page - 1) * limit
      
      let whereClause = 'WHERE 1=1'
      let params = []
      let paramCount = 0
      
      if (search) {
        paramCount++
        whereClause += ` AND name ILIKE $${paramCount}`
        params.push(`%${search}%`)
      }
      
      if (isActive !== null) {
        paramCount++
        whereClause += ` AND is_active = $${paramCount}`
        params.push(isActive)
      }
      
      const countQuery = `SELECT COUNT(*) as total FROM chatwoot_accounts ${whereClause}`
      const countResult = await this.db.query(countQuery, params)
      const total = parseInt(countResult.rows[0].total)
      
      const query = `
        SELECT id, name, base_url, access_token, account_id, inbox_id, is_active, created_at, updated_at
        FROM chatwoot_accounts 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `
      
      const result = await this.db.query(query, [...params, limit, offset])
      
      return {
        accounts: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
      
    } catch (error) {
      this.logger.error('Failed to find all chatwoot accounts', { error: error.message })
      throw error
    }
  }

  /**
   * Update account
   * @param {number} id - Account ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} - Updated account
   */
  async update(id, updateData) {
    try {
      const { name, baseUrl, accessToken, accountId, inboxId, isActive } = updateData
      
      const query = `
        UPDATE chatwoot_accounts 
        SET name = COALESCE($1, name),
            base_url = COALESCE($2, base_url),
            access_token = COALESCE($3, access_token),
            account_id = COALESCE($4, account_id),
            inbox_id = COALESCE($5, inbox_id),
            is_active = COALESCE($6, is_active),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING id, name, base_url, access_token, account_id, inbox_id, is_active, created_at, updated_at
      `
      
      const result = await this.db.query(query, [name, baseUrl, accessToken, accountId, inboxId, isActive, id])
      
      if (result.rows.length === 0) {
        throw new Error('Chatwoot account not found')
      }
      
      this.logger.info('Chatwoot account updated', { accountId: id })
      return result.rows[0]
      
    } catch (error) {
      this.logger.error('Failed to update chatwoot account', { id, error: error.message })
      throw error
    }
  }

  /**
   * Delete account
   * @param {number} id - Account ID
   * @returns {Promise<boolean>} - Success status
   */
  async delete(id) {
    try {
      const query = 'DELETE FROM chatwoot_accounts WHERE id = $1'
      const result = await this.db.query(query, [id])
      
      const deleted = result.rowCount > 0
      if (deleted) {
        this.logger.info('Chatwoot account deleted', { accountId: id })
      }
      
      return deleted
      
    } catch (error) {
      this.logger.error('Failed to delete chatwoot account', { id, error: error.message })
      throw error
    }
  }

  /**
   * Get active accounts
   * @returns {Promise<Array>} - Active accounts
   */
  async findActive() {
    try {
      const query = 'SELECT * FROM chatwoot_accounts WHERE is_active = true ORDER BY name'
      const result = await this.db.query(query)
      
      return result.rows
      
    } catch (error) {
      this.logger.error('Failed to find active chatwoot accounts', { error: error.message })
      throw error
    }
  }

  /**
   * Get account mappings with Telegram bots
   * @param {number} accountId - Account ID
   * @returns {Promise<Array>} - Account mappings
   */
  async getBotMappings(accountId) {
    try {
      const query = `
        SELECT 
          bcm.id,
          bcm.is_active,
          tb.id as telegram_bot_id,
          tb.name as telegram_bot_name,
          tb.bot_token as telegram_bot_token
        FROM bot_chatwoot_mappings bcm
        JOIN telegram_bots tb ON bcm.telegram_bot_id = tb.id
        WHERE bcm.chatwoot_account_id = $1
        ORDER BY tb.name
      `
      
      const result = await this.db.query(query, [accountId])
      return result.rows
      
    } catch (error) {
      this.logger.error('Failed to get account bot mappings', { accountId, error: error.message })
      throw error
    }
  }

  /**
   * Get account mappings with Dify apps
   * @param {number} accountId - Account ID
   * @returns {Promise<Array>} - Account mappings
   */
  async getDifyMappings(accountId) {
    try {
      const query = `
        SELECT 
          dcm.id,
          dcm.is_active,
          da.id as dify_app_id,
          da.name as dify_app_name,
          da.api_url as dify_api_url,
          da.app_id as dify_app_id
        FROM dify_chatwoot_mappings dcm
        JOIN dify_apps da ON dcm.dify_app_id = da.id
        WHERE dcm.chatwoot_account_id = $1
        ORDER BY da.name
      `
      
      const result = await this.db.query(query, [accountId])
      return result.rows
      
    } catch (error) {
      this.logger.error('Failed to get account dify mappings', { accountId, error: error.message })
      throw error
    }
  }
}

module.exports = ChatwootAccountRepository
