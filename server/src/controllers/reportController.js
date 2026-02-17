const logger = require('../utils/logger');
const { promisePool, TABLE_NAMES } = require('../config/database');
const { buildReportQuery, FIELD_METADATA, OPERATORS } = require('../utils/queryBuilder');

/**
 * Generate custom report based on user filters
 */
exports.generateCustomReport = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      iccid,
      groupBy = 'day', // day, month, none
      columns = ['iccid', 'msisdn', 'dataUsed', 'createdTime']
    } = req.body;

    // Build WHERE clause
    let whereConditions = ['1=1'];
    let params = [];

    if (startDate) {
      whereConditions.push('d.createdTime >= ?');
      params.push(startDate);
    }
    if (endDate) {
      whereConditions.push('d.createdTime <= ?');
      params.push(endDate);
    }
    if (iccid) {
      whereConditions.push('d.iccid = ?');
      params.push(iccid);
    }

    const whereClause = whereConditions.join(' AND ');

    let query = '';
    if (groupBy === 'none') {
      // Raw data
      query = `
        SELECT 
          d.iccid,
          d.msisdn,
          CAST(d.dataUsed AS DECIMAL(15,2)) as dataUsed,
          CAST(d.dataSize AS DECIMAL(15,2)) as dataSize,
          d.lastConnection,
          d.createdTime
        FROM ${TABLE_NAMES.data} d
        WHERE ${whereClause}
        ORDER BY d.createdTime DESC
        LIMIT 1000
      `;
    } else if (groupBy === 'day') {
      query = `
        SELECT 
          d.iccid,
          d.msisdn,
          DATE(d.createdTime) as date,
          SUM(CAST(d.dataUsed AS DECIMAL(15,2))) as totalDataUsed,
          AVG(CAST(d.dataSize AS DECIMAL(15,2))) as avgDataSize,
          COUNT(*) as recordCount
        FROM ${TABLE_NAMES.data} d
        WHERE ${whereClause}
        GROUP BY d.iccid, d.msisdn, DATE(d.createdTime)
        ORDER BY date DESC
        LIMIT 1000
      `;
    } else if (groupBy === 'month') {
      query = `
        SELECT 
          d.iccid,
          d.msisdn,
          DATE_FORMAT(d.createdTime, '%Y-%m') as month,
          SUM(CAST(d.dataUsed AS DECIMAL(15,2))) as totalDataUsed,
          AVG(CAST(d.dataSize AS DECIMAL(15,2))) as avgDataSize,
          COUNT(*) as recordCount
        FROM ${TABLE_NAMES.data} d
        WHERE ${whereClause}
        GROUP BY d.iccid, d.msisdn, DATE_FORMAT(d.createdTime, '%Y-%m')
        ORDER BY month DESC
        LIMIT 1000
      `;
    }

    const [results] = await promisePool.query(query, params);

    res.json({
      success: true,
      data: {
        report: results,
        filters: { startDate, endDate, iccid, groupBy },
        count: results.length
      }
    });
  } catch (error) {
    logger.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating report',
      error: error.message
    });
  }
};

/**
 * Get alerts based on threshold
 */
exports.getAlerts = async (req, res) => {
  try {
    const threshold = parseFloat(req.query.threshold) || 0.8;

    const [alerts] = await promisePool.query(
      `SELECT 
        d.iccid,
        d.msisdn,
        CAST(d.dataUsed AS DECIMAL(15,2)) as dataUsed,
        CAST(d.dataSize AS DECIMAL(15,2)) as dataSize,
        (CAST(d.dataUsed AS DECIMAL(15,2)) / NULLIF(CAST(d.dataSize AS DECIMAL(15,2)), 0) * 100) as usagePercent,
        d.lastConnection
       FROM ${TABLE_NAMES.data} d
       INNER JOIN (
         SELECT iccid, MAX(id) as maxId
         FROM ${TABLE_NAMES.data}
         GROUP BY iccid
       ) latest ON d.id = latest.maxId
       WHERE (CAST(d.dataUsed AS DECIMAL(15,2)) / NULLIF(CAST(d.dataSize AS DECIMAL(15,2)), 0)) >= ?
       ORDER BY usagePercent DESC`,
      [threshold]
    );

    res.json({
      success: true,
      data: {
        alerts: alerts.map(alert => ({
          iccid: alert.iccid,
          msisdn: alert.msisdn,
          dataUsed: parseFloat(alert.dataUsed).toFixed(2),
          dataSize: parseFloat(alert.dataSize).toFixed(2),
          usagePercent: parseFloat(alert.usagePercent).toFixed(2),
          lastConnection: alert.lastConnection
        })),
        threshold: threshold * 100,
        count: alerts.length
      }
    });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alerts',
      error: error.message
    });
  }
};

