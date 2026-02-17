-- ============================================================
-- Mobitech SIM Dashboard - Database Schema
-- ============================================================
-- Run this script to create all required tables from scratch.
-- Usage:  mysql -u root -p < Schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS `Mobitech`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE `Mobitech`;

-- ------------------------------------------------------------
-- 1. SIM Card Assets
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `assets` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `iccid`       VARCHAR(50) NOT NULL,
  `CreatedTime` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_iccid` (`iccid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- 2. SIM Data Usage Records
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Data` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `idAsset`        INT NOT NULL,
  `iccid`          VARCHAR(45) NOT NULL,
  `msisdn`         VARCHAR(45) NOT NULL,
  `dataSize`       VARCHAR(45) NOT NULL  COMMENT 'Total capacity in MB',
  `dataUsed`       VARCHAR(45) NOT NULL  COMMENT 'Cumulative usage in MB',
  `lastConnection` DATETIME DEFAULT NULL,
  `createdTime`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_iccid`        (`iccid`),
  KEY `idx_createdTime`  (`createdTime`),
  CONSTRAINT `fk_data_asset` FOREIGN KEY (`idAsset`) REFERENCES `assets`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------
-- 3. Users (authentication & profile)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`                     INT AUTO_INCREMENT PRIMARY KEY,
  `username`               VARCHAR(50) NOT NULL UNIQUE,
  `email`                  VARCHAR(255) NOT NULL UNIQUE,
  `password_hash`          VARCHAR(255) NOT NULL,
  `role`                   ENUM('admin','user') NOT NULL DEFAULT 'user',
  `status`                 ENUM('pending_verification','pending_approval','active','rejected') NOT NULL DEFAULT 'pending_verification',
  `avatar`                 VARCHAR(500) DEFAULT NULL,
  `verification_token`     VARCHAR(255) DEFAULT NULL,
  `verification_expires`   DATETIME DEFAULT NULL,
  `password_reset_token`   VARCHAR(255) DEFAULT NULL,
  `password_reset_expires` DATETIME DEFAULT NULL,
  `created_at`             DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at`             DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email`                (`email`),
  INDEX `idx_username`             (`username`),
  INDEX `idx_status`               (`status`),
  INDEX `idx_verification_token`   (`verification_token`),
  INDEX `idx_password_reset_token` (`password_reset_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 4. User Approval Requests (audit log)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_approval_requests` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT NOT NULL,
  `admin_id`   INT DEFAULT NULL,
  `action`     ENUM('approved','rejected') NOT NULL,
  `reason`     TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_id`  (`user_id`),
  INDEX `idx_admin_id` (`admin_id`),
  CONSTRAINT `fk_approval_user`  FOREIGN KEY (`user_id`)  REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_approval_admin` FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 5. Admin Notifications
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_notifications` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `admin_id`   INT NOT NULL,
  `user_id`    INT NOT NULL,
  `type`       VARCHAR(50) NOT NULL COMMENT 'e.g. new_registration, user_approved, user_rejected',
  `message`    TEXT NOT NULL,
  `read`       BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_admin_id`   (`admin_id`),
  INDEX `idx_read`       (`read`),
  INDEX `idx_created_at` (`created_at`),
  CONSTRAINT `fk_notif_admin` FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notif_user`  FOREIGN KEY (`user_id`)  REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 6. User Preferences (alert & email settings)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_preferences` (
  `id`                   INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`              INT DEFAULT NULL,
  `user_email`           VARCHAR(255) NOT NULL UNIQUE,
  `alerts_enabled`       BOOLEAN DEFAULT TRUE      COMMENT 'Enable/disable alert notifications',
  `warning_threshold`    DECIMAL(5,2) DEFAULT 60.00 COMMENT 'Warning threshold percentage',
  `critical_threshold`   DECIMAL(5,2) DEFAULT 80.00 COMMENT 'Critical threshold percentage',
  `projected_threshold`  DECIMAL(5,2) DEFAULT 80.00 COMMENT 'Projected usage threshold for end-of-month alerts',
  `email_alerts_enabled` BOOLEAN DEFAULT FALSE      COMMENT 'Enable/disable daily email alert reports',
  `email_alert_time`     TIME DEFAULT '09:00:00'    COMMENT 'Time of day to send daily email reports',
  `warning_color`        VARCHAR(7) DEFAULT '#ed6c02' COMMENT 'Hex color for warning alerts',
  `critical_color`       VARCHAR(7) DEFAULT '#d32f2f' COMMENT 'Hex color for critical alerts',
  `created_at`           DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_email` (`user_email`),
  INDEX `idx_user_id`    (`user_id`),
  CONSTRAINT `fk_user_preferences_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Test / Sample Data Tables (optional - used when USE_TEST_DATA=true)
-- ============================================================

CREATE TABLE IF NOT EXISTS `assets_test` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `iccid`       VARCHAR(20) NOT NULL UNIQUE,
  `CreatedTime` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_iccid` (`iccid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Data_test` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `idAsset`        INT,
  `iccid`          VARCHAR(20) NOT NULL,
  `msisdn`         VARCHAR(20),
  `dataSize`       VARCHAR(20) COMMENT 'Total capacity in MB',
  `dataUsed`       VARCHAR(20) COMMENT 'Cumulative usage in MB',
  `lastConnection` DATETIME,
  `createdTime`    DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_iccid`       (`iccid`),
  INDEX `idx_createdTime` (`createdTime`),
  CONSTRAINT `fk_data_test_asset` FOREIGN KEY (`idAsset`) REFERENCES `assets_test`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
