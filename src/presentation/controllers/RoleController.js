/**
 * Role Controller - Presentation layer
 * Handles role management API endpoints
 */

class RoleController {
  constructor ({ roleRepository, permissionRepository, userRepository, logger }) {
    this.roleRepository = roleRepository
    this.permissionRepository = permissionRepository
    this.userRepository = userRepository
    this.logger = logger
  }

  /**
   * Get all roles with pagination and search
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getRoles (req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        sort_by = 'created_at.desc'
      } = req.query

      const params = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        sort_by
      }

      const { roles, pagination } = await this.roleRepository.findAll(params)

      // Get permissions for each role
      const rolesWithPermissions = await Promise.all(
        roles.map(async (role) => {
          const permissions = await this.roleRepository.getRolePermissions(role.id)
          return {
            ...role,
            permissions: permissions.map(p => p.name)
          }
        })
      )

      res.json({
        success: true,
        data: rolesWithPermissions,
        meta: {
          total_item: pagination.total,
          total_page: pagination.totalPages,
          current_page: pagination.page,
          per_page: pagination.limit
        }
      })
    } catch (error) {
      this.logger.error('Get roles failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Get role by ID
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getRoleById (req, res) {
    try {
      const { id } = req.params
      const role = await this.roleRepository.findById(id)

      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        })
      }

      // Get role permissions
      const permissions = await this.roleRepository.getRolePermissions(id)

      res.json({
        success: true,
        data: {
          ...role,
          permissions: permissions.map(p => p.name)
        }
      })
    } catch (error) {
      this.logger.error('Get role by ID failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Create new role
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async createRole (req, res) {
    try {
      const { name, permissions = [] } = req.body

      // Validation
      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Role name is required'
        })
      }

      // Check if role name already exists
      const existingRole = await this.roleRepository.findByName(name)
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'Role name already exists'
        })
      }

      const roleData = {
        name: name.trim(),
        description: req.body.description || ''
      }

      const role = await this.roleRepository.create(roleData)

      // Assign permissions if provided
      if (permissions.length > 0) {
        await this.roleRepository.assignPermissions(role.id, permissions)
      }

      this.logger.info('Role created', { roleId: role.id, name, createdBy: req.user?.userId })

      res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: role
      })
    } catch (error) {
      this.logger.error('Create role failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Update role
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async updateRole (req, res) {
    try {
      const { id } = req.params
      const { name, permissions = [] } = req.body

      // Check if role exists
      const existingRole = await this.roleRepository.findById(id)
      if (!existingRole) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        })
      }

      // Validation
      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Role name is required'
        })
      }

      // Check if role name already exists (excluding current role)
      const duplicateRole = await this.roleRepository.findByName(name)
      if (duplicateRole && duplicateRole.id !== parseInt(id)) {
        return res.status(400).json({
          success: false,
          message: 'Role name already exists'
        })
      }

      const roleData = {
        name: name.trim()
      }

      const role = await this.roleRepository.update(id, roleData)

      // Update permissions
      await this.roleRepository.updatePermissions(id, permissions)

      this.logger.info('Role updated', { roleId: id, name, updatedBy: req.user?.userId })

      res.json({
        success: true,
        message: 'Role updated successfully',
        data: role
      })
    } catch (error) {
      this.logger.error('Update role failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Delete role
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async deleteRole (req, res) {
    try {
      const { id } = req.params

      // Check if role exists
      const role = await this.roleRepository.findById(id)
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        })
      }

      // Check if role is assigned to any users
      const usersWithRole = await this.userRepository.findUsersByRole(id)
      if (usersWithRole.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete role that is assigned to users'
        })
      }

      await this.roleRepository.delete(id)

      this.logger.info('Role deleted', { roleId: id, name: role.name, deletedBy: req.user?.userId })

      res.json({
        success: true,
        message: 'Role deleted successfully'
      })
    } catch (error) {
      this.logger.error('Delete role failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Get all permissions
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getPermissions (req, res) {
    try {
      const permissions = await this.permissionRepository.findAll()

      // Group permissions by feature
      const groupedPermissions = {}

      permissions.forEach(permission => {
        const [feature, action] = permission.name.split('.')

        if (!groupedPermissions[feature]) {
          groupedPermissions[feature] = []
        }
        groupedPermissions[feature].push(action)
      })

      res.json({
        success: true,
        data: {
          permissions: groupedPermissions
        }
      })
    } catch (error) {
      this.logger.error('Get permissions failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Get role permissions
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getRolePermissions (req, res) {
    try {
      const { id } = req.params
      const permissions = await this.roleRepository.getRolePermissions(id)

      res.json({
        success: true,
        data: permissions.map(p => p.name)
      })
    } catch (error) {
      this.logger.error('Get role permissions failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Update role permissions
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async updateRolePermissions (req, res) {
    try {
      const { id } = req.params
      const { permissions = [] } = req.body

      // Check if role exists
      const role = await this.roleRepository.findById(id)
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        })
      }

      await this.roleRepository.updatePermissions(id, permissions)

      this.logger.info('Role permissions updated', { roleId: id, permissions, updatedBy: req.user?.userId })

      res.json({
        success: true,
        message: 'Role permissions updated successfully'
      })
    } catch (error) {
      this.logger.error('Update role permissions failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Get users with specific role
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getRoleUsers (req, res) {
    try {
      const { id } = req.params
      const { page = 1, limit = 10 } = req.query

      const offset = (page - 1) * limit
      const { users, total } = await this.userRepository.findUsersByRole(id, { limit: parseInt(limit), offset })

      const totalPages = Math.ceil(total / limit)

      res.json({
        success: true,
        data: users,
        meta: {
          total,
          total_page: totalPages,
          current_page: parseInt(page),
          per_page: parseInt(limit)
        }
      })
    } catch (error) {
      this.logger.error('Get role users failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }


  /**
   * Assign role to user
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async assignRoleToUser (req, res) {
    try {
      const { id: roleId } = req.params
      const { user_id: userId } = req.body

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        })
      }

      // Check if role exists
      const role = await this.roleRepository.findById(roleId)
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        })
      }

      // Check if user exists
      const user = await this.userRepository.findById(userId)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      // Assign role to user
      await this.roleRepository.assignRoleToUser(roleId, userId)

      this.logger.info('Role assigned to user', { roleId, userId, assignedBy: req.user?.userId })

      res.json({
        success: true,
        message: 'Role assigned to user successfully'
      })
    } catch (error) {
      this.logger.error('Assign role to user failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Remove role from user
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async removeRoleFromUser (req, res) {
    try {
      const { roleId, userId } = req.params

      // Check if role exists
      const role = await this.roleRepository.findById(roleId)
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        })
      }

      // Check if user exists
      const user = await this.userRepository.findById(userId)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      // Remove role from user
      await this.roleRepository.removeRoleFromUser(roleId, userId)

      this.logger.info('Role removed from user', { roleId, userId, removedBy: req.user?.userId })

      res.json({
        success: true,
        message: 'Role removed from user successfully'
      })
    } catch (error) {
      this.logger.error('Remove role from user failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }
}

module.exports = RoleController
