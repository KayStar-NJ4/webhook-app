const axios = require('axios');

async function setupTelegramWebhook() {
  try {
    const botToken = '8457458724:AAGbUN5FFumaKfs62h9sygeYd929LeULNpw';
    const webhookUrl = 'https://35c3bb149362.ngrok-free.app/webhook/telegram';
    
    console.log('Setting up Telegram webhook...');
    console.log('Bot Token:', botToken.substring(0, 10) + '...');
    console.log('Webhook URL:', webhookUrl);
    
    const response = await axios.post(
      `https://api.telegram.org/bot${botToken}/setWebhook`,
      {
        url: webhookUrl,
        allowed_updates: ['message']
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    console.log('Webhook setup result:', response.data);
    
    if (response.data.ok) {
      console.log('✅ Telegram webhook setup successful!');
      
      // Check webhook info
      const infoResponse = await axios.get(
        `https://api.telegram.org/bot${botToken}/getWebhookInfo`
      );
      
      console.log('Webhook info:', infoResponse.data);
    } else {
      console.error('❌ Failed to setup webhook:', response.data.description);
    }
    
  } catch (error) {
    console.error('❌ Error setting up webhook:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

setupTelegramWebhook();
