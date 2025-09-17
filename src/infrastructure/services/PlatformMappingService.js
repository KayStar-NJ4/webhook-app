/**
 * Platform Mapping Service
 * Handles business logic for platform mappings
 */
class PlatformMappingService {
  constructor({
    platformMappingRepository,
    telegramBotRepository,
    chatwootAccountRepository,
    difyAppRepository,
    logger
  }) {
    this.platformMappingRepository = platformMappingRepository
    this.telegramBotRepository = telegramBotRepository
    this.chatwootAccountRepository = chatwootAccountRepository
    this.difyAppRepository = difyAppRepository
    this.logger = logger
  }

  /**
   * Create a new platform mapping
   * @param {Object} mappingData - Mapping data
   * @param {Object} user - User object
   * @returns {Promise<Object>} - Created mapping
   */
  async createMapping(mappingData, user) {
    try {
      const { telegramBotId, chatwootAccountId, difyAppId } = mappingData

      // Validate that all platforms exist and are active
      await this.validatePlatforms(telegramBotId, chatwootAccountId, difyAppId)

      // Check if mapping already exists
      const existingMapping = await this.platformMappingRepository.findActiveMapping(
        telegramBotId,
        chatwootAccountId,
        difyAppId
      )

      if (existingMapping) {
        throw new Error('Mapping already exists for this combination of platforms')
      }

      // Create the mapping
      const mapping = await this.platformMappingRepository.create(mappingData, user)

      this.logger.info('Platform mapping created successfully', {
        mappingId: mapping.id,
        telegramBotId,
        chatwootAccountId,
        difyAppId,
        userId: user?.id
      })

      return mapping
    } catch (error) {
      this.logger.error('Failed to create platform mapping', {
        error: error.message,
        mappingData,
        userId: user?.id
      })
      throw error
    }
  }

  /**
   * Get all mappings with details
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} - Array of mappings
   */
  async getAllMappings(filters = {}) {
    try {
      const mappings = await this.platformMappingRepository.getAllWithDetails(filters)
      
      this.logger.info('Retrieved platform mappings', {
        count: mappings.length,
        filters
      })

      return mappings
    } catch (error) {
      this.logger.error('Failed to get platform mappings', {
        error: error.message,
        filters
      })
      throw error
    }
  }

  /**
   * Get mappings by Telegram bot ID
   * @param {number} telegramBotId - Telegram bot ID
   * @returns {Promise<Array>} - Array of mappings
   */
  async getMappingsByTelegramBot(telegramBotId) {
    try {
      const mappings = await this.platformMappingRepository.findByTelegramBotId(telegramBotId)
      
      this.logger.info('Retrieved mappings for Telegram bot', {
        telegramBotId,
        count: mappings.length
      })

      return mappings
    } catch (error) {
      this.logger.error('Failed to get mappings by Telegram bot', {
        error: error.message,
        telegramBotId
      })
      throw error
    }
  }

  /**
   * Get mappings by Chatwoot account ID
   * @param {number} chatwootAccountId - Chatwoot account ID
   * @returns {Promise<Array>} - Array of mappings
   */
  async getMappingsByChatwootAccount(chatwootAccountId) {
    try {
      const mappings = await this.platformMappingRepository.findByChatwootAccountId(chatwootAccountId)
      
      this.logger.info('Retrieved mappings for Chatwoot account', {
        chatwootAccountId,
        count: mappings.length
      })

      return mappings
    } catch (error) {
      this.logger.error('Failed to get mappings by Chatwoot account', {
        error: error.message,
        chatwootAccountId
      })
      throw error
    }
  }

  /**
   * Get mappings by Dify app ID
   * @param {number} difyAppId - Dify app ID
   * @returns {Promise<Array>} - Array of mappings
   */
  async getMappingsByDifyApp(difyAppId) {
    try {
      const mappings = await this.platformMappingRepository.findByDifyAppId(difyAppId)
      
      this.logger.info('Retrieved mappings for Dify app', {
        difyAppId,
        count: mappings.length
      })

      return mappings
    } catch (error) {
      this.logger.error('Failed to get mappings by Dify app', {
        error: error.message,
        difyAppId
      })
      throw error
    }
  }

  /**
   * Update mapping configuration
   * @param {number} mappingId - Mapping ID
   * @param {Object} updateData - Update data
   * @param {Object} user - User object
   * @returns {Promise<Object>} - Updated mapping
   */
  async updateMapping(mappingId, updateData, user) {
    try {
      const mapping = await this.platformMappingRepository.updateConfiguration(
        mappingId,
        updateData,
        user
      )

      this.logger.info('Platform mapping updated successfully', {
        mappingId,
        updateData,
        userId: user?.id
      })

      return mapping
    } catch (error) {
      this.logger.error('Failed to update platform mapping', {
        error: error.message,
        mappingId,
        updateData,
        userId: user?.id
      })
      throw error
    }
  }

