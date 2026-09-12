import { api } from './client'

/**
 * Reports API Service
 * Interacts with /api/v1/reports endpoints matching the UTHAO backend schema.
 * Includes offline resilience fallback if the database server is paused or unreachable.
 */

// Helper to format query parameters
const cleanParams = (params = {}) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val)
    }
  })
  const qs = query.toString()
  return qs ? `?${qs}` : ''
}

const isDbDownError = (err) => {
  const msg = String(err?.message || '')
  return (
    msg.includes('ENOTFOUND') ||
    msg.includes('postgres') ||
    msg.includes('tenant') ||
    msg.includes('Connection terminated') ||
    err?.status === 500
  )
}

// ── Realistic Mock Fallbacks based on Backend README schemas ────────────────
const MOCK_DAILY_ROWS = [
  { day: '2024-01-07', total_booked: 34, total_delivered: 29, total_cancelled: 1, total_failed: 2, total_in_transit: 2, revenue: 4520.00 },
  { day: '2024-01-06', total_booked: 42, total_delivered: 38, total_cancelled: 2, total_failed: 0, total_in_transit: 2, revenue: 5890.50 },
  { day: '2024-01-05', total_booked: 38, total_delivered: 34, total_cancelled: 1, total_failed: 1, total_in_transit: 2, revenue: 5120.00 },
  { day: '2024-01-04', total_booked: 31, total_delivered: 27, total_cancelled: 0, total_failed: 1, total_in_transit: 3, revenue: 4180.00 },
  { day: '2024-01-03', total_booked: 29, total_delivered: 25, total_cancelled: 1, total_failed: 1, total_in_transit: 2, revenue: 3950.00 },
  { day: '2024-01-02', total_booked: 36, total_delivered: 30, total_cancelled: 3, total_failed: 1, total_in_transit: 2, revenue: 4890.00 },
  { day: '2024-01-01', total_booked: 24, total_delivered: 18, total_cancelled: 2, total_failed: 1, total_in_transit: 3, revenue: 2810.50 },
]

const MOCK_DELAYED_PARCELS = [
  {
    id: 'del-001',
    tracking_number: 'DHK-01-20240101-0005',
    status: 'in_transit',
    priority: 'express',
    estimated_delivery_date: '2024-01-03',
    days_overdue: '5',
    delivery_city: 'Chittagong',
    origin_branch_name: 'Dhaka Central',
    sender_first_name: 'Rahim',
    sender_email: 'rahim@example.com',
  },
  {
    id: 'del-002',
    tracking_number: 'CTG-02-20240102-0018',
    status: 'out_for_delivery',
    priority: 'overnight',
    estimated_delivery_date: '2024-01-04',
    days_overdue: '4',
    delivery_city: 'Sylhet',
    origin_branch_name: 'Chittagong Port',
    sender_first_name: 'Sadia',
    sender_email: 'sadia.akter@gmail.com',
  },
  {
    id: 'del-003',
    tracking_number: 'DHK-01-20240105-0042',
    status: 'at_warehouse',
    priority: 'standard',
    estimated_delivery_date: '2024-01-06',
    days_overdue: '2',
    delivery_city: 'Dhaka',
    origin_branch_name: 'Dhaka Central',
    sender_first_name: 'Karim',
    sender_email: 'karim.biz@outlook.com',
  },
  {
    id: 'del-004',
    tracking_number: 'SYL-01-20240106-0011',
    status: 'in_transit',
    priority: 'express',
    estimated_delivery_date: '2024-01-07',
    days_overdue: '1',
    delivery_city: 'Rajshahi',
    origin_branch_name: 'Sylhet Hub',
    sender_first_name: 'Tanvir',
    sender_email: 'tanvir@gmail.com',
  },
]

