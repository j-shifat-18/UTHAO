const { Router } = require('express');
const parcelsController = require('./parcels.controller');
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const validate = require('../../middleware/validate.middleware');
const { validateCreateParcel, validateUpdateStatus } = require('./parcels.validation');

const router = Router();

// Public: track by tracking number (no auth)
router.get('/track/:trackingNumber', parcelsController.trackByTrackingNumber);

// Public: get parcel categories (no auth)
router.get('/categories', parcelsController.getCategories);

// All routes below require auth
router.use(authenticate);

// Customer: view own parcels
router.get('/my', authorize('customer'), parcelsController.getMyParcels);

// Admin/Manager/Employee: list all parcels
router.get('/', authorize('admin', 'manager', 'branch_employee'), parcelsController.getAllParcels);

// Create parcel (customer only)
router.post('/', authorize('customer'), validate({ body: validateCreateParcel }), parcelsController.createParcel);

// Get single parcel (customer sees own, staff sees all)
router.get('/:id', parcelsController.getParcelById);

// Tracking history by parcel id
router.get('/:id/tracking', parcelsController.getTrackingHistory);

// Update parcel info (customer: own parcel in 'booked' status only)
router.patch('/:id', parcelsController.updateParcel);

// Update status (staff/agent only)
router.patch('/:id/status', authorize('admin', 'manager', 'branch_employee', 'delivery_agent'), validate({ body: validateUpdateStatus }), parcelsController.updateStatus);

// Cancel parcel
router.patch('/:id/cancel', parcelsController.cancelParcel);

module.exports = router;
