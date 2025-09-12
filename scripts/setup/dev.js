#!/usr/bin/env node

/**
 * Development Environment Setup
 * Sets up the development environment with all necessary configurations
 */

require('dotenv').config()
const fs = require('fs')
const path = require('path')

class DevSetup {
  constructor() {
    this.projectRoot = process.cwd()
    this.envPath = path.join(this.projectRoot, '.env')
    this.envExamplePath = path.join(this.projectRoot, 'env.example')
  }

  /**
   * Main setup function
   */
  async setup() {
    console.log('🛠️  Development Environment Setup')
    console.log('')

    try {
      // Check if .env exists
      await this.checkEnvFile()

      // Setup database
      await this.setupDatabase()

      // Setup configurations
      await this.setupConfigurations()

      // Show next steps
      this.showNextSteps()

      console.log('')
      console.log('✅ Development environment setup completed!')

    } catch (error) {
      console.error('❌ Setup failed:', error.message)
      throw error
    }
  }

  /**
   * Check and create .env file
   */
  async checkEnvFile() {
    console.log('📄 Checking .env file...')

    if (fs.existsSync(this.envPath)) {
      console.log('✅ .env file already exists')
      return
    }

    if (!fs.existsSync(this.envExamplePath)) {
      throw new Error('env.example file not found')
    }

    // Copy env.example to .env
    const envExample = fs.readFileSync(this.envExamplePath, 'utf8')
    fs.writeFileSync(this.envPath, envExample)

    console.log('✅ Created .env file from env.example')
    console.log('⚠️  Please update .env with your actual configuration values')
  }

  /**
   * Setup database
   */
  async setupDatabase() {
    console.log('🗄️  Setting up database...')

    try {
      // Import and run database setup
      const DatabaseSetup = require('./database')
      const dbSetup = new DatabaseSetup()
      
      await dbSetup.setup()
      console.log('✅ Database setup completed')

    } catch (error) {
      console.log('⚠️  Database setup failed:', error.message)
      console.log('   Please check your database connection settings in .env')
      console.log('   You can run database setup later with: node scripts/setup/database.js')
    }
  }

  /**
   * Setup configurations
   */
  async setupConfigurations() {
    console.log('⚙️  Setting up configurations...')

    try {
      // Test configuration service
      const ConfigurationTest = require('../tests/test-configuration')
      const configTest = new ConfigurationTest()
      
      const success = await configTest.runTests()
      if (success) {
        console.log('✅ Configuration service is working')
      } else {
        console.log('⚠️  Configuration service has issues')
      }

    } catch (error) {
      console.log('⚠️  Configuration setup failed:', error.message)
      console.log('   Please ensure database is properly set up first')
    }
  }

  /**
   * Show next steps
   */
  showNextSteps() {
    console.log('')
    console.log('🚀 Next Steps:')
    console.log('')
    console.log('1. Update your .env file with actual values:')
    console.log('   - DB_PASSWORD: Your PostgreSQL password')
    console.log('   - TELEGRAM_BOT_TOKEN: Your Telegram bot token')
    console.log('   - CHATWOOT_ACCESS_TOKEN: Your Chatwoot access token')
    console.log('   - DIFY_API_KEY: Your Dify API key')
    console.log('')
    console.log('2. Start the application:')
    console.log('   yarn start')
    console.log('')
    console.log('3. Test the setup:')
    console.log('   node scripts/tests/test-webhook.js')
    console.log('')
    console.log('4. Useful commands:')
    console.log('   - Database setup: node scripts/setup/database.js')
    console.log('   - Run migrations: node scripts/migrate.js')
    console.log('   - Test configurations: node scripts/tests/test-configuration.js')
    console.log('   - Test webhooks: node scripts/tests/test-webhook.js')
  }

  /**
   * Show current configuration
   */
  async showConfig() {
    console.log('⚙️  Current Configuration')
    console.log('')

    try {
      const DatabaseSetup = require('./database')
      const dbSetup = new DatabaseSetup()
      
      await dbSetup.testConnection()
      await dbSetup.showConfigurations()

    } catch (error) {
      console.log('❌ Failed to show configuration:', error.message)
    }
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2] || 'setup'
  const setup = new DevSetup()

  switch (command) {
    case 'setup':
      setup.setup()
        .then(() => process.exit(0))
        .catch(error => {
          console.error('Setup failed:', error.message)
          process.exit(1)
        })
      break

    case 'config':
      setup.showConfig()
        .then(() => process.exit(0))
        .catch(error => {
          console.error('Failed to show config:', error.message)
          process.exit(1)
        })
      break

    default:
      console.log('Usage: node scripts/setup/dev.js [setup|config]')
      console.log('')
      console.log('Commands:')
      console.log('  setup - Run full development setup (default)')
      console.log('  config - Show current configuration')
      process.exit(1)
  }
}

module.exports = DevSetup
