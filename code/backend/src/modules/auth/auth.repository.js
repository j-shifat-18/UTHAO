const { query } = require('../../database/query');
const { withTransaction } = require('../../database/transaction');

const findUserByEmail = async (email) => {
  const result = await query(
    `SELECT u.id, u.email, u.password_hash, u.phone, u.role_id, u.is_active,
            u.is_verified, u.refresh_token, r.name as role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.email = $1`,
    [email]
  );
  return result.rows[0] || null;
};

const findUserById = async (id) => {
  const result = await query(
    `SELECT u.id, u.email, u.phone, u.role_id, u.is_active, u.is_verified,
            u.created_at, r.name as role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const createUserWithCustomer = async ({ email, passwordHash, phone, roleId, firstName, lastName }) => {
  return withTransaction(async (client) => {
    // Insert user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, phone, role_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, phone, role_id, is_active, is_verified, created_at`,
      [email, passwordHash, phone, roleId]
    );
    const user = userResult.rows[0];

    // Insert customer profile
    await client.query(
      `INSERT INTO customers (user_id, first_name, last_name)
       VALUES ($1, $2, $3)`,
      [user.id, firstName, lastName]
    );

    return user;
  });
};

const getRoleIdByName = async (roleName) => {
  const result = await query('SELECT id FROM roles WHERE name = $1', [roleName]);
  return result.rows[0]?.id || null;
};

const updateRefreshToken = async (userId, refreshToken) => {
  await query(
    'UPDATE users SET refresh_token = $1 WHERE id = $2',
    [refreshToken, userId]
  );
};

const updateLastLogin = async (userId) => {
  await query(
    'UPDATE users SET last_login_at = NOW() WHERE id = $1',
    [userId]
  );
};

const clearRefreshToken = async (userId) => {
  await query(
    'UPDATE users SET refresh_token = NULL WHERE id = $1',
    [userId]
  );
};

const findUserByRefreshToken = async (refreshToken) => {
  const result = await query(
    `SELECT u.id, u.email, u.role_id, u.is_active, r.name as role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.refresh_token = $1`,
    [refreshToken]
  );
  return result.rows[0] || null;
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUserWithCustomer,
  getRoleIdByName,
  updateRefreshToken,
  updateLastLogin,
  clearRefreshToken,
  findUserByRefreshToken,
};
