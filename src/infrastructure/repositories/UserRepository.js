const bcrypt = require('bcrypt')

/**
 * User Repository - Infrastructure layer
 * Handles user data operations
 */
class UserRepository {
  constructor({ db, logger }) {
    this.db = db
    this.logger = logger
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Created user
   */
  async create(userData) {
    try {
      const { username, email, password, fullName, phoneNumber, avatar, gender, dateOfBirth } = userData
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10)
      
      // Handle empty strings - convert to null for optional fields
      const processedFullName = (fullName && fullName.trim() !== '') ? fullName : null
      const processedPhoneNumber = (phoneNumber && phoneNumber.trim() !== '') ? phoneNumber : null
      const processedAvatar = (avatar && avatar.trim() !== '') ? avatar : null
      const processedGender = (gender && gender.trim() !== '') ? gender : null
      const processedDateOfBirth = (dateOfBirth && dateOfBirth.trim() !== '') ? dateOfBirth : null
      
      const query = `
        INSERT INTO users (username, email, password_hash, full_name, phone_number, avatar, gender, date_of_birth)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, username, email, full_name, phone_number, avatar, gender, date_of_birth, is_active, created_at
      `
      
      const result = await this.db.query(query, [username, email, passwordHash, processedFullName, processedPhoneNumber, processedAvatar, processedGender, processedDateOfBirth])
      
      this.logger.info('User created', { userId: result.rows[0].id, username })
      return result.rows[0]
      
    } catch (error) {
      this.logger.error('Failed to create user', { error: error.message })
      throw error
    }
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} - User object or null
   */
  async findById(id) {
    try {
      const query = 'SELECT * FROM users WHERE id = $1'
      const result = await this.db.query(query, [id])
      
      return result.rows[0] || null
      
    } catch (error) {
      this.logger.error('Failed to find user by ID', { id, error: error.message })
      throw error
    }
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<Object|null>} - User object or null
   */
  async findByUsername(username) {
    try {
      const query = 'SELECT * FROM users WHERE username = $1'
      const result = await this.db.query(query, [username])
      
      return result.rows[0] || null
      
    } catch (error) {
      this.logger.error('Failed to find user by username', { username, error: error.message })
      throw error
    }
  }

  /**
   * Find user by email
   * @param {string} email - Email
   * @returns {Promise<Object|null>} - User object or null
   */
  async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = $1'
      const result = await this.db.query(query, [email])
      