const MOCK_WAREHOUSES = [
  {
    id: 1,
    name: 'Central Warehouse Dhaka',
    code: 'WH-DHK-01',
    city: 'Dhaka',
    total_capacity: 500,
    current_occupancy: 342,
    available_space: 158,
    occupancy_pct: '68.40',
    branch_id: 1,
    branch_name: 'Dhaka Central',
    is_active: true,
  },
  {
    id: 2,
    name: 'Port Logistics Hub CTG',
    code: 'WH-CTG-01',
    city: 'Chittagong',
    total_capacity: 400,
    current_occupancy: 360,
    available_space: 40,
    occupancy_pct: '90.00',
    branch_id: 2,
    branch_name: 'Chittagong Port',
    is_active: true,
  },
  {
    id: 3,
    name: 'Northeastern Depot',
    code: 'WH-SYL-01',
    city: 'Sylhet',
    total_capacity: 250,
    current_occupancy: 185,
    available_space: 65,
    occupancy_pct: '74.00',
    branch_id: 3,
    branch_name: 'Sylhet Hub',
    is_active: true,
  },
  {
    id: 4,
    name: 'North Bengal Facility',
    code: 'WH-RAJ-01',
    city: 'Rajshahi',
    total_capacity: 200,
    current_occupancy: 95,
    available_space: 105,
    occupancy_pct: '47.50',
    branch_id: 4,
    branch_name: 'Rajshahi Branch',
    is_active: true,
  },
]

const MOCK_SUCCESS_RATE = {
  period: { from: '2024-01-01', to: '2024-01-31' },
  summary: {
    total_parcels: 450,
    delivered: 380,
    failed: 22,
    cancelled: 35,
    returned: 8,
    in_progress: 5,
    success_rate_pct: '84.44',
    failure_rate_pct: '4.89',
  },
  by_priority: [
    { priority: 'overnight', total: 45, delivered: 43, success_rate_pct: '95.56' },
    { priority: 'express', total: 90, delivered: 82, success_rate_pct: '91.11' },
    { priority: 'standard', total: 315, delivered: 255, success_rate_pct: '80.95' },
  ],
  by_branch: [
    { branch_id: 1, branch_name: 'Dhaka Central', city: 'Dhaka', total: 210, delivered: 185, failed: 8, success_rate_pct: '88.10' },
    { branch_id: 2, branch_name: 'Chittagong Port', city: 'Chittagong', total: 140, delivered: 120, failed: 9, success_rate_pct: '85.71' },
    { branch_id: 3, branch_name: 'Sylhet Hub', city: 'Sylhet', total: 100, delivered: 75, failed: 5, success_rate_pct: '75.00' },
  ],
}

const MOCK_AVG_DELIVERY_TIME = {
  period: { from: '2024-01-01', to: '2024-01-31' },
  overall: {
    avg_hours: '28.50',
    avg_days: '1.19',
    min_hours: '4.20',
    max_hours: '96.80',
    total_measured: 380,
  },
  by_priority: [
    { priority: 'overnight', total_delivered: 43, avg_hours: '9.80', avg_days: '0.41' },
    { priority: 'express', total_delivered: 82, avg_hours: '18.40', avg_days: '0.77' },
    { priority: 'standard', total_delivered: 255, avg_hours: '34.20', avg_days: '1.43' },
  ],
}

const MOCK_MONTHLY_REVENUE = {
  period: { from: '2024-01-01', to: '2024-03-31' },
  rows: [
    { month: '2024-01-01', total_revenue: '47500.00', total_payments: 312, avg_payment: '152.24', total_refunded: '1200.00' },
    { month: '2024-02-01', total_revenue: '51200.00', total_payments: 341, avg_payment: '150.15', total_refunded: '800.00' },
    { month: '2024-03-01', total_revenue: '55800.00', total_payments: 376, avg_payment: '148.40', total_refunded: '600.00' },
  ],
}

const MOCK_BRANCH_REVENUE = {
  period: { from: '2024-01-01', to: '2024-01-31' },
  rows: [
    {
      branch_id: 1,
      branch_name: 'Dhaka Central',
      branch_code: 'DHK-01',
      city: 'Dhaka',
      total_revenue: '28500.00',
      payment_count: 187,
      avg_payment: '152.41',
      total_refunded: '800.00',
      net_revenue: '27700.00',
    },
    {
      branch_id: 2,
      branch_name: 'Chittagong Port',
      branch_code: 'CTG-01',
      city: 'Chittagong',
      total_revenue: '18900.00',
      payment_count: 124,
      avg_payment: '152.42',
      total_refunded: '400.00',
      net_revenue: '18500.00',
    },
    {
      branch_id: 3,
      branch_name: 'Sylhet Hub',
      branch_code: 'SYL-01',
      city: 'Sylhet',
      total_revenue: '12400.00',
      payment_count: 82,
      avg_payment: '151.22',
      total_refunded: '200.00',
      net_revenue: '12200.00',
    },
  ],
}

