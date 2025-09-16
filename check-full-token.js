const { Pool } = require('pg');
require('dotenv').config();

async function checkFullToken() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'chatwoot_webhook',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true'
  });

  try {
    console.log('Checking full token...');
    
    const query = 'SELECT access_token FROM chatwoot_accounts WHERE id = 1;';
    const result = await pool.query(query);
    
    if (result.rows.length > 0) {
      const token = result.rows[0].access_token;
      console.log('Full token length:', token.length);
      console.log('Token:', token);
      
      // Test JWT decode
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token);
      console.log('Decoded:', JSON.stringify(decoded, null, 2));
    }
    
  } catch (error) {
    console.error('Check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkFullToken();
