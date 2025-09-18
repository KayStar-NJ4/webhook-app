-- Initialize database for Turbo Chatwoot Webhook
-- This script runs when PostgreSQL container starts for the first time

-- Create database if not exists
SELECT 'CREATE DATABASE chatwoot_webhook'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'chatwoot_webhook')\gexec

-- Connect to the database
\c chatwoot_webhook;

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(255) PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    chatwoot_id VARCHAR(255),
    dify_id VARCHAR(255),
    participants JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(255) PRIMARY KEY,
    content TEXT NOT NULL,
    sender_id VARCHAR(255) NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    conversation_id VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_platform ON conversations(platform);
CREATE INDEX IF NOT EXISTS idx_conversations_chatwoot_id ON conversations(chatwoot_id);
CREATE INDEX IF NOT EXISTS idx_conversations_dify_id ON conversations(dify_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_platform ON messages(platform);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for conversations table
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for development
INSERT INTO conversations (id, platform, participants, metadata) VALUES
    ('telegram_123456789', 'telegram', '[{"id": "123456789", "name": "Test User", "role": "user"}]', '{"isGroupChat": false}')
ON CONFLICT (id) DO NOTHING;

-- Create a read-only user for monitoring
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'webhook_monitor') THEN
        CREATE ROLE webhook_monitor WITH LOGIN PASSWORD 'monitor_password';
    END IF;
END
$$;

-- Grant read-only permissions
GRANT CONNECT ON DATABASE chatwoot_webhook TO webhook_monitor;
GRANT USAGE ON SCHEMA public TO webhook_monitor;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO webhook_monitor;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO webhook_monitor;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO webhook_monitor;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO webhook_monitor;
