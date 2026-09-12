const ApiError = require('../../utils/ApiError');
const repo = require('./deliveries.repository');
const parcelsRepo = require('../parcels/parcels.repository');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Map internal transaction error messages to user-facing ApiErrors.
 */
const handleRepoError = (err) => {
  switch (err.message) {
    case 'DUPLICATE_ASSIGNMENT':
      throw ApiError.conflict(
        'This parcel already has an active assignment of this type. Reassign instead.'
      );
    case 'AGENT_NOT_FOUND':
      throw ApiError.notFound('Delivery agent not found');
    case 'AGENT_INACTIVE':
      throw ApiError.badRequest('This agent is deactivated and cannot accept assignments');
    case 'AGENT_UNAVAILABLE':
      throw ApiError.badRequest('This agent is currently unavailable');
    case 'AGENT_AT_CAPACITY':
      throw ApiError.badRequest(
        "Agent has reached today's maximum parcel limit. Choose a different agent."
      );
    default:
      throw err;
  }
};

// ─── List & Fetch ─────────────────────────────────────────────────────────────

const getAllAssignments = async (filters) => {
  return repo.findAllAssignments(filters);
};

const getAssignmentById = async (id) => {
  const assignment = await repo.findAssignmentById(id);
  if (!assignment) throw ApiError.notFound('Assignment not found');
  return assignment;
};

const getAssignmentsByParcel = async (parcelId) => {
  const parcel = await parcelsRepo.findParcelById(parcelId);
  if (!parcel) throw ApiError.notFound('Parcel not found');
  const assignments = await repo.findAssignmentsByParcelId(parcelId);
  return { parcel: { id: parcel.id, tracking_number: parcel.tracking_number, status: parcel.status }, assignments };
};

/**
 * Agents can list their own assignments.
 * Admins/managers can list any agent's assignments.
 */
const getMyAssignments = async ({ userId, limit, offset, status }) => {
  const agent = await repo.findDeliveryAgentByUserId(userId);
  if (!agent) throw ApiError.notFound('Delivery agent profile not found for this user');
  return repo.findAssignmentsByAgentId({ agentId: agent.id, limit, offset, status });
};

const getAgentAssignments = async ({ agentId, limit, offset, status }) => {
  const agent = await repo.findDeliveryAgentById(agentId);
  if (!agent) throw ApiError.notFound('Delivery agent not found');
  return repo.findAssignmentsByAgentId({ agentId, limit, offset, status });
};

// ─── Assign ───────────────────────────────────────────────────────────────────

/**
 * Assign a delivery agent to a parcel for pickup or delivery.
 *
 * Business rules enforced here (before hitting the DB transaction):
 * - Parcel must exist and be in an assignable status
 * - assignment_type 'pickup'   → parcel status must be 'booked'
 * - assignment_type 'delivery' → parcel status must be 'in_transit' or 'at_warehouse'
 * - No duplicate active assignment (also enforced in repo via SELECT FOR UPDATE)
 */
const assignAgent = async (body, requestingUser) => {
  const { parcel_id, agent_id, assignment_type, notes } = body;

  // Validate parcel
  const parcel = await parcelsRepo.findParcelById(parcel_id);
  if (!parcel) throw ApiError.notFound('Parcel not found');

  const validParcelStatusForType = {
    pickup:   ['booked'],
    delivery: ['in_transit', 'at_warehouse', 'out_for_delivery'],
  };

  const allowedStatuses = validParcelStatusForType[assignment_type];
  if (!allowedStatuses.includes(parcel.status)) {
    throw ApiError.badRequest(
      `Cannot create a '${assignment_type}' assignment for a parcel in '${parcel.status}' status. ` +
      `Required: ${allowedStatuses.join(' or ')}`
    );
  }

  // Validate agent exists (quick check before entering transaction)
  const agent = await repo.findDeliveryAgentById(agent_id);
  if (!agent) throw ApiError.notFound('Delivery agent not found');
  if (!agent.is_active) throw ApiError.badRequest('Agent is deactivated');
  if (!agent.is_available) throw ApiError.badRequest('Agent is currently unavailable');

  try {
    return await repo.createAssignment({
      parcel_id,
      agent_id,
      assignment_type,
      notes,
      assigned_by: requestingUser.id,
    });
  } catch (err) {
    handleRepoError(err);
  }
};

// ─── Reassign ─────────────────────────────────────────────────────────────────

/**
 * Reassign to a different agent.
 * The existing active assignment for this parcel+type is required.
 */
