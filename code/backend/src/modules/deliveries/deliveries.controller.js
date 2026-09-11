const catchAsync = require('../../utils/catchAsync');
const { success, created } = require('../../utils/response');
const { parsePagination, buildMeta } = require('../../utils/pagination');
const deliveriesService = require('./deliveries.service');

// ─── List / Fetch ─────────────────────────────────────────────────────────────

const getAllAssignments = catchAsync(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { status, assignment_type, agent_id, parcel_id } = req.query;

  const { rows, totalCount } = await deliveriesService.getAllAssignments({
    limit, offset, status, assignment_type, agent_id, parcel_id,
  });

  return success(res, {
    message: 'Assignments fetched',
    data: rows,
    meta: buildMeta(page, limit, totalCount),
  });
});

const getAssignmentById = catchAsync(async (req, res) => {
  const assignment = await deliveriesService.getAssignmentById(req.params.id);
  return success(res, { message: 'Assignment fetched', data: assignment });
});

const getAssignmentsByParcel = catchAsync(async (req, res) => {
  const result = await deliveriesService.getAssignmentsByParcel(req.params.parcelId);
  return success(res, { message: 'Parcel assignments fetched', data: result });
});

/** Agent views their own assignment list */
const getMyAssignments = catchAsync(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { status } = req.query;

  const { rows, totalCount } = await deliveriesService.getMyAssignments({
    userId: req.user.id,
    limit,
    offset,
    status,
  });

  return success(res, {
    message: 'Your assignments fetched',
    data: rows,
    meta: buildMeta(page, limit, totalCount),
  });
});

/** Admin/manager views any agent's assignments */
const getAgentAssignments = catchAsync(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { status } = req.query;

  const { rows, totalCount } = await deliveriesService.getAgentAssignments({
    agentId: req.params.agentId,
    limit,
    offset,
    status,
  });

  return success(res, {
    message: 'Agent assignments fetched',
    data: rows,
    meta: buildMeta(page, limit, totalCount),
  });
});

// ─── Assign / Reassign ────────────────────────────────────────────────────────

const assignAgent = catchAsync(async (req, res) => {
  const assignment = await deliveriesService.assignAgent(req.body, req.user);
  return created(res, { message: 'Agent assigned successfully', data: assignment });
});

const reassignAgent = catchAsync(async (req, res) => {
  const assignment = await deliveriesService.reassignAgent(
    req.params.id,
    req.body,
    req.user
  );
  return created(res, { message: 'Agent reassigned successfully', data: assignment });
});

// ─── Lifecycle ────────────────────────────────────────────────────────────────

const startAssignment = catchAsync(async (req, res) => {
  const result = await deliveriesService.startAssignment(req.params.id, req.user);
  return success(res, { message: 'Assignment started', data: result });
});

const completeAssignment = catchAsync(async (req, res) => {
  const result = await deliveriesService.completeAssignment(
    req.params.id,
    req.body,
    req.user
  );
  return success(res, { message: 'Assignment completed', data: result });
});

const failAssignment = catchAsync(async (req, res) => {
  const result = await deliveriesService.failAssignment(
    req.params.id,
    req.body,
    req.user
  );
  return success(res, { message: 'Assignment marked as failed', data: result });
});

const updateNotes = catchAsync(async (req, res) => {
  const result = await deliveriesService.updateNotes(
    req.params.id,
    req.body,
    req.user
  );
  return success(res, { message: 'Notes updated', data: result });
});

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
