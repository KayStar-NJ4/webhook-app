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
      
      const query = `
        INSERT INTO users (username, email, password_hash, full_name, phone_number, avatar, gender, date_of_birth)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, username, email, full_name, phone_number, avatar, gender, date_of_birth, is_active, created_at
      `
      
      const result = await this.db.query(query, [username, email, passwordHash, fullName, phoneNumber, avatar, gender, dateOfBirth])
      
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
   * Get all users with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Users and pagination info
   */
  async findAll(options = {}) {
    try {
      const { page = 1, limit = 10, search = '' } = options
      const offset = (page - 1) * limit
      
      let whereClause = ''
      let params = []
      
      if (search) {
        whereClause = 'WHERE username ILIKE $1 OR email ILIKE $1 OR full_name ILIKE $1'
        params.push(`%${search}%`)
      }
      
      const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`
      const countResult = await this.db.query(countQuery, params)
      const total = parseInt(countResult.rows[0].total)
      
      const query = `
        SELECT id, username, email, full_name, phone_number, avatar, gender, date_of_birth, is_active, created_at, updated_at
        FROM users 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `
      
      const result = await this.db.query(query, [...params, limit, offset])
      
      return {
        users: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
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
      
      const result = await this.db.query(query, [username, email, fullName, phoneNumber, avatar, gender, dateOfBirth, isActive, id])
      
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
      const query = `
        SELECT 
          u.id, u.username, u.email, u.full_name, u.is_active, u.created_at, u.updated_at,
          r.id as role_id, r.name as role_name, r.description as role_description,
          p.id as permission_id, p.name as permission_name, p.resource, p.action
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = $1
      `
      
      const result = await this.db.query(query, [id])
      
      if (result.rows.length === 0) {
        return null
      }
      
      const user = {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        fullName: result.rows[0].full_name,
        isActive: result.rows[0].is_active,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
        roles: [],
        permissions: []
      }
      
      const roleMap = new Map()
      const permissionMap = new Map()
      
      result.rows.forEach(row => {
        if (row.role_id && !roleMap.has(row.role_id)) {
          roleMap.set(row.role_id, {
            id: row.role_id,
            name: row.role_name,
            description: row.role_description
          })
        }
        
        if (row.permission_id && !permissionMap.has(row.permission_id)) {
          permissionMap.set(row.permission_id, {
            id: row.permission_id,
            name: row.permission_name,
            resource: row.resource,
            action: row.action
          })
        }
      })
      
      user.roles = Array.from(roleMap.values())
      user.permissions = Array.from(permissionMap.values())
      
      return user
      
    } catch (error) {
      this.logger.error('Failed to find user with roles and permissions', { id, error: error.message })
      throw error
    }
  }
}

module.exports = UserRepository
