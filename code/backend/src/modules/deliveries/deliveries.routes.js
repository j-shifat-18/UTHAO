const { Router } = require('express');
const ctrl = require('./deliveries.controller');
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const validate = require('../../middleware/validate.middleware');
const {
  validateAssignAgent,
  validateReassignAgent,
  validateUpdateNotes,
} = require('./deliveries.validation');

const router = Router();

// All delivery management routes require authentication
router.use(authenticate);

// ─── Agent's own assignments ──────────────────────────────────────────────────

// GET /deliveries/my
// Delivery agents view their own assignment queue
router.get(
  '/my',
  authorize('delivery_agent'),
  ctrl.getMyAssignments
);

// ─── Assignment management (staff only) ─────────────

// GET /deliveries
// List all assignments with filters
router.get(
  '/',
  authorize('admin', 'manager', 'branch_employee'),
  ctrl.getAllAssignments
);

// POST /deliveries
// Assign a delivery agent to a parcel
router.post(
  '/',
  authorize('admin', 'manager', 'branch_employee'),
  validate({ body: validateAssignAgent }),
  ctrl.assignAgent
);

// GET /deliveries/parcels/:parcelId
// All assignments history for a specific parcel
router.get(
  '/parcels/:parcelId',
  authorize('admin', 'manager', 'branch_employee'),
  ctrl.getAssignmentsByParcel
);

// GET /deliveries/agents
// All active delivery agents list (staff view)
router.get(
  '/agents',
  authorize('admin', 'manager', 'branch_employee'),
  ctrl.getAllDeliveryAgents
);

// GET /deliveries/agents/:agentId
// All assignments for a specific agent (admin/manager view)
router.get(
  '/agents/:agentId',
  authorize('admin', 'manager'),
  ctrl.getAgentAssignments
);

// ─── Single assignment operations ─────────────────────────────────────────────

// GET /deliveries/:id
// Fetch a single assignment by ID
router.get(
  '/:id',
  authorize('admin', 'manager', 'branch_employee', 'delivery_agent'),
  ctrl.getAssignmentById
);

// POST /deliveries/:id/reassign
// Reassign to a different agent
router.post(
  '/:id/reassign',
  authorize('admin', 'manager', 'branch_employee'),
  validate({ body: validateReassignAgent }),
  ctrl.reassignAgent
);

// PATCH /deliveries/:id/start
// Agent acknowledges the assignment and starts working on it
router.patch(
  '/:id/start',
  authorize('delivery_agent'),
  ctrl.startAssignment
);

// PATCH /deliveries/:id/complete
// Mark delivery as completed (agent or staff)
router.patch(
  '/:id/complete',
  authorize('admin', 'manager', 'branch_employee', 'delivery_agent'),
  ctrl.completeAssignment
);

// PATCH /deliveries/:id/fail
// Mark delivery as failed (agent or staff)
router.patch(
  '/:id/fail',
  authorize('admin', 'manager', 'branch_employee', 'delivery_agent'),
  ctrl.failAssignment
);

// PATCH /deliveries/:id/notes
// Update delivery notes
router.patch(
  '/:id/notes',
  authorize('admin', 'manager', 'branch_employee', 'delivery_agent'),
  validate({ body: validateUpdateNotes }),
  ctrl.updateNotes
);

module.exports = router;
