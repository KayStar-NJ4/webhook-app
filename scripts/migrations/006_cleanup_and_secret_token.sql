-- 006_cleanup_and_secret_token.sql
-- Add secret_token to telegram_bots and drop legacy mapping tables no longer used

BEGIN;

-- Add secret_token column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='telegram_bots' AND column_name='secret_token'
  ) THEN
    ALTER TABLE telegram_bots ADD COLUMN secret_token TEXT;
  END IF;
END$$;

-- Optional: index for quick lookup by secret_token
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_telegram_bots_secret_token' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_telegram_bots_secret_token ON telegram_bots (secret_token);
  END IF;
END$$;

-- Drop legacy mapping tables if they exist
-- Some deployments may use different legacy names; keep all known variants
DROP TABLE IF EXISTS bot_chatwoot_mappings CASCADE;
DROP TABLE IF EXISTS dify_chatwoot_mappings CASCADE;
DROP TABLE IF EXISTS telegram_chatwoot_mappings CASCADE;
DROP TABLE IF EXISTS telegram_dify_mappings CASCADE;

COMMIT;


