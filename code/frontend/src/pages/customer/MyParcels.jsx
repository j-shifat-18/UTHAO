import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../../api/client'
import { PageHeader, EmptyState, Pagination, TrackingTag } from '../../components/Bits.jsx'
import { Package, Truck, Clock, X, AlertCircle, ExternalLink, RefreshCw, XCircle } from 'lucide-react'

const STATUS_BADGE_COLORS = {
  booked: 'bg-blue-100 text-blue-700 border-blue-200',
  picked_up: 'bg-amber-100 text-amber-700 border-amber-200',
  in_transit: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  at_warehouse: 'bg-purple-100 text-purple-700 border-purple-200',
  out_for_delivery: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  returned: 'bg-rose-100 text-rose-700 border-rose-200',
}

export default function MyParcels() {
  const [parcels, setParcels] = useState([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 })
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Tracking modal state
  const [selectedParcel, setSelectedParcel] = useState(null)
  const [trackingHistory, setTrackingHistory] = useState([])
  const [loadingTracking, setLoadingTracking] = useState(false)

  // Cancel modal state
  const [cancelModalParcel, setCancelModalParcel] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')

  async function loadMyParcels(page = 1) {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ page: String(page), limit: '10' })
    if (statusFilter) params.set('status', statusFilter)

    try {
      const res = await api.get(`/parcels/my?${params.toString()}`)
      const body = res.data
      let list = body.data || []
      if (search.trim()) {
        const q = search.toLowerCase()
        list = list.filter(
          (p) =>
            p.tracking_number?.toLowerCase().includes(q) ||
            p.receiver_name?.toLowerCase().includes(q) ||
            p.delivery_city?.toLowerCase().includes(q)
        )
      }
      setParcels(list)
      setMeta(body.meta || { page: 1, totalPages: 1 })
    } catch (err) {
      setError(err.message || 'Failed to load parcels')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMyParcels(1)
  }, [statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  async function openTrackingModal(parcel) {
    setSelectedParcel(parcel)
    setLoadingTracking(true)
    try {
      const res = await api.get(`/parcels/${parcel.id}/tracking`)
      // Backend returns { data: { parcel, history } }
      const body = res.data?.data
      setTrackingHistory(Array.isArray(body) ? body : (body?.history || []))
    } catch {
      setTrackingHistory([])
    } finally {
      setLoadingTracking(false)
    }
  }

  function openCancelModal(parcel) {
    setCancelModalParcel(parcel)
    setCancelReason('')
    setCancelError('')
  }

  async function handleCancelSubmit(e) {
    e.preventDefault()
    if (!cancelModalParcel) return
    setCancelling(true)
    setCancelError('')

    try {
      await api.patch(`/parcels/${cancelModalParcel.id}/cancel`, {
        reason: cancelReason.trim() || 'Cancelled by customer',
      })
      setCancelModalParcel(null)
      loadMyParcels(meta.page)
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel parcel')
    } finally {
      setCancelling(false)
    }
  }

  const statusTabs = [
    { label: 'All', value: '' },
    { label: 'Booked', value: 'booked' },
    { label: 'Picked Up', value: 'picked_up' },
    { label: 'In Transit', value: 'in_transit' },
    { label: 'Out for Delivery', value: 'out_for_delivery' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Shipments"
        title="My Parcels"
        sub="Track, manage, and view status history of your booked shipments."
      />

      {/* Filter Tabs & Search */}
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
          <input
            className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all bg-white w-full sm:w-[220px]"
            placeholder="Search tracking # or receiver…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={() => loadMyParcels(1)}
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
      {loading ? (
        <p className="text-sm text-gray-400 font-mono">Fetching your parcels…</p>
      ) : parcels.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <EmptyState title="No parcels found" message="You haven't booked any shipments under this filter yet." />
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Tracking & Receiver</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Destination</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Cost & Payment</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {parcels.map((p, i) => {
                  const badgeColor = STATUS_BADGE_COLORS[p.status] || 'bg-gray-100 text-gray-700 border-gray-200'
                  const canCancel = ['booked', 'picked_up'].includes(p.status)

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
                          <Package size={20} className="text-red-500 shrink-0" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-gray-900">{p.tracking_number}</span>
                            </div>
                            <p className="text-xs text-gray-600 font-medium mt-0.5">To: {p.receiver_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-800 text-xs">{p.delivery_city}</p>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">{p.category_name || 'Package'}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-gray-900 font-mono text-sm">৳{p.delivery_cost || '0.00'}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[10px] uppercase font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {p.payment_method}
                          </span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${p.is_paid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {p.is_paid ? 'Paid' : 'Unpaid'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}>
                          {p.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openTrackingModal(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-gray-900 transition-all"
                        >
                          <ExternalLink size={12} />
                          Track
                        </motion.button>
                        {canCancel && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openCancelModal(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all"
                          >
                            <XCircle size={12} />
                            Cancel
                          </motion.button>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            hasNextPage={meta.hasNextPage}
            hasPrevPage={meta.hasPrevPage}
            onChange={loadMyParcels}
          />
        </>
      )}

      {/* Tracking History Modal */}
      <AnimatePresence>
        {selectedParcel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <Truck size={20} className="text-red-600" />
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Tracking History</h3>
                    <p className="font-mono text-xs text-red-600">{selectedParcel.tracking_number}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedParcel(null)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200/50 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                {loadingTracking ? (
                  <p className="text-sm text-gray-400 font-mono">Fetching status history…</p>
                ) : trackingHistory.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm">No status updates available yet.</div>
                ) : (
                  <div className="relative pl-6 border-l-2 border-red-500 space-y-6">
                    {trackingHistory.map((item, idx) => (
                      <div key={idx} className="relative">
                        <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-red-600 border-4 border-white shadow-sm" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 capitalize text-sm">
                              {item.status?.replace('_', ' ')}
                            </span>
                            {item.location && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                                {item.location}
                              </span>
                            )}
                          </div>
                          {item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>}
                          <p className="text-[11px] font-mono text-gray-400 mt-1">
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {cancelModalParcel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-gray-100 space-y-4"
            >
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle size={22} />
                <h3 className="font-bold text-gray-900 text-lg">Cancel Shipment</h3>
              </div>

              <p className="text-sm text-gray-600">
                Are you sure you want to cancel tracking number{' '}
                <strong className="font-mono text-gray-900">{cancelModalParcel.tracking_number}</strong>?
              </p>

              {cancelError && (
                <div className="bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded-xl text-xs">
                  {cancelError}
                </div>
              )}

              <form onSubmit={handleCancelSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">
                    Reason for Cancellation
                  </label>
                  <textarea
                    rows={2}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all bg-white"
                    placeholder="e.g. Changed shipment requirements…"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCancelModalParcel(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-all"
                  >
                    Keep Shipment
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={cancelling}
                    className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all disabled:opacity-50"
                  >
                    {cancelling ? 'Cancelling…' : 'Confirm Cancellation'}
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
