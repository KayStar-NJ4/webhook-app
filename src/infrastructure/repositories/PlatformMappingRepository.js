const BaseRepository = require('./BaseRepository')

/**
 * Platform Mapping Repository
 * Handles database operations for platform mappings
 */
class PlatformMappingRepository extends BaseRepository {
  constructor ({ db, logger }) {
    super({ db, logger, tableName: 'platform_mappings' })
    this.db = db
    this.logger = logger
  }

  /**
   * Get all selectable fields for queries
   * @returns {Array} - Array of selectable fields
   */
  getSelectableFields () {
    return [
      'id', 'platform_type', 'platform_id', 'telegram_bot_id', 'chatwoot_account_id', 'dify_app_id',
      'enable_telegram_to_chatwoot', 'enable_telegram_to_dify',
      'enable_chatwoot_to_telegram', 'enable_dify_to_chatwoot', 'enable_dify_to_telegram',
      'auto_connect_telegram_chatwoot', 'auto_connect_telegram_dify',
      'is_active', 'created_by', 'created_at', 'updated_at'
    ]
  }

  /**
   * Create a new platform mapping
   * @param {Object} mappingData - Mapping data
   * @param {Object} user - User object (optional)
   * @returns {Promise<Object>} - Created mapping
   */
  async create (mappingData, user = null) {
    const {
      platformType = 'telegram',
      platformId,
      telegramBotId,
      chatwootAccountId,
      difyAppId,
      enableTelegramToChatwoot = true,
      enableTelegramToDify = true,
      enableChatwootToTelegram = true,
      enableDifyToChatwoot = true,
      enableDifyToTelegram = true,
      autoConnectTelegramChatwoot = true,
      autoConnectTelegramDify = true,
      isActive = true
    } = mappingData

    const data = {
      platform_type: platformType,
      platform_id: platformId,
      telegram_bot_id: platformType === 'telegram' ? telegramBotId : null,
      chatwoot_account_id: chatwootAccountId,
      dify_app_id: difyAppId,
      enable_telegram_to_chatwoot: enableTelegramToChatwoot,
      enable_telegram_to_dify: enableTelegramToDify,
      enable_chatwoot_to_telegram: enableChatwootToTelegram,
      enable_dify_to_chatwoot: enableDifyToChatwoot,
      enable_dify_to_telegram: enableDifyToTelegram,
      auto_connect_telegram_chatwoot: autoConnectTelegramChatwoot,
      auto_connect_telegram_dify: autoConnectTelegramDify,
      is_active: isActive
    }

    return super.create(data, user)
  }

  /**
   * Find mapping by Telegram bot ID
   * @param {number} telegramBotId - Telegram bot ID
   * @returns {Promise<Array>} - Array of mappings
   */
  async findByTelegramBotId (telegramBotId) {
    try {
      const query = `
        SELECT pm.*, 
               tb.name as telegram_bot_name,
               ca.name as chatwoot_account_name,
               da.name as dify_app_name
        FROM platform_mappings pm
        LEFT JOIN telegram_bots tb ON pm.telegram_bot_id = tb.id
        LEFT JOIN chatwoot_accounts ca ON pm.chatwoot_account_id = ca.id
        LEFT JOIN dify_apps da ON pm.dify_app_id = da.id
        WHERE pm.telegram_bot_id = $1 AND pm.is_active = true
        ORDER BY pm.created_at DESC
      `

      const result = await this.db.query(query, [telegramBotId])
      return result.rows
    } catch (error) {
      this.logger.error('Failed to find mappings by Telegram bot ID', {
        error: error.message,
        telegramBotId
      })
      throw error
    }
  }

  /**
   * Find mapping by platform type and ID (for future expansion: Zalo, Facebook, etc.)
   * @param {string} platformType - Platform type (telegram, zalo, facebook, etc.)
   * @param {number} platformId - Platform bot/account ID
   * @returns {Promise<Array>} - Array of mappings
   */
  async findByPlatformId (platformType, platformId) {
    try {
      const query = `
        SELECT pm.*, 
               tb.name as telegram_bot_name,
               ca.name as chatwoot_account_name,
               da.name as dify_app_name
        FROM platform_mappings pm
        LEFT JOIN telegram_bots tb ON pm.telegram_bot_id = tb.id
        LEFT JOIN chatwoot_accounts ca ON pm.chatwoot_account_id = ca.id
        LEFT JOIN dify_apps da ON pm.dify_app_id = da.id
        WHERE pm.platform_type = $1 AND pm.platform_id = $2 AND pm.is_active = true
        ORDER BY pm.created_at DESC
      `

      const result = await this.db.query(query, [platformType, platformId])
      return result.rows
    } catch (error) {
      this.logger.error('Failed to find mappings by platform ID', {
        error: error.message,
        platformType,
        platformId
      })
      throw error
    }
  }

