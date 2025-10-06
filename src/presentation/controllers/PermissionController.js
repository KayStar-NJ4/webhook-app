/**
 * Permission Controller - Presentation layer
 * Handles permission and role management endpoints
 */
class PermissionController {
  constructor ({
    permissionService,
    userRepository,
    logger
  }) {
    this.permissionService = permissionService
    this.userRepository = userRepository
    this.logger = logger
  }

  /**
   * Get all roles
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getRoles (req, res) {
    try {
      const roles = await this.permissionService.getAllRoles()

      res.json({
        success: true,
        data: roles
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
   * Get all permissions grouped by resource
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getPermissions (req, res) {
    try {
      const permissions = await this.permissionService.getAllPermissions()

      res.json({
        success: true,
        data: permissions.map(permission => ({
          id: permission.id,
          name: permission.name,
          description: permission.description,
          resource: permission.resource,
          action: permission.action
        }))
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
   * Get permissions grouped by resource
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getPermissionsGrouped (req, res) {
    try {
      const permissions = await this.permissionService.getPermissionsGrouped()

      res.json({
        success: true,
        data: permissions
      })
    } catch (error) {
      this.logger.error('Get permissions grouped failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Get user permissions
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getUserPermissions (req, res) {
    try {
      const userId = req.user.userId
      const permissions = await this.permissionService.getUserPermissionsGrouped(userId)

      res.json({
        success: true,
        data: permissions
      })
    } catch (error) {
      this.logger.error('Get user permissions failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Get all permissions for assignment (grouped by resource)
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getPermissionsForAssignment (req, res) {
    try {
      const permissions = await this.permissionService.getAllPermissions()

      // Group permissions by resource for easy selection
      const groupedPermissions = {}
      permissions.forEach(permission => {
        const resource = permission.resource

        if (!groupedPermissions[resource]) {
          groupedPermissions[resource] = {
            resource,
            resourceName: this.getResourceDisplayName(resource),
            actions: []
          }
        }

        groupedPermissions[resource].actions.push({
          id: permission.id,
          name: permission.name,
          description: permission.description,
          action: permission.action,
          actionName: this.getActionDisplayName(permission.action)
        })
      })

      // Convert to array format for easier frontend handling
      const permissionsArray = Object.values(groupedPermissions)

      res.json({
        success: true,
        data: {
          permissions: permissionsArray
        }
      })
    } catch (error) {
      this.logger.error('Get permissions for assignment failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Get resource display name in Vietnamese
   * @param {string} resource - Resource name
   * @returns {string} - Display name
   */
  getResourceDisplayName (resource) {
    const resourceNames = {
      system: 'Hệ thống',
      users: 'Người dùng',
      roles: 'Vai trò',
      permissions: 'Quyền',
      config: 'Cấu hình',
      chatwoot: 'Chatwoot',
      telegram: 'Telegram',
      dify: 'Dify'
    }
    return resourceNames[resource] || resource
  }

  /**
   * Get action display name in Vietnamese
   * @param {string} action - Action name
   * @returns {string} - Display name
   */
  getActionDisplayName (action) {
    const actionNames = {
      dashboard: 'Bảng điều khiển',
      logs: 'Nhật ký',
      metrics: 'Thống kê',
      create: 'Tạo',
      read: 'Xem',
      update: 'Sửa',
      delete: 'Xóa',
      manage_permissions: 'Quản lý quyền',
      manage_roles: 'Quản lý vai trò'
    }
    return actionNames[action] || action
  }

