const { query } = require('../../database/query');
const { withTransaction } = require('../../database/transaction');

// ─── Payments ─────────────────────────────────────────────────────────────────

/**
 * List payments using the v_payment_summary view with optional filters.
 */
const findAllPayments = async ({
  limit, offset, status, customer_id, parcel_id,
  payment_method_id, date_from, date_to,
}) => {
  let sql = `SELECT * FROM v_payment_summary WHERE 1=1`;
  const params = [];
  let i = 1;

  if (status)            { sql += ` AND status = $${i++}`;             params.push(status); }
  if (customer_id)       { sql += ` AND customer_id = $${i++}`;        params.push(customer_id); }
  if (parcel_id)         { sql += ` AND parcel_id = $${i++}`;          params.push(parcel_id); }
  if (payment_method_id) { sql += ` AND payment_method_id = $${i++}`;  params.push(payment_method_id); }
  if (date_from)         { sql += ` AND created_at >= $${i++}`;        params.push(date_from); }
  if (date_to)           { sql += ` AND created_at <= $${i++}`;        params.push(date_to); }

  // Count before adding LIMIT/OFFSET
  const countSql = `SELECT COUNT(*) AS total FROM v_payment_summary WHERE 1=1`
    + (status            ? ` AND status = '${status}'` : '')
    + (customer_id       ? ` AND customer_id = '${customer_id}'` : '')
    + (parcel_id         ? ` AND parcel_id = '${parcel_id}'` : '')
    + (payment_method_id ? ` AND payment_method_id = ${payment_method_id}` : '')
    + (date_from         ? ` AND created_at >= '${date_from}'` : '')
    + (date_to           ? ` AND created_at <= '${date_to}'` : '');

  const countResult = await query(countSql, []);
  const totalCount  = parseInt(countResult.rows[0].total, 10);

  sql += ` ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return { rows: result.rows, totalCount };
};

/**
 * Find a single payment by its UUID (uses the enriched view).
 */
const findPaymentById = async (id) => {
  const result = await query(
    `SELECT * FROM v_payment_summary WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Find all payments made by a specific customer (their payment history).
 */
const findPaymentsByCustomerId = async ({ customerId, limit, offset, status }) => {
  let sql    = `SELECT * FROM v_payment_summary WHERE customer_id = $1`;
  const params = [customerId];
  let i = 2;

  if (status) { sql += ` AND status = $${i++}`; params.push(status); }

  const countResult = await query(
    `SELECT COUNT(*) AS total FROM v_payment_summary WHERE customer_id = $1`
      + (status ? ` AND status = '${status}'` : ''),
    [customerId]
  );
  const totalCount = parseInt(countResult.rows[0].total, 10);

  sql += ` ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return { rows: result.rows, totalCount };
};

/**
 * Find a payment by parcel ID (a parcel should have at most one completed payment).
 */
const findPaymentByParcelId = async (parcelId) => {
  const result = await query(
    `SELECT * FROM v_payment_summary WHERE parcel_id = $1 ORDER BY created_at DESC`,
    [parcelId]
  );
  return result.rows;
};

/**
 * Create a new payment record inside a transaction.
 * Validates the parcel isn't already paid before inserting.
 */
const createPayment = async ({ parcel_id, customer_id, amount, payment_method_id, transaction_id, notes }) => {
  return withTransaction(async (client) => {
    // Lock the parcel row to prevent double-payment races
    const parcelRow = await client.query(
      `SELECT id, delivery_cost, is_paid, status FROM parcels WHERE id = $1 FOR UPDATE`,
      [parcel_id]
    );
    if (!parcelRow.rows[0])        throw new Error('PARCEL_NOT_FOUND');
    if (parcelRow.rows[0].is_paid) throw new Error('ALREADY_PAID');

    // Check for an existing pending/completed payment for this parcel
    const existing = await client.query(
      `SELECT id, status FROM payments
       WHERE parcel_id = $1 AND status IN ('pending', 'completed')`,
      [parcel_id]
    );
    if (existing.rows.length > 0) throw new Error('PAYMENT_EXISTS');

    const result = await client.query(
      `INSERT INTO payments
         (parcel_id, customer_id, amount, payment_method_id, transaction_id, status, notes)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)
       RETURNING *`,
      [parcel_id, customer_id, amount, payment_method_id, transaction_id || null, notes || null]
    );
    return result.rows[0];
  });
};

/**
 * Verify (complete) a payment.
 * The trigger fn_on_payment_completed fires and:
 *   - stamps paid_at
 *   - marks parcel.is_paid = true
 *   - auto-generates an invoice
 */
const verifyPayment = async ({ payment_id, transaction_id }) => {
  return withTransaction(async (client) => {
    // Lock payment row
    const existing = await client.query(
      `SELECT id, status FROM payments WHERE id = $1 FOR UPDATE`,
      [payment_id]
    );
    if (!existing.rows[0])                   throw new Error('PAYMENT_NOT_FOUND');
    if (existing.rows[0].status !== 'pending') throw new Error('NOT_PENDING');

    const result = await client.query(
      `UPDATE payments
       SET status = 'completed',
           transaction_id = COALESCE($1, transaction_id)
       WHERE id = $2
       RETURNING *`,
      [transaction_id || null, payment_id]
    );
    // Trigger fires here (BEFORE UPDATE), invoice + parcel update happen automatically
    return result.rows[0];
  });
};

/**
 * Refund a payment: status → 'refunded'.
 * The trigger reverses parcel.is_paid and cancels the invoice.
 */
const refundPayment = async ({ payment_id, notes }) => {
  return withTransaction(async (client) => {
    const existing = await client.query(
      `SELECT id, status FROM payments WHERE id = $1 FOR UPDATE`,
      [payment_id]
    );
    if (!existing.rows[0])                      throw new Error('PAYMENT_NOT_FOUND');
    if (existing.rows[0].status !== 'completed') throw new Error('NOT_COMPLETED');

    const result = await client.query(
      `UPDATE payments
       SET status = 'refunded', notes = COALESCE($1, notes)
       WHERE id = $2
       RETURNING *`,
      [notes || null, payment_id]
    );
    return result.rows[0];
  });
};

/**
 * Mark a pending payment as failed.
 */
const failPayment = async (payment_id) => {
  const result = await query(
    `UPDATE payments SET status = 'failed'
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [payment_id]
  );
  return result.rows[0] || null;
};

