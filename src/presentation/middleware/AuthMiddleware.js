const jwt = require('jsonwebtoken')

require('dotenv').config()

/**
 * Auth Middleware - Presentation layer
 * Handles JWT authentication
 */
class AuthMiddleware {
  constructor({ logger, configurationService }) {
    this.logger = logger
    this.configurationService = configurationService
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key'
    this.jwtExpiry = process.env.JWT_EXPIRY || '24h'
  }

  async initialize() {
    // JWT secret priority: ENV > Database > Default
    if (process.env.JWT_SECRET) {
      this.jwtSecret = process.env.JWT_SECRET
      // JWT secret loaded from environment
    } else {
      try {
        const dbSecret = await this.configurationService.get('security.jwtSecret')
        if (dbSecret) {
          this.jwtSecret = dbSecret
          // JWT secret loaded from database
        } else {
          this.logger.warn('No JWT secret found, using default')
        }
      } catch (error) {
        this.logger.warn('Failed to load JWT secret from database, using default', { error: error.message })
      }
    }
  }

  /**
   * Verify JWT token
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Next middleware
   */
  verifyToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Access token required'
        })
      }

      const token = authHeader.substring(7) // Remove 'Bearer ' prefix
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()
      } catch (jwtError) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        })
      }

    } catch (error) {
      this.logger.error('Token verification failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Check if user has required permission
   * @param {string} permission - Required permission
   * @returns {Function} - Middleware function
   */
  requirePermission(permission) {
    return async (req, res, next) => {
      try {
        // This would need to be implemented with actual permission checking
        // For now, just check if user is authenticated
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          })
        }

        // TODO: Implement actual permission checking
        // const user = await this.userRepository.findWithRolesAndPermissions(req.user.userId)
        // const hasPermission = user.permissions.some(p => p.name === permission)
        
        next()

      } catch (error) {
        this.logger.error('Permission check failed', { error: error.message })
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        })
      }
    }
  }

  /**
   * Check if user has required role
   * @param {string} role - Required role
   * @returns {Function} - Middleware function
   */
  requireRole(role) {
    return (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          })
        }

        if (!req.user.roles || !req.user.roles.includes(role)) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions'
          })
        }

        next()

      } catch (error) {
        this.logger.error('Role check failed', { error: error.message })
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        })
      }
    }
  }
}

module.exports = AuthMiddleware
