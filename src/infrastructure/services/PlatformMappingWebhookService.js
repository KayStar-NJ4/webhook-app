/**
 * Platform Mapping Webhook Service
 * Handles automatic message forwarding based on platform mappings
 */
class PlatformMappingWebhookService {
  constructor ({
    platformMappingRepository,
    telegramService,
    chatwootService,
    difyService,
    logger
  }) {
    this.platformMappingRepository = platformMappingRepository
    this.telegramService = telegramService
    this.chatwootService = chatwootService
    this.difyService = difyService
    this.logger = logger
  }

  /**
   * Handle incoming message and forward based on platform mappings
   * @param {Object} messageData - Message data from any platform
   * @returns {Promise<Object>} - Processing result
   */
  async handleIncomingMessage (messageData) {
    try {
      this.logger.info('Processing incoming message for platform mapping', {
        platform: messageData.platform,
        messageId: messageData.id,
        conversationId: messageData.conversationId
      })

      // Find active mappings for this platform
      const routes = await this.platformMappingRepository.findRoutesFor(
        messageData.platform,
        this.getPlatformIdFromMessage(messageData)
      )

      if (routes.length === 0) {
        this.logger.info('No platform mappings found for message', {
          platform: messageData.platform,
          messageId: messageData.id
        })
        return { success: true, message: 'No mappings found', forwarded: false }
      }

      const results = []
      for (const route of routes) {
        try {
          const result = await this.processRoute(messageData, route)
          results.push(result)
        } catch (error) {
          this.logger.error('Failed to process route', {
            error: error.message,
            routeId: route.id,
            messageId: messageData.id
          })
          results.push({
            success: false,
            error: error.message,
            routeId: route.id
          })
        }
      }

      const successCount = results.filter(r => r.success).length
      const totalCount = results.length

      this.logger.info('Platform mapping processing completed', {
        messageId: messageData.id,
        totalRoutes: totalCount,
        successfulRoutes: successCount,
        results
      })

      return {
        success: successCount > 0,
        forwarded: successCount > 0,
        totalRoutes: totalCount,
        successfulRoutes: successCount,
        results
      }
    } catch (error) {
      this.logger.error('Failed to handle incoming message', {
        error: error.message,
        messageData
      })
      throw error
    }
  }

  /**
   * Process a single route for message forwarding
   * @param {Object} messageData - Original message data
   * @param {Object} route - Platform mapping route
   * @returns {Promise<Object>} - Processing result
   */
  async processRoute (messageData, route) {
    try {
      this.logger.info('Processing route for message forwarding', {
        routeId: route.id,
        sourcePlatform: route.source_platform,
        targetPlatform: route.target_platform,
        messageId: messageData.id
      })

      // Determine if this is a source-to-target or target-to-source message
      const isSourceToTarget = route.source_platform === messageData.platform && route.source_id === this.getPlatformIdFromMessage(messageData)
      const isChatwootToSource = route.chatwoot_account_id && messageData.platform === 'chatwoot' && route.chatwoot_account_id === this.getPlatformIdFromMessage(messageData)
      const isDifyToSource = route.dify_app_id && messageData.platform === 'dify' && route.dify_app_id === this.getPlatformIdFromMessage(messageData)

      if (!isSourceToTarget && !isChatwootToSource && !isDifyToSource) {
        return {
          success: false,
          error: 'Message does not match this route',
          routeId: route.id
        }
      }

      // Determine target platform and ID
      let targetPlatform, targetId
      if (isSourceToTarget) {
        // Forward to available targets (prioritize Chatwoot if both available)
        if (route.chatwoot_account_id) {
          targetPlatform = 'chatwoot'
          targetId = route.chatwoot_account_id
        } else if (route.dify_app_id) {
          targetPlatform = 'dify'
          targetId = route.dify_app_id
        } else {
          return {
            success: false,
            error: 'No target platform available',
            routeId: route.id
          }
        }
      } else {
        // Forward back to source
        targetPlatform = route.source_platform
        targetId = route.source_id
      }

      // Forward message to target platform
      const forwardResult = await this.forwardToPlatform(messageData, {
        platform: targetPlatform,
        id: targetId,
        route
      })

      return {
        success: forwardResult.success,
        routeId: route.id,
        sourcePlatform: messageData.platform,
        targetPlatform,
        direction: isSourceToTarget ? 'source_to_target' : 'target_to_source',
        result: forwardResult
      }
    } catch (error) {
      this.logger.error('Failed to process route', {
        error: error.message,
        routeId: route.id,
        messageData
      })
      throw error
    }
  }

