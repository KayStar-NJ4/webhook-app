#!/usr/bin/env node

/**
 * Create Default Super Admin User
 * Creates a super admin user with default credentials
 */

const { Pool } = require('pg')
const bcrypt = require('bcrypt')

// Load environment variables
require('dotenv').config()

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'chatwoot_webhook',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
}

class DefaultAdminCreator {
  constructor() {
    this.db = new Pool(dbConfig)
  }

  async run() {
    try {
      console.log('Creating Default Super Admin User...')
      console.log('=====================================')
      
      // Connect to database
      await this.db.connect()
      console.log('✓ Connected to database')

      // Default admin credentials
      const adminData = {
        username: 'admin',
        email: 'admin@system.local',
        password: 'admin123',
        fullName: 'System Administrator'
      }

      // Check if user already exists
      const existingUser = await this.checkExistingUser(adminData.username, adminData.email)
      if (existingUser) {
        console.log('✓ User already exists. Updating to super admin...')
        await this.updateUserToSuperAdmin(existingUser.id)
      } else {
        // Create new user
        const userId = await this.createUser(adminData)
        await this.assignSuperAdminRole(userId)
      }

      console.log('✓ Super admin user created/updated successfully!')
      console.log('=====================================')
      console.log('Default Login Credentials:')
      console.log(`Username: ${adminData.username}`)
      console.log(`Password: ${adminData.password}`)
      console.log(`Email: ${adminData.email}`)
      console.log('=====================================')

    } catch (error) {
      console.error('✗ Failed to create super admin:', error.message)
      process.exit(1)
    } finally {
      await this.db.end()
    }
  }

  async checkExistingUser(username, email) {
    const query = 'SELECT id FROM users WHERE username = $1 OR email = $2'
    const result = await this.db.query(query, [username, email])
    return result.rows[0] || null
  }

  async createUser(userData) {
    // Hash password
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(userData.password, saltRounds)

    // Create user
    const query = `
      INSERT INTO users (username, email, password_hash, full_name, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, true, NOW(), NOW())
      RETURNING id
    `
    
    const result = await this.db.query(query, [
      userData.username,
      userData.email,
      passwordHash,
      userData.fullName
    ])

    return result.rows[0].id
  }

  async updateUserToSuperAdmin(userId) {
    // Update user to active
    await this.db.query(
      'UPDATE users SET is_active = true, updated_at = NOW() WHERE id = $1',
      [userId]
    )
    
    // Assign super admin role
    await this.assignSuperAdminRole(userId)
  }

  async assignSuperAdminRole(userId) {
    // Get super admin role ID
    const roleQuery = 'SELECT id FROM roles WHERE name = $1'
    const roleResult = await this.db.query(roleQuery, ['super_admin'])
    
    if (roleResult.rows.length === 0) {
      throw new Error('Super admin role not found. Please run migrations first.')
    }
    
    const roleId = roleResult.rows[0].id
    
    // Assign role to user
    const assignQuery = `
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, role_id) DO NOTHING
    `
    
    await this.db.query(assignQuery, [userId, roleId])
  }
}

// Run if this file is executed directly
if (require.main === module) {
  const creator = new DefaultAdminCreator()
  creator.run()
}

module.exports = DefaultAdminCreator
