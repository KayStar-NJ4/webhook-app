/**
 * Permission Service - Application layer
 * Handles permission and role management business logic
 */
class PermissionService {
  constructor({ 
    userRepository, 
    roleRepository, 
    permissionRepository, 
    logger 
  }) {
    this.userRepository = userRepository
    this.roleRepository = roleRepository
    this.permissionRepository = permissionRepository
    this.logger = logger
  }

  /**
   * Check if user has permission
   * @param {number} userId - User ID
   * @param {string} resource - Resource name
   * @param {string} action - Action name
   * @returns {Promise<boolean>} - Has permission
   */
  async hasPermission(userId, resource, action) {
    try {
      return await this.permissionRepository.userHasPermission(userId, resource, action)
    } catch (error) {
      this.logger.error('Failed to check permission', { userId, resource, action, error: error.message })
      return false
    }
  }

  /**
   * Get user permissions
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - User permissions
   */
  async getUserPermissions(userId) {
    try {
      return await this.permissionRepository.getUserPermissions(userId)
    } catch (error) {
      this.logger.error('Failed to get user permissions', { userId, error: error.message })
      throw error
    }
  }

  /**
   * Get user permissions grouped by resource
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Permissions grouped by resource
   */
  async getUserPermissionsGrouped(userId) {
    try {
      const permissions = await this.getUserPermissions(userId)
      
      const grouped = permissions.reduce((acc, permission) => {
        if (!acc[permission.resource]) {
          acc[permission.resource] = []
        }
        acc[permission.resource].push(permission)
        return acc
      }, {})
      
      return grouped
    } catch (error) {
      this.logger.error('Failed to get user permissions grouped', { userId, error: error.message })
      throw error
    }
  }

  /**
   * Assign role to user
   * @param {number} userId - User ID
   * @param {number} roleId - Role ID
   * @returns {Promise<void>}
   */
  async assignRoleToUser(userId, roleId) {
    try {
      // Check if user exists
      const user = await this.userRepository.findById(userId)
      if (!user) {
        throw new Error('User not found')
      }

      // Check if role exists
      const role = await this.roleRepository.findById(roleId)
      if (!role) {
        throw new Error('Role not found')
      }

      // Assign role
      const query = `
        INSERT INTO user_roles (user_id, role_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, role_id) DO NOTHING
      `
      
      await this.userRepository.db.query(query, [userId, roleId])
      
      this.logger.info('Role assigned to user', { userId, roleId, roleName: role.name })
      
    } catch (error) {
      this.logger.error('Failed to assign role to user', { userId, roleId, error: error.message })
      throw error
    }
  }

  /**
   * Remove role from user
   * @param {number} userId - User ID
   * @param {number} roleId - Role ID
   * @returns {Promise<void>}
   */
  async removeRoleFromUser(userId, roleId) {
    try {
      const query = 'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2'
      await this.userRepository.db.query(query, [userId, roleId])
      
      this.logger.info('Role removed from user', { userId, roleId })
      
    } catch (error) {
      this.logger.error('Failed to remove role from user', { userId, roleId, error: error.message })
      throw error
    }
  }

  /**
   * Get all roles
   * @returns {Promise<Array>} - All roles
   */
  async getAllRoles() {
    try {
      return await this.roleRepository.findAll()
    } catch (error) {
      this.logger.error('Failed to get all roles', { error: error.message })
      throw error
    }
  }

  /**
   * Get all permissions
   * @returns {Promise<Array>} - All permissions
   */
  async getAllPermissions() {
    try {
      return await this.permissionRepository.findAll()
    } catch (error) {
      this.logger.error('Failed to get all permissions', { error: error.message })
      throw error
    }
  }

  /**
   * Get permissions grouped by resource
   * @returns {Promise<Object>} - Permissions grouped by resource
   */
  async getPermissionsGrouped() {
    try {
      return await this.permissionRepository.getGroupedByResource()
    } catch (error) {
      this.logger.error('Failed to get permissions grouped', { error: error.message })
      throw error
    }
  }

  /**
   * Create role
   * @param {Object} roleData - Role data
   * @returns {Promise<Object>} - Created role
   */
  async createRole(roleData) {
    try {
      return await this.roleRepository.create(roleData)
    } catch (error) {
      this.logger.error('Failed to create role', { error: error.message })
      throw error
    }
  }

  /**
   * Update role
   * @param {number} roleId - Role ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} - Updated role
   */
  async updateRole(roleId, updateData) {
    try {
      return await this.roleRepository.update(roleId, updateData)
    } catch (error) {
      this.logger.error('Failed to update role', { roleId, error: error.message })
      throw error
    }
  }

  /**
   * Delete role
   * @param {number} roleId - Role ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteRole(roleId) {
    try {
      return await this.roleRepository.delete(roleId)
    } catch (error) {
      this.logger.error('Failed to delete role', { roleId, error: error.message })
      throw error
    }
  }

  /**
   * Assign permission to role
   * @param {number} roleId - Role ID
   * @param {number} permissionId - Permission ID
   * @returns {Promise<void>}
   */
  async assignPermissionToRole(roleId, permissionId) {
    try {
      await this.roleRepository.assignPermission(roleId, permissionId)
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
  async removePermissionFromRole(roleId, permissionId) {
    try {
      await this.roleRepository.removePermission(roleId, permissionId)
    } catch (error) {
      this.logger.error('Failed to remove permission from role', { roleId, permissionId, error: error.message })
      throw error
    }
  }

  /**
   * Get role permissions
   * @param {number} roleId - Role ID
   * @returns {Promise<Array>} - Role permissions
   */
  async getRolePermissions(roleId) {
    try {
      return await this.roleRepository.getPermissions(roleId)
    } catch (error) {
      this.logger.error('Failed to get role permissions', { roleId, error: error.message })
      throw error
    }
  }

  /**
   * Check if user is super admin
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} - Is super admin
   */
  async isSuperAdmin(userId) {
    try {
      const user = await this.userRepository.findWithRolesAndPermissions(userId)
      if (!user) return false
      
      return user.roles.some(role => role.name === 'super_admin')
    } catch (error) {
      this.logger.error('Failed to check if user is super admin', { userId, error: error.message })
      return false
    }
  }

  /**
   * Check if user is admin
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} - Is admin
   */
  async isAdmin(userId) {
    try {
      const user = await this.userRepository.findWithRolesAndPermissions(userId)
      if (!user) return false
      
      return user.roles.some(role => ['super_admin', 'admin'].includes(role.name))
    } catch (error) {
      this.logger.error('Failed to check if user is admin', { userId, error: error.message })
      return false
    }
  }

  /**
   * Get user role names
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - User role names
   */
  async getUserRoleNames(userId) {
    try {
      const user = await this.userRepository.findWithRolesAndPermissions(userId)
      if (!user) return []
      
      return user.roles.map(role => role.name)
    } catch (error) {
      this.logger.error('Failed to get user role names', { userId, error: error.message })
      return []
    }
  }
}

module.exports = PermissionService
