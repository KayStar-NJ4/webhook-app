-- Seed: 003_customer_permissions.sql
-- Description: Add customer management permissions
-- Created: 2025-01-11
-- Note: Create permission is not needed since contact form is public

-- Insert customer resource permissions (no create - public can submit contact form)
INSERT INTO permissions (name, description, resource, action) VALUES
    ('customers.read', 'View customers', 'customers', 'read'),
    ('customers.update', 'Update customers', 'customers', 'update'),
    ('customers.delete', 'Delete customers (soft delete)', 'customers', 'delete')
ON CONFLICT (name) DO NOTHING;

-- Assign customer permissions to admin role (role_id = 1)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions 
WHERE resource = 'customers'
ON CONFLICT DO NOTHING;

-- Log
DO $$
BEGIN
    RAISE NOTICE 'Customer permissions created and assigned to admin role';
    RAISE NOTICE 'Note: Create permission not needed - contact form is public';
END $$;

