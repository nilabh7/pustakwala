const { Pool } = require('pg');
const logger = require('../utils/logger');

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const useConnectionString = !!process.env.DATABASE_URL;
const sslEnabled = parseBoolean(process.env.DB_SSL, process.env.NODE_ENV === 'production');
const sslRejectUnauthorized = parseBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, false);

const pool = new Pool({
  ...(useConnectionString ? { connectionString: process.env.DATABASE_URL } : {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'pustakwala',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  }),
  min: parseInt(process.env.DB_POOL_MIN) || 2,
  max: parseInt(process.env.DB_POOL_MAX) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: sslEnabled ? { rejectUnauthorized: sslRejectUnauthorized } : false,
});

pool.on('error', (err) => {
  logger.error('Unexpected DB pool error', err);
});

// Helper: run a query
const query = (text, params) => pool.query(text, params);

// Helper: get a client for transactions
const getClient = () => pool.connect();

// Helper: run queries in a transaction
const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, query, getClient, withTransaction };
