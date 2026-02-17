-- Migration: Add projected_threshold column to user_preferences table
-- Run this script to add the new projected_threshold field to existing database

USE Mobitech;

-- Check if column exists and add it
-- Note: MySQL doesn't support IF NOT EXISTS for ADD COLUMN
-- Run this migration script only once

-- Add projected_threshold column
ALTER TABLE user_preferences 
ADD COLUMN projected_threshold DECIMAL(5,2) DEFAULT 80.00 
COMMENT 'Projected usage threshold percentage for end-of-month alerts'
AFTER critical_threshold;

-- Update existing records to have the default value
UPDATE user_preferences 
SET projected_threshold = 80.00 
WHERE projected_threshold IS NULL;

-- Verify the column was added
SELECT 
  user_email,
  alerts_enabled,
  warning_threshold,
  critical_threshold,
  projected_threshold,
  warning_color,
  critical_color
FROM user_preferences;
