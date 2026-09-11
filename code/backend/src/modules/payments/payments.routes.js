const { Router } = require('express');
const ctrl = require('./payments.controller');
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const validate = require('../../middleware/validate.middleware');
const {
  validateCreatePayment,
  validateRefundPayment,
} = require('./payments.validation');

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────

// GET /payments/methods — list available payment methods (public, used on checkout UI)
router.get('/methods', ctrl.getPaymentMethods);

// All routes below require authentication
router.use(authenticate);

// ─── Revenue (admin/manager only) ─────────────────────────────────────────────

// GET /payments/revenue
router.get(
  '/revenue',
  authorize('admin', 'manager'),
  ctrl.getRevenueSummary
);

// ─── Customer's own history ───────────────────────────────────────────────────

// GET /payments/my
router.get(
  '/my',
  authorize('customer'),
  ctrl.getMyPayments
);

// GET /payments/invoices/my
router.get(
  '/invoices/my',
  authorize('customer'),
  ctrl.getMyInvoices
);

// ─── Invoice routes (staff) ───────────────────────────────────────────────────

// GET /payments/invoices
router.get(
  '/invoices',
  authorize('admin', 'manager', 'branch_employee'),
  ctrl.getAllInvoices
);

// GET /payments/invoices/:id
router.get(
  '/invoices/:id',
  authorize('admin', 'manager', 'branch_employee'),
  ctrl.getInvoiceById
);

// ─── Payment for a specific parcel ────────────────────────────────────────────

// GET /payments/parcels/:parcelId
router.get(
  '/parcels/:parcelId',
  authorize('admin', 'manager', 'branch_employee'),
  ctrl.getPaymentsForParcel
);

// ─── Staff: all payments list ─────────────────────────────────────────────────

// GET /payments
router.get(
  '/',
  authorize('admin', 'manager', 'branch_employee'),
  ctrl.getAllPayments
);

// ─── Create payment ───────────────────────────────────────────────────────────

// POST /payments
// Customers initiate payment; staff can create on behalf of customer (COD)
router.post(
  '/',
  authorize('admin', 'manager', 'branch_employee', 'customer'),
  validate({ body: validateCreatePayment }),
  ctrl.createPayment
);

// ─── Single payment operations ────────────────────────────────────────────────

// GET /payments/:id
router.get(
  '/:id',
  authorize('admin', 'manager', 'branch_employee', 'customer'),
  ctrl.getPaymentById
);

// GET /payments/:paymentId/invoice
router.get(
  '/:paymentId/invoice',
  authorize('admin', 'manager', 'branch_employee', 'customer'),
  ctrl.getInvoiceByPayment
);

// PATCH /payments/:id/verify — confirm payment received
router.patch(
  '/:id/verify',
  authorize('admin', 'manager', 'branch_employee'),
  ctrl.verifyPayment
);

// PATCH /payments/:id/refund
router.patch(
  '/:id/refund',
  authorize('admin', 'manager'),
  validate({ body: validateRefundPayment }),
  ctrl.refundPayment
);

// PATCH /payments/:id/fail
router.patch(
  '/:id/fail',
  authorize('admin', 'manager', 'branch_employee'),
  ctrl.failPayment
);

module.exports = router;
