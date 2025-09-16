const { Pool } = require('pg');
require('dotenv').config();

async function checkUsers() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'chatwoot_webhook',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true'
  });

  try {
    console.log('Checking users...');
    
    // Check if users table exists
    const usersQuery = 'SELECT id, username, email, is_active FROM users LIMIT 5;';
    const usersResult = await pool.query(usersQuery);
    console.log('Users:', usersResult.rows);
    
    if (usersResult.rows.length === 0) {
      console.log('No users found. Creating admin user...');
      
      // Create admin user
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const createUserQuery = `
        INSERT INTO users (username, email, password_hash, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, username, email;
      `;
      
      const createResult = await pool.query(createUserQuery, [
        'admin',
        'admin@example.com',
        hashedPassword,
        true
      ]);
      
      console.log('Created admin user:', createResult.rows[0]);
    }
    
  } catch (error) {
    console.error('User check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsers();
