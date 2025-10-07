-- Remove enable_chatwoot and enable_dify columns from platform_mappings
-- These are now auto-detected from chatwoot_account_id and dify_app_id
-- Migration: 019_remove_enable_platform_fields.sql

BEGIN;

-- Remove enable_chatwoot field (auto-detected from chatwoot_account_id)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'platform_mappings' 
        AND column_name = 'enable_chatwoot'
    ) THEN
        ALTER TABLE platform_mappings DROP COLUMN enable_chatwoot;
        RAISE NOTICE 'Removed enable_chatwoot column from platform_mappings table';
    ELSE
        RAISE NOTICE 'enable_chatwoot column does not exist in platform_mappings table';
    END IF;
END $$;

-- Remove enable_dify field (auto-detected from dify_app_id)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'platform_mappings' 
        AND column_name = 'enable_dify'
    ) THEN
        ALTER TABLE platform_mappings DROP COLUMN enable_dify;
        RAISE NOTICE 'Removed enable_dify column from platform_mappings table';
    ELSE
        RAISE NOTICE 'enable_dify column does not exist in platform_mappings table';
    END IF;
END $$;

-- Update comments to reflect the new auto-detection logic
COMMENT ON TABLE platform_mappings IS 'Platform mappings - Platforms are auto-detected from non-null account/app IDs';

COMMENT ON COLUMN platform_mappings.chatwoot_account_id IS 'Chatwoot account ID - if not null, Chatwoot is automatically enabled';
COMMENT ON COLUMN platform_mappings.dify_app_id IS 'Dify app ID - if not null, Dify is automatically enabled';

COMMIT;
