const BaseRepository = require('./BaseRepository')

/**
 * Chatwoot Account Repository - Infrastructure layer
 * Handles chatwoot account data operations
 */
class ChatwootAccountRepository extends BaseRepository {
  constructor ({ db, logger }) {
    super({ db, logger, tableName: 'chatwoot_accounts' })

    // Define searchable fields (account_id is BIGINT, so search as text)
    this.searchFields = ['name', 'base_url']

    // Define sortable fields
    this.sortableFields = ['name', 'base_url', 'created_at', 'updated_at', 'is_active']
  }

  /**
   * Create a new chatwoot account
   * @param {Object} accountData - Account data
   * @param {Object} user - User object (optional)
   * @returns {Promise<Object>} - Created account
   */
  async create (accountData, user = null) {
    const { name, baseUrl, accessToken, accountId, isActive } = accountData

    const data = {
      name,
      base_url: baseUrl,
      access_token: accessToken,
      account_id: accountId,
      is_active: isActive !== undefined ? isActive : true
    }

    return super.create(data, user)
  }

  /**
   * Find account by ID
   * @param {number} id - Account ID
   * @returns {Promise<Object|null>} - Account object or null
   */
  async findById (id) {
    return super.findById(id)
  }

  /**
   * Find account by account ID
   * @param {string} accountId - Chatwoot account ID
   * @returns {Promise<Object|null>} - Account object or null
   */
  async findByAccountId (accountId) {
    try {
      const query = 'SELECT * FROM chatwoot_accounts WHERE account_id = $1'
      const result = await this.db.query(query, [accountId])

      return result.rows[0] || null
    } catch (error) {
      this.logger.error('Failed to find chatwoot account by account ID', { accountId, error: error.message })
      throw error
    }
  }

  /**
   * Get all accounts with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Accounts and pagination info
   */
  async findAll (options = {}) {
    const { isActive = null } = options

    // Add custom filtering for isActive
    if (isActive !== null) {
      const result = await super.findAll(options)

      // Filter by isActive
      const filteredRecords = result.records.filter(record => Boolean(record.is_active) === Boolean(isActive))

      return {
        accounts: filteredRecords,
        pagination: {
          ...result.pagination,
          total: filteredRecords.length,
          pages: Math.ceil(filteredRecords.length / (options.limit || 10))
        }
      }
    }

    const result = await super.findAll(options)
    return {
      accounts: result.records,
      pagination: result.pagination
    }
  }

  /**
   * Update account
   * @param {number} id - Account ID
   * @param {Object} updateData - Update data
   * @param {Object} user - User object (optional)
   * @returns {Promise<Object>} - Updated account
   */
  async update (id, updateData, user = null) {
    const { name, baseUrl, accessToken, accountId, inboxId, isActive } = updateData

    const data = {
      name,
      base_url: baseUrl,
      access_token: accessToken,
      account_id: accountId,
      is_active: isActive !== undefined ? isActive : true
    }

    return super.update(id, data, user)
  }

  /**
   * Delete account
   * @param {number} id - Account ID
   * @returns {Promise<boolean>} - Success status
   */
  async delete (id) {
    return super.delete(id)
  }

  /**
   * Get active accounts
   * @returns {Promise<Array>} - Active accounts
   */
  async findActive () {
    try {
      const query = 'SELECT * FROM chatwoot_accounts WHERE is_active = true ORDER BY name'
      const result = await this.db.query(query)

      return result.rows
    } catch (error) {
      this.logger.error('Failed to find active chatwoot accounts', { error: error.message })
      throw error
    }
  }

  /**
   * Get account mappings with Telegram bots
   * @param {number} accountId - Account ID
   * @returns {Promise<Array>} - Account mappings
   */
  async getBotMappings (accountId) {
    try {
      const query = `
        SELECT 
          bcm.id,
          bcm.is_active,
          tb.id as telegram_bot_id,
          tb.name as telegram_bot_name,
          tb.bot_token as telegram_bot_token
        FROM bot_chatwoot_mappings bcm
        JOIN telegram_bots tb ON bcm.telegram_bot_id = tb.id
        WHERE bcm.chatwoot_account_id = $1
        ORDER BY tb.name
      `

      const result = await this.db.query(query, [accountId])
      return result.rows
    } catch (error) {
      this.logger.error('Failed to get account bot mappings', { accountId, error: error.message })
      throw error
    }
  }

  /**
   * Get account mappings with Dify apps
   * @param {number} accountId - Account ID
   * @returns {Promise<Array>} - Account mappings
   */
  async getDifyMappings (accountId) {
    try {
      const query = `
        SELECT 
          dcm.id,
          dcm.is_active,
          da.id as dify_app_id,
          da.name as dify_app_name,
          da.api_url as dify_api_url,
          da.app_id as dify_app_id
        FROM dify_chatwoot_mappings dcm
        JOIN dify_apps da ON dcm.dify_app_id = da.id
        WHERE dcm.chatwoot_account_id = $1
        ORDER BY da.name
      `

      const result = await this.db.query(query, [accountId])
      return result.rows
    } catch (error) {
      this.logger.error('Failed to get account dify mappings', { accountId, error: error.message })
      throw error
    }
  }
}

module.exports = ChatwootAccountRepository
