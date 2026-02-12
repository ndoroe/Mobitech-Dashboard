-- Add avatar column to existing users table
-- Run this if you already have users in the database

USE Mobitech;

-- Add avatar column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar VARCHAR(500) DEFAULT NULL
AFTER status;

-- Verify the change
DESCRIBE users;
