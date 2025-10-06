BEGIN;

-- Fix integer overflow issues for Telegram chat IDs and user IDs
-- Telegram IDs can be very large (up to 64-bit)

-- Update conversations table - chat_id and sender_id are VARCHAR, no need to change
-- But we need to ensure they can handle large numbers as strings

-- Update messages table - sender_id is VARCHAR(100), no need to change  
-- But we should ensure it can handle large numbers

-- Update platform_mappings table - source_id and target_id need to be BIGINT
ALTER TABLE platform_mappings 
  ALTER COLUMN source_id TYPE BIGINT USING source_id::BIGINT,
  ALTER COLUMN target_id TYPE BIGINT USING target_id::BIGINT;

-- Update telegram_bots table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'telegram_bots') THEN
        -- Check if bot_id column exists and its type
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'telegram_bots' AND column_name = 'bot_id') THEN
            ALTER TABLE telegram_bots 
              ALTER COLUMN bot_id TYPE BIGINT USING bot_id::BIGINT;
        END IF;
    END IF;
END $$;

-- Update chatwoot_accounts table (if exists)  
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chatwoot_accounts') THEN
        -- Check if account_id column exists and its type
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chatwoot_accounts' AND column_name = 'account_id') THEN
            ALTER TABLE chatwoot_accounts 
              ALTER COLUMN account_id TYPE BIGINT USING account_id::BIGINT;
        END IF;
    END IF;
END $$;

-- Update dify_apps table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dify_apps') THEN
        -- Check if app_id column exists and its type
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dify_apps' AND column_name = 'app_id') THEN
            ALTER TABLE dify_apps 
              ALTER COLUMN app_id TYPE VARCHAR(255); -- Dify app IDs are UUIDs
        END IF;
    END IF;
END $$;

COMMIT;
