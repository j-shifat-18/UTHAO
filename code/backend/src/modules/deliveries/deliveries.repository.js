const { query } = require('../../database/query');
const { withTransaction } = require('../../database/transaction');


const ASSIGNMENT_SELECT = `
  pa.id, pa.parcel_id, pa.agent_id, pa.assignment_type, pa.status,
  pa.assigned_at, pa.completed_at, pa.notes, pa.assigned_by,
  p.tracking_number, p.status AS parcel_status,
  p.receiver_name, p.receiver_name AS recipient_name,
  p.receiver_phone, p.receiver_phone AS recipient_phone,
  p.delivery_city, p.delivery_state,
  p.delivery_address_line1, p.delivery_address_line1 AS delivery_address,
  p.delivery_address_line2, p.delivery_postal_code,
  p.weight_kg,
  p.delivery_cost, p.delivery_cost AS total_cost,
  p.payment_method, p.is_paid, p.is_fragile, p.priority,
  p.delivery_instructions,
  c.first_name AS sender_first_name, c.last_name AS sender_last_name,
  TRIM(c.first_name || ' ' || COALESCE(c.last_name, '')) AS sender_name,
  ub.email AS sender_email, ub.phone AS sender_phone,
  COALESCE(addr.address_line1, ob.address, 'Customer Address on File') AS pickup_address,
  COALESCE(addr.city, ob.city, 'Dhaka') AS pickup_city,
  cat.name AS category_name,
  da.first_name AS agent_first_name, da.last_name AS agent_last_name,
  da.vehicle_type, da.current_zone, da.rating,
  u.email AS agent_email,
  ab.email AS assigned_by_email
`;

const ASSIGNMENT_JOINS = `
  FROM parcel_assignments pa
  JOIN parcels p           ON p.id   = pa.parcel_id
  JOIN customers c         ON c.id   = p.sender_customer_id
  JOIN users ub            ON ub.id  = c.user_id
  JOIN parcel_categories cat ON cat.id = p.category_id
  LEFT JOIN addresses addr ON addr.id = p.pickup_address_id
  LEFT JOIN branches ob    ON ob.id  = p.origin_branch_id
  JOIN delivery_agents da  ON da.id  = pa.agent_id
  JOIN users u             ON u.id   = da.user_id
  LEFT JOIN users ab       ON ab.id  = pa.assigned_by
`;


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

    if (assignment_type === 'delivery') {
      await client.query(
        `UPDATE parcels SET status = 'out_for_delivery', updated_at = NOW() WHERE id = $1`,
        [parcel_id]
      );
      await client.query(
        `INSERT INTO parcel_status_history (parcel_id, status, notes, changed_by)
         VALUES ($1, 'out_for_delivery', 'Assigned to delivery agent and out for delivery', $2)`,
        [parcel_id, assigned_by || null]
      );
    } else if (assignment_type === 'pickup') {
      await client.query(
        `INSERT INTO parcel_status_history (parcel_id, status, notes, changed_by)
         VALUES ($1, 'booked', 'Assigned delivery agent for pickup', $2)`,
        [parcel_id, assigned_by || null]
      );
    }

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
/**
 * Mark an assignment as in_progress (agent has started the job).
 * Updates parcel status to 'out_for_delivery' (or 'picked_up') and logs tracking history.
 */
const startAssignment = async (assignmentId, agentId, changed_by) => {
  return withTransaction(async (client) => {
    const result = await client.query(
      `UPDATE parcel_assignments
       SET status = 'in_progress'
       WHERE id = $1 AND agent_id = $2 AND status = 'assigned'
       RETURNING *`,
      [assignmentId, agentId]
    );
    if (!result.rows[0]) return null;

    const assignment = result.rows[0];
    const targetStatus = assignment.assignment_type === 'pickup' ? 'picked_up' : 'out_for_delivery';

    // Update parcel status
    await client.query(
      `UPDATE parcels SET status = $1, updated_at = NOW() WHERE id = $2`,
      [targetStatus, assignment.parcel_id]
    );

    // Record status history
    await client.query(
      `INSERT INTO parcel_status_history (parcel_id, status, notes, changed_by)
       VALUES ($1, $2, $3, $4)`,
      [
        assignment.parcel_id,
        targetStatus,
        targetStatus === 'out_for_delivery' ? 'Out for delivery with rider' : 'Rider dispatched for pickup',
        changed_by || null,
      ]
    );

    return assignment;
  });
};