/**
 * Get projected usage alerts
 * Calculates end-of-month projected usage based on current usage rate
 */
exports.getProjectedAlerts = async (req, res) => {
  try {
    const threshold = parseFloat(req.query.threshold) || 0.8;

    // Get current date info
    const now = new Date();
    const currentDay = now.getDate();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const totalDaysInMonth = lastDayOfMonth.getDate();
    const daysElapsed = currentDay;
    const daysRemaining = totalDaysInMonth - currentDay;

    // Get first record of the month and latest record for each SIM
    const [projectedAlerts] = await promisePool.query(
      `SELECT 
        latest.iccid,
        latest.msisdn,
        latest.dataUsed as currentDataUsed,
        latest.dataSize,
        first.dataUsed as monthStartUsed,
        latest.lastConnection,
        (latest.dataUsed - first.dataUsed) as usedThisMonth,
        ((latest.dataUsed - first.dataUsed) / ?) * ? as projectedUsage,
        (((latest.dataUsed - first.dataUsed) / ?) * ? / NULLIF(latest.dataSize, 0) * 100) as projectedPercent
       FROM (
         SELECT 
           d1.iccid,
           d1.msisdn,
           CAST(d1.dataUsed AS DECIMAL(15,2)) as dataUsed,
           CAST(d1.dataSize AS DECIMAL(15,2)) as dataSize,
           d1.lastConnection
         FROM ${TABLE_NAMES.data} d1
         INNER JOIN (
           SELECT iccid, MAX(id) as maxId
           FROM ${TABLE_NAMES.data}
           GROUP BY iccid
         ) maxIds ON d1.id = maxIds.maxId
       ) latest
       INNER JOIN (
         SELECT 
           d2.iccid,
           CAST(d2.dataUsed AS DECIMAL(15,2)) as dataUsed
         FROM ${TABLE_NAMES.data} d2
         INNER JOIN (
           SELECT iccid, MIN(id) as minId
           FROM ${TABLE_NAMES.data}
           WHERE createdTime >= ?
           GROUP BY iccid
         ) minIds ON d2.id = minIds.minId
       ) first ON latest.iccid = first.iccid
       WHERE (((latest.dataUsed - first.dataUsed) / ?) * ? / NULLIF(latest.dataSize, 0)) >= ?
       ORDER BY projectedPercent DESC`,
      [
        daysElapsed, 
        totalDaysInMonth,
        daysElapsed, 
        totalDaysInMonth,
        firstDayOfMonth.toISOString().split('T')[0] + ' 00:00:00',
        daysElapsed,
        totalDaysInMonth,
        threshold
      ]
    );

    res.json({
      success: true,
      data: {
        alerts: projectedAlerts.map(alert => ({
          iccid: alert.iccid,
          msisdn: alert.msisdn,
          currentUsed: parseFloat(alert.currentDataUsed).toFixed(2),
          dataSize: parseFloat(alert.dataSize).toFixed(2),
          usedThisMonth: parseFloat(alert.usedThisMonth).toFixed(2),
          projectedUsage: parseFloat(alert.projectedUsage).toFixed(2),
          projectedPercent: parseFloat(alert.projectedPercent).toFixed(2),
          currentPercent: ((parseFloat(alert.currentDataUsed) / parseFloat(alert.dataSize)) * 100).toFixed(2),
          lastConnection: alert.lastConnection
        })),
        threshold: threshold * 100,
        count: projectedAlerts.length,
        billingCycle: {
          daysElapsed,
          totalDays: totalDaysInMonth,
          daysRemaining,
          month: firstDayOfMonth.toISOString().split('T')[0]
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching projected alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projected alerts',
      error: error.message
    });
  }
};

/**
 * Generate dynamic report with advanced filters
 */
exports.generateDynamicReport = async (req, res) => {
  try {
    const {
      metrics = [],
      filters = [],
      groupBy = 'none',
      startDate,
      endDate,
      uniqueIccid = false,
      sortBy,
      sortOrder = 'desc',
      limit = 1000
    } = req.body;

    // Use query builder to construct dynamic query
    const { query, params } = buildReportQuery({
      metrics,
      filters,
      groupBy,
      startDate,
      endDate,
      uniqueIccid,
      sortBy,
      sortOrder,
      limit
    });

    const [results] = await promisePool.query(query, params);

    res.json({
      success: true,
      data: {
        report: results,
        filters: { metrics, filters, groupBy, startDate, endDate },
        count: results.length
      }
    });
  } catch (error) {
    logger.error('Error generating dynamic report:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating dynamic report',
      error: error.message
    });
  }
};

/**
 * Get monthly usage history for trend analysis
 */
exports.getMonthlyUsage = async (req, res) => {
  try {
    const { months = 12 } = req.query;
    const monthsBack = parseInt(months) || 12;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);

    const startDateStr = startDate.toISOString().split('T')[0] + ' 00:00:00';
    const endDateStr = endDate.toISOString().split('T')[0] + ' 23:59:59';

    const [monthlyData] = await promisePool.query(
      `SELECT 
        DATE_FORMAT(d.createdTime, '%Y-%m') as month,
        SUM(CAST(d.dataUsed AS DECIMAL(15,2))) as totalDataUsed,
        SUM(CAST(d.dataSize AS DECIMAL(15,2))) as totalDataSize,
        AVG(CAST(d.dataUsed AS DECIMAL(15,2)) / NULLIF(CAST(d.dataSize AS DECIMAL(15,2)), 0) * 100) as avgUsagePercent,
        COUNT(DISTINCT d.iccid) as simCount,
        COUNT(*) as recordCount
       FROM ${TABLE_NAMES.data} d
       INNER JOIN (
         SELECT iccid, DATE_FORMAT(createdTime, '%Y-%m') as month, MAX(createdTime) as maxTime
         FROM ${TABLE_NAMES.data}
         WHERE createdTime >= ? AND createdTime <= ?
         GROUP BY iccid, DATE_FORMAT(createdTime, '%Y-%m')
       ) latest ON d.iccid = latest.iccid 
                   AND DATE_FORMAT(d.createdTime, '%Y-%m') = latest.month 
                   AND d.createdTime = latest.maxTime
       WHERE d.createdTime >= ? AND d.createdTime <= ?
       GROUP BY DATE_FORMAT(d.createdTime, '%Y-%m')
       ORDER BY month ASC`,
      [startDateStr, endDateStr, startDateStr, endDateStr]
    );

    // Convert MB to GB
    const formattedData = monthlyData.map(row => ({
      month: row.month,
      totalDataUsedGB: parseFloat((row.totalDataUsed / 1024).toFixed(2)),
      totalDataSizeGB: parseFloat((row.totalDataSize / 1024).toFixed(2)),
      avgUsagePercent: parseFloat(row.avgUsagePercent || 0).toFixed(2),
      simCount: row.simCount,
      recordCount: row.recordCount
    }));

    res.json({
      success: true,
      data: {
        monthlyUsage: formattedData,
        period: `${monthsBack} months`,
        unit: 'GB'
      }
    });
  } catch (error) {
    logger.error('Error fetching monthly usage:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly usage data',
      error: error.message
    });
  }
};

/**
 * Get available fields and operators for report builder
 */
exports.getReportMetadata = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        fields: Object.keys(FIELD_METADATA).map(key => ({
          name: key,
          type: FIELD_METADATA[key].type,
          label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
        })),
        operators: Object.keys(OPERATORS).map(key => ({
          value: key,
          label: key
        })),
        groupByOptions: [
          { value: 'none', label: 'No Grouping' },
          { value: 'day', label: 'Daily' },
          { value: 'month', label: 'Monthly' }
        ]
      }
    });
  } catch (error) {
    logger.error('Error fetching report metadata:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching report metadata',
      error: error.message
    });
  }
};
