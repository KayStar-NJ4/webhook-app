-- Migration: 003_add_dify_chatwoot_mappings.sql
-- Description: Add dify_chatwoot_mappings table for mapping Dify apps to Chatwoot accounts
-- Created: 2025-01-11
-- Author: System

-- =====================================================
-- ADD DIFY-CHATWOOT MAPPINGS TABLE
-- =====================================================

-- Create dify_chatwoot_mappings table
CREATE TABLE IF NOT EXISTS dify_chatwoot_mappings (
    id SERIAL PRIMARY KEY,
    dify_app_id INTEGER REFERENCES dify_apps(id) ON DELETE CASCADE,
    chatwoot_account_id INTEGER REFERENCES chatwoot_accounts(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(dify_app_id, chatwoot_account_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dify_chatwoot_mappings_dify_app_id ON dify_chatwoot_mappings(dify_app_id);
CREATE INDEX IF NOT EXISTS idx_dify_chatwoot_mappings_chatwoot_account_id ON dify_chatwoot_mappings(chatwoot_account_id);
CREATE INDEX IF NOT EXISTS idx_dify_chatwoot_mappings_is_active ON dify_chatwoot_mappings(is_active);
CREATE INDEX IF NOT EXISTS idx_dify_chatwoot_mappings_created_by ON dify_chatwoot_mappings(created_by);

-- Create trigger for updated_at
CREATE TRIGGER update_dify_chatwoot_mappings_updated_at 
    BEFORE UPDATE ON dify_chatwoot_mappings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create audit trigger
CREATE TRIGGER audit_dify_chatwoot_mappings 
    AFTER INSERT OR UPDATE OR DELETE ON dify_chatwoot_mappings 
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Add column comments
COMMENT ON TABLE dify_chatwoot_mappings IS 'Mappings between Dify apps and Chatwoot accounts';
COMMENT ON COLUMN dify_chatwoot_mappings.dify_app_id IS 'Reference to Dify app';
COMMENT ON COLUMN dify_chatwoot_mappings.chatwoot_account_id IS 'Reference to Chatwoot account';
COMMENT ON COLUMN dify_chatwoot_mappings.is_active IS 'Whether the mapping is active';
COMMENT ON COLUMN dify_chatwoot_mappings.created_by IS 'User who created the mapping';
