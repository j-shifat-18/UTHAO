const { Pool } = require('pg');
const env = require('./env');
const logger = require('./logger');

const pool = new Pool({
  connectionString: env.db.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  logger.debug('New database connection established');
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database pool error');
});

let isDbConnected = false;

// Helper to test connection on startup
const connectDB = async () => {
  if (!env.db.url) {
    logger.warn('No DATABASE_URL provided. Running in high-performance mock/in-memory mode for smooth end-user experience.');
    return false;
  }
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    isDbConnected = true;
    logger.info(`Database connected at ${result.rows[0].now}`);
    return true;
  } catch (err) {
    logger.warn({ err: err.message }, 'Database connection failed. Falling back to robust in-memory data store for backend endpoints.');
    isDbConnected = false;
    return false;
  }
};

const checkDbStatus = () => isDbConnected;

module.exports = { pool, connectDB, checkDbStatus };
