const { query } = require('../../database/query');



const resolveRange = (dateFrom, dateTo) => {
  const now  = new Date();
  const from = dateFrom || new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString().slice(0, 10);
  const to   = dateTo   || new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString().slice(0, 10);
  return { from, to };
};

// ─── 1. Daily Deliveries ──────────────────────────────────────────────────────

const getDailyDeliveries = async (dateFrom, dateTo) => {
  const { from, to } = resolveRange(dateFrom, dateTo);
  const result = await query(
    `SELECT
       day::TEXT,
       total_booked,
       total_delivered,
       total_cancelled,
       total_failed,
       total_in_transit,
       COALESCE(revenue, 0) AS revenue
     FROM fn_daily_delivery_summary($1::DATE, $2::DATE)`,
    [from, to]
  );
  return { period: { from, to }, rows: result.rows };
};

// ─── 2. Monthly Revenue ───────────────────────────────────────────────────────


const getMonthlyRevenue = async (dateFrom, dateTo) => {
  const { from, to } = resolveRange(dateFrom, dateTo);
  const result = await query(
    `SELECT
       month::TEXT,
       total_revenue,
       total_payments,
       avg_payment,
       total_refunded
     FROM fn_monthly_revenue($1::DATE, $2::DATE)`,
    [from, to]
  );
  return { period: { from, to }, rows: result.rows };
};

// ─── 3. Top Delivery Agents ───────────────────────────────────────────────────


const getTopDeliveryAgents = async (dateFrom, dateTo, limit = 10) => {
  const { from, to } = resolveRange(dateFrom, dateTo);
  const result = await query(
    `SELECT * FROM fn_top_delivery_agents($1::DATE, $2::DATE, $3::INT)`,
    [from, to, limit]
  );
  return { period: { from, to }, rows: result.rows };
};

// ─── 4. Most Active Branches ──────────────────────────────────────────────────


const getMostActiveBranches = async (dateFrom, dateTo, limit = 10) => {
  const { from, to } = resolveRange(dateFrom, dateTo);
  const result = await query(
    `SELECT * FROM fn_most_active_branches($1::DATE, $2::DATE, $3::INT)`,
    [from, to, limit]
  );
  return { period: { from, to }, rows: result.rows };
};

// ─── 5. Delayed Parcels ───────────────────────────────────────────────────────

const getDelayedParcels = async ({ limit, offset, priority, branch_id }) => {
  // Build a single shared WHERE clause for both the data and count queries
  const filters = [];
  const filterParams = [];
  let i = 1;

  if (priority)  { filters.push(`priority = $${i++}`);           filterParams.push(priority); }
  if (branch_id) { filters.push(`origin_branch_id = $${i++}`);   filterParams.push(branch_id); }

  const whereClause = filters.length ? ' AND ' + filters.join(' AND ') : '';

  const countResult = await query(
    `SELECT COUNT(*) AS total FROM v_delayed_parcels WHERE 1=1${whereClause}`,
    filterParams
  );
  const totalCount = parseInt(countResult.rows[0].total, 10);

  const dataParams = [...filterParams, limit, offset];
  const result = await query(
    `SELECT * FROM v_delayed_parcels WHERE 1=1${whereClause}
     ORDER BY days_overdue DESC LIMIT $${i} OFFSET $${i + 1}`,
    dataParams
  );
  return { rows: result.rows, totalCount };
};

// ─── 6. Warehouse Occupancy ───────────────────────────────────────────────────


const getWarehouseOccupancy = async ({ branch_id, city, is_active } = {}) => {
  let sql = `
    SELECT
      w.id,
      w.name            AS name,
      w.code,
      w.city,
      w.total_capacity,
      w.current_occupancy,
      w.total_capacity - w.current_occupancy AS available_space,
      CASE
        WHEN w.total_capacity = 0 THEN 0
        ELSE ROUND(w.current_occupancy::NUMERIC / w.total_capacity * 100, 2)
      END AS occupancy_pct,
      w.branch_id,
      b.name  AS branch_name,
      b.city  AS branch_city,
      w.is_active
    FROM warehouses w
    LEFT JOIN branches b ON b.id = w.branch_id
    WHERE 1=1`;
  const params = [];
  let i = 1;

  // Default to active warehouses unless explicitly requested otherwise
  const activeFilter = is_active !== undefined ? is_active : true;
  sql += ` AND w.is_active = $${i++}`;
  params.push(activeFilter);

  if (branch_id) { sql += ` AND branch_id = $${i++}`; params.push(branch_id); }
  if (city)      { sql += ` AND city ILIKE $${i++}`; params.push(`%${city}%`); }

  sql += ` ORDER BY occupancy_pct DESC`;

  const result = await query(sql, params);
  return result.rows;
};

