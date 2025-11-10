/**
 * Zalo OA Repository - Infrastructure layer
 * Handles Zalo Official Account data operations
 */
class ZaloOARepository {
  constructor ({ db, logger }) {
    this.db = db
    this.logger = logger
  }

  /**
   * Create a new Zalo OA
   * @param {Object} oaData - OA data
   * @returns {Promise<Object>} - Created OA
   */
  async create (oaData) {
    try {
      const { name, oaId, accessToken, refreshToken, secretKey, webhookUrl, apiUrl, isActive, createdBy } = oaData

      const query = `
        INSERT INTO zalo_oas (name, oa_id, access_token, refresh_token, secret_key, webhook_url, api_url, is_active, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `

      const result = await this.db.query(query, [name, oaId, accessToken, refreshToken, secretKey, webhookUrl, apiUrl, isActive, createdBy])

      this.logger.info('Zalo OA created', { oaId: result.rows[0].id, name })
      return result.rows[0]
    } catch (error) {
      this.logger.error('Failed to create Zalo OA', { error: error.message })
      throw error
    }
  }

  /**
   * Find OA by ID
   * @param {number} id - OA ID
   * @returns {Promise<Object|null>} - OA object or null
   */
  async findById (id) {
    try {
      const query = 'SELECT * FROM zalo_oas WHERE id = $1'
      const result = await this.db.query(query, [id])

      return result.rows[0] || null
    } catch (error) {
      this.logger.error('Failed to find Zalo OA by ID', { id, error: error.message })
      throw error
    }
  }

  /**
   * Find OA by OA ID
   * @param {string} oaId - Zalo OA ID
   * @returns {Promise<Object|null>} - OA object or null
   */
  async findByOAId (oaId) {
    try {
      const query = 'SELECT * FROM zalo_oas WHERE oa_id = $1'
      const result = await this.db.query(query, [oaId])

      return result.rows[0] || null
    } catch (error) {
      this.logger.error('Failed to find Zalo OA by OA ID', { error: error.message })
      throw error
    }
  }

  /**
   * Get all OAs with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - OAs and pagination info
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

      const countQuery = `SELECT COUNT(*) as total FROM zalo_oas ${whereClause}`
      const countResult = await this.db.query(countQuery, params)
      const total = parseInt(countResult.rows[0].total)

      const query = `
        SELECT id, name, oa_id, is_active, created_at, updated_at, webhook_url
        FROM zalo_oas 
        ${whereClause}
        ${orderBy}
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `

      const result = await this.db.query(query, [...params, limit, offset])

      return {
        oas: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      this.logger.error('Failed to find all Zalo OAs', { error: error.message })
      throw error
    }
  }

  /**
   * Update OA
   * @param {number} id - OA ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} - Updated OA
   */
  async update (id, updateData) {
    try {
      const { name, oaId, accessToken, refreshToken, isActive, secretKey, webhookUrl, apiUrl } = updateData

      const updates = []
      const params = []
      let paramCount = 0

      if (name !== undefined) {
        paramCount++
        updates.push(`name = $${paramCount}`)
        params.push(name)
      }
      if (oaId !== undefined) {
        paramCount++
        updates.push(`oa_id = $${paramCount}`)
        params.push(oaId)
      }
      if (accessToken !== undefined) {
        paramCount++
        updates.push(`access_token = $${paramCount}`)
        params.push(accessToken)
      }
      if (refreshToken !== undefined) {
        paramCount++
        updates.push(`refresh_token = $${paramCount}`)
        params.push(refreshToken)
      }
      if (isActive !== undefined) {
        paramCount++
        updates.push(`is_active = $${paramCount}`)
        params.push(isActive)
      }
      if (secretKey !== undefined) {
        paramCount++
        updates.push(`secret_key = $${paramCount}`)
        params.push(secretKey)
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
        UPDATE zalo_oas 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `

      const result = await this.db.query(query, params)

      if (result.rows.length === 0) {
        throw new Error('Zalo OA not found')
      }

      this.logger.info('Zalo OA updated', { oaId: id })
      return result.rows[0]
    } catch (error) {
      this.logger.error('Failed to update Zalo OA', { id, error: error.message })
      throw error
    }
  }

  /**
   * Delete OA
   * @param {number} id - OA ID
   * @returns {Promise<boolean>} - Success status
   */
  async delete (id) {
    try {
      const query = 'DELETE FROM zalo_oas WHERE id = $1'
      const result = await this.db.query(query, [id])

      const deleted = result.rowCount > 0
      if (deleted) {
        this.logger.info('Zalo OA deleted', { oaId: id })
      }

      return deleted
    } catch (error) {
      this.logger.error('Failed to delete Zalo OA', { id, error: error.message })
      throw error
    }
  }

  /**
   * Get active OAs
   * @returns {Promise<Array>} - Active OAs
   */
  async findActive () {
    try {
      const query = 'SELECT * FROM zalo_oas WHERE is_active = true ORDER BY name'
      const result = await this.db.query(query)

      return result.rows
    } catch (error) {
      this.logger.error('Failed to find active Zalo OAs', { error: error.message })
      throw error
    }
  }
}

module.exports = ZaloOARepository

