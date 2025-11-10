-- Migration: 025_add_zalo_oas.sql
-- Description: Add Zalo Official Account (OA) support
-- Created: 2025-01-15
-- Author: System

BEGIN;

-- Create zalo_oas table
CREATE TABLE IF NOT EXISTS zalo_oas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    oa_id VARCHAR(50) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    secret_key TEXT,
    webhook_url VARCHAR(500),
    api_url VARCHAR(255) DEFAULT 'https://openapi.zalo.me',
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_zalo_oas_oa_id ON zalo_oas(oa_id);
CREATE INDEX IF NOT EXISTS idx_zalo_oas_is_active ON zalo_oas(is_active);
CREATE INDEX IF NOT EXISTS idx_zalo_oas_secret_key ON zalo_oas(secret_key);

-- Create trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'update_zalo_oas_updated_at' AND n.nspname = 'public'
  ) THEN
    CREATE TRIGGER update_zalo_oas_updated_at 
      BEFORE UPDATE ON zalo_oas 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- Create audit trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'audit_zalo_oas' AND n.nspname = 'public'
  ) THEN
    CREATE TRIGGER audit_zalo_oas 
      AFTER INSERT OR UPDATE OR DELETE ON zalo_oas 
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
  END IF;
END$$;

-- Add column comments
COMMENT ON TABLE zalo_oas IS 'Zalo Official Accounts for integration with Chatwoot and Dify';
COMMENT ON COLUMN zalo_oas.oa_id IS 'Zalo Official Account ID';
COMMENT ON COLUMN zalo_oas.access_token IS 'Zalo OA access token';
COMMENT ON COLUMN zalo_oas.refresh_token IS 'Zalo OA refresh token (optional)';
COMMENT ON COLUMN zalo_oas.secret_key IS 'Secret key for webhook verification';
COMMENT ON COLUMN zalo_oas.webhook_url IS 'Webhook URL for receiving messages from Zalo OA';
COMMENT ON COLUMN zalo_oas.api_url IS 'Zalo OA API base URL (default: https://openapi.zalo.me)';

COMMIT;

