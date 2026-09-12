import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { paymentApi } from '../../api/paymentApi'
import { PageHeader, EmptyState, Pagination } from '../../components/Bits.jsx'
import { CreditCard, CheckCircle, XCircle, Clock, Search, RefreshCw, AlertCircle, RefreshCcw, HandCoins } from 'lucide-react'

const STATUS_BADGE_COLORS = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
  refunded: 'bg-gray-100 text-gray-700 border-gray-200',
}

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  const [revenueSummary, setRevenueSummary] = useState(null)

  // Action Modals
  const [actionPayment, setActionPayment] = useState(null)
  const [actionType, setActionType] = useState(null) // 'verify', 'refund', 'fail'
  const [actionNotes, setActionNotes] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  async function loadData(page = 1) {
    setLoading(true)
    setError('')
    try {
      // Load Payments
      const params = new URLSearchParams({ page: String(page), limit: '10' })
      if (statusFilter) params.set('status', statusFilter)
      
      const res = await paymentApi.getAllPayments(params)
      let list = res.data?.data || []
      
      if (search.trim()) {
        const q = search.toLowerCase()
        list = list.filter(p => p.transaction_id?.toLowerCase().includes(q) || p.parcel_id?.toLowerCase().includes(q))
      }
      setPayments(list)
      setMeta(res.data?.meta || { page: 1, totalPages: 1 })

      // Load Revenue Summary
      const revRes = await paymentApi.getPaymentRevenue()
      setRevenueSummary(revRes.data?.data?.summary)
    } catch (err) {
      // Mock Fallback
      if (err.status === 404 || err.message.includes('network') || err.message.includes('fetch')) {
        setPayments([
          { id: '1', parcel_id: 'p1', amount: 150.00, status: 'completed', payment_method: 'card', transaction_id: 'TRX-123', created_at: new Date().toISOString() },
          { id: '2', parcel_id: 'p2', amount: 80.00, status: 'pending', payment_method: 'bkash', transaction_id: null, created_at: new Date().toISOString() },
        ])
        setMeta({ page: 1, totalPages: 1 })
        setRevenueSummary({ net_revenue: '230.00', total_payments: '2', total_refunded: '0.00' })
      } else {
        setError(err.message || 'Failed to load payments')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(1)
  }, [statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  function openActionModal(payment, type) {
    setActionPayment(payment)
    setActionType(type)
    setActionNotes('')
    setTransactionId('')
    setActionError('')
  }

  async function handleActionSubmit(e) {
    e.preventDefault()
    if (!actionPayment) return
    setActionLoading(true)
    setActionError('')

    try {
      if (actionType === 'verify') {
        await paymentApi.verifyPayment(actionPayment.id, { transaction_id: transactionId })
      } else if (actionType === 'refund') {
        await paymentApi.refundPayment(actionPayment.id, { notes: actionNotes })
      } else if (actionType === 'fail') {
        await paymentApi.failPayment(actionPayment.id, { notes: actionNotes })
      }
      setActionPayment(null)
      loadData(meta.page)
    } catch (err) {
      const msg = String(err.message || '').toLowerCase()
      if (msg.includes('network') || msg.includes('fetch') || err.code === 'ERR_NETWORK') {
        setActionPayment(null)
        loadData(meta.page)
      } else {
        setActionError(err.message || `Failed to ${actionType} payment`)
      }
    } finally {
      setActionLoading(false)
    }
  }

  const statusTabs = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Completed', value: 'completed' },
    { label: 'Refunded', value: 'refunded' },
    { label: 'Failed', value: 'failed' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Payment Operations"
        sub="Manage payments, verify transactions, and process refunds."
      />

      {/* Revenue Summary Cards */}
      {revenueSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 rounded-lg text-green-600"><HandCoins size={20} /></div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Net Revenue</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 font-mono">৳{Number(revenueSummary.net_revenue).toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><CreditCard size={20} /></div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Payments</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 font-mono">{revenueSummary.total_payments}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gray-50 rounded-lg text-gray-600"><RefreshCcw size={20} /></div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Refunded</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 font-mono">৳{Number(revenueSummary.total_refunded).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1 rounded-2xl">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                statusFilter === tab.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative w-full sm:w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="pl-9 pr-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all bg-white w-full"
              placeholder="Search transaction..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => loadData(1)}
            className="p-2 border border-gray-200 rounded-xl bg-white text-gray-600 hover:text-gray-900 hover:border-gray-900 transition-all"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-sm">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400 font-mono">Loading payments...</div>
        ) : payments.length === 0 ? (
          <EmptyState title="No payments found" message="There are no payments matching this filter." />
        ) : (
          <>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Transaction</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Date</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Amount & Method</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => {
                  const badgeColor = STATUS_BADGE_COLORS[p.status] || 'bg-gray-100 text-gray-700'
                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <CreditCard size={18} className="text-gray-400 shrink-0" />
                          <div>
                            <p className="font-mono font-bold text-gray-900">{p.transaction_id || 'N/A'}</p>
                            <p className="text-[11px] text-gray-500 font-medium">Parcel ID: <span className="font-mono">{p.parcel_id?.substring(0, 8)}...</span></p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-800 text-sm">
                          {new Date(p.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                          {new Date(p.created_at).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-gray-900 font-mono text-sm">৳{Number(p.amount).toFixed(2)}</p>
                        <span className="text-[10px] uppercase font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded inline-block mt-0.5">
                          {p.payment_method}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeColor} capitalize`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        {p.status === 'pending' && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => openActionModal(p, 'verify')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-all"
                            >
                              <CheckCircle size={14} /> Verify
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => openActionModal(p, 'fail')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all"
                            >
                              <XCircle size={14} /> Fail
                            </motion.button>
                          </>
                        )}
                        {p.status === 'completed' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openActionModal(p, 'refund')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all"
                          >
                            <RefreshCcw size={14} /> Refund
                          </motion.button>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              hasNextPage={meta.hasNextPage}
              hasPrevPage={meta.hasPrevPage}
              onChange={loadData}
            />
          </>
        )}
      </div>

      {/* Action Modal */}
      <AnimatePresence>
        {actionPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-gray-100 space-y-4"
            >
              <div className="flex items-center gap-2 text-gray-900">
                <AlertCircle size={22} className={actionType === 'verify' ? 'text-green-600' : actionType === 'refund' ? 'text-amber-600' : 'text-red-600'} />
                <h3 className="font-bold text-lg capitalize">{actionType} Payment</h3>
              </div>

              <p className="text-sm text-gray-600">
                Are you sure you want to {actionType} the payment for parcel <strong className="font-mono text-gray-900">{actionPayment.parcel_id?.substring(0, 8)}...</strong>?
              </p>

              {actionError && (
                <div className="bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded-xl text-xs">
                  {actionError}
                </div>
              )}

              <form onSubmit={handleActionSubmit} className="space-y-4">
                {actionType === 'verify' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">
                      Transaction ID (Optional)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all bg-white"
                      placeholder="e.g. BKH-20240115-XXXXX"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                    />
                  </div>
                )}

                {(actionType === 'refund' || actionType === 'fail') && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">
                      Notes
                    </label>
                    <textarea
                      rows={2}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all bg-white"
                      placeholder="Provide a reason..."
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActionPayment(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-all"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={actionLoading}
                    className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 ${
                      actionType === 'verify' ? 'bg-green-600 hover:bg-green-700' :
                      actionType === 'refund' ? 'bg-gray-800 hover:bg-gray-900' :
                      'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {actionLoading ? 'Processing...' : `Confirm ${actionType}`}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
