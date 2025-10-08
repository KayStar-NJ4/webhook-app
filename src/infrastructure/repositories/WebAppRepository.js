/**
 * Web App Repository - Infrastructure layer
 * Handles web app data operations
 */
class WebAppRepository {
  constructor ({ db, logger }) {
    this.db = db
    this.logger = logger
  }

  /**
   * Create a new web app
   * @param {Object} appData - App data
   * @returns {Promise<Object>} - Created app
   */
  async create (appData) {
    try {
      const { name, domain, apiKey, isActive, createdBy } = appData

      const query = `
        INSERT INTO web_apps (name, domain, api_key, is_active, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, domain, api_key, is_active, created_at, updated_at
      `

      const result = await this.db.query(query, [
        name,
        domain,
        apiKey,
        isActive !== undefined ? isActive : true,
        createdBy
      ])

      this.logger.info('Web app created', { appId: result.rows[0].id, name })
      return result.rows[0]
    } catch (error) {
      this.logger.error('Failed to create web app', { error: error.message })
      throw error
    }
  }

  /**
   * Find app by ID
   * @param {number} id - App ID
   * @returns {Promise<Object|null>} - App object or null
   */
  async findById (id) {
    try {
      const query = 'SELECT * FROM web_apps WHERE id = $1'
      const result = await this.db.query(query, [id])

      return result.rows[0] || null
    } catch (error) {
      this.logger.error('Failed to find web app by ID', { id, error: error.message })
      throw error
    }
  }

  /**
   * Find app by API key
   * @param {string} apiKey - API key
   * @returns {Promise<Object|null>} - App object or null
   */
  async findByApiKey (apiKey) {
    try {
      const query = 'SELECT * FROM web_apps WHERE api_key = $1'
      const result = await this.db.query(query, [apiKey])

      return result.rows[0] || null
    } catch (error) {
      this.logger.error('Failed to find web app by API key', { error: error.message })
      throw error
    }
  }

  /**
   * Find app by domain
   * @param {string} domain - Domain
   * @returns {Promise<Object|null>} - App object or null
   */
  async findByDomain (domain) {
    try {
      const query = 'SELECT * FROM web_apps WHERE domain = $1'
      const result = await this.db.query(query, [domain])

      return result.rows[0] || null
    } catch (error) {
      this.logger.error('Failed to find web app by domain', { error: error.message })
      throw error
    }
  }

  /**
   * Get all apps with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Apps and pagination info
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
        whereClause += ` AND (name ILIKE $${paramCount} OR domain ILIKE $${paramCount})`
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
        const validFields = ['name', 'domain', 'created_at', 'is_active']
        const validDirections = ['asc', 'desc']

        if (validFields.includes(field) && validDirections.includes(direction)) {
          orderBy = `ORDER BY ${field} ${direction.toUpperCase()}`
        }
      }

      const countQuery = `SELECT COUNT(*) as total FROM web_apps ${whereClause}`
      const countResult = await this.db.query(countQuery, params)
      const total = parseInt(countResult.rows[0].total)

      const query = `
        SELECT id, name, domain, api_key, is_active, created_at, updated_at
        FROM web_apps 
        ${whereClause}
        ${orderBy}
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `

      const result = await this.db.query(query, [...params, limit, offset])

      return {
        apps: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      this.logger.error('Failed to find all web apps', { error: error.message })
      throw error
    }
  }

  /**
   * Update app
   * @param {number} id - App ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} - Updated app
   */
  async update (id, updateData) {
    try {
      const { name, domain, apiKey, isActive } = updateData

      const query = `
        UPDATE web_apps 
        SET name = COALESCE($1, name),
            domain = COALESCE($2, domain),
            api_key = COALESCE($3, api_key),
            is_active = COALESCE($4, is_active),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING id, name, domain, api_key, is_active, created_at, updated_at
      `

      const result = await this.db.query(query, [
        name,
        domain,
        apiKey,
        isActive,
        id
      ])

      if (result.rows.length === 0) {
        throw new Error('Web app not found')
      }

      this.logger.info('Web app updated', { appId: id })
      return result.rows[0]
    } catch (error) {
      this.logger.error('Failed to update web app', { id, error: error.message })
      throw error
    }
  }

  /**
   * Delete app
   * @param {number} id - App ID
   * @returns {Promise<boolean>} - Success status
   */
  async delete (id) {
    try {
      const query = 'DELETE FROM web_apps WHERE id = $1'
      const result = await this.db.query(query, [id])

      const deleted = result.rowCount > 0
      if (deleted) {
        this.logger.info('Web app deleted', { appId: id })
      }

      return deleted
    } catch (error) {
      this.logger.error('Failed to delete web app', { id, error: error.message })
      throw error
    }
  }

  /**
   * Get active apps
   * @returns {Promise<Array>} - Active apps
   */
  async findActive () {
    try {
      const query = 'SELECT * FROM web_apps WHERE is_active = true ORDER BY name'
      const result = await this.db.query(query)

      return result.rows
    } catch (error) {
      this.logger.error('Failed to find active web apps', { error: error.message })
      throw error
    }
  }

  /**
   * Get app statistics
   * @param {number} appId - App ID
   * @returns {Promise<Object>} - App statistics
   */
  async getStatistics (appId) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT wc.id) as total_conversations,
          COUNT(DISTINCT CASE WHEN wc.status = 'active' THEN wc.id END) as active_conversations,
          COUNT(wm.id) as total_messages,
          MAX(wc.last_message_at) as last_message_at
        FROM web_apps wa
        LEFT JOIN web_conversations wc ON wa.id = wc.web_app_id
        LEFT JOIN web_messages wm ON wc.id = wm.web_conversation_id
        WHERE wa.id = $1
        GROUP BY wa.id
      `

      const result = await this.db.query(query, [appId])
      return result.rows[0] || {
        total_conversations: 0,
        active_conversations: 0,
        total_messages: 0,
        last_message_at: null
      }
    } catch (error) {
      this.logger.error('Failed to get web app statistics', { appId, error: error.message })
      throw error
    }
  }
}

module.exports = WebAppRepository
