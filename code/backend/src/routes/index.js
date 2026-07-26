const { Router } = require('express');

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Module routes will be registered here as we build them
// router.use('/auth', authRoutes);
// router.use('/users', userRoutes);
// router.use('/customers', customerRoutes);
// router.use('/branches', branchRoutes);
// router.use('/warehouses', warehouseRoutes);
// router.use('/parcels', parcelRoutes);
// router.use('/assignments', assignmentRoutes);
// router.use('/payments', paymentRoutes);
// router.use('/reports', reportRoutes);

module.exports = router;
