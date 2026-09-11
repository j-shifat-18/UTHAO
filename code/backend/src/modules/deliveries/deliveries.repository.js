const { query } = require('../../database/query');
const { withTransaction } = require('../../database/transaction');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ASSIGNMENT_SELECT = `
  pa.id, pa.parcel_id, pa.agent_id, pa.assignment_type, pa.status,
  pa.assigned_at, pa.completed_at, pa.notes, pa.assigned_by,
  p.tracking_number, p.status AS parcel_status, p.receiver_name,
  p.delivery_city, p.delivery_state, p.delivery_address_line1, p.priority,
  da.first_name AS agent_first_name, da.last_name AS agent_last_name,
  da.vehicle_type, da.current_zone, da.rating,
  u.email AS agent_email,
  ab.email AS assigned_by_email
`;

const ASSIGNMENT_JOINS = `
  FROM parcel_assignments pa
  JOIN parcels p   ON p.id   = pa.parcel_id
  JOIN delivery_agents da ON da.id = pa.agent_id
  JOIN users u     ON u.id   = da.user_id
  LEFT JOIN users ab ON ab.id = pa.assigned_by
`;

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * List assignments with optional filters and pagination.
 */
const findAllAssignments = async ({
  limit, offset, status, assignment_type, agent_id, parcel_id,
}) => {
  let sql = `SELECT ${ASSIGNMENT_SELECT} ${ASSIGNMENT_JOINS} WHERE 1=1`;
  const params = [];
  let i = 1;

  if (status)          { sql += ` AND pa.status = $${i++}`;           params.push(status); }
  if (assignment_type) { sql += ` AND pa.assignment_type = $${i++}`;  params.push(assignment_type); }
  if (agent_id)        { sql += ` AND pa.agent_id = $${i++}`;         params.push(agent_id); }
  if (parcel_id)       { sql += ` AND pa.parcel_id = $${i++}`;        params.push(parcel_id); }

  const countSql = `SELECT COUNT(*) AS total ${ASSIGNMENT_JOINS} WHERE 1=1`
    + (status          ? ` AND pa.status = '${status}'` : '')
    + (assignment_type ? ` AND pa.assignment_type = '${assignment_type}'` : '')
    + (agent_id        ? ` AND pa.agent_id = '${agent_id}'` : '')
    + (parcel_id       ? ` AND pa.parcel_id = '${parcel_id}'` : '');

  const countResult = await query(countSql, []);
  const totalCount = parseInt(countResult.rows[0].total, 10);

  sql += ` ORDER BY pa.assigned_at DESC LIMIT $${i} OFFSET $${i + 1}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return { rows: result.rows, totalCount };
};

/**
 * Find a single assignment by its id.
 */
const findAssignmentById = async (id) => {
  const result = await query(
    `SELECT ${ASSIGNMENT_SELECT} ${ASSIGNMENT_JOINS} WHERE pa.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Get all assignments for a specific parcel.
 */
const findAssignmentsByParcelId = async (parcelId) => {
  const result = await query(
    `SELECT ${ASSIGNMENT_SELECT} ${ASSIGNMENT_JOINS}
     WHERE pa.parcel_id = $1
     ORDER BY pa.assigned_at ASC`,
    [parcelId]
  );
  return result.rows;
};

/**
 * Get all assignments for a specific agent (their workload).
 */
const findAssignmentsByAgentId = async ({ agentId, limit, offset, status }) => {
  let sql = `SELECT ${ASSIGNMENT_SELECT} ${ASSIGNMENT_JOINS} WHERE pa.agent_id = $1`;
  const params = [agentId];
  let i = 2;

  if (status) { sql += ` AND pa.status = $${i++}`; params.push(status); }

  const countResult = await query(
    `SELECT COUNT(*) AS total ${ASSIGNMENT_JOINS} WHERE pa.agent_id = $1`
      + (status ? ` AND pa.status = '${status}'` : ''),
    [agentId]
  );
  const totalCount = parseInt(countResult.rows[0].total, 10);

  sql += ` ORDER BY pa.assigned_at DESC LIMIT $${i} OFFSET $${i + 1}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return { rows: result.rows, totalCount };
};

/**
 * Check whether a parcel already has an active assignment of the given type.
 * Uses the partial unique index on (parcel_id, assignment_type) WHERE status='assigned'.
 */
const findActiveAssignmentForParcel = async (parcelId, assignmentType) => {
  const result = await query(
    `SELECT id FROM parcel_assignments
     WHERE parcel_id = $1 AND assignment_type = $2 AND status = 'assigned'`,
    [parcelId, assignmentType]
  );
  return result.rows[0] || null;
};

/**
 * Count how many active (assigned/in_progress) assignments an agent has today.
 * Used to enforce max_parcels_per_day.
 */
const countAgentActiveAssignmentsToday = async (agentId) => {
  const result = await query(
    `SELECT COUNT(*) AS total
     FROM parcel_assignments
     WHERE agent_id = $1
       AND status IN ('assigned', 'in_progress')
       AND assigned_at >= CURRENT_DATE`,
    [agentId]
  );
  return parseInt(result.rows[0].total, 10);
};

/**
 * Look up the delivery agent row by user_id (for agents checking their own assignments).
 */
const findDeliveryAgentByUserId = async (userId) => {
  const result = await query(
    `SELECT id, first_name, last_name, is_available, is_active,
            max_parcels_per_day, branch_id, vehicle_type, rating, total_deliveries
     FROM delivery_agents WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

/**
 * Look up delivery agent by agent primary key id.
 */
const findDeliveryAgentById = async (agentId) => {
  const result = await query(
    `SELECT da.id, da.first_name, da.last_name, da.is_available, da.is_active,
            da.max_parcels_per_day, da.branch_id, da.vehicle_type,
            da.rating, da.total_deliveries, u.email
     FROM delivery_agents da
     JOIN users u ON u.id = da.user_id
     WHERE da.id = $1`,
    [agentId]
  );
  return result.rows[0] || null;
};

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Assign a delivery agent to a parcel.
 *
 * Concurrency safety: runs inside a transaction and uses SELECT FOR UPDATE
 * on the parcel_assignments row (via the partial unique index) to prevent
 * two concurrent requests from creating duplicate active assignments.
 *
 * The partial unique index (parcel_id, assignment_type) WHERE status='assigned'
 * acts as the final safety net — PostgreSQL will raise a unique-violation
 * error if two transactions somehow both insert simultaneously.
 */
const createAssignment = async ({
  parcel_id, agent_id, assignment_type, notes, assigned_by,
}) => {
  return withTransaction(async (client) => {
    // Lock the parcel row to serialize concurrent assignment requests
    await client.query(
      `SELECT id FROM parcels WHERE id = $1 FOR UPDATE`,
      [parcel_id]
    );

    // Double-check: no active assignment of this type already exists
    const existing = await client.query(
      `SELECT id FROM parcel_assignments
       WHERE parcel_id = $1 AND assignment_type = $2 AND status = 'assigned'`,
      [parcel_id, assignment_type]
    );
    if (existing.rows.length > 0) {
      throw new Error('DUPLICATE_ASSIGNMENT');
    }

    // Lock the agent row to serialize capacity checks
    const agentRow = await client.query(
      `SELECT id, is_available, is_active, max_parcels_per_day
       FROM delivery_agents WHERE id = $1 FOR UPDATE`,
      [agent_id]
    );
    if (!agentRow.rows[0]) throw new Error('AGENT_NOT_FOUND');

    const agent = agentRow.rows[0];
    if (!agent.is_active)    throw new Error('AGENT_INACTIVE');
    if (!agent.is_available) throw new Error('AGENT_UNAVAILABLE');

    // Capacity check for today
    const todayCount = await client.query(
      `SELECT COUNT(*) AS total
       FROM parcel_assignments
       WHERE agent_id = $1
         AND status IN ('assigned', 'in_progress')
         AND assigned_at >= CURRENT_DATE`,
      [agent_id]
    );
    if (parseInt(todayCount.rows[0].total, 10) >= agent.max_parcels_per_day) {
      throw new Error('AGENT_AT_CAPACITY');
    }

    // Create the assignment
    const result = await client.query(
      `INSERT INTO parcel_assignments
         (parcel_id, agent_id, assignment_type, status, notes, assigned_by)
       VALUES ($1, $2, $3, 'assigned', $4, $5)
       RETURNING *`,
      [parcel_id, agent_id, assignment_type, notes || null, assigned_by || null]
    );

    return result.rows[0];
  });
};

/**
 * Reassign: mark the current active assignment as 'reassigned',
 * then create a new assignment for the new agent — all in one transaction.
 */
const reassignAgent = async ({
  existing_assignment_id, parcel_id, new_agent_id, assignment_type,
  notes, assigned_by,
}) => {
  return withTransaction(async (client) => {
    // Lock parcel row
    await client.query(`SELECT id FROM parcels WHERE id = $1 FOR UPDATE`, [parcel_id]);

    // Mark old assignment as reassigned
    await client.query(
      `UPDATE parcel_assignments
       SET status = 'reassigned'
       WHERE id = $1 AND status = 'assigned'`,
      [existing_assignment_id]
    );

    // Validate new agent
    const agentRow = await client.query(
      `SELECT id, is_available, is_active, max_parcels_per_day
       FROM delivery_agents WHERE id = $1 FOR UPDATE`,
      [new_agent_id]
    );
    if (!agentRow.rows[0]) throw new Error('AGENT_NOT_FOUND');
    const agent = agentRow.rows[0];
    if (!agent.is_active)    throw new Error('AGENT_INACTIVE');
    if (!agent.is_available) throw new Error('AGENT_UNAVAILABLE');

    const todayCount = await client.query(
      `SELECT COUNT(*) AS total
       FROM parcel_assignments
       WHERE agent_id = $1
         AND status IN ('assigned', 'in_progress')
         AND assigned_at >= CURRENT_DATE`,
      [new_agent_id]
    );
    if (parseInt(todayCount.rows[0].total, 10) >= agent.max_parcels_per_day) {
      throw new Error('AGENT_AT_CAPACITY');
    }

    const result = await client.query(
      `INSERT INTO parcel_assignments
         (parcel_id, agent_id, assignment_type, status, notes, assigned_by)
       VALUES ($1, $2, $3, 'assigned', $4, $5)
       RETURNING *`,
      [parcel_id, new_agent_id, assignment_type, notes || null, assigned_by || null]
    );

    return result.rows[0];
  });
};

/**
 * Mark an assignment as in_progress (agent has started the job).
 */
const startAssignment = async (assignmentId, agentId) => {
  const result = await query(
    `UPDATE parcel_assignments
     SET status = 'in_progress'
     WHERE id = $1 AND agent_id = $2 AND status = 'assigned'
     RETURNING *`,
    [assignmentId, agentId]
  );
  return result.rows[0] || null;
};

/**
 * Complete an assignment: set completed_at, increment agent's total_deliveries,
 * and optionally update agent availability — all in one transaction.
 */
const completeAssignment = async ({ assignment_id, agent_id, notes }) => {
  return withTransaction(async (client) => {
    const result = await client.query(
      `UPDATE parcel_assignments
       SET status = 'completed', completed_at = NOW(), notes = COALESCE($1, notes)
       WHERE id = $2 AND agent_id = $3 AND status IN ('assigned', 'in_progress')
       RETURNING *`,
      [notes || null, assignment_id, agent_id]
    );
    if (!result.rows[0]) return null;

    // Increment total deliveries on agent profile
    await client.query(
      `UPDATE delivery_agents
       SET total_deliveries = total_deliveries + 1
       WHERE id = $1`,
      [agent_id]
    );

    return result.rows[0];
  });
};

/**
 * Mark an assignment as failed and optionally record notes.
 */
const failAssignment = async ({ assignment_id, agent_id, notes }) => {
  const result = await query(
    `UPDATE parcel_assignments
     SET status = 'failed', notes = COALESCE($1, notes)
     WHERE id = $2 AND agent_id = $3 AND status IN ('assigned', 'in_progress')
     RETURNING *`,
    [notes || null, assignment_id, agent_id]
  );
  return result.rows[0] || null;
};

/**
 * Update delivery notes on an assignment (agent or manager).
 */
const updateAssignmentNotes = async (assignmentId, notes) => {
  const result = await query(
    `UPDATE parcel_assignments SET notes = $1 WHERE id = $2 RETURNING *`,
    [notes, assignmentId]
  );
  return result.rows[0] || null;
};

module.exports = {
  findAllAssignments,
  findAssignmentById,
  findAssignmentsByParcelId,
  findAssignmentsByAgentId,
  findActiveAssignmentForParcel,
  countAgentActiveAssignmentsToday,
  findDeliveryAgentByUserId,
  findDeliveryAgentById,
  createAssignment,
  reassignAgent,
  startAssignment,
  completeAssignment,
  failAssignment,
  updateAssignmentNotes,
};
