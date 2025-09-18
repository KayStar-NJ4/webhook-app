-- Add audit columns to chatwoot_accounts table
-- Migration: 002_add_audit_columns_to_chatwoot_accounts.sql

-- Add created_by column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chatwoot_accounts' 
                   AND column_name = 'created_by') THEN
        ALTER TABLE chatwoot_accounts ADD COLUMN created_by INTEGER;
    END IF;
END $$;

-- Add updated_by column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chatwoot_accounts' 
                   AND column_name = 'updated_by') THEN
        ALTER TABLE chatwoot_accounts ADD COLUMN updated_by INTEGER;
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chatwoot_accounts' 
                   AND column_name = 'updated_at') THEN
        ALTER TABLE chatwoot_accounts ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
    -- Add foreign key for created_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'chatwoot_accounts' 
                   AND constraint_name = 'fk_chatwoot_accounts_created_by') THEN
        ALTER TABLE chatwoot_accounts 
        ADD CONSTRAINT fk_chatwoot_accounts_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
    
    -- Add foreign key for updated_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'chatwoot_accounts' 
                   AND constraint_name = 'fk_chatwoot_accounts_updated_by') THEN
        ALTER TABLE chatwoot_accounts 
        ADD CONSTRAINT fk_chatwoot_accounts_updated_by 
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;
