const { Pool } = require('pg');
require('dotenv').config();

async function debugChatwootToken() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'chatwoot_webhook',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true'
  });

  try {
    console.log('Debugging Chatwoot token...');
    
    const query = 'SELECT id, name, base_url, access_token, account_id, is_active FROM chatwoot_accounts WHERE id = 1;';
    const result = await pool.query(query);
    
    if (result.rows.length > 0) {
      const account = result.rows[0];
      console.log('Chatwoot Account from DB:');
      console.log('- ID:', account.id);
      console.log('- Name:', account.name);
      console.log('- Base URL:', account.base_url);
      console.log('- Account ID:', account.account_id);
      console.log('- Access Token:', account.access_token ? account.access_token.substring(0, 50) + '...' : 'NULL');
      console.log('- Is Active:', account.is_active);
      
      // Test the token with the same method as in PlatformMappingService
      const axios = require('axios');
      
      // Parse the access token to extract required headers
      let headers = {}
      
      if (account.access_token) {
        // If access_token is a simple token, use it as access-token header
        if (!account.access_token.includes('.')) {
          headers = {
            'access-token': account.access_token,
            'Content-Type': 'application/json'
          }
        } else {
          // If it's a JWT token, try to decode it to get the required headers
          try {
            const jwt = require('jsonwebtoken')
            const decoded = jwt.decode(account.access_token)
            
            if (decoded) {
              headers = {
                'access-token': decoded['access-token'] || account.access_token,
                'client': decoded.client || '',
                'uid': decoded.uid || '',
                'authorization': `Bearer ${account.access_token}`,
                'Content-Type': 'application/json'
              }
            } else {
              headers = {
                'access-token': account.access_token,
                'Content-Type': 'application/json'
              }
            }
          } catch (jwtError) {
            // If JWT decode fails, use as simple access-token
            headers = {
              'access-token': account.access_token,
              'Content-Type': 'application/json'
            }
          }
        }
      }
      
      console.log('\nHeaders being used:');
      console.log(JSON.stringify(headers, null, 2));
      
      // Test the connection
      try {
        const response = await axios.get(`${account.base_url}/api/v1/accounts/${account.account_id}`, {
          headers,
          timeout: 10000
        });
        console.log('\n✅ Connection successful!');
        console.log('Response:', response.data);
      } catch (error) {
        console.log('\n❌ Connection failed:');
        console.log('Status:', error.response?.status);
        console.log('Data:', error.response?.data);
      }
    } else {
      console.log('No Chatwoot account found');
    }
    
  } catch (error) {
    console.error('Debug failed:', error.message);
  } finally {
    await pool.end();
  }
}

debugChatwootToken();
