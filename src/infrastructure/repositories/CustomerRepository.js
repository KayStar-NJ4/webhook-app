const BaseRepository = require('./BaseRepository')

/**
 * Customer Repository - Infrastructure layer
 * Handles customer contact form data operations with soft delete
 */
class CustomerRepository extends BaseRepository {
  constructor ({ db, logger }) {
    super({ db, logger, tableName: 'customers' })
    
    // Define searchable fields for base findAll method
    this.searchFields = ['name', 'email', 'company', 'message']
    
    // Define sortable fields
    this.sortableFields = ['id', 'name', 'email', 'company', 'status', 'created_at', 'updated_at']
  }

  /**
   * Create a new customer record from contact form
   * @param {Object} customerData - Customer data
   * @param {Object} user - User object (optional)
   * @returns {Promise<Object>} - Created customer
   */
  async create (customerData, user = null) {
    try {
      const { name, email, company, subject, message, source, ip_address, user_agent, metadata } = customerData

      const data = {
        name,
        email,
        company: company || null,
        subject,
        message,
        source: source || 'contact_form',
        ip_address: ip_address || null,
        user_agent: user_agent || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        status: 'new'
      }

      return await super.create(data, user)
    } catch (error) {
      this.logger.error('Failed to create customer', { error: error.message })
      throw error
    }
  }

  /**
   * Find all customers with soft delete support
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Customers and pagination info
   */
  async findAll (options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        sort_by = 'created_at.desc',
        status,
        source,
        assigned_to,
        include_deleted = false
      } = options
      const offset = (page - 1) * limit

      const whereConditions = []
      const params = []
      let paramIndex = 1

      // Exclude soft-deleted records by default
      if (!include_deleted) {
        whereConditions.push('c.deleted_at IS NULL')
      }

      // Search functionality
      if (search) {
        whereConditions.push(`(c.name ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex} OR c.company ILIKE $${paramIndex} OR c.message ILIKE $${paramIndex})`)
        params.push(`%${search}%`)
        paramIndex++
      }

      // Filter by status
      if (status) {
        whereConditions.push(`c.status = $${paramIndex}`)
        params.push(status)
        paramIndex++
      }

      // Filter by source
      if (source) {
        whereConditions.push(`c.source = $${paramIndex}`)
        params.push(source)
        paramIndex++
      }

