/**
 * Dynamic SQL Query Builder Utility
 * Safely constructs SQL WHERE clauses from filter configurations
 */

const { TABLE_NAMES } = require('../config/database');

/**
 * Field metadata for type casting and validation
 */
const FIELD_METADATA = {
  iccid: { type: 'string', column: 'iccid' },
  msisdn: { type: 'string', column: 'msisdn' },
  dataUsed: { type: 'decimal', column: 'dataUsed', cast: 'CAST(dataUsed AS DECIMAL(15,2))' },
  dataSize: { type: 'decimal', column: 'dataSize', cast: 'CAST(dataSize AS DECIMAL(15,2))' },
  usagePercent: { 
    type: 'decimal', 
    column: 'usagePercent', 
    cast: '(CAST(dataUsed AS DECIMAL(15,2)) / NULLIF(CAST(dataSize AS DECIMAL(15,2)), 0) * 100)' 
  },
  lastConnection: { type: 'datetime', column: 'lastConnection' },
  createdTime: { type: 'datetime', column: 'createdTime' }
};

/**
 * Valid operators and their SQL equivalents
 */
const OPERATORS = {
  '=': '=',
  '!=': '!=',
  '>': '>',
  '<': '<',
  '>=': '>=',
  '<=': '<=',
  'LIKE': 'LIKE',
  'NOT LIKE': 'NOT LIKE',
  'IN': 'IN',
  'NOT IN': 'NOT IN',
  'BETWEEN': 'BETWEEN',
  'IS NULL': 'IS NULL',
  'IS NOT NULL': 'IS NOT NULL'
};

/**
 * Build WHERE clause from filters array
 * @param {Array} filters - Array of filter objects { field, operator, value }
 * @returns {Object} { whereClause, params }
 */
function buildWhereClause(filters) {
  if (!filters || !Array.isArray(filters) || filters.length === 0) {
    return { whereClause: '1=1', params: [] };
  }

  const conditions = [];
  const params = [];

  filters.forEach((filter) => {
    const { field, operator, value } = filter;

    // Validate field
    const fieldMeta = FIELD_METADATA[field];
    if (!fieldMeta) {
      throw new Error(`Invalid field: ${field}`);
    }

    // Validate operator
    if (!OPERATORS[operator]) {
      throw new Error(`Invalid operator: ${operator}`);
    }

    // Skip filters with null/undefined values for operators that require values
    const operatorsRequiringValue = ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'NOT LIKE', 'IN', 'NOT IN', 'BETWEEN'];
    if (operatorsRequiringValue.includes(operator) && (value === null || value === undefined || value === '')) {
      return; // Skip this filter
    }

    // Build condition based on field type and operator
    const columnRef = fieldMeta.cast || fieldMeta.column;

    switch (operator) {
      case 'IS NULL':
      case 'IS NOT NULL':
        conditions.push(`${columnRef} ${OPERATORS[operator]}`);
        break;

      case 'BETWEEN':
        if (!Array.isArray(value) || value.length !== 2) {
          throw new Error('BETWEEN operator requires array of 2 values');
        }
        conditions.push(`${columnRef} BETWEEN ? AND ?`);
        params.push(formatValue(value[0], fieldMeta.type));
        params.push(formatValue(value[1], fieldMeta.type));
        break;

      case 'IN':
      case 'NOT IN':
        if (!Array.isArray(value) || value.length === 0) {
          throw new Error(`${operator} operator requires non-empty array`);
        }
        const placeholders = value.map(() => '?').join(', ');
        conditions.push(`${columnRef} ${OPERATORS[operator]} (${placeholders})`);
        value.forEach(v => params.push(formatValue(v, fieldMeta.type)));
        break;

      case 'LIKE':
      case 'NOT LIKE':
        conditions.push(`${columnRef} ${OPERATORS[operator]} ?`);
        params.push(`%${value}%`);
        break;

      default:
        // Standard comparison operators (=, !=, >, <, >=, <=)
        conditions.push(`${columnRef} ${OPERATORS[operator]} ?`);
        params.push(formatValue(value, fieldMeta.type));
    }
  });

  const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';
  return { whereClause, params };
}

/**
 * Format value based on field type
 * @param {*} value - The value to format
 * @param {string} type - The field type (string, decimal, datetime)
 * @returns {*} Formatted value
 */
function formatValue(value, type) {
  switch (type) {
    case 'decimal':
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        throw new Error(`Invalid decimal value: ${value}`);
      }
      return numValue;
    case 'datetime':
      // Accept ISO format or Date object
      return value instanceof Date ? value.toISOString().slice(0, 19).replace('T', ' ') : value;
    case 'string':
    default:
      return value;
  }
}

/**
 * Build SELECT clause from selected metrics
 * @param {Array} metrics - Array of metric field names
 * @returns {string} SELECT clause
 */
function buildSelectClause(metrics) {
  if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
    // Default columns
    return `iccid, msisdn, 
            CAST(dataUsed AS DECIMAL(15,2)) as dataUsed, 
            CAST(dataSize AS DECIMAL(15,2)) as dataSize,
            (CAST(dataUsed AS DECIMAL(15,2)) / NULLIF(CAST(dataSize AS DECIMAL(15,2)), 0) * 100) as usagePercent,
            lastConnection, createdTime`;
  }

  const columns = metrics.map(metric => {
    const fieldMeta = FIELD_METADATA[metric];
    if (!fieldMeta) {
      throw new Error(`Invalid metric: ${metric}`);
    }

    if (fieldMeta.cast) {
      return `${fieldMeta.cast} as ${metric}`;
    }
    return fieldMeta.column;
  });

  return columns.join(', ');
}