  /**
   * Find mapping by Chatwoot account ID
   * @param {number} chatwootAccountId - Chatwoot account ID
   * @returns {Promise<Array>} - Array of mappings
   */
  async findByChatwootAccountId (chatwootAccountId) {
    try {
      const query = `
        SELECT pm.*, 
               tb.name as telegram_bot_name,
               ca.name as chatwoot_account_name,
               da.name as dify_app_name
        FROM platform_mappings pm
        LEFT JOIN telegram_bots tb ON pm.telegram_bot_id = tb.id
        LEFT JOIN chatwoot_accounts ca ON pm.chatwoot_account_id = ca.id
        LEFT JOIN dify_apps da ON pm.dify_app_id = da.id
        WHERE pm.chatwoot_account_id = $1 AND pm.is_active = true
        ORDER BY pm.created_at DESC
      `

      const result = await this.db.query(query, [chatwootAccountId])
      return result.rows
    } catch (error) {
      this.logger.error('Failed to find mappings by Chatwoot account ID', {
        error: error.message,
        chatwootAccountId
      })
      throw error
    }
  }

  /**
   * Find mapping by Dify app ID
   * @param {number} difyAppId - Dify app ID
   * @returns {Promise<Array>} - Array of mappings
   */
  async findByDifyAppId (difyAppId) {
    try {
      const query = `
        SELECT pm.*, 
               tb.name as telegram_bot_name,
               ca.name as chatwoot_account_name,
               da.name as dify_app_name
        FROM platform_mappings pm
        LEFT JOIN telegram_bots tb ON pm.telegram_bot_id = tb.id
        LEFT JOIN chatwoot_accounts ca ON pm.chatwoot_account_id = ca.id
        LEFT JOIN dify_apps da ON pm.dify_app_id = da.id
        WHERE pm.dify_app_id = $1 AND pm.is_active = true
        ORDER BY pm.created_at DESC
      `

      const result = await this.db.query(query, [difyAppId])
      return result.rows
    } catch (error) {
      this.logger.error('Failed to find mappings by Dify app ID', {
        error: error.message,
        difyAppId
      })
      throw error
    }
  }

  /**
   * Find active mapping for a specific combination
   * @param {number} telegramBotId - Telegram bot ID
   * @param {number} chatwootAccountId - Chatwoot account ID
   * @param {number} difyAppId - Dify app ID
   * @returns {Promise<Object|null>} - Mapping object or null
   */
  async findActiveMapping (telegramBotId, chatwootAccountId, difyAppId) {
    try {
      const query = `
        SELECT pm.*, 
               tb.name as telegram_bot_name,
               ca.name as chatwoot_account_name,
               da.name as dify_app_name
        FROM platform_mappings pm
        LEFT JOIN telegram_bots tb ON pm.telegram_bot_id = tb.id
        LEFT JOIN chatwoot_accounts ca ON pm.chatwoot_account_id = ca.id
        LEFT JOIN dify_apps da ON pm.dify_app_id = da.id
        WHERE pm.telegram_bot_id = $1 
          AND pm.chatwoot_account_id = $2 
          AND pm.dify_app_id = $3 
          AND pm.is_active = true
        LIMIT 1
      `

      const result = await this.db.query(query, [telegramBotId, chatwootAccountId, difyAppId])
      return result.rows[0] || null
    } catch (error) {
      this.logger.error('Failed to find active mapping', {
        error: error.message,
        telegramBotId,
        chatwootAccountId,
        difyAppId
      })
      throw error
    }
  }

