// Applies only the Module 10 reporting views and stored functions.
// Use this against an EXISTING database where complete_schema.sql has
// already been run. All statements use CREATE OR REPLACE — safe to re-run.
//
// Usage:
//   node src/database/migrate-reports.js
//   npm run migrate:reports

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const logger = require('../config/logger');

const run = async () => {
  const filePath = path.resolve(
    __dirname,
    '../sql/migrations/module10_views_functions.sql'
  );
  const sql = fs.readFileSync(filePath, 'utf-8');

  try {
    await pool.query(sql);
    logger.info('Module 10 views and functions applied successfully');
  } catch (err) {
    logger.error({ err }, 'Failed to apply module 10 views/functions');
    process.exit(1);
  } finally {
    await pool.end();
  }
};

run();
