-- Migration: 023_add_customers_table.sql
-- Description: Add customers table to store contact form submissions
-- Created: 2025-01-11
-- Author: System

-- =====================================================
-- ADD CUSTOMERS TABLE
-- =====================================================

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    
    -- Customer information
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    subject VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    
    -- Additional metadata
    source VARCHAR(50) DEFAULT 'contact_form', -- contact_form, chat_widget, api
    ip_address VARCHAR(45), -- IPv4 or IPv6
    user_agent TEXT,
    metadata JSONB, -- Additional data like browser info, referrer, etc.
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'new', -- new, contacted, in_progress, resolved, closed
    assigned_to INTEGER REFERENCES users(id),
    notes TEXT,
    
    -- Soft delete
    deleted_at TIMESTAMP,
    deleted_by INTEGER REFERENCES users(id),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_source ON customers(source);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON customers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_to ON customers(assigned_to);

-- Create composite index for filtering active customers
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(status, deleted_at) 
    WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create audit trigger
CREATE TRIGGER audit_customers 
    AFTER INSERT OR UPDATE OR DELETE ON customers 
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Add table and column comments
COMMENT ON TABLE customers IS 'Customer contact form submissions and inquiries';
COMMENT ON COLUMN customers.name IS 'Full name of the customer';
COMMENT ON COLUMN customers.email IS 'Email address of the customer';
COMMENT ON COLUMN customers.company IS 'Company name (optional)';
COMMENT ON COLUMN customers.subject IS 'Subject/topic of inquiry';
COMMENT ON COLUMN customers.message IS 'Customer message or inquiry';
COMMENT ON COLUMN customers.source IS 'Source of the customer record (contact_form, chat_widget, api)';
COMMENT ON COLUMN customers.status IS 'Current status of the inquiry';
COMMENT ON COLUMN customers.assigned_to IS 'User ID of assigned staff member';
COMMENT ON COLUMN customers.deleted_at IS 'Soft delete timestamp';
COMMENT ON COLUMN customers.metadata IS 'Additional metadata (browser info, referrer, etc.)';

