-- Remove ai_bot_access_token column from chatwoot_accounts table
-- Migration: 020_remove_ai_bot_access_token.sql
-- Reason: Không cần bot token riêng, sẽ dùng tracking mechanism để prevent duplicate

-- Drop ai_bot_access_token column if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'chatwoot_accounts' 
               AND column_name = 'ai_bot_access_token') THEN
        ALTER TABLE chatwoot_accounts DROP COLUMN ai_bot_access_token;
    END IF;
END $$;

