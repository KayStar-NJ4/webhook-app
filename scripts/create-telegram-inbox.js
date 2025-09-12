#!/usr/bin/env node

/**
 * Create Telegram Inbox in Chatwoot
 * This script creates a Telegram inbox if it doesn't exist
 */

require('dotenv').config();
const axios = require('axios');

async function createTelegramInbox() {
  console.log('🔧 Creating Telegram Inbox in Chatwoot...\n');
  
  const baseUrl = process.env.CHATWOOT_BASE_URL;
  const accessToken = process.env.CHATWOOT_ACCESS_TOKEN;
  const accountId = process.env.CHATWOOT_ACCOUNT_ID;
  
  if (!baseUrl || !accessToken || !accountId) {
    console.log('❌ Missing required configuration. Please check your .env file.');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };
  
  try {
    // First, check if Telegram inbox already exists
    console.log('🔍 Checking existing inboxes...');
    const inboxesResponse = await axios.get(
      `${baseUrl}/api/v1/accounts/${accountId}/inboxes`,
      { headers }
    );
    
    const existingInboxes = inboxesResponse.data.payload || [];
    const telegramInbox = existingInboxes.find(inbox => inbox.channel_type === 'Channel::Telegram');
    
    if (telegramInbox) {
      console.log(`✅ Telegram inbox already exists:`);
      console.log(`  ID: ${telegramInbox.id}`);
      console.log(`  Name: ${telegramInbox.name}`);
      console.log(`  Type: ${telegramInbox.channel_type}`);
      console.log(`\n💡 Update your .env file with: CHATWOOT_INBOX_ID=${telegramInbox.id}`);
      return;
    }
    
    // Create new Telegram inbox
    console.log('🔧 Creating new Telegram inbox...');
    const createPayload = {
      name: 'Telegram Bot',
      channel: {
        type: 'telegram',
        bot_token: process.env.TELEGRAM_BOT_TOKEN || 'your_telegram_bot_token'
      }
    };
    
    const createResponse = await axios.post(
      `${baseUrl}/api/v1/accounts/${accountId}/inboxes`,
      createPayload,
      { headers }
    );
    
    const newInbox = createResponse.data;
    console.log(`✅ Telegram inbox created successfully:`);
    console.log(`  ID: ${newInbox.id}`);
    console.log(`  Name: ${newInbox.name}`);
    console.log(`  Type: ${newInbox.channel_type}`);
    console.log(`\n💡 Update your .env file with: CHATWOOT_INBOX_ID=${newInbox.id}`);
    
  } catch (error) {
    console.log('❌ Failed to create Telegram inbox:');
    console.log(`  Error: ${error.message}`);
    
    if (error.response) {
      console.log(`  Status: ${error.response.status} ${error.response.statusText}`);
      console.log(`  Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// Run the script
createTelegramInbox().catch(console.error);
