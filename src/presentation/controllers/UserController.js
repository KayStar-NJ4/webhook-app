const bcrypt = require('bcrypt')

/**
 * User Controller - Presentation layer
 * Handles user management operations
 */
class UserController {
  constructor ({ userRepository, logger }) {
    this.userRepository = userRepository
    this.logger = logger
  }

  /**
   * Get users with pagination and search
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getUsers (req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        sort_by = 'created_at.desc',
        is_active,
        role_id
      } = req.query

      const filters = {}
      if (is_active !== undefined) {
        filters.is_active = is_active === 'true'
      }
      if (role_id) {
        filters.role_id = parseInt(role_id)
      }

      const result = await this.userRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        sort_by,
        ...filters
      })

      res.json({
        success: true,
        data: result.users || result.data || [],
        meta: {
          total_item: result.pagination?.total || result.total || 0,
          total_page: result.pagination?.totalPages || result.totalPages || 0,
          current_page: parseInt(page),
          per_page: parseInt(limit)
        }
      })
    } catch (error) {
      this.logger.error('Get users failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Get user by ID
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getUserById (req, res) {
    try {
      const { id } = req.params
      const user = await this.userRepository.findById(parseInt(id))

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      res.json({
        success: true,
        data: user
      })
    } catch (error) {
      this.logger.error('Get user by ID failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Create new user
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async createUser (req, res) {
    try {
      const {
        username,
        email,
        password,
        full_name,
        phone_number,
        avatar,
        gender,
        date_of_birth,
        is_active = true,
        role_id
      } = req.body

      // Validation
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email and password are required'
        })
      }

      // Check if username already exists
      const existingUserByUsername = await this.userRepository.findByUsername(username)
      if (existingUserByUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        })
      }

      // Check if email already exists
      const existingUserByEmail = await this.userRepository.findByEmail(email)
      if (existingUserByEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        })
      }

      const userData = {
        username,
        email,
        password,
        fullName: full_name,
        phoneNumber: phone_number,
        avatar,
        gender,
        dateOfBirth: date_of_birth,
        isActive: is_active
        // Note: role_id is handled separately through user_roles table
      }

      const user = await this.userRepository.create(userData)

      this.logger.info('User created', { userId: user.id, username, createdBy: req.user?.userId })

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      })
    } catch (error) {
      this.logger.error('Create user failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Update user
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async updateUser (req, res) {
    try {
      const { id } = req.params
      const {
        username,
        email,
        full_name,
        phone_number,
        avatar,
        gender,
        date_of_birth,
        is_active,
        role_id
      } = req.body

      // Check if user exists
      const existingUser = await this.userRepository.findById(parseInt(id))
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      // Check if username is being changed and already exists
      if (username && username !== existingUser.username) {
        const existingUserByUsername = await this.userRepository.findByUsername(username)
        if (existingUserByUsername) {
          return res.status(400).json({
            success: false,
            message: 'Username already exists'
          })
        }
      }

      // Check if email is being changed and already exists
      if (email && email !== existingUser.email) {
        const existingUserByEmail = await this.userRepository.findByEmail(email)
        if (existingUserByEmail) {
          return res.status(400).json({
            success: false,
            message: 'Email already exists'
          })
        }
      }

      const updateData = {
        username,
        email,
        fullName: full_name,
        phoneNumber: phone_number,
        avatar,
        gender,
        dateOfBirth: date_of_birth,
        isActive: is_active,
        role_id
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key]
        }
      })

      const user = await this.userRepository.update(parseInt(id), updateData)

      this.logger.info('User updated', { userId: id, updatedBy: req.user?.userId })

      res.json({
        success: true,
        message: 'User updated successfully',
        data: user
      })
    } catch (error) {
      this.logger.error('Update user failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Delete user
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async deleteUser (req, res) {
    try {
      const { id } = req.params

      // Check if user exists
      const existingUser = await this.userRepository.findById(parseInt(id))
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      // Prevent deleting super admin
      if (existingUser.username === 'admin' || existingUser.role?.name === 'super_admin') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete super admin user'
        })
      }

      await this.userRepository.delete(parseInt(id))

      this.logger.info('User deleted', { userId: id, deletedBy: req.user?.userId })

      res.json({
        success: true,
        message: 'User deleted successfully'
      })
    } catch (error) {
      this.logger.error('Delete user failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Change user password
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async changePassword (req, res) {
    try {
      const { id } = req.params
      const { password } = req.body

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required'
        })
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long'
        })
      }

      // Check if user exists
      const existingUser = await this.userRepository.findById(parseInt(id))
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      await this.userRepository.changePassword(parseInt(id), password)

      this.logger.info('User password changed', { userId: id, changedBy: req.user?.userId })

      res.json({
        success: true,
        message: 'Password changed successfully'
      })
    } catch (error) {
      this.logger.error('Change password failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Update user status
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async updateUserStatus (req, res) {
    try {
      const { id } = req.params
      const { is_active } = req.body

      if (typeof is_active !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'is_active must be a boolean value'
        })
      }

      // Check if user exists
      const existingUser = await this.userRepository.findById(parseInt(id))
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      // Prevent deactivating super admin
      if (existingUser.username === 'admin' || existingUser.role?.name === 'super_admin') {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate super admin user'
        })
      }

      const user = await this.userRepository.update(parseInt(id), { is_active })

      this.logger.info('User status updated', { userId: id, is_active, updatedBy: req.user?.userId })

      res.json({
        success: true,
        message: 'User status updated successfully',
        data: user
      })
    } catch (error) {
      this.logger.error('Update user status failed', { error: error.message })
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
          roles: user.roles || [],
          permissions: user.permissions || []
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
   * Get user permissions
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getUserPermissions (req, res) {
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
        data: user.permissions || []
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
   * Update user permissions
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async updateUserPermissions (req, res) {
    try {
      const { id } = req.params
      const { permissions = [] } = req.body

      // Check if user exists
      const user = await this.userRepository.findById(parseInt(id))
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      // Update user permissions
      await this.userRepository.updatePermissions(parseInt(id), permissions)

      this.logger.info('User permissions updated', {
        userId: id,
        permissions,
        updatedBy: req.user?.userId
      })

      res.json({
        success: true,
        message: 'User permissions updated successfully'
      })
    } catch (error) {
      this.logger.error('Update user permissions failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Add role to user
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async addUserRole (req, res) {
    try {
      const { id } = req.params
      const { role_id } = req.body

      if (!role_id) {
        return res.status(400).json({
          success: false,
          message: 'Role ID is required'
        })
      }

      // Check if user exists
      const user = await this.userRepository.findById(parseInt(id))
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      // Add role to user
      await this.userRepository.addUserRole(parseInt(id), parseInt(role_id))

      this.logger.info('User role added', {
        userId: id,
        roleId: role_id,
        addedBy: req.user?.userId
      })

      res.json({
        success: true,
        message: 'Role added successfully'
      })
    } catch (error) {
      this.logger.error('Add user role failed', { error: error.message })
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
  async removeUserRole (req, res) {
    try {
      const { id, roleId } = req.params

      // Check if user exists
      const user = await this.userRepository.findById(parseInt(id))
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      // Remove role from user
      await this.userRepository.removeUserRole(parseInt(id), parseInt(roleId))

      this.logger.info('User role removed', {
        userId: id,
        roleId,
        removedBy: req.user?.userId
      })

      res.json({
        success: true,
        message: 'Role removed successfully'
      })
    } catch (error) {
      this.logger.error('Remove user role failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Update all user roles
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async updateUserRoles (req, res) {
    try {
      const { id } = req.params
      const { role_ids = [] } = req.body

      // Check if user exists
      const user = await this.userRepository.findById(parseInt(id))
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      // Update user roles (replace all existing roles)
      await this.userRepository.updateUserRoles(parseInt(id), role_ids)

      this.logger.info('User roles updated', {
        userId: id,
        roleIds: role_ids,
        updatedBy: req.user?.userId
      })

      res.json({
        success: true,
        message: 'User roles updated successfully'
      })
    } catch (error) {
      this.logger.error('Update user roles failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }
}

module.exports = UserController
