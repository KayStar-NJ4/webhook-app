/**
 * Configuration Controller - Presentation layer
 * Handles multi-platform configuration management
 */
class ConfigurationController {
  constructor ({
    userRepository,
    chatwootAccountRepository,
    telegramBotRepository,
    difyAppRepository,
    configurationRepository,
    logger
  }) {
    this.userRepository = userRepository
    this.chatwootAccountRepository = chatwootAccountRepository
    this.telegramBotRepository = telegramBotRepository
    this.difyAppRepository = difyAppRepository
    this.configurationRepository = configurationRepository
    this.logger = logger
  }

  /**
   * Get user configurations
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getUserConfigurations (req, res) {
    try {
      const userId = req.user.userId

      // Get user's assigned configurations
      const query = `
        SELECT 
          uc.id,
          uc.user_id,
          uc.chatwoot_account_id,
          uc.telegram_bot_ids,
          uc.dify_app_ids,
          uc.is_active,
          uc.created_at,
          uc.updated_at,
          ca.name as chatwoot_account_name,
          ca.base_url as chatwoot_base_url,
          ca.account_id as chatwoot_account_id_value
        FROM user_configurations uc
        LEFT JOIN chatwoot_accounts ca ON uc.chatwoot_account_id = ca.id
        WHERE uc.user_id = $1
        ORDER BY uc.created_at DESC
      `

      const result = await this.userRepository.db.query(query, [userId])

      const configurations = result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        chatwootAccount: {
          id: row.chatwoot_account_id,
          name: row.chatwoot_account_name,
          baseUrl: row.chatwoot_base_url,
          accountId: row.chatwoot_account_id_value
        },
        telegramBotIds: row.telegram_bot_ids || [],
        difyAppIds: row.dify_app_ids || [],
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))

      res.json({
        success: true,
        data: configurations
      })
    } catch (error) {
      this.logger.error('Get user configurations failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Create user configuration
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async createUserConfiguration (req, res) {
    try {
      const userId = req.user.userId
      const { chatwootAccountId, telegramBotIds = [], difyAppIds = [] } = req.body

      if (!chatwootAccountId) {
        return res.status(400).json({
          success: false,
          message: 'Chatwoot account ID is required'
        })
      }

      // Verify chatwoot account exists
      const chatwootAccount = await this.chatwootAccountRepository.findById(chatwootAccountId)
      if (!chatwootAccount) {
        return res.status(404).json({
          success: false,
          message: 'Chatwoot account not found'
        })
      }

      // Verify telegram bots exist
      if (telegramBotIds.length > 0) {
        for (const botId of telegramBotIds) {
          const bot = await this.telegramBotRepository.findById(botId)
          if (!bot) {
            return res.status(404).json({
              success: false,
              message: `Telegram bot with ID ${botId} not found`
            })
          }
        }
      }

      // Verify dify apps exist
      if (difyAppIds.length > 0) {
        for (const appId of difyAppIds) {
          const app = await this.difyAppRepository.findById(appId)
          if (!app) {
            return res.status(404).json({
              success: false,
              message: `Dify app with ID ${appId} not found`
            })
          }
        }
      }

      // Create user configuration
      const query = `
        INSERT INTO user_configurations (user_id, chatwoot_account_id, telegram_bot_ids, dify_app_ids)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `

      const result = await this.userRepository.db.query(query, [
        userId,
        chatwootAccountId,
        telegramBotIds,
        difyAppIds
      ])

      res.status(201).json({
        success: true,
        message: 'Configuration created successfully',
        data: result.rows[0]
      })
    } catch (error) {
      this.logger.error('Create user configuration failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Update user configuration
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async updateUserConfiguration (req, res) {
    try {
      const { id } = req.params
      const userId = req.user.userId
      const { chatwootAccountId, telegramBotIds, difyAppIds, isActive } = req.body

      // Verify configuration belongs to user
      const query = `
        UPDATE user_configurations 
        SET 
          chatwoot_account_id = COALESCE($1, chatwoot_account_id),
          telegram_bot_ids = COALESCE($2, telegram_bot_ids),
          dify_app_ids = COALESCE($3, dify_app_ids),
          is_active = COALESCE($4, is_active),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5 AND user_id = $6
        RETURNING *
      `

      const result = await this.userRepository.db.query(query, [
        chatwootAccountId,
        telegramBotIds,
        difyAppIds,
        isActive,
        id,
        userId
      ])

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Configuration not found or access denied'
        })
      }

      res.json({
        success: true,
        message: 'Configuration updated successfully',
        data: result.rows[0]
      })
    } catch (error) {
      this.logger.error('Update user configuration failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Delete user configuration
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async deleteUserConfiguration (req, res) {
    try {
      const { id } = req.params
      const userId = req.user.userId

      const query = `
        DELETE FROM user_configurations 
        WHERE id = $1 AND user_id = $2
      `

      const result = await this.userRepository.db.query(query, [id, userId])

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Configuration not found or access denied'
        })
      }

      res.json({
        success: true,
        message: 'Configuration deleted successfully'
      })
    } catch (error) {
      this.logger.error('Delete user configuration failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Get available resources for configuration
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getAvailableResources (req, res) {
    try {
      const [chatwootAccounts, telegramBots, difyApps] = await Promise.all([
        this.chatwootAccountRepository.findAll({ page: 1, limit: 1000 }),
        this.telegramBotRepository.findAll({ page: 1, limit: 1000 }),
        this.difyAppRepository.findAll({ page: 1, limit: 1000 })
      ])

      res.json({
        success: true,
        data: {
          chatwootAccounts: chatwootAccounts.accounts || chatwootAccounts,
          telegramBots: telegramBots.bots || telegramBots,
          difyApps: difyApps.apps || difyApps
        }
      })
    } catch (error) {
      this.logger.error('Get available resources failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Get system configurations
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getSystemConfigurations (req, res) {
    try {
      const configurations = await this.configurationRepository.findAll()

      res.json({
        success: true,
        data: configurations
      })
    } catch (error) {
      this.logger.error('Get system configurations failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Get system configuration by key
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getSystemConfigurationByKey (req, res) {
    try {
      const { key } = req.params
      const configuration = await this.configurationRepository.findByKey(key)

      if (!configuration) {
        return res.status(404).json({
          success: false,
          message: 'Configuration not found'
        })
      }

      res.json({
        success: true,
        data: configuration
      })
    } catch (error) {
      this.logger.error('Get system configuration by key failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Update system configuration
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async updateSystemConfiguration (req, res) {
    try {
      const { key, value, type, description } = req.body

      if (!key || value === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Key and value are required'
        })
      }

      // Validate value based on type
      let validatedValue = value
      if (type === 'number') {
        validatedValue = Number(value)
        if (isNaN(validatedValue)) {
          return res.status(400).json({
            success: false,
            message: 'Value must be a valid number'
          })
        }
      } else if (type === 'boolean') {
        if (value === 'true' || value === true) {
          validatedValue = true
        } else if (value === 'false' || value === false) {
          validatedValue = false
        } else {
          return res.status(400).json({
            success: false,
            message: 'Boolean value must be true or false'
          })
        }
      } else if (type === 'json') {
        try {
          validatedValue = JSON.parse(value)
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: 'Value must be valid JSON'
          })
        }
      }

      const configuration = await this.configurationRepository.upsert(key, validatedValue, type, description)

      res.json({
        success: true,
        message: 'Configuration updated successfully',
        data: configuration
      })
    } catch (error) {
      this.logger.error('Update system configuration failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Delete system configuration
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async deleteSystemConfiguration (req, res) {
    try {
      const { id } = req.params

      const result = await this.configurationRepository.deleteById(id)

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Configuration not found'
        })
      }

      res.json({
        success: true,
        message: 'Configuration deleted successfully'
      })
    } catch (error) {
      this.logger.error('Delete system configuration failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }

  /**
   * Test configuration connection
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async testConfiguration (req, res) {
    try {
      const { type, id } = req.params

      let result = { success: false, message: 'Unknown configuration type' }

      switch (type) {
        case 'chatwoot':
          const chatwootAccount = await this.chatwootAccountRepository.findById(id)
          if (chatwootAccount) {
            // Test Chatwoot connection
            result = { success: true, message: 'Chatwoot connection test not implemented' }
          } else {
            result = { success: false, message: 'Chatwoot account not found' }
          }
          break

        case 'telegram':
          const telegramBot = await this.telegramBotRepository.findById(id)
          if (telegramBot) {
            // Test Telegram connection
            result = { success: true, message: 'Telegram connection test not implemented' }
          } else {
            result = { success: false, message: 'Telegram bot not found' }
          }
          break

        case 'dify':
          const difyApp = await this.difyAppRepository.findById(id)
          if (difyApp) {
            // Test Dify connection
            result = { success: true, message: 'Dify connection test not implemented' }
          } else {
            result = { success: false, message: 'Dify app not found' }
          }
          break

        default:
          result = { success: false, message: 'Invalid configuration type' }
      }

      res.json({
        success: result.success,
        message: result.message
      })
    } catch (error) {
      this.logger.error('Test configuration failed', { error: error.message })
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      })
    }
  }
}

module.exports = ConfigurationController