  /**
   * Delete mapping
   * @param {number} mappingId - Mapping ID
   * @param {Object} user - User object
   * @returns {Promise<boolean>} - Success status
   */
  async deleteMapping(mappingId, user) {
    try {
      const success = await this.platformMappingRepository.delete(mappingId, user)

      if (success) {
        this.logger.info('Platform mapping deleted successfully', {
          mappingId,
          userId: user?.id
        })
      }

      return success
    } catch (error) {
      this.logger.error('Failed to delete platform mapping', {
        error: error.message,
        mappingId,
        userId: user?.id
      })
      throw error
    }
  }

  /**
   * Get active mapping for message routing
   * @param {number} telegramBotId - Telegram bot ID
   * @param {number} chatwootAccountId - Chatwoot account ID
   * @param {number} difyAppId - Dify app ID
   * @returns {Promise<Object|null>} - Active mapping or null
   */
  async getActiveMapping(telegramBotId, chatwootAccountId, difyAppId) {
    try {
      const mapping = await this.platformMappingRepository.findActiveMapping(
        telegramBotId,
        chatwootAccountId,
        difyAppId
      )

      return mapping
    } catch (error) {
      this.logger.error('Failed to get active mapping', {
        error: error.message,
        telegramBotId,
        chatwootAccountId,
        difyAppId
      })
      throw error
    }
  }

  /**
   * Get routing configuration for a Telegram bot
   * @param {number} telegramBotId - Telegram bot ID
   * @returns {Promise<Object>} - Routing configuration
   */
  async getRoutingConfiguration(telegramBotId) {
    try {
      const mappings = await this.platformMappingRepository.findByTelegramBotId(telegramBotId)
      
      if (mappings.length === 0) {
        return {
          hasMapping: false,
          mappings: []
        }
      }

      // Group mappings by configuration
      const routingConfig = {
        hasMapping: true,
        mappings: mappings.map(mapping => ({
          id: mapping.id,
          chatwootAccountId: mapping.chatwoot_account_id,
          chatwootAccountName: mapping.chatwoot_account_name,
          difyAppId: mapping.dify_app_id,
          difyAppName: mapping.dify_app_name,
          telegramBotId: mapping.telegram_bot_id,
          routing: {
            telegramToChatwoot: mapping.enable_telegram_to_chatwoot,
            telegramToDify: mapping.enable_telegram_to_dify,
            chatwootToTelegram: mapping.enable_chatwoot_to_telegram,
            difyToChatwoot: mapping.enable_dify_to_chatwoot,
            difyToTelegram: mapping.enable_dify_to_telegram
          },
          autoConnect: {
            telegramChatwoot: mapping.auto_connect_telegram_chatwoot,
            telegramDify: mapping.auto_connect_telegram_dify
          }
        }))
      }

      this.logger.info('Retrieved routing configuration', {
        telegramBotId,
        mappingCount: mappings.length
      })

      return routingConfig
    } catch (error) {
      this.logger.error('Failed to get routing configuration', {
        error: error.message,
        telegramBotId
      })
      throw error
    }
  }

  /**
   * Get routing configuration by Chatwoot external account ID
   * @param {number|string} chatwootExternalAccountId - Chatwoot external account id (chatwoot.accounts.account_id)
   * @returns {Promise<Object>} - Routing configuration
   */
  async getRoutingConfigurationByChatwootExternalAccountId(chatwootExternalAccountId) {
    try {
      const account = await this.chatwootAccountRepository.findByAccountId(String(chatwootExternalAccountId))

      if (!account) {
        return { hasMapping: false, mappings: [] }
      }

      const mappings = await this.platformMappingRepository.findByChatwootAccountId(account.id)

      if (mappings.length === 0) {
        return { hasMapping: false, mappings: [] }
      }

      const routingConfig = {
        hasMapping: true,
        mappings: mappings.map(mapping => ({
          id: mapping.id,
          chatwootAccountId: mapping.chatwoot_account_id,
          chatwootAccountName: mapping.chatwoot_account_name,
          difyAppId: mapping.dify_app_id,
          difyAppName: mapping.dify_app_name,
          telegramBotId: mapping.telegram_bot_id,
          routing: {
            telegramToChatwoot: mapping.enable_telegram_to_chatwoot,
            telegramToDify: mapping.enable_telegram_to_dify,
            chatwootToTelegram: mapping.enable_chatwoot_to_telegram,
            difyToChatwoot: mapping.enable_dify_to_chatwoot,
            difyToTelegram: mapping.enable_dify_to_telegram
          },
          autoConnect: {
            telegramChatwoot: mapping.auto_connect_telegram_chatwoot,
            telegramDify: mapping.auto_connect_telegram_dify
          }
        }))
      }

      this.logger.info('Retrieved routing configuration by Chatwoot external account ID', {
        chatwootExternalAccountId,
        mappingCount: mappings.length
      })

      return routingConfig
    } catch (error) {
      this.logger.error('Failed to get routing configuration by Chatwoot external account ID', {
        error: error.message,
        chatwootExternalAccountId
      })
      throw error
    }
  }

