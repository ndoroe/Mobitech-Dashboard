const logger = require('../utils/logger');
const { promisePool, TABLE_NAMES } = require('../config/database');

/**
 * Get dashboard statistics
 * - Total SIMs
 * - Monthly Total Usage
 * - Pool Utilization (Total Available vs Used)
 * - Active Alerts
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const alertThreshold = parseFloat(req.query.threshold) || 0.8; // Default 80%

    // Get current month date range
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayStr = firstDayOfMonth.toISOString().split('T')[0] + ' 00:00:00';

    // Query 1: Total Active SIMs
    const [simCount] = await promisePool.query(
      `SELECT COUNT(DISTINCT id) as totalSims FROM ${TABLE_NAMES.assets}`
    );

    // Query 2: Monthly Total Usage (latest record per SIM for current month)
    const [monthlyUsage] = await promisePool.query(
      `SELECT 
        COALESCE(SUM(CAST(d.dataUsed AS DECIMAL(15,2))), 0) as totalUsed
       FROM ${TABLE_NAMES.data} d
       INNER JOIN (
         SELECT iccid, MAX(id) as maxId
         FROM ${TABLE_NAMES.data}
         WHERE createdTime >= ?
         GROUP BY iccid
       ) latest ON d.id = latest.maxId
       WHERE d.id IN (
         SELECT MAX(id)
         FROM ${TABLE_NAMES.data}
         WHERE createdTime >= ?
         GROUP BY iccid
       )`,
      [firstDayStr, firstDayStr]
    );

    // Query 3: Pool Utilization (latest record per SIM)
    const [poolData] = await promisePool.query(
      `SELECT 
        SUM(CAST(d.dataSize AS DECIMAL(15,2))) as totalCapacity,
        SUM(CAST(d.dataUsed AS DECIMAL(15,2))) as totalUsed
       FROM ${TABLE_NAMES.data} d
       INNER JOIN (
         SELECT iccid, MAX(id) as maxId
         FROM ${TABLE_NAMES.data}
         GROUP BY iccid
       ) latest ON d.id = latest.maxId`
    );

    // Query 4: Count alerts (SIMs above threshold)
    const [alerts] = await promisePool.query(
      `SELECT COUNT(*) as alertCount
       FROM (
         SELECT 
           d.iccid,
           CAST(d.dataUsed AS DECIMAL(15,2)) / NULLIF(CAST(d.dataSize AS DECIMAL(15,2)), 0) as usageRatio
         FROM ${TABLE_NAMES.data} d
         INNER JOIN (
           SELECT iccid, MAX(id) as maxId
           FROM ${TABLE_NAMES.data}
           GROUP BY iccid
         ) latest ON d.id = latest.maxId
         HAVING usageRatio >= ?
       ) as alertSims`,
      [alertThreshold]
    );

    // Calculate pool utilization percentage
    const capacity = parseFloat(poolData[0]?.totalCapacity) || 0;
    const used = parseFloat(poolData[0]?.totalUsed) || 0;
    const utilizationPercent = capacity > 0 ? ((used / capacity) * 100).toFixed(2) : 0;

    // Convert MB to GB
    const monthlyUsageGB = parseFloat(monthlyUsage[0].totalUsed) / 1024;
    const capacityGB = capacity / 1024;
    const usedGB = used / 1024;

    // Calculate projected monthly usage
    const currentDay = now.getDate(); // Day of month (1-31)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyAverage = monthlyUsageGB / currentDay;
    const projectedUsageGB = dailyAverage * daysInMonth;

    res.json({
      success: true,
      data: {
        totalSims: simCount[0].totalSims,
        monthlyUsage: monthlyUsageGB.toFixed(2),
        monthlyUsageUnit: 'GB',
        projectedUsage: projectedUsageGB.toFixed(2),
        projectedUsageUnit: 'GB',
        projectionData: {
          daysElapsed: currentDay,
          daysInMonth: daysInMonth,
          dailyAverage: dailyAverage.toFixed(2)
        },
        poolUtilization: {
          totalCapacity: capacityGB.toFixed(2),
          totalUsed: usedGB.toFixed(2),
          unit: 'GB',
          percentage: parseFloat(utilizationPercent)
        },
        alerts: alerts[0].alertCount,
        alertThreshold: alertThreshold * 100
      }
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
};

/**
 * Get top data consumers
 */