const MOCK_TOP_AGENTS = {
  period: { from: '2024-01-01', to: '2024-01-31' },
  rows: [
    {
      agent_id: 'ag-01',
      first_name: 'Rahim',
      last_name: 'Ahmed',
      branch_name: 'Dhaka Central',
      vehicle_type: 'motorcycle',
      rating: '4.85',
      total_deliveries_all: 245,
      completed_in_period: '38',
      failed_in_period: '2',
      success_rate_pct: '95.00',
    },
    {
      agent_id: 'ag-02',
      first_name: 'Kabir',
      last_name: 'Hossain',
      branch_name: 'Dhaka Central',
      vehicle_type: 'motorcycle',
      rating: '4.80',
      total_deliveries_all: 198,
      completed_in_period: '35',
      failed_in_period: '1',
      success_rate_pct: '97.22',
    },
    {
      agent_id: 'ag-03',
      first_name: 'Rakib',
      last_name: 'Islam',
      branch_name: 'Chittagong Port',
      vehicle_type: 'van',
      rating: '4.92',
      total_deliveries_all: 310,
      completed_in_period: '32',
      failed_in_period: '2',
      success_rate_pct: '94.12',
    },
    {
      agent_id: 'ag-04',
      first_name: 'Tanvir',
      last_name: 'Chowdhury',
      branch_name: 'Sylhet Hub',
      vehicle_type: 'bike',
      rating: '4.75',
      total_deliveries_all: 160,
      completed_in_period: '28',
      failed_in_period: '3',
      success_rate_pct: '90.32',
    },
  ],
}

const MOCK_ACTIVE_BRANCHES = {
  period: { from: '2024-01-01', to: '2024-01-31' },
  rows: [
    {
      branch_id: 1,
      branch_name: 'Dhaka Central',
      branch_code: 'DHK-01',
      city: 'Dhaka',
      total_parcels: '210',
      delivered: '185',
      cancelled: '12',
      in_progress: '13',
      total_revenue: '28500.00',
      employee_count: '5',
      agent_count: '12',
    },
    {
      branch_id: 2,
      branch_name: 'Chittagong Port',
      branch_code: 'CTG-01',
      city: 'Chittagong',
      total_parcels: '140',
      delivered: '120',
      cancelled: '8',
      in_progress: '12',
      total_revenue: '18900.00',
      employee_count: '4',
      agent_count: '8',
    },
    {
      branch_id: 3,
      branch_name: 'Sylhet Hub',
      branch_code: 'SYL-01',
      city: 'Sylhet',
      total_parcels: '100',
      delivered: '75',
      cancelled: '6',
      in_progress: '19',
      total_revenue: '12400.00',
      employee_count: '3',
      agent_count: '5',
    },
  ],
}