/**
 * Build dynamic query for reports with filters and metrics
 * @param {Object} options - Query options
 * @param {Array} options.metrics - Selected metrics/columns
 * @param {Array} options.filters - Filter conditions
 * @param {string} options.groupBy - Grouping option (none, day, month)
 * @param {Date} options.startDate - Start date filter
 * @param {Date} options.endDate - End date filter
 * @param {boolean} options.uniqueIccid - Return only latest record per ICCID
 * @param {string} options.sortBy - Field to sort by
 * @param {string} options.sortOrder - Sort order (asc, desc)
 * @param {number} options.limit - Result limit
 * @returns {Object} { query, params }
 */
function buildReportQuery(options) {
  const {
    metrics = [],
    filters = [],
    groupBy = 'none',
    startDate,
    endDate,
    uniqueIccid = false,
    sortBy = '',
    sortOrder = 'desc',
    limit = 1000
  } = options;

  // Build SELECT clause
  let selectClause = buildSelectClause(metrics);

  // Build WHERE clause from filters
  const { whereClause, params } = buildWhereClause(filters);

  // Add date range conditions
  let dateConditions = [];
  if (startDate) {
    dateConditions.push('createdTime >= ?');
    params.push(formatValue(startDate, 'datetime'));
  }
  if (endDate) {
    dateConditions.push('createdTime <= ?');
    params.push(formatValue(endDate, 'datetime'));
  }

  // Combine all WHERE conditions
  const allConditions = [whereClause, ...dateConditions].filter(c => c !== '1=1').join(' AND ') || '1=1';

  // Build GROUP BY clause
  let groupByClause = '';
  let orderByClause = 'ORDER BY createdTime DESC';

  if (groupBy === 'day' || groupBy === 'month') {
    // When grouping is applied, override selectClause with aggregated metrics
    // This is intentional as individual metrics don't make sense with grouping
    if (groupBy === 'day') {
      selectClause = `DATE(createdTime) as date, 
                      SUM(CAST(dataUsed AS DECIMAL(15,2))) as totalDataUsed,
                      SUM(CAST(dataSize AS DECIMAL(15,2))) as totalDataSize,
                      AVG(CAST(dataUsed AS DECIMAL(15,2)) / NULLIF(CAST(dataSize AS DECIMAL(15,2)), 0) * 100) as avgUsagePercent,
                      COUNT(DISTINCT iccid) as simCount`;
      groupByClause = 'GROUP BY DATE(createdTime)';
      orderByClause = 'ORDER BY date DESC';
    } else if (groupBy === 'month') {
      selectClause = `DATE_FORMAT(createdTime, '%Y-%m') as month,
                      SUM(CAST(dataUsed AS DECIMAL(15,2))) as totalDataUsed,
                      SUM(CAST(dataSize AS DECIMAL(15,2))) as totalDataSize,
                      AVG(CAST(dataUsed AS DECIMAL(15,2)) / NULLIF(CAST(dataSize AS DECIMAL(15,2)), 0) * 100) as avgUsagePercent,
                      COUNT(DISTINCT iccid) as simCount`;
      groupByClause = 'GROUP BY DATE_FORMAT(createdTime, \'%Y-%m\')';
      orderByClause = 'ORDER BY month DESC';
    }
  } else {
    // When groupBy is 'none', use the selectClause built from metrics
    
    // Handle sorting
    if (sortBy && FIELD_METADATA[sortBy]) {
      const sortField = FIELD_METADATA[sortBy];
      const sortColumn = sortField.cast || sortField.column;
      const direction = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      orderByClause = `ORDER BY ${sortColumn} ${direction}`;
    }
  }

  // Handle unique ICCID - get latest record per ICCID
  let fromClause = TABLE_NAMES.data;
  if (uniqueIccid && groupBy === 'none') {
    // Use subquery to get only the latest record per ICCID
    fromClause = `(
      SELECT d.*
      FROM ${TABLE_NAMES.data} d
      INNER JOIN (
        SELECT iccid, MAX(createdTime) as maxTime
        FROM ${TABLE_NAMES.data}
        WHERE ${allConditions}
        GROUP BY iccid
      ) latest ON d.iccid = latest.iccid AND d.createdTime = latest.maxTime
    ) AS filtered_data`;
    // Reset allConditions to 1=1 since filtering is done in subquery
    // But we still need to maintain the structure
  }

  // Construct final query
  let query;
  if (uniqueIccid && groupBy === 'none') {
    // When using unique ICCID, the WHERE conditions are already in the subquery
    query = `
      SELECT ${selectClause}
      FROM ${fromClause}
      ${orderByClause}
      LIMIT ?
    `.trim();
  } else {
    query = `
      SELECT ${selectClause}
      FROM ${fromClause}
      WHERE ${allConditions}
      ${groupByClause}
      ${orderByClause}
      LIMIT ?
    `.trim();
  }

  params.push(limit);

  return { query, params };
}

module.exports = {
  buildWhereClause,
  buildSelectClause,
  buildReportQuery,
  FIELD_METADATA,
  OPERATORS
};