exports.getTopConsumers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const period = req.query.period || 'month'; // month, week, all

    // Build the date condition for the subquery
    let subqueryCondition = '1=1';
    if (period === 'month') {
      const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const firstDayStr = firstDay.toISOString().split('T')[0] + ' 00:00:00';
      subqueryCondition = `createdTime >= '${firstDayStr}'`;
    } else if (period === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weekAgoStr = weekAgo.toISOString().split('T')[0] + ' 00:00:00';
      subqueryCondition = `createdTime >= '${weekAgoStr}'`;
    }

    const [topUsers] = await promisePool.query(
      `SELECT 
        d.iccid,
        d.msisdn,
        CAST(d.dataUsed AS DECIMAL(15,2)) as totalUsed,
        CAST(d.dataSize AS DECIMAL(15,2)) as dataSize,
        d.lastConnection,
        (CAST(d.dataUsed AS DECIMAL(15,2)) / NULLIF(CAST(d.dataSize AS DECIMAL(15,2)), 0) * 100) as usagePercent
       FROM ${TABLE_NAMES.data} d
       INNER JOIN (
         SELECT iccid, MAX(id) as maxId
         FROM ${TABLE_NAMES.data}
         WHERE ${subqueryCondition}
         GROUP BY iccid
       ) latest ON d.id = latest.maxId
       ORDER BY totalUsed DESC
       LIMIT ?`,
      [limit]
    );

    res.json({
      success: true,
      data: topUsers.map(user => ({
        iccid: user.iccid,
        msisdn: user.msisdn,
        totalUsed: parseFloat(user.totalUsed).toFixed(2),
        dataSize: parseFloat(user.dataSize).toFixed(2),
        usagePercent: parseFloat(user.usagePercent || 0).toFixed(2),
        lastConnection: user.lastConnection
      }))
    });
  } catch (error) {
    logger.error('Error fetching top consumers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top consumers',
      error: error.message
    });
  }
};

/**
 * Get monthly comparison data (last month vs current month)
 * Returns daily aggregated data for both months
 */
exports.getMonthlyComparison = async (req, res) => {
  try {
    const now = new Date();
    
    // Current month range
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    // Last month range
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    
    // Format dates for SQL
    const formatDate = (date) => date.toISOString().split('T')[0] + ' 00:00:00';
    const formatDateEnd = (date) => date.toISOString().split('T')[0] + ' 23:59:59';
    
    // Query for last month data grouped by day
    const [lastMonthData] = await promisePool.query(
      `SELECT 
        DATE(createdTime) as date,
        SUM(CAST(dataUsed AS DECIMAL(15,2))) as totalUsage
       FROM ${TABLE_NAMES.data}
       WHERE createdTime >= ? AND createdTime <= ?
       GROUP BY DATE(createdTime)
       ORDER BY date ASC`,
      [formatDate(lastMonthStart), formatDateEnd(lastMonthEnd)]
    );
    
    // Query for current month data grouped by day
    const [currentMonthData] = await promisePool.query(
      `SELECT 
        DATE(createdTime) as date,
        SUM(CAST(dataUsed AS DECIMAL(15,2))) as totalUsage
       FROM ${TABLE_NAMES.data}
       WHERE createdTime >= ? AND createdTime <= ?
       GROUP BY DATE(createdTime)
       ORDER BY date ASC`,
      [formatDate(currentMonthStart), formatDateEnd(currentMonthEnd)]
    );
    
    // Convert MB to GB and format response
    const lastMonth = lastMonthData.map(row => ({
      date: row.date,
      day: new Date(row.date).getDate(),
      usage: parseFloat((row.totalUsage / 1024).toFixed(2))
    }));
    
    const currentMonth = currentMonthData.map(row => ({
      date: row.date,
      day: new Date(row.date).getDate(),
      usage: parseFloat((row.totalUsage / 1024).toFixed(2))
    }));
    
    res.json({
      success: true,
      data: {
        lastMonth: {
          name: lastMonthStart.toLocaleString('default', { month: 'long', year: 'numeric' }),
          data: lastMonth
        },
        currentMonth: {
          name: currentMonthStart.toLocaleString('default', { month: 'long', year: 'numeric' }),
          data: currentMonth
        },
        unit: 'GB'
      }
    });
  } catch (error) {
    logger.error('Error fetching monthly comparison:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly comparison data',
      error: error.message
    });
  }
};
