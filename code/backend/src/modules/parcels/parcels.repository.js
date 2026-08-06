const { query } = require('../../database/query');
const { withTransaction } = require('../../database/transaction');

const findAllParcels = async ({ limit, offset, status, priority, city, customer_id, search, date_from, date_to }) => {
  let sql = `
    SELECT p.id, p.tracking_number, p.receiver_name, p.receiver_phone,
           p.delivery_city, p.delivery_state, p.status, p.priority,
           p.weight_kg, p.delivery_cost, p.payment_method, p.is_paid,
           p.estimated_delivery_date, p.actual_delivery_date, p.created_at,
           c.first_name as sender_first_name, c.last_name as sender_last_name,
           ub.email as sender_email,
           ob.name as origin_branch_name, ob.code as origin_branch_code,
           db.name as destination_branch_name, db.code as destination_branch_code,
           cat.name as category_name
    FROM parcels p
    JOIN customers c ON c.id = p.sender_customer_id
    JOIN users ub ON ub.id = c.user_id
    LEFT JOIN branches ob ON ob.id = p.origin_branch_id
    LEFT JOIN branches db ON db.id = p.destination_branch_id
    JOIN parcel_categories cat ON cat.id = p.category_id
    WHERE 1=1
  `;
  const params = [];
  let i = 1;

  if (status) { sql += ` AND p.status = $${i++}`; params.push(status); }
  if (priority) { sql += ` AND p.priority = $${i++}`; params.push(priority); }
  if (city) { sql += ` AND p.delivery_city ILIKE $${i++}`; params.push(`%${city}%`); }
  if (customer_id) { sql += ` AND p.sender_customer_id = $${i++}`; params.push(customer_id); }
  if (search) {
    sql += ` AND (p.tracking_number ILIKE $${i} OR p.receiver_name ILIKE $${i} OR p.receiver_phone ILIKE $${i})`;
    params.push(`%${search}%`);
    i++;
  }
  if (date_from) { sql += ` AND p.created_at >= $${i++}`; params.push(date_from); }
  if (date_to) { sql += ` AND p.created_at <= $${i++}`; params.push(date_to); }

  const countSql = sql.replace(
    /SELECT .+? FROM parcels/s,
    'SELECT COUNT(*) as total FROM parcels'
  );
  const countResult = await query(countSql, params);
  const totalCount = parseInt(countResult.rows[0].total, 10);

  sql += ` ORDER BY p.created_at DESC LIMIT $${i} OFFSET $${i + 1}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return { rows: result.rows, totalCount };
};

const findParcelById = async (id) => {
  const result = await query(
    `SELECT p.*,
            c.first_name as sender_first_name, c.last_name as sender_last_name,
            ub.email as sender_email, ub.phone as sender_phone,
            ob.name as origin_branch_name, ob.code as origin_branch_code,
            db.name as destination_branch_name, db.code as destination_branch_code,
            w.name as current_warehouse_name, w.code as current_warehouse_code,
            cat.name as category_name, cat.base_price, cat.price_per_kg
     FROM parcels p
     JOIN customers c ON c.id = p.sender_customer_id
     JOIN users ub ON ub.id = c.user_id
     LEFT JOIN branches ob ON ob.id = p.origin_branch_id
     LEFT JOIN branches db ON db.id = p.destination_branch_id
     LEFT JOIN warehouses w ON w.id = p.current_warehouse_id
     JOIN parcel_categories cat ON cat.id = p.category_id
     WHERE p.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

const findParcelByTrackingNumber = async (trackingNumber) => {
  const result = await query(
    `SELECT p.id, p.tracking_number, p.receiver_name, p.receiver_phone,
            p.delivery_address_line1, p.delivery_city, p.delivery_state,
            p.status, p.priority, p.weight_kg, p.delivery_cost,
            p.payment_method, p.is_paid, p.is_fragile,
            p.estimated_delivery_date, p.actual_delivery_date, p.created_at,
            c.first_name as sender_first_name, c.last_name as sender_last_name,
            ob.name as origin_branch_name,
            db.name as destination_branch_name,
            w.name as current_warehouse_name,
            cat.name as category_name
     FROM parcels p
     JOIN customers c ON c.id = p.sender_customer_id
     LEFT JOIN branches ob ON ob.id = p.origin_branch_id
     LEFT JOIN branches db ON db.id = p.destination_branch_id
     LEFT JOIN warehouses w ON w.id = p.current_warehouse_id
     JOIN parcel_categories cat ON cat.id = p.category_id
     WHERE p.tracking_number = $1`,
    [trackingNumber]
  );
  return result.rows[0] || null;
};

// Create parcel + first status history entry in a transaction
const createParcel = async (parcelData) => {
  return withTransaction(async (client) => {
    const result = await client.query(
      `INSERT INTO parcels (
         tracking_number, sender_customer_id, receiver_name, receiver_phone, receiver_email,
         pickup_address_id, delivery_address_line1, delivery_address_line2,
         delivery_city, delivery_state, delivery_postal_code,
         origin_branch_id, destination_branch_id, category_id,
         weight_kg, dimensions_cm, description, status, priority,
         is_fragile, delivery_instructions, estimated_delivery_date,
         delivery_cost, payment_method
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
       RETURNING *`,
      [
        parcelData.tracking_number, parcelData.sender_customer_id,
        parcelData.receiver_name, parcelData.receiver_phone, parcelData.receiver_email || null,
        parcelData.pickup_address_id || null,
        parcelData.delivery_address_line1, parcelData.delivery_address_line2 || null,
        parcelData.delivery_city, parcelData.delivery_state, parcelData.delivery_postal_code,
        parcelData.origin_branch_id || null, parcelData.destination_branch_id || null,
        parcelData.category_id, parcelData.weight_kg, parcelData.dimensions_cm || null,
        parcelData.description || null, 'booked', parcelData.priority || 'standard',
        parcelData.is_fragile || false, parcelData.delivery_instructions || null,
        parcelData.estimated_delivery_date || null,
        parcelData.delivery_cost, parcelData.payment_method || 'prepaid',
      ]
    );

    const parcel = result.rows[0];

    // Insert initial status history
    await client.query(
      `INSERT INTO parcel_status_history (parcel_id, status, location, notes, changed_by)
       VALUES ($1, 'booked', $2, 'Parcel booking confirmed', $3)`,
      [parcel.id, parcelData.origin_branch_name || null, parcelData.created_by || null]
    );

    return parcel;
  });
};

// Update parcel status + append to history
const updateParcelStatus = async ({ parcel_id, status, location, notes, changed_by }) => {
  return withTransaction(async (client) => {
    const result = await client.query(
      `UPDATE parcels SET status = $1,
         actual_delivery_date = CASE WHEN $2 = 'delivered' THEN NOW() ELSE actual_delivery_date END,
         cancelled_at = CASE WHEN $3 = 'cancelled' THEN NOW() ELSE cancelled_at END
       WHERE id = $4
       RETURNING id, tracking_number, status`,
      [status, status, status, parcel_id]
    );

    if (!result.rows[0]) return null;

    await client.query(
      `INSERT INTO parcel_status_history (parcel_id, status, location, notes, changed_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [parcel_id, status, location || null, notes || null, changed_by || null]
    );

    return result.rows[0];
  });
};

const updateParcel = async (id, data) => {
  const fields = [];
  const params = [];
  let i = 1;

  const allowed = [
    'receiver_name', 'receiver_phone', 'receiver_email',
    'delivery_address_line1', 'delivery_address_line2',
    'delivery_city', 'delivery_state', 'delivery_postal_code',
    'destination_branch_id', 'description', 'delivery_instructions',
    'estimated_delivery_date', 'is_fragile', 'cancellation_reason',
  ];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${i++}`);
      params.push(data[key]);
    }
  }

  if (fields.length === 0) return null;
  params.push(id);

  const result = await query(
    `UPDATE parcels SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    params
  );
  return result.rows[0] || null;
};

const cancelParcel = async ({ parcel_id, reason, cancelled_by }) => {
  return withTransaction(async (client) => {
    const result = await client.query(
      `UPDATE parcels
       SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = $1
       WHERE id = $2 AND status NOT IN ('delivered', 'cancelled', 'returned')
       RETURNING id, tracking_number, status`,
      [reason || 'Cancelled by customer', parcel_id]
    );

    if (!result.rows[0]) return null;

    await client.query(
      `INSERT INTO parcel_status_history (parcel_id, status, notes, changed_by)
       VALUES ($1, 'cancelled', $2, $3)`,
      [parcel_id, reason || 'Cancelled by customer', cancelled_by || null]
    );

    return result.rows[0];
  });
};

const getParcelTrackingHistory = async (parcelId) => {
  const result = await query(
    `SELECT psh.id, psh.status, psh.location, psh.notes, psh.created_at,
            u.email as changed_by_email
     FROM parcel_status_history psh
     LEFT JOIN users u ON u.id = psh.changed_by
     WHERE psh.parcel_id = $1
     ORDER BY psh.created_at ASC`,
    [parcelId]
  );
  return result.rows;
};

const getMyParcels = async ({ customer_id, limit, offset, status }) => {
  let sql = `
    SELECT p.id, p.tracking_number, p.receiver_name, p.delivery_city,
           p.status, p.priority, p.weight_kg, p.delivery_cost,
           p.payment_method, p.is_paid, p.estimated_delivery_date, p.created_at,
           cat.name as category_name
    FROM parcels p
    JOIN parcel_categories cat ON cat.id = p.category_id
    WHERE p.sender_customer_id = $1
  `;
  const params = [customer_id];
  let i = 2;

  if (status) { sql += ` AND p.status = $${i++}`; params.push(status); }

  const countSql = sql.replace(/SELECT .+? FROM parcels/s, 'SELECT COUNT(*) as total FROM parcels');
  const countResult = await query(countSql, params);
  const totalCount = parseInt(countResult.rows[0].total, 10);

  sql += ` ORDER BY p.created_at DESC LIMIT $${i} OFFSET $${i + 1}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return { rows: result.rows, totalCount };
};

module.exports = {
  findAllParcels, findParcelById, findParcelByTrackingNumber,
  createParcel, updateParcelStatus, updateParcel, cancelParcel,
  getParcelTrackingHistory, getMyParcels,
};
