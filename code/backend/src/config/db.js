const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: isProduction ? 3 : 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

// Used locally to verify connection on startup
const connectDB = async () => {
  const client = await pool.connect();
  const result = await client.query('SELECT NOW()');
  client.release();
  console.log('Database connected at', result.rows[0].now);
};

module.exports = { pool, connectDB };
