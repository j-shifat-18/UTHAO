const { Pool } = require('pg');
const env = require('./env');
const logger = require('./logger');

const pool = new Pool({
  connectionString: env.db.url,
  // Vercel serverless: each function invocation has its own process.
  // A high max causes connection exhaustion on Supabase's pooler.
  // 2 connections per invocation is safe and sufficient.
  max: process.env.VERCEL ? 2 : 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  logger.debug('New database connection established');
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database pool error');
});

// Helper to test connection on startup
const connectDB = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.info(`Database connected at ${result.rows[0].now}`);
  } catch (err) {
    logger.warn({ err: err.message }, 'Database connection failed - continuing without database connection');
  }
};

module.exports = { pool, connectDB };
