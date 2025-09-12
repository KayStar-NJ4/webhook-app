/**
 * Permission Middleware - Presentation layer
 * Handles permission-based access control
 */
class PermissionMiddleware {
  constructor({ permissionService, logger }) {
    this.permissionService = permissionService
    this.logger = logger
  }

  /**
   * Check if user has specific permission
   * @param {string} resource - Resource name
   * @param {string} action - Action name
   * @returns {Function} - Express middleware function
   */
  requirePermission(resource, action) {
    return async (req, res, next) => {
      try {
        if (!req.user || !req.user.userId) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          })
        }

        const hasPermission = await this.permissionService.hasPermission(
          req.user.userId, 
          resource, 
          action
        )

        if (!hasPermission) {
          this.logger.warn('Permission denied', {
            userId: req.user.userId,
            resource,
            action,
            ip: req.ip
          })

          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions'
          })
        }

        next()
      } catch (error) {
        this.logger.error('Permission check failed', {
          userId: req.user?.userId,
          resource,
          action,
          error: error.message
        })

        return res.status(500).json({
          success: false,
          message: 'Internal server error'
        })
      }
    }
  }

  /**
   * Check if user has any of the specified permissions
   * @param {Array} permissions - Array of {resource, action} objects
   * @returns {Function} - Express middleware function
   */
  requireAnyPermission(permissions) {
    return async (req, res, next) => {
      try {
        if (!req.user || !req.user.userId) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          })
        }

        const userId = req.user.userId
        let hasAnyPermission = false

        for (const permission of permissions) {
          const hasPermission = await this.permissionService.hasPermission(
            userId,
            permission.resource,
            permission.action
          )
          
          if (hasPermission) {
            hasAnyPermission = true
            break
          }
        }

        if (!hasAnyPermission) {
          this.logger.warn('Permission denied - no matching permissions', {
            userId,
            requiredPermissions: permissions,
            ip: req.ip
          })

          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions'
          })
        }

        next()
      } catch (error) {
        this.logger.error('Permission check failed', {
          userId: req.user?.userId,
          permissions,
          error: error.message
        })

        return res.status(500).json({
          success: false,
          message: 'Internal server error'
        })
      }
    }
  }

  /**
   * Check if user has all of the specified permissions
   * @param {Array} permissions - Array of {resource, action} objects
   * @returns {Function} - Express middleware function
   */
  requireAllPermissions(permissions) {
    return async (req, res, next) => {
      try {
        if (!req.user || !req.user.userId) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          })
        }

        const userId = req.user.userId
        let hasAllPermissions = true

        for (const permission of permissions) {
          const hasPermission = await this.permissionService.hasPermission(
            userId,
            permission.resource,
            permission.action
          )
          
          if (!hasPermission) {
            hasAllPermissions = false
            break
          }
        }

        if (!hasAllPermissions) {
          this.logger.warn('Permission denied - missing required permissions', {
            userId,
            requiredPermissions: permissions,
            ip: req.ip
          })

          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions'
          })
        }

        next()
      } catch (error) {
        this.logger.error('Permission check failed', {
          userId: req.user?.userId,
          permissions,
          error: error.message
        })

        return res.status(500).json({
          success: false,
          message: 'Internal server error'
        })
      }
    }
  }

  /**
   * Check if user is super admin
   * @returns {Function} - Express middleware function
   */
  requireSuperAdmin() {
    return async (req, res, next) => {
      try {
        if (!req.user || !req.user.userId) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          })
        }

        const isSuperAdmin = await this.permissionService.isSuperAdmin(req.user.userId)

        if (!isSuperAdmin) {
          this.logger.warn('Super admin access denied', {
            userId: req.user.userId,
            ip: req.ip
          })

          return res.status(403).json({
            success: false,
            message: 'Super admin access required'
          })
        }

        next()
      } catch (error) {
        this.logger.error('Super admin check failed', {
          userId: req.user?.userId,
          error: error.message
        })

        return res.status(500).json({
          success: false,
          message: 'Internal server error'
        })
      }
    }
  }

  /**
   * Check if user is admin (super admin or admin)
   * @returns {Function} - Express middleware function
   */
  requireAdmin() {
    return async (req, res, next) => {
      try {
        if (!req.user || !req.user.userId) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          })
        }

        const isAdmin = await this.permissionService.isAdmin(req.user.userId)

        if (!isAdmin) {
          this.logger.warn('Admin access denied', {
            userId: req.user.userId,
            ip: req.ip
          })

          return res.status(403).json({
            success: false,
            message: 'Admin access required'
          })
        }

        next()
      } catch (error) {
        this.logger.error('Admin check failed', {
          userId: req.user?.userId,
          error: error.message
        })

        return res.status(500).json({
          success: false,
          message: 'Internal server error'
        })
      }
    }
  }

  /**
   * Add user permissions to request object
   * @returns {Function} - Express middleware function
   */
  addUserPermissions() {
    return async (req, res, next) => {
      try {
        if (!req.user || !req.user.userId) {
          return next()
        }

        const permissions = await this.permissionService.getUserPermissionsGrouped(req.user.userId)
        req.user.permissions = permissions

        next()
      } catch (error) {
        this.logger.error('Failed to add user permissions', {
          userId: req.user?.userId,
          error: error.message
        })

        // Don't fail the request, just continue without permissions
        next()
      }
    }
  }
}

module.exports = PermissionMiddleware
