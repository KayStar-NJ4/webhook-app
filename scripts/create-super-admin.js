#!/usr/bin/env node

/**
 * Create Super Admin User
 * Creates a super admin user for the system
 */

const { Pool } = require('pg')
const bcrypt = require('bcrypt')

// Load environment variables
require('dotenv').config()
const readline = require('readline')

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'chatwoot_webhook',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
}

class SuperAdminCreator {
  constructor() {
    this.db = new Pool(dbConfig)
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
  }

  async run() {
    try {
      console.log('Creating Super Admin User...')
      console.log('================================')
      
      // Connect to database
      await this.db.connect()
      console.log('✓ Connected to database')

      // Get user input
      const userData = await this.getUserInput()
      
      // Check if user already exists
      const existingUser = await this.checkExistingUser(userData.username, userData.email)
      if (existingUser) {
        console.log('User already exists. Updating to super admin...')
        await this.updateUserToSuperAdmin(existingUser.id)
      } else {
        // Create new user
        const userId = await this.createUser(userData)
        await this.assignSuperAdminRole(userId)
      }

      console.log('✓ Super admin user created/updated successfully!')
      console.log(`Username: ${userData.username}`)
      console.log(`Email: ${userData.email}`)

    } catch (error) {
      console.error('✗ Failed to create super admin:', error.message)
      process.exit(1)
    } finally {
      await this.db.end()
      this.rl.close()
    }
  }

  async getUserInput() {
    return new Promise((resolve) => {
      const userData = {}
      
      this.rl.question('Username: ', (username) => {
        userData.username = username
        this.rl.question('Email: ', (email) => {
          userData.email = email
          this.rl.question('Full Name: ', (fullName) => {
            userData.fullName = fullName
            this.rl.question('Password: ', { silent: true }, (password) => {
              userData.password = password
              resolve(userData)
            })
          })
        })
      })
    })
  }

  async checkExistingUser(username, email) {
    const query = 'SELECT id FROM users WHERE username = $1 OR email = $2'
    const result = await this.db.query(query, [username, email])
    return result.rows[0] || null
  }

  async createUser(userData) {
    const { username, email, fullName, password } = userData
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)
    
    const query = `
      INSERT INTO users (username, email, password_hash, full_name, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id
    `
    
    const result = await this.db.query(query, [username, email, passwordHash, fullName])
    return result.rows[0].id
  }

  async updateUserToSuperAdmin(userId) {
    // Remove all existing roles
    await this.db.query('DELETE FROM user_roles WHERE user_id = $1', [userId])
    
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
  const creator = new SuperAdminCreator()
  creator.run()
}

module.exports = SuperAdminCreator
