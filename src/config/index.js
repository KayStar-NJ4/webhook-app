require('dotenv').config();

const config = {
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    webhookUrl: `${process.env.TELEGRAM_WEBHOOK_URL}/telegram`
  },
  
  chatwoot: {
    baseUrl: process.env.CHATWOOT_BASE_URL,
    accessToken: process.env.CHATWOOT_ACCESS_TOKEN,
    accountId: process.env.CHATWOOT_ACCOUNT_ID
    // inboxId will be auto-detected, not required in config
  },
  
  dify: {
    apiUrl: process.env.DIFY_API_URL,
    apiKey: process.env.DIFY_API_KEY,
    appId: process.env.DIFY_APP_ID
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

// Validate required environment variables
const requiredEnvVars = [
  'TELEGRAM_BOT_TOKEN',
  'CHATWOOT_BASE_URL',
  'CHATWOOT_ACCESS_TOKEN',
  'CHATWOOT_ACCOUNT_ID',
  'DIFY_API_URL',
  'DIFY_API_KEY',
  'DIFY_APP_ID'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

module.exports = config;
