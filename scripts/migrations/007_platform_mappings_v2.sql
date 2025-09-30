-- Platform Mappings v2
-- Generic source/target oriented mapping with bidirectional flags

BEGIN;

-- 1) Add new generic columns (nullable for back-compat)
ALTER TABLE platform_mappings
  ADD COLUMN IF NOT EXISTS source_platform VARCHAR(50),
  ADD COLUMN IF NOT EXISTS source_id INTEGER,
  ADD COLUMN IF NOT EXISTS target_platform VARCHAR(50),
  ADD COLUMN IF NOT EXISTS target_id INTEGER,
  ADD COLUMN IF NOT EXISTS enable_bidirectional BOOLEAN DEFAULT FALSE;

-- 2) Backfill existing rows (telegram -> chatwoot/dify inference)
UPDATE platform_mappings
SET source_platform = COALESCE(source_platform,
                               CASE WHEN telegram_bot_id IS NOT NULL THEN 'telegram' ELSE NULL END),
    source_id       = COALESCE(source_id, telegram_bot_id),
    target_platform = COALESCE(target_platform,
                               CASE 
                                 WHEN chatwoot_account_id IS NOT NULL THEN 'chatwoot'
                                 WHEN dify_app_id IS NOT NULL THEN 'dify'
                                 ELSE NULL
                               END),
    target_id       = COALESCE(target_id,
                               COALESCE(chatwoot_account_id, dify_app_id)),
    enable_bidirectional = COALESCE(enable_bidirectional,
                                    (enable_chatwoot_to_telegram OR enable_dify_to_telegram OR enable_dify_to_chatwoot));

-- 3) Optional: create helpful indexes
CREATE INDEX IF NOT EXISTS idx_pm_source ON platform_mappings (source_platform, source_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_pm_target ON platform_mappings (target_platform, target_id) WHERE is_active = TRUE;

COMMIT;

-- 4) Optionally remove legacy columns that are no longer needed
--    Keep ID columns for backward compatibility until code fully migrated.
-- Use separate statements with CASCADE to remove dependent indexes/constraints cleanly
ALTER TABLE platform_mappings DROP COLUMN IF EXISTS platform_type CASCADE;
ALTER TABLE platform_mappings DROP COLUMN IF EXISTS platform_id CASCADE;
ALTER TABLE platform_mappings DROP COLUMN IF EXISTS telegram_bot_id CASCADE;
ALTER TABLE platform_mappings DROP COLUMN IF EXISTS chatwoot_account_id CASCADE;
ALTER TABLE platform_mappings DROP COLUMN IF EXISTS dify_app_id CASCADE;
ALTER TABLE platform_mappings DROP COLUMN IF EXISTS enable_telegram_to_chatwoot CASCADE;
ALTER TABLE platform_mappings DROP COLUMN IF EXISTS enable_telegram_to_dify CASCADE;
ALTER TABLE platform_mappings DROP COLUMN IF EXISTS enable_chatwoot_to_telegram CASCADE;
ALTER TABLE platform_mappings DROP COLUMN IF EXISTS enable_dify_to_chatwoot CASCADE;
ALTER TABLE platform_mappings DROP COLUMN IF EXISTS enable_dify_to_telegram CASCADE;
ALTER TABLE platform_mappings DROP COLUMN IF EXISTS auto_connect_telegram_chatwoot CASCADE;
ALTER TABLE platform_mappings DROP COLUMN IF EXISTS auto_connect_telegram_dify CASCADE;


