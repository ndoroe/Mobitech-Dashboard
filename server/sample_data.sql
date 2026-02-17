-- Test Data Generation Script for SIM Dashboard
-- Creates test tables with 6 months of historical data (Aug 2025 - Jan 2026)
-- Run this to create separate test environment without affecting production data

USE Mobitech;

-- Create test tables with same schema as production
DROP TABLE IF EXISTS Data_test;
DROP TABLE IF EXISTS assets_test;
DROP TABLE IF EXISTS user_preferences;

-- Test Assets Table (SIM Cards)
CREATE TABLE `assets_test` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `iccid` VARCHAR(20) NOT NULL UNIQUE,
  `CreatedTime` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_iccid` (`iccid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Test Data Table (Usage Records)
CREATE TABLE `Data_test` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `idAsset` INT,
  `iccid` VARCHAR(20) NOT NULL,
  `msisdn` VARCHAR(20),
  `dataSize` VARCHAR(20) COMMENT 'Total capacity in MB',
  `dataUsed` VARCHAR(20) COMMENT 'Cumulative usage in MB',
  `lastConnection` DATETIME,
  `createdTime` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_iccid` (`iccid`),
  INDEX `idx_createdTime` (`createdTime`),
  FOREIGN KEY (`idAsset`) REFERENCES `assets_test`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User Preferences Table (for alert notification settings)
CREATE TABLE `user_preferences` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_email` VARCHAR(255) NOT NULL UNIQUE,
  `alerts_enabled` BOOLEAN DEFAULT TRUE COMMENT 'Enable/disable alert notifications',
  `warning_threshold` DECIMAL(5,2) DEFAULT 60.00 COMMENT 'Warning threshold percentage (60-80%)',
  `critical_threshold` DECIMAL(5,2) DEFAULT 80.00 COMMENT 'Critical threshold percentage (80%+)',
  `projected_threshold` DECIMAL(5,2) DEFAULT 80.00 COMMENT 'Projected usage threshold percentage for end-of-month alerts',
  `email_alerts_enabled` BOOLEAN DEFAULT FALSE COMMENT 'Enable/disable daily email alert reports',
  `email_alert_time` TIME DEFAULT '09:00:00' COMMENT 'Time of day to send daily email alert reports',
  `warning_color` VARCHAR(7) DEFAULT '#ed6c02' COMMENT 'Hex color for warning alerts (orange)',
  `critical_color` VARCHAR(7) DEFAULT '#d32f2f' COMMENT 'Hex color for critical alerts (red)',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_email` (`user_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default preferences for demo user
INSERT INTO user_preferences (user_email, alerts_enabled, warning_threshold, critical_threshold, projected_threshold, email_alerts_enabled, email_alert_time, warning_color, critical_color)
VALUES ('admin@materialadminlte.com', TRUE, 60.00, 80.00, 80.00, FALSE, '09:00:00', '#ed6c02', '#d32f2f');

-- Generate 100 test SIM cards with varied profiles
DELIMITER $$

DROP PROCEDURE IF EXISTS generate_test_sims$$
CREATE PROCEDURE generate_test_sims()
BEGIN
  DECLARE i INT DEFAULT 1;
  DECLARE iccid_val VARCHAR(20);
  
  WHILE i <= 100 DO
    SET iccid_val = CONCAT('895201992008006', LPAD(i, 4, '0'));
    
    INSERT INTO assets_test (iccid, CreatedTime) 
    VALUES (
      iccid_val,
      DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 180) DAY)
    );
    
    SET i = i + 1;
  END WHILE;
END$$

-- Generate 6 months of data for each SIM
DROP PROCEDURE IF EXISTS generate_test_data$$
CREATE PROCEDURE generate_test_data()
BEGIN
  DECLARE sim_id INT;
  DECLARE sim_iccid VARCHAR(20);
  DECLARE sim_msisdn VARCHAR(20);
  DECLARE sim_capacity INT;
  DECLARE sim_usage_pattern VARCHAR(20);
  DECLARE done INT DEFAULT FALSE;
  
  DECLARE cur CURSOR FOR SELECT id, iccid FROM assets_test;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN cur;
  
  read_loop: LOOP
    FETCH cur INTO sim_id, sim_iccid;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    -- Assign phone number
    SET sim_msisdn = CONCAT('+2782', LPAD(sim_id, 7, '0'));
    
    -- Assign capacity (1GB to 10GB range)
    SET sim_capacity = CASE 
      WHEN sim_id % 4 = 0 THEN 10240  -- 10GB
      WHEN sim_id % 4 = 1 THEN 5120   -- 5GB
      WHEN sim_id % 4 = 2 THEN 2048   -- 2GB
      ELSE 1024                        -- 1GB
    END;
    
    -- Assign usage pattern
    SET sim_usage_pattern = CASE 
      WHEN sim_id % 5 = 0 THEN 'high'    -- 20% heavy users
      WHEN sim_id % 5 = 1 THEN 'low'     -- 20% light users
      WHEN sim_id % 5 = 2 THEN 'spike'   -- 20% sporadic users
      WHEN sim_id % 5 = 3 THEN 'steady'  -- 20% consistent users
      ELSE 'medium'                       -- 20% average users
    END;
    
    -- Generate 6 months of data (every 4 hours = 6 records/day * 180 days)
    CALL generate_usage_records(sim_id, sim_iccid, sim_msisdn, sim_capacity, sim_usage_pattern, 180);
    
  END LOOP;
  
  CLOSE cur;
END$$

