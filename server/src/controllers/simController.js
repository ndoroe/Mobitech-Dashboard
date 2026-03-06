const logger = require("../utils/logger");
const { promisePool, TABLE_NAMES } = require("../config/database");

/**
 * Get all SIM cards with pagination, search, sort, and column filters
 */
exports.getAllSims = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const offset = (page - 1) * limit;

    // Sort params (from AG Grid sortModel)
    const allowedSortFields = [
      "iccid",
      "msisdn",
      "dataSize",
      "dataUsed",
      "usagePercent",
      "lastConnection",
      "CreatedTime",
    ];
    let sortField = req.query.sortField || "";
    let sortOrder = req.query.sortOrder === "asc" ? "ASC" : "DESC";

    // Map frontend field names to SQL expressions
    const sortFieldMap = {
      iccid: "a.iccid",
      msisdn: "d.msisdn",
      dataSize: "CAST(d.dataSize AS DECIMAL(15,2))",
      dataUsed: "CAST(d.dataUsed AS DECIMAL(15,2))",
      usagePercent:
        "(CAST(d.dataUsed AS DECIMAL(15,2)) / NULLIF(CAST(d.dataSize AS DECIMAL(15,2)), 0) * 100)",
      lastConnection: "d.lastConnection",
      CreatedTime: "a.CreatedTime",
      createdTime: "a.CreatedTime",
    };

    let orderByClause = "ORDER BY a.CreatedTime DESC";
    if (sortField && allowedSortFields.includes(sortField)) {
      const mappedField = sortFieldMap[sortField] || "a.CreatedTime";
      orderByClause = `ORDER BY ${mappedField} ${sortOrder}`;
    }

    // Column filter params (from AG Grid filterModel JSON)
    let filterConditions = [];
    let filterParams = [];
    if (req.query.filterModel) {
      try {
        const filterModel = JSON.parse(req.query.filterModel);
        const filterFieldMap = {
          iccid: "a.iccid",
          msisdn: "d.msisdn",
          dataSize: "CAST(d.dataSize AS DECIMAL(15,2))",
          dataUsed: "CAST(d.dataUsed AS DECIMAL(15,2))",
          usagePercent:
            "(CAST(d.dataUsed AS DECIMAL(15,2)) / NULLIF(CAST(d.dataSize AS DECIMAL(15,2)), 0) * 100)",
          lastConnection: "d.lastConnection",
        };

        for (const [field, model] of Object.entries(filterModel)) {
          const sqlField = filterFieldMap[field];
          if (!sqlField) continue;

          const { type, filter: filterVal, filterTo, dateFrom, dateTo } = model;

          if (model.filterType === "text") {
            if (type === "contains" && filterVal) {
              filterConditions.push(`${sqlField} LIKE ?`);
              filterParams.push(`%${filterVal}%`);
            } else if (type === "notContains" && filterVal) {
              filterConditions.push(`${sqlField} NOT LIKE ?`);
              filterParams.push(`%${filterVal}%`);
            } else if (type === "equals" && filterVal) {
              filterConditions.push(`${sqlField} = ?`);
              filterParams.push(filterVal);
            } else if (type === "notEqual" && filterVal) {
              filterConditions.push(`${sqlField} != ?`);
              filterParams.push(filterVal);
            } else if (type === "startsWith" && filterVal) {
              filterConditions.push(`${sqlField} LIKE ?`);
              filterParams.push(`${filterVal}%`);
            } else if (type === "endsWith" && filterVal) {
              filterConditions.push(`${sqlField} LIKE ?`);
              filterParams.push(`%${filterVal}`);
            }
          } else if (model.filterType === "number") {
            const numVal = parseFloat(filterVal);
            if (type === "equals" && !isNaN(numVal)) {
              filterConditions.push(`${sqlField} = ?`);
              filterParams.push(numVal);
            } else if (type === "notEqual" && !isNaN(numVal)) {
              filterConditions.push(`${sqlField} != ?`);
              filterParams.push(numVal);
            } else if (type === "greaterThan" && !isNaN(numVal)) {
              filterConditions.push(`${sqlField} > ?`);
              filterParams.push(numVal);
            } else if (type === "greaterThanOrEqual" && !isNaN(numVal)) {
              filterConditions.push(`${sqlField} >= ?`);
              filterParams.push(numVal);
            } else if (type === "lessThan" && !isNaN(numVal)) {
              filterConditions.push(`${sqlField} < ?`);
              filterParams.push(numVal);
            } else if (type === "lessThanOrEqual" && !isNaN(numVal)) {
              filterConditions.push(`${sqlField} <= ?`);
              filterParams.push(numVal);
            } else if (
              type === "inRange" &&
              !isNaN(numVal) &&
              !isNaN(parseFloat(filterTo))
            ) {
              filterConditions.push(`${sqlField} BETWEEN ? AND ?`);
              filterParams.push(numVal, parseFloat(filterTo));
            }
          } else if (model.filterType === "date") {
            if (type === "equals" && dateFrom) {
              filterConditions.push(`DATE(${sqlField}) = ?`);
              filterParams.push(dateFrom);
            } else if (type === "greaterThan" && dateFrom) {
              filterConditions.push(`${sqlField} > ?`);
              filterParams.push(dateFrom);
            } else if (type === "lessThan" && dateFrom) {
              filterConditions.push(`${sqlField} < ?`);
              filterParams.push(dateFrom);
            } else if (type === "inRange" && dateFrom && dateTo) {
              filterConditions.push(`${sqlField} BETWEEN ? AND ?`);
              filterParams.push(dateFrom, dateTo);
            }
          }
        }
      } catch (e) {
        logger.warn("Invalid filterModel JSON:", e.message);
      }
    }

    // Build WHERE clause combining search + column filters
    let whereConditions = [];
    let whereParams = [];
    if (search) {
      whereConditions.push("(a.iccid LIKE ? OR d.msisdn LIKE ?)");
      whereParams.push(`%${search}%`, `%${search}%`);
    }
    if (filterConditions.length > 0) {
      whereConditions = whereConditions.concat(filterConditions);
      whereParams = whereParams.concat(filterParams);
    }
    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Get total count from assets table (source of truth)
    const [countResult] = await promisePool.query(
      `SELECT COUNT(DISTINCT a.iccid) as total
       FROM ${TABLE_NAMES.assets} a
       LEFT JOIN (
         SELECT d1.*
         FROM ${TABLE_NAMES.data} d1
         INNER JOIN (
           SELECT iccid, MAX(id) as maxId
           FROM ${TABLE_NAMES.data}
           GROUP BY iccid
         ) d2 ON d1.id = d2.maxId
       ) d ON a.iccid = d.iccid
       ${whereClause}`,
      whereParams,
    );

    // Get SIM list with latest data
    const [sims] = await promisePool.query(
      `SELECT 
        a.id as assetId,
        a.iccid,
        a.CreatedTime,
        d.msisdn,
        d.dataSize,
        d.dataUsed,
        d.lastConnection,
        (CAST(d.dataUsed AS DECIMAL(15,2)) / NULLIF(CAST(d.dataSize AS DECIMAL(15,2)), 0) * 100) as usagePercent
       FROM ${TABLE_NAMES.assets} a
       LEFT JOIN (
         SELECT d1.*
         FROM ${TABLE_NAMES.data} d1
         INNER JOIN (
           SELECT iccid, MAX(id) as maxId
           FROM ${TABLE_NAMES.data}
           GROUP BY iccid
         ) d2 ON d1.id = d2.maxId
       ) d ON a.iccid = d.iccid
       ${whereClause}
       ${orderByClause}
       LIMIT ? OFFSET ?`,
      [...whereParams, limit, offset],
    );

    res.json({
      success: true,
      data: {
        sims: sims.map((sim) => ({
          assetId: sim.assetId,
          iccid: sim.iccid,
          msisdn: sim.msisdn || "N/A",
          dataSize: parseFloat(sim.dataSize || 0).toFixed(2),
          dataUsed: parseFloat(sim.dataUsed || 0).toFixed(2),
          usagePercent: parseFloat(sim.usagePercent || 0).toFixed(2),
          lastConnection: sim.lastConnection,
          createdTime: sim.CreatedTime,
        })),
        pagination: {
          page,
          limit,
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching SIMs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching SIM cards",
      error: error.message,
    });
  }
};

