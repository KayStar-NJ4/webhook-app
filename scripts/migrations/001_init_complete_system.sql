-- Migration: 001_init_complete_system.sql
-- Description: Complete system initialization with all features
-- Created: 2025-01-11
-- Author: System

-- =====================================================
-- DROP EXISTING TABLES IF THEY EXIST
-- =====================================================
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_configurations CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS bot_chatwoot_mappings CASCADE;
DROP TABLE IF EXISTS dify_chatwoot_mappings CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS configurations CASCADE;
DROP TABLE IF EXISTS dify_apps CASCADE;
DROP TABLE IF EXISTS telegram_bots CASCADE;
DROP TABLE IF EXISTS chatwoot_accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS migrations CASCADE;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    phone_number VARCHAR(20),
    avatar VARCHAR(500),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    date_of_birth DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User roles junction table
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- Role permissions junction table
CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- Chatwoot accounts table
CREATE TABLE chatwoot_accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    base_url VARCHAR(255) NOT NULL,
    access_token VARCHAR(500) NOT NULL,
    account_id VARCHAR(50) NOT NULL,
    inbox_id INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Telegram bots table
CREATE TABLE telegram_bots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    bot_token VARCHAR(255) NOT NULL,
    webhook_url VARCHAR(500),
    api_url VARCHAR(255) DEFAULT 'https://api.telegram.org',
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dify apps table
CREATE TABLE dify_apps (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    api_url VARCHAR(255) NOT NULL,
    api_key VARCHAR(500) NOT NULL,
    app_id VARCHAR(100) NOT NULL,
    timeout INTEGER DEFAULT 30000,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User configurations table (multi-platform mapping)
CREATE TABLE user_configurations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    chatwoot_account_id INTEGER REFERENCES chatwoot_accounts(id) ON DELETE CASCADE,
    telegram_bot_ids INTEGER[] DEFAULT '{}',
    dify_app_ids INTEGER[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, chatwoot_account_id)
);

-- Conversations table
CREATE TABLE conversations (
    id VARCHAR(255) PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    chat_type VARCHAR(20) NOT NULL CHECK (chat_type IN ('private', 'group', 'supergroup', 'channel')),
    
    -- Thông tin cuộc trò chuyện
    chat_id VARCHAR(255) NOT NULL,
    chat_title VARCHAR(500),
    chat_username VARCHAR(255),
    chat_description TEXT,
    
    -- Thông tin người gửi tin nhắn đầu tiên
    sender_id VARCHAR(255),
    sender_username VARCHAR(255),
    sender_first_name VARCHAR(255),
    sender_last_name VARCHAR(255),
    sender_language_code VARCHAR(10),
    sender_is_bot BOOLEAN DEFAULT FALSE,
    
    -- Thông tin nhóm (nếu là group chat)
    group_id VARCHAR(255),
    group_title VARCHAR(500),
    group_username VARCHAR(255),
    group_description TEXT,
    group_member_count INTEGER,
    group_is_verified BOOLEAN DEFAULT FALSE,
    group_is_restricted BOOLEAN DEFAULT FALSE,
    
    -- Thông tin kết nối với các hệ thống khác
    chatwoot_id VARCHAR(255),
    chatwoot_inbox_id VARCHAR(255),
    dify_id VARCHAR(255),
    
    -- Metadata bổ sung
    participants JSONB DEFAULT '[]'::jsonb,
    platform_metadata JSONB DEFAULT '{}'::jsonb,
    chatwoot_metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Trạng thái
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked', 'deleted')),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP,
    
    -- Indexes
    CONSTRAINT unique_platform_chat UNIQUE (platform, chat_id)
);