-- Generate usage records for a single SIM
DROP PROCEDURE IF EXISTS generate_usage_records$$
CREATE PROCEDURE generate_usage_records(
  IN p_sim_id INT,
  IN p_iccid VARCHAR(20),
  IN p_msisdn VARCHAR(20),
  IN p_capacity INT,
  IN p_pattern VARCHAR(20),
  IN p_days INT
)
BEGIN
  DECLARE day_offset INT DEFAULT 0;
  DECLARE hour_offset INT DEFAULT 0;
  DECLARE current_usage DECIMAL(15,2) DEFAULT 0;
  DECLARE daily_increment DECIMAL(15,2);
  DECLARE record_time DATETIME;
  DECLARE is_business_hours BOOLEAN;
  DECLARE day_of_week INT;
  DECLARE increment DECIMAL(15,2);
  
  -- Calculate daily increment based on pattern
  SET daily_increment = CASE p_pattern
    WHEN 'high' THEN p_capacity * 0.03    -- Uses 3% per day
    WHEN 'medium' THEN p_capacity * 0.015 -- Uses 1.5% per day
    WHEN 'low' THEN p_capacity * 0.005    -- Uses 0.5% per day
    WHEN 'steady' THEN p_capacity * 0.02  -- Uses 2% per day
    WHEN 'spike' THEN p_capacity * 0.01   -- Base 1% with spikes
    ELSE p_capacity * 0.01
  END;
  
  WHILE day_offset < p_days DO
    -- Generate 6 records per day (every 4 hours)
    SET hour_offset = 0;
    WHILE hour_offset < 24 DO
      SET record_time = DATE_SUB(NOW(), INTERVAL p_days - day_offset DAY) + INTERVAL hour_offset HOUR;
      SET day_of_week = DAYOFWEEK(record_time);
      SET is_business_hours = (hour_offset >= 8 AND hour_offset <= 18);
      
      -- Calculate increment based on time and pattern
      SET increment = daily_increment / 6;
      
      -- Adjust for business hours (more usage during work hours)
      IF is_business_hours AND day_of_week BETWEEN 2 AND 6 THEN
        SET increment = increment * 1.5;
      END IF;
      
      -- Pattern-specific adjustments
      IF p_pattern = 'spike' AND RAND() < 0.1 THEN
        SET increment = increment * FLOOR(5 + RAND() * 10);
      ELSEIF p_pattern = 'low' AND NOT is_business_hours THEN
        SET increment = increment * 0.3;
      END IF;
      
      -- Add some randomness (±20%)
      SET increment = increment * (0.8 + RAND() * 0.4);
      
      -- Update cumulative usage
      SET current_usage = current_usage + increment;
      
      -- Monthly reset for high users
      IF DAY(record_time) = 1 AND hour_offset = 0 AND p_pattern IN ('high', 'spike') THEN
        SET current_usage = increment;
      END IF;
      
      -- Cap at capacity
      IF current_usage > p_capacity THEN
        SET current_usage = p_capacity;
      END IF;
      
      -- Insert record
      INSERT INTO Data_test (
        idAsset, 
        iccid, 
        msisdn, 
        dataSize, 
        dataUsed, 
        lastConnection, 
        createdTime
      ) VALUES (
        p_sim_id,
        p_iccid,
        p_msisdn,
        CAST(p_capacity AS CHAR),
        CAST(ROUND(current_usage, 2) AS CHAR),
        record_time,
        record_time
      );
      
      SET hour_offset = hour_offset + 4;
    END WHILE;
    
    SET day_offset = day_offset + 1;
  END WHILE;
END$$

DELIMITER ;

-- Execute the procedures to generate data
SELECT '🚀 Starting test data generation...' as status;
CALL generate_test_sims();
SELECT '✅ Generated 100 test SIM cards' as status;
CALL generate_test_data();
SELECT '✅ Generated usage records for all SIMs' as status;

-- Verify data generation
SELECT 
  'Test SIM Cards Created' as Info,
  COUNT(*) as Count 
FROM assets_test;

SELECT 
  'Test Data Records Created' as Info,
  COUNT(*) as Count 
FROM Data_test;

SELECT 
  'Date Range' as Info,
  MIN(createdTime) as Earliest,
  MAX(createdTime) as Latest
FROM Data_test;

SELECT 
  'Average Records per SIM' as Info,
  ROUND(AVG(record_count), 0) as Average
FROM (
  SELECT iccid, COUNT(*) as record_count 
  FROM Data_test 
  GROUP BY iccid
) as sim_records;

-- Sample of generated data (top 10 highest usage)
SELECT 
  '--- TOP 10 USERS ---' as separator;

SELECT 
  d.iccid,
  d.msisdn,
  CONCAT(ROUND(CAST(d.dataSize AS DECIMAL) / 1024, 2), ' GB') as capacity,
  CONCAT(ROUND(CAST(d.dataUsed AS DECIMAL) / 1024, 2), ' GB') as used,
  d.lastConnection,
  CONCAT(ROUND(CAST(d.dataUsed AS DECIMAL) / CAST(d.dataSize AS DECIMAL) * 100, 2), '%') as usage_percent
FROM Data_test d
INNER JOIN (
  SELECT iccid, MAX(id) as maxId
  FROM Data_test
  GROUP BY iccid
) latest ON d.id = latest.maxId
ORDER BY CAST(d.dataUsed AS DECIMAL) DESC
LIMIT 10;

SELECT '✅ Test data generation complete!' as status;
SELECT 'ℹ️  To use test data, switch table names in your controllers' as instruction;
