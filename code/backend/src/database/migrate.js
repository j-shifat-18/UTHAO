const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const logger = require('../config/logger');

const migrate = async () => {
  const migrationPath = path.resolve(__dirname, '../sql/migrations/complete_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  try {
    await pool.query(sql);
    logger.info('Migration completed successfully');
  } catch (err) {
    logger.error({ err }, 'Migration failed');
    process.exit(1);
  } finally {
    await pool.end();
  }
};

migrate();
