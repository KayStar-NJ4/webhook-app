#!/usr/bin/env node

/**
 * Script để setup local development với ngrok
 * Usage: node scripts/setup-local.js
 */

const { spawn } = require('child_process');
const axios = require('axios');
const config = require('../src/config');

async function setupLocal() {
  console.log('🚀 Setting up local development environment...\n');
  
  // Kiểm tra ngrok có được cài đặt không
  console.log('1️⃣ Checking ngrok installation...');
  try {
    const { exec } = require('child_process');
    await new Promise((resolve, reject) => {
      exec('ngrok version', (error, stdout, stderr) => {
        if (error) {
          console.log('   ❌ ngrok not found');
          console.log('   💡 Please install ngrok:');
          console.log('      - yarn global add ngrok');
          console.log('      - or download from https://ngrok.com/');
          reject(error);
        } else {
          console.log(`   ✅ ngrok installed: ${stdout.trim()}`);
          resolve();
        }
      });
    });
  } catch (error) {
    process.exit(1);
  }
  
  // Kiểm tra server có đang chạy không
  console.log('\n2️⃣ Checking if server is running...');
  try {
    const response = await axios.get(`http://localhost:${config.server.port}/health`);
    if (response.status === 200) {
      console.log(`   ✅ Server is running on port ${config.server.port}`);
    }
  } catch (error) {
    console.log(`   ❌ Server not running on port ${config.server.port}`);
    console.log('   💡 Please start the server first: yarn dev');
    process.exit(1);
  }
  
  // Lấy ngrok URL
  console.log('\n3️⃣ Getting ngrok URL...');
  try {
    const response = await axios.get('http://localhost:4040/api/tunnels');
    const tunnels = response.data.tunnels;
    
    if (tunnels.length === 0) {
      console.log('   ❌ No ngrok tunnels found');
      console.log('   💡 Please start ngrok: ngrok http 3000');
      process.exit(1);
    }
    
    const httpsTunnel = tunnels.find(t => t.proto === 'https');
    if (!httpsTunnel) {
      console.log('   ❌ No HTTPS tunnel found');
      console.log('   💡 Please start ngrok with HTTPS: ngrok http 3000');
      process.exit(1);
    }
    
    const ngrokUrl = httpsTunnel.public_url;
    console.log(`   ✅ ngrok URL: ${ngrokUrl}`);
    
    // Cập nhật .env file
    console.log('\n4️⃣ Updating .env file...');
    const fs = require('fs');
    const path = require('path');
    
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
      console.log('   ❌ .env file not found');
      console.log('   💡 Please copy env.example to .env first');
      process.exit(1);
    }
    
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(
      /TELEGRAM_WEBHOOK_URL=.*/,
      `TELEGRAM_WEBHOOK_URL=${ngrokUrl}`
    );
    fs.writeFileSync(envPath, envContent);
    
    console.log(`   ✅ Updated TELEGRAM_WEBHOOK_URL to ${ngrokUrl}`);
    
    // Setup Telegram webhook
    console.log('\n5️⃣ Setting up Telegram webhook...');
    try {
      const telegramService = require('../src/services/telegramService');
      await telegramService.setWebhook(`${ngrokUrl}/webhook/telegram`);
      console.log('   ✅ Telegram webhook set successfully');
    } catch (error) {
      console.log(`   ❌ Failed to set Telegram webhook: ${error.message}`);
    }
    
    console.log('\n🎉 Local development setup completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Test your bot by sending a message');
    console.log('2. Check logs: yarn logs');
    console.log('3. Configure Chatwoot webhook if needed');
    
  } catch (error) {
    console.log(`   ❌ Failed to get ngrok URL: ${error.message}`);
    console.log('   💡 Make sure ngrok is running: ngrok http 3000');
    process.exit(1);
  }
}

// Chạy script
if (require.main === module) {
  setupLocal();
}

module.exports = setupLocal;
