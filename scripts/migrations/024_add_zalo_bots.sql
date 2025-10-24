-- Migration: 024_add_zalo_bots.sql
-- Description: Add Zalo Bot support similar to Telegram bots
-- Created: 2025-01-11
-- Author: System

BEGIN;

-- Create zalo_bots table
CREATE TABLE IF NOT EXISTS zalo_bots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    bot_token VARCHAR(255) NOT NULL,
    secret_token TEXT,
    webhook_url VARCHAR(500),
    api_url VARCHAR(255) DEFAULT 'https://bot.zapps.me',
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_zalo_bots_bot_token ON zalo_bots(bot_token);
CREATE INDEX IF NOT EXISTS idx_zalo_bots_is_active ON zalo_bots(is_active);
CREATE INDEX IF NOT EXISTS idx_zalo_bots_secret_token ON zalo_bots(secret_token);

-- Create trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'update_zalo_bots_updated_at' AND n.nspname = 'public'
  ) THEN
    CREATE TRIGGER update_zalo_bots_updated_at 
      BEFORE UPDATE ON zalo_bots 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- Create audit trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'audit_zalo_bots' AND n.nspname = 'public'
  ) THEN
    CREATE TRIGGER audit_zalo_bots 
      AFTER INSERT OR UPDATE OR DELETE ON zalo_bots 
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
  END IF;
END$$;

-- Add column comments
COMMENT ON TABLE zalo_bots IS 'Zalo Bots for integration with Chatwoot and Dify';
COMMENT ON COLUMN zalo_bots.bot_token IS 'Zalo Bot token (format: oauth_id:token)';
COMMENT ON COLUMN zalo_bots.secret_token IS 'Secret token for webhook verification (optional)';
COMMENT ON COLUMN zalo_bots.webhook_url IS 'Webhook URL for receiving messages from Zalo';
COMMENT ON COLUMN zalo_bots.api_url IS 'Zalo Bot API base URL (default: https://bot.zapps.me)';

COMMIT;

