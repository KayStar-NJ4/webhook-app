const Message = require('../../domain/entities/Message')

describe('Message Entity', () => {
  let messageData

  beforeEach(() => {
    messageData = {
      id: 'msg_123',
      content: 'Hello world',
      senderId: 'user_456',
      senderName: 'John Doe',
      conversationId: 'conv_789',
      platform: 'telegram',
      timestamp: new Date(),
      metadata: {
        isGroupChat: false
      }
    }
  })

  test('should create message with valid data', () => {
    const message = new Message(messageData)
    
    expect(message.id).toBe(messageData.id)
    expect(message.content).toBe(messageData.content)
    expect(message.senderId).toBe(messageData.senderId)
    expect(message.senderName).toBe(messageData.senderName)
    expect(message.conversationId).toBe(messageData.conversationId)
    expect(message.platform).toBe(messageData.platform)
  })

  test('should validate message data', () => {
    const message = new Message(messageData)
    expect(() => message.validate()).not.toThrow()
  })

  test('should throw error for invalid message data', () => {
    const invalidData = { ...messageData, id: null }
    const message = new Message(invalidData)
    
    expect(() => message.validate()).toThrow('Message validation failed')
  })

  test('should detect group messages', () => {
    const groupMessage = new Message({
      ...messageData,
      metadata: { isGroupChat: true }
    })
    
    expect(groupMessage.isGroupMessage()).toBe(true)
  })

  test('should format content for group messages', () => {
    const groupMessage = new Message({
      ...messageData,
      senderName: 'John',
      metadata: { isGroupChat: true }
    })
    
    expect(groupMessage.getFormattedContent()).toBe('[John]: Hello world')
  })

  test('should return plain content for private messages', () => {
    const privateMessage = new Message({
      ...messageData,
      metadata: { isGroupChat: false }
    })
    
    expect(privateMessage.getFormattedContent()).toBe('Hello world')
  })

  test('should convert to JSON', () => {
    const message = new Message(messageData)
    const json = message.toJSON()
    
    expect(json).toEqual(expect.objectContaining({
      id: messageData.id,
      content: messageData.content,
      senderId: messageData.senderId,
      senderName: messageData.senderName,
      conversationId: messageData.conversationId,
      platform: messageData.platform
    }))
  })
})
