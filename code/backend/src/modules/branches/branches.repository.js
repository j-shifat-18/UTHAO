const { query } = require('../../database/query');

const findAllBranches = async ({ limit, offset, search, city, is_active }) => {
  let sql = `
    SELECT b.id, b.name, b.code, b.city, b.state, b.address, b.phone, b.email,
           b.manager_id, b.is_active, b.opening_time, b.closing_time,
           b.created_at, b.updated_at,
           u.email as manager_email
    FROM branches b
    LEFT JOIN users u ON u.id = b.manager_id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (search) {
    sql += ` AND (b.name ILIKE $${paramIndex} OR b.code ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }
  if (city) {
    sql += ` AND b.city ILIKE $${paramIndex}`;
    params.push(`%${city}%`);
    paramIndex++;
  }
  if (is_active !== undefined) {
    sql += ` AND b.is_active = $${paramIndex}`;
    params.push(is_active);
    paramIndex++;
  }

  const countSql = sql.replace(/SELECT .+ FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await query(countSql, params);
  const totalCount = parseInt(countResult.rows[0].total, 10);

  sql += ` ORDER BY b.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return { rows: result.rows, totalCount };
};

const findBranchById = async (id) => {
  const result = await query(
    `SELECT b.id, b.name, b.code, b.city, b.state, b.address, b.phone, b.email,
            b.manager_id, b.is_active, b.opening_time, b.closing_time,
            b.created_at, b.updated_at,
            u.email as manager_email
     FROM branches b
     LEFT JOIN users u ON u.id = b.manager_id
     WHERE b.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const createBranch = async (data) => {
  const result = await query(
    `INSERT INTO branches (name, code, city, state, address, phone, email, manager_id, opening_time, closing_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      data.name, data.code, data.city, data.state, data.address,
      data.phone || null, data.email || null, data.manager_id || null,
      data.opening_time || null, data.closing_time || null,
    ]
  );
  return result.rows[0];
};

const updateBranch = async (id, data) => {
  const fields = [];
  const params = [];
  let paramIndex = 1;

  const allowed = ['name', 'code', 'city', 'state', 'address', 'phone', 'email', 'manager_id', 'is_active', 'opening_time', 'closing_time'];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${paramIndex++}`);
      params.push(data[key]);
    }
  }

  if (fields.length === 0) return null;

  params.push(id);
  const result = await query(
    `UPDATE branches SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
  );
  return result.rows[0] || null;
};

const deleteBranch = async (id) => {
  const result = await query(
    'UPDATE branches SET is_active = false WHERE id = $1 RETURNING id, name, is_active',
    [id]
  );
  return result.rows[0] || null;
};

const getBranchStats = async (id) => {
  const result = await query(
    `SELECT
       (SELECT COUNT(*) FROM employees WHERE branch_id = $1 AND is_active = true) as employee_count,
       (SELECT COUNT(*) FROM delivery_agents WHERE branch_id = $1 AND is_active = true) as agent_count,
       (SELECT COUNT(*) FROM warehouses WHERE branch_id = $1 AND is_active = true) as warehouse_count,
       (SELECT COUNT(*) FROM parcels WHERE origin_branch_id = $1 AND status NOT IN ('delivered','cancelled','returned')) as active_parcels_origin,
       (SELECT COUNT(*) FROM parcels WHERE destination_branch_id = $1 AND status NOT IN ('delivered','cancelled','returned')) as active_parcels_destination`,
    [id]
  );
  return result.rows[0];
};

module.exports = { findAllBranches, findBranchById, createBranch, updateBranch, deleteBranch, getBranchStats };
