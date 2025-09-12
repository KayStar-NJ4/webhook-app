#!/usr/bin/env node

/**
 * Webhook Test Script
 * Tests webhook endpoints and message processing
 */

require('dotenv').config()
const axios = require('axios')

class WebhookTest {
  constructor() {
    this.baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000'
    this.testData = {
      telegram: {
        update_id: 123456789,
        message: {
          message_id: 1,
          from: {
            id: 123456789,
            is_bot: false,
            first_name: 'Test',
            username: 'testuser',
            language_code: 'en'
          },
          chat: {
            id: 123456789,
            first_name: 'Test',
            username: 'testuser',
            type: 'private'
          },
          date: Math.floor(Date.now() / 1000),
          text: 'Hello, this is a test message'
        }
      },
      chatwoot: {
        id: 1,
        event: 'message_created',
        messages: [{
          id: 1,
          content: 'Hello from Chatwoot',
          sender: {
            id: 1,
            name: 'Test User',
            type: 'contact',
            additional_attributes: {
              username: 'testuser',
              language_code: 'en'
            }
          },
          conversation: {
            id: 1,
            inbox_id: 1
          }
        }]
      }
    }
  }

  /**
   * Run all webhook tests
   */
  async runTests() {
    console.log('🧪 Webhook Tests')
    console.log(`🌐 Testing against: ${this.baseUrl}`)
    console.log('')

    const tests = [
      { name: 'Test server health', fn: () => this.testHealth() },
      { name: 'Test Telegram webhook', fn: () => this.testTelegramWebhook() },
      { name: 'Test Chatwoot webhook', fn: () => this.testChatwootWebhook() },
      { name: 'Test invalid webhook', fn: () => this.testInvalidWebhook() }
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
      console.log('🎉 All webhook tests passed!')
    } else {
      console.log('')
      console.log('⚠️  Some tests failed. Please check the errors above.')
    }

    return failed === 0
  }

  /**
   * Test server health
   */
  async testHealth() {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000
      })
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`)
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Server is not running. Please start the application first.')
      }
      throw error
    }
  }

  /**
   * Test Telegram webhook
   */
  async testTelegramWebhook() {
    const response = await axios.post(`${this.baseUrl}/webhook/telegram`, this.testData.telegram, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`)
    }

    if (!response.data.success) {
      throw new Error(`Webhook failed: ${response.data.error || 'Unknown error'}`)
    }
  }

  /**
   * Test Chatwoot webhook
   */
  async testChatwootWebhook() {
    const response = await axios.post(`${this.baseUrl}/webhook/chatwoot`, this.testData.chatwoot, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`)
    }

    if (!response.data.success) {
      throw new Error(`Webhook failed: ${response.data.error || 'Unknown error'}`)
    }
  }

  /**
   * Test invalid webhook data
   */
  async testInvalidWebhook() {
    try {
      const response = await axios.post(`${this.baseUrl}/webhook/telegram`, {
        invalid: 'data'
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      })

      // Should return error status
      if (response.status === 200) {
        throw new Error('Expected error status for invalid data')
      }
    } catch (error) {
      if (error.response && error.response.status >= 400) {
        // This is expected for invalid data
        return
      }
      throw error
    }
  }

  /**
   * Test with custom message
   */
  async testCustomMessage(message) {
    console.log(`🔄 Testing custom message: "${message}"`)
    
    const testData = {
      ...this.testData.telegram,
      message: {
        ...this.testData.telegram.message,
        text: message
      }
    }

    const response = await axios.post(`${this.baseUrl}/webhook/telegram`, testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    })

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`)
    }

    console.log(`✅ Custom message test passed`)
    return response.data
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2]
  const test = new WebhookTest()

  if (command && command !== 'all') {
    // Test specific message
    test.testCustomMessage(command)
      .then(() => {
        console.log('🎉 Custom message test completed!')
        process.exit(0)
      })
      .catch(error => {
        console.error('❌ Custom message test failed:', error.message)
        process.exit(1)
      })
  } else {
    // Run all tests
    test.runTests()
      .then(success => {
        process.exit(success ? 0 : 1)
      })
      .catch(error => {
        console.error('Test runner failed:', error.message)
        process.exit(1)
      })
  }
}

module.exports = WebhookTest