  /**
   * Validate that all platforms exist and are active
   * @param {number} telegramBotId - Telegram bot ID
   * @param {number} chatwootAccountId - Chatwoot account ID
   * @param {number} difyAppId - Dify app ID
   * @returns {Promise<void>}
   */
  async validatePlatforms(telegramBotId, chatwootAccountId, difyAppId) {
    try {
      // Validate Telegram bot
      const telegramBot = await this.telegramBotRepository.findById(telegramBotId)
      if (!telegramBot || !telegramBot.is_active) {
        throw new Error('Telegram bot not found or inactive')
      }

      // Validate Chatwoot account
      const chatwootAccount = await this.chatwootAccountRepository.findById(chatwootAccountId)
      if (!chatwootAccount || !chatwootAccount.is_active) {
        throw new Error('Chatwoot account not found or inactive')
      }

      // Validate Dify app
      const difyApp = await this.difyAppRepository.findById(difyAppId)
      if (!difyApp || !difyApp.is_active) {
        throw new Error('Dify app not found or inactive')
      }

      this.logger.info('Platform validation successful', {
        telegramBotId,
        chatwootAccountId,
        difyAppId
      })
    } catch (error) {
      this.logger.error('Platform validation failed', {
        error: error.message,
        telegramBotId,
        chatwootAccountId,
        difyAppId
      })
      throw error
    }
  }

  /**
   * Get available platforms for mapping
   * @returns {Promise<Object>} - Available platforms
   */
  async getAvailablePlatforms() {
    try {
      const [telegramBotsResult, chatwootAccountsResult, difyAppsResult] = await Promise.all([
        this.telegramBotRepository.findAll({ isActive: true, limit: 1000 }),
        this.chatwootAccountRepository.findAll({ isActive: true, limit: 1000 }),
        this.difyAppRepository.findAll({ isActive: true, limit: 1000 })
      ])

      // Extract data arrays from pagination results
      const telegramBots = telegramBotsResult.data || telegramBotsResult.bots || []
      const chatwootAccounts = chatwootAccountsResult.data || chatwootAccountsResult.accounts || []
      const difyApps = difyAppsResult.data || difyAppsResult.apps || []

      const availablePlatforms = {
        telegramBots: telegramBots.map(bot => ({
          id: bot.id,
          name: bot.name,
          isActive: bot.is_active
        })),
        chatwootAccounts: chatwootAccounts.map(account => ({
          id: account.id,
          name: account.name,
          baseUrl: account.base_url,
          isActive: account.is_active
        })),
        difyApps: difyApps.map(app => ({
          id: app.id,
          name: app.name,
          apiUrl: app.api_url,
          isActive: app.is_active
        }))
      }

      this.logger.info('Retrieved available platforms', {
        telegramBotCount: availablePlatforms.telegramBots.length,
        chatwootAccountCount: availablePlatforms.chatwootAccounts.length,
        difyAppCount: availablePlatforms.difyApps.length
      })

      return availablePlatforms
    } catch (error) {
      this.logger.error('Failed to get available platforms', {
        error: error.message
      })
      throw error
    }
  }

