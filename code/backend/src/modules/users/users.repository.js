const { query } = require('../../database/query');

const findAllUsers = async ({ limit, offset, search, role, is_active }) => {
  let sql = `
    SELECT u.id, u.email, u.phone, u.is_active, u.is_verified,
           u.last_login_at, u.created_at, r.name as role
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (search) {
    sql += ` AND (u.email ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (role) {
    sql += ` AND r.name = $${paramIndex}`;
    params.push(role);
    paramIndex++;
  }

  if (is_active !== undefined) {
    sql += ` AND u.is_active = $${paramIndex}`;
    params.push(is_active);
    paramIndex++;
  }

  // Count query
  const countSql = sql.replace(
    /SELECT .+ FROM/,
    'SELECT COUNT(*) as total FROM'
  );
  const countResult = await query(countSql, params);
  const totalCount = parseInt(countResult.rows[0].total, 10);

  // Data query with pagination
  sql += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return { rows: result.rows, totalCount };
};

const findUserById = async (id) => {
  const result = await query(
    `SELECT u.id, u.email, u.phone, u.is_active, u.is_verified,
            u.last_login_at, u.created_at, u.updated_at, r.name as role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const updateUser = async (id, { email, phone, is_active, role_id }) => {
  const fields = [];
  const params = [];
  let paramIndex = 1;

  if (email !== undefined) {
    fields.push(`email = $${paramIndex++}`);
    params.push(email);
  }
  if (phone !== undefined) {
    fields.push(`phone = $${paramIndex++}`);
    params.push(phone);
  }
  if (is_active !== undefined) {
    fields.push(`is_active = $${paramIndex++}`);
    params.push(is_active);
  }
  if (role_id !== undefined) {
    fields.push(`role_id = $${paramIndex++}`);
    params.push(role_id);
  }

  if (fields.length === 0) return null;

  params.push(id);
  const result = await query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, email, phone, is_active, is_verified, created_at, updated_at`,
    params
  );
  return result.rows[0] || null;
};

const deactivateUser = async (id) => {
  const result = await query(
    `UPDATE users SET is_active = false WHERE id = $1
     RETURNING id, email, is_active`,
    [id]
  );
  return result.rows[0] || null;
};

const activateUser = async (id) => {
  const result = await query(
    `UPDATE users SET is_active = true WHERE id = $1
     RETURNING id, email, is_active`,
    [id]
  );
  return result.rows[0] || null;
};

module.exports = { findAllUsers, findUserById, updateUser, deactivateUser, activateUser };