-- Messages table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR(255) REFERENCES conversations(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    sender_id VARCHAR(100),
    sender_name VARCHAR(100),
    message_type VARCHAR(20) DEFAULT 'text',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Logs table
CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    component VARCHAR(100),
    message TEXT NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Error logs table
CREATE TABLE IF NOT EXISTS error_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    component VARCHAR(100),
    message TEXT NOT NULL,
    stack TEXT,
    url VARCHAR(500),
    method VARCHAR(10),
    status_code INTEGER,
    body JSONB,
    params JSONB,
    query JSONB,
    metadata JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Configurations table
CREATE TABLE configurations (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    type VARCHAR(20) DEFAULT 'string',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migrations tracking table
CREATE TABLE migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_phone_number ON users(phone_number);
CREATE INDEX idx_users_gender ON users(gender);
CREATE INDEX idx_users_date_of_birth ON users(date_of_birth);

-- Roles and permissions indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Configuration tables indexes
CREATE INDEX idx_chatwoot_accounts_created_by ON chatwoot_accounts(created_by);
CREATE INDEX idx_chatwoot_accounts_is_active ON chatwoot_accounts(is_active);
CREATE INDEX idx_telegram_bots_created_by ON telegram_bots(created_by);
CREATE INDEX idx_telegram_bots_is_active ON telegram_bots(is_active);
CREATE INDEX idx_dify_apps_created_by ON dify_apps(created_by);
CREATE INDEX idx_dify_apps_is_active ON dify_apps(is_active);

-- User configurations indexes
CREATE INDEX idx_user_configurations_user_id ON user_configurations(user_id);
CREATE INDEX idx_user_configurations_chatwoot_account_id ON user_configurations(chatwoot_account_id);

-- Conversations and messages indexes
CREATE INDEX idx_conversations_platform ON conversations(platform);
CREATE INDEX idx_conversations_chat_type ON conversations(chat_type);
CREATE INDEX idx_conversations_chatwoot_id ON conversations(chatwoot_id);
CREATE INDEX idx_conversations_dify_id ON conversations(dify_id);
CREATE INDEX idx_conversations_sender_id ON conversations(sender_id);
CREATE INDEX idx_conversations_group_id ON conversations(group_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Logs and sessions indexes
CREATE INDEX idx_logs_level ON logs(level);
CREATE INDEX idx_logs_created_at ON logs(created_at);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_id, action, resource, resource_id, old_values)
        VALUES (NULL, 'DELETE', TG_TABLE_NAME, OLD.id::text, row_to_json(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_id, action, resource, resource_id, old_values, new_values)
        VALUES (NULL, 'UPDATE', TG_TABLE_NAME, NEW.id::text, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_id, action, resource, resource_id, new_values)
        VALUES (NULL, 'INSERT', TG_TABLE_NAME, NEW.id::text, row_to_json(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chatwoot_accounts_updated_at BEFORE UPDATE ON chatwoot_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_telegram_bots_updated_at BEFORE UPDATE ON telegram_bots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dify_apps_updated_at BEFORE UPDATE ON dify_apps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configurations_updated_at BEFORE UPDATE ON configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_configurations_updated_at BEFORE UPDATE ON user_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create audit triggers for sensitive tables
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_telegram_bots AFTER INSERT OR UPDATE OR DELETE ON telegram_bots FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_chatwoot_accounts AFTER INSERT OR UPDATE OR DELETE ON chatwoot_accounts FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_dify_apps AFTER INSERT OR UPDATE OR DELETE ON dify_apps FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Insert default roles
INSERT INTO roles (id, name, description) VALUES
(1, 'super_admin', 'Super Administrator with full system access');

-- Insert detailed permissions
INSERT INTO permissions (name, description, resource, action) VALUES
-- System Management (Core permissions first)
('system.dashboard', 'Access system dashboard', 'system', 'dashboard'),
('system.logs', 'View system logs', 'system', 'logs'),
('system.metrics', 'View system metrics', 'system', 'metrics'),

-- User Management
('users.create', 'Create new users', 'users', 'create'),
('users.read', 'View user information', 'users', 'read'),
('users.update', 'Update user information', 'users', 'update'),
('users.delete', 'Delete users', 'users', 'delete'),
('users.manage_roles', 'Assign roles to users', 'users', 'manage_roles'),

-- Configuration Management
('config.read', 'View system configuration', 'config', 'read'),
('config.update', 'Update system configuration', 'config', 'update'),

-- Chatwoot Account Management
('chatwoot.create', 'Create chatwoot accounts', 'chatwoot', 'create'),
('chatwoot.read', 'View chatwoot accounts', 'chatwoot', 'read'),
('chatwoot.update', 'Update chatwoot accounts', 'chatwoot', 'update'),
('chatwoot.delete', 'Delete chatwoot accounts', 'chatwoot', 'delete'),

-- Telegram Bot Management
('telegram.create', 'Create telegram bots', 'telegram', 'create'),
('telegram.read', 'View telegram bots', 'telegram', 'read'),
('telegram.update', 'Update telegram bots', 'telegram', 'update'),
('telegram.delete', 'Delete telegram bots', 'telegram', 'delete'),
('telegram.manage_webhooks', 'Manage telegram webhooks', 'telegram', 'manage_webhooks'),

-- Dify App Management
('dify.create', 'Create dify apps', 'dify', 'create'),
('dify.read', 'View dify apps', 'dify', 'read'),
('dify.update', 'Update dify apps', 'dify', 'update'),
('dify.delete', 'Delete dify apps', 'dify', 'delete'),

-- Mapping Management
('mappings.create', 'Create bot-account mappings', 'mappings', 'create'),
('mappings.read', 'View mappings', 'mappings', 'read'),
('mappings.update', 'Update mappings', 'mappings', 'update'),
('mappings.delete', 'Delete mappings', 'mappings', 'delete');

-- Assign permissions to roles
-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'super_admin';

-- Insert default system configurations
INSERT INTO configurations (key, value, type, description) VALUES
-- Server Configuration
('server.port', '3000', 'number', 'Server port number'),
('server.host', '0.0.0.0', 'string', 'Server host'),
('server.nodeEnv', 'development', 'string', 'Node.js environment'),

-- Security Configuration
('security.jwtSecret', 'your-super-secret-jwt-key-change-this-in-production', 'string', 'JWT secret key'),
('security.jwtExpiry', '24h', 'string', 'JWT token expiry'),
('security.corsOrigins', 'http://localhost:3000,http://localhost:8080', 'string', 'Allowed CORS origins'),

-- Rate Limiting Configuration
('rateLimit.windowMs', '900000', 'number', 'Rate limit window in milliseconds'),
('rateLimit.max', '100', 'number', 'Maximum requests per window'),

-- Logging Configuration
('logging.level', 'info', 'string', 'Log level'),
('logging.format', 'json', 'string', 'Log format');

-- Create default super admin user
INSERT INTO users (username, email, password_hash, full_name, is_active) VALUES
('superadmin', 'thuanpt182@gmail.com', '$2b$10$GL1z.pEHFeFgmL1LDfjGU.fu8GMOi4xXnnMZptP6zT1kmnOyZsvSG', 'Super Administrator', true);

-- Assign super admin role to the default user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'superadmin' AND r.name = 'super_admin';

-- Add column comments
COMMENT ON COLUMN users.phone_number IS 'Số điện thoại của người dùng';
COMMENT ON COLUMN users.avatar IS 'Đường dẫn ảnh đại diện';
COMMENT ON COLUMN users.gender IS 'Giới tính: male, female, other';
COMMENT ON COLUMN users.date_of_birth IS 'Ngày sinh';

-- =====================================================
-- MIGRATION COMPLETION
-- =====================================================
-- Migration will be recorded by migrate.js script
