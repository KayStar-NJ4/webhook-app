-- Fix Platform Mappings Schema
-- Add missing fields and ensure proper structure for flow-based mappings

BEGIN;

-- 1. Add missing 'name' column if not exists
ALTER TABLE platform_mappings 
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- 2. Add audit columns if missing
ALTER TABLE platform_mappings 
  ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- 3. Add flow configuration columns for the new flexible system
ALTER TABLE platform_mappings 
  ADD COLUMN IF NOT EXISTS chatwoot_account_id INTEGER REFERENCES chatwoot_accounts(id),
  ADD COLUMN IF NOT EXISTS dify_app_id INTEGER REFERENCES dify_apps(id),
  ADD COLUMN IF NOT EXISTS enable_chatwoot BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS enable_dify BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS enable_sync BOOLEAN DEFAULT FALSE;

-- 4. Update existing records with default names if name is NULL
UPDATE platform_mappings 
SET name = COALESCE(name, 
  CASE 
    WHEN source_platform = 'telegram' AND target_platform = 'chatwoot' THEN 'Telegram Bot → Chatwoot'
    WHEN source_platform = 'telegram' AND target_platform = 'dify' THEN 'Telegram Bot → Dify'
    WHEN source_platform = 'dify' AND target_platform = 'chatwoot' THEN 'Dify → Chatwoot (Sync)'
    ELSE CONCAT(COALESCE(source_platform, 'Unknown'), ' → ', COALESCE(target_platform, 'Unknown'))
  END
)
WHERE name IS NULL OR name = '';

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_platform_mappings_name ON platform_mappings (name) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_platform_mappings_source ON platform_mappings (source_platform, source_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_platform_mappings_target ON platform_mappings (target_platform, target_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_platform_mappings_chatwoot ON platform_mappings (chatwoot_account_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_platform_mappings_dify ON platform_mappings (dify_app_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_platform_mappings_active ON platform_mappings (is_active) WHERE deleted_at IS NULL;

-- 6. Add comments for documentation
COMMENT ON COLUMN platform_mappings.name IS 'Display name for the mapping/flow';
COMMENT ON COLUMN platform_mappings.source_platform IS 'Source platform type (telegram, zalo, facebook, etc.)';
COMMENT ON COLUMN platform_mappings.source_id IS 'Source platform bot/account ID';
COMMENT ON COLUMN platform_mappings.target_platform IS 'Target platform type (chatwoot, dify, etc.)';
COMMENT ON COLUMN platform_mappings.target_id IS 'Target platform account/app ID';
COMMENT ON COLUMN platform_mappings.enable_bidirectional IS 'Enable bidirectional communication';
COMMENT ON COLUMN platform_mappings.deleted_at IS 'Soft delete timestamp';
COMMENT ON COLUMN platform_mappings.chatwoot_account_id IS 'Chatwoot account ID for this mapping';
COMMENT ON COLUMN platform_mappings.dify_app_id IS 'Dify app ID for this mapping';
COMMENT ON COLUMN platform_mappings.enable_chatwoot IS 'Enable Chatwoot integration';
COMMENT ON COLUMN platform_mappings.enable_dify IS 'Enable Dify integration';
COMMENT ON COLUMN platform_mappings.enable_sync IS 'Enable sync between Dify and Chatwoot';

COMMIT;
