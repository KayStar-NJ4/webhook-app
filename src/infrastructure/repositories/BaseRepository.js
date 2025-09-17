/**
 * Base Repository - Infrastructure layer
 * Provides common functionality for all repositories including audit columns
 */
class BaseRepository {
  constructor({ db, logger, tableName }) {
    this.db = db
    this.logger = logger
    this.tableName = tableName
  }

  /**
   * Add audit data to create/update operations
   * @param {Object} data - Data object
   * @param {Object} user - User object (optional)
   * @param {boolean} isUpdate - Whether this is an update operation
   * @returns {Object} - Data with audit fields
   */
  addAuditData(data, user = null, isUpdate = false) {
    const auditData = { ...data }
    
    if (user && user.userId) {
      if (isUpdate) {
        auditData.updated_by = user.userId
      } else {
        auditData.created_by = user.userId
      }
    }
    
    return auditData
  }

  /**
   * Build INSERT query with audit columns
   * @param {Object} data - Data to insert
   * @param {Array} excludeColumns - Columns to exclude from insert
   * @returns {Object} - Query and parameters
   */
  buildInsertQuery(data, excludeColumns = []) {
    const columns = Object.keys(data).filter(col => !excludeColumns.includes(col))
    const values = columns.map((_, index) => `$${index + 1}`)
    const params = columns.map(col => data[col])
    
    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${values.join(', ')})
      RETURNING *
    `
    
    return { query, params }
  }

  /**
   * Build UPDATE query with audit columns
   * @param {number} id - Record ID
   * @param {Object} data - Data to update
   * @param {Array} excludeColumns - Columns to exclude from update
   * @returns {Object} - Query and parameters
   */
  buildUpdateQuery(id, data, excludeColumns = ['id', 'created_at', 'created_by']) {
    const columns = Object.keys(data).filter(col => !excludeColumns.includes(col))
    const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ')
    const params = columns.map(col => data[col])
    params.push(id) // Add ID as last parameter
    
    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${params.length}
      RETURNING *
    `
    
    return { query, params }
  }

  /**
   * Generic create method with audit support
   * @param {Object} data - Data to create
   * @param {Object} user - User object (optional)
   * @returns {Promise<Object>} - Created record
   */
  async create(data, user = null) {
    try {
      const auditData = this.addAuditData(data, user, false)
      const { query, params } = this.buildInsertQuery(auditData)
      
      const result = await this.db.query(query, params)
      
      this.logger.info(`${this.tableName} created`, { id: result.rows[0].id })
      return result.rows[0]
      
    } catch (error) {
      this.logger.error(`Failed to create ${this.tableName}`, { error: error.message })
      throw error
    }
  }

  /**
   * Generic update method with audit support
   * @param {number} id - Record ID
   * @param {Object} data - Data to update
   * @param {Object} user - User object (optional)
   * @returns {Promise<Object>} - Updated record
   */
  async update(id, data, user = null) {
    try {
      const auditData = this.addAuditData(data, user, true)
      const { query, params } = this.buildUpdateQuery(id, auditData)
      
      const result = await this.db.query(query, params)
      
      if (result.rows.length === 0) {
        throw new Error(`${this.tableName} not found`)
      }
      
      this.logger.info(`${this.tableName} updated`, { id })
      return result.rows[0]
      
    } catch (error) {
      this.logger.error(`Failed to update ${this.tableName}`, { id, error: error.message })
      throw error
    }
  }

  /**
   * Generic delete method
   * @param {number} id - Record ID
   * @returns {Promise<boolean>} - Success status
   */
  async delete(id) {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE id = $1`
      const result = await this.db.query(query, [id])
      
      const deleted = result.rowCount > 0
      if (deleted) {
        this.logger.info(`${this.tableName} deleted`, { id })
      }
      
      return deleted
      
    } catch (error) {
      this.logger.error(`Failed to delete ${this.tableName}`, { id, error: error.message })
      throw error
    }
  }

  /**
   * Generic find by ID method
   * @param {number} id - Record ID
   * @returns {Promise<Object|null>} - Record or null
   */
  async findById(id) {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE id = $1`
      const result = await this.db.query(query, [id])
      
      return result.rows[0] || null
      
    } catch (error) {
      this.logger.error(`Failed to find ${this.tableName} by ID`, { id, error: error.message })
      throw error
    }
  }

  /**
   * Generic find all method with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Records and pagination info
   */
  async findAll(options = {}) {
    try {
      const { page = 1, limit = 10, search = '', sort_by = 'created_at.desc' } = options
      const offset = (page - 1) * limit
      
      let whereClause = 'WHERE 1=1'
      let params = []
      let paramCount = 0
      
      // Add search functionality (override in child classes for specific fields)
      if (search && this.searchFields) {
        const searchConditions = this.searchFields.map(field => {
          paramCount++
          params.push(`%${search}%`)
          return `${field} ILIKE $${paramCount}`
        })
        whereClause += ` AND (${searchConditions.join(' OR ')})`
      }
      
      // Handle sorting
      let orderClause = 'ORDER BY created_at DESC'
      if (sort_by) {
        const [field, direction] = sort_by.split('.')
        const validFields = this.sortableFields || ['created_at', 'updated_at']
        const validDirections = ['asc', 'desc']
        
        if (validFields.includes(field) && validDirections.includes(direction)) {
          orderClause = `ORDER BY ${field} ${direction.toUpperCase()}`
        }
      }
      
      const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause}`
      const countResult = await this.db.query(countQuery, params)
      const total = parseInt(countResult.rows[0].total)
      
      const query = `
        SELECT * FROM ${this.tableName}
        ${whereClause}
        ${orderClause}
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `
      
      const result = await this.db.query(query, [...params, limit, offset])
      
      return {
        records: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
      
    } catch (error) {
      this.logger.error(`Failed to find all ${this.tableName}`, { error: error.message })
      throw error
    }
  }
}

module.exports = BaseRepository
