const ApiError = require('../../utils/ApiError');
const repo = require('./payments.repository');
const customersRepo = require('../customers/customers.repository');
const { query } = require('../../database/query');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Map repository transaction errors to ApiErrors.
 */
const handleRepoError = (err) => {
  switch (err.message) {
    case 'PARCEL_NOT_FOUND':  throw ApiError.notFound('Parcel not found');
    case 'ALREADY_PAID':      throw ApiError.conflict('This parcel has already been paid');
    case 'PAYMENT_EXISTS':    throw ApiError.conflict('A pending or completed payment already exists for this parcel');
    case 'PAYMENT_NOT_FOUND': throw ApiError.notFound('Payment not found');
    case 'NOT_PENDING':       throw ApiError.badRequest('Only pending payments can be verified');
    case 'NOT_COMPLETED':     throw ApiError.badRequest('Only completed payments can be refunded');
    default:                  throw err;
  }
};

/**
 * Default date range helpers: if from/to not supplied, default to current month.
 */
const resolveRange = (dateFrom, dateTo) => {
  const now = new Date();
  const from = dateFrom || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to   = dateTo   || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { from, to };
};

// ─── Payment methods ──────────────────────────────────────────────────────────

const getPaymentMethods = async () => {
  return repo.findAllPaymentMethods();
};

// ─── Payments ─────────────────────────────────────────────────────────────────

const getAllPayments = async (filters) => {
  return repo.findAllPayments(filters);
};

const getPaymentById = async (id) => {
  const payment = await repo.findPaymentById(id);
  if (!payment) throw ApiError.notFound('Payment not found');
  return payment;
};

/**
 * Customer views their own payment history.
 */
const getMyPayments = async ({ userId, limit, offset, status }) => {
  const customer = await customersRepo.findCustomerByUserId(userId);
  if (!customer) throw ApiError.notFound('Customer profile not found');
  return repo.findPaymentsByCustomerId({ customerId: customer.id, limit, offset, status });
};

/**
 * Get all payment records for a specific parcel.
 */
const getPaymentsForParcel = async (parcelId) => {
  // Verify the parcel exists
  const parcelCheck = await query('SELECT id FROM parcels WHERE id = $1', [parcelId]);
  if (!parcelCheck.rows[0]) throw ApiError.notFound('Parcel not found');
  return repo.findPaymentByParcelId(parcelId);
};

/**
 * Create a new payment.
 *
 * Business rules:
 * - Parcel must exist and must not already be paid
 * - Amount must match the parcel's delivery_cost (enforced here so customers can't underpay)
 * - Customer can only create payments for their own parcels
 * - Staff can create payments on behalf of customers (COD collection)
 */
const createPayment = async (body, requestingUser) => {
  const { parcel_id, payment_method_id, transaction_id, notes } = body;

  // Resolve customer_id
  let customer;
  if (requestingUser.role === 'customer') {
    customer = await customersRepo.findCustomerByUserId(requestingUser.id);
    if (!customer) throw ApiError.notFound('Customer profile not found');
  } else {
    // Staff must supply customer_id in the body
    if (!body.customer_id) throw ApiError.badRequest('customer_id is required when creating a payment as staff');
    const result = await query('SELECT id FROM customers WHERE id = $1', [body.customer_id]);
    if (!result.rows[0]) throw ApiError.notFound('Customer not found');
    customer = result.rows[0];
  }

  // Fetch parcel to verify ownership and get the authoritative amount
  const parcelResult = await query(
    `SELECT p.id, p.delivery_cost, p.is_paid, p.sender_customer_id, p.status
     FROM parcels p WHERE p.id = $1`,
    [parcel_id]
  );
  const parcel = parcelResult.rows[0];
  if (!parcel) throw ApiError.notFound('Parcel not found');

  // Customers can only pay for their own parcels
  if (requestingUser.role === 'customer' && parcel.sender_customer_id !== customer.id) {
    throw ApiError.forbidden('You can only make payments for your own parcels');
  }

  if (parcel.is_paid) throw ApiError.conflict('This parcel has already been paid');

  // Parcel must be in a payable status
  const payableStatuses = ['booked', 'picked_up', 'in_transit', 'at_warehouse', 'out_for_delivery', 'delivered'];
  if (!payableStatuses.includes(parcel.status)) {
    throw ApiError.badRequest(`Cannot create a payment for a parcel in '${parcel.status}' status`);
  }

  // Validate payment method
  const methodResult = await query(
    'SELECT id FROM payment_methods WHERE id = $1 AND is_active = true',
    [payment_method_id]
  );
  if (!methodResult.rows[0]) throw ApiError.badRequest('Invalid or inactive payment method');

  try {
    return await repo.createPayment({
      parcel_id,
      customer_id: customer.id,
      amount: parcel.delivery_cost,   // always use the authoritative amount from the parcel
      payment_method_id,
      transaction_id,
      notes,
    });
  } catch (err) {
    handleRepoError(err);
  }
};

