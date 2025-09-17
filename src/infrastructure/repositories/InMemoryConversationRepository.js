const ConversationRepository = require('../../domain/repositories/ConversationRepository')
const Conversation = require('../../domain/entities/Conversation')

/**
 * In-Memory Conversation Repository Implementation
 * For development and testing purposes
 */
class InMemoryConversationRepository extends ConversationRepository {
  constructor() {
    super()
    this.conversations = new Map()
  }

  /**
   * Find conversation by ID
   * @param {string} id - Conversation ID
   * @returns {Promise<Conversation|null>}
   */
  async findById(id) {
    const conversation = this.conversations.get(id)
    return conversation ? new Conversation(conversation) : null
  }

  /**
   * Find conversation by platform and external ID
   * @param {string} platform - Platform name
   * @param {string} externalId - External platform ID
   * @returns {Promise<Conversation|null>}
   */
  async findByPlatformId(platform, externalId) {
    const id = `${platform}_${externalId}`
    return await this.findById(id)
  }

  /**
   * Save conversation
   * @param {Conversation} conversation - Conversation entity
   * @returns {Promise<Conversation>}
   */
  async save(conversation) {
    conversation.validate()
    
    const conversationData = conversation.toJSON()
    this.conversations.set(conversation.id, conversationData)
    
    return new Conversation(conversationData)
  }

  /**
   * Update conversation
   * @param {Conversation} conversation - Conversation entity
   * @returns {Promise<Conversation>}
   */
  async update(conversation) {
    if (!this.conversations.has(conversation.id)) {
      throw new Error(`Conversation with ID ${conversation.id} not found`)
    }

    conversation.validate()
    
    const conversationData = {
      ...conversation.toJSON(),
      updatedAt: new Date()
    }
    
    this.conversations.set(conversation.id, conversationData)
    return new Conversation(conversationData)
  }

  /**
   * Delete conversation
   * @param {string} id - Conversation ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    return this.conversations.delete(id)
  }

  /**
   * Get all conversations
   * @returns {Promise<Conversation[]>}
   */
  async findAll() {
    return Array.from(this.conversations.values())
      .map(data => new Conversation(data))
  }

  /**
   * Get conversations by platform
   * @param {string} platform - Platform name
   * @returns {Promise<Conversation[]>}
   */
  async findByPlatform(platform) {
    return Array.from(this.conversations.values())
      .filter(data => data.platform === platform)
      .map(data => new Conversation(data))
  }

  /**
   * Clear all conversations (for testing)
   * @returns {Promise<void>}
   */
  async clear() {
    this.conversations.clear()
  }

  /**
   * Get conversation count
   * @returns {Promise<number>}
   */
  async count() {
    return this.conversations.size
  }
}

module.exports = InMemoryConversationRepository
