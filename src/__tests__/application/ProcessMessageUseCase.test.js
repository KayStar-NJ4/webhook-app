const ProcessMessageUseCase = require('../../application/useCases/ProcessMessageUseCase')
const Message = require('../../domain/entities/Message')

describe('ProcessMessageUseCase', () => {
  let useCase
  let mockDependencies

  beforeEach(() => {
    mockDependencies = {
      conversationRepository: {
        findByPlatformId: jest.fn(),
        save: jest.fn(),
        update: jest.fn()
      },
      messageRepository: {
        exists: jest.fn(),
        save: jest.fn()
      },
      telegramService: {
        sendMessage: jest.fn()
      },
      chatwootService: {
        createOrUpdateConversation: jest.fn()
      },
      difyService: {
        sendMessage: jest.fn()
      },
      logger: {
        info: jest.fn(),
        error: jest.fn()
      }
    }

    useCase = new ProcessMessageUseCase(mockDependencies)
  })

  test('should process new message successfully', async () => {
    const messageData = {
      id: 'msg_123',
      content: 'Hello',
      senderId: 'user_456',
      senderName: 'John',
      conversationId: 'conv_789',
      platform: 'telegram',
      metadata: { isGroupChat: false }
    }

    // Mock repository responses
    mockDependencies.messageRepository.exists.mockResolvedValue(false)
    mockDependencies.conversationRepository.findByPlatformId.mockResolvedValue(null)
    mockDependencies.conversationRepository.save.mockResolvedValue({
      id: 'conv_789',
      platform: 'telegram',
      chatwootId: null,
      difyId: null
    })
    mockDependencies.chatwootService.createOrUpdateConversation.mockResolvedValue({
      id: 'chatwoot_123'
    })
    mockDependencies.difyService.sendMessage.mockResolvedValue({
      conversationId: 'dify_456',
      response: 'Hi there!'
    })

    const result = await useCase.execute(messageData)

    expect(result.success).toBe(true)
    expect(result.chatwootConversationId).toBe('chatwoot_123')
    expect(result.difyConversationId).toBe('dify_456')
    expect(mockDependencies.messageRepository.save).toHaveBeenCalled()
    expect(mockDependencies.telegramService.sendMessage).toHaveBeenCalledWith(
      'conv_789',
      'Hi there!'
    )
  })

  test('should skip already processed message', async () => {
    const messageData = {
      id: 'msg_123',
      content: 'Hello',
      senderId: 'user_456',
      senderName: 'John',
      conversationId: 'conv_789',
      platform: 'telegram'
    }

    mockDependencies.messageRepository.exists.mockResolvedValue(true)

    const result = await useCase.execute(messageData)

    expect(result.success).toBe(true)
    expect(result.message).toBe('Message already processed')
    expect(mockDependencies.messageRepository.save).not.toHaveBeenCalled()
  })

  test('should handle errors gracefully', async () => {
    const messageData = {
      id: 'msg_123',
      content: 'Hello',
      senderId: 'user_456',
      senderName: 'John',
      conversationId: 'conv_789',
      platform: 'telegram'
    }

    mockDependencies.messageRepository.exists.mockRejectedValue(new Error('Database error'))

    await expect(useCase.execute(messageData)).rejects.toThrow('Database error')
    expect(mockDependencies.logger.error).toHaveBeenCalled()
  })
})
