-- Remove unnecessary fields from platform_mappings table
-- Migration: 016_remove_unnecessary_platform_mapping_fields.sql

BEGIN;

-- Remove enable_bidirectional field (AI response to source is now automatic)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'platform_mappings' 
        AND column_name = 'enable_bidirectional'
    ) THEN
        ALTER TABLE platform_mappings DROP COLUMN enable_bidirectional;
        RAISE NOTICE 'Removed enable_bidirectional column from platform_mappings table';
    ELSE
        RAISE NOTICE 'enable_bidirectional column does not exist in platform_mappings table';
    END IF;
END $$;

-- Remove enable_sync field (Dify to Chatwoot sync is now automatic)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'platform_mappings' 
        AND column_name = 'enable_sync'
    ) THEN
        ALTER TABLE platform_mappings DROP COLUMN enable_sync;
        RAISE NOTICE 'Removed enable_sync column from platform_mappings table';
    ELSE
        RAISE NOTICE 'enable_sync column does not exist in platform_mappings table';
    END IF;
END $$;

-- Update comments to reflect the new automatic behavior
COMMENT ON TABLE platform_mappings IS 'Platform mappings - AI responses to source and Dify to Chatwoot sync are now automatic based on configuration';

COMMIT;
