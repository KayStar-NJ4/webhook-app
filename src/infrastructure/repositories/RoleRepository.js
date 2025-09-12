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
   * Find all roles
   * @returns {Promise<Array>} - Array of roles
   */
  async findAll() {
    try {
      const query = 'SELECT * FROM roles ORDER BY name'
      const result = await this.db.query(query)
      
      return result.rows.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        createdAt: role.created_at
      }))
      
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
        createdAt: role.created_at
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
        createdAt: role.created_at
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
        RETURNING id, name, description, created_at
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
            description = COALESCE($2, description)
        WHERE id = $3
        RETURNING id, name, description, created_at
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
  async getPermissions(roleId) {
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