/**
 * Verify / confirm a payment (admin, manager, employee — or payment gateway webhook).
 * Sets status → 'completed'. Trigger auto-generates invoice and marks parcel paid.
 */
const verifyPayment = async (paymentId, body) => {
  const payment = await repo.findPaymentById(paymentId);
  if (!payment) throw ApiError.notFound('Payment not found');
  if (payment.status !== 'pending') {
    throw ApiError.badRequest(`Payment is already '${payment.status}'. Only pending payments can be verified.`);
  }
  try {
    return await repo.verifyPayment({ payment_id: paymentId, transaction_id: body.transaction_id });
  } catch (err) {
    handleRepoError(err);
  }
};

/**
 * Refund a completed payment.
 * Trigger reverses parcel.is_paid and marks the invoice cancelled.
 */
const refundPayment = async (paymentId, body) => {
  const payment = await repo.findPaymentById(paymentId);
  if (!payment) throw ApiError.notFound('Payment not found');
  if (payment.status !== 'completed') {
    throw ApiError.badRequest(`Cannot refund a payment with status '${payment.status}'`);
  }
  try {
    return await repo.refundPayment({ payment_id: paymentId, notes: body.notes });
  } catch (err) {
    handleRepoError(err);
  }
};

/**
 * Mark a pending payment as failed (e.g. card declined, bKash timeout).
 */
const failPayment = async (paymentId) => {
  const payment = await repo.findPaymentById(paymentId);
  if (!payment) throw ApiError.notFound('Payment not found');
  if (payment.status !== 'pending') {
    throw ApiError.badRequest(`Only pending payments can be marked failed. Current: '${payment.status}'`);
  }
  const result = await repo.failPayment(paymentId);
  if (!result) throw ApiError.internal('Failed to update payment status');
  return result;
};

// ─── Invoices ─────────────────────────────────────────────────────────────────

const getAllInvoices = async (filters) => {
  return repo.findAllInvoices(filters);
};

const getInvoiceById = async (id) => {
  const invoice = await repo.findInvoiceById(id);
  if (!invoice) throw ApiError.notFound('Invoice not found');
  return invoice;
};

/**
 * Get the invoice generated for a specific payment.
 */
const getInvoiceByPayment = async (paymentId) => {
  const payment = await repo.findPaymentById(paymentId);
  if (!payment) throw ApiError.notFound('Payment not found');
  const invoice = await repo.findInvoiceByPaymentId(paymentId);
  if (!invoice) throw ApiError.notFound('Invoice not yet generated for this payment');
  return invoice;
};

/**
 * Customer views their own invoices (scoped by their customer_id).
 */
const getMyInvoices = async ({ userId, limit, offset, status }) => {
  const customer = await customersRepo.findCustomerByUserId(userId);
  if (!customer) throw ApiError.notFound('Customer profile not found');
  return repo.findAllInvoices({ limit, offset, status, customer_id: customer.id });
};

// ─── Revenue ──────────────────────────────────────────────────────────────────

const getRevenueSummary = async ({ date_from, date_to }) => {
  const { from, to } = resolveRange(date_from, date_to);
  const [summary, byDay, byMethod] = await Promise.all([
    repo.getRevenueSummary(from, to),
    repo.getRevenueByDay(from, to),
    repo.getRevenueByMethod(from, to),
  ]);
  return { period: { from, to }, summary, by_day: byDay, by_method: byMethod };
};

module.exports = {
  getPaymentMethods,
  getAllPayments,
  getPaymentById,
  getMyPayments,
  getPaymentsForParcel,
  createPayment,
  verifyPayment,
  refundPayment,
  failPayment,
  getAllInvoices,
  getInvoiceById,
  getInvoiceByPayment,
  getMyInvoices,
  getRevenueSummary,
};
