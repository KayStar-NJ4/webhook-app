#!/usr/bin/env node

/**
 * Test Dify AI Connection
 * This script helps diagnose Dify configuration issues
 */

require('dotenv').config();
const axios = require('axios');

async function testDifyConnection() {
  console.log('🔍 Testing Dify AI Connection...\n');
  
  // Get configuration from environment
  const apiUrl = process.env.DIFY_API_URL;
  const apiKey = process.env.DIFY_API_KEY;
  const appId = process.env.DIFY_APP_ID;
  
  // Check if all required variables are set
  console.log('📋 Configuration Check:');
  console.log(`  DIFY_API_URL: ${apiUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`  DIFY_API_KEY: ${apiKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`  DIFY_APP_ID: ${appId ? '✅ Set' : '❌ Missing'}\n`);
  
  if (!apiUrl || !apiKey || !appId) {
    console.log('❌ Missing required Dify configuration. Please check your .env file.');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };
  
  try {
    // Test 1: Send a simple message to Dify
    console.log('🔍 Test 1: Sending test message to Dify...');
    
    const payload = {
      inputs: {
        query: 'Hello, this is a test message'
      },
      query: 'Hello, this is a test message',
      response_mode: 'blocking',
      user: 'test-user-123'
    };
    
    console.log(`  URL: ${apiUrl}/v1/chat-messages`);
    console.log(`  Payload:`, JSON.stringify(payload, null, 2));
    
    const response = await axios.post(
      `${apiUrl}/v1/chat-messages`,
      payload,
      { headers }
    );
    
    console.log(`  ✅ Message sent successfully`);
    console.log(`  Response ID: ${response.data.id}`);
    console.log(`  Conversation ID: ${response.data.conversation_id}`);
    console.log(`  Answer: ${response.data.answer}`);
    console.log(`  Usage:`, response.data.metadata?.usage || 'N/A');
    
    console.log('\n🎉 Dify AI connection test successful!');
    
  } catch (error) {
    console.log('❌ Test failed:');
    console.log(`  Error: ${error.message}`);
    
    if (error.response) {
      console.log(`  Status: ${error.response.status} ${error.response.statusText}`);
      console.log(`  Response: ${JSON.stringify(error.response.data, null, 2)}`);
      
      // Provide specific guidance based on error
      if (error.response.status === 401) {
        console.log('\n💡 Suggestion: Check your DIFY_API_KEY. It might be invalid or expired.');
      } else if (error.response.status === 404) {
        console.log('\n💡 Suggestion: Check your DIFY_API_URL. The endpoint might be incorrect.');
      } else if (error.response.status === 400) {
        console.log('\n💡 Suggestion: Check your DIFY_APP_ID or request payload format.');
      }
    }
  }
}

// Run the test
testDifyConnection().catch(console.error);
