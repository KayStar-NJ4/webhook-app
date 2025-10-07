-- Migration: Separate Telegram conversations by bot ID
-- This migration helps identify and potentially fix existing conversations
-- that might be incorrectly grouped together

-- Add bot_id column to conversations table if it doesn't exist
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS bot_id VARCHAR(255);

-- Add index for bot_id
CREATE INDEX IF NOT EXISTS idx_conversations_bot_id ON conversations(bot_id);

-- Add composite index for platform, chat_id, and bot_id
CREATE INDEX IF NOT EXISTS idx_conversations_platform_chat_bot 
ON conversations(platform, chat_id, bot_id);

-- Update the unique constraint to include bot_id for telegram conversations
-- First, drop the existing unique constraint if it exists
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS unique_platform_chat;

-- Add new unique constraint that includes bot_id for telegram
-- This ensures that conversations are separated by bot ID
ALTER TABLE conversations 
ADD CONSTRAINT unique_platform_chat_bot 
UNIQUE (platform, chat_id, bot_id);

-- Note: This migration prepares the schema for bot separation
-- Existing conversations will need to be handled by the application logic
-- as we cannot automatically determine bot_id for historical conversations
