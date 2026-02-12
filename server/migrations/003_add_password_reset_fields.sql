-- Add password reset fields to users table
-- Run this to enable forgot password functionality

USE Mobitech;

-- Add password reset fields if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS password_reset_expires DATETIME DEFAULT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON users(password_reset_token);

-- Verify the changes
DESCRIBE users;
