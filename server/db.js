const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const databaseUrl = process.env.DATABASE_URL;
const requiresSsl = process.env.DATABASE_SSL === 'true' || /\bsslmode=require\b/i.test(databaseUrl || '');

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: requiresSsl ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: positiveInteger(process.env.DATABASE_CONNECTION_TIMEOUT_MS, 10000),
  idleTimeoutMillis: positiveInteger(process.env.DATABASE_IDLE_TIMEOUT_MS, 30000),
  max: positiveInteger(process.env.DATABASE_POOL_MAX, 10)
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params)
};
