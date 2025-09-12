const MessageRepository = require('../../domain/repositories/MessageRepository')
const Message = require('../../domain/entities/Message')

/**
 * In-Memory Message Repository Implementation
 * For development and testing purposes
 */
class InMemoryMessageRepository extends MessageRepository {
  constructor() {
    super()
    this.messages = new Map()
  }

  /**
   * Find message by ID
   * @param {string} id - Message ID
   * @returns {Promise<Message|null>}
   */
  async findById(id) {
    const message = this.messages.get(id)
    return message ? new Message(message) : null
  }

  /**
   * Save message
   * @param {Message} message - Message entity
   * @returns {Promise<Message>}
   */
  async save(message) {
    message.validate()
    
    const messageData = message.toJSON()
    this.messages.set(message.id, messageData)
    
    return new Message(messageData)
  }

  /**
   * Get messages by conversation ID
   * @param {string} conversationId - Conversation ID
   * @param {Object} options - Query options
   * @returns {Promise<Message[]>}
   */
  async findByConversationId(conversationId, options = {}) {
    const { limit = 50, offset = 0, sortBy = 'timestamp', sortOrder = 'desc' } = options
    
    const messages = Array.from(this.messages.values())
      .filter(data => data.conversationId === conversationId)
      .sort((a, b) => {
        const aValue = a[sortBy]
        const bValue = b[sortBy]
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })
      .slice(offset, offset + limit)
      .map(data => new Message(data))
    
    return messages
  }

  /**
   * Check if message exists
   * @param {string} id - Message ID
   * @returns {Promise<boolean>}
   */
  async exists(id) {
    return this.messages.has(id)
  }

  /**
   * Get message count by conversation
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<number>}
   */
  async countByConversationId(conversationId) {
    return Array.from(this.messages.values())
      .filter(data => data.conversationId === conversationId)
      .length
  }

  /**
   * Clear all messages (for testing)
   * @returns {Promise<void>}
   */
  async clear() {
    this.messages.clear()
  }

  /**
   * Get total message count
   * @returns {Promise<number>}
   */
  async count() {
    return this.messages.size
  }
}

module.exports = InMemoryMessageRepository
