const { Router } = require('express');
const parcelsController = require('./parcels.controller');
const authMiddleware = require('../../middleware/auth.middleware');

const router = Router();

// Public routes
router.get('/track/:trackingNumber', parcelsController.trackParcel);
router.post('/estimate', parcelsController.estimatePrice);
router.get('/branches', parcelsController.getBranches);

// Booking (Public or Authenticated)
router.post('/book', parcelsController.bookParcel);

// Protected routes
router.get('/my-parcels', authMiddleware, parcelsController.getMyParcels);
router.patch('/update-status', parcelsController.updateStatus);

module.exports = router;
