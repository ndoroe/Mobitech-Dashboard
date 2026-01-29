const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  console.log('Testing connection with:');
  console.log('  Host:', process.env.DB_HOST);
  console.log('  User:', process.env.DB_USER);
  console.log('  Database:', process.env.DB_NAME);
  console.log('  Password length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    
    console.log('✅ Connection successful!');
    
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM assets');
    console.log('✅ Assets count:', rows[0].count);
    
    const [dataRows] = await connection.execute('SELECT COUNT(*) as count FROM Data');
    console.log('✅ Data records:', dataRows[0].count);
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('SQL State:', error.sqlState);
    process.exit(1);
  }
}

testConnection();