/**
 * Get usage history for a specific SIM
 */
exports.getSimHistory = async (req, res) => {
  try {
    const { iccid } = req.params;
    const period = req.query.period || "week"; // day, week, month, mtd
    const groupBy = req.query.groupBy || "hour"; // hour, day

    let dateFilter = "";
    if (period === "day") {
      dateFilter = `AND d.createdTime >= DATE_SUB(NOW(), INTERVAL 1 DAY)`;
    } else if (period === "week") {
      dateFilter = `AND d.createdTime >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;
    } else if (period === "month") {
      // Last month - from first day to last day of previous calendar month
      dateFilter = `AND d.createdTime >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01 00:00:00') AND d.createdTime < DATE_FORMAT(NOW(), '%Y-%m-01 00:00:00')`;
    } else if (period === "mtd") {
      // Month to date - from first day of current month to now
      dateFilter = `AND d.createdTime >= DATE_FORMAT(NOW(), '%Y-%m-01 00:00:00')`;
    }

    let groupByClause = "";
    let selectClause = "";
    if (groupBy === "hour") {
      selectClause = `DATE_FORMAT(d.createdTime, '%Y-%m-%d %H:00:00') as timeLabel`;
      groupByClause = `DATE_FORMAT(d.createdTime, '%Y-%m-%d %H:00:00')`;
    } else {
      selectClause = `DATE_FORMAT(d.createdTime, '%Y-%m-%d') as timeLabel`;
      groupByClause = `DATE_FORMAT(d.createdTime, '%Y-%m-%d')`;
    }

    const [history] = await promisePool.query(
      `SELECT 
        ${selectClause},
        d.dataUsed,
        d.dataSize,
        d.lastConnection
       FROM ${TABLE_NAMES.data} d
       INNER JOIN (
         SELECT ${groupByClause.replace(/d\./g, "dt.")} as groupKey, MAX(dt.createdTime) as maxTime
         FROM ${TABLE_NAMES.data} dt
         WHERE dt.iccid = ? ${dateFilter.replace(/d\./g, "dt.")}
         GROUP BY ${groupByClause.replace(/d\./g, "dt.")}
       ) latest ON ${groupByClause} = latest.groupKey AND d.createdTime = latest.maxTime
       WHERE d.iccid = ? ${dateFilter}
       ORDER BY timeLabel ASC`,
      [iccid, iccid],
    );

    // Get SIM info
    const [simInfo] = await promisePool.query(
      `SELECT a.*, d.msisdn
       FROM ${TABLE_NAMES.assets} a
       LEFT JOIN ${TABLE_NAMES.data} d ON a.iccid = d.iccid
       WHERE a.iccid = ?
       LIMIT 1`,
      [iccid],
    );

    res.json({
      success: true,
      data: {
        simInfo: simInfo[0] || null,
        history: history.map((h) => ({
          time: h.timeLabel,
          dataUsed: parseFloat(h.dataUsed).toFixed(2),
          dataSize: parseFloat(h.dataSize).toFixed(2),
          lastConnection: h.lastConnection,
        })),
      },
    });
  } catch (error) {
    logger.error("Error fetching SIM history:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching SIM history",
      error: error.message,
    });
  }
};
