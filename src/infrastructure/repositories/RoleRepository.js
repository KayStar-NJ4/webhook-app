/**
 * Role Repository - Infrastructure layer
 * Handles role data operations
 */
class RoleRepository {
  constructor({ db, logger }) {
    this.db = db
    this.logger = logger
  }

  /**
   * Find all roles with pagination, search, sorting and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Object with roles and pagination info
   */
  async findAll(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        sort_by = 'created_at.desc'
      } = options
      const offset = (page - 1) * limit
      
      let whereConditions = []
      let params = []
      let paramIndex = 1
      
      // Search functionality
      if (search) {
        whereConditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`)
        params.push(`%${search}%`)
        paramIndex++
      }
      
      // No additional filters for now
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
      
      // Parse sort_by parameter
      let orderBy = 'ORDER BY created_at DESC'
      if (sort_by) {
        const [field, direction] = sort_by.split('.')
        const validFields = ['id', 'name', 'created_at', 'updated_at']
        const validDirections = ['asc', 'desc']
        
        if (validFields.includes(field) && validDirections.includes(direction)) {
          orderBy = `ORDER BY ${field} ${direction.toUpperCase()}`
        }
      }
      
      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM roles ${whereClause}`
      const countResult = await this.db.query(countQuery, params)
      const total = parseInt(countResult.rows[0].total)
      
      // Get roles with pagination and additional info
      const query = `
        SELECT 
          r.id, r.name, r.description, r.created_at, r.updated_at,
          COUNT(DISTINCT rp.permission_id) as permission_count,
          COUNT(DISTINCT ur.user_id) as user_count
        FROM roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN user_roles ur ON r.id = ur.role_id
        ${whereClause}
        GROUP BY r.id, r.name, r.description, r.created_at, r.updated_at
        ${orderBy}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `
      
      const result = await this.db.query(query, [...params, limit, offset])
      
      const roles = result.rows.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        created_at: role.created_at,
        updated_at: role.updated_at,
        permission_count: parseInt(role.permission_count) || 0,
        user_count: parseInt(role.user_count) || 0
      }))
      
      return {
        roles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
      
    } catch (error) {
      this.logger.error('Failed to find all roles', { error: error.message })
      throw error
    }
  }

  /**
   * Find role by ID
   * @param {number} id - Role ID
   * @returns {Promise<Object|null>} - Role object or null
   */
  async findById(id) {
    try {
      const query = 'SELECT * FROM roles WHERE id = $1'
      const result = await this.db.query(query, [id])
      
      if (result.rows.length === 0) {
        return null
      }
      
      const role = result.rows[0]
      return {
        id: role.id,
        name: role.name,
        description: role.description,
        createdAt: role.created_at,
        updatedAt: role.updated_at
      }
      
    } catch (error) {
      this.logger.error('Failed to find role by ID', { id, error: error.message })
      throw error
    }
  }

  /**
   * Find role by name
   * @param {string} name - Role name
   * @returns {Promise<Object|null>} - Role object or null
   */
  async findByName(name) {
    try {
      const query = 'SELECT * FROM roles WHERE name = $1'
      const result = await this.db.query(query, [name])
      
      if (result.rows.length === 0) {
        return null
      }
      
      const role = result.rows[0]
      return {
        id: role.id,
        name: role.name,
        description: role.description,
        createdAt: role.created_at,
        updatedAt: role.updated_at
      }
      
    } catch (error) {
      this.logger.error('Failed to find role by name', { name, error: error.message })
      throw error
    }
  }

  /**
   * Create role
   * @param {Object} roleData - Role data
   * @returns {Promise<Object>} - Created role
   */
  async create(roleData) {
    try {
      const { name, description } = roleData
      
      const query = `
        INSERT INTO roles (name, description)
        VALUES ($1, $2)
        RETURNING id, name, description, created_at, updated_at
      `
      
      const result = await this.db.query(query, [name, description])
      
      this.logger.info('Role created', { roleId: result.rows[0].id, name })
      return result.rows[0]
      
    } catch (error) {
      this.logger.error('Failed to create role', { error: error.message })
      throw error
    }
  }

  /**
   * Update role
   * @param {number} id - Role ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} - Updated role
   */
  async update(id, updateData) {
    try {
      const { name, description } = updateData
      
      const query = `
        UPDATE roles 
        SET name = COALESCE($1, name),
            description = COALESCE($2, description),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING id, name, description, created_at, updated_at
      `
      
      const result = await this.db.query(query, [name, description, id])
      
      if (result.rows.length === 0) {
        throw new Error('Role not found')
      }
      
      this.logger.info('Role updated', { roleId: id })
      return result.rows[0]
      
    } catch (error) {
      this.logger.error('Failed to update role', { id, error: error.message })
      throw error
    }
  }

  /**
   * Delete role
   * @param {number} id - Role ID
   * @returns {Promise<boolean>} - Success status
   */
  async delete(id) {
    try {
      const query = 'DELETE FROM roles WHERE id = $1'
      const result = await this.db.query(query, [id])
      
      const deleted = result.rowCount > 0
      if (deleted) {
        this.logger.info('Role deleted', { roleId: id })
      }
      
      return deleted
      
    } catch (error) {
      this.logger.error('Failed to delete role', { id, error: error.message })
      throw error
    }
  }

  /**
   * Get role permissions
   * @param {number} roleId - Role ID
   * @returns {Promise<Array>} - Array of permissions
   */
  async getRolePermissions(roleId) {
    try {
      const query = `
        SELECT p.id, p.name, p.description, p.resource, p.action
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = $1
        ORDER BY p.resource, p.action
      `
      
      const result = await this.db.query(query, [roleId])
      
      return result.rows.map(permission => ({
        id: permission.id,
        name: permission.name,
        description: permission.description,
        resource: permission.resource,
        action: permission.action
      }))
      
    } catch (error) {
      this.logger.error('Failed to get role permissions', { roleId, error: error.message })
      throw error
    }
  }

  /**
   * Update role permissions
   * @param {number} roleId - Role ID
   * @param {Array} permissionNames - Array of permission names
   * @returns {Promise<void>}
   */
  async updatePermissions(roleId, permissionNames) {
    try {
      // Start transaction
      await this.db.query('BEGIN')
      
      // Remove all existing permissions
      await this.db.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId])
      
      // Add new permissions
      if (permissionNames && permissionNames.length > 0) {
        // Get permission IDs by names
        const placeholders = permissionNames.map((_, index) => `$${index + 1}`).join(',')
        const permissionQuery = `SELECT id FROM permissions WHERE name IN (${placeholders})`
        const permissionResult = await this.db.query(permissionQuery, permissionNames)
        
        // Insert role permissions
        for (const permission of permissionResult.rows) {
          await this.db.query(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
            [roleId, permission.id]
          )
        }
      }
      
      await this.db.query('COMMIT')
      this.logger.info('Role permissions updated', { roleId, permissionCount: permissionNames.length })
      
    } catch (error) {
      await this.db.query('ROLLBACK')
      this.logger.error('Failed to update role permissions', { roleId, error: error.message })
      throw error
    }
  }

  /**
   * Assign permissions to role
   * @param {number} roleId - Role ID
   * @param {Array} permissionNames - Array of permission names
   * @returns {Promise<void>}
   */
  async assignPermissions(roleId, permissionNames) {
    try {
      if (!permissionNames || permissionNames.length === 0) {
        return
      }

      // Get permission IDs by names
      const placeholders = permissionNames.map((_, index) => `$${index + 1}`).join(',')
      const permissionQuery = `SELECT id FROM permissions WHERE name IN (${placeholders})`
      const permissionResult = await this.db.query(permissionQuery, permissionNames)
      
      // Insert role permissions (ignore duplicates)
      for (const permission of permissionResult.rows) {
        await this.db.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT (role_id, permission_id) DO NOTHING',
          [roleId, permission.id]
        )
      }
      
      this.logger.info('Permissions assigned to role', { roleId, permissionCount: permissionResult.rows.length })
      
    } catch (error) {
      this.logger.error('Failed to assign permissions to role', { roleId, error: error.message })
      throw error
    }
  }

  /**
   * Assign permission to role
   * @param {number} roleId - Role ID
   * @param {number} permissionId - Permission ID
   * @returns {Promise<void>}
   */
  async assignPermission(roleId, permissionId) {
    try {
      const query = `
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES ($1, $2)
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `
      
      await this.db.query(query, [roleId, permissionId])
      
      this.logger.info('Permission assigned to role', { roleId, permissionId })
      
    } catch (error) {
      this.logger.error('Failed to assign permission to role', { roleId, permissionId, error: error.message })
      throw error
    }
  }

  /**
   * Remove permission from role
   * @param {number} roleId - Role ID
   * @param {number} permissionId - Permission ID
   * @returns {Promise<void>}
   */
  async removePermission(roleId, permissionId) {
    try {
      const query = 'DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2'
      await this.db.query(query, [roleId, permissionId])
      
      this.logger.info('Permission removed from role', { roleId, permissionId })
      
    } catch (error) {
      this.logger.error('Failed to remove permission from role', { roleId, permissionId, error: error.message })
      throw error
    }
  }
}

module.exports = RoleRepository
