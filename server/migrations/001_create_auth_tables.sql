-- Authentication System Migration
-- Creates tables for user management, authentication, and admin notifications
-- Run this after sample_data.sql or on existing database

USE Mobitech;

-- Users Table
DROP TABLE IF EXISTS `admin_notifications`;
DROP TABLE IF EXISTS `user_approval_requests`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  `status` ENUM('pending_verification', 'pending_approval', 'active', 'rejected') NOT NULL DEFAULT 'pending_verification',
  `avatar` VARCHAR(500) DEFAULT NULL,
  `verification_token` VARCHAR(255) DEFAULT NULL,
  `verification_expires` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`),
  INDEX `idx_username` (`username`),
  INDEX `idx_status` (`status`),
  INDEX `idx_verification_token` (`verification_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User Approval Requests Table (Audit Log)
CREATE TABLE `user_approval_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `admin_id` INT DEFAULT NULL,
  `action` ENUM('approved', 'rejected') NOT NULL,
  `reason` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_admin_id` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Admin Notifications Table
CREATE TABLE `admin_notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `type` VARCHAR(50) NOT NULL COMMENT 'e.g., new_registration, user_approved, user_rejected',
  `message` TEXT NOT NULL,
  `read` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_admin_id` (`admin_id`),
  INDEX `idx_read` (`read`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Update user_preferences to link to users table
-- First, add the user_id column
ALTER TABLE `user_preferences` 
  ADD COLUMN `user_id` INT DEFAULT NULL AFTER `id`,
  ADD CONSTRAINT `fk_user_preferences_user` 
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE;

-- Add index for user_id
ALTER TABLE `user_preferences` 
  ADD INDEX `idx_user_id` (`user_id`);

-- Note: After migrating, you'll need to manually link existing user_preferences records
-- to users by email, or recreate preferences when users first login
