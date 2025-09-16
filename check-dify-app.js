const { Pool } = require('pg');
require('dotenv').config();

async function checkDifyApp() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'chatwoot_webhook',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true'
  });

  try {
    console.log('Checking Dify app details...');
    
    const query = 'SELECT id, name, api_url, api_key, app_id, is_active FROM dify_apps WHERE id = 1;';
    const result = await pool.query(query);
    
    if (result.rows.length > 0) {
      const app = result.rows[0];
      console.log('Dify App Details:');
      console.log('- ID:', app.id);
      console.log('- Name:', app.name);
      console.log('- API URL:', app.api_url);
      console.log('- API Key:', app.api_key ? app.api_key.substring(0, 20) + '...' : 'NULL');
      console.log('- App ID:', app.app_id);
      console.log('- Is Active:', app.is_active);
      
      // Test different Dify endpoints
      const axios = require('axios');
      const endpoints = [
        '/chat-messages',
        '/v1/chat-messages', 
        '/api/v1/chat-messages',
        '/console/api/chat-messages',
        '/api/chat-messages'
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`\nTesting endpoint: ${app.api_url}${endpoint}`);
          const testResponse = await axios.post(`${app.api_url}${endpoint}`, {
            inputs: {},
            query: 'test',
            response_mode: 'blocking',
            user: 'test-user'
          }, {
            headers: { 
              'Authorization': `Bearer ${app.api_key}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          });
          console.log('✅ Endpoint works!', testResponse.status);
          break;
        } catch (error) {
          console.log(`❌ ${endpoint}:`, error.response?.status || error.message);
        }
      }
    } else {
      console.log('No Dify app found with ID 1');
    }
    
  } catch (error) {
    console.error('Check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkDifyApp();
