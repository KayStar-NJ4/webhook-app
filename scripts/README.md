# Scripts Documentation

This directory contains all scripts for the Turbo Chatwoot Webhook project, organized by purpose.

## Directory Structure

```
scripts/
├── setup/           # Setup and initialization scripts
├── migrations/      # Database migration files
├── tests/          # Test scripts
├── migrate.js      # Migration runner
└── README.md       # This file
```

## Setup Scripts

### Database Setup
```bash
# Full database setup (migrations + sample data)
node scripts/setup/database.js

# Show current configurations
node scripts/setup/database.js config
```

### Development Environment Setup
```bash
# Complete development setup
node scripts/setup/dev.js

# Show current configuration
node scripts/setup/dev.js config
```

## Migration Scripts

### Run Migrations
```bash
# Run all pending migrations
node scripts/migrate.js

# Show migration status
node scripts/migrate.js status
```

### Migration Files
- `001_initial_schema.sql` - Initial database schema with all tables

## Test Scripts

### Configuration Tests
```bash
# Test ConfigurationService functionality
node scripts/tests/test-configuration.js
```

### Webhook Tests
```bash
# Test all webhook endpoints
node scripts/tests/test-webhook.js

# Test with custom message
node scripts/tests/test-webhook.js "Hello, this is a test"
```

## Quick Start

1. **Setup development environment:**
   ```bash
   node scripts/setup/dev.js
   ```

2. **Update .env file** with your actual configuration values

3. **Start the application:**
   ```bash
   yarn start
   ```

4. **Test the setup:**
   ```bash
   node scripts/tests/test-webhook.js
   ```

## Environment Variables

Make sure your `.env` file contains:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=turbo_chatwoot_webhook
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Chatwoot
CHATWOOT_BASE_URL=https://your-chatwoot-instance.com
CHATWOOT_ACCESS_TOKEN=your_chatwoot_access_token
CHATWOOT_ACCOUNT_ID=your_account_id

# Dify
DIFY_API_URL=https://api.dify.ai/v1
DIFY_API_KEY=your_dify_api_key
DIFY_APP_ID=your_dify_app_id
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists

### Configuration Issues
- Run `node scripts/setup/database.js` to ensure configurations table exists
- Check `node scripts/tests/test-configuration.js` for configuration service issues

### Webhook Issues
- Ensure application is running (`yarn start`)
- Check webhook URLs are accessible
- Verify API keys and tokens are correct

## Script Dependencies

- `pg` - PostgreSQL client
- `axios` - HTTP client for testing
- Project services and repositories

## Adding New Scripts

1. **Setup scripts** go in `scripts/setup/`
2. **Test scripts** go in `scripts/tests/`
3. **Migration files** go in `scripts/migrations/`
4. Follow the existing naming conventions
5. Add CLI interface with help text
6. Update this README
