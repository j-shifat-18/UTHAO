-- =============================================================================
-- MODULE 10: Reporting Views & Stored Functions
-- Run this file ONCE against the live database to create all reporting objects.
-- All statements use CREATE OR REPLACE — safe to re-run.
-- =============================================================================


-- ─── VIEW: v_daily_deliveries ─────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_daily_deliveries AS
SELECT
    p.id,
    p.tracking_number,
    p.status,
    p.priority,
    p.weight_kg,
    p.delivery_cost,
    p.is_paid,
    p.actual_delivery_date,
    p.estimated_delivery_date,
    p.created_at,
    p.delivery_city,
    p.delivery_state,
    p.origin_branch_id,
    p.destination_branch_id,
    ob.name AS origin_branch_name,
    ob.code AS origin_branch_code,
    db.name AS destination_branch_name,
    db.code AS destination_branch_code,
    cat.name AS category_name
FROM parcels p
LEFT JOIN branches ob  ON ob.id = p.origin_branch_id
LEFT JOIN branches db  ON db.id = p.destination_branch_id
JOIN parcel_categories cat ON cat.id = p.category_id;


-- ─── VIEW: v_delayed_parcels ──────────────────────────────────────────────────
-- Exposes origin_branch_id and priority so the app can filter on them.

CREATE OR REPLACE VIEW v_delayed_parcels AS
SELECT
    p.id,
    p.tracking_number,
    p.status,
    p.priority,
    p.origin_branch_id,
    p.destination_branch_id,
    p.estimated_delivery_date,
    CURRENT_DATE - p.estimated_delivery_date          AS days_overdue,
    p.delivery_city,
    p.delivery_state,
    p.delivery_cost,
    p.created_at,
    ob.name AS origin_branch_name,
    db.name AS destination_branch_name,
    c.first_name AS sender_first_name,
    c.last_name  AS sender_last_name,
    u.email      AS sender_email,
    u.phone      AS sender_phone
FROM parcels p
LEFT JOIN branches ob ON ob.id = p.origin_branch_id
LEFT JOIN branches db ON db.id = p.destination_branch_id
JOIN customers c ON c.id = p.sender_customer_id
JOIN users     u ON u.id = c.user_id
WHERE p.status NOT IN ('delivered', 'cancelled', 'returned', 'failed')
  AND p.estimated_delivery_date IS NOT NULL
  AND p.estimated_delivery_date < CURRENT_DATE;


-- ─── VIEW: v_warehouse_occupancy ─────────────────────────────────────────────

CREATE OR REPLACE VIEW v_warehouse_occupancy AS
SELECT
    w.id,
    w.name,
    w.code,
    w.city,
    w.total_capacity,
    w.current_occupancy,
    w.total_capacity - w.current_occupancy              AS available_space,
    CASE
        WHEN w.total_capacity = 0 THEN 0
        ELSE ROUND(w.current_occupancy::NUMERIC / w.total_capacity * 100, 2)
    END                                                  AS occupancy_pct,
    w.branch_id,
    b.name AS branch_name,
    b.city AS branch_city,
    w.is_active
FROM warehouses w
LEFT JOIN branches b ON b.id = w.branch_id;


