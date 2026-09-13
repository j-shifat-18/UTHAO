import { api } from './client'

/**
 * Reports API Service
 * All methods call the real backend and propagate errors — no mock fallbacks.
 */

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

export const reportsApi = {
  /** GET /reports/daily-deliveries */
  async getDailyDeliveries(params = {}) {
    const res = await api.get(`/reports/daily-deliveries${cleanParams(params)}`)
    return res.data?.data || { period: {}, rows: [] }
  },

  /** GET /reports/delayed-parcels */
  async getDelayedParcels(params = {}) {
    const res = await api.get(`/reports/delayed-parcels${cleanParams(params)}`)
    return {
      data: res.data?.data || [],
      meta: res.data?.meta || { page: 1, limit: 20, totalCount: 0, totalPages: 1 },
    }
  },

  /** GET /reports/warehouse-occupancy */
  async getWarehouseOccupancy(params = {}) {
    const res = await api.get(`/reports/warehouse-occupancy${cleanParams(params)}`)
    return res.data?.data || []
  },

  /** GET /reports/delivery-success-rate */
  async getDeliverySuccessRate(params = {}) {
    const res = await api.get(`/reports/delivery-success-rate${cleanParams(params)}`)
    return res.data?.data || { period: {}, summary: {}, by_priority: [], by_branch: [] }
  },

  /** GET /reports/avg-delivery-time */
  async getAvgDeliveryTime(params = {}) {
    const res = await api.get(`/reports/avg-delivery-time${cleanParams(params)}`)
    return res.data?.data || { period: {}, overall: {}, by_priority: [] }
  },

  /** GET /reports/monthly-revenue */
  async getMonthlyRevenue(params = {}) {
    const res = await api.get(`/reports/monthly-revenue${cleanParams(params)}`)
    return res.data?.data || { period: {}, rows: [] }
  },

  /** GET /reports/revenue-by-branch */
  async getRevenueByBranch(params = {}) {
    const res = await api.get(`/reports/revenue-by-branch${cleanParams(params)}`)
    return res.data?.data || { period: {}, rows: [] }
  },

  /** GET /reports/top-delivery-agents */
  async getTopDeliveryAgents(params = {}) {
    const res = await api.get(`/reports/top-delivery-agents${cleanParams(params)}`)
    return res.data?.data || { period: {}, rows: [] }
  },

  /** GET /reports/most-active-branches */
  async getMostActiveBranches(params = {}) {
    const res = await api.get(`/reports/most-active-branches${cleanParams(params)}`)
    return res.data?.data || { period: {}, rows: [] }
  },

  /** GET /branches — used to populate branch filter dropdowns */
  async getBranches() {
    const res = await api.get('/branches')
    // API returns { data: [{ id, name, code, city, ... }] }
    // Map 'code' to 'branch_code' so dropdowns can use a consistent key
    const list = res.data?.data || []
    return list.map((b) => ({ ...b, branch_code: b.code }))
  },
}
