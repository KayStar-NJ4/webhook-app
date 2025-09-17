-- Migration: 004_add_telegram_platform_mappings.sql
-- Description: Add telegram platform mappings for linking Telegram bots with Chatwoot and Dify
-- Created: 2025-01-11
-- Author: System

-- =====================================================
-- ADD TELEGRAM PLATFORM MAPPINGS TABLES
-- =====================================================

-- Create telegram_chatwoot_mappings table
CREATE TABLE IF NOT EXISTS telegram_chatwoot_mappings (
    id SERIAL PRIMARY KEY,
    telegram_bot_id INTEGER REFERENCES telegram_bots(id) ON DELETE CASCADE,
    chatwoot_account_id INTEGER REFERENCES chatwoot_accounts(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    auto_connect BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(telegram_bot_id, chatwoot_account_id)
);

-- Create telegram_dify_mappings table
CREATE TABLE IF NOT EXISTS telegram_dify_mappings (
    id SERIAL PRIMARY KEY,
    telegram_bot_id INTEGER REFERENCES telegram_bots(id) ON DELETE CASCADE,
    dify_app_id INTEGER REFERENCES dify_apps(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    auto_connect BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(telegram_bot_id, dify_app_id)
);

-- Create comprehensive platform mappings table for complex routing
CREATE TABLE IF NOT EXISTS platform_mappings (
    id SERIAL PRIMARY KEY,
    telegram_bot_id INTEGER REFERENCES telegram_bots(id) ON DELETE CASCADE,
    chatwoot_account_id INTEGER REFERENCES chatwoot_accounts(id) ON DELETE CASCADE,
    dify_app_id INTEGER REFERENCES dify_apps(id) ON DELETE CASCADE,
    
    -- Routing configuration
    enable_telegram_to_chatwoot BOOLEAN DEFAULT true,
    enable_telegram_to_dify BOOLEAN DEFAULT true,
    enable_chatwoot_to_telegram BOOLEAN DEFAULT true,
    enable_dify_to_chatwoot BOOLEAN DEFAULT true,
    enable_dify_to_telegram BOOLEAN DEFAULT true,
    
    -- Auto-connection settings
    auto_connect_telegram_chatwoot BOOLEAN DEFAULT true,
    auto_connect_telegram_dify BOOLEAN DEFAULT true,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique combination
    UNIQUE(telegram_bot_id, chatwoot_account_id, dify_app_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_telegram_chatwoot_mappings_telegram_bot_id ON telegram_chatwoot_mappings(telegram_bot_id);
CREATE INDEX IF NOT EXISTS idx_telegram_chatwoot_mappings_chatwoot_account_id ON telegram_chatwoot_mappings(chatwoot_account_id);
CREATE INDEX IF NOT EXISTS idx_telegram_chatwoot_mappings_is_active ON telegram_chatwoot_mappings(is_active);

CREATE INDEX IF NOT EXISTS idx_telegram_dify_mappings_telegram_bot_id ON telegram_dify_mappings(telegram_bot_id);
CREATE INDEX IF NOT EXISTS idx_telegram_dify_mappings_dify_app_id ON telegram_dify_mappings(dify_app_id);
CREATE INDEX IF NOT EXISTS idx_telegram_dify_mappings_is_active ON telegram_dify_mappings(is_active);

CREATE INDEX IF NOT EXISTS idx_platform_mappings_telegram_bot_id ON platform_mappings(telegram_bot_id);
CREATE INDEX IF NOT EXISTS idx_platform_mappings_chatwoot_account_id ON platform_mappings(chatwoot_account_id);
CREATE INDEX IF NOT EXISTS idx_platform_mappings_dify_app_id ON platform_mappings(dify_app_id);
CREATE INDEX IF NOT EXISTS idx_platform_mappings_is_active ON platform_mappings(is_active);

-- Create triggers for updated_at
CREATE TRIGGER update_telegram_chatwoot_mappings_updated_at 
    BEFORE UPDATE ON telegram_chatwoot_mappings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_telegram_dify_mappings_updated_at 
    BEFORE UPDATE ON telegram_dify_mappings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_mappings_updated_at 
    BEFORE UPDATE ON platform_mappings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create audit triggers
CREATE TRIGGER audit_telegram_chatwoot_mappings 
    AFTER INSERT OR UPDATE OR DELETE ON telegram_chatwoot_mappings 
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_telegram_dify_mappings 
    AFTER INSERT OR UPDATE OR DELETE ON telegram_dify_mappings 
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_platform_mappings 
    AFTER INSERT OR UPDATE OR DELETE ON platform_mappings 
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Add column comments
COMMENT ON TABLE telegram_chatwoot_mappings IS 'Mappings between Telegram bots and Chatwoot accounts';
COMMENT ON TABLE telegram_dify_mappings IS 'Mappings between Telegram bots and Dify apps';
COMMENT ON TABLE platform_mappings IS 'Comprehensive mappings between Telegram, Chatwoot, and Dify platforms';

COMMENT ON COLUMN telegram_chatwoot_mappings.auto_connect IS 'Whether to automatically connect messages between platforms';
COMMENT ON COLUMN telegram_dify_mappings.auto_connect IS 'Whether to automatically connect messages between platforms';
COMMENT ON COLUMN platform_mappings.enable_telegram_to_chatwoot IS 'Enable message routing from Telegram to Chatwoot';
COMMENT ON COLUMN platform_mappings.enable_telegram_to_dify IS 'Enable message routing from Telegram to Dify';
COMMENT ON COLUMN platform_mappings.enable_chatwoot_to_telegram IS 'Enable message routing from Chatwoot to Telegram';
COMMENT ON COLUMN platform_mappings.enable_dify_to_chatwoot IS 'Enable message routing from Dify to Chatwoot';
COMMENT ON COLUMN platform_mappings.enable_dify_to_telegram IS 'Enable message routing from Dify to Telegram';
