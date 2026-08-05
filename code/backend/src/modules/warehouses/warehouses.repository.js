const { query } = require('../../database/query');
const { withTransaction } = require('../../database/transaction');

const findAllWarehouses = async ({ limit, offset, search, city, branch_id, is_active }) => {
  let sql = `
    SELECT w.id, w.name, w.code, w.branch_id, w.city, w.address,
           w.total_capacity, w.current_occupancy, w.is_active,
           w.created_at, w.updated_at,
           b.name as branch_name, b.code as branch_code
    FROM warehouses w
    LEFT JOIN branches b ON b.id = w.branch_id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (search) {
    sql += ` AND (w.name ILIKE $${paramIndex} OR w.code ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }
  if (city) {
    sql += ` AND w.city ILIKE $${paramIndex}`;
    params.push(`%${city}%`);
    paramIndex++;
  }
  if (branch_id) {
    sql += ` AND w.branch_id = $${paramIndex}`;
    params.push(branch_id);
    paramIndex++;
  }
  if (is_active !== undefined) {
    sql += ` AND w.is_active = $${paramIndex}`;
    params.push(is_active);
    paramIndex++;
  }

  const countSql = sql.replace(/SELECT .+ FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await query(countSql, params);
  const totalCount = parseInt(countResult.rows[0].total, 10);

  sql += ` ORDER BY w.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return { rows: result.rows, totalCount };
};

const findWarehouseById = async (id) => {
  const result = await query(
    `SELECT w.id, w.name, w.code, w.branch_id, w.city, w.address,
            w.total_capacity, w.current_occupancy, w.is_active,
            w.created_at, w.updated_at,
            b.name as branch_name, b.code as branch_code
     FROM warehouses w
     LEFT JOIN branches b ON b.id = w.branch_id
     WHERE w.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const createWarehouse = async (data) => {
  const result = await query(
    `INSERT INTO warehouses (name, code, branch_id, city, address, total_capacity)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.name, data.code, data.branch_id || null, data.city, data.address, data.total_capacity]
  );
  return result.rows[0];
};

const updateWarehouse = async (id, data) => {
  const fields = [];
  const params = [];
  let paramIndex = 1;

  const allowed = ['name', 'code', 'branch_id', 'city', 'address', 'total_capacity', 'is_active'];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${paramIndex++}`);
      params.push(data[key]);
    }
  }

  if (fields.length === 0) return null;

  params.push(id);
  const result = await query(
    `UPDATE warehouses SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
  );
  return result.rows[0] || null;
};

const deactivateWarehouse = async (id) => {
  const result = await query(
    'UPDATE warehouses SET is_active = false WHERE id = $1 RETURNING id, name, is_active',
    [id]
  );
  return result.rows[0] || null;
};

const getWarehouseOccupancy = async (id) => {
  const result = await query(
    `SELECT w.id, w.name, w.code, w.total_capacity, w.current_occupancy,
            (w.total_capacity - w.current_occupancy) as available_space,
            ROUND((w.current_occupancy::numeric / w.total_capacity) * 100, 2) as occupancy_percentage
     FROM warehouses w
     WHERE w.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

// Increment occupancy inside a transaction (for parcel arrival)
const incrementOccupancy = async (client, warehouseId) => {
  const result = await client.query(
    `UPDATE warehouses
     SET current_occupancy = current_occupancy + 1
     WHERE id = $1 AND current_occupancy < total_capacity
     RETURNING id, current_occupancy, total_capacity`,
    [warehouseId]
  );
  return result.rows[0] || null;
};

// Decrement occupancy inside a transaction (for parcel departure)
const decrementOccupancy = async (client, warehouseId) => {
  const result = await client.query(
    `UPDATE warehouses
     SET current_occupancy = current_occupancy - 1
     WHERE id = $1 AND current_occupancy > 0
     RETURNING id, current_occupancy, total_capacity`,
    [warehouseId]
  );
  return result.rows[0] || null;
};

// Transfer parcel between warehouses (used in warehouse_transfers)
const initiateTransfer = async ({ parcel_id, from_warehouse_id, to_warehouse_id, initiated_by }) => {
  return withTransaction(async (client) => {
    // Check destination has space
    const destCheck = await client.query(
      'SELECT id, current_occupancy, total_capacity FROM warehouses WHERE id = $1 FOR UPDATE',
      [to_warehouse_id]
    );
    const dest = destCheck.rows[0];
    if (!dest) throw new Error('Destination warehouse not found');
    if (dest.current_occupancy >= dest.total_capacity) {
      throw new Error('Destination warehouse is at full capacity');
    }

    // Create transfer record
    const transferResult = await client.query(
      `INSERT INTO warehouse_transfers (parcel_id, from_warehouse_id, to_warehouse_id, initiated_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [parcel_id, from_warehouse_id, to_warehouse_id, initiated_by]
    );

    return transferResult.rows[0];
  });
};

const completeTransfer = async (transferId) => {
  return withTransaction(async (client) => {
    // Get transfer details and lock
    const transferResult = await client.query(
      'SELECT * FROM warehouse_transfers WHERE id = $1 AND status = $2 FOR UPDATE',
      [transferId, 'pending']
    );
    const transfer = transferResult.rows[0];
    if (!transfer) throw new Error('Transfer not found or not in pending status');

    // Decrement source occupancy
    await client.query(
      `UPDATE warehouses SET current_occupancy = current_occupancy - 1
       WHERE id = $1 AND current_occupancy > 0`,
      [transfer.from_warehouse_id]
    );

    // Increment destination occupancy
    const destResult = await client.query(
      `UPDATE warehouses SET current_occupancy = current_occupancy + 1
       WHERE id = $1 AND current_occupancy < total_capacity
       RETURNING id`,
      [transfer.to_warehouse_id]
    );
    if (!destResult.rows[0]) throw new Error('Destination warehouse is full');

    // Update transfer status
    await client.query(
      `UPDATE warehouse_transfers SET status = 'completed', completed_at = NOW()
       WHERE id = $1`,
      [transferId]
    );

    // Update parcel's current warehouse
    await client.query(
      'UPDATE parcels SET current_warehouse_id = $1 WHERE id = $2',
      [transfer.to_warehouse_id, transfer.parcel_id]
    );

    return { ...transfer, status: 'completed' };
  });
};

module.exports = {
  findAllWarehouses, findWarehouseById, createWarehouse, updateWarehouse,
  deactivateWarehouse, getWarehouseOccupancy, incrementOccupancy,
  decrementOccupancy, initiateTransfer, completeTransfer,
};
