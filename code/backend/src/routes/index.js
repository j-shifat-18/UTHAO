const { Router } = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const parcelRoutes = require('../modules/parcels/parcels.routes');

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'UTHAO Smart Logistics API', timestamp: new Date().toISOString() });
});

// Module routes
router.use('/auth', authRoutes);
router.use('/parcels', parcelRoutes);

module.exports = router;