      // Filter by assigned_to
      if (assigned_to) {
        whereConditions.push(`c.assigned_to = $${paramIndex}`)
        params.push(parseInt(assigned_to))
        paramIndex++
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

      // Parse sort_by parameter
      let orderBy = 'ORDER BY c.created_at DESC'
      if (sort_by) {
        const [field, direction = 'desc'] = sort_by.split('.')
        const normalizedDirection = direction ? direction.toLowerCase() : 'desc'
        if (this.sortableFields.includes(field) && ['asc', 'desc'].includes(normalizedDirection)) {
          orderBy = `ORDER BY c.${field} ${normalizedDirection.toUpperCase()}`
        }
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} c ${whereClause}`
      const countResult = await this.db.query(countQuery, params)
      const total = parseInt(countResult.rows[0].total)

      // Get customers with pagination
      const query = `
        SELECT c.*, 
               u.username as assigned_to_username,
               creator.username as created_by_username
        FROM ${this.tableName} c
        LEFT JOIN users u ON c.assigned_to = u.id
        LEFT JOIN users creator ON c.created_by = creator.id
        ${whereClause}
        ${orderBy}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `

      const result = await this.db.query(query, [...params, limit, offset])

      return {
        customers: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      this.logger.error('Failed to find all customers', { 
        error: error.message,
        stack: error.stack,
        options 
      })
      throw error
    }
  }

  /**
   * Find customer by ID (exclude soft-deleted by default)
   * @param {number} id - Customer ID
   * @param {boolean} includeDeleted - Include soft-deleted records
   * @returns {Promise<Object|null>} - Customer or null
   */
  async findById (id, includeDeleted = false) {
    try {
      const whereClause = includeDeleted ? '' : 'AND deleted_at IS NULL'
      
      const query = `
        SELECT c.*, 
               u.username as assigned_to_username,
               creator.username as created_by_username,
               deleter.username as deleted_by_username
        FROM ${this.tableName} c
        LEFT JOIN users u ON c.assigned_to = u.id
        LEFT JOIN users creator ON c.created_by = creator.id
        LEFT JOIN users deleter ON c.deleted_by = deleter.id
        WHERE c.id = $1 ${whereClause}
      `
      
      const result = await this.db.query(query, [id])
      return result.rows[0] || null
    } catch (error) {
      this.logger.error('Failed to find customer by ID', { id, error: error.message })
      throw error
    }
  }

  /**
   * Update customer
   * @param {number} id - Customer ID
   * @param {Object} updateData - Update data
   * @param {Object} user - User object (optional)
   * @returns {Promise<Object>} - Updated customer
   */
  async update (id, updateData, user = null) {
    try {
      // Check if customer exists and is not deleted
      const existing = await this.findById(id, false)
      if (!existing) {
        throw new Error('Customer not found or has been deleted')
      }

      const { name, email, company, subject, message, status, assigned_to, notes, metadata } = updateData

      const data = {}
      if (name !== undefined) data.name = name
      if (email !== undefined) data.email = email
      if (company !== undefined) data.company = company
      if (subject !== undefined) data.subject = subject
      if (message !== undefined) data.message = message
      if (status !== undefined) data.status = status
      if (assigned_to !== undefined) data.assigned_to = assigned_to
      if (notes !== undefined) data.notes = notes
      if (metadata !== undefined) data.metadata = JSON.stringify(metadata)

      return await super.update(id, data, user)
    } catch (error) {
      this.logger.error('Failed to update customer', { id, error: error.message })
      throw error
    }
  }

  /**
   * Soft delete customer
   * @param {number} id - Customer ID
   * @param {Object} user - User object (optional)
   * @returns {Promise<boolean>} - Success status
   */
  async softDelete (id, user = null) {
    try {
      // Check if customer exists and is not already deleted
      const existing = await this.findById(id, false)
      if (!existing) {
        throw new Error('Customer not found or already deleted')
      }

      const query = `
        UPDATE ${this.tableName}
        SET deleted_at = CURRENT_TIMESTAMP,
            deleted_by = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `

      const deletedBy = user && user.userId ? user.userId : null
      const result = await this.db.query(query, [deletedBy, id])

      if (result.rowCount > 0) {
        this.logger.info('Customer soft deleted', { id, deletedBy })
        return true
      }

      return false
    } catch (error) {
      this.logger.error('Failed to soft delete customer', { id, error: error.message })
      throw error
    }
  }

  /**
   * Restore soft-deleted customer
   * @param {number} id - Customer ID
   * @param {Object} user - User object (optional)
   * @returns {Promise<Object>} - Restored customer
   */
  async restore (id, user = null) {
    try {
      // Check if customer exists and is deleted
      const existing = await this.findById(id, true)
      if (!existing) {
        throw new Error('Customer not found')
      }
      if (!existing.deleted_at) {
        throw new Error('Customer is not deleted')
      }

      const query = `
        UPDATE ${this.tableName}
        SET deleted_at = NULL,
            deleted_by = NULL,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = $1
        WHERE id = $2
        RETURNING *
      `

      const updatedBy = user && user.userId ? user.userId : null
      const result = await this.db.query(query, [updatedBy, id])

      if (result.rows.length === 0) {
        throw new Error('Failed to restore customer')
      }

      this.logger.info('Customer restored', { id })
      return result.rows[0]
    } catch (error) {
      this.logger.error('Failed to restore customer', { id, error: error.message })
      throw error
    }
  }

  /**
   * Get customer statistics
   * @returns {Promise<Object>} - Statistics
   */
  async getStatistics () {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE deleted_at IS NULL) as active,
          COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted,
          COUNT(*) FILTER (WHERE status = 'new' AND deleted_at IS NULL) as new,
          COUNT(*) FILTER (WHERE status = 'contacted' AND deleted_at IS NULL) as contacted,
          COUNT(*) FILTER (WHERE status = 'in_progress' AND deleted_at IS NULL) as in_progress,
          COUNT(*) FILTER (WHERE status = 'resolved' AND deleted_at IS NULL) as resolved,
          COUNT(*) FILTER (WHERE status = 'closed' AND deleted_at IS NULL) as closed,
          COUNT(*) FILTER (WHERE source = 'contact_form' AND deleted_at IS NULL) as from_contact_form,
          COUNT(*) FILTER (WHERE source = 'chat_widget' AND deleted_at IS NULL) as from_chat_widget
        FROM ${this.tableName}
      `

      const result = await this.db.query(query)
      return result.rows[0]
    } catch (error) {
      this.logger.error('Failed to get customer statistics', { error: error.message })
      throw error
    }
  }

  /**
   * Assign customer to user
   * @param {number} id - Customer ID
   * @param {number} userId - User ID to assign to
   * @param {Object} user - User object performing the action
   * @returns {Promise<Object>} - Updated customer
   */
  async assignTo (id, userId, user = null) {
    try {
      return await this.update(id, { assigned_to: userId }, user)
    } catch (error) {
      this.logger.error('Failed to assign customer', { id, userId, error: error.message })
      throw error
    }
  }

  /**
   * Update customer status
   * @param {number} id - Customer ID
   * @param {string} status - New status
   * @param {Object} user - User object (optional)
   * @returns {Promise<Object>} - Updated customer
   */
  async updateStatus (id, status, user = null) {
    try {
      const validStatuses = ['new', 'contacted', 'in_progress', 'resolved', 'closed']
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}`)
      }

      return await this.update(id, { status }, user)
    } catch (error) {
      this.logger.error('Failed to update customer status', { id, status, error: error.message })
      throw error
    }
  }
}

module.exports = CustomerRepository

