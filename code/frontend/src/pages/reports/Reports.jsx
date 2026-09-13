import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext.jsx'
import { reportsApi } from '../../api/reportsApi.js'
import { PageHeader, EmptyState, Pagination } from '../../components/Bits.jsx'
import {
  BarChart3,
  Calendar,
  Clock,
  AlertTriangle,
  Warehouse,
  TrendingUp,
  DollarSign,
  Award,
  Building2,
  RefreshCw,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  Truck,
  ArrowUpRight,
  ShieldAlert,
  Search,
} from 'lucide-react'

// Tab definitions
const TABS = [
  { id: 'daily', label: 'Daily Activity', icon: Calendar, minRole: 'staff' },
  { id: 'delayed', label: 'Delayed Parcels', icon: AlertTriangle, minRole: 'staff' },
  { id: 'occupancy', label: 'Warehouse Capacity', icon: Warehouse, minRole: 'staff' },
  { id: 'performance', label: 'Delivery Performance', icon: TrendingUp, minRole: 'staff' },
  { id: 'revenue', label: 'Revenue & Branches', icon: DollarSign, minRole: 'admin' },
  { id: 'agents', label: 'Top Agents & Volume', icon: Award, minRole: 'admin' },
]

// Date helpers
const getPresetRange = (preset) => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const formatDate = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  if (preset === 'this_month') {
    const from = new Date(year, month, 1)
    const to = new Date(year, month + 1, 0)
    return { from: formatDate(from), to: formatDate(to) }
  }
  if (preset === 'last_30_days') {
    const from = new Date()
    from.setDate(now.getDate() - 30)
    return { from: formatDate(from), to: formatDate(now) }
  }
  if (preset === 'last_7_days') {
    const from = new Date()
    from.setDate(now.getDate() - 7)
    return { from: formatDate(from), to: formatDate(now) }
  }
  if (preset === 'this_year') {
    const from = new Date(year, 0, 1)
    const to = new Date(year, 11, 31)
    return { from: formatDate(from), to: formatDate(to) }
  }
  return { from: '', to: '' }
}

// Safely format any date value to YYYY-MM-DD
// Handles both ISO timestamps (2026-09-12T00:00:00.000Z) and plain dates
const formatDate = (val) => {
  if (!val) return '—'
  // Already a plain date string
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(val))) return val
  // ISO timestamp — slice the date part
  const s = String(val)
  return s.slice(0, 10)
}

