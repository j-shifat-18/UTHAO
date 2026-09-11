const { query } = require('../../database/query');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolve a date range. Defaults to current month when omitted.
 * Returns { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
 */
const resolveRange = (dateFrom, dateTo) => {
  const now  = new Date();
  const from = dateFrom || new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString().slice(0, 10);
  const to   = dateTo   || new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString().slice(0, 10);
  return { from, to };
};

// ─── 1. Daily Deliveries ──────────────────────────────────────────────────────

/**
 * Calls fn_daily_delivery_summary stored function.
 * Returns per-day counts and revenue across the given range.
 *
 * Index path: idx_parcels_status_created (status, created_at)
 * Plan note: the composite index allows a single index scan filtered by
 *   created_at range; status breakdowns are resolved via FILTER aggregates
 *   on the already-narrow result — no additional seq scan needed.
 */
const getDailyDeliveries = async (dateFrom, dateTo) => {
  const { from, to } = resolveRange(dateFrom, dateTo);
  const result = await query(
    `SELECT * FROM fn_daily_delivery_summary($1::DATE, $2::DATE)`,
    [from, to]
  );
  return { period: { from, to }, rows: result.rows };
};

// ─── 2. Monthly Revenue ───────────────────────────────────────────────────────

/**
 * Calls fn_monthly_revenue stored function.
 * Groups completed payments by calendar month.
 *
 * Index path: idx_payments_paid_at
 * Plan note: index range scan on paid_at, then DATE_TRUNC grouping happens
 *   in memory on the (already small) result set.
 */
const getMonthlyRevenue = async (dateFrom, dateTo) => {
  const { from, to } = resolveRange(dateFrom, dateTo);
  const result = await query(
    `SELECT * FROM fn_monthly_revenue($1::DATE, $2::DATE)`,
    [from, to]
  );
  return { period: { from, to }, rows: result.rows };
};

// ─── 3. Top Delivery Agents ───────────────────────────────────────────────────

/**
 * Calls fn_top_delivery_agents stored function.
 * Ranks agents by completed deliveries in the period.
 *
 * Index path: idx_assignments_agent_status (agent_id, status)
 * Plan note: index scan on the assignments table filtered to status=completed
 *   + delivery type, then nested-loop join to delivery_agents by PK.
 */
const getTopDeliveryAgents = async (dateFrom, dateTo, limit = 10) => {
  const { from, to } = resolveRange(dateFrom, dateTo);
  const result = await query(
    `SELECT * FROM fn_top_delivery_agents($1::DATE, $2::DATE, $3::INT)`,
    [from, to, limit]
  );
  return { period: { from, to }, rows: result.rows };
};

// ─── 4. Most Active Branches ──────────────────────────────────────────────────

/**
 * Calls fn_most_active_branches stored function.
 * Ranks branches by parcel volume and includes revenue, headcounts.
 *
 * Index path: idx_parcels_origin_branch + idx_parcels_created_at
 * Plan note: index scan on origin_branch_id, then date range filter via
 *   idx_parcels_created_at; GROUP BY on the small branches table is cheap.
 */
const getMostActiveBranches = async (dateFrom, dateTo, limit = 10) => {
  const { from, to } = resolveRange(dateFrom, dateTo);
  const result = await query(
    `SELECT * FROM fn_most_active_branches($1::DATE, $2::DATE, $3::INT)`,
    [from, to, limit]
  );
  return { period: { from, to }, rows: result.rows };
};

// ─── 5. Delayed Parcels ───────────────────────────────────────────────────────

/**
 * Queries the v_delayed_parcels view with optional pagination.
 * View definition: status NOT IN (delivered/cancelled/returned/failed)
 *   AND estimated_delivery_date < CURRENT_DATE
 *
 * Index path: idx_parcels_status (status) — partial index scan to exclude
 *   terminal statuses; estimated_delivery_date check is cheap given the
 *   already-reduced row set.
 * Plan note: for large tables, adding a partial index on
 *   (estimated_delivery_date) WHERE status NOT IN (...) would further improve
 *   this. Currently acceptable because delayed parcels are a small fraction.
 */
const getDelayedParcels = async ({ limit, offset, priority, branch_id }) => {
  let sql    = `SELECT * FROM v_delayed_parcels WHERE 1=1`;
  const params = [];
  let i = 1;

  if (priority)  { sql += ` AND priority = $${i++}`;           params.push(priority); }
  if (branch_id) { sql += ` AND origin_branch_id = $${i++}`;   params.push(branch_id); }

  const countResult = await query(
    `SELECT COUNT(*) AS total FROM v_delayed_parcels WHERE 1=1`
      + (priority  ? ` AND priority = '${priority}'`   : '')
      + (branch_id ? ` AND origin_branch_id = ${branch_id}` : ''),
    []
  );
  const totalCount = parseInt(countResult.rows[0].total, 10);

  sql += ` ORDER BY days_overdue DESC LIMIT $${i} OFFSET $${i + 1}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return { rows: result.rows, totalCount };
};

// ─── 6. Warehouse Occupancy ───────────────────────────────────────────────────

/**
 * Queries the v_warehouse_occupancy view.
 * current_occupancy is maintained by warehouse transfer completion logic.
 *
 * No date range needed — occupancy is a current snapshot.
 * Optional filters: branch_id, city, is_active.
 *
 * Index path: idx_warehouses_branch_id (branch_id), idx_warehouses_is_active
 */
const getWarehouseOccupancy = async ({ branch_id, city, is_active } = {}) => {
  let sql    = `SELECT * FROM v_warehouse_occupancy WHERE 1=1`;
  const params = [];
  let i = 1;

  // Default to active warehouses unless explicitly requested otherwise
  const activeFilter = is_active !== undefined ? is_active : true;
  sql += ` AND is_active = $${i++}`;
  params.push(activeFilter);

  if (branch_id) { sql += ` AND branch_id = $${i++}`; params.push(branch_id); }
  if (city)      { sql += ` AND city ILIKE $${i++}`; params.push(`%${city}%`); }

  sql += ` ORDER BY occupancy_pct DESC`;

  const result = await query(sql, params);
  return result.rows;
};

// ─── 7. Revenue by Branch ─────────────────────────────────────────────────────

/**
 * Calls fn_revenue_by_branch stored function.
 *
 * Index path: idx_payments_paid_at + idx_parcels_origin_branch
 * Plan note: hash join between payments (filtered by paid_at range via
 *   idx_payments_paid_at) and parcels (via origin_branch_id index).
 */
const getRevenueByBranch = async (dateFrom, dateTo) => {
  const { from, to } = resolveRange(dateFrom, dateTo);
  const result = await query(
    `SELECT * FROM fn_revenue_by_branch($1::DATE, $2::DATE)`,
    [from, to]
  );
  return { period: { from, to }, rows: result.rows };
};

// ─── 8. Delivery Success Rate ─────────────────────────────────────────────────

/**
 * Calls fn_delivery_success_rate stored function for overall summary,
 * then runs a supplementary breakdown by priority and by branch.
 *
 * Index path: idx_parcels_status_created composite index.
 */
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

/**
 * Calls fn_avg_delivery_time stored function for the overall average,
 * then runs a supplementary breakdown by priority tier.
 *
 * Index path: idx_status_history_status (status)
 * Plan note: two index scans on parcel_status_history (one for 'booked',
 *   one for 'delivered'), then a hash join on parcel_id. The CTEs are
 *   materialized by PostgreSQL which avoids re-scanning the same table twice.
 */
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
