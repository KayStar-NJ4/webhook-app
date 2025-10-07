-- Add ai_bot_access_token column to chatwoot_accounts table for AI Bot integration
-- Migration: 015_add_ai_bot_access_token_to_chatwoot_accounts.sql

-- Add ai_bot_access_token column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chatwoot_accounts' 
                   AND column_name = 'ai_bot_access_token') THEN
        ALTER TABLE chatwoot_accounts ADD COLUMN ai_bot_access_token VARCHAR(500);
    END IF;
END $$;

-- Add comment to the column for documentation
COMMENT ON COLUMN chatwoot_accounts.ai_bot_access_token IS 'Access token for Chatwoot AI Bot - used by Dify to send messages through the AI Bot instead of as a human agent';
