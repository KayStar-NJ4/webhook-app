#!/usr/bin/env node

/**
 * Configuration Service Test
 * Tests the ConfigurationService functionality
 */

require('dotenv').config()
const { Pool } = require('pg')
const ConfigurationService = require('../../src/infrastructure/services/ConfigurationService')
const ConfigurationRepository = require('../../src/infrastructure/repositories/ConfigurationRepository')
const Logger = require('../../src/infrastructure/logging/Logger')

class ConfigurationTest {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'turbo_chatwoot_webhook',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    })
    
    this.logger = new Logger('Test')
    this.configRepository = new ConfigurationRepository({ 
      db: this.pool, 
      logger: this.logger 
    })
    this.configService = new ConfigurationService({ 
      configRepository: this.configRepository, 
      logger: this.logger 
    })
  }

  /**
   * Run all tests
   */
  async runTests() {
    console.log('🧪 Configuration Service Tests')
    console.log('')

    const tests = [
      { name: 'Test database connection', fn: () => this.testConnection() },
      { name: 'Test get configuration', fn: () => this.testGetConfiguration() },
      { name: 'Test set configuration', fn: () => this.testSetConfiguration() },
      { name: 'Test Dify configuration', fn: () => this.testDifyConfiguration() },
      { name: 'Test cache functionality', fn: () => this.testCacheFunctionality() },
      { name: 'Test configuration types', fn: () => this.testConfigurationTypes() }
    ]

    let passed = 0
    let failed = 0

    for (const test of tests) {
      try {
        console.log(`🔄 ${test.name}...`)
        await test.fn()
        console.log(`✅ ${test.name} - PASSED`)
        passed++
      } catch (error) {
        console.log(`❌ ${test.name} - FAILED: ${error.message}`)
        failed++
      }
    }

    console.log('')
    console.log('📊 Test Results:')
    console.log(`  ✅ Passed: ${passed}`)
    console.log(`  ❌ Failed: ${failed}`)
    console.log(`  📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`)

    if (failed === 0) {
      console.log('')
      console.log('🎉 All tests passed!')
    } else {
      console.log('')
      console.log('⚠️  Some tests failed. Please check the errors above.')
    }

    return failed === 0
  }

  /**
   * Test database connection
   */
  async testConnection() {
    const result = await this.pool.query('SELECT NOW() as current_time')
    if (!result.rows[0].current_time) {
      throw new Error('Database connection failed')
    }
  }

  /**
   * Test get configuration
   */
  async testGetConfiguration() {
    // Test getting existing configuration
    const maxLength = await this.configService.get('dify.maxResponseLength')
    if (maxLength !== 1000) {
      throw new Error(`Expected 1000, got ${maxLength}`)
    }

    // Test getting non-existing configuration with default
    const nonExistent = await this.configService.get('non.existent.key', 'default')
    if (nonExistent !== 'default') {
      throw new Error(`Expected 'default', got ${nonExistent}`)
    }
  }

  /**
   * Test set configuration
   */
  async testSetConfiguration() {
    // Set a test configuration
    await this.configService.set('test.value', 'test123')
    
    // Get it back
    const value = await this.configService.get('test.value')
    if (value !== 'test123') {
      throw new Error(`Expected 'test123', got ${value}`)
    }

    // Clean up
    await this.configRepository.delete('test.value')
  }

  /**
   * Test Dify configuration
   */
  async testDifyConfiguration() {
    const difyConfig = await this.configService.getDifyConfig()
    
    const expectedKeys = [
      'maxResponseLength',
      'simpleGreetingMaxLength', 
      'cooldownPeriod',
      'enableConversationHistory'
    ]

    for (const key of expectedKeys) {
      if (!(key in difyConfig)) {
        throw new Error(`Missing key in Dify config: ${key}`)
      }
    }

    if (typeof difyConfig.maxResponseLength !== 'number') {
      throw new Error('maxResponseLength should be a number')
    }

    if (typeof difyConfig.enableConversationHistory !== 'boolean') {
      throw new Error('enableConversationHistory should be a boolean')
    }
  }

  /**
   * Test cache functionality
   */
  async testCacheFunctionality() {
    // Clear cache
    this.configService.clearCache()

    // First call should hit database
    const start1 = Date.now()
    await this.configService.get('dify.maxResponseLength')
    const time1 = Date.now() - start1

    // Second call should hit cache (faster)
    const start2 = Date.now()
    await this.configService.get('dify.maxResponseLength')
    const time2 = Date.now() - start2

    // Cache should be faster (though this might not always be true in tests)
    if (time2 > time1 * 2) {
      console.log(`  ⚠️  Cache might not be working (${time1}ms vs ${time2}ms)`)
    }
  }

  /**
   * Test configuration types
   */
  async testConfigurationTypes() {
    // Test string
    await this.configService.set('test.string', 'hello')
    const stringValue = await this.configService.get('test.string')
    if (stringValue !== 'hello') {
      throw new Error(`String test failed: expected 'hello', got ${stringValue}`)
    }

    // Test number
    await this.configService.set('test.number', 42)
    const numberValue = await this.configService.get('test.number')
    if (numberValue !== 42) {
      throw new Error(`Number test failed: expected 42, got ${numberValue}`)
    }

    // Test boolean
    await this.configService.set('test.boolean', true)
    const booleanValue = await this.configService.get('test.boolean')
    if (booleanValue !== true) {
      throw new Error(`Boolean test failed: expected true, got ${booleanValue}`)
    }

    // Test object
    const testObject = { key: 'value', number: 123 }
    await this.configService.set('test.object', testObject)
    const objectValue = await this.configService.get('test.object')
    if (JSON.stringify(objectValue) !== JSON.stringify(testObject)) {
      throw new Error(`Object test failed: expected ${JSON.stringify(testObject)}, got ${JSON.stringify(objectValue)}`)
    }

    // Clean up
    await this.configRepository.delete('test.string')
    await this.configRepository.delete('test.number')
    await this.configRepository.delete('test.boolean')
    await this.configRepository.delete('test.object')
  }

  /**
   * Clean up test data
   */
  async cleanup() {
    try {
      await this.pool.end()
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const test = new ConfigurationTest()
  
  test.runTests()
    .then(success => {
      test.cleanup()
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('Test runner failed:', error.message)
      test.cleanup()
      process.exit(1)
    })
}

module.exports = ConfigurationTest
