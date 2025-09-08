#!/usr/bin/env node

/**
 * Script để thiết lập Telegram webhook
 * Usage: node scripts/setup-telegram.js
 */

const axios = require('axios');
const config = require('../src/config');
const logger = require('../src/utils/logger');

async function setupTelegramWebhook() {
  try {
    console.log('🤖 Setting up Telegram webhook...');
    
    if (!config.telegram.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured');
    }
    
    if (!config.telegram.webhookUrl) {
      throw new Error('TELEGRAM_WEBHOOK_URL is not configured');
    }

    const telegramService = require('../src/services/telegramService');
    
    // Lấy thông tin bot
    console.log('📋 Getting bot info...');
    const botInfo = await telegramService.getBotInfo();
    console.log(`✅ Bot: @${botInfo.result.username} (${botInfo.result.first_name})`);
    
    // Thiết lập webhook
    console.log('🔗 Setting up webhook...');
    const webhookResult = await telegramService.setWebhook(config.telegram.webhookUrl);
    
    if (webhookResult.ok) {
      console.log('✅ Webhook set successfully!');
      console.log(`📍 Webhook URL: ${config.telegram.webhookUrl}`);
    } else {
      throw new Error(`Failed to set webhook: ${webhookResult.description}`);
    }
    
    // Kiểm tra webhook info
    console.log('🔍 Checking webhook info...');
    const webhookInfo = await telegramService.getWebhookInfo();
    console.log('📊 Webhook Info:', JSON.stringify(webhookInfo, null, 2));
    
    console.log('\n🎉 Telegram webhook setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Test your bot by sending a message');
    console.log('2. Check logs for incoming messages');
    console.log('3. Verify Chatwoot integration');
    
  } catch (error) {
    console.error('❌ Failed to setup Telegram webhook:', error.message);
    logger.error('Telegram webhook setup failed', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Chạy script
if (require.main === module) {
  setupTelegramWebhook();
}

module.exports = setupTelegramWebhook;
