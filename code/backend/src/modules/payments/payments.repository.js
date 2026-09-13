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
  let countSql = `SELECT COUNT(*) AS total FROM v_payment_summary WHERE 1=1`;
  const countParams = [];
  let ci = 1;

  if (status)            { countSql += ` AND status = $${ci++}`;            countParams.push(status); }
  if (customer_id)       { countSql += ` AND customer_id = $${ci++}`;       countParams.push(customer_id); }
  if (parcel_id)         { countSql += ` AND parcel_id = $${ci++}`;         countParams.push(parcel_id); }
  if (payment_method_id) { countSql += ` AND payment_method_id = $${ci++}`; countParams.push(payment_method_id); }
  if (date_from)         { countSql += ` AND created_at >= $${ci++}`;       countParams.push(date_from); }
  if (date_to)           { countSql += ` AND created_at <= $${ci++}`;       countParams.push(date_to); }

  const countResult = await query(countSql, countParams);
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

  let countSql = `SELECT COUNT(*) AS total FROM v_payment_summary WHERE customer_id = $1`;
  const countParams = [customerId];
  if (status) {
    countSql += ` AND status = $2`;
    countParams.push(status);
  }

  const countResult = await query(countSql, countParams);
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
const createPayment = async ({ parcel_id, customer_id, amount, payment_method_id, transaction_id, notes, status = 'pending' }) => {
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

    const insertResult = await client.query(
      `INSERT INTO payments
         (parcel_id, customer_id, amount, payment_method_id, transaction_id, status, notes)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)
       RETURNING *`,
      [parcel_id, customer_id, amount, payment_method_id, transaction_id || null, notes || null]
    );
    const createdPayment = insertResult.rows[0];

    // If status is 'completed' (for prepaid/online checkout like card, bkash, nagad),
    // update status to 'completed', mark parcel is_paid = true, and create invoice
    if (status === 'completed') {
      const updateResult = await client.query(
        `UPDATE payments
         SET status = 'completed',
             paid_at = NOW(),
             transaction_id = COALESCE($1, transaction_id)
         WHERE id = $2
         RETURNING *`,
        [transaction_id || null, createdPayment.id]
      );

      // Ensure parcel is marked as paid
      await client.query(
        `UPDATE parcels SET is_paid = true, updated_at = NOW() WHERE id = $1`,
        [parcel_id]
      );

      // Explicitly insert / upsert invoice
      const invoiceNum = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${createdPayment.id.substring(0, 8).toUpperCase()}`;
      await client.query(
        `INSERT INTO invoices (
           invoice_number, payment_id, customer_id,
           amount, tax_amount, total_amount,
           issued_at, due_date, status
         ) VALUES (
           $1, $2, $3, $4, ROUND($4 * 0.05, 2), ROUND($4 * 1.05, 2),
           NOW(), (NOW() + INTERVAL '30 days')::DATE, 'paid'
         )
         ON CONFLICT (invoice_number) DO UPDATE
         SET status = 'paid', total_amount = EXCLUDED.total_amount`,
        [invoiceNum, createdPayment.id, customer_id, amount]
      );

      return updateResult.rows[0];
    }

    return createdPayment;
  });
};

/**
 * Verify (complete) a payment.
 * Stamps paid_at, marks parcel.is_paid = true, and auto-generates invoice.
 */
const verifyPayment = async ({ payment_id, transaction_id }) => {
  return withTransaction(async (client) => {
    // Lock payment row
    const existing = await client.query(
      `SELECT id, parcel_id, customer_id, amount, status FROM payments WHERE id = $1 FOR UPDATE`,
      [payment_id]
    );
    if (!existing.rows[0])                     throw new Error('PAYMENT_NOT_FOUND');
    if (existing.rows[0].status !== 'pending') throw new Error('NOT_PENDING');

    const paymentRow = existing.rows[0];

    const result = await client.query(
      `UPDATE payments
       SET status = 'completed',
           paid_at = NOW(),
           transaction_id = COALESCE($1, transaction_id)
       WHERE id = $2
       RETURNING *`,
      [transaction_id || null, payment_id]
    );

    // Mark parcel as paid
    await client.query(
      `UPDATE parcels SET is_paid = true, updated_at = NOW() WHERE id = $1`,
      [paymentRow.parcel_id]
    );

    // Upsert invoice
    const invoiceNum = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${payment_id.substring(0, 8).toUpperCase()}`;
    await client.query(
      `INSERT INTO invoices (
         invoice_number, payment_id, customer_id,
         amount, tax_amount, total_amount,
         issued_at, due_date, status
       ) VALUES (
         $1, $2, $3, $4, ROUND($4 * 0.05, 2), ROUND($4 * 1.05, 2),
         NOW(), (NOW() + INTERVAL '30 days')::DATE, 'paid'
       )
       ON CONFLICT (invoice_number) DO UPDATE
       SET status = 'paid', total_amount = EXCLUDED.total_amount`,
      [invoiceNum, payment_id, paymentRow.customer_id, paymentRow.amount]
    );

    return result.rows[0];
  });
};

