require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

async function run() {
  const useConnectionString = !!process.env.DATABASE_URL;
  const sslEnabled = parseBoolean(process.env.DB_SSL, process.env.NODE_ENV === 'production');
  const sslRejectUnauthorized = parseBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, false);
  const client = new Client({
    ...(useConnectionString ? { connectionString: process.env.DATABASE_URL } : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      database: process.env.DB_NAME || 'pustakwala',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    }),
    ssl: sslEnabled ? { rejectUnauthorized: sslRejectUnauthorized } : false,
  });

  const sqlPath = path.resolve(__dirname, '../../../database/002_seed.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    await client.connect();
    await client.query(sql);
    console.log(`Seed completed: ${sqlPath}`);
  } finally {
    await client.end().catch(() => {});
  }
}

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
