const Joi = require('joi')

/**
 * Validation Middleware
 * Validates request data using Joi schemas
 */
class Validation {
  constructor({ logger }) {
    this.logger = logger
  }

  /**
   * Create validation middleware
   * @param {Object} schema - Joi schema
   * @param {string} source - Data source ('body', 'query', 'params')
   * @returns {Function} - Express middleware
   */
  validate(schema, source = 'body') {
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
  sanitizeData(data) {
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
          last_name: Joi.string().allow(''),
          username: Joi.string().allow('')
        }).required(),
        chat: Joi.object({
          id: Joi.number().required(),
          type: Joi.string().valid('private', 'group', 'supergroup').required(),
          title: Joi.string().allow('')
        }).required(),
        text: Joi.string().required(),
        date: Joi.number().required()
      }).required()
    }),

    chatwootWebhook: Joi.object({
      // Chatwoot webhook có nhiều loại event khác nhau
      event: Joi.string().optional(),
      id: Joi.number().optional(),
      
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
        inbox_id: Joi.number().required()
      }).optional(),
      
      // Các field khác có thể có
      user: Joi.object().optional(),
      account: Joi.object().optional(),
      inbox: Joi.object().optional(),
      sender: Joi.object().optional()
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
      webhookUrl: Joi.string().uri().allow('').optional(),
      isActive: Joi.boolean().default(true)
    }),

    telegramBotUpdate: Joi.object({
      name: Joi.string().min(1).max(100).optional(),
      botToken: Joi.string().min(1).max(500).optional(),
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
    })
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
}

module.exports = Validation