-- ─── FUNCTION: fn_daily_delivery_summary ─────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_daily_delivery_summary(p_from DATE, p_to DATE)
RETURNS TABLE (
    day              DATE,
    total_booked     BIGINT,
    total_delivered  BIGINT,
    total_cancelled  BIGINT,
    total_failed     BIGINT,
    total_in_transit BIGINT,
    revenue          NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.created_at::DATE                                                   AS day,
        COUNT(*)                                                             AS total_booked,
        COUNT(*) FILTER (WHERE p.status = 'delivered')                      AS total_delivered,
        COUNT(*) FILTER (WHERE p.status = 'cancelled')                      AS total_cancelled,
        COUNT(*) FILTER (WHERE p.status = 'failed')                         AS total_failed,
        COUNT(*) FILTER (WHERE p.status IN
            ('picked_up','in_transit','at_warehouse','out_for_delivery'))    AS total_in_transit,
        COALESCE(SUM(CASE WHEN p.is_paid = true THEN p.delivery_cost ELSE 0 END), 0) AS revenue
    FROM parcels p
    WHERE p.created_at::DATE BETWEEN p_from AND p_to
    GROUP BY p.created_at::DATE
    ORDER BY day ASC;
END;
$$ LANGUAGE plpgsql;


-- ─── FUNCTION: fn_monthly_revenue ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_monthly_revenue(p_from DATE, p_to DATE)
RETURNS TABLE (
    month           DATE,
    total_revenue   NUMERIC,
    total_payments  BIGINT,
    avg_payment     NUMERIC,
    total_refunded  NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE_TRUNC('month', paid_at)::DATE                                   AS month,
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0)         AS total_revenue,
        COUNT(*)          FILTER (WHERE status = 'completed')                AS total_payments,
        COALESCE(AVG(amount) FILTER (WHERE status = 'completed'), 0)         AS avg_payment,
        COALESCE(SUM(amount) FILTER (WHERE status = 'refunded'), 0)          AS total_refunded
    FROM payments
    WHERE paid_at IS NOT NULL
      AND paid_at::DATE BETWEEN p_from AND p_to
    GROUP BY DATE_TRUNC('month', paid_at)
    ORDER BY month ASC;
END;
$$ LANGUAGE plpgsql;


-- ─── FUNCTION: fn_top_delivery_agents ────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_top_delivery_agents(
    p_from  DATE,
    p_to    DATE,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    agent_id             UUID,
    first_name           TEXT,
    last_name            TEXT,
    branch_name          TEXT,
    vehicle_type         TEXT,
    rating               NUMERIC,
    total_deliveries_all INT,
    completed_in_period  BIGINT,
    failed_in_period     BIGINT,
    success_rate_pct     NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        da.id                                                                AS agent_id,
        da.first_name::TEXT,
        da.last_name::TEXT,
        COALESCE(b.name, 'Unassigned')::TEXT                                AS branch_name,
        COALESCE(da.vehicle_type, 'unknown')::TEXT,
        da.rating,
        da.total_deliveries                                                  AS total_deliveries_all,
        COUNT(*) FILTER (WHERE pa.status = 'completed')                     AS completed_in_period,
        COUNT(*) FILTER (WHERE pa.status = 'failed')                        AS failed_in_period,
        CASE WHEN COUNT(*) = 0 THEN 0
             ELSE ROUND(
                COUNT(*) FILTER (WHERE pa.status = 'completed')::NUMERIC
                / COUNT(*)::NUMERIC * 100, 2)
        END                                                                  AS success_rate_pct
    FROM delivery_agents da
    JOIN parcel_assignments pa ON pa.agent_id = da.id
        AND pa.assignment_type = 'delivery'
        AND pa.assigned_at::DATE BETWEEN p_from AND p_to
    LEFT JOIN branches b ON b.id = da.branch_id
    WHERE da.is_active = true
    GROUP BY da.id, da.first_name, da.last_name, b.name,
             da.vehicle_type, da.rating, da.total_deliveries
    ORDER BY completed_in_period DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;


-- ─── FUNCTION: fn_most_active_branches ───────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_most_active_branches(
    p_from  DATE,
    p_to    DATE,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    branch_id        INT,
    branch_name      TEXT,
    branch_code      TEXT,
    city             TEXT,
    total_parcels    BIGINT,
    delivered        BIGINT,
    cancelled        BIGINT,
    in_progress      BIGINT,
    total_revenue    NUMERIC,
    employee_count   BIGINT,
    agent_count      BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id                                                                 AS branch_id,
        b.name::TEXT,
        b.code::TEXT,
        b.city::TEXT,
        COUNT(p.id)                                                          AS total_parcels,
        COUNT(p.id) FILTER (WHERE p.status = 'delivered')                   AS delivered,
        COUNT(p.id) FILTER (WHERE p.status = 'cancelled')                   AS cancelled,
        COUNT(p.id) FILTER (WHERE p.status NOT IN
            ('delivered','cancelled','returned','failed'))                   AS in_progress,
        COALESCE(SUM(pay.amount) FILTER (WHERE pay.status = 'completed'), 0) AS total_revenue,
        (SELECT COUNT(*) FROM employees e
         WHERE e.branch_id = b.id AND e.is_active = true)                   AS employee_count,
        (SELECT COUNT(*) FROM delivery_agents da
         WHERE da.branch_id = b.id AND da.is_active = true)                 AS agent_count
    FROM branches b
    LEFT JOIN parcels p ON p.origin_branch_id = b.id
        AND p.created_at::DATE BETWEEN p_from AND p_to
    LEFT JOIN payments pay ON pay.parcel_id = p.id
    WHERE b.is_active = true
    GROUP BY b.id, b.name, b.code, b.city
    ORDER BY total_parcels DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;


-- ─── FUNCTION: fn_revenue_by_branch ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_revenue_by_branch(p_from DATE, p_to DATE)
RETURNS TABLE (
    branch_id       INT,
    branch_name     TEXT,
    branch_code     TEXT,
    city            TEXT,
    total_revenue   NUMERIC,
    payment_count   BIGINT,
    avg_payment     NUMERIC,
    total_refunded  NUMERIC,
    net_revenue     NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id                                                                  AS branch_id,
        b.name::TEXT,
        b.code::TEXT,
        b.city::TEXT,
        COALESCE(SUM(pay.amount) FILTER (WHERE pay.status = 'completed'), 0)  AS total_revenue,
        COUNT(pay.id)  FILTER (WHERE pay.status = 'completed')                AS payment_count,
        COALESCE(AVG(pay.amount)  FILTER (WHERE pay.status = 'completed'), 0) AS avg_payment,
        COALESCE(SUM(pay.amount) FILTER (WHERE pay.status = 'refunded'),  0)  AS total_refunded,
        COALESCE(
            SUM(pay.amount) FILTER (WHERE pay.status = 'completed') -
            COALESCE(SUM(pay.amount) FILTER (WHERE pay.status = 'refunded'), 0),
        0)                                                                     AS net_revenue
    FROM branches b
    LEFT JOIN parcels  p   ON p.origin_branch_id = b.id
    LEFT JOIN payments pay ON pay.parcel_id = p.id
        AND pay.paid_at::DATE BETWEEN p_from AND p_to
    WHERE b.is_active = true
    GROUP BY b.id, b.name, b.code, b.city
    ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql;


-- ─── FUNCTION: fn_delivery_success_rate ──────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_delivery_success_rate(p_from DATE, p_to DATE)
RETURNS TABLE (
    total_parcels    BIGINT,
    delivered        BIGINT,
    failed           BIGINT,
    cancelled        BIGINT,
    returned         BIGINT,
    in_progress      BIGINT,
    success_rate_pct NUMERIC,
    failure_rate_pct NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)                                                              AS total_parcels,
        COUNT(*) FILTER (WHERE status = 'delivered')                         AS delivered,
        COUNT(*) FILTER (WHERE status = 'failed')                            AS failed,
        COUNT(*) FILTER (WHERE status = 'cancelled')                         AS cancelled,
        COUNT(*) FILTER (WHERE status = 'returned')                          AS returned,
        COUNT(*) FILTER (WHERE status IN
            ('booked','picked_up','in_transit','at_warehouse','out_for_delivery')) AS in_progress,
        CASE WHEN COUNT(*) = 0 THEN 0
             ELSE ROUND(COUNT(*) FILTER (WHERE status = 'delivered')::NUMERIC
                  / COUNT(*)::NUMERIC * 100, 2)
        END                                                                   AS success_rate_pct,
        CASE WHEN COUNT(*) = 0 THEN 0
             ELSE ROUND(COUNT(*) FILTER (WHERE status = 'failed')::NUMERIC
                  / COUNT(*)::NUMERIC * 100, 2)
        END                                                                   AS failure_rate_pct
    FROM parcels
    WHERE created_at::DATE BETWEEN p_from AND p_to;
END;
$$ LANGUAGE plpgsql;


-- ─── FUNCTION: fn_avg_delivery_time ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_avg_delivery_time(p_from DATE, p_to DATE)
RETURNS TABLE (
    avg_hours      NUMERIC,
    avg_days       NUMERIC,
    min_hours      NUMERIC,
    max_hours      NUMERIC,
    total_measured BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH booked AS (
        SELECT parcel_id, MIN(created_at) AS booked_at
        FROM parcel_status_history
        WHERE status = 'booked'
        GROUP BY parcel_id
    ),
    delivered AS (
        SELECT parcel_id, MIN(created_at) AS delivered_at
        FROM parcel_status_history
        WHERE status = 'delivered'
        GROUP BY parcel_id
    ),
    durations AS (
        SELECT EXTRACT(EPOCH FROM (d.delivered_at - b.booked_at)) / 3600 AS hours
        FROM booked b
        JOIN delivered d ON d.parcel_id = b.parcel_id
        JOIN parcels   p ON p.id = b.parcel_id
        WHERE p.created_at::DATE BETWEEN p_from AND p_to
    )
    SELECT
        ROUND(COALESCE(AVG(hours), 0)::NUMERIC, 2)       AS avg_hours,
        ROUND(COALESCE(AVG(hours) / 24, 0)::NUMERIC, 2)  AS avg_days,
        ROUND(COALESCE(MIN(hours), 0)::NUMERIC, 2)        AS min_hours,
        ROUND(COALESCE(MAX(hours), 0)::NUMERIC, 2)        AS max_hours,
        COUNT(*)                                           AS total_measured
    FROM durations;
END;
$$ LANGUAGE plpgsql;
