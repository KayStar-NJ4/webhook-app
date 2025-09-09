const express = require('express');
const telegramHandler = require('../handlers/telegramHandler');
const chatwootHandler = require('../handlers/chatwootHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'turbo-chatwoot-webhook'
  });
});

// Telegram webhook endpoints
router.post('/webhook/telegram', async (req, res) => {
  await telegramHandler.handleWebhook(req, res);
});

// Chatwoot webhook endpoints
router.post('/webhook/chatwoot', 
  chatwootHandler.verifyWebhook,
  async (req, res) => {
    await chatwootHandler.handleWebhook(req, res);
  }
);

// API endpoints for testing and management
router.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'running',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// API endpoint để tạo conversation mapping thủ công
router.post('/api/mapping', (req, res) => {
  try {
    const { telegramConversationId, chatwootConversationId } = req.body;
    
    if (!telegramConversationId || !chatwootConversationId) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing telegramConversationId or chatwootConversationId'
      });
    }
    
    const messageBroker = require('../services/messageBroker');
    messageBroker.conversationMap.set(telegramConversationId, chatwootConversationId);
    
    res.status(200).json({
      status: 'success',
      message: 'Mapping created successfully',
      mapping: {
        telegram: telegramConversationId,
        chatwoot: chatwootConversationId
      }
    });
    
  } catch (error) {
    logger.error('Failed to create mapping', {
      error: error.message
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to create mapping'
    });
  }
});

// Get conversation mappings
router.get('/api/conversations', (req, res) => {
  try {
    const messageBroker = require('../services/messageBroker');
    const mappings = messageBroker.getAllConversationMappings();
    
    res.status(200).json({
      status: 'ok',
      data: mappings,
      count: mappings.length
    });
  } catch (error) {
    logger.error('Failed to get conversation mappings', {
      error: error.message
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to get conversation mappings'
    });
  }
});

// Test endpoint for sending messages
router.post('/api/test/telegram', async (req, res) => {
  try {
    const { chatId, message } = req.body;
    
    if (!chatId || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'chatId and message are required'
      });
    }

    const telegramService = require('../services/telegramService');
    const result = await telegramService.sendMessage(chatId, message);
    
    res.status(200).json({
      status: 'ok',
      data: result
    });
  } catch (error) {
    logger.error('Failed to send test Telegram message', {
      error: error.message
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to send test message'
    });
  }
});

// Test endpoint for Dify AI
router.post('/api/test/dify', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    if (!message || !userId) {
      return res.status(400).json({
        status: 'error',
        message: 'message and userId are required'
      });
    }

    const difyService = require('../services/difyService');
    const result = await difyService.sendMessage(message, userId);
    
    res.status(200).json({
      status: 'ok',
      data: result
    });
  } catch (error) {
    logger.error('Failed to send test message to Dify', {
      error: error.message
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to send test message to Dify'
    });
  }
});

// Setup Telegram webhook
router.post('/api/telegram/setup', async (req, res) => {
  try {
    const { webhookUrl } = req.body;
    
    if (!webhookUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'webhookUrl is required'
      });
    }

    const telegramService = require('../services/telegramService');
    const result = await telegramService.setWebhook(webhookUrl);
    
    res.status(200).json({
      status: 'ok',
      data: result
    });
  } catch (error) {
    logger.error('Failed to setup Telegram webhook', {
      error: error.message
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to setup Telegram webhook'
    });
  }
});

// Get Telegram webhook info
router.get('/api/telegram/webhook-info', async (req, res) => {
  try {
    const telegramService = require('../services/telegramService');
    const result = await telegramService.getWebhookInfo();
    
    res.status(200).json({
      status: 'ok',
      data: result
    });
  } catch (error) {
    logger.error('Failed to get Telegram webhook info', {
      error: error.message
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to get Telegram webhook info'
    });
  }
});

// Delete Telegram webhook
router.delete('/api/telegram/webhook', async (req, res) => {
  try {
    const telegramService = require('../services/telegramService');
    const result = await telegramService.deleteWebhook();
    
    res.status(200).json({
      status: 'ok',
      data: result
    });
  } catch (error) {
    logger.error('Failed to delete Telegram webhook', {
      error: error.message
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete Telegram webhook'
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  logger.error('Unhandled error in routes', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

module.exports = router;
