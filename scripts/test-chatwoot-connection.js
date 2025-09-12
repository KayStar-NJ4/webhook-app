#!/usr/bin/env node

/**
 * Test Chatwoot API Connection
 * This script helps diagnose Chatwoot configuration issues
 */

require('dotenv').config();
const axios = require('axios');

async function testChatwootConnection() {
  console.log('🔍 Testing Chatwoot API Connection...\n');
  
  // Get configuration from environment
  const baseUrl = process.env.CHATWOOT_BASE_URL;
  const accessToken = process.env.CHATWOOT_ACCESS_TOKEN;
  const accountId = process.env.CHATWOOT_ACCOUNT_ID;
  
  // Check if all required variables are set
  console.log('📋 Configuration Check:');
  console.log(`  CHATWOOT_BASE_URL: ${baseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`  CHATWOOT_ACCESS_TOKEN: ${accessToken ? '✅ Set' : '❌ Missing'}`);
  console.log(`  CHATWOOT_ACCOUNT_ID: ${accountId ? '✅ Set' : '❌ Missing'}`);
  console.log(`  CHATWOOT_INBOX_ID: ✅ Auto-detected (no longer required)\n`);
  
  if (!baseUrl || !accessToken || !accountId) {
    console.log('❌ Missing required configuration. Please check your .env file.');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };
  
  try {
    // Test 1: Check account access
    console.log('🔍 Test 1: Checking account access...');
    const accountUrl = `${baseUrl}/api/v1/accounts/${accountId}`;
    console.log(`  URL: ${accountUrl}`);
    
    const accountResponse = await axios.get(accountUrl, { headers });
    console.log(`  ✅ Account access successful`);
    console.log(`  Account Name: ${accountResponse.data.name}`);
    console.log(`  Account ID: ${accountResponse.data.id}\n`);
    
    // Test 2: Check inbox access (auto-detect Telegram inbox)
    console.log('🔍 Test 2: Checking Telegram inbox access...');
    
    // Get all inboxes
    const inboxesResponse = await axios.get(
      `${baseUrl}/api/v1/accounts/${accountId}/inboxes`,
      { headers }
    );
    
    const inboxes = inboxesResponse.data.payload || [];
    const telegramInbox = inboxes.find(inbox => inbox.channel_type === 'Channel::Telegram');
    
    if (telegramInbox) {
      console.log(`  ✅ Telegram inbox found`);
      console.log(`  Inbox Name: ${telegramInbox.name}`);
      console.log(`  Inbox Type: ${telegramInbox.channel_type}`);
      console.log(`  Inbox ID: ${telegramInbox.id}\n`);
    } else {
      console.log(`  ⚠️  No Telegram inbox found, will create one automatically when needed\n`);
    }
    
    // Test 3: List all inboxes to help with configuration
    console.log('🔍 Test 3: Listing all available inboxes...');
    console.log(`  URL: ${baseUrl}/api/v1/accounts/${accountId}/inboxes`);
    
    console.log(`  ✅ Found ${inboxes.length} inboxes:`);
    inboxes.forEach((inbox, index) => {
      console.log(`    ${index + 1}. ID: ${inbox.id}, Name: ${inbox.name}, Type: ${inbox.channel_type}`);
    });
    console.log('');
    
    // Test 4: Check conversations endpoint
    console.log('🔍 Test 4: Testing conversations endpoint...');
    const conversationsUrl = `${baseUrl}/api/v1/accounts/${accountId}/conversations`;
    console.log(`  URL: ${conversationsUrl}`);
    
    const conversationsResponse = await axios.get(conversationsUrl, { 
      headers,
      params: telegramInbox ? { inbox_id: telegramInbox.id } : {}
    });
    
    const conversations = conversationsResponse.data.data || [];
    console.log(`  ✅ Conversations endpoint accessible`);
    console.log(`  Found ${conversations.length} conversations${telegramInbox ? ` in Telegram inbox` : ''}\n`);
    
    console.log('🎉 All tests passed! Your Chatwoot configuration is working correctly.');
    
  } catch (error) {
    console.log('❌ Test failed:');
    console.log(`  Error: ${error.message}`);
    
    if (error.response) {
      console.log(`  Status: ${error.response.status} ${error.response.statusText}`);
      console.log(`  Response: ${JSON.stringify(error.response.data, null, 2)}`);
      
      // Provide specific guidance based on error
      if (error.response.status === 401) {
        console.log('\n💡 Suggestion: Check your CHATWOOT_ACCESS_TOKEN. It might be invalid or expired.');
      } else if (error.response.status === 404) {
        console.log('\n💡 Suggestion: Check your CHATWOOT_ACCOUNT_ID and CHATWOOT_INBOX_ID. They might be incorrect.');
        console.log('   Use the inbox list above to find the correct inbox ID.');
      } else if (error.response.status === 403) {
        console.log('\n💡 Suggestion: Your access token might not have permission to access this account/inbox.');
      }
    }
  }
}

// Run the test
testChatwootConnection().catch(console.error);
