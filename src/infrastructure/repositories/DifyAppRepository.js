/**
 * Dify App Repository - Infrastructure layer
 * Handles dify app data operations
 */
class DifyAppRepository {
  constructor({ db, logger }) {
    this.db = db
    this.logger = logger
  }

  /**
   * Create a new dify app
   * @param {Object} appData - App data
   * @returns {Promise<Object>} - Created app
   */
  async create(appData) {
    try {
      const { name, apiUrl, apiKey, appId, timeout, isActive, createdBy } = appData
      
      const query = `
        INSERT INTO dify_apps (name, api_url, api_key, app_id, timeout, is_active, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, name, api_url, api_key, app_id, timeout, is_active, created_at
      `
      
      const result = await this.db.query(query, [name, apiUrl, apiKey, appId, timeout, isActive, createdBy])
      
      this.logger.info('Dify app created', { appId: result.rows[0].id, name })
      return result.rows[0]
      
    } catch (error) {
      this.logger.error('Failed to create dify app', { error: error.message })
      throw error
    }
  }

  /**
   * Find app by ID
   * @param {number} id - App ID
   * @returns {Promise<Object|null>} - App object or null
   */
  async findById(id) {
    try {
      const query = 'SELECT * FROM dify_apps WHERE id = $1'
      const result = await this.db.query(query, [id])
      
      return result.rows[0] || null
      
    } catch (error) {
      this.logger.error('Failed to find dify app by ID', { id, error: error.message })
      throw error
    }
  }

  /**
   * Find app by app ID
   * @param {string} appId - Dify app ID
   * @returns {Promise<Object|null>} - App object or null
   */
  async findByAppId(appId) {
    try {
      const query = 'SELECT * FROM dify_apps WHERE app_id = $1'
      const result = await this.db.query(query, [appId])
      
      return result.rows[0] || null
      
    } catch (error) {
      this.logger.error('Failed to find dify app by app ID', { appId, error: error.message })
      throw error
    }
  }

  /**
   * Get all apps with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Apps and pagination info
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
      
      const countQuery = `SELECT COUNT(*) as total FROM dify_apps ${whereClause}`
      const countResult = await this.db.query(countQuery, params)
      const total = parseInt(countResult.rows[0].total)
      
      const query = `
        SELECT id, name, api_url, api_key, app_id, timeout, is_active, created_at, updated_at
        FROM dify_apps 
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
      this.logger.error('Failed to find all dify apps', { error: error.message })
      throw error
    }
  }

  /**
   * Update app
   * @param {number} id - App ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} - Updated app
   */
  async update(id, updateData) {
    try {
      const { name, apiUrl, apiKey, appId, timeout, isActive } = updateData
      
      const query = `
        UPDATE dify_apps 
        SET name = COALESCE($1, name),
            api_url = COALESCE($2, api_url),
            api_key = COALESCE($3, api_key),
            app_id = COALESCE($4, app_id),
            timeout = COALESCE($5, timeout),
            is_active = COALESCE($6, is_active),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING id, name, api_url, api_key, app_id, timeout, is_active, created_at, updated_at
      `
      
      const result = await this.db.query(query, [name, apiUrl, apiKey, appId, timeout, isActive, id])
      
      if (result.rows.length === 0) {
        throw new Error('Dify app not found')
      }
      
      this.logger.info('Dify app updated', { appId: id })
      return result.rows[0]
      
    } catch (error) {
      this.logger.error('Failed to update dify app', { id, error: error.message })
      throw error
    }
  }

  /**
   * Delete app
   * @param {number} id - App ID
   * @returns {Promise<boolean>} - Success status
   */
  async delete(id) {
    try {
      const query = 'DELETE FROM dify_apps WHERE id = $1'
      const result = await this.db.query(query, [id])
      
      const deleted = result.rowCount > 0
      if (deleted) {
        this.logger.info('Dify app deleted', { appId: id })
      }
      
      return deleted
      
    } catch (error) {
      this.logger.error('Failed to delete dify app', { id, error: error.message })
      throw error
    }
  }

  /**
   * Get active apps
   * @returns {Promise<Array>} - Active apps
   */
  async findActive() {
    try {
      const query = 'SELECT * FROM dify_apps WHERE is_active = true ORDER BY name'
      const result = await this.db.query(query)
      
      return result.rows
      
    } catch (error) {
      this.logger.error('Failed to find active dify apps', { error: error.message })
      throw error
    }
  }

  /**
   * Get app mappings with Chatwoot accounts
   * @param {number} appId - App ID
   * @returns {Promise<Array>} - App mappings
   */
  async getMappings(appId) {
    try {
      const query = `
        SELECT 
          dcm.id,
          dcm.is_active,
          ca.id as chatwoot_account_id,
          ca.name as chatwoot_account_name,
          ca.base_url as chatwoot_base_url
        FROM dify_chatwoot_mappings dcm
        JOIN chatwoot_accounts ca ON dcm.chatwoot_account_id = ca.id
        WHERE dcm.dify_app_id = $1
        ORDER BY ca.name
      `
      
      const result = await this.db.query(query, [appId])
      return result.rows
      
    } catch (error) {
      this.logger.error('Failed to get app mappings', { appId, error: error.message })
      throw error
    }
  }

  /**
   * Create dify-chatwoot mapping
   * @param {Object} mappingData - Mapping data
   * @returns {Promise<Object>} - Created mapping
   */
  async createMapping(mappingData) {
    try {
      const { difyAppId, chatwootAccountId, isActive, createdBy } = mappingData
      
      const query = `
        INSERT INTO dify_chatwoot_mappings (dify_app_id, chatwoot_account_id, is_active, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING id, dify_app_id, chatwoot_account_id, is_active, created_at
      `
      
      const result = await this.db.query(query, [difyAppId, chatwootAccountId, isActive, createdBy])
      
      this.logger.info('Dify mapping created', { mappingId: result.rows[0].id })
      return result.rows[0]
      
    } catch (error) {
      this.logger.error('Failed to create dify mapping', { error: error.message })
      throw error
    }
  }

  /**
   * Delete dify-chatwoot mapping
   * @param {number} mappingId - Mapping ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteMapping(mappingId) {
    try {
      const query = 'DELETE FROM dify_chatwoot_mappings WHERE id = $1'
      const result = await this.db.query(query, [mappingId])
      
      const deleted = result.rowCount > 0
      if (deleted) {
        this.logger.info('Dify mapping deleted', { mappingId })
      }
      
      return deleted
      
    } catch (error) {
      this.logger.error('Failed to delete dify mapping', { mappingId, error: error.message })
      throw error
    }
  }
}

module.exports = DifyAppRepository
