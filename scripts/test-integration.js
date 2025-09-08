#!/usr/bin/env node

/**
 * Script để test tích hợp các service
 * Usage: node scripts/test-integration.js
 */

const config = require('../src/config');
const logger = require('../src/utils/logger');

async function testIntegration() {
  console.log('🧪 Testing integration...\n');
  
  let allTestsPassed = true;
  
  // Test 1: Telegram Service
  console.log('1️⃣ Testing Telegram Service...');
  try {
    const telegramService = require('../src/services/telegramService');
    const botInfo = await telegramService.getBotInfo();
    console.log(`   ✅ Bot: @${botInfo.result.username}`);
  } catch (error) {
    console.log(`   ❌ Telegram Service: ${error.message}`);
    allTestsPassed = false;
  }
  
  // Test 2: Chatwoot Service
  console.log('\n2️⃣ Testing Chatwoot Service...');
  try {
    const chatwootService = require('../src/services/chatwootService');
    // Test bằng cách tìm contact (không tạo mới)
    const contacts = await chatwootService.findContactBySourceId('test_user');
    console.log(`   ✅ Chatwoot API: Connected (found ${contacts.length} contacts)`);
  } catch (error) {
    console.log(`   ❌ Chatwoot Service: ${error.message}`);
    allTestsPassed = false;
  }
  
  // Test 3: Dify AI Service
  console.log('\n3️⃣ Testing Dify AI Service...');
  try {
    const difyService = require('../src/services/difyService');
    const appInfo = await difyService.getAppInfo();
    console.log(`   ✅ Dify AI: Connected`);
  } catch (error) {
    console.log(`   ❌ Dify AI Service: ${error.message}`);
    allTestsPassed = false;
  }
  
  // Test 4: Environment Variables
  console.log('\n4️⃣ Testing Environment Variables...');
  const requiredVars = [
    'TELEGRAM_BOT_TOKEN',
    'CHATWOOT_BASE_URL',
    'CHATWOOT_ACCESS_TOKEN',
    'CHATWOOT_ACCOUNT_ID',
    'DIFY_API_URL',
    'DIFY_API_KEY',
    'DIFY_APP_ID'
  ];
  
  let envTestPassed = true;
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`   ✅ ${varName}: Configured`);
    } else {
      console.log(`   ❌ ${varName}: Missing`);
      envTestPassed = false;
    }
  });
  
  if (!envTestPassed) {
    allTestsPassed = false;
  }
  
  // Test 5: Server Health
  console.log('\n5️⃣ Testing Server Health...');
  try {
    const axios = require('axios');
    const response = await axios.get(`http://localhost:${config.server.port}/health`);
    if (response.status === 200) {
      console.log(`   ✅ Server: Running on port ${config.server.port}`);
    } else {
      throw new Error(`Server returned status ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Server Health: ${error.message}`);
    console.log(`   💡 Make sure server is running: npm start`);
    allTestsPassed = false;
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('🎉 All tests passed! Integration is working correctly.');
    console.log('\n📝 Next steps:');
    console.log('1. Setup Telegram webhook: node scripts/setup-telegram.js');
    console.log('2. Configure Chatwoot webhook in admin panel');
    console.log('3. Test with real messages');
  } else {
    console.log('❌ Some tests failed. Please check the errors above.');
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your .env file configuration');
    console.log('2. Verify API credentials');
    console.log('3. Ensure all services are accessible');
    process.exit(1);
  }
}

// Chạy script
if (require.main === module) {
  testIntegration();
}

module.exports = testIntegration;
