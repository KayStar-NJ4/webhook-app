-- Initial seed data for the system
-- This file contains the initial data needed for the system to work

-- Insert default roles
INSERT INTO roles (id, name, description) VALUES
(1, 'super_admin', 'Super Administrator with full system access')
ON CONFLICT (id) DO NOTHING;

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
('users.manage_permissions', 'Assign permissions to users', 'users', 'manage_permissions'),
('users.manage_roles', 'Assign roles to users', 'users', 'manage_roles'),

-- Role Management
('roles.create', 'Create new roles', 'roles', 'create'),
('roles.read', 'View role information', 'roles', 'read'),
('roles.update', 'Update role information', 'roles', 'update'),
('roles.delete', 'Delete roles', 'roles', 'delete'),
('roles.manage_permissions', 'Manage role permissions', 'roles', 'manage_permissions'),

-- Permission Management
('permissions.create', 'Create new permissions', 'permissions', 'create'),
('permissions.read', 'View permission information', 'permissions', 'read'),
('permissions.update', 'Update permission information', 'permissions', 'update'),
('permissions.delete', 'Delete permissions', 'permissions', 'delete'),

-- Configuration Management
('configurations.create', 'Create system configurations', 'configurations', 'create'),
('configurations.read', 'View system configurations', 'configurations', 'read'),
('configurations.update', 'Update system configurations', 'configurations', 'update'),
('configurations.delete', 'Delete system configurations', 'configurations', 'delete'),

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

-- Platform Mapping Management (for future expansion: Telegram, Zalo, Facebook, etc.)
('platform_mappings.create', 'Create platform mappings', 'platform_mappings', 'create'),
('platform_mappings.read', 'View platform mappings', 'platform_mappings', 'read'),
('platform_mappings.update', 'Update platform mappings', 'platform_mappings', 'update'),
('platform_mappings.delete', 'Delete platform mappings', 'platform_mappings', 'delete'),

-- Legacy Mapping Management (for backward compatibility)
('mappings.create', 'Create bot-account mappings', 'mappings', 'create'),
('mappings.read', 'View mappings', 'mappings', 'read'),
('mappings.update', 'Update mappings', 'mappings', 'update'),
('mappings.delete', 'Delete mappings', 'mappings', 'delete')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

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
('logging.format', 'json', 'string', 'Log format')
ON CONFLICT (key) DO NOTHING;

-- Create default super admin user
INSERT INTO users (username, email, password_hash, full_name, is_active) VALUES
('superadmin', 'thuanpt182@gmail.com', '$2b$10$VjzqcB9/wd/4kBfH4/7nwexn10d8sTThzmRbNdkKmMkirKCKQSQfW', 'Super Administrator', true)
ON CONFLICT (username) DO NOTHING;
-- Admin@12345
-- Assign super admin role to the default user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'superadmin' AND r.name = 'super_admin'
ON CONFLICT (user_id, role_id) DO NOTHING;
