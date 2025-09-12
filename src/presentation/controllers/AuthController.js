const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

/**
 * Auth Controller - Presentation layer
 * Handles authentication and authorization
 */
class AuthController {
  constructor({ userRepository, logger, configurationService }) {
    this.userRepository = userRepository
    this.logger = logger
    this.configurationService = configurationService
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key'
    this.jwtExpiry = process.env.JWT_EXPIRY || '24h'
  }

  async initialize() {
    // JWT secret priority: ENV > Database > Default
    if (process.env.JWT_SECRET) {
      this.jwtSecret = process.env.JWT_SECRET
      this.logger.info('JWT secret loaded from environment')
    } else {
      try {
        const dbSecret = await this.configurationService.get('security.jwtSecret')
        if (dbSecret) {
          this.jwtSecret = dbSecret
          this.logger.info('JWT secret loaded from database')
        } else {
          this.logger.warn('No JWT secret found, using default')
        }
      } catch (error) {
        this.logger.warn('Failed to load JWT secret from database, using default', { error: error.message })
      }
    }

    // JWT expiry priority: ENV > Database > Default
    if (process.env.JWT_EXPIRY) {
      this.jwtExpiry = process.env.JWT_EXPIRY
      this.logger.info('JWT expiry loaded from environment')
    } else {
      try {
        const dbExpiry = await this.configurationService.get('security.jwtExpiry')
        if (dbExpiry) {
          this.jwtExpiry = dbExpiry
          this.logger.info('JWT expiry loaded from database')
        } else {
          this.logger.warn('No JWT expiry found, using default')
        }
      } catch (error) {
        this.logger.warn('Failed to load JWT expiry from database, using default', { error: error.message })
      }
    }
  }

  /**
   * Login user
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async login(req, res) {
    try {
      const { username, password } = req.body

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        })
      }

      // Find user by username
      const user = await this.userRepository.findByUsername(username)
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        })
      }

      // Check if user is active
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Account is disabled'
        })
      }

      // Verify password
      const isValidPassword = await this.userRepository.verifyPassword(password, user.password_hash)
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        })
      }

      // Get user with roles and permissions
      const userWithRoles = await this.userRepository.findWithRolesAndPermissions(user.id)

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          roles: userWithRoles.roles.map(r => r.name)
        },
        this.jwtSecret,
        { expiresIn: this.jwtExpiry }
      )

      this.logger.info('User logged in', { userId: user.id, username })

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.full_name,
            roles: userWithRoles.roles,
            permissions: userWithRoles.permissions
          }
        }
      })

    } catch (error) {
      this.logger.error('Login failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Get current user info
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getCurrentUser(req, res) {
    try {
      const userId = req.user.userId
      const user = await this.userRepository.findWithRolesAndPermissions(userId)

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          roles: user.roles,
          permissions: user.permissions
        }
      })

    } catch (error) {
      this.logger.error('Get current user failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Logout user
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async logout(req, res) {
    try {
      this.logger.info('User logged out', { userId: req.user.userId })
      
      res.json({
        success: true,
        message: 'Logout successful'
      })

    } catch (error) {
      this.logger.error('Logout failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Change password
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body
      const userId = req.user.userId

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        })
      }

      // Get user
      const user = await this.userRepository.findById(userId)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      // Verify current password
      const isValidPassword = await this.userRepository.verifyPassword(currentPassword, user.password_hash)
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        })
      }

      // Update password
      await this.userRepository.changePassword(userId, newPassword)

      this.logger.info('Password changed', { userId })

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
}

module.exports = AuthController
