const mysql = require('mysql2');
const path = require('path');
const logger = require('../utils/logger');

const envPath = path.join(__dirname, '../../.env');
require('dotenv').config({ path: envPath, override: true });

// Table name configuration based on test mode
const USE_TEST_DATA = process.env.USE_TEST_DATA === 'true';
const TABLE_NAMES = {
  assets: USE_TEST_DATA ? 'assets_test' : 'assets',
  data: USE_TEST_DATA ? 'Data_test' : 'Data'
};

logger.info('Database Config:');
logger.info('  Host:', process.env.DB_HOST);
logger.info('  Database:', process.env.DB_NAME);
logger.info('  Test Mode:', USE_TEST_DATA ? 'ENABLED (using *_test tables)' : 'DISABLED (using production tables)');

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'simcard_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4'
});

// Promisify for async/await
const promisePool = pool.promise();

// Test connection
pool.getConnection((err, connection) => {
  if (err) {
    logger.error('Database connection failed:', err.message);
    return;
  }
  logger.info('Database connected successfully');
  connection.release();
});

module.exports = { pool, promisePool, TABLE_NAMES };