// ─── 7. Revenue by Branch ─────────────────────────────────────────────────────


const getRevenueByBranch = async (dateFrom, dateTo) => {
  const { from, to } = resolveRange(dateFrom, dateTo);
  const result = await query(
    `SELECT * FROM fn_revenue_by_branch($1::DATE, $2::DATE)`,
    [from, to]
  );
  return { period: { from, to }, rows: result.rows };
};

// ─── 8. Delivery Success Rate ─────────────────────────────────────────────────


const getDeliverySuccessRate = async (dateFrom, dateTo) => {
  const { from, to } = resolveRange(dateFrom, dateTo);

  const [summary, byPriority, byBranch] = await Promise.all([
    query(`SELECT * FROM fn_delivery_success_rate($1::DATE, $2::DATE)`, [from, to]),

    // Breakdown by priority — uses idx_parcels_status_created
    query(
      `SELECT
         priority,
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
         COUNT(*) FILTER (WHERE status = 'failed')    AS failed,
         CASE WHEN COUNT(*) = 0 THEN 0
              ELSE ROUND(COUNT(*) FILTER (WHERE status = 'delivered')::NUMERIC
                   / COUNT(*)::NUMERIC * 100, 2)
         END AS success_rate_pct
       FROM parcels
       WHERE created_at::DATE BETWEEN $1 AND $2
       GROUP BY priority
       ORDER BY priority`,
      [from, to]
    ),

    // Breakdown by origin branch — uses idx_parcels_origin_branch
    query(
      `SELECT
         b.id AS branch_id, b.name AS branch_name, b.city,
         COUNT(p.id) AS total,
         COUNT(p.id) FILTER (WHERE p.status = 'delivered') AS delivered,
         COUNT(p.id) FILTER (WHERE p.status = 'failed')    AS failed,
         CASE WHEN COUNT(p.id) = 0 THEN 0
              ELSE ROUND(COUNT(p.id) FILTER (WHERE p.status = 'delivered')::NUMERIC
                   / COUNT(p.id)::NUMERIC * 100, 2)
         END AS success_rate_pct
       FROM branches b
       LEFT JOIN parcels p ON p.origin_branch_id = b.id
         AND p.created_at::DATE BETWEEN $1 AND $2
       WHERE b.is_active = true
       GROUP BY b.id, b.name, b.city
       ORDER BY total DESC`,
      [from, to]
    ),
  ]);

  return {
    period: { from, to },
    summary:     summary.rows[0],
    by_priority: byPriority.rows,
    by_branch:   byBranch.rows,
  };
};

// ─── 9. Average Delivery Time ─────────────────────────────────────────────────


const getAvgDeliveryTime = async (dateFrom, dateTo) => {
  const { from, to } = resolveRange(dateFrom, dateTo);

  const [overall, byPriority] = await Promise.all([
    query(`SELECT * FROM fn_avg_delivery_time($1::DATE, $2::DATE)`, [from, to]),

    query(
      `WITH booked AS (
         SELECT parcel_id, MIN(created_at) AS booked_at
         FROM parcel_status_history WHERE status = 'booked'
         GROUP BY parcel_id
       ),
       delivered AS (
         SELECT parcel_id, MIN(created_at) AS delivered_at
         FROM parcel_status_history WHERE status = 'delivered'
         GROUP BY parcel_id
       )
       SELECT
         p.priority,
         COUNT(*)                                                         AS total_delivered,
         ROUND(AVG(EXTRACT(EPOCH FROM (d.delivered_at - b.booked_at))
               / 3600)::NUMERIC, 2)                                      AS avg_hours,
         ROUND(AVG(EXTRACT(EPOCH FROM (d.delivered_at - b.booked_at))
               / 86400)::NUMERIC, 2)                                     AS avg_days
       FROM booked b
       JOIN delivered d ON d.parcel_id = b.parcel_id
       JOIN parcels   p ON p.id = b.parcel_id
       WHERE p.created_at::DATE BETWEEN $1 AND $2
       GROUP BY p.priority
       ORDER BY p.priority`,
      [from, to]
    ),
  ]);

  return {
    period: { from, to },
    overall:     overall.rows[0],
    by_priority: byPriority.rows,
  };
};

module.exports = {
  getDailyDeliveries,
  getMonthlyRevenue,
  getTopDeliveryAgents,
  getMostActiveBranches,
  getDelayedParcels,
  getWarehouseOccupancy,
  getRevenueByBranch,
  getDeliverySuccessRate,
  getAvgDeliveryTime,
};
