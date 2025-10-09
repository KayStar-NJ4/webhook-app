-- Seed data for Web Platform permissions
-- This file adds permissions for Web Apps management

-- Insert Web Apps permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('web.create', 'Create web apps', 'web', 'create'),
('web.read', 'View web apps', 'web', 'read'),
('web.update', 'Update web apps', 'web', 'update'),
('web.delete', 'Delete web apps', 'web', 'delete'),
('web.manage_conversations', 'Manage web conversations', 'web', 'manage_conversations')
ON CONFLICT (name) DO NOTHING;

-- Assign Web permissions to super_admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'super_admin' 
  AND p.resource = 'web'
ON CONFLICT (role_id, permission_id) DO NOTHING;