  /**
   * Create role
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async createRole (req, res) {
    try {
      const { name, description } = req.body

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Role name is required'
        })
      }

      const role = await this.permissionService.createRole({
        name,
        description
      })

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
      const { name, description } = req.body

      const role = await this.permissionService.updateRole(parseInt(id), {
        name,
        description
      })

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

      const deleted = await this.permissionService.deleteRole(parseInt(id))

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        })
      }

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
   * Assign role to user
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async assignRoleToUser (req, res) {
    try {
      const { userId, roleId } = req.body

      if (!userId || !roleId) {
        return res.status(400).json({
          success: false,
          message: 'User ID and Role ID are required'
        })
      }

      await this.permissionService.assignRoleToUser(parseInt(userId), parseInt(roleId))

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
      const { userId, roleId } = req.body

      if (!userId || !roleId) {
        return res.status(400).json({
          success: false,
          message: 'User ID and Role ID are required'
        })
      }

      await this.permissionService.removeRoleFromUser(parseInt(userId), parseInt(roleId))

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

  /**
   * Assign permission to role
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async assignPermissionToRole (req, res) {
    try {
      const { roleId, permissionId } = req.body

      if (!roleId || !permissionId) {
        return res.status(400).json({
          success: false,
          message: 'Role ID and Permission ID are required'
        })
      }

      await this.permissionService.assignPermissionToRole(parseInt(roleId), parseInt(permissionId))

      res.json({
        success: true,
        message: 'Permission assigned to role successfully'
      })
    } catch (error) {
      this.logger.error('Assign permission to role failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Remove permission from role
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async removePermissionFromRole (req, res) {
    try {
      const { roleId, permissionId } = req.body

      if (!roleId || !permissionId) {
        return res.status(400).json({
          success: false,
          message: 'Role ID and Permission ID are required'
        })
      }

      await this.permissionService.removePermissionFromRole(parseInt(roleId), parseInt(permissionId))

      res.json({
        success: true,
        message: 'Permission removed from role successfully'
      })
    } catch (error) {
      this.logger.error('Remove permission from role failed', { error: error.message })
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
      const permissions = await this.permissionService.getRolePermissions(parseInt(id))

      res.json({
        success: true,
        data: permissions
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
   * Get user roles
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getUserRoles (req, res) {
    try {
      const { id } = req.params
      const user = await this.userRepository.findWithRolesAndPermissions(parseInt(id))

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      res.json({
        success: true,
        data: {
          roles: user.roles,
          permissions: user.permissions
        }
      })
    } catch (error) {
      this.logger.error('Get user roles failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Check user permission
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async checkPermission (req, res) {
    try {
      const { resource, action } = req.query
      const userId = req.user.userId

      if (!resource || !action) {
        return res.status(400).json({
          success: false,
          message: 'Resource and action are required'
        })
      }

      const hasPermission = await this.permissionService.hasPermission(userId, resource, action)

      res.json({
        success: true,
        data: {
          hasPermission,
          resource,
          action
        }
      })
    } catch (error) {
      this.logger.error('Check permission failed', { error: error.message })
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

      this.logger.info('Update role permissions request', {
        roleId: id,
        permissions,
        permissionsType: typeof permissions,
        permissionsLength: permissions.length,
        updatedBy: req.user?.userId
      })

      // Check if role exists
      const role = await this.permissionService.getRoleById(parseInt(id))
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        })
      }

      // Convert permission names to array if needed
      let permissionNames = permissions
      if (typeof permissions === 'string') {
        permissionNames = [permissions]
      } else if (Array.isArray(permissions)) {
        // If permissions is array of objects with name property, extract names
        if (permissions.length > 0 && typeof permissions[0] === 'object' && permissions[0].name) {
          permissionNames = permissions.map(p => p.name)
        }
        // If permissions is already array of strings, use as is
      }

      await this.permissionService.updateRolePermissions(parseInt(id), permissionNames)

      this.logger.info('Role permissions updated successfully', {
        roleId: id,
        permissionNames,
        updatedBy: req.user?.userId
      })

      res.json({
        success: true,
        message: 'Role permissions updated successfully'
      })
    } catch (error) {
      this.logger.error('Update role permissions failed', {
        error: error.message,
        stack: error.stack,
        roleId: req.params.id,
        permissions: req.body.permissions
      })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }
}

module.exports = PermissionController
