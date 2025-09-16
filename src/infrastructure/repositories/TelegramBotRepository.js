/**
 * Telegram Bot Repository - Infrastructure layer
 * Handles telegram bot data operations
 */
class TelegramBotRepository {
  constructor({ db, logger }) {
    this.db = db
    this.logger = logger
  }

  /**
   * Create a new telegram bot
   * @param {Object} botData - Bot data
   * @returns {Promise<Object>} - Created bot
   */
  async create(botData) {
    try {
      const { name, botToken, webhookUrl, isActive, createdBy } = botData
      
      const query = `
        INSERT INTO telegram_bots (name, bot_token, webhook_url, api_url, is_active, created_by)
        VALUES ($1, $2, $3, 'https://api.telegram.org', $4, $5)
        RETURNING id, name, bot_token, webhook_url, api_url, is_active, created_at
      `
      
      const result = await this.db.query(query, [name, botToken, webhookUrl, isActive, createdBy])
      
      this.logger.info('Telegram bot created', { botId: result.rows[0].id, name })
      return result.rows[0]
      
    } catch (error) {
      this.logger.error('Failed to create telegram bot', { error: error.message })
      throw error
    }
  }

  /**
   * Find bot by ID
   * @param {number} id - Bot ID
   * @returns {Promise<Object|null>} - Bot object or null
   */
  async findById(id) {
    try {
      const query = 'SELECT * FROM telegram_bots WHERE id = $1'
      const result = await this.db.query(query, [id])
      
      return result.rows[0] || null
      
    } catch (error) {
      this.logger.error('Failed to find telegram bot by ID', { id, error: error.message })
      throw error
    }
  }

  /**
   * Find bot by token
   * @param {string} botToken - Bot token
   * @returns {Promise<Object|null>} - Bot object or null
   */
  async findByToken(botToken) {
    try {
      const query = 'SELECT * FROM telegram_bots WHERE bot_token = $1'
      const result = await this.db.query(query, [botToken])
      
      return result.rows[0] || null
      
    } catch (error) {
      this.logger.error('Failed to find telegram bot by token', { error: error.message })
      throw error
    }
  }

  /**
   * Get all bots with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Bots and pagination info
   */
  async findAll(options = {}) {
    try {
      const { page = 1, limit = 10, search = '', isActive = null, sortBy = 'created_at.desc' } = options
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
      
      // Handle sorting
      let orderBy = 'ORDER BY created_at DESC'
      if (sortBy) {
        const [field, direction] = sortBy.split('.')
        const validFields = ['name', 'created_at', 'is_active']
        const validDirections = ['asc', 'desc']
        
        if (validFields.includes(field) && validDirections.includes(direction)) {
          orderBy = `ORDER BY ${field} ${direction.toUpperCase()}`
        }
      }
      
      const countQuery = `SELECT COUNT(*) as total FROM telegram_bots ${whereClause}`
      const countResult = await this.db.query(countQuery, params)
      const total = parseInt(countResult.rows[0].total)
      
      const query = `
        SELECT id, name, bot_token, webhook_url, api_url, is_active, created_at, updated_at
        FROM telegram_bots 
        ${whereClause}
        ${orderBy}
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `
      
      const result = await this.db.query(query, [...params, limit, offset])
      
      return {
        bots: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
      
    } catch (error) {
      this.logger.error('Failed to find all telegram bots', { error: error.message })
      throw error
    }
  }

  /**
   * Update bot
   * @param {number} id - Bot ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} - Updated bot
   */
  async update(id, updateData) {
    try {
      const { name, botToken, webhookUrl, isActive } = updateData
      
      const query = `
        UPDATE telegram_bots 
        SET name = COALESCE($1, name),
            bot_token = COALESCE($2, bot_token),
            webhook_url = COALESCE($3, webhook_url),
            api_url = 'https://api.telegram.org',
            is_active = COALESCE($4, is_active),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING id, name, bot_token, webhook_url, api_url, is_active, created_at, updated_at
      `
      
      const result = await this.db.query(query, [name, botToken, webhookUrl, isActive, id])
      
      if (result.rows.length === 0) {
        throw new Error('Telegram bot not found')
      }
      
      this.logger.info('Telegram bot updated', { botId: id })
      return result.rows[0]
      
    } catch (error) {
      this.logger.error('Failed to update telegram bot', { id, error: error.message })
      throw error
    }
  }

  /**
   * Delete bot
   * @param {number} id - Bot ID
   * @returns {Promise<boolean>} - Success status
   */
  async delete(id) {
    try {
      const query = 'DELETE FROM telegram_bots WHERE id = $1'
      const result = await this.db.query(query, [id])
      
      const deleted = result.rowCount > 0
      if (deleted) {
        this.logger.info('Telegram bot deleted', { botId: id })
      }
      
      return deleted
      
    } catch (error) {
      this.logger.error('Failed to delete telegram bot', { id, error: error.message })
      throw error
    }
  }

  /**
   * Get active bots
   * @returns {Promise<Array>} - Active bots
   */
  async findActive() {
    try {
      const query = 'SELECT * FROM telegram_bots WHERE is_active = true ORDER BY name'
      const result = await this.db.query(query)
      
      return result.rows
      
    } catch (error) {
      this.logger.error('Failed to find active telegram bots', { error: error.message })
      throw error
    }
  }

  /**
   * Get bot mappings with Chatwoot accounts
   * @param {number} botId - Bot ID
   * @returns {Promise<Array>} - Bot mappings
   */
  async getMappings(botId) {
    try {
      const query = `
        SELECT 
          bcm.id,
          bcm.is_active,
          ca.id as chatwoot_account_id,
          ca.name as chatwoot_account_name,
          ca.base_url as chatwoot_base_url
        FROM bot_chatwoot_mappings bcm
        JOIN chatwoot_accounts ca ON bcm.chatwoot_account_id = ca.id
        WHERE bcm.telegram_bot_id = $1
        ORDER BY ca.name
      `
      
      const result = await this.db.query(query, [botId])
      return result.rows
      
    } catch (error) {
      this.logger.error('Failed to get bot mappings', { botId, error: error.message })
      throw error
    }
  }

  /**
   * Create bot-chatwoot mapping
   * @param {Object} mappingData - Mapping data
   * @returns {Promise<Object>} - Created mapping
   */
  async createMapping(mappingData) {
    try {
      const { telegramBotId, chatwootAccountId, isActive, createdBy } = mappingData
      
      const query = `
        INSERT INTO bot_chatwoot_mappings (telegram_bot_id, chatwoot_account_id, is_active, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING id, telegram_bot_id, chatwoot_account_id, is_active, created_at
      `
      
      const result = await this.db.query(query, [telegramBotId, chatwootAccountId, isActive, createdBy])
      
      this.logger.info('Bot mapping created', { mappingId: result.rows[0].id })
      return result.rows[0]
      
    } catch (error) {
      this.logger.error('Failed to create bot mapping', { error: error.message })
      throw error
    }
  }

  /**
   * Delete bot-chatwoot mapping
   * @param {number} mappingId - Mapping ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteMapping(mappingId) {
    try {
      const query = 'DELETE FROM bot_chatwoot_mappings WHERE id = $1'
      const result = await this.db.query(query, [mappingId])
      
      const deleted = result.rowCount > 0
      if (deleted) {
        this.logger.info('Bot mapping deleted', { mappingId })
      }
      
      return deleted
      
    } catch (error) {
      this.logger.error('Failed to delete bot mapping', { mappingId, error: error.message })
      throw error
    }
  }
}

module.exports = TelegramBotRepository
