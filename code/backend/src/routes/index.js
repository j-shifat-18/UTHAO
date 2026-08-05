const { Router } = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const usersRoutes = require('../modules/users/users.routes');
const customersRoutes = require('../modules/customers/customers.routes');
const branchesRoutes = require('../modules/branches/branches.routes');
const warehousesRoutes = require('../modules/warehouses/warehouses.routes');

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Module routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/customers', customersRoutes);
router.use('/branches', branchesRoutes);
router.use('/warehouses', warehousesRoutes);

module.exports = router;
