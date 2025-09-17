-- Migration: Enhance platform mappings for future expansion (Zalo, Facebook, etc.)
-- This migration restructures the platform mappings to support multiple social platforms

-- Add platform_type column to platform_mappings table
ALTER TABLE platform_mappings 
ADD COLUMN IF NOT EXISTS platform_type VARCHAR(50) DEFAULT 'telegram';

-- Add platform_id column to replace telegram_bot_id (more generic)
ALTER TABLE platform_mappings 
ADD COLUMN IF NOT EXISTS platform_id INTEGER;

-- Copy telegram_bot_id to platform_id for existing records
UPDATE platform_mappings 
SET platform_id = telegram_bot_id 
WHERE platform_id IS NULL AND telegram_bot_id IS NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_platform_mappings_platform_type_id 
ON platform_mappings(platform_type, platform_id);

-- Create index for routing queries
CREATE INDEX IF NOT EXISTS idx_platform_mappings_routing 
ON platform_mappings(platform_type, platform_id, is_active);

-- Add comments for future developers
COMMENT ON COLUMN platform_mappings.platform_type IS 'Type of social platform: telegram, zalo, facebook, etc.';
COMMENT ON COLUMN platform_mappings.platform_id IS 'ID of the platform bot/account (telegram_bot_id, zalo_bot_id, etc.)';
COMMENT ON COLUMN platform_mappings.telegram_bot_id IS 'Legacy column - use platform_id with platform_type=telegram instead';

-- Create a view for backward compatibility
CREATE OR REPLACE VIEW telegram_platform_mappings AS
SELECT 
    id,
    telegram_bot_id,
    chatwoot_account_id,
    dify_app_id,
    enable_telegram_to_chatwoot,
    enable_telegram_to_dify,
    enable_chatwoot_to_telegram,
    enable_dify_to_chatwoot,
    enable_dify_to_telegram,
    auto_connect_telegram_chatwoot,
    auto_connect_telegram_dify,
    is_active,
    created_at,
    updated_at
FROM platform_mappings 
WHERE platform_type = 'telegram';

-- Add constraint to ensure platform_id is set when platform_type is specified
ALTER TABLE platform_mappings 
ADD CONSTRAINT chk_platform_mappings_platform_id 
CHECK (
    (platform_type = 'telegram' AND platform_id IS NOT NULL) OR
    (platform_type != 'telegram' AND platform_id IS NOT NULL)
);

-- Update existing records to have proper platform_type
UPDATE platform_mappings 
SET platform_type = 'telegram' 
WHERE platform_type IS NULL OR platform_type = '';
