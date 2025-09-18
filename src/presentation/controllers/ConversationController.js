/**
 * Conversation Controller - Presentation layer
 * Handles conversation-related HTTP requests
 */
class ConversationController {
  constructor ({ getConversationsUseCase, logger }) {
    this.getConversationsUseCase = getConversationsUseCase
    this.logger = logger
  }

  /**
   * Get all conversations
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getConversations (req, res) {
    try {
      const { platform } = req.query

      this.logger.info('Getting conversations', { platform })

      const result = await this.getConversationsUseCase.execute({ platform })

      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      this.logger.error('Failed to get conversations', {
        error: error.message,
        query: req.query
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  /**
   * Get conversation by ID
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async getConversationById (req, res) {
    try {
      const { id } = req.params

      this.logger.info('Getting conversation by ID', { id })

      // This would need a new use case for getting single conversation
      res.status(501).json({
        success: false,
        error: 'Not implemented yet'
      })
    } catch (error) {
      this.logger.error('Failed to get conversation by ID', {
        error: error.message,
        id: req.params.id
      })

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }
}

module.exports = ConversationController
