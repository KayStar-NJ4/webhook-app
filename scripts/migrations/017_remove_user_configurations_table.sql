-- Remove user_configurations table as it's replaced by platform_mappings
-- Migration: 017_remove_user_configurations_table.sql

BEGIN;

-- Drop user_configurations table as it's no longer needed
-- Platform Mappings system has replaced this functionality
DROP TABLE IF EXISTS user_configurations CASCADE;

-- Add comment to document the change
COMMENT ON TABLE platform_mappings IS 'Platform mappings - Replaced user_configurations table for more flexible multi-platform routing';

COMMIT;
