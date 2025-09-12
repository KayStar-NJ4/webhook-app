#!/usr/bin/env node

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcrypt')

class MultiBotMigration {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'chatwoot_webhook',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true'
    })
  }

  async run() {
    try {
      console.log('🚀 Starting multi-bot migration...')
      
      // Connect to database
      await this.pool.connect()
      console.log('✅ Connected to database')

      // Run schema migration
      await this.runSchemaMigration()
      
      // Run seed data
      await this.runSeedData()
      
      console.log('🎉 Multi-bot migration completed successfully!')
      
    } catch (error) {
      console.error('❌ Migration failed:', error.message)
      process.exit(1)
    } finally {
      await this.pool.end()
    }
  }

  async runSchemaMigration() {
    console.log('📋 Running schema migration...')
    
    const schemaPath = path.join(__dirname, 'migrations', '002_multi_bot_schema.sql')
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8')
    
    await this.pool.query(schemaSQL)
    console.log('✅ Schema migration completed')
  }

  async runSeedData() {
    console.log('🌱 Running seed data...')
    
    const seedPath = path.join(__dirname, 'migrations', '003_seed_data.sql')
    const seedSQL = fs.readFileSync(seedPath, 'utf8')
    
    await this.pool.query(seedSQL)
    console.log('✅ Seed data completed')
  }
}

// Run migration if called directly
if (require.main === module) {
  const migration = new MultiBotMigration()
  migration.run()
}

module.exports = MultiBotMigration
