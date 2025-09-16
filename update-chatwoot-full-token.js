const { Pool } = require('pg');
require('dotenv').config();

async function updateChatwootFullToken() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'chatwoot_webhook',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true'
  });

  try {
    console.log('Updating Chatwoot with full token info...');
    
    // Store the JWT token that contains all the required info
    const jwtToken = 'eyJhY2Nlc3MtdG9rZW4iOiJmc0Fhc1VURlpwSkJXUzdDLWdGR1l3IiwidG9rZW4tdHlwZSI6IkJlYXJlciIsImNsaWVudCI6InVjQzg2T0RxNS1penFyd2FhNTRFQnciLCJleHBpcnkiOiIxNzYyNzgyMjExIiwidWlkIjoidGh1YW5wdC53b3JrQGdtYWlsLmNvbSJ9';
    
    const updateQuery = `
      UPDATE chatwoot_accounts 
      SET access_token = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
      RETURNING id, name, base_url, access_token, is_active;
    `;
    
    const result = await pool.query(updateQuery, [jwtToken]);
    
    if (result.rows.length > 0) {
      console.log('✅ Chatwoot JWT token updated successfully!');
      console.log('Updated account:', {
        id: result.rows[0].id,
        name: result.rows[0].name,
        base_url: result.rows[0].base_url,
        access_token: result.rows[0].access_token.substring(0, 50) + '...',
        is_active: result.rows[0].is_active
      });
    } else {
      console.log('❌ No account found to update');
    }
    
  } catch (error) {
    console.error('Update failed:', error.message);
  } finally {
    await pool.end();
  }
}

updateChatwootFullToken();