  /**
   * Get all active mappings with platform details
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} - Array of mappings with details
   */
  async getAllWithDetails (filters = {}) {
    try {
      let query = `
        SELECT pm.*, 
               tb.name as telegram_bot_name,
               tb.bot_token as telegram_bot_token,
               ca.name as chatwoot_account_name,
               ca.base_url as chatwoot_base_url,
               da.name as dify_app_name,
               da.api_url as dify_api_url
        FROM platform_mappings pm
        LEFT JOIN telegram_bots tb ON pm.telegram_bot_id = tb.id
        LEFT JOIN chatwoot_accounts ca ON pm.chatwoot_account_id = ca.id
        LEFT JOIN dify_apps da ON pm.dify_app_id = da.id
        WHERE 1=1
      `

      const params = []
      let paramCount = 0

      if (filters.isActive !== undefined) {
        paramCount++
        query += ` AND pm.is_active = $${paramCount}`
        params.push(filters.isActive)
      }

      if (filters.telegramBotId) {
        paramCount++
        query += ` AND pm.telegram_bot_id = $${paramCount}`
        params.push(filters.telegramBotId)
      }

      if (filters.chatwootAccountId) {
        paramCount++
        query += ` AND pm.chatwoot_account_id = $${paramCount}`
        params.push(filters.chatwootAccountId)
      }

      if (filters.difyAppId) {
        paramCount++
        query += ` AND pm.dify_app_id = $${paramCount}`
        params.push(filters.difyAppId)
      }

      query += ' ORDER BY pm.created_at DESC'

      if (filters.limit) {
        paramCount++
        query += ` LIMIT $${paramCount}`
        params.push(filters.limit)
      }

      if (filters.offset) {
        paramCount++
        query += ` OFFSET $${paramCount}`
        params.push(filters.offset)
      }

      const result = await this.db.query(query, params)
      return result.rows
    } catch (error) {
      this.logger.error('Failed to get all mappings with details', {
        error: error.message,
        filters
      })
      throw error
    }
  }

  /**
   * Update mapping configuration
   * @param {number} id - Mapping ID
   * @param {Object} updateData - Update data
   * @param {Object} user - User object (optional)
   * @returns {Promise<Object>} - Updated mapping
   */
  async updateConfiguration (id, updateData, user = null) {
    const {
      enableTelegramToChatwoot,
      enableTelegramToDify,
      enableChatwootToTelegram,
      enableDifyToChatwoot,
      enableDifyToTelegram,
      autoConnectTelegramChatwoot,
      autoConnectTelegramDify,
      isActive
    } = updateData

    const updateFields = []
    const params = []
    let paramCount = 0

    if (enableTelegramToChatwoot !== undefined) {
      paramCount++
      updateFields.push(`enable_telegram_to_chatwoot = $${paramCount}`)
      params.push(enableTelegramToChatwoot)
    }

    if (enableTelegramToDify !== undefined) {
      paramCount++
      updateFields.push(`enable_telegram_to_dify = $${paramCount}`)
      params.push(enableTelegramToDify)
    }

    if (enableChatwootToTelegram !== undefined) {
      paramCount++
      updateFields.push(`enable_chatwoot_to_telegram = $${paramCount}`)
      params.push(enableChatwootToTelegram)
    }

    if (enableDifyToChatwoot !== undefined) {
      paramCount++
      updateFields.push(`enable_dify_to_chatwoot = $${paramCount}`)
      params.push(enableDifyToChatwoot)
    }

    if (enableDifyToTelegram !== undefined) {
      paramCount++
      updateFields.push(`enable_dify_to_telegram = $${paramCount}`)
      params.push(enableDifyToTelegram)
    }

    if (autoConnectTelegramChatwoot !== undefined) {
      paramCount++
      updateFields.push(`auto_connect_telegram_chatwoot = $${paramCount}`)
      params.push(autoConnectTelegramChatwoot)
    }

    if (autoConnectTelegramDify !== undefined) {
      paramCount++
      updateFields.push(`auto_connect_telegram_dify = $${paramCount}`)
      params.push(autoConnectTelegramDify)
    }

    if (isActive !== undefined) {
      paramCount++
      updateFields.push(`is_active = $${paramCount}`)
      params.push(isActive)
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update')
    }

    paramCount++
    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    params.push(id)

    const query = `
      UPDATE platform_mappings 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `

    try {
      const result = await this.db.query(query, params)
      if (result.rows.length === 0) {
        throw new Error('Mapping not found')
      }
      return result.rows[0]
    } catch (error) {
      this.logger.error('Failed to update mapping configuration', {
        error: error.message,
        id,
        updateData
      })
      throw error
    }
  }

  /**
   * Delete mapping (soft delete)
   * @param {number} id - Mapping ID
   * @param {Object} user - User object (optional)
   * @returns {Promise<boolean>} - Success status
   */
  async delete (id, user = null) {
    try {
      const query = `
        UPDATE platform_mappings 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id
      `

      const result = await this.db.query(query, [id])
      return result.rows.length > 0
    } catch (error) {
      this.logger.error('Failed to delete mapping', {
        error: error.message,
        id
      })
      throw error
    }
  }
}

module.exports = PlatformMappingRepository