/**
 * Refund a payment: status → 'refunded'.
 * Reverses parcel.is_paid and cancels the invoice.
 */
const refundPayment = async ({ payment_id, notes }) => {
  return withTransaction(async (client) => {
    const existing = await client.query(
      `SELECT id, parcel_id, status FROM payments WHERE id = $1 FOR UPDATE`,
      [payment_id]
    );
    if (!existing.rows[0])                       throw new Error('PAYMENT_NOT_FOUND');
    if (existing.rows[0].status !== 'completed') throw new Error('NOT_COMPLETED');

    const paymentRow = existing.rows[0];

    const result = await client.query(
      `UPDATE payments
       SET status = 'refunded', notes = COALESCE($1, notes)
       WHERE id = $2
       RETURNING *`,
      [notes || null, payment_id]
    );

    // Revert parcel paid flag
    await client.query(
      `UPDATE parcels SET is_paid = false, updated_at = NOW() WHERE id = $1`,
      [paymentRow.parcel_id]
    );

    // Update invoice status to cancelled
    await client.query(
      `UPDATE invoices SET status = 'cancelled' WHERE payment_id = $1`,
      [payment_id]
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
  // Backfill invoices for any completed payments missing an invoice record
  try {
    await query(`
      INSERT INTO invoices (invoice_number, payment_id, customer_id, amount, tax_amount, total_amount, issued_at, due_date, status)
      SELECT 
        'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(pay.id::TEXT, 1, 8)),
        pay.id, pay.customer_id, pay.amount,
        ROUND(pay.amount * 0.05, 2), ROUND(pay.amount * 1.05, 2),
        COALESCE(pay.paid_at, pay.created_at, NOW()), (NOW() + INTERVAL '30 days')::DATE, 'paid'
      FROM payments pay
      WHERE pay.status = 'completed'
        AND NOT EXISTS (SELECT 1 FROM invoices inv WHERE inv.payment_id = pay.id)
      ON CONFLICT (invoice_number) DO NOTHING
    `);
  } catch {
    // Non-blocking backfill
  }

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

  let countSql = `SELECT COUNT(*) AS total FROM invoices inv WHERE 1=1`;
  const countParams = [];
  let ci = 1;

  if (status)      { countSql += ` AND inv.status = $${ci++}`;      countParams.push(status); }
  if (customer_id) { countSql += ` AND inv.customer_id = $${ci++}`; countParams.push(customer_id); }
  if (date_from)   { countSql += ` AND inv.issued_at >= $${ci++}`;  countParams.push(date_from); }
  if (date_to)     { countSql += ` AND inv.issued_at <= $${ci++}`;  countParams.push(date_to); }

  const countResult = await query(countSql, countParams);
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
 * If not yet created in the invoices table, automatically creates and returns it.
 */
const findInvoiceByPaymentId = async (paymentId) => {
  const queryInvoice = () => query(
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
     WHERE inv.payment_id = $1`,
    [paymentId]
  );

  let result = await queryInvoice();
  if (result.rows[0]) return result.rows[0];

  // Auto-generate invoice for existing payment if missing
  const paymentRes = await query(
    `SELECT * FROM v_payment_summary WHERE id = $1`,
    [paymentId]
  );
  const payment = paymentRes.rows[0];
  if (!payment) return null;

  const invoiceNum = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${paymentId.substring(0, 8).toUpperCase()}`;
  const invStatus = payment.status === 'completed' ? 'paid' : (payment.status === 'refunded' ? 'cancelled' : 'issued');

  await query(
    `INSERT INTO invoices (
       invoice_number, payment_id, customer_id,
       amount, tax_amount, total_amount,
       issued_at, due_date, status
     ) VALUES (
       $1, $2, $3, $4, ROUND($4 * 0.05, 2), ROUND($4 * 1.05, 2),
       COALESCE($5, NOW()), (NOW() + INTERVAL '30 days')::DATE, $6
     )
     ON CONFLICT (invoice_number) DO UPDATE
     SET status = EXCLUDED.status, total_amount = EXCLUDED.total_amount`,
    [invoiceNum, paymentId, payment.customer_id, payment.amount, payment.paid_at || payment.created_at, invStatus]
  );

  if (payment.status === 'completed') {
    await query(`UPDATE parcels SET is_paid = true, updated_at = NOW() WHERE id = $1`, [payment.parcel_id]);
  }

  result = await queryInvoice();
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
