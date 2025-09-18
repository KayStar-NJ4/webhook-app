/**
 * Conversation Repository Interface
 * Defines contract for conversation data access
 */
class ConversationRepository {
  /**
   * Find conversation by ID
   * @param {string} id - Conversation ID
   * @returns {Promise<Conversation|null>}
   */
  async findById (id) {
    throw new Error('findById method must be implemented')
  }

  /**
   * Find conversation by platform and external ID
   * @param {string} platform - Platform name
   * @param {string} externalId - External platform ID
   * @returns {Promise<Conversation|null>}
   */
  async findByPlatformId (platform, externalId) {
    throw new Error('findByPlatformId method must be implemented')
  }

  /**
   * Save conversation
   * @param {Conversation} conversation - Conversation entity
   * @returns {Promise<Conversation>}
   */
  async save (conversation) {
    throw new Error('save method must be implemented')
  }

  /**
   * Update conversation
   * @param {Conversation} conversation - Conversation entity
   * @returns {Promise<Conversation>}
   */
  async update (conversation) {
    throw new Error('update method must be implemented')
  }

  /**
   * Delete conversation
   * @param {string} id - Conversation ID
   * @returns {Promise<boolean>}
   */
  async delete (id) {
    throw new Error('delete method must be implemented')
  }

  /**
   * Get all conversations
   * @returns {Promise<Conversation[]>}
   */
  async findAll () {
    throw new Error('findAll method must be implemented')
  }

  /**
   * Get conversations by platform
   * @param {string} platform - Platform name
   * @returns {Promise<Conversation[]>}
   */
  async findByPlatform (platform) {
    throw new Error('findByPlatform method must be implemented')
  }
}

module.exports = ConversationRepository
