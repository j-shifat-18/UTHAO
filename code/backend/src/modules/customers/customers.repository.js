const { query } = require('../../database/query');

const findAllCustomers = async ({ limit, offset, search }) => {
  let sql = `
    SELECT c.id, c.user_id, c.first_name, c.last_name, c.date_of_birth,
           c.gender, c.profile_image_url, c.created_at, c.updated_at,
           u.email, u.phone, u.is_active
    FROM customers c
    JOIN users u ON u.id = c.user_id
    WHERE u.is_active = true
  `;
  const params = [];
  let paramIndex = 1;

  if (search) {
    sql += ` AND (c.first_name ILIKE $${paramIndex} OR c.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  // Count
  const countSql = sql.replace(/SELECT .+ FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await query(countSql, params);
  const totalCount = parseInt(countResult.rows[0].total, 10);

  // Data
  sql += ` ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return { rows: result.rows, totalCount };
};

const findCustomerById = async (id) => {
  const result = await query(
    `SELECT c.id, c.user_id, c.first_name, c.last_name, c.date_of_birth,
            c.gender, c.profile_image_url, c.created_at, c.updated_at,
            u.email, u.phone, u.is_active
     FROM customers c
     JOIN users u ON u.id = c.user_id
     WHERE c.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const findCustomerByUserId = async (userId) => {
  const result = await query(
    `SELECT c.id, c.user_id, c.first_name, c.last_name, c.date_of_birth,
            c.gender, c.profile_image_url, c.created_at, c.updated_at,
            u.email, u.phone, u.is_active
     FROM customers c
     JOIN users u ON u.id = c.user_id
     WHERE c.user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

const updateCustomer = async (id, { first_name, last_name, date_of_birth, gender, profile_image_url }) => {
  const fields = [];
  const params = [];
  let paramIndex = 1;

  if (first_name !== undefined) {
    fields.push(`first_name = $${paramIndex++}`);
    params.push(first_name);
  }
  if (last_name !== undefined) {
    fields.push(`last_name = $${paramIndex++}`);
    params.push(last_name);
  }
  if (date_of_birth !== undefined) {
    fields.push(`date_of_birth = $${paramIndex++}`);
    params.push(date_of_birth);
  }
  if (gender !== undefined) {
    fields.push(`gender = $${paramIndex++}`);
    params.push(gender);
  }
  if (profile_image_url !== undefined) {
    fields.push(`profile_image_url = $${paramIndex++}`);
    params.push(profile_image_url);
  }

  if (fields.length === 0) return null;

  params.push(id);
  const result = await query(
    `UPDATE customers SET ${fields.join(', ')} WHERE id = $${paramIndex}
     RETURNING id, user_id, first_name, last_name, date_of_birth, gender, profile_image_url, updated_at`,
    params
  );
  return result.rows[0] || null;
};

// Get customer addresses
const findCustomerAddresses = async (customerId) => {
  // Get user_id from customer
  const custResult = await query('SELECT user_id FROM customers WHERE id = $1', [customerId]);
  if (!custResult.rows[0]) return [];

  const result = await query(
    `SELECT id, label, address_line1, address_line2, city, state, postal_code,
            country, latitude, longitude, is_default, created_at
     FROM addresses
     WHERE entity_type = 'customer' AND entity_id = $1
     ORDER BY is_default DESC, created_at DESC`,
    [custResult.rows[0].user_id]
  );
  return result.rows;
};

const createAddress = async (entityId, data) => {
  const result = await query(
    `INSERT INTO addresses (entity_type, entity_id, label, address_line1, address_line2,
                            city, state, postal_code, country, latitude, longitude, is_default)
     VALUES ('customer', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      entityId, data.label || 'home', data.address_line1, data.address_line2 || null,
      data.city, data.state, data.postal_code, data.country || 'Bangladesh',
      data.latitude || null, data.longitude || null, data.is_default || false,
    ]
  );
  return result.rows[0];
};

module.exports = {
  findAllCustomers,
  findCustomerById,
  findCustomerByUserId,
  updateCustomer,
  findCustomerAddresses,
  createAddress,
};
