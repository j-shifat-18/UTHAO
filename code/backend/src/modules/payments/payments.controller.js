const catchAsync = require('../../utils/catchAsync');
const { success, created } = require('../../utils/response');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const paymentsService = require('./payments.service');

// ─── Payment methods ──────────────────────────────────────────────────────────

const getPaymentMethods = catchAsync(async (req, res) => {
  const methods = await paymentsService.getPaymentMethods();
  return success(res, { message: 'Payment methods fetched', data: methods });
});

// ─── Payments ─────────────────────────────────────────────────────────────────

const getAllPayments = catchAsync(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { status, customer_id, parcel_id, payment_method_id, date_from, date_to } = req.query;

  const { rows, totalCount } = await paymentsService.getAllPayments({
    limit, offset, status, customer_id, parcel_id, payment_method_id, date_from, date_to,
  });

  return success(res, {
    message: 'Payments fetched',
    data: rows,
    meta: buildMeta(page, limit, totalCount),
  });
});

const getPaymentById = catchAsync(async (req, res) => {
  const payment = await paymentsService.getPaymentById(req.params.id);
  return success(res, { message: 'Payment fetched', data: payment });
});

const getMyPayments = catchAsync(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { status } = req.query;

  const { rows, totalCount } = await paymentsService.getMyPayments({
    userId: req.user.id,
    limit,
    offset,
    status,
  });

  return success(res, {
    message: 'Your payment history fetched',
    data: rows,
    meta: buildMeta(page, limit, totalCount),
  });
});

const getPaymentsForParcel = catchAsync(async (req, res) => {
  const payments = await paymentsService.getPaymentsForParcel(req.params.parcelId);
  return success(res, { message: 'Parcel payments fetched', data: payments });
});

const createPayment = catchAsync(async (req, res) => {
  const payment = await paymentsService.createPayment(req.body, req.user);
  return created(res, { message: 'Payment created', data: payment });
});

const verifyPayment = catchAsync(async (req, res) => {
  const payment = await paymentsService.verifyPayment(req.params.id, req.body);
  return success(res, { message: 'Payment verified successfully', data: payment });
});

const refundPayment = catchAsync(async (req, res) => {
  const payment = await paymentsService.refundPayment(req.params.id, req.body);
  return success(res, { message: 'Payment refunded', data: payment });
});

const failPayment = catchAsync(async (req, res) => {
  const payment = await paymentsService.failPayment(req.params.id);
  return success(res, { message: 'Payment marked as failed', data: payment });
});

// ─── Invoices ─────────────────────────────────────────────────────────────────

const getAllInvoices = catchAsync(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { status, customer_id, date_from, date_to } = req.query;

  const { rows, totalCount } = await paymentsService.getAllInvoices({
    limit, offset, status, customer_id, date_from, date_to,
  });

  return success(res, {
    message: 'Invoices fetched',
    data: rows,
    meta: buildMeta(page, limit, totalCount),
  });
});

const getInvoiceById = catchAsync(async (req, res) => {
  const invoice = await paymentsService.getInvoiceById(req.params.id);
  return success(res, { message: 'Invoice fetched', data: invoice });
});

const getInvoiceByPayment = catchAsync(async (req, res) => {
  const invoice = await paymentsService.getInvoiceByPayment(req.params.paymentId);
  return success(res, { message: 'Invoice fetched', data: invoice });
});

const getMyInvoices = catchAsync(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { status } = req.query;

  const { rows, totalCount } = await paymentsService.getMyInvoices({
    userId: req.user.id,
    limit,
    offset,
    status,
  });

  return success(res, {
    message: 'Your invoices fetched',
    data: rows,
    meta: buildMeta(page, limit, totalCount),
  });
});

// ─── Revenue ──────────────────────────────────────────────────────────────────

const getRevenueSummary = catchAsync(async (req, res) => {
  const { date_from, date_to } = req.query;
  const result = await paymentsService.getRevenueSummary({ date_from, date_to });
  return success(res, { message: 'Revenue summary fetched', data: result });
});

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
