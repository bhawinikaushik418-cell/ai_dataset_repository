const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ai_dataset_repository',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  decimalNumbers: true
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[Database] Connected successfully to MySQL database "${process.env.DB_NAME}" on ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('[Database] Connection failed:', error.message);
    throw error;
  }
}

module.exports = {
  pool,
  testConnection
};
