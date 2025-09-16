const { Pool } = require('pg');
require('dotenv').config();

async function checkDatabase() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'chatwoot_webhook',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true'
  });

  try {
    console.log('Connecting to database...');
    
    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('platform_mappings', 'telegram_bots', 'chatwoot_accounts', 'dify_apps')
      ORDER BY table_name;
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    console.log('Available tables:', tablesResult.rows.map(r => r.table_name));
    
    // Check platform_mappings
    if (tablesResult.rows.some(r => r.table_name === 'platform_mappings')) {
      const mappingsQuery = 'SELECT * FROM platform_mappings LIMIT 5;';
      const mappingsResult = await pool.query(mappingsQuery);
      console.log('Platform mappings:', mappingsResult.rows);
    }
    
    // Check telegram_bots
    if (tablesResult.rows.some(r => r.table_name === 'telegram_bots')) {
      const botsQuery = 'SELECT id, name, is_active FROM telegram_bots LIMIT 5;';
      const botsResult = await pool.query(botsQuery);
      console.log('Telegram bots:', botsResult.rows);
    }
    
    // Check chatwoot_accounts
    if (tablesResult.rows.some(r => r.table_name === 'chatwoot_accounts')) {
      const accountsQuery = 'SELECT id, name, is_active FROM chatwoot_accounts LIMIT 5;';
      const accountsResult = await pool.query(accountsQuery);
      console.log('Chatwoot accounts:', accountsResult.rows);
    }
    
    // Check dify_apps
    if (tablesResult.rows.some(r => r.table_name === 'dify_apps')) {
      const appsQuery = 'SELECT id, name, is_active FROM dify_apps LIMIT 5;';
      const appsResult = await pool.query(appsQuery);
      console.log('Dify apps:', appsResult.rows);
    }
    
  } catch (error) {
    console.error('Database check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();