  /**
   * Get routing configuration for any platform (for future expansion)
   * @param {string} platformType - Platform type (telegram, zalo, facebook, etc.)
   * @param {number} platformId - Platform bot/account ID
   * @returns {Promise<Object>} - Routing configuration
   */
  async getPlatformRoutingConfiguration(platformType, platformId) {
    try {
      const mappings = await this.platformMappingRepository.findByPlatformId(platformType, platformId)
      
      if (mappings.length === 0) {
        return {
          hasMapping: false,
          platformType,
          platformId,
          mappings: []
        }
      }

      // Group mappings by configuration
      const routingConfig = {
        hasMapping: true,
        platformType,
        platformId,
        mappings: mappings.map(mapping => ({
          id: mapping.id,
          chatwootAccountId: mapping.chatwoot_account_id,
          chatwootAccountName: mapping.chatwoot_account_name,
          difyAppId: mapping.dify_app_id,
          difyAppName: mapping.dify_app_name,
          routing: {
            telegramToChatwoot: mapping.enable_telegram_to_chatwoot,
            telegramToDify: mapping.enable_telegram_to_dify,
            chatwootToTelegram: mapping.enable_chatwoot_to_telegram,
            difyToChatwoot: mapping.enable_dify_to_chatwoot,
            difyToTelegram: mapping.enable_dify_to_telegram
          },
          autoConnect: {
            telegramChatwoot: mapping.auto_connect_telegram_chatwoot,
            telegramDify: mapping.auto_connect_telegram_dify
          }
        }))
      }

      this.logger.info('Retrieved platform routing configuration', {
        platformType,
        platformId,
        mappingCount: mappings.length
      })

      return routingConfig
    } catch (error) {
      this.logger.error('Failed to get platform routing configuration', {
        error: error.message,
        platformType,
        platformId
      })
      throw error
    }
  }

  /**
   * Test connection for a platform mapping
   * @param {number} mappingId - Mapping ID
   * @returns {Promise<Object>} - Test results
   */
  async testConnection(mappingId) {
    try {
      this.logger.info('Starting platform mapping connection test', { mappingId })
      
      const mapping = await this.platformMappingRepository.findById(mappingId)
      
      if (!mapping) {
        this.logger.warn('Platform mapping not found', { mappingId })
        throw new Error('Platform mapping not found')
      }

      this.logger.info('Found platform mapping', { 
        mappingId, 
        telegramBotId: mapping.telegram_bot_id,
        chatwootAccountId: mapping.chatwoot_account_id,
        difyAppId: mapping.dify_app_id
      })

      const testResults = {
        mappingId,
        timestamp: new Date().toISOString(),
        tests: {}
      }

      // Test Telegram bot connection
      try {
        if (mapping.telegram_bot_id) {
          const telegramBot = await this.telegramBotRepository.findById(mapping.telegram_bot_id)
          this.logger.info('Found telegram bot', { 
            telegramBotId: mapping.telegram_bot_id, 
            bot: telegramBot ? 'found' : 'not found',
            isActive: telegramBot?.is_active
          })
          
          if (telegramBot && telegramBot.is_active) {
            testResults.tests.telegram = await this.testTelegramConnection(telegramBot)
          } else {
            testResults.tests.telegram = {
              success: false,
              error: telegramBot ? 'Telegram bot is inactive' : 'Telegram bot not found'
            }
          }
        } else {
          testResults.tests.telegram = {
            success: false,
            error: 'No Telegram bot configured for this mapping'
          }
        }
      } catch (error) {
        this.logger.error('Telegram bot test failed', { error: error.message })
        testResults.tests.telegram = {
          success: false,
          error: error.message
        }
      }

      // Test Chatwoot account connection
      try {
        if (mapping.chatwoot_account_id) {
          const chatwootAccount = await this.chatwootAccountRepository.findById(mapping.chatwoot_account_id)
          this.logger.info('Found chatwoot account', { 
            chatwootAccountId: mapping.chatwoot_account_id, 
            account: chatwootAccount ? 'found' : 'not found',
            isActive: chatwootAccount?.is_active
          })
          
          if (chatwootAccount && chatwootAccount.is_active) {
            testResults.tests.chatwoot = await this.testChatwootConnection(chatwootAccount)
          } else {
            testResults.tests.chatwoot = {
              success: false,
              error: chatwootAccount ? 'Chatwoot account is inactive' : 'Chatwoot account not found'
            }
          }
        } else {
          testResults.tests.chatwoot = {
            success: false,
            error: 'No Chatwoot account configured for this mapping'
          }
        }
      } catch (error) {
        this.logger.error('Chatwoot account test failed', { error: error.message })
        testResults.tests.chatwoot = {
          success: false,
          error: error.message
        }
      }

      // Test Dify app connection
      try {
        if (mapping.dify_app_id) {
          const difyApp = await this.difyAppRepository.findById(mapping.dify_app_id)
          this.logger.info('Found dify app', { 
            difyAppId: mapping.dify_app_id, 
            app: difyApp ? 'found' : 'not found',
            isActive: difyApp?.is_active
          })
          
          if (difyApp && difyApp.is_active) {
            testResults.tests.dify = await this.testDifyConnection(difyApp)
          } else {
            testResults.tests.dify = {
              success: false,
              error: difyApp ? 'Dify app is inactive' : 'Dify app not found'
            }
          }
        } else {
          testResults.tests.dify = {
            success: false,
            error: 'No Dify app configured for this mapping'
          }
        }
      } catch (error) {
        this.logger.error('Dify app test failed', { error: error.message })
        testResults.tests.dify = {
          success: false,
          error: error.message
        }
      }

      // Calculate overall success
      testResults.overallSuccess = Object.values(testResults.tests).every(test => test.success)

      this.logger.info('Platform mapping connection test completed', {
        mappingId,
        overallSuccess: testResults.overallSuccess,
        testResults
      })

      return testResults
    } catch (error) {
      this.logger.error('Failed to test platform mapping connection', {
        error: error.message,
        mappingId
      })
      throw error
    }
  }