export default function Reports() {
  const { user, isAdminLike, isStaff } = useAuth()

  // Active tab state
  const [activeTab, setActiveTab] = useState('daily')

  // Date Range state (defaults to current month)
  const initialRange = useMemo(() => getPresetRange('this_month'), [])
  const [datePreset, setDatePreset] = useState('this_month')
  const [dateFrom, setDateFrom] = useState(initialRange.from)
  const [dateTo, setDateTo] = useState(initialRange.to)

  // Global branches list for dropdown filters
  const [branches, setBranches] = useState([])

  // Loading and error states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Report Data States
  const [dailyData, setDailyData] = useState({ period: {}, rows: [] })
  const [delayedData, setDelayedData] = useState({ data: [], meta: { page: 1, limit: 10, totalCount: 0, totalPages: 1 } })
  const [occupancyData, setOccupancyData] = useState([])
  const [successRateData, setSuccessRateData] = useState({ period: {}, summary: {}, by_priority: [], by_branch: [] })
  const [avgTimeData, setAvgTimeData] = useState({ period: {}, overall: {}, by_priority: [] })
  const [monthlyRevenueData, setMonthlyRevenueData] = useState({ period: {}, rows: [] })
  const [branchRevenueData, setBranchRevenueData] = useState({ period: {}, rows: [] })
  const [topAgentsData, setTopAgentsData] = useState({ period: {}, rows: [] })
  const [mostActiveBranchesData, setMostActiveBranchesData] = useState({ period: {}, rows: [] })

  // Filters for Delayed Parcels
  const [delayedPriority, setDelayedPriority] = useState('')
  const [delayedBranch, setDelayedBranch] = useState('')
  const [delayedPage, setDelayedPage] = useState(1)

  // Filters for Warehouse Occupancy
  const [occupancyBranch, setOccupancyBranch] = useState('')
  const [occupancyCity, setOccupancyCity] = useState('')
  const [occupancyActiveOnly, setOccupancyActiveOnly] = useState(true)

  // Load branches once for filter dropdowns — errors are non-fatal
  useEffect(() => {
    reportsApi.getBranches()
      .then((list) => setBranches(list || []))
      .catch(() => {
        // Dropdowns stay empty; user can still use all other filters
      })
  }, [])

  // Quick preset selector
  const handlePresetChange = (preset) => {
    setDatePreset(preset)
    if (preset !== 'custom') {
      const range = getPresetRange(preset)
      setDateFrom(range.from)
      setDateTo(range.to)
    }
  }

  // Fetch report data based on active tab
  const fetchReportData = useCallback(async () => {
    setLoading(true)
    setError('')

    const dateParams = {}
    if (dateFrom) dateParams.date_from = dateFrom
    if (dateTo) dateParams.date_to = dateTo

    try {
      if (activeTab === 'daily') {
        const res = await reportsApi.getDailyDeliveries(dateParams)
        setDailyData(res)
      } else if (activeTab === 'delayed') {
        const res = await reportsApi.getDelayedParcels({
          priority: delayedPriority,
          branch_id: delayedBranch,
          page: delayedPage,
          limit: 10,
        })
        setDelayedData(res)
      } else if (activeTab === 'occupancy') {
        const res = await reportsApi.getWarehouseOccupancy({
          branch_id: occupancyBranch,
          city: occupancyCity,
          is_active: occupancyActiveOnly,
        })
        setOccupancyData(res)
      } else if (activeTab === 'performance') {
        const [successRes, timeRes] = await Promise.all([
          reportsApi.getDeliverySuccessRate(dateParams),
          reportsApi.getAvgDeliveryTime(dateParams),
        ])
        setSuccessRateData(successRes)
        setAvgTimeData(timeRes)
      } else if (activeTab === 'revenue') {
        if (!isAdminLike) return
        const [monthlyRes, branchRes] = await Promise.all([
          reportsApi.getMonthlyRevenue(dateParams),
          reportsApi.getRevenueByBranch(dateParams),
        ])
        setMonthlyRevenueData(monthlyRes)
        setBranchRevenueData(branchRes)
      } else if (activeTab === 'agents') {
        if (!isAdminLike) return
        const [agentsRes, activeBranchesRes] = await Promise.all([
          reportsApi.getTopDeliveryAgents({ ...dateParams, limit: 10 }),
          reportsApi.getMostActiveBranches({ ...dateParams, limit: 10 }),
        ])
        setTopAgentsData(agentsRes)
        setMostActiveBranchesData(activeBranchesRes)
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch report data.')
    } finally {
      setLoading(false)
    }
  }, [
    activeTab,
    dateFrom,
    dateTo,
    delayedPriority,
    delayedBranch,
    delayedPage,
    occupancyBranch,
    occupancyCity,
    occupancyActiveOnly,
    isAdminLike,
  ])

  useEffect(() => {
    fetchReportData()
  }, [fetchReportData])

  // CSV Export utility
  const handleExportCSV = () => {
    let rows = []
    let filename = `uthao-report-${activeTab}-${dateFrom || 'all'}-to-${dateTo || 'now'}.csv`

    if (activeTab === 'daily') {
      rows = (dailyData.rows || []).map((r) => ({
        Date: formatDate(r.day),
        'Booked': r.total_booked,
        'Delivered': r.total_delivered,
        'In Transit': r.total_in_transit,
        'Cancelled': r.total_cancelled,
        'Failed': r.total_failed,
        'Revenue (BDT)': r.revenue,
      }))
    } else if (activeTab === 'delayed') {
      rows = (delayedData.data || []).map((r) => ({
        'Tracking Number': r.tracking_number,
        'Priority': r.priority,
        'Days Overdue': r.days_overdue,
        'Estimated Delivery': r.estimated_delivery_date,
        'Status': r.status,
        'City': r.delivery_city,
        'Origin Branch': r.origin_branch_name,
        'Sender': r.sender_first_name,
      }))
    } else if (activeTab === 'occupancy') {
      rows = occupancyData.map((r) => ({
        'Warehouse': r.name,
        'Code': r.code,
        'Branch': r.branch_name,
        'City': r.city,
        'Total Capacity': r.total_capacity,
        'Current Occupancy': r.current_occupancy,
        'Available Space': r.available_space,
        'Occupancy %': r.occupancy_pct,
        'Status': r.is_active ? 'Active' : 'Inactive',
      }))
    } else if (activeTab === 'performance') {
      rows = (successRateData.by_priority || []).map((r) => ({
        'Priority Tier': r.priority,
        'Total Parcels': r.total,
        'Delivered': r.delivered,
        'Success Rate %': r.success_rate_pct,
      }))
    } else if (activeTab === 'revenue') {
      rows = (monthlyRevenueData.rows || []).map((r) => ({
        'Month': formatDate(r.month),
        'Total Revenue (BDT)': r.total_revenue,
        'Payments Count': r.total_payments,
        'Avg Payment (BDT)': r.avg_payment,
        'Total Refunded (BDT)': r.total_refunded,
      }))
    } else if (activeTab === 'agents') {
      rows = (topAgentsData.rows || []).map((r) => ({
        'Agent Name': `${r.first_name || ''} ${r.last_name || ''}`.trim(),
        'Branch': r.branch_name,
        'Vehicle': r.vehicle_type,
        'Rating': r.rating,
        'Completed In Period': r.completed_in_period,
        'Failed In Period': r.failed_in_period,
        'Success Rate %': r.success_rate_pct,
        'Lifetime Deliveries': r.total_deliveries_all,
      }))
    }

    if (rows.length === 0) {
      alert('No data to export for this view.')
      return
    }

    const headers = Object.keys(rows[0])
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Daily totals calculation
  const dailyTotals = useMemo(() => {
    const rows = dailyData.rows || []
    return rows.reduce(
      (acc, curr) => ({
        booked: acc.booked + Number(curr.total_booked || 0),
        delivered: acc.delivered + Number(curr.total_delivered || 0),
        cancelled: acc.cancelled + Number(curr.total_cancelled || 0),
        failed: acc.failed + Number(curr.total_failed || 0),
        in_transit: acc.in_transit + Number(curr.total_in_transit || 0),
        revenue: acc.revenue + Number(curr.revenue || 0),
      }),
      { booked: 0, delivered: 0, cancelled: 0, failed: 0, in_transit: 0, revenue: 0 }
    )
  }, [dailyData])

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        eyebrow="Intelligence & Metrics"
        title="Reports & Analytics"
        sub="Monitor delivery SLAs, track delayed shipments, analyze warehouse capacity, and review revenue."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchReportData()}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-gray-900 transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-xl transition-all shadow-sm"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        }
      />

      {/* Global Date Range & Presets Filter */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mr-1 flex items-center gap-1">
              <Calendar size={14} className="text-red-500" />
              Period:
            </span>
            {[
              { key: 'this_month', label: 'This Month' },
              { key: 'last_30_days', label: 'Last 30 Days' },
              { key: 'last_7_days', label: 'Last 7 Days' },
              { key: 'this_year', label: 'This Year' },
              { key: 'custom', label: 'Custom' },
            ].map((preset) => (
              <button
                key={preset.key}
                onClick={() => handlePresetChange(preset.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  datePreset === preset.key
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5">
              <span className="text-xs text-gray-400">From</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDatePreset('custom')
                  setDateFrom(e.target.value)
                }}
                className="bg-transparent text-xs font-mono font-medium text-gray-800 outline-none cursor-pointer"
              />
            </div>
            <span className="text-gray-400 text-xs font-bold">→</span>
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5">
              <span className="text-xs text-gray-400">To</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDatePreset('custom')
                  setDateTo(e.target.value)
                }}
                className="bg-transparent text-xs font-mono font-medium text-gray-800 outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs Bar */}
      <div className="flex overflow-x-auto border-b border-gray-200 gap-2 pb-px scrollbar-none">
        {TABS.map((tab) => {
          const TabIcon = tab.icon
          const isRestricted = tab.minRole === 'admin' && !isAdminLike
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (!isRestricted) setActiveTab(tab.id)
              }}
              disabled={isRestricted}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'border-red-600 text-red-600 font-semibold'
                  : isRestricted
                  ? 'border-transparent text-gray-300 cursor-not-allowed'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <TabIcon size={16} />
              <span>{tab.label}</span>
              {isRestricted && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">
                  Admin
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* TAB CONTENT: 1. DAILY ACTIVITY */}
      {activeTab === 'daily' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Daily KPI summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Booked</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{dailyTotals.booked.toLocaleString()}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-green-600">Delivered</p>
              <p className="text-xl font-bold text-green-700 mt-1">{dailyTotals.delivered.toLocaleString()}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-500">In Transit</p>
              <p className="text-xl font-bold text-blue-700 mt-1">{dailyTotals.in_transit.toLocaleString()}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-yellow-600">Cancelled</p>
              <p className="text-xl font-bold text-yellow-700 mt-1">{dailyTotals.cancelled.toLocaleString()}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-red-500">Failed</p>
              <p className="text-xl font-bold text-red-600 mt-1">{dailyTotals.failed.toLocaleString()}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Revenue</p>
              <p className="text-xl font-bold text-gray-900 mt-1">৳{dailyTotals.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Daily Table */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Day-by-Day Delivery & Revenue Breakdown</h3>
              <span className="text-xs text-gray-400">
                {dailyData.rows?.length || 0} active days recorded
              </span>
            </div>

            {loading ? (
              <div className="py-16 text-center text-sm text-gray-400 font-mono">Loading daily report...</div>
            ) : dailyData.rows?.length === 0 ? (
              <EmptyState title="No daily records" message="No parcel events recorded for this selected period." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Booked</th>
                      <th className="px-5 py-3">Delivered</th>
                      <th className="px-5 py-3">In Transit</th>
                      <th className="px-5 py-3">Cancelled</th>
                      <th className="px-5 py-3">Failed</th>
                      <th className="px-5 py-3">Fulfillment</th>
                      <th className="px-5 py-3 text-right">Revenue (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dailyData.rows.map((row, idx) => {
                      const bookedNum = Number(row.total_booked || 0)
                      const delNum = Number(row.total_delivered || 0)
                      const pct = bookedNum > 0 ? Math.round((delNum / bookedNum) * 100) : 0

                      return (
                        <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                          <td className="px-5 py-3.5 font-mono text-xs font-semibold text-gray-900">
                            {formatDate(row.day)}
                          </td>
                          <td className="px-5 py-3.5 text-gray-700 font-medium">{row.total_booked}</td>
                          <td className="px-5 py-3.5 text-green-700 font-semibold">{row.total_delivered}</td>
                          <td className="px-5 py-3.5 text-blue-600 font-medium">{row.total_in_transit}</td>
                          <td className="px-5 py-3.5 text-yellow-600">{row.total_cancelled}</td>
                          <td className="px-5 py-3.5 text-red-600">{row.total_failed}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono text-gray-500">{pct}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono font-semibold text-gray-900">
                            ৳{Number(row.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* TAB CONTENT: 2. DELAYED PARCELS */}
      {activeTab === 'delayed' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter size={15} className="text-gray-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Filter By:</span>
              </div>

              <select
                value={delayedPriority}
                onChange={(e) => {
                  setDelayedPriority(e.target.value)
                  setDelayedPage(1)
                }}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-red-500"
              >
                <option value="">All Priorities</option>
                <option value="overnight">Overnight</option>
                <option value="express">Express</option>
                <option value="standard">Standard</option>
              </select>

              <select
                value={delayedBranch}
                onChange={(e) => {
                  setDelayedBranch(e.target.value)
                  setDelayedPage(1)
                }}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-red-500"
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.branch_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-gray-500">
              Found <span className="font-semibold text-gray-900">{delayedData.meta.totalCount}</span> delayed shipment(s)
            </div>
          </div>

          {/* Delayed Parcels Table */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Overdue Shipments Requiring Attention</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Parcels currently past their estimated delivery date (v_delayed_parcels)
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                <AlertTriangle size={12} />
                SLA Breached
              </span>
            </div>

            {loading ? (
              <div className="py-16 text-center text-sm text-gray-400 font-mono">Loading delayed parcels...</div>
            ) : delayedData.data?.length === 0 ? (
              <EmptyState title="No overdue parcels!" message="All active parcels are currently within scheduled delivery windows." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Tracking Number</th>
                      <th className="px-5 py-3">Days Overdue</th>
                      <th className="px-5 py-3">Priority</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Est. Delivery</th>
                      <th className="px-5 py-3">Destination City</th>
                      <th className="px-5 py-3">Origin Branch</th>
                      <th className="px-5 py-3">Sender</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {delayedData.data.map((parcel) => {
                      const days = Number(parcel.days_overdue || 0)
                      return (
                        <tr key={parcel.id || parcel.tracking_number} className="hover:bg-red-50/40 transition-colors">
                          <td className="px-5 py-3.5">
                            <span className="font-mono text-xs font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded border border-dashed border-gray-300">
                              {parcel.tracking_number}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-0.5 rounded-full ${
                              days >= 4 ? 'bg-red-100 text-red-700 font-extrabold' : 'bg-amber-100 text-amber-800'
                            }`}>
                              +{days} day{days !== 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`capitalize text-xs font-semibold px-2 py-0.5 rounded ${
                              parcel.priority === 'overnight'
                                ? 'bg-purple-100 text-purple-700'
                                : parcel.priority === 'express'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {parcel.priority}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-xs font-medium text-gray-700 capitalize bg-gray-100 px-2 py-0.5 rounded">
                              {parcel.status?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs font-mono text-gray-600">
                            {formatDate(parcel.estimated_delivery_date)}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-gray-900 font-medium">
                            {parcel.delivery_city}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-gray-600">
                            {parcel.origin_branch_name || 'N/A'}
                          </td>
                          <td className="px-5 py-3.5 text-xs">
                            <p className="font-medium text-gray-900">{parcel.sender_first_name || 'Customer'}</p>
                            {parcel.sender_email && (
                              <p className="text-gray-400 text-[11px]">{parcel.sender_email}</p>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="px-5 py-3 border-t border-gray-100">
              <Pagination
                page={delayedData.meta.page}
                totalPages={delayedData.meta.totalPages}
                hasPrevPage={delayedData.meta.page > 1}
                hasNextPage={delayedData.meta.page < delayedData.meta.totalPages}
                onChange={(p) => setDelayedPage(p)}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB CONTENT: 3. WAREHOUSE OCCUPANCY */}
      {activeTab === 'occupancy' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Warehouse size={15} className="text-gray-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Warehouse Filters:</span>
              </div>

              <select
                value={occupancyBranch}
                onChange={(e) => setOccupancyBranch(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-red-500"
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Filter by City..."
                value={occupancyCity}
                onChange={(e) => setOccupancyCity(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-red-500"
              />

              <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={occupancyActiveOnly}
                  onChange={(e) => setOccupancyActiveOnly(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                Active Warehouses Only
              </label>
            </div>

            <span className="text-xs text-gray-400">Live Snapshot (v_warehouse_occupancy)</span>
          </div>

          {/* Live Capacity Cards Grid */}
          {loading ? (
            <div className="py-16 text-center text-sm text-gray-400 font-mono">Loading warehouse occupancy snapshot...</div>
          ) : occupancyData.length === 0 ? (
            <EmptyState title="No warehouses found" message="No warehouses match your current filter parameters." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {occupancyData.map((wh) => {
                const pct = parseFloat(wh.occupancy_pct || 0)
                const isCritical = pct >= 85
                const isModerate = pct >= 70 && pct < 85

                return (
                  <div
                    key={wh.id}
                    className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-gray-900">{wh.name}</h4>
                            {!wh.is_active && (
                              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {wh.branch_name || 'Branch'} • {wh.city}
                          </p>
                        </div>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                          {wh.code}
                        </span>
                      </div>

                      {/* Percentage Gauge */}
                      <div className="my-4">
                        <div className="flex items-baseline justify-between mb-1.5">
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Occupancy</span>
                          <span className={`text-lg font-bold font-mono ${
                            isCritical ? 'text-red-600' : isModerate ? 'text-amber-600' : 'text-green-600'
                          }`}>
                            {wh.occupancy_pct}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCritical ? 'bg-red-500' : isModerate ? 'bg-amber-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stats footer */}
                    <div className="pt-3 border-t border-gray-100 grid grid-cols-3 text-center gap-2">
                      <div className="bg-gray-50 rounded-lg py-1.5">
                        <p className="text-[10px] text-gray-400 font-semibold uppercase">Total</p>
                        <p className="text-sm font-bold text-gray-800">{wh.total_capacity}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg py-1.5">
                        <p className="text-[10px] text-gray-400 font-semibold uppercase">Occupied</p>
                        <p className="text-sm font-bold text-gray-800">{wh.current_occupancy}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg py-1.5">
                        <p className="text-[10px] text-gray-400 font-semibold uppercase">Available</p>
                        <p className="text-sm font-bold text-green-600">{wh.available_space}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* TAB CONTENT: 4. DELIVERY PERFORMANCE */}
      {activeTab === 'performance' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Performance Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Success Rate</span>
                <span className="p-1.5 rounded-lg bg-green-50 text-green-600">
                  <CheckCircle2 size={16} />
                </span>
              </div>
              <p className="text-2xl font-bold text-green-700">
                {successRateData.summary?.success_rate_pct || '0.00'}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {successRateData.summary?.delivered || 0} of {successRateData.summary?.total_parcels || 0} parcels completed
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Failure Rate</span>
                <span className="p-1.5 rounded-lg bg-red-50 text-red-600">
                  <XCircle size={16} />
                </span>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {successRateData.summary?.failure_rate_pct || '0.00'}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {successRateData.summary?.failed || 0} delivery attempts failed
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Avg Delivery Speed</span>
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Clock size={16} />
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {avgTimeData.overall?.avg_hours ? `${avgTimeData.overall.avg_hours} hrs` : 'N/A'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                ≈ {avgTimeData.overall?.avg_days || '0'} days from booking to delivery
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Speed Extremes</span>
                <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                  <Truck size={16} />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-gray-500">Min: <strong className="text-green-600">{avgTimeData.overall?.min_hours || 0}h</strong></span>
                <span className="text-gray-300">•</span>
                <span className="text-xs text-gray-500">Max: <strong className="text-red-500">{avgTimeData.overall?.max_hours || 0}h</strong></span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Based on {avgTimeData.overall?.total_measured || 0} tracked journeys
              </p>
            </div>
          </div>

          {/* Breakdown by Priority Tier */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Success by Priority */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Success Rate by Priority Tier</h3>
              <p className="text-xs text-gray-500 mb-4">Parcels meeting SLA targets grouped by tier</p>

              <div className="space-y-4">
                {(successRateData.by_priority || []).map((p) => {
                  const rate = parseFloat(p.success_rate_pct || 0)
                  return (
                    <div key={p.priority} className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="capitalize text-xs font-bold text-gray-800">{p.priority}</span>
                          <span className="text-xs text-gray-400">({p.delivered} / {p.total})</span>
                        </div>
                        <span className="text-xs font-bold font-mono text-gray-900">{rate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${rate >= 90 ? 'bg-green-500' : rate >= 75 ? 'bg-amber-500' : 'bg-red-400'}`}
                          style={{ width: `${Math.min(rate, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Average Speed by Priority */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Average Delivery Time by Priority</h3>
              <p className="text-xs text-gray-500 mb-4">Calculated from parcel status history (booked → delivered)</p>

              <div className="space-y-3">
                {(avgTimeData.by_priority || []).map((p) => (
                  <div key={p.priority} className="p-3.5 bg-gray-50 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="capitalize text-xs font-bold text-gray-900">{p.priority}</p>
                      <p className="text-[11px] text-gray-400">{p.total_delivered} total delivered parcels</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 font-mono">{p.avg_hours} hrs</p>
                      <p className="text-[11px] text-gray-500 font-mono">{p.avg_days} days</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Success by Branch */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Success Rate by Origin Branch</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Branch Name</th>
                    <th className="px-5 py-3">City</th>
                    <th className="px-5 py-3">Total Parcels</th>
                    <th className="px-5 py-3">Delivered</th>
                    <th className="px-5 py-3">Failed</th>
                    <th className="px-5 py-3">Success Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(successRateData.by_branch || []).map((b) => (
                    <tr key={b.branch_id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-gray-900">{b.branch_name}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">{b.city}</td>
                      <td className="px-5 py-3.5 font-medium text-gray-700">{b.total}</td>
                      <td className="px-5 py-3.5 text-green-700 font-semibold">{b.delivered}</td>
                      <td className="px-5 py-3.5 text-red-600 font-medium">{b.failed}</td>
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-gray-900">
                        {b.success_rate_pct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB CONTENT: 5. REVENUE & BRANCHES (ADMIN / MANAGER ONLY) */}
      {activeTab === 'revenue' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {!isAdminLike ? (
            <div className="p-8 text-center bg-white border border-gray-200 rounded-2xl">
              <ShieldAlert size={32} className="mx-auto text-amber-500 mb-2" />
              <h3 className="text-base font-bold text-gray-900">Management Access Required</h3>
              <p className="text-sm text-gray-500 mt-1">
                Financial revenue metrics are restricted to Administrators and Managers.
              </p>
            </div>
          ) : (
            <>
              {/* Monthly Revenue Section */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Monthly Revenue Summary</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Completed payments aggregated by calendar month</p>
                  </div>
                  <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    fn_monthly_revenue
                  </span>
                </div>

                {loading ? (
                  <div className="py-16 text-center text-sm text-gray-400 font-mono">Loading revenue...</div>
                ) : monthlyRevenueData.rows?.length === 0 ? (
                  <EmptyState title="No monthly revenue data" message="No completed payments recorded for this period." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="px-5 py-3">Calendar Month</th>
                          <th className="px-5 py-3">Total Completed Payments</th>
                          <th className="px-5 py-3">Average Transaction</th>
                          <th className="px-5 py-3">Total Refunded</th>
                          <th className="px-5 py-3 text-right">Gross Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {monthlyRevenueData.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                            <td className="px-5 py-3.5 font-mono text-xs font-bold text-gray-900">{formatDate(row.month)}</td>
                            <td className="px-5 py-3.5 text-gray-700 font-medium">{row.total_payments}</td>
                            <td className="px-5 py-3.5 font-mono text-xs text-gray-600">
                              ৳{Number(row.avg_payment || 0).toFixed(2)}
                            </td>
                            <td className="px-5 py-3.5 font-mono text-xs text-red-600">
                              ৳{Number(row.total_refunded || 0).toFixed(2)}
                            </td>
                            <td className="px-5 py-3.5 font-mono text-xs font-bold text-right text-gray-900">
                              ৳{Number(row.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Revenue by Branch Section */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Revenue Contribution by Branch</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Gross collections minus processed refunds per branch</p>
                  </div>
                  <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    fn_revenue_by_branch
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3">Branch</th>
                        <th className="px-5 py-3">Code</th>
                        <th className="px-5 py-3">City</th>
                        <th className="px-5 py-3">Transactions</th>
                        <th className="px-5 py-3">Gross Revenue</th>
                        <th className="px-5 py-3">Refunds</th>
                        <th className="px-5 py-3 text-right">Net Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(branchRevenueData.rows || []).map((r) => (
                        <tr key={r.branch_id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-gray-900">{r.branch_name}</td>
                          <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{r.branch_code}</td>
                          <td className="px-5 py-3.5 text-xs text-gray-600">{r.city}</td>
                          <td className="px-5 py-3.5 text-gray-700 font-medium">{r.payment_count}</td>
                          <td className="px-5 py-3.5 font-mono text-xs text-gray-800">
                            ৳{Number(r.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs text-red-600">
                            ৳{Number(r.total_refunded || 0).toFixed(2)}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs font-bold text-right text-green-700">
                            ৳{Number(r.net_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* TAB CONTENT: 6. TOP AGENTS & VOLUME (ADMIN / MANAGER ONLY) */}
      {activeTab === 'agents' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {!isAdminLike ? (
            <div className="p-8 text-center bg-white border border-gray-200 rounded-2xl">
              <ShieldAlert size={32} className="mx-auto text-amber-500 mb-2" />
              <h3 className="text-base font-bold text-gray-900">Management Access Required</h3>
              <p className="text-sm text-gray-500 mt-1">
                Leaderboards and operational volume rankings are restricted to Administrators and Managers.
              </p>
            </div>
          ) : (
            <>
              {/* Top Delivery Agents Leaderboard */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Top Performing Delivery Agents</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Ranked by completions within selected period</p>
                  </div>
                  <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    fn_top_delivery_agents
                  </span>
                </div>

                {loading ? (
                  <div className="py-16 text-center text-sm text-gray-400 font-mono">Loading agent performance...</div>
                ) : topAgentsData.rows?.length === 0 ? (
                  <EmptyState title="No agent completions" message="No rider assignments completed in this period." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="px-5 py-3">Rank</th>
                          <th className="px-5 py-3">Agent Name</th>
                          <th className="px-5 py-3">Branch</th>
                          <th className="px-5 py-3">Vehicle</th>
                          <th className="px-5 py-3">Rating</th>
                          <th className="px-5 py-3">Completed in Period</th>
                          <th className="px-5 py-3">Failed</th>
                          <th className="px-5 py-3">Success Rate</th>
                          <th className="px-5 py-3 text-right">Lifetime Deliveries</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {topAgentsData.rows.map((agent, index) => (
                          <tr key={agent.agent_id || index} className="hover:bg-gray-50/70 transition-colors">
                            <td className="px-5 py-3.5">
                              {index === 0 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                                  🥇 1
                                </span>
                              ) : index === 1 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs">
                                  🥈 2
                                </span>
                              ) : index === 2 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-800 font-bold text-xs">
                                  🥉 3
                                </span>
                              ) : (
                                <span className="text-gray-400 font-mono font-medium text-xs pl-2">
                                  #{index + 1}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 font-bold text-gray-900">
                              {agent.first_name} {agent.last_name}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-gray-600">{agent.branch_name}</td>
                            <td className="px-5 py-3.5">
                              <span className="capitalize text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                                {agent.vehicle_type || 'Vehicle'}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-xs font-bold text-amber-600">
                              ★ {Number(agent.rating || 0).toFixed(2)}
                            </td>
                            <td className="px-5 py-3.5 text-green-700 font-bold">{Number(agent.completed_in_period || 0)}</td>
                            <td className="px-5 py-3.5 text-red-500 font-medium">{Number(agent.failed_in_period || 0)}</td>
                            <td className="px-5 py-3.5 font-mono text-xs font-bold text-gray-900">
                              {Number(agent.success_rate_pct || 0).toFixed(2)}%
                            </td>
                            <td className="px-5 py-3.5 text-right font-mono text-xs text-gray-500">
                              {Number(agent.total_deliveries_all || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Most Active Branches */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Most Active Branches by Volume</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Ranked by total booked parcel volume</p>
                  </div>
                  <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    fn_most_active_branches
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3">Branch</th>
                        <th className="px-5 py-3">City</th>
                        <th className="px-5 py-3">Total Parcels</th>
                        <th className="px-5 py-3">Delivered</th>
                        <th className="px-5 py-3">In Progress</th>
                        <th className="px-5 py-3">Staff (Employees / Riders)</th>
                        <th className="px-5 py-3 text-right">Revenue Generated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(mostActiveBranchesData.rows || []).map((branch) => (
                        <tr key={branch.branch_id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-gray-900">
                            {branch.branch_name}
                            <span className="text-gray-400 font-mono text-xs font-normal ml-2">({branch.branch_code})</span>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-gray-600">{branch.city}</td>
                          <td className="px-5 py-3.5 font-bold text-gray-900">{branch.total_parcels}</td>
                          <td className="px-5 py-3.5 text-green-700 font-semibold">{branch.delivered}</td>
                          <td className="px-5 py-3.5 text-blue-600">{branch.in_progress}</td>
                          <td className="px-5 py-3.5 text-xs text-gray-600 font-mono">
                            {branch.employee_count} emp / {branch.agent_count} riders
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono text-xs font-bold text-gray-900">
                            ৳{Number(branch.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  )
}