// ─── Invoices ─────────────────────────────────────────────────────────────────

/**
 * List invoices with optional filters.
 */
const findAllInvoices = async ({ limit, offset, status, customer_id, date_from, date_to }) => {
  let sql = `
    SELECT inv.*, pay.parcel_id, pay.transaction_id,
           p.tracking_number,
           c.first_name AS customer_first_name, c.last_name AS customer_last_name,
           u.email AS customer_email
    FROM invoices inv
    JOIN payments pay ON pay.id = inv.payment_id
    JOIN parcels  p   ON p.id  = pay.parcel_id
    JOIN customers c  ON c.id  = inv.customer_id
    JOIN users     u  ON u.id  = c.user_id
    WHERE 1=1
  `;
  const params = [];
  let i = 1;

  if (status)      { sql += ` AND inv.status = $${i++}`;        params.push(status); }
  if (customer_id) { sql += ` AND inv.customer_id = $${i++}`;   params.push(customer_id); }
  if (date_from)   { sql += ` AND inv.issued_at >= $${i++}`;    params.push(date_from); }
  if (date_to)     { sql += ` AND inv.issued_at <= $${i++}`;    params.push(date_to); }

  const countSql = `SELECT COUNT(*) AS total FROM invoices inv WHERE 1=1`
    + (status      ? ` AND status = '${status}'` : '')
    + (customer_id ? ` AND customer_id = '${customer_id}'` : '')
    + (date_from   ? ` AND issued_at >= '${date_from}'` : '')
    + (date_to     ? ` AND issued_at <= '${date_to}'` : '');

  const countResult = await query(countSql, []);
  const totalCount  = parseInt(countResult.rows[0].total, 10);

  sql += ` ORDER BY inv.issued_at DESC LIMIT $${i} OFFSET $${i + 1}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return { rows: result.rows, totalCount };
};

/**
 * Find an invoice by its id.
 */
const findInvoiceById = async (id) => {
  const result = await query(
    `SELECT inv.*, pay.parcel_id, pay.transaction_id, pay.amount AS payment_amount,
            p.tracking_number, p.delivery_cost, p.receiver_name,
            p.delivery_city, p.delivery_state,
            c.first_name AS customer_first_name, c.last_name AS customer_last_name,
            u.email AS customer_email, u.phone AS customer_phone
     FROM invoices inv
     JOIN payments pay ON pay.id = inv.payment_id
     JOIN parcels  p   ON p.id  = pay.parcel_id
     JOIN customers c  ON c.id  = inv.customer_id
     JOIN users     u  ON u.id  = c.user_id
     WHERE inv.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Find an invoice by payment id.
 */
const findInvoiceByPaymentId = async (paymentId) => {
  const result = await query(
    `SELECT * FROM invoices WHERE payment_id = $1`,
    [paymentId]
  );
  return result.rows[0] || null;
};

// ─── Revenue ──────────────────────────────────────────────────────────────────

/**
 * Call the PostgreSQL get_revenue_summary function.
 */
const getRevenueSummary = async (dateFrom, dateTo) => {
  const result = await query(
    `SELECT * FROM get_revenue_summary($1::DATE, $2::DATE)`,
    [dateFrom, dateTo]
  );
  return result.rows[0];
};

/**
 * Revenue breakdown grouped by day — useful for charts.
 */
const getRevenueByDay = async (dateFrom, dateTo) => {
  const result = await query(
    `SELECT
       DATE_TRUNC('day', paid_at)::DATE AS date,
       COUNT(*) AS payment_count,
       SUM(amount) AS revenue
     FROM payments
     WHERE status = 'completed'
       AND paid_at::DATE BETWEEN $1 AND $2
     GROUP BY 1
     ORDER BY 1 ASC`,
    [dateFrom, dateTo]
  );
  return result.rows;
};

/**
 * Revenue breakdown grouped by payment method.
 */
const getRevenueByMethod = async (dateFrom, dateTo) => {
  const result = await query(
    `SELECT
       pm.name AS payment_method,
       COUNT(pay.id) AS payment_count,
       SUM(pay.amount) AS revenue
     FROM payments pay
     JOIN payment_methods pm ON pm.id = pay.payment_method_id
     WHERE pay.status = 'completed'
       AND pay.paid_at::DATE BETWEEN $1 AND $2
     GROUP BY pm.name
     ORDER BY revenue DESC`,
    [dateFrom, dateTo]
  );
  return result.rows;
};

// ─── Payment methods lookup ───────────────────────────────────────────────────

const findAllPaymentMethods = async () => {
  const result = await query(
    `SELECT id, name FROM payment_methods WHERE is_active = true ORDER BY name`,
    []
  );
  return result.rows;
};

module.exports = {
  findAllPayments,
  findPaymentById,
  findPaymentsByCustomerId,
  findPaymentByParcelId,
  createPayment,
  verifyPayment,
  refundPayment,
  failPayment,
  findAllInvoices,
  findInvoiceById,
  findInvoiceByPaymentId,
  getRevenueSummary,
  getRevenueByDay,
  getRevenueByMethod,
  findAllPaymentMethods,
};