  /**
   * Forward message to target platform
   * @param {Object} messageData - Original message data
   * @param {Object} target - Target platform information
   * @returns {Promise<Object>} - Forwarding result
   */
  async forwardMessage (messageData, target) {
    try {
      this.logger.info('Forwarding message to target platform', {
        targetPlatform: target.platform,
        targetId: target.id,
        messageId: messageData.id
      })

      let result = null

      switch (target.platform) {
        case 'telegram':
          result = await this.forwardToTelegram(messageData, target.id)
          break
        case 'chatwoot':
          result = await this.forwardToChatwoot(messageData, target.id)
          break
        case 'dify':
          result = await this.forwardToDify(messageData, target.id)
          break
        default:
          throw new Error(`Unsupported target platform: ${target.platform}`)
      }

      this.logger.info('Message forwarded successfully', {
        targetPlatform: target.platform,
        targetId: target.id,
        messageId: messageData.id,
        result
      })

      return {
        success: true,
        targetPlatform: target.platform,
        targetId: target.id,
        result
      }
    } catch (error) {
      this.logger.error('Failed to forward message', {
        error: error.message,
        targetPlatform: target.platform,
        targetId: target.id,
        messageId: messageData.id
      })
      return {
        success: false,
        error: error.message,
        targetPlatform: target.platform,
        targetId: target.id
      }
    }
  }

  /**
   * Forward message to target platform (generic)
   * @param {Object} messageData - Original message data
   * @param {Object} target - Target platform information
   * @returns {Promise<Object>} - Forwarding result
   */
  async forwardToPlatform (messageData, target) {
    try {
      this.logger.info('Forwarding message to platform', {
        targetPlatform: target.platform,
        targetId: target.id,
        messageId: messageData.id
      })

      let result = null

      switch (target.platform) {
        case 'telegram':
          result = await this.forwardToTelegram(messageData, target.id)
          break
        case 'chatwoot':
          result = await this.forwardToChatwoot(messageData, target.id)
          break
        case 'dify':
          result = await this.forwardToDify(messageData, target.id)
          break
        case 'facebook':
          result = await this.forwardToFacebook(messageData, target.id)
          break
        case 'zalo':
          result = await this.forwardToZalo(messageData, target.id)
          break
        case 'web':
          result = await this.forwardToWeb(messageData, target.id)
          break
        case 'instagram':
          result = await this.forwardToInstagram(messageData, target.id)
          break
        default:
          throw new Error(`Unsupported target platform: ${target.platform}`)
      }

      this.logger.info('Message forwarded successfully', {
        targetPlatform: target.platform,
        targetId: target.id,
        messageId: messageData.id,
        result
      })

      return {
        success: true,
        targetPlatform: target.platform,
        targetId: target.id,
        result
      }
    } catch (error) {
      this.logger.error('Failed to forward message to platform', {
        error: error.message,
        targetPlatform: target.platform,
        targetId: target.id,
        messageId: messageData.id
      })
      return {
        success: false,
        error: error.message,
        targetPlatform: target.platform,
        targetId: target.id
      }
    }
  }

