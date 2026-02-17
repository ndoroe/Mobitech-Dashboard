-- Migration: Add email alert columns to user_preferences table
-- Run this script to add email alert configuration fields

USE Mobitech;

-- Add email_alerts_enabled column
ALTER TABLE user_preferences 
ADD COLUMN email_alerts_enabled BOOLEAN DEFAULT FALSE 
COMMENT 'Enable/disable daily email alert reports'
AFTER projected_threshold;

-- Add email_alert_time column
ALTER TABLE user_preferences 
ADD COLUMN email_alert_time TIME DEFAULT '09:00:00' 
COMMENT 'Time of day to send daily email alert reports'
AFTER email_alerts_enabled;

-- Update existing records to have default values
UPDATE user_preferences 
SET email_alerts_enabled = FALSE, email_alert_time = '09:00:00'
WHERE email_alerts_enabled IS NULL OR email_alert_time IS NULL;

-- Verify the columns were added
SELECT 
  user_email,
  alerts_enabled,
  email_alerts_enabled,
  email_alert_time,
  warning_threshold,
  critical_threshold,
  projected_threshold
FROM user_preferences;
