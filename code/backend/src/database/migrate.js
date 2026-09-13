const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const logger = require('../config/logger');

const migrate = async () => {
  const migrationsDir = path.resolve(__dirname, '../sql/migrations');

  // Files are applied in order.
  // complete_schema.sql: wrapped in BEGIN...COMMIT, uses IF NOT EXISTS — safe to
  //   re-run on a fresh DB; will error on an existing DB if duplicate constraints
  //   exist, which is expected and acceptable (use module10_views_functions.sql
  //   to update an existing DB).
  // module10_views_functions.sql: CREATE OR REPLACE — safe to re-run at any time.
  const files = [
    'complete_schema.sql',
    'module10_views_functions.sql',
  ];

  for (const file of files) {
    const filePath = path.resolve(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    try {
      await pool.query(sql);
      logger.info(`Migration applied: ${file}`);
    } catch (err) {
      logger.error({ err }, `Migration failed: ${file}`);
      process.exit(1);
    }
  }

  logger.info('All migrations completed successfully');
  await pool.end();
};

migrate();
