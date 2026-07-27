const { Router } = require('express');
const authRoutes = require('../modules/auth/auth.routes');

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Module routes
router.use('/auth', authRoutes);

module.exports = router;
