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
      WHERE key LIKE 'server.%' OR key LIKE 'telegram.%' OR key LIKE 'chatwoot.%' OR key LIKE 'dify.%'
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
      
      // Telegram
      { env: 'TELEGRAM_BOT_TOKEN', dbKey: 'telegram.botToken', type: 'string' },
      { env: 'TELEGRAM_WEBHOOK_URL', dbKey: 'telegram.webhookUrl', type: 'string' },
      
      // Chatwoot
      { env: 'CHATWOOT_BASE_URL', dbKey: 'chatwoot.baseUrl', type: 'string' },
      { env: 'CHATWOOT_ACCESS_TOKEN', dbKey: 'chatwoot.accessToken', type: 'string' },
      { env: 'CHATWOOT_ACCOUNT_ID', dbKey: 'chatwoot.accountId', type: 'string' },
      { env: 'CHATWOOT_INBOX_ID', dbKey: 'chatwoot.inboxId', type: 'string' },
      
      // Dify
      { env: 'DIFY_API_URL', dbKey: 'dify.apiUrl', type: 'string' },
      { env: 'DIFY_API_KEY', dbKey: 'dify.apiKey', type: 'string' },
      { env: 'DIFY_APP_ID', dbKey: 'dify.appId', type: 'string' },
      
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
    
    // Sample conversation
    await this.pool.query(`
      INSERT INTO conversations (id, platform, chat_type, chat_title, participants, metadata) 
      VALUES ('telegram_123456789', 'telegram', 'private', 'Test User', 
              '[{"id": "123456789", "name": "Test User", "role": "user"}]', 
              '{"isGroupChat": false}')
      ON CONFLICT (id) DO NOTHING
    `)

    console.log('✅ Sample data inserted')
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
