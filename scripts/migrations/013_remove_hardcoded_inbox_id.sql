BEGIN;

-- Remove hardcoded inbox_id from chatwoot_accounts table
-- Inbox will be auto-created based on platform

-- Check if inbox_id column exists and remove it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chatwoot_accounts' 
        AND column_name = 'inbox_id'
    ) THEN
        ALTER TABLE chatwoot_accounts DROP COLUMN inbox_id;
        RAISE NOTICE 'Removed inbox_id column from chatwoot_accounts table';
    ELSE
        RAISE NOTICE 'inbox_id column does not exist in chatwoot_accounts table';
    END IF;
END $$;

-- Add comment to document the change
COMMENT ON TABLE chatwoot_accounts IS 'Chatwoot accounts configuration - inboxes are auto-created per platform';

COMMIT;
