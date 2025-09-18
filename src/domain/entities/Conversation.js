/**
 * Conversation Entity - Domain model for conversations
 */
class Conversation {
  constructor ({
    id,
    platform,
    chatType,
    chatId,
    chatTitle,
    chatUsername,
    chatDescription,
    senderId,
    senderUsername,
    senderFirstName,
    senderLastName,
    senderLanguageCode,
    senderIsBot = false,
    groupId,
    groupTitle,
    groupUsername,
    groupDescription,
    groupMemberCount,
    groupIsVerified = false,
    groupIsRestricted = false,
    chatwootId,
    chatwootInboxId,
    difyId,
    participants = [],
    platformMetadata = {},
    chatwootMetadata = {},
    status = 'active',
    isActive = true,
    createdAt,
    updatedAt,
    lastMessageAt
  }) {
    this.id = id
    this.platform = platform
    this.chatType = chatType
    this.chatId = chatId
    this.chatTitle = chatTitle
    this.chatUsername = chatUsername
    this.chatDescription = chatDescription
    this.senderId = senderId
    this.senderUsername = senderUsername
    this.senderFirstName = senderFirstName
    this.senderLastName = senderLastName
    this.senderLanguageCode = senderLanguageCode
    this.senderIsBot = senderIsBot
    this.groupId = groupId
    this.groupTitle = groupTitle
    this.groupUsername = groupUsername
    this.groupDescription = groupDescription
    this.groupMemberCount = groupMemberCount
    this.groupIsVerified = groupIsVerified
    this.groupIsRestricted = groupIsRestricted
    this.chatwootId = chatwootId
    this.chatwootInboxId = chatwootInboxId
    this.difyId = difyId
    this.participants = participants
    this.platformMetadata = platformMetadata
    this.chatwootMetadata = chatwootMetadata
    this.status = status
    this.isActive = isActive
    this.createdAt = createdAt || new Date()
    this.updatedAt = updatedAt || new Date()
    this.lastMessageAt = lastMessageAt
  }

  /**
   * Add participant to conversation
   */
  addParticipant (participant) {
    const existing = this.participants.find(p => p.id === participant.id)
    if (!existing) {
      this.participants.push(participant)
      this.updatedAt = new Date()
    }
  }

  /**
   * Remove participant from conversation
   */
  removeParticipant (participantId) {
    this.participants = this.participants.filter(p => p.id !== participantId)
    this.updatedAt = new Date()
  }

  /**
   * Check if conversation has participant
   */
  hasParticipant (participantId) {
    return this.participants.some(p => p.id === participantId)
  }

  /**
   * Get primary participant (for private chats)
   */
  getPrimaryParticipant () {
    return this.participants.find(p => p.role === 'user') || this.participants[0]
  }

  /**
   * Get sender display name
   */
  getSenderDisplayName () {
    if (this.senderFirstName && this.senderLastName) {
      return `${this.senderFirstName} ${this.senderLastName}`.trim()
    }
    if (this.senderFirstName) {
      return this.senderFirstName
    }
    if (this.senderUsername) {
      return `@${this.senderUsername}`
    }
    return this.senderId || 'Unknown'
  }

  /**
   * Get chat display name
   */
  getChatDisplayName () {
    if (this.chatType === 'private') {
      return this.getSenderDisplayName()
    }
    if (this.chatTitle) {
      return this.chatTitle
    }
    if (this.chatUsername) {
      return `@${this.chatUsername}`
    }
    return this.chatId || 'Unknown Chat'
  }

  /**
   * Check if conversation is active
   */
  isActive () {
    return this.isActive && this.status === 'active'
  }

  /**
   * Check if conversation is a group chat
   */
  isGroupChat () {
    return ['group', 'supergroup', 'channel'].includes(this.chatType)
  }

  /**
   * Check if conversation is private chat
   */
  isPrivateChat () {
    return this.chatType === 'private'
  }

  /**
   * Update conversation metadata
   */
  updateMetadata (metadata) {
    this.platformMetadata = { ...this.platformMetadata, ...metadata }
    this.updatedAt = new Date()
  }

  /**
   * Update Chatwoot metadata
   */
  updateChatwootMetadata (metadata) {
    this.chatwootMetadata = { ...this.chatwootMetadata, ...metadata }
    this.updatedAt = new Date()
  }

  /**
   * Update last message timestamp
   */
  updateLastMessageAt () {
    this.lastMessageAt = new Date()
    this.updatedAt = new Date()
  }

  /**
   * Validate conversation data
   */
  validate () {
    const errors = []

    if (!this.id) errors.push('Conversation ID is required')
    if (!this.platform) errors.push('Platform is required')
    if (!this.chatType) errors.push('Chat type is required')
    if (!this.chatId) errors.push('Chat ID is required')

    const validChatTypes = ['private', 'group', 'supergroup', 'channel']
    if (!validChatTypes.includes(this.chatType)) {
      errors.push(`Invalid chat type: ${this.chatType}`)
    }

    const validStatuses = ['active', 'archived', 'blocked', 'deleted']
    if (!validStatuses.includes(this.status)) {
      errors.push(`Invalid status: ${this.status}`)
    }

    if (errors.length > 0) {
      throw new Error(`Conversation validation failed: ${errors.join(', ')}`)
    }

    return true
  }

  /**
   * Convert to plain object
   */
  toJSON () {
    return {
      id: this.id,
      platform: this.platform,
      chatType: this.chatType,
      chatId: this.chatId,
      chatTitle: this.chatTitle,
      chatUsername: this.chatUsername,
      chatDescription: this.chatDescription,
      senderId: this.senderId,
      senderUsername: this.senderUsername,
      senderFirstName: this.senderFirstName,
      senderLastName: this.senderLastName,
      senderLanguageCode: this.senderLanguageCode,
      senderIsBot: this.senderIsBot,
      groupId: this.groupId,
      groupTitle: this.groupTitle,
      groupUsername: this.groupUsername,
      groupDescription: this.groupDescription,
      groupMemberCount: this.groupMemberCount,
      groupIsVerified: this.groupIsVerified,
      groupIsRestricted: this.groupIsRestricted,
      chatwootId: this.chatwootId,
      chatwootInboxId: this.chatwootInboxId,
      difyId: this.difyId,
      participants: this.participants,
      platformMetadata: this.platformMetadata,
      chatwootMetadata: this.chatwootMetadata,
      status: this.status,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastMessageAt: this.lastMessageAt
    }
  }
}

module.exports = Conversation
