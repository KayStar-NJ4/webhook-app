/**
 * Message Entity - Domain model for messages
 */
class Message {
  constructor ({
    id,
    content,
    senderId,
    senderName,
    conversationId,
    platform,
    timestamp,
    metadata = {}
  }) {
    this.id = id
    this.content = content
    this.senderId = senderId
    this.senderName = senderName
    this.conversationId = conversationId
    this.platform = platform
    this.timestamp = timestamp || new Date()
    this.metadata = metadata
  }

  /**
   * Check if message is from group chat
   */
  isGroupMessage () {
    return this.metadata.isGroupChat || false
  }

  /**
   * Get display name for the message
   */
  getDisplayName () {
    if (this.isGroupMessage()) {
      return `[${this.senderName}]`
    }
    return this.senderName
  }

  /**
   * Get formatted content for AI processing
   */
  getFormattedContent () {
    if (this.isGroupMessage()) {
      return `${this.getDisplayName()}: ${this.content}`
    }
    return this.content
  }

  /**
   * Validate message data
   */
  validate () {
    const errors = []

    if (!this.id) errors.push('Message ID is required')
    if (!this.content) errors.push('Message content is required')
    if (!this.senderId) errors.push('Sender ID is required')
    if (!this.conversationId) errors.push('Conversation ID is required')
    if (!this.platform) errors.push('Platform is required')

    if (errors.length > 0) {
      throw new Error(`Message validation failed: ${errors.join(', ')}`)
    }

    return true
  }

  /**
   * Convert to plain object
   */
  toJSON () {
    return {
      id: this.id,
      content: this.content,
      senderId: this.senderId,
      senderName: this.senderName,
      conversationId: this.conversationId,
      platform: this.platform,
      timestamp: this.timestamp,
      metadata: this.metadata
    }
  }
}

module.exports = Message
