const { Router } = require('express');
const ctrl = require('./reports.controller');
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');

const router = Router();

// All report endpoints require authentication.
// Admin and manager can access all reports.
// Branch employees can access operational reports (not revenue).
router.use(authenticate);

// ─── Operational reports (admin, manager, branch_employee) ───────────────────

// GET /reports/daily-deliveries?date_from=&date_to=
router.get(
  '/daily-deliveries',
  authorize('admin', 'manager', 'branch_employee'),
  ctrl.getDailyDeliveries
);

// GET /reports/delayed-parcels?priority=express&branch_id=1&page=1&limit=20
router.get(
  '/delayed-parcels',
  authorize('admin', 'manager', 'branch_employee'),
  ctrl.getDelayedParcels
);

// GET /reports/warehouse-occupancy?branch_id=1&city=Dhaka&is_active=true
router.get(
  '/warehouse-occupancy',
  authorize('admin', 'manager', 'branch_employee'),
  ctrl.getWarehouseOccupancy
);

// GET /reports/delivery-success-rate?date_from=&date_to=
router.get(
  '/delivery-success-rate',
  authorize('admin', 'manager', 'branch_employee'),
  ctrl.getDeliverySuccessRate
);

// GET /reports/avg-delivery-time?date_from=&date_to=
router.get(
  '/avg-delivery-time',
  authorize('admin', 'manager', 'branch_employee'),
  ctrl.getAvgDeliveryTime
);

// ─── Management reports (admin, manager only) ─────────────────────────────────

// GET /reports/monthly-revenue?date_from=&date_to=
router.get(
  '/monthly-revenue',
  authorize('admin', 'manager'),
  ctrl.getMonthlyRevenue
);

// GET /reports/revenue-by-branch?date_from=&date_to=
router.get(
  '/revenue-by-branch',
  authorize('admin', 'manager'),
  ctrl.getRevenueByBranch
);

// GET /reports/top-delivery-agents?date_from=&date_to=&limit=10
router.get(
  '/top-delivery-agents',
  authorize('admin', 'manager'),
  ctrl.getTopDeliveryAgents
);

// GET /reports/most-active-branches?date_from=&date_to=&limit=10
router.get(
  '/most-active-branches',
  authorize('admin', 'manager'),
  ctrl.getMostActiveBranches
);

module.exports = router;
