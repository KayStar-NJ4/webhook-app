#!/usr/bin/env node

/**
 * Migration Runner
 * Runs database migrations in order
 */

const fs = require('fs').promises
const path = require('path')
const { Pool } = require('pg')

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

class MigrationRunner {
  constructor() {
    this.db = new Pool(dbConfig)
  }

  async run() {
    try {
      console.log('Starting migration process...')
      console.log('Connected to database')
    
      const migrationDir = path.join(__dirname, 'migrations')
      const files = await fs.readdir(migrationDir)
      const migrationFiles = files
        .filter(file => file.endsWith('.sql'))
        .sort()
    
      console.log(`Found ${migrationFiles.length} migration files`)
    
      await this.createMigrationsTable()
    
      for (const file of migrationFiles) {
        await this.runMigration(file)
      }
    
      console.log('All migrations completed successfully!')
      
    } catch (error) {
      console.error('Migration failed:', error)
    } finally {
      try {
        await this.db.end()
      } catch (closeError) {
        console.error('Error closing database connection:', closeError)
      }
      process.exit(0)
    }
  }

  async createMigrationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    await this.db.query(query)
  }

  async runMigration(filename) {
    const version = filename.replace('.sql', '')
    
    // Check if migration already ran
    const checkQuery = 'SELECT id FROM migrations WHERE version = $1'
    const result = await this.db.query(checkQuery, [version])
    
    if (result.rows.length > 0) {
      console.log(`✓ Migration ${version} already executed`)
      return
    }

    console.log(`Running migration: ${version}`)
    
    try {
      // Check if migration already exists
      const checkQuery = `SELECT version FROM migrations WHERE version = $1`
      const existing = await this.db.query(checkQuery, [version])
      
      if (existing.rows.length > 0) {
        console.log(`⚠ Migration ${version} already exists, skipping...`)
        return
      }
      
      // Read migration file
      const filePath = path.join(__dirname, 'migrations', filename)
      const sql = await fs.readFile(filePath, 'utf8')
      
      // Execute migration
      await this.db.query(sql)
      
      // Record migration
      const insertQuery = `
        INSERT INTO migrations (version, description) 
        VALUES ($1, $2)
        ON CONFLICT (version) DO NOTHING
      `
      await this.db.query(insertQuery, [version, `Migration ${version}`])
      
      console.log(`✓ Migration ${version} completed successfully`)
      
    } catch (error) {
      console.error(`✗ Migration ${version} failed:`, error.message)
      throw error
    }
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  const runner = new MigrationRunner()
  runner.run()
}

module.exports = MigrationRunner