      return result.rows[0] || null
      
    } catch (error) {
      this.logger.error('Failed to find user by email', { email, error: error.message })
      throw error
    }
  }

  /**
   * Get all users with pagination, search, sorting and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Users and pagination info
   */
  async findAll(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        sort_by = 'created_at.desc',
        is_active,
        role_id
      } = options
      const offset = (page - 1) * limit
      
      let whereConditions = []
      let params = []
      let paramIndex = 1
      
      // Search functionality
      if (search) {
        whereConditions.push(`(username ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR full_name ILIKE $${paramIndex})`)
        params.push(`%${search}%`)
        paramIndex++
      }
      
      // Filter by is_active
      if (is_active !== undefined) {
        whereConditions.push(`is_active = $${paramIndex}`)
        params.push(is_active)
        paramIndex++
      }
      
      // Filter by role_id
      if (role_id) {
        whereConditions.push(`id IN (SELECT user_id FROM user_roles WHERE role_id = $${paramIndex})`)
        params.push(parseInt(role_id))
        paramIndex++
      }
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
      
      // Parse sort_by parameter
      let orderBy = 'ORDER BY created_at DESC'
      if (sort_by) {
        const [field, direction] = sort_by.split('.')
        const validFields = ['id', 'username', 'email', 'full_name', 'created_at', 'updated_at']
        const validDirections = ['asc', 'desc']
        
        if (validFields.includes(field) && validDirections.includes(direction)) {
          orderBy = `ORDER BY ${field} ${direction.toUpperCase()}`
        }
      }
      
      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`
      const countResult = await this.db.query(countQuery, params)
      const total = parseInt(countResult.rows[0].total)
      
      // Get users with pagination
      const query = `
        SELECT 
          u.id, u.username, u.email, u.full_name, u.phone_number, u.avatar, 
          u.gender, u.date_of_birth, u.is_active, u.created_at, u.updated_at,
          r.id as role_id, r.name as role_name
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        ${whereClause}
        ${orderBy}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `
      
      const result = await this.db.query(query, [...params, limit, offset])
      
      // Group users by ID to handle multiple roles
      const userMap = new Map()
      result.rows.forEach(row => {
        if (!userMap.has(row.id)) {
          userMap.set(row.id, {
            id: row.id,
            username: row.username,
            email: row.email,
            full_name: row.full_name,
            phone_number: row.phone_number,
            avatar: row.avatar,
            gender: row.gender,
            date_of_birth: row.date_of_birth,
            is_active: row.is_active,
            created_at: row.created_at,
            updated_at: row.updated_at,
            role: row.role_id ? { id: row.role_id, name: row.role_name } : null
          })
        }
      })
      
      return {
        users: Array.from(userMap.values()),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
      
    } catch (error) {
      this.logger.error('Failed to find all users', { error: error.message })
      throw error
    }
  }

  /**
   * Update user
   * @param {number} id - User ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} - Updated user
   */
  async update(id, updateData) {
    try {
      const { username, email, fullName, phoneNumber, avatar, gender, dateOfBirth, isActive } = updateData
      
      // Handle empty strings - convert to null for optional fields
      const processedFullName = (fullName && fullName.trim() !== '') ? fullName : null
      const processedPhoneNumber = (phoneNumber && phoneNumber.trim() !== '') ? phoneNumber : null
      const processedAvatar = (avatar && avatar.trim() !== '') ? avatar : null
      const processedGender = (gender && gender.trim() !== '') ? gender : null
      const processedDateOfBirth = (dateOfBirth && dateOfBirth.trim() !== '') ? dateOfBirth : null
      
      const query = `
        UPDATE users 
        SET username = COALESCE($1, username),
            email = COALESCE($2, email),
            full_name = COALESCE($3, full_name),
            phone_number = COALESCE($4, phone_number),
            avatar = COALESCE($5, avatar),
            gender = COALESCE($6, gender),
            date_of_birth = COALESCE($7, date_of_birth),
            is_active = COALESCE($8, is_active),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
        RETURNING id, username, email, full_name, phone_number, avatar, gender, date_of_birth, is_active, created_at, updated_at
      `
      
      const result = await this.db.query(query, [username, email, processedFullName, processedPhoneNumber, processedAvatar, processedGender, processedDateOfBirth, isActive, id])
      
      if (result.rows.length === 0) {
        throw new Error('User not found')
      }
      
      this.logger.info('User updated', { userId: id })
      return result.rows[0]
      
    } catch (error) {
      this.logger.error('Failed to update user', { id, error: error.message })
      throw error
    }
  }

  /**
   * Change user password
   * @param {number} id - User ID
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async changePassword(id, newPassword) {
    try {
      const passwordHash = await bcrypt.hash(newPassword, 10)
      
      const query = 'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2'
      await this.db.query(query, [passwordHash, id])
      
      this.logger.info('User password changed', { userId: id })
      
    } catch (error) {
      this.logger.error('Failed to change user password', { id, error: error.message })
      throw error
    }
  }

  /**
   * Delete user
   * @param {number} id - User ID
   * @returns {Promise<boolean>} - Success status
   */
  async delete(id) {
    try {
      const query = 'DELETE FROM users WHERE id = $1'
      const result = await this.db.query(query, [id])
      
      const deleted = result.rowCount > 0
      if (deleted) {
        this.logger.info('User deleted', { userId: id })
      }
      
      return deleted
      
    } catch (error) {
      this.logger.error('Failed to delete user', { id, error: error.message })
      throw error
    }
  }

  /**
   * Verify user password
   * @param {string} password - Plain password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} - Password match
   */
  async verifyPassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash)
    } catch (error) {
      this.logger.error('Failed to verify password', { error: error.message })
      return false
    }
  }

  /**
   * Get user with roles and permissions
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} - User with roles and permissions
   */
  async findWithRolesAndPermissions(id) {
    try {
      // Get user basic info
      const userQuery = `
        SELECT id, username, email, full_name, is_active, created_at, updated_at
        FROM users WHERE id = $1
      `
      const userResult = await this.db.query(userQuery, [id])
      
      if (userResult.rows.length === 0) {
        return null
      }
      
      const user = {
        id: userResult.rows[0].id,
        username: userResult.rows[0].username,
        email: userResult.rows[0].email,
        fullName: userResult.rows[0].full_name,
        isActive: userResult.rows[0].is_active,
        createdAt: userResult.rows[0].created_at,
        updatedAt: userResult.rows[0].updated_at,
        roles: [],
        permissions: []
      }
      
      // Get user roles
      const rolesQuery = `
        SELECT r.id, r.name, r.description
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = $1
      `
      const rolesResult = await this.db.query(rolesQuery, [id])
      user.roles = rolesResult.rows
      
      // Get permissions from roles
      const rolePermissionsQuery = `
        SELECT DISTINCT p.id, p.name, p.resource, p.action
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = $1
      `
      const rolePermissionsResult = await this.db.query(rolePermissionsQuery, [id])
      
      // Get direct user permissions
      let userPermissionsResult = { rows: [] }
      try {
        const userPermissionsQuery = `
          SELECT DISTINCT p.id, p.name, p.resource, p.action
          FROM user_permissions up
          JOIN permissions p ON up.permission_id = p.id
          WHERE up.user_id = $1
        `
        userPermissionsResult = await this.db.query(userPermissionsQuery, [id])
      } catch (error) {
        // If user_permissions table doesn't exist, log warning and continue with empty permissions
        if (error.message.includes('relation "user_permissions" does not exist') || 
            error.message.includes('missing FROM-clause entry for table "up"')) {
          this.logger.warn('user_permissions table not found, skipping direct user permissions', { id, error: error.message })
        } else {
          throw error
        }
      }
      
      // Combine permissions (remove duplicates)
      const permissionMap = new Map()
      
      rolePermissionsResult.rows.forEach(permission => {
        permissionMap.set(permission.id, permission)
      })
      
      userPermissionsResult.rows.forEach(permission => {
        permissionMap.set(permission.id, permission)
      })
      
      user.permissions = Array.from(permissionMap.values())
      
      return user
      
    } catch (error) {
      this.logger.error('Failed to find user with roles and permissions', { id, error: error.message })
      throw error
    }
  }

  /**
   * Add role to user
   * @param {number} userId - User ID
   * @param {number} roleId - Role ID
   * @returns {Promise<void>}
   */
  async addUserRole(userId, roleId) {
    try {
      // Check if user-role relationship already exists
      const checkQuery = `
        SELECT id FROM user_roles 
        WHERE user_id = $1 AND role_id = $2
      `
      const checkResult = await this.db.query(checkQuery, [userId, roleId])
      
      if (checkResult.rows.length > 0) {
        this.logger.warn('User role relationship already exists', { userId, roleId })
        return
      }

      // Add user-role relationship
      const insertQuery = `
        INSERT INTO user_roles (user_id, role_id)
        VALUES ($1, $2)
      `
      await this.db.query(insertQuery, [userId, roleId])
      
      this.logger.info('User role added', { userId, roleId })
      
    } catch (error) {
      this.logger.error('Failed to add user role', { userId, roleId, error: error.message })
      throw error
    }
  }

  /**
   * Remove role from user
   * @param {number} userId - User ID
   * @param {number} roleId - Role ID
   * @returns {Promise<void>}
   */
  async removeUserRole(userId, roleId) {
    try {
      const query = `
        DELETE FROM user_roles 
        WHERE user_id = $1 AND role_id = $2
      `
      const result = await this.db.query(query, [userId, roleId])
      
      if (result.rowCount === 0) {
        this.logger.warn('User role relationship not found', { userId, roleId })
        return
      }
      
      this.logger.info('User role removed', { userId, roleId })
      
    } catch (error) {
      this.logger.error('Failed to remove user role', { userId, roleId, error: error.message })
      throw error
    }
  }

  /**
   * Update all user roles (replace existing roles)
   * @param {number} userId - User ID
   * @param {Array<number>} roleIds - Array of role IDs
   * @returns {Promise<void>}
   */
  async updateUserRoles(userId, roleIds) {
    try {
      // Start transaction
      await this.db.query('BEGIN')
      
      // Remove all existing roles for this user
      await this.db.query('DELETE FROM user_roles WHERE user_id = $1', [userId])
      
      // Add new roles
      if (roleIds && roleIds.length > 0) {
        const values = roleIds.map((roleId, index) => `($1, $${index + 2})`).join(', ')
        const params = [userId, ...roleIds]
        
        const insertQuery = `
          INSERT INTO user_roles (user_id, role_id)
          VALUES ${values}
        `
        await this.db.query(insertQuery, params)
      }
      
      // Commit transaction
      await this.db.query('COMMIT')
      
      this.logger.info('User roles updated', { userId, roleIds })
      
    } catch (error) {
      // Rollback transaction on error
      await this.db.query('ROLLBACK')
      this.logger.error('Failed to update user roles', { userId, roleIds, error: error.message })
      throw error
    }
  }

  /**
   * Update user permissions (replace existing permissions)
   * @param {number} userId - User ID
   * @param {Array<string>} permissions - Array of permission names
   * @returns {Promise<void>}
   */
  async updatePermissions(userId, permissions) {
    try {
      // Check if user_permissions table exists first
      const tableExistsQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user_permissions'
        )
      `
      const tableExistsResult = await this.db.query(tableExistsQuery)
      
      if (!tableExistsResult.rows[0].exists) {
        this.logger.warn('user_permissions table does not exist, skipping permission update', { userId })
        return
      }
      
      // Start transaction
      await this.db.query('BEGIN')
      
      // Remove all existing permissions for this user
      await this.db.query('DELETE FROM user_permissions WHERE user_id = $1', [userId])
      
      // Add new permissions
      if (permissions && permissions.length > 0) {
        // Get permission IDs for the given permission names
        const permissionNames = permissions.map(p => `'${p}'`).join(', ')
        const permissionQuery = `
          SELECT id FROM permissions 
          WHERE name IN (${permissionNames})
        `
        const permissionResult = await this.db.query(permissionQuery)
        
        if (permissionResult.rows.length > 0) {
          const permissionIds = permissionResult.rows.map(row => row.id)
          const values = permissionIds.map((permissionId, index) => `($1, $${index + 2})`).join(', ')
          const params = [userId, ...permissionIds]
          
          const insertQuery = `
            INSERT INTO user_permissions (user_id, permission_id)
            VALUES ${values}
          `
          await this.db.query(insertQuery, params)
        }
      }
      
      // Commit transaction
      await this.db.query('COMMIT')
      
      this.logger.info('User permissions updated', { userId, permissions })
      
    } catch (error) {
      // Rollback transaction on error
      await this.db.query('ROLLBACK')
      this.logger.error('Failed to update user permissions', { userId, permissions, error: error.message })
      throw error
    }
  }
}

module.exports = UserRepository
