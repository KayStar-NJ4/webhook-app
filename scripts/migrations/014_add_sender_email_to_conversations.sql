-- Add sender_email column to conversations table
-- This allows users to provide their email address for better contact management

ALTER TABLE conversations 
ADD COLUMN sender_email VARCHAR(255);

-- Add index for faster email lookups
CREATE INDEX idx_conversations_sender_email ON conversations(sender_email);

-- Add comment
COMMENT ON COLUMN conversations.sender_email IS 'Email address provided by the user for better contact management in Chatwoot';
