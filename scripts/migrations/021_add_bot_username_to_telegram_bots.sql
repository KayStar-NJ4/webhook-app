-- Migration: Add bot_username field to telegram_bots table
-- Description: Add bot_username field to store the actual Telegram bot username for proper mention detection

-- Add bot_username column
ALTER TABLE telegram_bots 
ADD COLUMN IF NOT EXISTS bot_username VARCHAR(100);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_telegram_bots_bot_username 
ON telegram_bots(bot_username);

-- Add comment
COMMENT ON COLUMN telegram_bots.bot_username IS 'Telegram bot username (without @) for mention detection in groups';