/**
 * Complete an assignment: set completed_at, increment agent's total_deliveries,
 * update parcel status to 'delivered' (or 'picked_up'), and log tracking history.
 */
const completeAssignment = async ({ assignment_id, agent_id, notes, completed_by }) => {
  return withTransaction(async (client) => {
    const result = await client.query(
      `UPDATE parcel_assignments
       SET status = 'completed', completed_at = NOW(), notes = COALESCE($1, notes)
       WHERE id = $2 AND agent_id = $3 AND status IN ('assigned', 'in_progress')
       RETURNING *`,
      [notes || null, assignment_id, agent_id]
    );
    if (!result.rows[0]) return null;

    const assignment = result.rows[0];

    // Increment total deliveries on agent profile
    await client.query(
      `UPDATE delivery_agents
       SET total_deliveries = total_deliveries + 1, updated_at = NOW()
       WHERE id = $1`,
      [agent_id]
    );

    // Update parcel status to 'delivered' (or 'picked_up')
    const targetStatus = assignment.assignment_type === 'pickup' ? 'picked_up' : 'delivered';
    await client.query(
      `UPDATE parcels
       SET status = $1,
           actual_delivery_date = CASE WHEN $1 = 'delivered' THEN NOW() ELSE actual_delivery_date END,
           updated_at = NOW()
       WHERE id = $2`,
      [targetStatus, assignment.parcel_id]
    );

    // Record status history
    await client.query(
      `INSERT INTO parcel_status_history (parcel_id, status, notes, changed_by)
       VALUES ($1, $2, $3, $4)`,
      [
        assignment.parcel_id,
        targetStatus,
        notes || (targetStatus === 'delivered' ? 'Delivered successfully by delivery agent' : 'Picked up by delivery agent'),
        completed_by || null,
      ]
    );

    return assignment;
  });
};

/**
 * Mark an assignment as failed and optionally record notes.
 */
const failAssignment = async ({ assignment_id, agent_id, notes, changed_by }) => {
  return withTransaction(async (client) => {
    const result = await client.query(
      `UPDATE parcel_assignments
       SET status = 'failed', notes = COALESCE($1, notes)
       WHERE id = $2 AND agent_id = $3 AND status IN ('assigned', 'in_progress')
       RETURNING *`,
      [notes || null, assignment_id, agent_id]
    );
    if (!result.rows[0]) return null;

    const assignment = result.rows[0];
    await client.query(
      `UPDATE parcels SET status = 'failed', updated_at = NOW() WHERE id = $1`,
      [assignment.parcel_id]
    );

    await client.query(
      `INSERT INTO parcel_status_history (parcel_id, status, notes, changed_by)
       VALUES ($1, 'failed', $2, $3)`,
      [assignment.parcel_id, notes || 'Delivery attempt failed', changed_by || null]
    );

    return assignment;
  });
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

/**
 * List all active delivery agents with branch and contact details.
 */
const findAllDeliveryAgents = async () => {
  const result = await query(
    `SELECT da.id, da.user_id, da.first_name, da.last_name, da.branch_id,
            da.vehicle_type, da.vehicle_plate_number, da.license_number,
            da.is_available, da.current_zone, da.max_parcels_per_day,
            da.rating, da.total_deliveries, da.is_active,
            u.email, u.phone, b.name as branch_name
     FROM delivery_agents da
     JOIN users u ON u.id = da.user_id
     LEFT JOIN branches b ON b.id = da.branch_id
     WHERE da.is_active = true
     ORDER BY da.first_name ASC`
  );
  return result.rows;
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
  findAllDeliveryAgents,
  createAssignment,
  reassignAgent,
  startAssignment,
  completeAssignment,
  failAssignment,
  updateAssignmentNotes,
};
