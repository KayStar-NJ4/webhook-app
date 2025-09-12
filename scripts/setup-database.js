#!/usr/bin/env node

/**
 * Database Setup Script
 * Helps setup Redis or PostgreSQL for the application
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

class DatabaseSetup {
  constructor() {
    this.repositoryType = 'postgresql'
  }

  /**
   * Main setup function
   */
  async setup() {
    console.log('🗄️  Database Setup for Turbo Chatwoot Webhook')
    console.log(`📊 Repository Type: ${this.repositoryType}`)
    console.log('')

    try {
      switch (this.repositoryType) {
        case 'redis':
          await this.setupRedis()
          break
        case 'postgresql':
          await this.setupPostgreSQL()
          break
        default:
          console.error(`❌ Unsupported repository type: ${this.repositoryType}`)
          console.log('Supported types: redis, postgresql')
          process.exit(1)
      }

      console.log('')
      console.log('✅ Database setup completed successfully!')
      console.log('')
      console.log('🚀 Next steps:')
      console.log('1. Update your .env file with database credentials')
      console.log('2. Run: yarn start')
      console.log('3. Test the API endpoints')

    } catch (error) {
      console.error('❌ Database setup failed:', error.message)
      process.exit(1)
    }
  }

  /**
   * Setup Redis
   */
  async setupRedis() {
    console.log('🔴 Setting up Redis...')

    try {
      // Check if Redis is installed
      execSync('redis-cli --version', { stdio: 'ignore' })
      console.log('✅ Redis is already installed')

      // Test connection
      execSync('redis-cli ping', { stdio: 'ignore' })
      console.log('✅ Redis is running and accessible')

      // Create sample .env configuration
      this.createRedisEnvConfig()

    } catch (error) {
      console.log('❌ Redis setup failed. Please install Redis:')
      console.log('')
      console.log('Ubuntu/Debian:')
      console.log('  sudo apt-get update')
      console.log('  sudo apt-get install redis-server')
      console.log('  sudo systemctl start redis-server')
      console.log('')
      console.log('macOS:')
      console.log('  brew install redis')
      console.log('  brew services start redis')
      console.log('')
      console.log('Windows:')
      console.log('  Download from: https://github.com/microsoftarchive/redis/releases')
      console.log('')
      throw error
    }
  }

  /**
   * Setup PostgreSQL
   */
  async setupPostgreSQL() {
    console.log('🐘 Setting up PostgreSQL...')

    try {
      // Check if PostgreSQL is installed
      execSync('psql --version', { stdio: 'ignore' })
      console.log('✅ PostgreSQL is already installed')

      // Create database
      const dbName = process.env.DB_NAME || 'chatwoot_webhook'
      const dbUser = process.env.DB_USER || 'postgres'
      
      try {
        execSync(`createdb -U ${dbUser} ${dbName}`, { stdio: 'ignore' })
        console.log(`✅ Database '${dbName}' created successfully`)
      } catch (error) {
        console.log(`ℹ️  Database '${dbName}' might already exist`)
      }

      // Create sample .env configuration
      this.createPostgreSQLEnvConfig()

    } catch (error) {
      console.log('❌ PostgreSQL setup failed. Please install PostgreSQL:')
      console.log('')
      console.log('Ubuntu/Debian:')
      console.log('  sudo apt-get update')
      console.log('  sudo apt-get install postgresql postgresql-contrib')
      console.log('  sudo systemctl start postgresql')
      console.log('')
      console.log('macOS:')
      console.log('  brew install postgresql')
      console.log('  brew services start postgresql')
      console.log('')
      console.log('Windows:')
      console.log('  Download from: https://www.postgresql.org/download/windows/')
      console.log('')
      throw error
    }
  }

  /**
   * Create Redis environment configuration
   */
  createRedisEnvConfig() {
    const envConfig = `
# Redis Configuration
REPOSITORY_TYPE=redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
`

    this.writeEnvFile(envConfig, 'Redis')
  }

  /**
   * Create PostgreSQL environment configuration
   */
  createPostgreSQLEnvConfig() {
    const envConfig = `
# PostgreSQL Configuration
REPOSITORY_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chatwoot_webhook
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false
`

    this.writeEnvFile(envConfig, 'PostgreSQL')
  }

  /**
   * Write environment configuration to file
   */
  writeEnvFile(config, dbType) {
    const envPath = path.join(process.cwd(), '.env.database')
    
    try {
      fs.writeFileSync(envPath, config.trim())
      console.log(`✅ ${dbType} configuration written to .env.database`)
      console.log(`📝 Please copy the relevant settings to your .env file`)
    } catch (error) {
      console.log(`⚠️  Could not write .env.database file: ${error.message}`)
    }
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  const setup = new DatabaseSetup()
  setup.setup()
}

module.exports = DatabaseSetup