const reassignAgent = async (assignmentId, body, requestingUser) => {
  const existing = await repo.findAssignmentById(assignmentId);
  if (!existing) throw ApiError.notFound('Assignment not found');

  if (existing.status !== 'assigned') {
    throw ApiError.badRequest(
      `Only 'assigned' assignments can be reassigned. Current status: '${existing.status}'`
    );
  }

  const newAgent = await repo.findDeliveryAgentById(body.agent_id);
  if (!newAgent) throw ApiError.notFound('New delivery agent not found');

  try {
    return await repo.reassignAgent({
      existing_assignment_id: assignmentId,
      parcel_id: existing.parcel_id,
      new_agent_id: body.agent_id,
      assignment_type: existing.assignment_type,
      notes: body.notes,
      assigned_by: requestingUser.id,
    });
  } catch (err) {
    handleRepoError(err);
  }
};

// ─── Lifecycle updates ────────────────────────────────────────────────────────

/**
 * Agent confirms they have started on the assignment (moves to in_progress).
 * Only the assigned agent can do this.
 */
const startAssignment = async (assignmentId, requestingUser) => {
  const agent = await repo.findDeliveryAgentByUserId(requestingUser.id);
  if (!agent) throw ApiError.forbidden('Only delivery agents can start assignments');

  const assignment = await repo.findAssignmentById(assignmentId);
  if (!assignment) throw ApiError.notFound('Assignment not found');

  if (assignment.agent_id !== agent.id) {
    throw ApiError.forbidden('You can only start your own assignments');
  }
  if (assignment.status !== 'assigned') {
    throw ApiError.badRequest(`Assignment is already '${assignment.status}'`);
  }

  const result = await repo.startAssignment(assignmentId, agent.id);
  if (!result) throw ApiError.badRequest('Could not start assignment');
  return result;
};

/**
 * Mark assignment as completed.
 * - Delivery agents can complete their own.
 * - Admin/manager/branch_employee can complete any.
 */
const completeAssignment = async (assignmentId, body, requestingUser) => {
  const assignment = await repo.findAssignmentById(assignmentId);
  if (!assignment) throw ApiError.notFound('Assignment not found');

  if (!['assigned', 'in_progress'].includes(assignment.status)) {
    throw ApiError.badRequest(`Cannot complete an assignment with status '${assignment.status}'`);
  }

  // If caller is a delivery agent, they can only complete their own assignments
  if (requestingUser.role === 'delivery_agent') {
    const agent = await repo.findDeliveryAgentByUserId(requestingUser.id);
    if (!agent || assignment.agent_id !== agent.id) {
      throw ApiError.forbidden('You can only complete your own assignments');
    }
    return repo.completeAssignment({ assignment_id: assignmentId, agent_id: agent.id, notes: body.notes });
  }

  // Admin/manager/employee can complete any assignment
  return repo.completeAssignment({
    assignment_id: assignmentId,
    agent_id: assignment.agent_id,
    notes: body.notes,
  });
};

/**
 * Mark assignment as failed.
 * - Delivery agents can fail their own.
 * - Admin/manager/employee can fail any.
 */
const failAssignment = async (assignmentId, body, requestingUser) => {
  const assignment = await repo.findAssignmentById(assignmentId);
  if (!assignment) throw ApiError.notFound('Assignment not found');

  if (!['assigned', 'in_progress'].includes(assignment.status)) {
    throw ApiError.badRequest(`Cannot fail an assignment with status '${assignment.status}'`);
  }

  if (requestingUser.role === 'delivery_agent') {
    const agent = await repo.findDeliveryAgentByUserId(requestingUser.id);
    if (!agent || assignment.agent_id !== agent.id) {
      throw ApiError.forbidden('You can only report failure on your own assignments');
    }
    return repo.failAssignment({ assignment_id: assignmentId, agent_id: agent.id, notes: body.notes });
  }

  return repo.failAssignment({
    assignment_id: assignmentId,
    agent_id: assignment.agent_id,
    notes: body.notes,
  });
};

/**
 * Update the notes on an assignment (agent or staff).
 */
const updateNotes = async (assignmentId, body, requestingUser) => {
  const assignment = await repo.findAssignmentById(assignmentId);
  if (!assignment) throw ApiError.notFound('Assignment not found');

  if (requestingUser.role === 'delivery_agent') {
    const agent = await repo.findDeliveryAgentByUserId(requestingUser.id);
    if (!agent || assignment.agent_id !== agent.id) {
      throw ApiError.forbidden('You can only update notes on your own assignments');
    }
  }

  const updated = await repo.updateAssignmentNotes(assignmentId, body.notes);
  if (!updated) throw ApiError.internal('Failed to update notes');
  return updated;
};

module.exports = {
  getAllAssignments,
  getAssignmentById,
  getAssignmentsByParcel,
  getMyAssignments,
  getAgentAssignments,
  assignAgent,
  reassignAgent,
  startAssignment,
  completeAssignment,
  failAssignment,
  updateNotes,
};
