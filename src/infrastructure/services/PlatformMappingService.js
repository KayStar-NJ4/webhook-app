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
}

module.exports = PlatformMappingService
