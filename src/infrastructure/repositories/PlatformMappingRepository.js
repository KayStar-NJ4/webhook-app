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
      'id',
      'name',
      'source_platform', 'source_id',
      'chatwoot_account_id', 'dify_app_id',
      'is_active', 'created_by', 'updated_by', 'created_at', 'updated_at', 'deleted_at'
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
      sourcePlatform,
      sourceId,
      isActive = true,
      name,
      chatwootAccountId,
      difyAppId
    } = mappingData

    const data = {
      name: name,
      source_platform: sourcePlatform,
      source_id: sourceId,
      chatwoot_account_id: chatwootAccountId,
      dify_app_id: difyAppId,
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
        WHERE pm.telegram_bot_id = $1 AND pm.is_active = true AND pm.deleted_at IS NULL
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
      // FINAL SCHEMA:
      // - Source: source_platform + source_id (telegram, zalo, instagram,...)
      // - Target: chatwoot_account_id + dify_app_id (DIRECT columns, no target_platform)
      const query = `
        SELECT pm.*,
               -- Get source bot/account name
               CASE 
                 WHEN pm.source_platform = 'telegram' THEN (SELECT name FROM telegram_bots WHERE id = pm.source_id)
                 ELSE NULL
               END as telegram_bot_name,
               -- Get target names
               (SELECT name FROM chatwoot_accounts WHERE id = pm.chatwoot_account_id) as chatwoot_account_name,
               (SELECT name FROM dify_apps WHERE id = pm.dify_app_id) as dify_app_name,
               -- Backward compat: map source to telegram_bot_id
               CASE WHEN pm.source_platform = 'telegram' THEN pm.source_id ELSE NULL END as telegram_bot_id
        FROM platform_mappings pm
        WHERE pm.chatwoot_account_id = $1
          AND pm.is_active = true 
          AND pm.deleted_at IS NULL
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
        WHERE pm.dify_app_id = $1 AND pm.is_active = true AND pm.deleted_at IS NULL
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
          AND pm.deleted_at IS NULL
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
          CASE pm.source_platform
            WHEN 'telegram' THEN (SELECT name FROM telegram_bots WHERE id = pm.source_id)
            WHEN 'chatwoot' THEN (SELECT name FROM chatwoot_accounts WHERE id = pm.source_id)
            WHEN 'dify' THEN (SELECT name FROM dify_apps WHERE id = pm.source_id)
          END AS source_name,
          CASE 
            WHEN pm.chatwoot_account_id IS NOT NULL AND pm.dify_app_id IS NOT NULL THEN 
              CONCAT(
                'Chatwoot: ', (SELECT name FROM chatwoot_accounts WHERE id = pm.chatwoot_account_id),
                ' + Dify: ', (SELECT name FROM dify_apps WHERE id = pm.dify_app_id)
              )
            WHEN pm.chatwoot_account_id IS NOT NULL THEN 
              CONCAT('Chatwoot: ', (SELECT name FROM chatwoot_accounts WHERE id = pm.chatwoot_account_id))
            WHEN pm.dify_app_id IS NOT NULL THEN 
              CONCAT('Dify: ', (SELECT name FROM dify_apps WHERE id = pm.dify_app_id))
            ELSE 'Chưa cấu hình'
          END AS target_name,
          (pm.chatwoot_account_id IS NOT NULL) AS enable_chatwoot,
          (pm.dify_app_id IS NOT NULL) AS enable_dify
        FROM platform_mappings pm
        WHERE pm.deleted_at IS NULL
      `

      const params = []
      let paramCount = 0

      if (filters.isActive !== undefined) {
        paramCount++
        query += ` AND pm.is_active = $${paramCount}`
        params.push(filters.isActive)
      }

      // Source platform filters
      if (filters.sourcePlatform) {
        paramCount++
        query += ` AND pm.source_platform = $${paramCount}`
        params.push(filters.sourcePlatform)
      }
      if (filters.sourceId) {
        paramCount++
        query += ` AND pm.source_id = $${paramCount}`
        params.push(filters.sourceId)
      }

      // Specific target filters
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

      // Legacy filters for backward compatibility
      if (filters.telegramBotId) {
        paramCount++
        query += ` AND pm.source_platform = 'telegram' AND pm.source_id = $${paramCount}`
        params.push(filters.telegramBotId)
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
   * Find routes for a platform and id using specific target columns
   * Returns active mappings where (source=platform,id) OR (chatwoot_account_id=id and enable_chatwoot) OR (dify_app_id=id and enable_dify)
   * @param {string} platform - telegram|chatwoot|dify
   * @param {number} platformId - id
   */
  async findRoutesFor (platform, platformId) {
    try {
      // Convert platformId to appropriate type based on platform
      let convertedPlatformId = platformId
      if (platform === 'telegram' || platform === 'chatwoot') {
        convertedPlatformId = parseInt(platformId, 10)
        if (isNaN(convertedPlatformId)) {
          throw new Error(`Invalid ${platform} ID: ${platformId}`)
        }
      }
      
      const query = `
        SELECT pm.*
        FROM platform_mappings pm
        WHERE pm.is_active = TRUE AND pm.deleted_at IS NULL AND (
          (pm.source_platform = $1 AND pm.source_id = $2)
          OR
          (pm.chatwoot_account_id = $2 AND pm.chatwoot_account_id IS NOT NULL AND $1 = 'chatwoot')
          OR
          (pm.dify_app_id = $2 AND pm.dify_app_id IS NOT NULL AND $1 = 'dify')
        )
        ORDER BY pm.created_at DESC
      `
      const result = await this.db.query(query, [platform, convertedPlatformId])
      return result.rows
    } catch (error) {
      this.logger.error('Failed to find routes for platform', { error: error.message, platform, platformId })
      throw error
    }
  }

  /**
   * Check if mapping exists by exact source/target pair
   */
  async existsByPair (sourcePlatform, sourceId, chatwootAccountId, difyAppId) {
    try {
      const query = `
        SELECT 1 FROM platform_mappings
        WHERE source_platform = $1 AND source_id = $2
          AND (chatwoot_account_id = $3 OR dify_app_id = $4)
        LIMIT 1
      `
      const result = await this.db.query(query, [sourcePlatform, sourceId, chatwootAccountId, difyAppId])
      return result.rows.length > 0
    } catch (error) {
      this.logger.error('Failed to check mapping existence by pair', { error: error.message, sourcePlatform, sourceId, chatwootAccountId, difyAppId })
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
      // New flow-based fields
      name,
      chatwootAccountId,
      difyAppId,
      enableChatwoot,
      enableDify,
      isActive,
      // Legacy fields (for backward compatibility)
      enableTelegramToChatwoot,
      enableTelegramToDify,
      enableChatwootToTelegram,
      enableDifyToChatwoot,
      enableDifyToTelegram,
      autoConnectTelegramChatwoot,
      autoConnectTelegramDify
    } = updateData

    const updateFields = []
    const params = []
    let paramCount = 0

    // Handle new flow-based fields
    if (name !== undefined) {
      paramCount++
      updateFields.push(`name = $${paramCount}`)
      params.push(name)
    }

    if (chatwootAccountId !== undefined) {
      paramCount++
      updateFields.push(`chatwoot_account_id = $${paramCount}`)
      params.push(chatwootAccountId)
    }

    if (difyAppId !== undefined) {
      paramCount++
      updateFields.push(`dify_app_id = $${paramCount}`)
      params.push(difyAppId)
    }

    if (enableChatwoot !== undefined) {
      paramCount++
      updateFields.push(`enable_chatwoot = $${paramCount}`)
      params.push(enableChatwoot)
    }

    if (enableDify !== undefined) {
      paramCount++
      updateFields.push(`enable_dify = $${paramCount}`)
      params.push(enableDify)
    }

    if (isActive !== undefined) {
      paramCount++
      updateFields.push(`is_active = $${paramCount}`)
      params.push(isActive)
    }

    // Handle legacy fields (for backward compatibility)
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

    if (updateFields.length === 0) {
      throw new Error('No fields to update')
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    if (user && user.id) {
      paramCount++
      updateFields.push(`updated_by = $${paramCount}`)
      params.push(user.id)
    }
    paramCount++
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
        SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND deleted_at IS NULL
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

  /**
   * Find mappings by source platform and ID (excluding deleted)
   * @param {string} sourcePlatform - Source platform type
   * @param {number} sourceId - Source ID
   * @returns {Promise<Array>} - Array of mappings
   */
  async findBySourcePlatformAndId (sourcePlatform, sourceId) {
    try {
      const query = `
        SELECT ${this.getSelectableFields().join(', ')}
        FROM ${this.tableName}
        WHERE source_platform = $1 
          AND source_id = $2 
          AND deleted_at IS NULL
        ORDER BY created_at DESC
      `

      const result = await this.db.query(query, [sourcePlatform, sourceId])
      return result.rows
    } catch (error) {
      this.logger.error('Failed to find mappings by source platform and ID', {
        error: error.message,
        sourcePlatform,
        sourceId
      })
      throw error
    }
  }
}

module.exports = PlatformMappingRepository
