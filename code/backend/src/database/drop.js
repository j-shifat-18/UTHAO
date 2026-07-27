const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const logger = require('../config/logger');

const drop = async () => {
  const dropPath = path.resolve(__dirname, '../sql/migrations/drop_all.sql');
  const sql = fs.readFileSync(dropPath, 'utf-8');

  try {
    await pool.query(sql);
    logger.info('All tables dropped successfully');
  } catch (err) {
    logger.error({ err }, 'Drop failed');
    process.exit(1);
  } finally {
    await pool.end();
  }
};

drop();
