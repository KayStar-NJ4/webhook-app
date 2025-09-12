/**
 * Get Conversations Use Case
 * Handles retrieving conversation data
 */
class GetConversationsUseCase {
  constructor({ conversationRepository, logger }) {
    this.conversationRepository = conversationRepository
    this.logger = logger
  }

  /**
   * Execute the use case
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Conversations data
   */
  async execute(options = {}) {
    try {
      this.logger.info('Getting conversations', { options })

      let conversations

      if (options.platform) {
        conversations = await this.conversationRepository.findByPlatform(options.platform)
      } else {
        conversations = await this.conversationRepository.findAll()
      }

      const result = {
        conversations: conversations.map(conv => conv.toJSON()),
        total: conversations.length,
        platform: options.platform || 'all'
      }

      this.logger.info('Conversations retrieved successfully', {
        count: conversations.length,
        platform: options.platform
      })

      return result

    } catch (error) {
      this.logger.error('Failed to get conversations', {
        error: error.message,
        stack: error.stack,
        options
      })
      throw error
    }
  }
}

module.exports = GetConversationsUseCase
