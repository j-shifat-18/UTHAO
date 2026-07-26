const { pool } = require('../config/db');

// Single query helper
const query = (text, params) => {
  return pool.query(text, params);
};

// Get a client from pool (for transactions)
const getClient = () => {
  return pool.connect();
};

module.exports = { query, getClient };
