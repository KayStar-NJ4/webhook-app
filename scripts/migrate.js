#!/usr/bin/env node

/**
 * Database Migration Runner
 * Manages database schema migrations
 */

require('dotenv').config()
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

class MigrationRunner {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'turbo_chatwoot_webhook',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    })
    
    this.migrationsDir = path.join(__dirname, 'migrations')
  }

  /**
   * Run all pending migrations
   */
  async migrate() {
    console.log('🔄 Database Migration Runner')
    console.log('')

    try {
      // Ensure migrations table exists
      await this.ensureMigrationsTable()

      // Get migration files
      const migrationFiles = this.getMigrationFiles()
      console.log(`📁 Found ${migrationFiles.length} migration files`)

      // Get executed migrations
      const executedMigrations = await this.getExecutedMigrations()
      console.log(`✅ ${executedMigrations.length} migrations already executed`)

      // Find pending migrations
      const pendingMigrations = migrationFiles.filter(
        file => !executedMigrations.includes(file.version)
      )

      if (pendingMigrations.length === 0) {
        console.log('🎉 All migrations are up to date!')
        return
      }

      console.log(`🚀 Running ${pendingMigrations.length} pending migrations:`)
      pendingMigrations.forEach(migration => {
        console.log(`  - ${migration.version}: ${migration.description}`)
      })
      console.log('')

      // Execute pending migrations
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration)
      }

      console.log('')
      console.log('🎉 All migrations completed successfully!')

    } catch (error) {
      console.error('❌ Migration failed:', error.message)
      throw error
    } finally {
      await this.pool.end()
    }
  }

  /**
   * Show migration status
   */
  async status() {
    console.log('📊 Migration Status')
    console.log('')

    try {
      await this.ensureMigrationsTable()
      
      const migrationFiles = this.getMigrationFiles()
      const executedMigrations = await this.getExecutedMigrations()
      
      console.log(`📁 Total migration files: ${migrationFiles.length}`)
      console.log(`✅ Executed migrations: ${executedMigrations.length}`)
      console.log(`⏳ Pending migrations: ${migrationFiles.length - executedMigrations.length}`)
      console.log('')
      
      if (migrationFiles.length > 0) {
        console.log('📋 Migration Details:')
        migrationFiles.forEach(migration => {
          const status = executedMigrations.includes(migration.version) ? '✅' : '⏳'
          console.log(`  ${status} ${migration.version}: ${migration.description}`)
        })
      }

    } catch (error) {
      console.error('❌ Failed to get migration status:', error.message)
      throw error
    } finally {
      await this.pool.end()
    }
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
   * Get list of migration files
   */
  getMigrationFiles() {
    if (!fs.existsSync(this.migrationsDir)) {
      return []
    }

    return fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()
      .map(file => {
        const version = file.replace('.sql', '')
        const parts = version.split('_')
        const description = parts.slice(1).join('_').replace(/_/g, ' ')
        
        return {
          file,
          version,
          description,
          path: path.join(this.migrationsDir, file)
        }
      })
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
   * Execute a single migration
   */
  async executeMigration(migration) {
    console.log(`🔄 Executing: ${migration.version}`)
    
    try {
      const sqlContent = fs.readFileSync(migration.path, 'utf8')
      
      const client = await this.pool.connect()
      
      try {
        await client.query('BEGIN')
        await client.query(sqlContent)
        await client.query('COMMIT')
        
        console.log(`✅ Completed: ${migration.version}`)
        
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
      
    } catch (error) {
      console.error(`❌ Failed: ${migration.version}`, error.message)
      throw error
    }
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2] || 'migrate'
  const runner = new MigrationRunner()

  switch (command) {
    case 'migrate':
      runner.migrate()
        .then(() => process.exit(0))
        .catch(error => {
          console.error('Migration failed:', error.message)
          process.exit(1)
        })
      break

    case 'status':
      runner.status()
        .then(() => process.exit(0))
        .catch(error => {
          console.error('Status check failed:', error.message)
          process.exit(1)
        })
      break

    default:
      console.log('Usage: node scripts/migrate.js [migrate|status]')
      console.log('')
      console.log('Commands:')
      console.log('  migrate - Run all pending migrations (default)')
      console.log('  status  - Show migration status')
      process.exit(1)
  }
}

module.exports = MigrationRunner