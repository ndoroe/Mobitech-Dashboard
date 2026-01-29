const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');

// Debug: Check .env file existence and path
const envPath = path.join(__dirname, '../../.env');
console.log('🔍 Looking for .env at:', envPath);
console.log('🔍 .env exists:', fs.existsSync(envPath));

// Debug: Read the actual file content
const envContent = fs.readFileSync(envPath, 'utf8');
console.log('🔍 Raw .env file content:');
console.log('---START---');
console.log(envContent);
console.log('---END---');
console.log('🔍 Contains USE_TEST_DATA:', envContent.includes('USE_TEST_DATA'));

require('dotenv').config({ path: envPath });

// Debug: Print all env vars
console.log('🔍 All relevant env vars:', {
  USE_TEST_DATA: process.env.USE_TEST_DATA,
  DB_HOST: process.env.DB_HOST,
  DB_NAME: process.env.DB_NAME
});

// Table name configuration based on test mode
console.log('🔍 DEBUG - USE_TEST_DATA env value:', process.env.USE_TEST_DATA, 'Type:', typeof process.env.USE_TEST_DATA);
const USE_TEST_DATA = process.env.USE_TEST_DATA === 'true';
const TABLE_NAMES = {
  assets: USE_TEST_DATA ? 'assets_test' : 'assets',
  data: USE_TEST_DATA ? 'Data_test' : 'Data'
};

console.log('🔍 Database Config:');
console.log('  Host:', process.env.DB_HOST);
console.log('  Port:', process.env.DB_PORT);
console.log('  User:', process.env.DB_USER);
console.log('  Database:', process.env.DB_NAME);
console.log('  Password length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);
console.log('  Test Mode:', USE_TEST_DATA ? '✅ ENABLED (using *_test tables)' : '❌ DISABLED (using production tables)');
console.log('  Tables:', TABLE_NAMES);

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
    console.error('❌ Database connection failed:', err.message);
    return;
  }
  console.log('✅ Database connected successfully');
  connection.release();
});

module.exports = { pool, promisePool, TABLE_NAMES };
