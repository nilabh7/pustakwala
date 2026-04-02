require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'pustakwala',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
  });

  const sqlPath = path.resolve(__dirname, '../../../database/001_init_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    await client.connect();
    await client.query(sql);
    console.log(`Migration completed: ${sqlPath}`);
  } finally {
    await client.end().catch(() => {});
  }
}

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
