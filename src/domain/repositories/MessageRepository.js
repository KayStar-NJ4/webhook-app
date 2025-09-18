/**
 * Message Repository Interface
 * Defines contract for message data access
 */
class MessageRepository {
  /**
   * Find message by ID
   * @param {string} id - Message ID
   * @returns {Promise<Message|null>}
   */
  async findById (id) {
    throw new Error('findById method must be implemented')
  }

  /**
   * Save message
   * @param {Message} message - Message entity
   * @returns {Promise<Message>}
   */
  async save (message) {
    throw new Error('save method must be implemented')
  }

  /**
   * Get messages by conversation ID
   * @param {string} conversationId - Conversation ID
   * @param {Object} options - Query options
   * @returns {Promise<Message[]>}
   */
  async findByConversationId (conversationId, options = {}) {
    throw new Error('findByConversationId method must be implemented')
  }

  /**
   * Check if message exists
   * @param {string} id - Message ID
   * @returns {Promise<boolean>}
   */
  async exists (id) {
    throw new Error('exists method must be implemented')
  }

  /**
   * Get message count by conversation
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<number>}
   */
  async countByConversationId (conversationId) {
    throw new Error('countByConversationId method must be implemented')
  }
}

module.exports = MessageRepository
