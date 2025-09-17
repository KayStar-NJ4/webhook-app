# Migration Guide - v1.0 to v2.0

## 🚀 Overview

This guide helps you migrate from the old architecture (v1.0) to the new Clean Architecture (v2.0).

## 📋 Breaking Changes

### 1. **Entry Point Changed**
- **Old**: `src/server.js`
- **New**: `src/app.js`

### 2. **Configuration System**
- **Old**: Simple config object in `src/config/index.js`
- **New**: Validated config class in `src/infrastructure/config/Config.js`

### 3. **Service Structure**
- **Old**: Services in `src/services/`
- **New**: Services split across layers:
  - Domain: `src/domain/`
  - Application: `src/application/`
  - Infrastructure: `src/infrastructure/`
  - Presentation: `src/presentation/`

### 4. **Dependency Management**
- **Old**: Direct imports and instantiation
- **New**: Dependency injection container

## 🔄 Migration Steps

### Step 1: Update Dependencies

```bash
# Install new dependencies
yarn add joi
yarn add -D eslint eslint-config-standard eslint-plugin-import eslint-plugin-node eslint-plugin-promise supertest
```

### Step 2: Update Environment Variables

Add new optional environment variables to your `.env`:

```env
# New optional variables
HOST=0.0.0.0
TELEGRAM_API_URL=https://api.telegram.org
DIFY_TIMEOUT=30000
LOG_LEVEL=info
LOG_FORMAT=json
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Step 3: Update Scripts

The following scripts have been updated:

```json
{
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "lint": "eslint src/ scripts/ --ext .js",
    "lint:fix": "eslint src/ scripts/ --ext .js --fix"
  }
}
```

### Step 4: API Endpoint Changes

Some API endpoints have been updated:

| Old Endpoint | New Endpoint | Notes |
|-------------|-------------|-------|
| `POST /api/test/telegram` | `POST /api/telegram/test` | Moved under telegram namespace |
| `POST /api/test/dify` | Removed | Use direct Dify API testing |
| `GET /api/status` | `GET /api/status` | Same |
| `GET /api/conversations` | `GET /api/conversations` | Same |
| `POST /api/telegram/setup` | `POST /api/telegram/setup` | Same |

### Step 5: Configuration Access

**Old way:**
```javascript
const config = require('./config')
const port = config.server.port
```

**New way:**
```javascript
const config = container.get('config')
const port = config.get('server.port')
```

### Step 6: Service Usage

**Old way:**
```javascript
const telegramService = require('./services/telegramService')
const result = await telegramService.sendMessage(chatId, message)
```

**New way:**
```javascript
const telegramService = container.get('telegramService')
const result = await telegramService.sendMessage(chatId, message)
```

## 🧪 Testing Migration

### 1. Run Tests

```bash
# Run all tests
yarn test

# Check test coverage
yarn test:coverage
```

### 2. Test API Endpoints

```bash
# Health check
curl http://localhost:3000/webhook/health

# Get bot info
curl http://localhost:3000/api/telegram/bot-info

# Test message
curl -X POST http://localhost:3000/api/telegram/test \
     -H "Content-Type: application/json" \
     -d '{"chatId": "YOUR_CHAT_ID", "message": "Test"}'
```

### 3. Verify Webhooks

```bash
# Setup webhook
curl -X POST http://localhost:3000/api/telegram/setup \
     -H "Content-Type: application/json" \
     -d '{"webhookUrl": "https://your-domain.com/webhook/telegram"}'

# Check webhook info
curl http://localhost:3000/api/telegram/webhook-info
```

## 🔧 Troubleshooting

### Common Issues

1. **Configuration Validation Errors**
   - Check that all required environment variables are set
   - Verify environment variable formats (URLs, numbers, etc.)

2. **Service Initialization Errors**
   - Check external service connections (Telegram, Chatwoot, Dify)
   - Verify API keys and tokens

3. **Dependency Injection Errors**
   - Ensure all services are properly registered in ServiceRegistry
   - Check for circular dependencies

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

### Rollback Plan

If you need to rollback to v1.0:

1. Revert to the old `src/server.js` entry point
2. Restore old service files
3. Update package.json scripts
4. Remove new dependencies

## 📚 Additional Resources

- [Architecture Documentation](./ARCHITECTURE.md)
- [API Documentation](./README.md#api-testing)
- [Clean Architecture Principles](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

## 🆘 Support

If you encounter issues during migration:

1. Check the logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test individual components using the API endpoints
4. Create an issue on GitHub with detailed error information
