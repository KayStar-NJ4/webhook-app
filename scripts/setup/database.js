#!/usr/bin/env node

/**
 * Database Setup Script
 * Sets up the database schema and initial data for development
 */

require('dotenv').config()
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

class DatabaseSetup {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'turbo_chatwoot_webhook',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    })
  }

  /**
   * Main setup function
   */
  async setup() {
    console.log('🗄️  Database Setup for Turbo Chatwoot Webhook')
    console.log('')

    try {
      // Test connection
      await this.testConnection()

      // Run migrations
      await this.runMigrations()

      // Migrate environment variables to database
      await this.migrateEnvToDb()

      // Insert sample data
      await this.insertSampleData()

      // Verify setup
      await this.verifySetup()

      console.log('')
      console.log('✅ Database setup completed successfully!')

    } catch (error) {
      console.error('❌ Database setup failed:', error.message)
      throw error
    } finally {
      await this.pool.end()
    }
  }

  /**
   * Test database connection
   */
  async testConnection() {
    console.log('🔌 Testing database connection...')
    
    try {
      const result = await this.pool.query('SELECT NOW() as current_time')
      console.log(`✅ Connected to database at ${result.rows[0].current_time}`)
    } catch (error) {
      console.error('❌ Database connection failed:', error.message)
      throw error
    }
  }

  /**
   * Run all migrations
   */
  async runMigrations() {
    console.log('🔄 Running database migrations...')
    
    // Ensure migrations table exists
    await this.ensureMigrationsTable()
    
    const migrationsDir = path.join(__dirname, '..', 'migrations')
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()

    // Get executed migrations
    const executedMigrations = await this.getExecutedMigrations()
    
    // Find pending migrations
    const pendingMigrations = migrationFiles.filter(
      file => !executedMigrations.includes(file.replace('.sql', ''))
    )

    if (pendingMigrations.length === 0) {
      console.log('✅ All migrations are up to date!')
      return
    }

    console.log(`📋 Found ${pendingMigrations.length} pending migrations:`)
    pendingMigrations.forEach(file => {
      console.log(`  - ${file}`)
    })
    console.log('')

    for (const file of pendingMigrations) {
      console.log(`  📄 Executing: ${file}`)
      
      const migrationPath = path.join(migrationsDir, file)
      const sqlContent = fs.readFileSync(migrationPath, 'utf8')
      
      await this.pool.query(sqlContent)
    }

    console.log(`✅ ${pendingMigrations.length} migrations completed`)
  }

  /**
   * Ensure migrations table exists
   */
  async ensureMigrationsTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    await this.pool.query(createTableSQL)
  }

  /**
   * Get executed migrations
   */
  async getExecutedMigrations() {
    try {
      const result = await this.pool.query('SELECT version FROM migrations ORDER BY version')
      return result.rows.map(row => row.version)
    } catch (error) {
      return []
    }
  }

  /**
   * Migrate environment variables to database if needed
   */
  async migrateEnvToDb() {
    console.log('🔄 Checking for environment variables migration...')
    
    // Check if env variables are already migrated
    const envConfigs = await this.pool.query(`
      SELECT COUNT(*) as count 
      FROM configurations 
      WHERE key LIKE 'server.%' OR key LIKE 'security.%' OR key LIKE 'rateLimit.%' OR key LIKE 'logging.%'
    `)
    
    if (envConfigs.rows[0].count > 0) {
      console.log('✅ Environment variables already migrated to database')
      return
    }

    console.log('📄 Migrating environment variables to database...')
    
    const envMappings = [
      // Server
      { env: 'PORT', dbKey: 'server.port', type: 'number' },
      { env: 'NODE_ENV', dbKey: 'server.nodeEnv', type: 'string' },
      
      // Security
      { env: 'ADMIN_API_KEY', dbKey: 'security.adminApiKey', type: 'string' },
      { env: 'ALLOWED_ORIGINS', dbKey: 'security.corsOrigins', type: 'string' },
      
      // Rate Limiting
      { env: 'RATE_LIMIT_WINDOW_MS', dbKey: 'rateLimit.windowMs', type: 'number' },
      { env: 'RATE_LIMIT_MAX', dbKey: 'rateLimit.max', type: 'number' },
      
      // Logging
      { env: 'LOG_LEVEL', dbKey: 'logging.level', type: 'string' },
      { env: 'LOG_FORMAT', dbKey: 'logging.format', type: 'string' }
    ]

    let migrated = 0
    let skipped = 0

    for (const mapping of envMappings) {
      const envValue = process.env[mapping.env]
      
      if (envValue && envValue !== '') {
        // Convert value based on type
        let value = envValue
        if (mapping.type === 'number') {
          value = Number(envValue)
        } else if (mapping.type === 'boolean') {
          value = envValue.toLowerCase() === 'true'
        }

        // Update database
        await this.pool.query(`
          UPDATE configurations 
          SET value = $1, type = $2, updated_at = NOW()
          WHERE key = $3
        `, [String(value), mapping.type, mapping.dbKey])

        console.log(`  ✅ ${mapping.env} → ${mapping.dbKey}`)
        migrated++
      } else {
        console.log(`  ⏭️  ${mapping.env} (empty, skipped)`)
        skipped++
      }
    }

    console.log(`✅ Migrated ${migrated} values, skipped ${skipped} empty values`)
    console.log('ℹ️  Database connection configs remain in .env file for initial connection')
  }

  /**
   * Insert sample data for development
   */
  async insertSampleData() {
    console.log('📝 Inserting sample data...')
    
    // Check and create missing permissions
    console.log('  🔄 Checking and creating missing permissions...')

    // Define all permissions
    const PERMISSIONS = [
      // User Management
      { name: 'users.create', description: 'Tạo người dùng mới', resource: 'users', action: 'create' },
      { name: 'users.read', description: 'Xem danh sách người dùng', resource: 'users', action: 'read' },
      { name: 'users.update', description: 'Cập nhật thông tin người dùng', resource: 'users', action: 'update' },
      { name: 'users.delete', description: 'Xóa người dùng', resource: 'users', action: 'delete' },
      { name: 'users.manage_roles', description: 'Quản lý vai trò người dùng', resource: 'users', action: 'manage_roles' },
      { name: 'users.change_password', description: 'Đổi mật khẩu người dùng', resource: 'users', action: 'change_password' },

      // Role Management
      { name: 'roles.create', description: 'Tạo vai trò mới', resource: 'roles', action: 'create' },
      { name: 'roles.read', description: 'Xem danh sách vai trò', resource: 'roles', action: 'read' },
      { name: 'roles.update', description: 'Cập nhật vai trò', resource: 'roles', action: 'update' },
      { name: 'roles.delete', description: 'Xóa vai trò', resource: 'roles', action: 'delete' },
      { name: 'roles.manage_permissions', description: 'Quản lý quyền của vai trò', resource: 'roles', action: 'manage_permissions' },

      // Permission Management
      { name: 'permissions.read', description: 'Xem danh sách quyền', resource: 'permissions', action: 'read' },
      { name: 'permissions.manage', description: 'Quản lý quyền hệ thống', resource: 'permissions', action: 'manage' },

      // Telegram Bot Management
      { name: 'telegram.create', description: 'Tạo bot Telegram mới', resource: 'telegram', action: 'create' },
      { name: 'telegram.read', description: 'Xem danh sách bot Telegram', resource: 'telegram', action: 'read' },
      { name: 'telegram.update', description: 'Cập nhật bot Telegram', resource: 'telegram', action: 'update' },
      { name: 'telegram.delete', description: 'Xóa bot Telegram', resource: 'telegram', action: 'delete' },
      { name: 'telegram.test', description: 'Test kết nối bot Telegram', resource: 'telegram', action: 'test' },
      { name: 'telegram.manage_webhooks', description: 'Quản lý webhook Telegram', resource: 'telegram', action: 'manage_webhooks' },

      // Chatwoot Account Management
      { name: 'chatwoot.create', description: 'Tạo tài khoản Chatwoot mới', resource: 'chatwoot', action: 'create' },
      { name: 'chatwoot.read', description: 'Xem danh sách tài khoản Chatwoot', resource: 'chatwoot', action: 'read' },
      { name: 'chatwoot.update', description: 'Cập nhật tài khoản Chatwoot', resource: 'chatwoot', action: 'update' },
      { name: 'chatwoot.delete', description: 'Xóa tài khoản Chatwoot', resource: 'chatwoot', action: 'delete' },
      { name: 'chatwoot.test', description: 'Test kết nối Chatwoot', resource: 'chatwoot', action: 'test' },

      // Dify App Management
      { name: 'dify.create', description: 'Tạo ứng dụng Dify mới', resource: 'dify', action: 'create' },
      { name: 'dify.read', description: 'Xem danh sách ứng dụng Dify', resource: 'dify', action: 'read' },
      { name: 'dify.update', description: 'Cập nhật ứng dụng Dify', resource: 'dify', action: 'update' },
      { name: 'dify.delete', description: 'Xóa ứng dụng Dify', resource: 'dify', action: 'delete' },
      { name: 'dify.test', description: 'Test kết nối Dify', resource: 'dify', action: 'test' },

      // Configuration Management
      { name: 'config.read', description: 'Xem cấu hình hệ thống', resource: 'config', action: 'read' },
      { name: 'config.update', description: 'Cập nhật cấu hình hệ thống', resource: 'config', action: 'update' },

      // Mapping Management
      { name: 'mappings.create', description: 'Tạo mapping bot-account', resource: 'mappings', action: 'create' },
      { name: 'mappings.read', description: 'Xem danh sách mapping', resource: 'mappings', action: 'read' },
      { name: 'mappings.update', description: 'Cập nhật mapping', resource: 'mappings', action: 'update' },
      { name: 'mappings.delete', description: 'Xóa mapping', resource: 'mappings', action: 'delete' },

      // System Management
      { name: 'system.dashboard', description: 'Truy cập dashboard hệ thống', resource: 'system', action: 'dashboard' },
      { name: 'system.logs', description: 'Xem logs hệ thống', resource: 'system', action: 'logs' },
      { name: 'system.metrics', description: 'Xem metrics hệ thống', resource: 'system', action: 'metrics' },
      { name: 'system.settings', description: 'Quản lý cài đặt hệ thống', resource: 'system', action: 'settings' },

      // Webhook Management
      { name: 'webhook.read', description: 'Xem webhook logs', resource: 'webhook', action: 'read' },
      { name: 'webhook.manage', description: 'Quản lý webhook', resource: 'webhook', action: 'manage' },

      // Conversation Management
      { name: 'conversations.read', description: 'Xem danh sách cuộc trò chuyện', resource: 'conversations', action: 'read' },
      { name: 'conversations.manage', description: 'Quản lý cuộc trò chuyện', resource: 'conversations', action: 'manage' },

      // Message Management
      { name: 'messages.read', description: 'Xem tin nhắn', resource: 'messages', action: 'read' },
      { name: 'messages.send', description: 'Gửi tin nhắn', resource: 'messages', action: 'send' },
      { name: 'messages.manage', description: 'Quản lý tin nhắn', resource: 'messages', action: 'manage' }
    ]

    // 1. Create super_admin role if not exists
    console.log('  👑 Creating super_admin role...')
    const existingRole = await this.pool.query('SELECT id FROM roles WHERE name = $1', ['super_admin'])
    if (existingRole.rows.length === 0) {
      await this.pool.query(`
        INSERT INTO roles (id, name, description, created_at, updated_at)
        VALUES (1, 'super_admin', 'Super Administrator with full system access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `)
      console.log('    ✅ Super admin role created')
    } else {
      console.log('    ⚠️  Super admin role already exists')
    }

    // 2. Create missing permissions
    console.log('  🔐 Creating missing permissions...')
    let createdCount = 0
    let skippedCount = 0
    
    for (const permission of PERMISSIONS) {
      const existing = await this.pool.query('SELECT id FROM permissions WHERE name = $1', [permission.name])
      if (existing.rows.length === 0) {
        await this.pool.query(`
          INSERT INTO permissions (name, description, resource, action, created_at)
          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        `, [permission.name, permission.description, permission.resource, permission.action])
        createdCount++
      } else {
        skippedCount++
      }
    }
    
    console.log(`    ✅ Created ${createdCount} new permissions, skipped ${skippedCount} existing`)

    // 3. Assign missing permissions to super_admin role
    console.log('  🔗 Assigning missing permissions to super_admin...')
    const permissionsResult = await this.pool.query('SELECT id FROM permissions')
    let assignedCount = 0
    let skippedAssignCount = 0
    
    for (const permission of permissionsResult.rows) {
      const existing = await this.pool.query(
        'SELECT id FROM role_permissions WHERE role_id = 1 AND permission_id = $1', 
        [permission.id]
      )
      if (existing.rows.length === 0) {
        await this.pool.query(`
          INSERT INTO role_permissions (role_id, permission_id, created_at)
          VALUES (1, $1, CURRENT_TIMESTAMP)
        `, [permission.id])
        assignedCount++
      } else {
        skippedAssignCount++
      }
    }
    
    console.log(`    ✅ Assigned ${assignedCount} new permissions, skipped ${skippedAssignCount} existing`)

    // 4. Create superadmin user if not exists
    console.log('  👤 Creating superadmin user...')
    const existingUser = await this.pool.query('SELECT id FROM users WHERE username = $1', ['superadmin'])
    if (existingUser.rows.length === 0) {
      const bcrypt = require('bcrypt')
      const passwordHash = await bcrypt.hash('ThuanThuan@@1', 10)
      await this.pool.query(`
        INSERT INTO users (username, email, password_hash, full_name, is_active, created_at, updated_at)
        VALUES ('superadmin', 'thuanpt182@gmail.com', $1, 'Super Administrator', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [passwordHash])
      console.log('    ✅ Super admin user created')
    } else {
      console.log('    ⚠️  Super admin user already exists')
    }

    // 5. Assign super_admin role to superadmin user if not exists
    console.log('  🔗 Assigning super_admin role to superadmin user...')
    const userResult = await this.pool.query('SELECT id FROM users WHERE username = $1', ['superadmin'])
    const userId = userResult.rows[0].id
    
    const existingUserRole = await this.pool.query(
      'SELECT id FROM user_roles WHERE user_id = $1 AND role_id = 1', 
      [userId]
    )
    if (existingUserRole.rows.length === 0) {
      await this.pool.query(`
        INSERT INTO user_roles (user_id, role_id, created_at)
        VALUES ($1, 1, CURRENT_TIMESTAMP)
      `, [userId])
      console.log('    ✅ Super admin role assigned to user')
    } else {
      console.log('    ⚠️  Super admin role already assigned to user')
    }

    console.log('✅ Sample data and permissions inserted')
    console.log('🔑 Super admin credentials:')
    console.log('   Username: superadmin')
    console.log('   Password: ThuanThuan@@1')
    console.log('   Email: thuanpt182@gmail.com')
  }

  /**
   * Verify setup
   */
  async verifySetup() {
    console.log('🔍 Verifying database setup...')
    
    // Check tables
    const tablesResult = await this.pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)

    console.log('📋 Database tables:')
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`)
    })

    // Check configurations
    const configResult = await this.pool.query('SELECT COUNT(*) as count FROM configurations')
    console.log(`⚙️  Configuration entries: ${configResult.rows[0].count}`)

    // Check conversations
    const convResult = await this.pool.query('SELECT COUNT(*) as count FROM conversations')
    console.log(`💬 Sample conversations: ${convResult.rows[0].count}`)
  }

  /**
   * Show configuration values
   */
  async showConfigurations() {
    console.log('')
    console.log('⚙️  Current configurations:')
    
    try {
      const configs = await this.pool.query(`
        SELECT key, value, type, group_name, description 
        FROM configurations 
        ORDER BY group_name, key
      `)

      let currentGroup = null
      configs.rows.forEach(config => {
        if (config.group_name !== currentGroup) {
          currentGroup = config.group_name
          console.log(`\n📁 ${currentGroup.toUpperCase()} Configuration:`)
        }
        
        const displayValue = config.key.includes('Token') || config.key.includes('Key') || config.key.includes('Password')
          ? (config.value ? '***SET***' : 'NOT SET')
          : config.value
        console.log(`  ${config.key}: ${displayValue} (${config.type})`)
        if (config.description) {
          console.log(`    └─ ${config.description}`)
        }
      })
    } catch (error) {
      console.log('  ⚠️  Could not load configurations:', error.message)
    }
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2] || 'setup'
  const setup = new DatabaseSetup()

  switch (command) {
    case 'setup':
      setup.setup()
        .then(() => {
          // Create new setup instance for showing configs
          const configSetup = new DatabaseSetup()
          return configSetup.showConfigurations()
        })
        .then(() => {
          console.log('')
          console.log('🚀 Next steps:')
          console.log('1. Update your .env file with correct database credentials')
          console.log('2. Start the application: yarn start')
          console.log('3. Test the webhook endpoints')
          process.exit(0)
        })
        .catch(error => {
          console.error('Setup failed:', error.message)
          process.exit(1)
        })
      break

    case 'config':
      setup.testConnection()
        .then(() => setup.showConfigurations())
        .then(() => process.exit(0))
        .catch(error => {
          console.error('Failed to show configurations:', error.message)
          process.exit(1)
        })
      break

    default:
      console.log('Usage: node scripts/setup/database.js [setup|config]')
      console.log('')
      console.log('Commands:')
      console.log('  setup  - Run full database setup (default)')
      console.log('  config - Show current configurations')
      process.exit(1)
  }
}

module.exports = DatabaseSetup
