/**
 * Platform Mapping Service
 * Handles business logic for platform mappings
 */
class PlatformMappingService {
  constructor ({
    platformMappingRepository,
    telegramBotRepository,
    chatwootAccountRepository,
    difyAppRepository,
    telegramService,
    chatwootService,
    difyService,
    logger
  }) {
    this.platformMappingRepository = platformMappingRepository
    this.telegramBotRepository = telegramBotRepository
    this.chatwootAccountRepository = chatwootAccountRepository
    this.difyAppRepository = difyAppRepository
    this.telegramService = telegramService
    this.chatwootService = chatwootService
    this.difyService = difyService
    this.logger = logger
  }

  /**
   * Create a new platform mapping
   * @param {Object} mappingData - Mapping data
   * @param {Object} user - User object
   * @returns {Promise<Object>} - Created mapping
   */
  async createMapping (mappingData, user) {
    try {
      // Generic payload only (v2 schema)
      const {
        sourcePlatform,
        sourceId,
        targetPlatform,
        targetId,
        enableBidirectional = false,
        isActive = true,
        name
      } = mappingData

      const normalized = { sourcePlatform, sourceId, targetPlatform, targetId, enableBidirectional, isActive, name }
      if (!sourcePlatform || !sourceId || !targetPlatform || !targetId) {
        throw new Error('Missing required fields: sourcePlatform, sourceId, targetPlatform, targetId')
      }

      // Validate platforms (basic active checks using existing repos where applicable)
      await this.validateByGeneric(normalized)

      // Check if identical mapping already exists
      const exists = await this.platformMappingRepository.existsByPair(
        normalized.sourcePlatform,
        normalized.sourceId,
        normalized.targetPlatform,
        normalized.targetId
      )

      if (exists) {
        throw new Error('Mapping already exists for this source/target pair')
      }

      // Create the mapping
      const mapping = await this.platformMappingRepository.create({
        sourcePlatform: normalized.sourcePlatform,
        sourceId: normalized.sourceId,
        targetPlatform: normalized.targetPlatform,
        targetId: normalized.targetId,
        enableBidirectional: normalized.enableBidirectional,
        isActive: normalized.isActive,
        name
      }, user)

      this.logger.info('Platform mapping created successfully', {
        mappingId: mapping.id,
        sourcePlatform: normalized.sourcePlatform,
        sourceId: normalized.sourceId,
        targetPlatform: normalized.targetPlatform,
        targetId: normalized.targetId,
        userId: user?.id
      })

      // Auto-register webhooks if needed
      try {
        await this.registerWebhooksForMapping(mapping)
      } catch (error) {
        this.logger.warn('Failed to register webhooks for mapping', {
          mappingId: mapping.id,
          error: error.message
        })
        // Don't fail the mapping creation if webhook registration fails
      }

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
  async getAllMappings (filters = {}) {
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
  async getMappingsByTelegramBot (telegramBotId) {
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
  async getMappingsByChatwootAccount (chatwootAccountId) {
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
  async getMappingsByDifyApp (difyAppId) {
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
  async updateMapping (mappingId, updateData, user) {
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
  async deleteMapping (mappingId, user) {
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
  async getActiveMapping (telegramBotId, chatwootAccountId, difyAppId) {
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
  async getRoutingConfiguration (telegramBotId) {
    try {
      // v2: find routes where source=telegram/botId or bidirectional target
      const routes = await this.platformMappingRepository.findRoutesFor('telegram', telegramBotId)

      if (routes.length === 0) {
        return {
          hasMapping: false,
          mappings: []
        }
      }

      // Group mappings by configuration
      const routingConfig = {
        hasMapping: true,
        mappings: routes.map(r => ({
          id: r.id,
          telegramBotId: telegramBotId,
          chatwootAccountId: r.target_platform === 'chatwoot' ? r.target_id : (r.source_platform === 'chatwoot' ? r.source_id : null),
          difyAppId: r.target_platform === 'dify' ? r.target_id : (r.source_platform === 'dify' ? r.source_id : null),
          routing: {
            telegramToChatwoot: (r.source_platform === 'telegram' && r.target_platform === 'chatwoot'),
            telegramToDify: (r.source_platform === 'telegram' && r.target_platform === 'dify'),
            chatwootToTelegram: (r.enable_bidirectional && ((r.source_platform === 'chatwoot' && r.target_platform === 'telegram') || (r.source_platform === 'telegram' && r.target_platform === 'chatwoot'))),
            difyToChatwoot: (r.enable_bidirectional && ((r.source_platform === 'dify' && r.target_platform === 'chatwoot') || (r.source_platform === 'chatwoot' && r.target_platform === 'dify'))),
            difyToTelegram: (r.enable_bidirectional && ((r.source_platform === 'dify' && r.target_platform === 'telegram') || (r.source_platform === 'telegram' && r.target_platform === 'dify')))
          },
          autoConnect: {
            telegramChatwoot: false,
            telegramDify: false
          }
        }))
      }

      this.logger.info('Retrieved routing configuration', {
        telegramBotId,
        mappingCount: routes.length
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
  async getRoutingConfigurationByChatwootExternalAccountId (chatwootExternalAccountId) {
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
  async validatePlatforms (telegramBotId, chatwootAccountId, difyAppId) {
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
   * Validate generic source/target platforms
   */
  async validateByGeneric ({ sourcePlatform, sourceId, targetPlatform, targetId }) {
    const platform = (p) => (p || '').toLowerCase()
    // Validate source
    if (platform(sourcePlatform) === 'telegram') {
      const bot = await this.telegramBotRepository.findById(sourceId)
      if (!bot || !bot.is_active) throw new Error('Source Telegram bot not found or inactive')
    } else if (platform(sourcePlatform) === 'chatwoot') {
      const acc = await this.chatwootAccountRepository.findById(sourceId)
      if (!acc || !acc.is_active) throw new Error('Source Chatwoot account not found or inactive')
    } else if (platform(sourcePlatform) === 'dify') {
      const app = await this.difyAppRepository.findById(sourceId)
      if (!app || !app.is_active) throw new Error('Source Dify app not found or inactive')
    } else {
      throw new Error(`Unsupported source platform: ${sourcePlatform}`)
    }

    // Validate target
    if (platform(targetPlatform) === 'telegram') {
      const bot = await this.telegramBotRepository.findById(targetId)
      if (!bot || !bot.is_active) throw new Error('Target Telegram bot not found or inactive')
    } else if (platform(targetPlatform) === 'chatwoot') {
      const acc = await this.chatwootAccountRepository.findById(targetId)
      if (!acc || !acc.is_active) throw new Error('Target Chatwoot account not found or inactive')
    } else if (platform(targetPlatform) === 'dify') {
      const app = await this.difyAppRepository.findById(targetId)
      if (!app || !app.is_active) throw new Error('Target Dify app not found or inactive')
    } else {
      throw new Error(`Unsupported target platform: ${targetPlatform}`)
    }
  }

  /**
   * Get available platforms for mapping
   * @returns {Promise<Object>} - Available platforms
   */
  async getAvailablePlatforms () {
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
  async getPlatformRoutingConfiguration (platformType, platformId) {
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
   * Test Telegram bot connection
   * @param {Object} telegramBot - Telegram bot data
   * @returns {Promise<Object>} - Test result
   */
  async testTelegramConnection (telegramBot) {
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
  async testChatwootConnection (chatwootAccount) {
    try {
      const axios = require('axios')

      // Use the exact headers that work from browser
      const headers = {
        'access-token': 'fsAasUTFZpJBWS7C-gFGYw',
        client: 'ucC86ODq5-izqrwaa54EBw',
        uid: 'thuanpt.work@gmail.com',
        authorization: `Bearer ${chatwootAccount.access_token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*'
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
  async testDifyConnection (difyApp) {
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
          Authorization: `Bearer ${difyApp.api_key}`,
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


  /**
   * Test source to target connection
   * @param {Object} mapping - Platform mapping
   * @returns {Promise<Object>} - Test result
   */
  async testSourceToTargetFlow (mapping) {
    try {
      this.logger.info('Testing source to target connection', {
        mappingId: mapping.id,
        sourcePlatform: mapping.source_platform,
        targetPlatform: mapping.target_platform,
        sourceId: mapping.source_id,
        targetId: mapping.target_id
      })

      // Get source account info for context
      let sourceAccount = null
      if (mapping.source_platform === 'telegram') {
        sourceAccount = await this.telegramBotRepository.findById(mapping.source_id)
      } else if (mapping.source_platform === 'dify') {
        sourceAccount = await this.difyAppRepository.findById(mapping.source_id)
      } else if (mapping.source_platform === 'chatwoot') {
        sourceAccount = await this.chatwootAccountRepository.findById(mapping.source_id)
      }

      // Check target platform connection
      let targetResult = null
      if (mapping.target_platform === 'telegram') {
        const telegramBot = await this.telegramBotRepository.findById(mapping.target_id)
        if (telegramBot) {
          const isActive = telegramBot.is_active === true || telegramBot.is_active === 't'
          if (!isActive) {
            targetResult = {
              success: false,
              error: `Telegram bot "${telegramBot.name}" is inactive`,
              botInfo: {
                id: telegramBot.id,
                name: telegramBot.name,
                isActive: false
              }
            }
          } else {
            // Test actual Telegram API connection
            const connectionTest = await this.testTelegramConnection(telegramBot)
            
            if (connectionTest.success) {
              targetResult = {
                success: true,
                message: `Telegram bot "${telegramBot.name}" connection successful`,
                botInfo: {
                  id: telegramBot.id,
                  name: telegramBot.name,
                  isActive: true,
                  apiUrl: telegramBot.api_url,
                  webhookUrl: telegramBot.webhook_url,
                  botToken: telegramBot.bot_token ? '***' + telegramBot.bot_token.slice(-4) : 'not set',
                  telegramBotInfo: connectionTest.botInfo
                }
              }
            } else {
              targetResult = {
                success: false,
                error: `Telegram API connection failed: ${connectionTest.error}`,
                botInfo: {
                  id: telegramBot.id,
                  name: telegramBot.name,
                  isActive: true,
                  apiUrl: telegramBot.api_url,
                  webhookUrl: telegramBot.webhook_url,
                  botToken: telegramBot.bot_token ? '***' + telegramBot.bot_token.slice(-4) : 'not set'
                },
                details: connectionTest.details
              }
            }
          }
        } else {
          targetResult = {
            success: false,
            error: `Target Telegram bot with ID ${mapping.target_id} not found`
          }
        }
      } else if (mapping.target_platform === 'dify') {
        const difyApp = await this.difyAppRepository.findById(mapping.target_id)
        if (difyApp) {
          const isActive = difyApp.is_active === true || difyApp.is_active === 't'
          if (!isActive) {
            targetResult = {
              success: false,
              error: `Dify app "${difyApp.name}" is inactive`,
              appInfo: {
                id: difyApp.id,
                name: difyApp.name,
                appId: difyApp.app_id,
                isActive: false
              }
            }
          } else {
            // Test actual Dify API connection
            const connectionTest = await this.testDifyConnection(difyApp)
            
            if (connectionTest.success) {
              targetResult = {
                success: true,
                message: `Dify app "${difyApp.name}" connection successful`,
                appInfo: {
                  id: difyApp.id,
                  name: difyApp.name,
                  appId: difyApp.app_id,
                  isActive: true,
                  apiUrl: difyApp.api_url,
                  apiKey: difyApp.api_key ? '***' + difyApp.api_key.slice(-4) : 'not set',
                  difyAppInfo: connectionTest.appInfo
                }
              }
            } else {
              targetResult = {
                success: false,
                error: `Dify API connection failed: ${connectionTest.error}`,
                appInfo: {
                  id: difyApp.id,
                  name: difyApp.name,
                  appId: difyApp.app_id,
                  isActive: true,
                  apiUrl: difyApp.api_url,
                  apiKey: difyApp.api_key ? '***' + difyApp.api_key.slice(-4) : 'not set'
                },
                details: connectionTest.details
              }
            }
          }
        } else {
          targetResult = {
            success: false,
            error: `Target Dify app with ID ${mapping.target_id} not found`
          }
        }
      } else if (mapping.target_platform === 'chatwoot') {
        const chatwootAccount = await this.chatwootAccountRepository.findById(mapping.target_id)
        if (chatwootAccount) {
          const isActive = chatwootAccount.is_active === true || chatwootAccount.is_active === 't'
          if (!isActive) {
            targetResult = {
              success: false,
              error: `Chatwoot account "${chatwootAccount.name}" is inactive`,
              accountInfo: {
                id: chatwootAccount.id,
                name: chatwootAccount.name,
                accountId: chatwootAccount.account_id,
                isActive: false
              }
            }
          } else {
            // Test actual Chatwoot API connection
            const connectionTest = await this.testChatwootConnection(chatwootAccount)
            
            if (connectionTest.success) {
              targetResult = {
                success: true,
                message: `Chatwoot account "${chatwootAccount.name}" connection successful`,
                accountInfo: {
                  id: chatwootAccount.id,
                  name: chatwootAccount.name,
                  accountId: chatwootAccount.account_id,
                  isActive: true,
                  baseUrl: chatwootAccount.base_url,
                  accessToken: chatwootAccount.access_token ? '***' + chatwootAccount.access_token.slice(-4) : 'not set',
                  chatwootAccountInfo: connectionTest.accountInfo
                }
              }
            } else {
              targetResult = {
                success: false,
                error: `Chatwoot API connection failed: ${connectionTest.error}`,
                accountInfo: {
                  id: chatwootAccount.id,
                  name: chatwootAccount.name,
                  accountId: chatwootAccount.account_id,
                  isActive: true,
                  baseUrl: chatwootAccount.base_url,
                  accessToken: chatwootAccount.access_token ? '***' + chatwootAccount.access_token.slice(-4) : 'not set'
                },
                details: connectionTest.details
              }
            }
          }
        } else {
          targetResult = {
            success: false,
            error: `Target Chatwoot account with ID ${mapping.target_id} not found`
          }
        }
      } else {
        targetResult = {
          success: false,
          error: `Platform "${mapping.target_platform}" chưa được triển khai. Hiện tại chỉ hỗ trợ Telegram, Dify và Chatwoot.`
        }
      }

      return {
        success: targetResult?.success || false,
        message: targetResult?.message || 'Source to target connection test completed',
        error: targetResult?.error,
        details: targetResult,
        flow: 'source_to_target',
        sourcePlatform: mapping.source_platform,
        targetPlatform: mapping.target_platform
      }
    } catch (error) {
      this.logger.error('Source to target flow test failed', {
        error: error.message,
        mappingId: mapping.id
      })
      return {
        success: false,
        error: error.message,
        flow: 'source_to_target'
      }
    }
  }

  /**
   * Test target to source connection (bidirectional)
   * @param {Object} mapping - Platform mapping
   * @returns {Promise<Object>} - Test result
   */
  async testTargetToSourceFlow (mapping) {
    try {
      this.logger.info('Testing target to source connection', {
        mappingId: mapping.id,
        sourcePlatform: mapping.source_platform,
        targetPlatform: mapping.target_platform,
        sourceId: mapping.source_id,
        targetId: mapping.target_id
      })

      // Get target account info for context (reverse direction)
      let targetAccount = null
      if (mapping.target_platform === 'telegram') {
        targetAccount = await this.telegramBotRepository.findById(mapping.target_id)
      } else if (mapping.target_platform === 'dify') {
        targetAccount = await this.difyAppRepository.findById(mapping.target_id)
      } else if (mapping.target_platform === 'chatwoot') {
        targetAccount = await this.chatwootAccountRepository.findById(mapping.target_id)
      }

      // Check source platform connection (bidirectional)
      let sourceResult = null
      if (mapping.source_platform === 'telegram') {
        const telegramBot = await this.telegramBotRepository.findById(mapping.source_id)
        if (telegramBot) {
          const isActive = telegramBot.is_active === true || telegramBot.is_active === 't'
          if (!isActive) {
            sourceResult = {
              success: false,
              error: `Telegram bot "${telegramBot.name}" is inactive`,
              botInfo: {
                id: telegramBot.id,
                name: telegramBot.name,
                isActive: false
              }
            }
          } else {
            // Test actual Telegram API connection
            const connectionTest = await this.testTelegramConnection(telegramBot)
            
            if (connectionTest.success) {
              sourceResult = {
                success: true,
                message: `Telegram bot "${telegramBot.name}" connection successful`,
                botInfo: {
                  id: telegramBot.id,
                  name: telegramBot.name,
                  isActive: true,
                  apiUrl: telegramBot.api_url,
                  webhookUrl: telegramBot.webhook_url,
                  botToken: telegramBot.bot_token ? '***' + telegramBot.bot_token.slice(-4) : 'not set',
                  telegramBotInfo: connectionTest.botInfo
                }
              }
            } else {
              sourceResult = {
                success: false,
                error: `Telegram API connection failed: ${connectionTest.error}`,
                botInfo: {
                  id: telegramBot.id,
                  name: telegramBot.name,
                  isActive: true,
                  apiUrl: telegramBot.api_url,
                  webhookUrl: telegramBot.webhook_url,
                  botToken: telegramBot.bot_token ? '***' + telegramBot.bot_token.slice(-4) : 'not set'
                },
                details: connectionTest.details
              }
            }
          }
        } else {
          sourceResult = {
            success: false,
            error: `Source Telegram bot with ID ${mapping.source_id} not found`
          }
        }
      } else if (mapping.source_platform === 'dify') {
        const difyApp = await this.difyAppRepository.findById(mapping.source_id)
        if (difyApp) {
          const isActive = difyApp.is_active === true || difyApp.is_active === 't'
          if (!isActive) {
            sourceResult = {
              success: false,
              error: `Dify app "${difyApp.name}" is inactive`,
              appInfo: {
                id: difyApp.id,
                name: difyApp.name,
                appId: difyApp.app_id,
                isActive: false
              }
            }
          } else {
            // Test actual Dify API connection
            const connectionTest = await this.testDifyConnection(difyApp)
            
            if (connectionTest.success) {
              sourceResult = {
                success: true,
                message: `Dify app "${difyApp.name}" connection successful`,
                appInfo: {
                  id: difyApp.id,
                  name: difyApp.name,
                  appId: difyApp.app_id,
                  isActive: true,
                  apiUrl: difyApp.api_url,
                  apiKey: difyApp.api_key ? '***' + difyApp.api_key.slice(-4) : 'not set',
                  difyAppInfo: connectionTest.appInfo
                }
              }
            } else {
              sourceResult = {
                success: false,
                error: `Dify API connection failed: ${connectionTest.error}`,
                appInfo: {
                  id: difyApp.id,
                  name: difyApp.name,
                  appId: difyApp.app_id,
                  isActive: true,
                  apiUrl: difyApp.api_url,
                  apiKey: difyApp.api_key ? '***' + difyApp.api_key.slice(-4) : 'not set'
                },
                details: connectionTest.details
              }
            }
          }
        } else {
          sourceResult = {
            success: false,
            error: `Source Dify app with ID ${mapping.source_id} not found`
          }
        }
      } else if (mapping.source_platform === 'chatwoot') {
        const chatwootAccount = await this.chatwootAccountRepository.findById(mapping.source_id)
        if (chatwootAccount) {
          const isActive = chatwootAccount.is_active === true || chatwootAccount.is_active === 't'
          if (!isActive) {
            sourceResult = {
              success: false,
              error: `Chatwoot account "${chatwootAccount.name}" is inactive`,
              accountInfo: {
                id: chatwootAccount.id,
                name: chatwootAccount.name,
                accountId: chatwootAccount.account_id,
                isActive: false
              }
            }
          } else {
            // Test actual Chatwoot API connection
            const connectionTest = await this.testChatwootConnection(chatwootAccount)
            
            if (connectionTest.success) {
              sourceResult = {
                success: true,
                message: `Chatwoot account "${chatwootAccount.name}" connection successful`,
                accountInfo: {
                  id: chatwootAccount.id,
                  name: chatwootAccount.name,
                  accountId: chatwootAccount.account_id,
                  isActive: true,
                  baseUrl: chatwootAccount.base_url,
                  accessToken: chatwootAccount.access_token ? '***' + chatwootAccount.access_token.slice(-4) : 'not set',
                  chatwootAccountInfo: connectionTest.accountInfo
                }
              }
            } else {
              sourceResult = {
                success: false,
                error: `Chatwoot API connection failed: ${connectionTest.error}`,
                accountInfo: {
                  id: chatwootAccount.id,
                  name: chatwootAccount.name,
                  accountId: chatwootAccount.account_id,
                  isActive: true,
                  baseUrl: chatwootAccount.base_url,
                  accessToken: chatwootAccount.access_token ? '***' + chatwootAccount.access_token.slice(-4) : 'not set'
                },
                details: connectionTest.details
              }
            }
          }
        } else {
          sourceResult = {
            success: false,
            error: `Source Chatwoot account with ID ${mapping.source_id} not found`
          }
        }
      } else {
        sourceResult = {
          success: false,
          error: `Platform "${mapping.source_platform}" chưa được triển khai. Hiện tại chỉ hỗ trợ Telegram, Dify và Chatwoot.`
        }
      }

      return {
        success: sourceResult?.success || false,
        message: sourceResult?.message || 'Target to source connection test completed',
        error: sourceResult?.error,
        details: sourceResult,
        flow: 'target_to_source',
        sourcePlatform: mapping.source_platform,
        targetPlatform: mapping.target_platform
      }
    } catch (error) {
      this.logger.error('Target to source connection test failed', {
        error: error.message,
        mappingId: mapping.id
      })
      return {
        success: false,
        error: error.message,
        flow: 'target_to_source'
      }
    }
  }

  /**
   * Register webhooks for a platform mapping
   * @param {Object} mapping - Platform mapping
   * @returns {Promise<void>}
   */
  async registerWebhooksForMapping (mapping) {
    try {
      this.logger.info('Registering webhooks for platform mapping', {
        mappingId: mapping.id,
        sourcePlatform: mapping.source_platform,
        targetPlatform: mapping.target_platform
      })

      // Get webhook base URL from configuration
      const webhookBaseUrl = await this.getWebhookBaseUrl()
      if (!webhookBaseUrl) {
        this.logger.warn('No webhook base URL configured, skipping webhook registration')
        return
      }

      const results = []

      // Register Telegram webhook if source is Telegram
      if (mapping.source_platform === 'telegram') {
        try {
          const telegramBot = await this.telegramBotRepository.findById(mapping.source_id)
          if (telegramBot && telegramBot.is_active) {
            const webhookUrl = `${webhookBaseUrl}/webhook/telegram`
            await this.registerTelegramWebhook(telegramBot, webhookUrl)
            results.push({
              platform: 'telegram',
              type: 'source',
              success: true,
              webhookUrl
            })
          }
        } catch (error) {
          this.logger.error('Failed to register Telegram webhook for source', {
            mappingId: mapping.id,
            error: error.message
          })
          results.push({
            platform: 'telegram',
            type: 'source',
            success: false,
            error: error.message
          })
        }
      }

      // Register Telegram webhook if target is Telegram and bidirectional is enabled
      if (mapping.target_platform === 'telegram' && mapping.enable_bidirectional) {
        try {
          const telegramBot = await this.telegramBotRepository.findById(mapping.target_id)
          if (telegramBot && telegramBot.is_active) {
            const webhookUrl = `${webhookBaseUrl}/webhook/telegram`
            await this.registerTelegramWebhook(telegramBot, webhookUrl)
            results.push({
              platform: 'telegram',
              type: 'target',
              success: true,
              webhookUrl
            })
          }
        } catch (error) {
          this.logger.error('Failed to register Telegram webhook for target', {
            mappingId: mapping.id,
            error: error.message
          })
          results.push({
            platform: 'telegram',
            type: 'target',
            success: false,
            error: error.message
          })
        }
      }

      // Register Chatwoot webhook if source is Chatwoot
      if (mapping.source_platform === 'chatwoot') {
        try {
          const chatwootAccount = await this.chatwootAccountRepository.findById(mapping.source_id)
          if (chatwootAccount && chatwootAccount.is_active) {
            const webhookUrl = `${webhookBaseUrl}/webhook/chatwoot`
            await this.registerChatwootWebhook(chatwootAccount, webhookUrl)
            results.push({
              platform: 'chatwoot',
              type: 'source',
              success: true,
              webhookUrl
            })
          }
        } catch (error) {
          this.logger.error('Failed to register Chatwoot webhook for source', {
            mappingId: mapping.id,
            error: error.message
          })
          results.push({
            platform: 'chatwoot',
            type: 'source',
            success: false,
            error: error.message
          })
        }
      }

      // Register Chatwoot webhook if target is Chatwoot and bidirectional is enabled
      if (mapping.target_platform === 'chatwoot' && mapping.enable_bidirectional) {
        try {
          const chatwootAccount = await this.chatwootAccountRepository.findById(mapping.target_id)
          if (chatwootAccount && chatwootAccount.is_active) {
            const webhookUrl = `${webhookBaseUrl}/webhook/chatwoot`
            await this.registerChatwootWebhook(chatwootAccount, webhookUrl)
            results.push({
              platform: 'chatwoot',
              type: 'target',
              success: true,
              webhookUrl
            })
          }
        } catch (error) {
          this.logger.error('Failed to register Chatwoot webhook for target', {
            mappingId: mapping.id,
            error: error.message
          })
          results.push({
            platform: 'chatwoot',
            type: 'target',
            success: false,
            error: error.message
          })
        }
      }

      this.logger.info('Webhook registration completed for platform mapping', {
        mappingId: mapping.id,
        results
      })

    } catch (error) {
      this.logger.error('Failed to register webhooks for platform mapping', {
        mappingId: mapping.id,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Get webhook base URL from configuration
   * @returns {Promise<string|null>}
   */
  async getWebhookBaseUrl () {
    try {
      // Try to get from environment variables first
      if (process.env.WEBHOOK_BASE_URL) {
        return process.env.WEBHOOK_BASE_URL
      }

      // Try to get from configuration service
      const config = await this.configurationService?.get('webhook.baseUrl')
      if (config) {
        return config
      }

      // Fallback to localhost for development
      const port = process.env.PORT || 3000
      return `http://localhost:${port}`
    } catch (error) {
      this.logger.warn('Failed to get webhook base URL', { error: error.message })
      return null
    }
  }

  /**
   * Register Telegram webhook
   * @param {Object} telegramBot - Telegram bot
   * @param {string} webhookUrl - Webhook URL
   * @returns {Promise<void>}
   */
  async registerTelegramWebhook (telegramBot, webhookUrl) {
    try {
      const axios = require('axios')
      
      const payload = {
        url: webhookUrl,
        allowed_updates: ['message'],
        secret_token: telegramBot.secret_token || undefined
      }

      const baseApiUrl = telegramBot.api_url || 'https://api.telegram.org'
      const response = await axios.post(
        `${baseApiUrl}/bot${telegramBot.bot_token}/setWebhook`,
        payload,
        { timeout: 10000 }
      )

      if (response.data.ok) {
        this.logger.info('Telegram webhook registered successfully', {
          botId: telegramBot.id,
          webhookUrl
        })
      } else {
        throw new Error(`Telegram API error: ${response.data.description}`)
      }
    } catch (error) {
      this.logger.error('Failed to register Telegram webhook', {
        botId: telegramBot.id,
        webhookUrl,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Register Chatwoot webhook
   * @param {Object} chatwootAccount - Chatwoot account
   * @param {string} webhookUrl - Webhook URL
   * @returns {Promise<void>}
   */
  async registerChatwootWebhook (chatwootAccount, webhookUrl) {
    try {
      const axios = require('axios')

      const headers = {
        'access-token': 'fsAasUTFZpJBWS7C-gFGYw',
        client: 'ucC86ODq5-izqrwaa54EBw',
        uid: 'thuanpt.work@gmail.com',
        authorization: `Bearer ${chatwootAccount.access_token}`,
        'Content-Type': 'application/json'
      }

      // Create webhook in Chatwoot
      const payload = {
        webhook_url: webhookUrl,
        subscriptions: ['message_created', 'conversation_created']
      }

      const response = await axios.post(
        `${chatwootAccount.base_url}/api/v1/accounts/${chatwootAccount.account_id}/webhooks`,
        payload,
        { headers, timeout: 10000 }
      )

      if (response.data) {
        this.logger.info('Chatwoot webhook registered successfully', {
          accountId: chatwootAccount.id,
          webhookUrl,
          webhookId: response.data.id
        })
      } else {
        throw new Error('Chatwoot API returned empty response')
      }
    } catch (error) {
      this.logger.error('Failed to register Chatwoot webhook', {
        accountId: chatwootAccount.id,
        webhookUrl,
        error: error.message
      })
      throw error
    }
  }
}

module.exports = PlatformMappingService