  /**
   * Forward message to Telegram
   * @param {Object} messageData - Original message data
   * @param {number} telegramBotId - Telegram bot ID
   * @returns {Promise<Object>} - Forwarding result
   */
  async forwardToTelegram (messageData, telegramBotId) {
    try {
      // Initialize Telegram service with specific bot
      await this.telegramService.initializeWithBotId(telegramBotId)

      // Format message for Telegram
      const telegramMessage = this.formatMessageForPlatform(messageData, 'telegram')

      // Send to Telegram
      const result = await this.telegramService.sendMessage(
        messageData.conversationId, // chatId
        telegramMessage,
        {
          parse_mode: 'HTML'
        }
      )

      return {
        success: true,
        messageId: result.message_id,
        chatId: result.chat.id
      }
    } catch (error) {
      this.logger.error('Failed to forward to Telegram', {
        error: error.message,
        telegramBotId,
        messageId: messageData.id
      })
      throw error
    }
  }

  /**
   * Forward message to Chatwoot
   * @param {Object} messageData - Original message data
   * @param {number} chatwootAccountId - Chatwoot account ID
   * @returns {Promise<Object>} - Forwarding result
   */
  async forwardToChatwoot (messageData, chatwootAccountId) {
    try {
      // Initialize Chatwoot service with specific account
      await this.chatwootService.initializeWithAccountId(chatwootAccountId)

      // Create or find conversation
      const conversation = await this.chatwootService.createOrUpdateConversation(
        {
          id: messageData.conversationId,
          platform: messageData.platform,
          chatId: messageData.conversationId,
          senderId: messageData.senderId,
          senderName: messageData.senderName
        },
        messageData,
        chatwootAccountId
      )

      // Send message to conversation
      const result = await this.chatwootService.sendMessage(
        conversation.id,
        messageData.content,
        {
          sender: {
            id: messageData.senderId,
            name: messageData.senderName
          }
        }
      )

      return {
        success: true,
        conversationId: conversation.id,
        messageId: result.id
      }
    } catch (error) {
      this.logger.error('Failed to forward to Chatwoot', {
        error: error.message,
        chatwootAccountId,
        messageId: messageData.id
      })
      throw error
    }
  }

  /**
   * Forward message to Dify
   * @param {Object} messageData - Original message data
   * @param {number} difyAppId - Dify app ID
   * @returns {Promise<Object>} - Forwarding result
   */
  async forwardToDify (messageData, difyAppId) {
    try {
      // Initialize Dify service with specific app
      await this.difyService.initializeWithAppId(difyAppId)

      // Format conversation for Dify
      const conversation = {
        id: messageData.conversationId,
        platform: messageData.platform,
        difyId: null // Will be set by Dify response
      }

      // Send to Dify
      const result = await this.difyService.sendMessage(
        conversation,
        messageData.content,
        { difyAppId }
      )

      return {
        success: true,
        conversationId: result.conversationId,
        response: result.response,
        messageId: result.metadata?.messageId
      }
    } catch (error) {
      this.logger.error('Failed to forward to Dify', {
        error: error.message,
        difyAppId,
        messageId: messageData.id
      })
      throw error
    }
  }

  /**
   * Forward message to Facebook (placeholder for future implementation)
   * @param {Object} messageData - Original message data
   * @param {number} facebookPageId - Facebook page ID
   * @returns {Promise<Object>} - Forwarding result
   */
  async forwardToFacebook (messageData, facebookPageId) {
    // TODO: Implement Facebook messaging API
    this.logger.info('Facebook forwarding not yet implemented', {
      facebookPageId,
      messageId: messageData.id
    })
    
    return {
      success: false,
      error: 'Facebook platform not yet implemented',
      messageId: messageData.id
    }
  }

  /**
   * Forward message to Zalo (placeholder for future implementation)
   * @param {Object} messageData - Original message data
   * @param {number} zaloAppId - Zalo app ID
   * @returns {Promise<Object>} - Forwarding result
   */
  async forwardToZalo (messageData, zaloAppId) {
    // TODO: Implement Zalo messaging API
    this.logger.info('Zalo forwarding not yet implemented', {
      zaloAppId,
      messageId: messageData.id
    })
    
    return {
      success: false,
      error: 'Zalo platform not yet implemented',
      messageId: messageData.id
    }
  }

