-- Migration: 002_update_users_for_school.sql
-- Description: Update users table for school system
-- Created: 2025-01-11
-- Author: System

-- =====================================================
-- ADD NEW COLUMNS TO USERS TABLE
-- =====================================================

-- Add phone_number column
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Add avatar column
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(500);

-- Add gender column
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other'));

-- Add date_of_birth column
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- =====================================================
-- UPDATE EXISTING DATA (if needed)
-- =====================================================

-- Set default values for existing users
UPDATE users 
SET 
  phone_number = '',
  avatar = '',
  gender = 'other',
  date_of_birth = NULL
WHERE phone_number IS NULL;

-- =====================================================
-- ADD INDEXES FOR PERFORMANCE
-- =====================================================

-- Add index on phone_number for faster searches
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);

-- Add index on gender for filtering
CREATE INDEX IF NOT EXISTS idx_users_gender ON users(gender);

-- Add index on date_of_birth for age-based queries
CREATE INDEX IF NOT EXISTS idx_users_date_of_birth ON users(date_of_birth);

-- =====================================================
-- UPDATE COMMENTS
-- =====================================================

COMMENT ON COLUMN users.phone_number IS 'Số điện thoại của người dùng';
COMMENT ON COLUMN users.avatar IS 'Đường dẫn ảnh đại diện';
COMMENT ON COLUMN users.gender IS 'Giới tính: male, female, other';
COMMENT ON COLUMN users.date_of_birth IS 'Ngày sinh';