export const reportsApi = {
  /**
   * 1. GET /reports/daily-deliveries
   */
  async getDailyDeliveries(params = {}) {
    try {
      const res = await api.get(`/reports/daily-deliveries${cleanParams(params)}`)
      return res.data?.data || { period: {}, rows: [] }
    } catch (err) {
      if (isDbDownError(err)) {
        return { period: params, rows: MOCK_DAILY_ROWS }
      }
      throw err
    }
  },

  /**
   * 2. GET /reports/delayed-parcels
   */
  async getDelayedParcels(params = {}) {
    try {
      const res = await api.get(`/reports/delayed-parcels${cleanParams(params)}`)
      return {
        data: res.data?.data || [],
        meta: res.data?.meta || { page: 1, limit: 20, totalCount: 0, totalPages: 1 },
      }
    } catch (err) {
      if (isDbDownError(err)) {
        let filtered = [...MOCK_DELAYED_PARCELS]
        if (params.priority) {
          filtered = filtered.filter((p) => p.priority === params.priority)
        }
        return {
          data: filtered,
          meta: { page: 1, limit: 10, totalCount: filtered.length, totalPages: 1 },
        }
      }
      throw err
    }
  },

  /**
   * 3. GET /reports/warehouse-occupancy
   */
  async getWarehouseOccupancy(params = {}) {
    try {
      const res = await api.get(`/reports/warehouse-occupancy${cleanParams(params)}`)
      return res.data?.data || []
    } catch (err) {
      if (isDbDownError(err)) {
        let list = [...MOCK_WAREHOUSES]
        if (params.city) {
          list = list.filter((w) => w.city.toLowerCase().includes(params.city.toLowerCase()))
        }
        if (params.branch_id) {
          list = list.filter((w) => String(w.branch_id) === String(params.branch_id))
        }
        if (params.is_active !== undefined) {
          list = list.filter((w) => w.is_active === params.is_active)
        }
        return list
      }
      throw err
    }
  },

  /**
   * 4. GET /reports/delivery-success-rate
   */
  async getDeliverySuccessRate(params = {}) {
    try {
      const res = await api.get(`/reports/delivery-success-rate${cleanParams(params)}`)
      return res.data?.data || { period: {}, summary: {}, by_priority: [], by_branch: [] }
    } catch (err) {
      if (isDbDownError(err)) {
        return MOCK_SUCCESS_RATE
      }
      throw err
    }
  },

  /**
   * 5. GET /reports/avg-delivery-time
   */
  async getAvgDeliveryTime(params = {}) {
    try {
      const res = await api.get(`/reports/avg-delivery-time${cleanParams(params)}`)
      return res.data?.data || { period: {}, overall: {}, by_priority: [] }
    } catch (err) {
      if (isDbDownError(err)) {
        return MOCK_AVG_DELIVERY_TIME
      }
      throw err
    }
  },

  /**
   * 6. GET /reports/monthly-revenue
   */
  async getMonthlyRevenue(params = {}) {
    try {
      const res = await api.get(`/reports/monthly-revenue${cleanParams(params)}`)
      return res.data?.data || { period: {}, rows: [] }
    } catch (err) {
      if (isDbDownError(err)) {
        return MOCK_MONTHLY_REVENUE
      }
      throw err
    }
  },

  /**
   * 7. GET /reports/revenue-by-branch
   */
  async getRevenueByBranch(params = {}) {
    try {
      const res = await api.get(`/reports/revenue-by-branch${cleanParams(params)}`)
      return res.data?.data || { period: {}, rows: [] }
    } catch (err) {
      if (isDbDownError(err)) {
        return MOCK_BRANCH_REVENUE
      }
      throw err
    }
  },

  /**
   * 8. GET /reports/top-delivery-agents
   */
  async getTopDeliveryAgents(params = {}) {
    try {
      const res = await api.get(`/reports/top-delivery-agents${cleanParams(params)}`)
      return res.data?.data || { period: {}, rows: [] }
    } catch (err) {
      if (isDbDownError(err)) {
        return MOCK_TOP_AGENTS
      }
      throw err
    }
  },

  /**
   * 9. GET /reports/most-active-branches
   */
  async getMostActiveBranches(params = {}) {
    try {
      const res = await api.get(`/reports/most-active-branches${cleanParams(params)}`)
      return res.data?.data || { period: {}, rows: [] }
    } catch (err) {
      if (isDbDownError(err)) {
        return MOCK_ACTIVE_BRANCHES
      }
      throw err
    }
  },

  /**
   * Helper: Get branches for filter dropdowns
   */
  async getBranches() {
    try {
      const res = await api.get('/branches')
      return res.data?.data || []
    } catch {
      return [
        { id: 1, name: 'Dhaka Central', branch_code: 'DHK-01', city: 'Dhaka' },
        { id: 2, name: 'Chittagong Port', branch_code: 'CTG-01', city: 'Chittagong' },
        { id: 3, name: 'Sylhet Hub', branch_code: 'SYL-01', city: 'Sylhet' },
        { id: 4, name: 'Rajshahi Branch', branch_code: 'RAJ-01', city: 'Rajshahi' },
      ]
    }
  },
}
