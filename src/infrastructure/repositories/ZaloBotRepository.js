/**
 * Zalo Bot Repository - Infrastructure layer
 * Handles Zalo bot data operations
 */
class ZaloBotRepository {
  constructor ({ db, logger }) {
    this.db = db
    this.logger = logger
  }

  /**
   * Create a new Zalo bot
   * @param {Object} botData - Bot data
   * @returns {Promise<Object>} - Created bot
   */
  async create (botData) {
    try {
      const { name, botToken, webhookUrl, apiUrl, isActive, createdBy, secretToken } = botData

      const query = `
        INSERT INTO zalo_bots (name, bot_token, webhook_url, api_url, is_active, created_by, secret_token)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `

      const result = await this.db.query(query, [name, botToken, webhookUrl, apiUrl, isActive, createdBy, secretToken])

      this.logger.info('Zalo bot created', { botId: result.rows[0].id, name })
      return result.rows[0]
    } catch (error) {
      this.logger.error('Failed to create Zalo bot', { error: error.message })
      throw error
    }
  }

  /**
   * Find bot by ID
   * @param {number} id - Bot ID
   * @returns {Promise<Object|null>} - Bot object or null
   */
  async findById (id) {
    try {
      const query = 'SELECT * FROM zalo_bots WHERE id = $1'
      const result = await this.db.query(query, [id])

      return result.rows[0] || null
    } catch (error) {
      this.logger.error('Failed to find Zalo bot by ID', { id, error: error.message })
      throw error
    }
  }

  /**
   * Find bot by token
   * @param {string} botToken - Bot token
   * @returns {Promise<Object|null>} - Bot object or null
   */
  async findByToken (botToken) {
    try {
      const query = 'SELECT * FROM zalo_bots WHERE bot_token = $1'
      const result = await this.db.query(query, [botToken])

      return result.rows[0] || null
    } catch (error) {
      this.logger.error('Failed to find Zalo bot by token', { error: error.message })
      throw error
    }
  }

  /**
   * Get all bots with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Bots and pagination info
   */
  async findAll (options = {}) {
    try {
      const { page = 1, limit = 10, search = '', isActive = null, sortBy = 'created_at.desc' } = options
      const offset = (page - 1) * limit

      let whereClause = 'WHERE 1=1'
      const params = []
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

      const countQuery = `SELECT COUNT(*) as total FROM zalo_bots ${whereClause}`
      const countResult = await this.db.query(countQuery, params)
      const total = parseInt(countResult.rows[0].total)

      const query = `
        SELECT id, name, bot_token, is_active, created_at, updated_at, secret_token
        FROM zalo_bots 
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
      this.logger.error('Failed to find all Zalo bots', { error: error.message })
      throw error
    }
  }

  /**
   * Update bot
   * @param {number} id - Bot ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} - Updated bot
   */
  async update (id, updateData) {
    try {
      const { name, botToken, isActive, secretToken, webhookUrl, apiUrl } = updateData

      const updates = []
      const params = []
      let paramCount = 0

      if (name !== undefined) {
        paramCount++
        updates.push(`name = $${paramCount}`)
        params.push(name)
      }
      if (botToken !== undefined) {
        paramCount++
        updates.push(`bot_token = $${paramCount}`)
        params.push(botToken)
      }
      if (isActive !== undefined) {
        paramCount++
        updates.push(`is_active = $${paramCount}`)
        params.push(isActive)
      }
      if (secretToken !== undefined) {
        paramCount++
        updates.push(`secret_token = $${paramCount}`)
        params.push(secretToken)
      }
      if (webhookUrl !== undefined) {
        paramCount++
        updates.push(`webhook_url = $${paramCount}`)
        params.push(webhookUrl)
      }
      if (apiUrl !== undefined) {
        paramCount++
        updates.push(`api_url = $${paramCount}`)
        params.push(apiUrl)
      }

      paramCount++
      updates.push(`updated_at = CURRENT_TIMESTAMP`)
      params.push(id)

      const query = `
        UPDATE zalo_bots 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `

      const result = await this.db.query(query, params)

      if (result.rows.length === 0) {
        throw new Error('Zalo bot not found')
      }

      this.logger.info('Zalo bot updated', { botId: id })
      return result.rows[0]
    } catch (error) {
      this.logger.error('Failed to update Zalo bot', { id, error: error.message })
      throw error
    }
  }

  /**
   * Delete bot
   * @param {number} id - Bot ID
   * @returns {Promise<boolean>} - Success status
   */
  async delete (id) {
    try {
      const query = 'DELETE FROM zalo_bots WHERE id = $1'
      const result = await this.db.query(query, [id])

      const deleted = result.rowCount > 0
      if (deleted) {
        this.logger.info('Zalo bot deleted', { botId: id })
      }

      return deleted
    } catch (error) {
      this.logger.error('Failed to delete Zalo bot', { id, error: error.message })
      throw error
    }
  }

  /**
   * Get active bots
   * @returns {Promise<Array>} - Active bots
   */
  async findActive () {
    try {
      const query = 'SELECT * FROM zalo_bots WHERE is_active = true ORDER BY name'
      const result = await this.db.query(query)

      return result.rows
    } catch (error) {
      this.logger.error('Failed to find active Zalo bots', { error: error.message })
      throw error
    }
  }
}

module.exports = ZaloBotRepository