  /**
   * Forward message to Web (placeholder for future implementation)
   * @param {Object} messageData - Original message data
   * @param {number} webEndpointId - Web endpoint ID
   * @returns {Promise<Object>} - Forwarding result
   */
  async forwardToWeb (messageData, webEndpointId) {
    // TODO: Implement Web webhook forwarding
    this.logger.info('Web forwarding not yet implemented', {
      webEndpointId,
      messageId: messageData.id
    })
    
    return {
      success: false,
      error: 'Web platform not yet implemented',
      messageId: messageData.id
    }
  }

  /**
   * Forward message to Instagram (placeholder for future implementation)
   * @param {Object} messageData - Original message data
   * @param {number} instagramAccountId - Instagram account ID
   * @returns {Promise<Object>} - Forwarding result
   */
  async forwardToInstagram (messageData, instagramAccountId) {
    // TODO: Implement Instagram messaging API
    this.logger.info('Instagram forwarding not yet implemented', {
      instagramAccountId,
      messageId: messageData.id
    })
    
    return {
      success: false,
      error: 'Instagram platform not yet implemented',
      messageId: messageData.id
    }
  }

  /**
   * Get platform ID from message data
   * @param {Object} messageData - Message data
   * @returns {string|number} - Platform ID
   */
  getPlatformIdFromMessage (messageData) {
    // For Telegram messages, we need to get the telegramBotId
    if (messageData.platform === 'telegram') {
      // Try to get botId from metadata first
      if (messageData.metadata?.botId) return messageData.metadata.botId
      
      // Try to get botId from the message itself
      if (messageData.botId) return messageData.botId
      
      // For Telegram, we need to get the correct bot ID from the webhook
      // This should be passed from the webhook handler
      this.logger.warn('No bot ID found in Telegram message data', { messageData })
      return 1 // Fallback - should be improved
    }
    
    // For other platforms, use existing logic
    if (messageData.metadata?.botId) return messageData.metadata.botId
    if (messageData.metadata?.accountId) return messageData.metadata.accountId
    if (messageData.metadata?.appId) return messageData.metadata.appId
    
    // Fallback to conversation ID or sender ID
    return messageData.conversationId || messageData.senderId || 1
  }

  /**
   * Format message for specific platform
   * @param {Object} messageData - Original message data
   * @param {string} targetPlatform - Target platform name
   * @returns {string} - Formatted message
   */
  formatMessageForPlatform (messageData, targetPlatform) {
    let formattedMessage = messageData.content

    // Add sender information if available
    if (messageData.senderName) {
      if (targetPlatform === 'telegram') {
        formattedMessage = `<b>${messageData.senderName}:</b>\n${formattedMessage}`
      } else {
        formattedMessage = `${messageData.senderName}: ${formattedMessage}`
      }
    }

    // Add platform information
    const sourcePlatformName = this.getPlatformName(messageData.platform)
    if (targetPlatform === 'telegram') {
      formattedMessage += `\n\n<i>📨 From ${sourcePlatformName}</i>`
    } else {
      formattedMessage += `\n\n[From ${sourcePlatformName}]`
    }

    return formattedMessage
  }

  /**
   * Get platform display name
   * @param {string} platform - Platform name
   * @returns {string} - Display name
   */
  getPlatformName (platform) {
    const names = {
      'telegram': 'Telegram',
      'chatwoot': 'Chatwoot',
      'dify': 'Dify AI',
      'facebook': 'Facebook',
      'zalo': 'Zalo',
      'web': 'Web',
      'instagram': 'Instagram'
    }
    return names[platform] || platform
  }

  /**
   * Check if message should be processed (avoid loops)
   * @param {Object} messageData - Message data
   * @returns {boolean} - Should process
   */
  shouldProcessMessage (messageData) {
    // Skip test messages
    if (messageData.metadata?.testMode) {
      return false
    }

    // Skip bot messages to prevent loops
    if (messageData.metadata?.isBot) {
      return false
    }

    // Skip messages that are already forwarded
    if (messageData.metadata?.forwarded) {
      return false
    }

    return true
  }
}

module.exports = PlatformMappingWebhookService