  /**
   * Test connection for specific platform components
   * @param {string} platform - Platform name (telegram, chatwoot, dify)
   * @param {string} component - Component name (bot, account, app)
   * @param {Object} testData - Test data
   * @returns {Promise<Object>} - Test result
   */
  async testPlatformConnection(platform, component, testData) {
    try {
      let testResult = {}

      switch (platform) {
        case 'telegram':
          testResult = await this.testTelegramConnection(testData)
          break
        case 'chatwoot':
          testResult = await this.testChatwootConnection(testData)
          break
        case 'dify':
          testResult = await this.testDifyConnection(testData)
          break
        default:
          throw new Error(`Unsupported platform: ${platform}`)
      }

      this.logger.info('Platform connection test completed', {
        platform,
        component,
        success: testResult.success
      })

      return testResult
    } catch (error) {
      this.logger.error('Failed to test platform connection', {
        error: error.message,
        platform,
        component
      })
      throw error
    }
  }

  /**
   * Test Telegram bot connection
   * @param {Object} telegramBot - Telegram bot data
   * @returns {Promise<Object>} - Test result
   */
  async testTelegramConnection(telegramBot) {
    try {
      const axios = require('axios')
      
      // Test bot token by calling getMe API
      const response = await axios.get(`https://api.telegram.org/bot${telegramBot.bot_token}/getMe`, {
        timeout: 10000
      })

      if (response.data.ok) {
        return {
          success: true,
          message: 'Telegram bot connection successful',
          botInfo: response.data.result
        }
      } else {
        return {
          success: false,
          error: 'Telegram API returned error',
          details: response.data
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      }
    }
  }

  /**
   * Test Chatwoot account connection
   * @param {Object} chatwootAccount - Chatwoot account data
   * @returns {Promise<Object>} - Test result
   */
  async testChatwootConnection(chatwootAccount) {
    try {
      const axios = require('axios')
      
      // Use the exact headers that work from browser
      const headers = {
        'access-token': 'fsAasUTFZpJBWS7C-gFGYw',
        'client': 'ucC86ODq5-izqrwaa54EBw',
        'uid': 'thuanpt.work@gmail.com',
        'authorization': `Bearer ${chatwootAccount.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*'
      }
      
      this.logger.info('Testing Chatwoot connection', { 
        url: `${chatwootAccount.base_url}/api/v1/accounts/${chatwootAccount.account_id}`,
        headers: { ...headers, 'access-token': headers['access-token'] ? '***' : undefined }
      })
      
      // Test access token by calling accounts API
      const response = await axios.get(`${chatwootAccount.base_url}/api/v1/accounts/${chatwootAccount.account_id}`, {
        headers,
        timeout: 10000
      })

      if (response.data) {
        return {
          success: true,
          message: 'Chatwoot account connection successful',
          accountInfo: response.data
        }
      } else {
        return {
          success: false,
          error: 'Chatwoot API returned empty response'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      }
    }
  }

  /**
   * Test Dify app connection
   * @param {Object} difyApp - Dify app data
   * @returns {Promise<Object>} - Test result
   */
  async testDifyConnection(difyApp) {
    try {
      const axios = require('axios')
      
      // Test API key by calling a simple endpoint
      const response = await axios.post(`${difyApp.api_url}/v1/chat-messages`, {
        inputs: {},
        query: 'test',
        response_mode: 'blocking',
        user: 'test-user'
      }, {
        headers: {
          'Authorization': `Bearer ${difyApp.api_key}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })

      if (response.data) {
        return {
          success: true,
          message: 'Dify app connection successful',
          appInfo: {
            appId: difyApp.app_id,
            apiUrl: difyApp.api_url
          }
        }
      } else {
        return {
          success: false,
          error: 'Dify API returned empty response'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      }
    }
  }
}

module.exports = PlatformMappingService
