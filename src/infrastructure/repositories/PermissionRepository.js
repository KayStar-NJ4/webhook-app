/**
 * Permission Repository - Infrastructure layer
 * Handles permission data operations
 */
class PermissionRepository {
  constructor({ db, logger }) {
    this.db = db
    this.logger = logger
  }

  /**
   * Find all permissions
   * @returns {Promise<Array>} - Array of permissions
   */
  async findAll() {
    try {
      const query = 'SELECT * FROM permissions ORDER BY resource, action'
      const result = await this.db.query(query)
      
      return result.rows.map(permission => ({
        id: permission.id,
        name: permission.name,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
        createdAt: permission.created_at
      }))
      
    } catch (error) {
      this.logger.error('Failed to find all permissions', { error: error.message })
      throw error
    }
  }

  /**
   * Find permission by ID
   * @param {number} id - Permission ID
   * @returns {Promise<Object|null>} - Permission object or null
   */
  async findById(id) {
    try {
      const query = 'SELECT * FROM permissions WHERE id = $1'
      const result = await this.db.query(query, [id])
      
      if (result.rows.length === 0) {
        return null
      }
      
      const permission = result.rows[0]
      return {
        id: permission.id,
        name: permission.name,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
        createdAt: permission.created_at
      }
      
    } catch (error) {
      this.logger.error('Failed to find permission by ID', { id, error: error.message })
      throw error
    }
  }

  /**
   * Find permissions by resource
   * @param {string} resource - Resource name
   * @returns {Promise<Array>} - Array of permissions
   */
  async findByResource(resource) {
    try {
      const query = 'SELECT * FROM permissions WHERE resource = $1 ORDER BY action'
      const result = await this.db.query(query, [resource])
      
      return result.rows.map(permission => ({
        id: permission.id,
        name: permission.name,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
        createdAt: permission.created_at
      }))
      
    } catch (error) {
      this.logger.error('Failed to find permissions by resource', { resource, error: error.message })
      throw error
    }
  }

  /**
   * Find permissions by action
   * @param {string} action - Action name
   * @returns {Promise<Array>} - Array of permissions
   */
  async findByAction(action) {
    try {
      const query = 'SELECT * FROM permissions WHERE action = $1 ORDER BY resource'
      const result = await this.db.query(query, [action])
      
      return result.rows.map(permission => ({
        id: permission.id,
        name: permission.name,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
        createdAt: permission.created_at
      }))
      
    } catch (error) {
      this.logger.error('Failed to find permissions by action', { action, error: error.message })
      throw error
    }
  }

  /**
   * Create permission
   * @param {Object} permissionData - Permission data
   * @returns {Promise<Object>} - Created permission
   */
  async create(permissionData) {
    try {
      const { name, description, resource, action } = permissionData
      
      const query = `
        INSERT INTO permissions (name, description, resource, action)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, description, resource, action, created_at
      `
      
      const result = await this.db.query(query, [name, description, resource, action])
      
      this.logger.info('Permission created', { permissionId: result.rows[0].id, name })
      return result.rows[0]
      
    } catch (error) {
      this.logger.error('Failed to create permission', { error: error.message })
      throw error
    }
  }

  /**
   * Update permission
   * @param {number} id - Permission ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} - Updated permission
   */
  async update(id, updateData) {
    try {
      const { name, description, resource, action } = updateData
      
      const query = `
        UPDATE permissions 
        SET name = COALESCE($1, name),
            description = COALESCE($2, description),
            resource = COALESCE($3, resource),
            action = COALESCE($4, action)
        WHERE id = $5
        RETURNING id, name, description, resource, action, created_at
      `
      
      const result = await this.db.query(query, [name, description, resource, action, id])
      
      if (result.rows.length === 0) {
        throw new Error('Permission not found')
      }
      
      this.logger.info('Permission updated', { permissionId: id })
      return result.rows[0]
      
    } catch (error) {
      this.logger.error('Failed to update permission', { id, error: error.message })
      throw error
    }
  }

  /**
   * Delete permission
   * @param {number} id - Permission ID
   * @returns {Promise<boolean>} - Success status
   */
  async delete(id) {
    try {
      const query = 'DELETE FROM permissions WHERE id = $1'
      const result = await this.db.query(query, [id])
      
      const deleted = result.rowCount > 0
      if (deleted) {
        this.logger.info('Permission deleted', { permissionId: id })
      }
      
      return deleted
      
    } catch (error) {
      this.logger.error('Failed to delete permission', { id, error: error.message })
      throw error
    }
  }

  /**
   * Get permissions grouped by resource
   * @returns {Promise<Object>} - Permissions grouped by resource
   */
  async getGroupedByResource() {
    try {
      const permissions = await this.findAll()
      
      const grouped = permissions.reduce((acc, permission) => {
        if (!acc[permission.resource]) {
          acc[permission.resource] = []
        }
        acc[permission.resource].push(permission)
        return acc
      }, {})
      
      return grouped
      
    } catch (error) {
      this.logger.error('Failed to get permissions grouped by resource', { error: error.message })
      throw error
    }
  }

  /**
   * Check if user has permission
   * @param {number} userId - User ID
   * @param {string} resource - Resource name
   * @param {string} action - Action name
   * @returns {Promise<boolean>} - Has permission
   */
  async userHasPermission(userId, resource, action) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = $1 AND p.resource = $2 AND p.action = $3
      `
      
      const result = await this.db.query(query, [userId, resource, action])
      
      return parseInt(result.rows[0].count) > 0
      
    } catch (error) {
      this.logger.error('Failed to check user permission', { userId, resource, action, error: error.message })
      throw error
    }
  }

  /**
   * Get user permissions
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - Array of user permissions
   */
  async getUserPermissions(userId) {
    try {
      const query = `
        SELECT DISTINCT p.id, p.name, p.description, p.resource, p.action
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = $1
        ORDER BY p.resource, p.action
      `
      
      const result = await this.db.query(query, [userId])
      
      return result.rows.map(permission => ({
        id: permission.id,
        name: permission.name,
        description: permission.description,
        resource: permission.resource,
        action: permission.action
      }))
      
    } catch (error) {
      this.logger.error('Failed to get user permissions', { userId, error: error.message })
      throw error
    }
  }
}

module.exports = PermissionRepository
