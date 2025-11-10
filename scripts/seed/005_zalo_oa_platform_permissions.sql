-- Seed: 005_zalo_oa_platform_permissions.sql
-- Description: Add Zalo Official Account Platform permissions
-- Created: 2025-01-15
-- Author: System

BEGIN;

-- Insert Zalo OA Management permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('zalo_oa.create', 'Create Zalo Official Accounts', 'zalo_oa', 'create'),
('zalo_oa.read', 'View Zalo Official Accounts', 'zalo_oa', 'read'),
('zalo_oa.update', 'Update Zalo Official Accounts', 'zalo_oa', 'update'),
('zalo_oa.delete', 'Delete Zalo Official Accounts', 'zalo_oa', 'delete'),
('zalo_oa.manage_webhooks', 'Manage Zalo OA webhooks', 'zalo_oa', 'manage_webhooks')
ON CONFLICT (name) DO NOTHING;

-- Assign Zalo OA permissions to super_admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'super_admin'
  AND p.resource = 'zalo_oa'
ON CONFLICT (role_id, permission_id) DO NOTHING;

COMMIT;

