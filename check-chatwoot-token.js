const { Pool } = require('pg');
require('dotenv').config();

async function checkChatwootToken() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'chatwoot_webhook',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true'
  });

  try {
    console.log('Checking Chatwoot account details...');
    
    const query = 'SELECT id, name, base_url, access_token, is_active FROM chatwoot_accounts WHERE id = 1;';
    const result = await pool.query(query);
    
    if (result.rows.length > 0) {
      const account = result.rows[0];
      console.log('Chatwoot Account Details:');
      console.log('- ID:', account.id);
      console.log('- Name:', account.name);
      console.log('- Base URL:', account.base_url);
      console.log('- Access Token:', account.access_token ? account.access_token.substring(0, 20) + '...' : 'NULL');
      console.log('- Is Active:', account.is_active);
      
      // Test the token
      const axios = require('axios');
      try {
        const testResponse = await axios.get(`${account.base_url}/api/v1/accounts/${account.id}`, {
          headers: { 'api_access_token': account.access_token },
          timeout: 10000
        });
        console.log('✅ Token is valid!');
        console.log('Account info:', testResponse.data);
      } catch (error) {
        console.log('❌ Token test failed:', error.response?.status, error.response?.data);
      }
    } else {
      console.log('No Chatwoot account found with ID 1');
    }
    
  } catch (error) {
    console.error('Check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkChatwootToken();
