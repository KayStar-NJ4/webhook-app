-- Add soft delete support to platform_mappings table

BEGIN;

-- Add deleted_at column for soft delete
ALTER TABLE platform_mappings 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add index for performance when filtering deleted records
CREATE INDEX IF NOT EXISTS idx_platform_mappings_deleted_at ON platform_mappings (deleted_at) WHERE deleted_at IS NULL;

-- Add index for source platform queries (excluding deleted)
CREATE INDEX IF NOT EXISTS idx_platform_mappings_source_active ON platform_mappings (source_platform, source_id) WHERE deleted_at IS NULL AND is_active = TRUE;

COMMIT;
