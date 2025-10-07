-- Remove redundant target_platform and target_id fields from platform_mappings
-- Migration: 018_remove_redundant_target_fields.sql

BEGIN;

-- Remove target_platform field (redundant with chatwoot_account_id and dify_app_id)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'platform_mappings' 
        AND column_name = 'target_platform'
    ) THEN
        ALTER TABLE platform_mappings DROP COLUMN target_platform;
        RAISE NOTICE 'Removed target_platform column from platform_mappings table';
    ELSE
        RAISE NOTICE 'target_platform column does not exist in platform_mappings table';
    END IF;
END $$;

-- Remove target_id field (redundant with chatwoot_account_id and dify_app_id)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'platform_mappings' 
        AND column_name = 'target_id'
    ) THEN
        ALTER TABLE platform_mappings DROP COLUMN target_id;
        RAISE NOTICE 'Removed target_id column from platform_mappings table';
    ELSE
        RAISE NOTICE 'target_id column does not exist in platform_mappings table';
    END IF;
END $$;

-- Update comments to reflect the simplified structure
COMMENT ON TABLE platform_mappings IS 'Platform mappings - Simplified structure using specific target IDs instead of generic target_platform/target_id';

COMMENT ON COLUMN platform_mappings.source_platform IS 'Source platform type (telegram, zalo, facebook, etc.)';
COMMENT ON COLUMN platform_mappings.source_id IS 'Source platform bot/account ID';
COMMENT ON COLUMN platform_mappings.chatwoot_account_id IS 'Chatwoot account ID for this mapping (specific target)';
COMMENT ON COLUMN platform_mappings.dify_app_id IS 'Dify app ID for this mapping (specific target)';
COMMENT ON COLUMN platform_mappings.enable_chatwoot IS 'Enable Chatwoot integration';
COMMENT ON COLUMN platform_mappings.enable_dify IS 'Enable Dify integration';

COMMIT;
