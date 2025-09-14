#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

class SeedManager {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'turbo_chatwoot_webhook',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password'
    });
    
    this.seedsDir = path.join(__dirname, 'seed');
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

  async getExecutedSeeds() {
    try {
      // Create seeds tracking table if not exists
      await this.client.query(`
        CREATE TABLE IF NOT EXISTS seeds (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const result = await this.client.query('SELECT filename FROM seeds ORDER BY executed_at');
      return result.rows.map(row => row.filename);
    } catch (error) {
      console.error('❌ Failed to get executed seeds:', error.message);
      throw error;
    }
  }

  async executeSeed(filename) {
    try {
      const seedPath = path.join(this.seedsDir, filename);
      const seedSQL = fs.readFileSync(seedPath, 'utf8');
      
      console.log(`🌱 Executing seed: ${filename}`);
      await this.client.query(seedSQL);
      
      // Record the seed as executed
      await this.client.query(
        'INSERT INTO seeds (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING',
        [filename]
      );
      
      console.log(`✅ Seed executed: ${filename}`);
    } catch (error) {
      console.error(`❌ Failed to execute seed ${filename}:`, error.message);
      throw error;
    }
  }

  async runSeeds() {
    try {
      await this.connect();
      
      const seedFiles = fs.readdirSync(this.seedsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
      
      if (seedFiles.length === 0) {
        console.log('📋 No seed files found');
        return;
      }

      const executedSeeds = await this.getExecutedSeeds();
      const pendingSeeds = seedFiles.filter(file => !executedSeeds.includes(file));
      
      if (pendingSeeds.length === 0) {
        console.log('✅ All seeds already executed');
        return;
      }

      console.log(`📋 Found ${pendingSeeds.length} pending seeds:`);
      pendingSeeds.forEach(file => console.log(`  - ${file}`));
      console.log('');

      for (const seedFile of pendingSeeds) {
        await this.executeSeed(seedFile);
      }

      console.log('🎉 Seed process completed');
    } catch (error) {
      console.error('❌ Seed process failed:', error.message);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const seedManager = new SeedManager();
  seedManager.runSeeds();
}

module.exports = SeedManager;
