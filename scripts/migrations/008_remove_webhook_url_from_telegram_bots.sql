-- Migration: Remove webhook_url and api_url from telegram_bots table
-- Date: 2025-01-06
-- Description: Move webhook URL to system configuration and hardcode API URL

-- Remove webhook_url and api_url columns from telegram_bots table
ALTER TABLE telegram_bots DROP COLUMN IF EXISTS webhook_url;
ALTER TABLE telegram_bots DROP COLUMN IF EXISTS api_url;

-- Add webhook URL to system configuration
INSERT INTO configurations (key, value, type, description, created_at, updated_at)
VALUES ('system.webhook_url', '', 'string', 'Base webhook URL for the application (e.g., https://your-domain.com)', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- Add webhook secret token to system configuration
INSERT INTO configurations (key, value, type, description, created_at, updated_at)
VALUES ('system.webhook_secret_token', '', 'string', 'Secret token for webhook security', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;
