const cron = require('node-cron');
const { promisePool, TABLE_NAMES } = require('../config/database');
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
    
    console.log(`[Email Scheduler] Checking for scheduled reports at ${currentTime} (test: ${testTime ? 'YES' : 'NO'})`);
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
      console.log('[Email Scheduler] No users scheduled for this time');
      logger.debug('[Email Scheduler] No users scheduled for this time');
      return;
    }
    
    console.log(`[Email Scheduler] Found ${users.length} user(s) to send reports to`);
    logger.info(`[Email Scheduler] Found ${users.length} user(s) to send reports to`);
    
    // Send report to each user
    for (const user of users) {
      try {
        console.log(`[Email Scheduler] Processing user: ${user.email}`);
        
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
          console.warn('[Email Scheduler] Could not read sent log, continuing...', err.message);
          logger.warn('[Email Scheduler] Could not read sent log, continuing...');
        }
        
        if (sentLog[lastSentKey]) {
          console.log(`[Email Scheduler] Already sent report to ${user.email} today, skipping`);
          logger.debug(`[Email Scheduler] Already sent report to ${user.email} today, skipping`);
          continue;
        }
        
        // Fetch alert data for this user
        console.log(`[Email Scheduler] Fetching alert data for ${user.email}...`);
        const alertData = await fetchUserAlertData(user);
        console.log(`[Email Scheduler] Alert data fetched, sending email...`);
        
        // Send email
        await sendAlertReportEmail(user.email, user.username, alertData);
        
        console.log(`[Email Scheduler] ✓ Sent alert report to ${user.email}`);
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
        console.error(`[Email Scheduler] Failed to send report to ${user.email}:`, error.message);
        logger.error(`[Email Scheduler] Failed to send report to ${user.email}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('[Email Scheduler] Error checking scheduled reports:', error.message, error.stack);
    logger.error('[Email Scheduler] Error checking scheduled reports:', error);
  }
}

/**
 * Fetch alert data for a user based on their thresholds
 */
async function fetchUserAlertData(user) {
  try {
    console.log(`[Email Scheduler] fetchUserAlertData: starting for ${user.email}`);
    const warningThreshold = user.warning_threshold / 100;
    const criticalThreshold = user.critical_threshold / 100;
    const projectedThreshold = user.projected_threshold / 100;
    
    console.log(`[Email Scheduler] Thresholds - warning: ${warningThreshold}, critical: ${criticalThreshold}, projected: ${projectedThreshold}`);
    
    // Fetch current usage alerts from Data table
    // Calculate usage percentage: (dataUsed / dataSize)
    console.log(`[Email Scheduler] Querying current alerts from ${TABLE_NAMES.data}...`);
    const [currentAlerts] = await promisePool.query(`
      SELECT 
        d.iccid,
        d.msisdn,
        (d.dataUsed / d.dataSize) as usage_percentage,
        d.dataUsed as used_this_month,
        d.dataSize as capacity
      FROM ${TABLE_NAMES.data} d
      WHERE (d.dataUsed / d.dataSize) >= ?
      ORDER BY (d.dataUsed / d.dataSize) DESC
      LIMIT 100
    `, [warningThreshold]);
    
    console.log(`[Email Scheduler] Found ${currentAlerts.length} current alerts`);
    
    // Fetch projected alerts (based on days elapsed vs month end)
    const now = new Date();
    const currentDay = now.getDate();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    console.log(`[Email Scheduler] Querying projected alerts (day ${currentDay}/${lastDayOfMonth})...`);
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
      FROM ${TABLE_NAMES.data} d
      WHERE d.dataUsed > 0
        AND (d.dataUsed / d.dataSize) < ?
        AND (d.dataUsed / ?) * ? / d.dataSize >= ?
      ORDER BY projected_usage DESC
      LIMIT 100
    `, [currentDay, lastDayOfMonth, projectedThreshold, currentDay, lastDayOfMonth, projectedThreshold]);
    
    console.log(`[Email Scheduler] Found ${projectedAlerts.length} projected alerts`);
    
    const result = {
      currentAlerts,
      projectedAlerts,
      warningThreshold,
      criticalThreshold,
      projectedThreshold
    };
    
    console.log(`[Email Scheduler] fetchUserAlertData completed for ${user.email}`);
    return result;
  } catch (error) {
    console.error(`[Email Scheduler] ERROR in fetchUserAlertData for ${user.email}:`, error.message, error.stack);
    logger.error(`[Email Scheduler] fetchUserAlertData error for ${user.email}:`, error);
    throw error;
  }
}

/**
 * Initialize email scheduler
 * Runs every minute to check for scheduled reports
 */
function initializeEmailScheduler() {
  console.log('[Email Scheduler] Initializing email alert scheduler...');
  logger.info('[Email Scheduler] Initializing email alert scheduler...');
  
  // Run every minute
  cron.schedule('* * * * *', async () => {
    console.log('[Email Scheduler] Cron job triggered, checking for reports...');
    try {
      await checkAndSendReports();
    } catch (err) {
      console.error('[Email Scheduler] Cron job error:', err.message);
    }
  });
  
  console.log('[Email Scheduler] Scheduler initialized - checking every minute');
  logger.info('[Email Scheduler] Scheduler initialized - checking every minute');
  
  // Also run once on startup (for testing)
  setTimeout(() => {
    console.log('[Email Scheduler] Running initial check on startup...');
    logger.debug('[Email Scheduler] Running initial check on startup...');
    checkAndSendReports();
  }, 5000); // Wait 5 seconds after startup
}

module.exports = {
  initializeEmailScheduler,
  checkAndSendReports
};
