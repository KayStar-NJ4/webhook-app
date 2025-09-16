const { Pool } = require('pg');
require('dotenv').config();

async function updateChatwootToken() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'chatwoot_webhook',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true'
  });

  try {
    console.log('Updating Chatwoot token...');
    
    // Update the access token with the new one from browser
    const newToken = 'fsAasUTFZpJBWS7C-gFGYw';
    
    const updateQuery = `
      UPDATE chatwoot_accounts 
      SET access_token = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
      RETURNING id, name, base_url, access_token, is_active;
    `;
    
    const result = await pool.query(updateQuery, [newToken]);
    
    if (result.rows.length > 0) {
      console.log('✅ Chatwoot token updated successfully!');
      console.log('Updated account:', result.rows[0]);
      
      // Test the new token
      const axios = require('axios');
      try {
        const testResponse = await axios.get(`${result.rows[0].base_url}/api/v1/accounts/${result.rows[0].id}`, {
          headers: { 
            'access-token': newToken,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
        console.log('✅ Token test successful!');
        console.log('Account info:', testResponse.data);
      } catch (error) {
        console.log('❌ Token test failed:', error.response?.status, error.response?.data);
      }
    } else {
      console.log('❌ No account found to update');
    }
    
  } catch (error) {
    console.error('Update failed:', error.message);
  } finally {
    await pool.end();
  }
}

updateChatwootToken();
