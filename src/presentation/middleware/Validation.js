const Joi = require('joi')

/**
 * Validation Middleware
 * Validates request data using Joi schemas
 */
class Validation {
  constructor ({ logger }) {
    this.logger = logger
  }

  /**
   * Create validation middleware
   * @param {Object} schema - Joi schema
   * @param {string} source - Data source ('body', 'query', 'params')
   * @returns {Function} - Express middleware
   */
  validate (schema, source = 'body') {
    return (req, res, next) => {
      const data = req[source]

      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
      })

      if (error) {
        const errorDetails = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }))

        this.logger.warn('Validation failed', {
          source,
          errors: errorDetails,
          data: this.sanitizeData(data)
        })

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errorDetails
        })
      }

      // Replace request data with validated data
      req[source] = value
      next()
    }
  }

  /**
   * Sanitize data for logging
   * @param {Object} data - Data to sanitize
   * @returns {Object} - Sanitized data
   */
  sanitizeData (data) {
    if (!data) return data

    const sanitized = { ...data }
    const sensitiveFields = ['password', 'token', 'secret', 'key']

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]'
      }
    })

    return sanitized
  }

  /**
   * Common validation schemas
   */
  static schemas = {
    telegramWebhook: Joi.object({
      update_id: Joi.number().required(),
      message: Joi.object({
        message_id: Joi.number().required(),
        from: Joi.object({
          id: Joi.number().required(),
          first_name: Joi.string().required(),
          last_name: Joi.string().allow('').optional(),
          username: Joi.string().allow('').optional(),
          is_bot: Joi.boolean().optional(),
          language_code: Joi.string().optional()
        }).required(),
        chat: Joi.object({
          id: Joi.number().required(),
          type: Joi.string().valid('private', 'group', 'supergroup', 'channel').required(),
          title: Joi.string().allow('').optional(),
          all_members_are_administrators: Joi.boolean().optional(),
          accepted_gift_types: Joi.object().optional()
        }).required(),
        // text is optional - not present for special events like new_chat_member, migrate_from_chat_id
        text: Joi.string().optional(),
        date: Joi.number().required(),
        // Special event fields
        new_chat_member: Joi.object({
          id: Joi.number().required(),
          is_bot: Joi.boolean().optional(),
          first_name: Joi.string().optional(),
          username: Joi.string().optional()
        }).optional(),
        new_chat_members: Joi.array().items(Joi.object({
          id: Joi.number().required(),
          is_bot: Joi.boolean().optional(),
          first_name: Joi.string().optional(),
          username: Joi.string().optional()
        })).optional(),
        new_chat_participant: Joi.object({
          id: Joi.number().required(),
          is_bot: Joi.boolean().optional(),
          first_name: Joi.string().optional(),
          username: Joi.string().optional()
        }).optional(),
        left_chat_member: Joi.object({
          id: Joi.number().required(),
          is_bot: Joi.boolean().optional(),
          first_name: Joi.string().optional(),
          username: Joi.string().optional()
        }).optional(),
        migrate_from_chat_id: Joi.number().optional(),
        migrate_to_chat_id: Joi.number().optional(),
        sender_chat: Joi.object({
          id: Joi.number().required(),
          type: Joi.string().optional(),
          title: Joi.string().optional()
        }).optional(),
        // Support for entities (mentions, hashtags, etc.)
        entities: Joi.array().items(Joi.object({
          type: Joi.string().required(),
          offset: Joi.number().required(),
          length: Joi.number().required(),
          user: Joi.object().optional()
        })).optional()
      }).required()
    }),

    chatwootWebhook: Joi.object({
      // Chatwoot webhook có nhiều loại event khác nhau
      event: Joi.string().optional(),
      id: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),

      // Message object (có thể có hoặc không tùy event)
      message: Joi.object({
        id: Joi.number().required(),
        content: Joi.string().required(),
        message_type: Joi.alternatives().try(
          Joi.string().valid('incoming', 'outgoing'),
          Joi.number().valid(0, 1) // 0 = incoming, 1 = outgoing
        ).required(),
        sender: Joi.object({
          id: Joi.number().required(),
          name: Joi.string().required()
        }).required()
      }).optional(),

      // Conversation object (có thể có hoặc không tùy event)
      conversation: Joi.object({
        id: Joi.number().required(),
      }).optional(),

      // Contact object (for contact_updated events)
      name: Joi.string().optional(),
      email: Joi.string().email().allow(null).optional(),
      avatar: Joi.string().uri().allow('').optional(),
      blocked: Joi.boolean().optional(),
      thumbnail: Joi.string().uri().allow('').optional(),
      identifier: Joi.string().allow(null).optional(),
      phone_number: Joi.string().allow(null).optional(),
      custom_attributes: Joi.object().optional(),
      changed_attributes: Joi.array().optional(),
      additional_attributes: Joi.object().optional(),

      // Các field khác có thể có
      user: Joi.object().optional(),
      account: Joi.object().optional(),
      inbox: Joi.object().optional(),
      sender: Joi.object().optional(),
      content: Joi.string().optional(),
      private: Joi.boolean().optional(),
      source_id: Joi.string().allow(null).optional(), // Allow null for outgoing messages from agents
      created_at: Joi.string().optional(),
      content_type: Joi.string().optional(),
      message_type: Joi.string().optional(),
      content_attributes: Joi.object().optional()
    }).unknown(true), // Cho phép các field khác

    webhookSetup: Joi.object({
      webhookUrl: Joi.string().uri().required()
    }),

    testMessage: Joi.object({
      chatId: Joi.string().required(),
      message: Joi.string().required()
    }),

    conversationQuery: Joi.object({
      platform: Joi.string().valid('telegram', 'chatwoot', 'dify').optional(),
      limit: Joi.number().integer().min(1).max(100).default(50),
      offset: Joi.number().integer().min(0).default(0)
    }),

    difyApp: Joi.object({
      name: Joi.string().min(1).max(100).required(),
      apiUrl: Joi.string().uri().required(),
      apiKey: Joi.string().min(1).max(500).required(),
      appId: Joi.string().min(1).max(100).required(),
      timeout: Joi.number().integer().min(1000).max(300000).default(30000),
      isActive: Joi.boolean().default(true)
    }),

    difyAppUpdate: Joi.object({
      name: Joi.string().min(1).max(100).optional(),
      apiUrl: Joi.string().uri().optional(),
      apiKey: Joi.string().min(1).max(500).optional(),
      appId: Joi.string().min(1).max(100).optional(),
      timeout: Joi.number().integer().min(1000).max(300000).optional(),
      isActive: Joi.boolean().optional()
    }),

    difyMapping: Joi.object({
      difyAppId: Joi.number().integer().positive().required(),
      chatwootAccountId: Joi.number().integer().positive().required(),
      isActive: Joi.boolean().default(true)
    }),

    telegramBot: Joi.object({
      name: Joi.string().min(1).max(100).required(),
      botToken: Joi.string().min(1).max(500).required(),
      secretToken: Joi.string().min(1).max(255).optional().allow(''),
      webhookUrl: Joi.string().uri().allow('').optional(),
      isActive: Joi.boolean().default(true)
    }),

    telegramBotUpdate: Joi.object({
      name: Joi.string().min(1).max(100).optional(),
      botToken: Joi.string().min(1).max(500).optional(),
      secretToken: Joi.string().min(1).max(255).optional().allow(''),
      webhookUrl: Joi.string().uri().allow('').optional(),
      isActive: Joi.boolean().optional()
    }),

    platformMapping: Joi.object({
      platformType: Joi.string().valid('telegram', 'zalo', 'facebook').default('telegram'),
      platformId: Joi.number().integer().positive().required(),
      telegramBotId: Joi.number().integer().positive().when('platformType', {
        is: 'telegram',
        then: Joi.required(),
        otherwise: Joi.optional().allow(null)
      }),
      chatwootAccountId: Joi.number().integer().positive().required(),
      difyAppId: Joi.number().integer().positive().required(),
      enableTelegramToChatwoot: Joi.boolean().default(true),
      enableTelegramToDify: Joi.boolean().default(true),
      enableChatwootToTelegram: Joi.boolean().default(true),
      enableDifyToChatwoot: Joi.boolean().default(true),
      enableDifyToTelegram: Joi.boolean().default(true),
      autoConnectTelegramChatwoot: Joi.boolean().default(true),
      autoConnectTelegramDify: Joi.boolean().default(true),
      isActive: Joi.boolean().default(true)
    }),

    platformMappingUpdate: Joi.object({
      enableTelegramToChatwoot: Joi.boolean().optional(),
      enableTelegramToDify: Joi.boolean().optional(),
      enableChatwootToTelegram: Joi.boolean().optional(),
      enableDifyToChatwoot: Joi.boolean().optional(),
      enableDifyToTelegram: Joi.boolean().optional(),
      autoConnectTelegramChatwoot: Joi.boolean().optional(),
      autoConnectTelegramDify: Joi.boolean().optional(),
      isActive: Joi.boolean().optional()
    }),

  }

  /**
   * Validation middleware methods for Dify
   */
  validateDifyApp = this.validate(Validation.schemas.difyApp, 'body')
  validateDifyAppUpdate = this.validate(Validation.schemas.difyAppUpdate, 'body')
  validateDifyMapping = this.validate(Validation.schemas.difyMapping, 'body')

  /**
   * Validation middleware methods for Telegram
   */
  validateTelegramBot = this.validate(Validation.schemas.telegramBot, 'body')
  validateTelegramBotUpdate = this.validate(Validation.schemas.telegramBotUpdate, 'body')

  /**
   * Validation middleware methods for Webhooks
   */
  validateTelegramWebhook = this.validate(Validation.schemas.telegramWebhook, 'body')
  validateChatwootWebhook = this.validate(Validation.schemas.chatwootWebhook, 'body')
}

module.exports = Validation
