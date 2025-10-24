-- Seed: 004_zalo_platform_permissions.sql
-- Description: Add Zalo Bot Platform permissions
-- Created: 2025-01-11
-- Author: System

BEGIN;

-- Insert Zalo Bot Management permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('zalo.create', 'Create Zalo bots', 'zalo', 'create'),
('zalo.read', 'View Zalo bots', 'zalo', 'read'),
('zalo.update', 'Update Zalo bots', 'zalo', 'update'),
('zalo.delete', 'Delete Zalo bots', 'zalo', 'delete'),
('zalo.manage_webhooks', 'Manage Zalo webhooks', 'zalo', 'manage_webhooks')
ON CONFLICT (name) DO NOTHING;

-- Assign Zalo permissions to super_admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'super_admin'
  AND p.resource = 'zalo'
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;

