#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

class MigrationManager {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'turbo_chatwoot_webhook',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password'
    });
    
    this.migrationsDir = path.join(__dirname, 'migrations');
  }

  async connect() {
    try {
      this.client = await this.pool.connect();
      console.log('✅ Connected to database');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.release();
    }
    await this.pool.end();
  }

  async createMigrationsTable() {
    // Check if table exists and has correct structure
    try {
      const checkQuery = 'SELECT filename FROM migrations LIMIT 1';
      await this.client.query(checkQuery);
      console.log('✅ Migrations table ready');
      return;
    } catch (error) {
      // Table doesn't exist or has wrong structure, recreate it
      console.log('⚠️  Recreating migrations table...');
    }
    
    // Drop existing table if it has wrong structure
    try {
      await this.client.query('DROP TABLE IF EXISTS migrations CASCADE');
      console.log('🗑️  Dropped existing migrations table');
    } catch (error) {
      // Ignore if table doesn't exist
    }
    
    const query = `
      CREATE TABLE migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await this.client.query(query);
    console.log('✅ Migrations table created');
  }

  async getExecutedMigrations() {
    try {
      const query = 'SELECT filename FROM migrations ORDER BY id';
      const result = await this.client.query(query);
      return result.rows.map(row => row.filename);
    } catch (error) {
      // If table doesn't exist or has wrong structure, return empty array
      console.log('⚠️  Migrations table not found or has wrong structure, will recreate');
      return [];
    }
  }

  async getPendingMigrations() {
    const executedMigrations = await this.getExecutedMigrations();
    const allMigrations = fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    return allMigrations.filter(migration => !executedMigrations.includes(migration));
  }

  async executeMigration(filename) {
    const filePath = path.join(this.migrationsDir, filename);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    try {
      // Execute migration SQL
      await this.client.query(sql);
      
      // Record migration
      await this.client.query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
      
      console.log(`✅ Executed migration: ${filename}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to execute migration ${filename}:`, error.message);
      return false;
    }
  }

  async runMigrations() {
    console.log('🚀 Starting migration process...');
    
    await this.connect();
    await this.createMigrationsTable();
    
    const pendingMigrations = await this.getPendingMigrations();
    
    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }
    
    console.log(`📋 Found ${pendingMigrations.length} pending migrations:`);
    pendingMigrations.forEach(migration => console.log(`  - ${migration}`));
    
    for (const migration of pendingMigrations) {
      const success = await this.executeMigration(migration);
      if (!success) {
        console.error('❌ Migration failed, stopping process');
        break;
      }
    }
    
    await this.disconnect();
    console.log('🎉 Migration process completed');
  }

  async showStatus() {
    await this.connect();
    await this.createMigrationsTable();
    
    const executedMigrations = await this.getExecutedMigrations();
    const pendingMigrations = await this.getPendingMigrations();
    
    console.log('\n📊 Migration Status:');
    console.log(`✅ Executed: ${executedMigrations.length}`);
    console.log(`⏳ Pending: ${pendingMigrations.length}`);
    
    if (executedMigrations.length > 0) {
      console.log('\n📋 Executed migrations:');
      executedMigrations.forEach(migration => console.log(`  ✅ ${migration}`));
    }
    
    if (pendingMigrations.length > 0) {
      console.log('\n⏳ Pending migrations:');
      pendingMigrations.forEach(migration => console.log(`  ⏳ ${migration}`));
    }
    
    await this.disconnect();
  }
}

// CLI handling
async function main() {
  const command = process.argv[2];
  const migrationManager = new MigrationManager();
  
  try {
    switch (command) {
      case 'status':
        await migrationManager.showStatus();
        break;
      case 'run':
      case undefined:
        await migrationManager.runMigrations();
        break;
      default:
        console.log('Usage: node migrate.js [run|status]');
        console.log('  run    - Execute pending migrations (default)');
        console.log('  status - Show migration status');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = MigrationManager;
