const cron = require('node-cron');
const { promisePool } = require('../config/database');
const { sendAlertReportEmail } = require('./emailService');
const logger = require('./logger');

/**
 * Check and send alert reports to users whose scheduled time has arrived
 * @param {Date} testTime - Optional test time to override current time
 */
async function checkAndSendReports(testTime = null) {
  try {
    const now = testTime || new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    logger.debug(`[Email Scheduler] Checking for scheduled reports at ${currentTime} (test: ${testTime ? 'YES' : 'NO'})`);
    
    // Find users who have email alerts enabled and whose alert time matches current time (±2 minutes)
    const [users] = await promisePool.query(`
      SELECT 
        u.id,
        u.email,
        u.username,
        up.email_alert_time,
        up.warning_threshold,
        up.critical_threshold,
        up.projected_threshold
      FROM users u
      JOIN user_preferences up ON u.email = up.user_email
      WHERE up.email_alerts_enabled = true
        AND u.status IN ('active', 'approved')
        AND ABS(TIMESTAMPDIFF(MINUTE, 
          CONCAT(CURDATE(), ' ', TIME(up.email_alert_time)), 
          CONCAT(CURDATE(), ' ', ?))) <= 2
    `, [currentTime]);
    
    if (users.length === 0) {
      logger.debug('[Email Scheduler] No users scheduled for this time');
      return;
    }
    
    logger.info(`[Email Scheduler] Found ${users.length} user(s) to send reports to`);
    
    // Send report to each user
    for (const user of users) {
      try {
        // Check if we already sent today (avoid duplicate sends)
        const today = now.toISOString().split('T')[0];
        const lastSentKey = `email_report_sent_${user.email}_${today}`;
        
        // Use a simple check - in production, this should be stored in database
        const fs = require('fs');
        const path = require('path');
        const sentLogPath = path.join(__dirname, '../../.email-sent-log.json');
        
        let sentLog = {};
        try {
          if (fs.existsSync(sentLogPath)) {
            sentLog = JSON.parse(fs.readFileSync(sentLogPath, 'utf8'));
          }
        } catch (err) {
          logger.warn('[Email Scheduler] Could not read sent log, continuing...');
        }
        
        if (sentLog[lastSentKey]) {
          logger.debug(`[Email Scheduler] Already sent report to ${user.email} today, skipping`);
          continue;
        }
        
        // Fetch alert data for this user
        const alertData = await fetchUserAlertData(user);
        
        // Send email
        await sendAlertReportEmail(user.email, user.username, alertData);
        
        logger.info(`[Email Scheduler] Sent alert report to ${user.email}`);
        
        // Mark as sent
        sentLog[lastSentKey] = new Date().toISOString();
        
        // Clean up old entries (keep only today's)
        const cleanedLog = {};
        for (const key in sentLog) {
          if (key.includes(today)) {
            cleanedLog[key] = sentLog[key];
          }
        }
        
        fs.writeFileSync(sentLogPath, JSON.stringify(cleanedLog, null, 2));
        
      } catch (error) {
        logger.error(`[Email Scheduler] Failed to send report to ${user.email}:`, error.message);
      }
    }
    
  } catch (error) {
    logger.error('[Email Scheduler] Error checking scheduled reports:', error);
  }
}

/**
 * Fetch alert data for a user based on their thresholds
 */
async function fetchUserAlertData(user) {
  const warningThreshold = user.warning_threshold / 100;
  const criticalThreshold = user.critical_threshold / 100;
  const projectedThreshold = user.projected_threshold / 100;
  
  // Fetch current usage alerts from Data table
  // Calculate usage percentage: (dataUsed / dataSize)
  const [currentAlerts] = await promisePool.query(`
    SELECT 
      d.iccid,
      d.msisdn,
      (d.dataUsed / d.dataSize) as usage_percentage,
      d.dataUsed as used_this_month,
      d.dataSize as capacity
    FROM Data d
    WHERE (d.dataUsed / d.dataSize) >= ?
    ORDER BY (d.dataUsed / d.dataSize) DESC
    LIMIT 100
  `, [warningThreshold]);
  
  // Fetch projected alerts (based on days elapsed vs month end)
  const now = new Date();
  const currentDay = now.getDate();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  
  const [projectedAlerts] = await promisePool.query(`
    SELECT 
      d.iccid,
      d.msisdn,
      (d.dataUsed / d.dataSize) as usage_percentage,
      d.dataUsed as used_this_month,
      d.dataSize as capacity,
      CASE 
        WHEN d.dataUsed > 0 
        THEN (d.dataUsed / ?) * ? / d.dataSize
        ELSE 0 
      END as projected_usage
    FROM Data d
    WHERE d.dataUsed > 0
      AND (d.dataUsed / d.dataSize) < ?
      AND (d.dataUsed / ?) * ? / d.dataSize >= ?
    ORDER BY projected_usage DESC
    LIMIT 100
  `, [currentDay, lastDayOfMonth, projectedThreshold, currentDay, lastDayOfMonth, projectedThreshold]);
  
  return {
    currentAlerts,
    projectedAlerts,
    warningThreshold,
    criticalThreshold,
    projectedThreshold
  };
}

/**
 * Initialize email scheduler
 * Runs every minute to check for scheduled reports
 */
function initializeEmailScheduler() {
  logger.info('[Email Scheduler] Initializing email alert scheduler...');
  
  // Run every minute
  cron.schedule('* * * * *', async () => {
    await checkAndSendReports();
  });
  
  logger.info('[Email Scheduler] Scheduler initialized - checking every minute');
  
  // Also run once on startup (for testing)
  setTimeout(() => {
    logger.debug('[Email Scheduler] Running initial check...');
    checkAndSendReports();
  }, 5000); // Wait 5 seconds after startup
}

module.exports = {
  initializeEmailScheduler,
  checkAndSendReports
};
