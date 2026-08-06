import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../../api/client'
import { PageHeader, EmptyState, Pagination, TrackingTag } from '../../components/Bits.jsx'
import { Package, Truck, Clock, Edit3, X, ExternalLink, Filter, MapPin } from 'lucide-react'

const ALLOWED_TRANSITIONS = {
  booked: ['picked_up', 'cancelled'],
  picked_up: ['in_transit', 'cancelled', 'failed'],
  in_transit: ['at_warehouse', 'out_for_delivery', 'failed'],
  at_warehouse: ['in_transit', 'out_for_delivery'],
  out_for_delivery: ['delivered', 'failed', 'returned'],
  failed: ['out_for_delivery', 'returned'],
  delivered: [],
  cancelled: [],
  returned: [],
}

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

const inputClass = 'w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all bg-white text-gray-800'
const labelClass = 'block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider'

export default function AdminParcels() {
  const [parcels, setParcels] = useState([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Status update modal state
  const [updatingParcel, setUpdatingParcel] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [updating, setUpdating] = useState(false)
  const [modalError, setModalError] = useState('')

  // Tracking history modal state
  const [trackingParcel, setTrackingParcel] = useState(null)
  const [trackingHistory, setTrackingHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  async function loadParcels(page = 1) {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ page: String(page), limit: '10' })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (priorityFilter) params.set('priority', priorityFilter)
    if (cityFilter) params.set('city', cityFilter)

    try {
      const res = await api.get(`/parcels?${params.toString()}`)
      const body = res.data
      setParcels(body.data || [])
      setMeta(body.meta || { page: 1, totalPages: 1 })
    } catch (err) {
      setError(err.message || 'Failed to load parcels')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadParcels(1)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleFilterSubmit(e) {
    e.preventDefault()
    loadParcels(1)
  }

  function openUpdateStatusModal(parcel) {
    setUpdatingParcel(parcel)
    const allowed = ALLOWED_TRANSITIONS[parcel.status] || []
    setNewStatus(allowed.length > 0 ? allowed[0] : '')
    setLocation(parcel.delivery_city || '')
    setNotes('')
    setModalError('')
  }

  async function handleStatusUpdateSubmit(e) {
    e.preventDefault()
    if (!updatingParcel) return
    if (!newStatus) {
      setModalError('Select a valid target status')
      return
    }

    setUpdating(true)
    setModalError('')

    try {
      await api.patch(`/parcels/${updatingParcel.id}/status`, {
        status: newStatus,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      setUpdatingParcel(null)
      loadParcels(meta.page)
    } catch (err) {
      setModalError(err.message || 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  async function openTrackingModal(parcel) {
    setTrackingParcel(parcel)
    setLoadingHistory(true)
    try {
      const res = await api.get(`/parcels/${parcel.id}/tracking`)
      setTrackingHistory(res.data?.data || [])
    } catch {
      setTrackingHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Parcels & Logistics"
        sub="Monitor all registered shipments, filter by route, and update status workflow."
      />

      {/* Filters */}
      <form onSubmit={handleFilterSubmit} className="flex flex-wrap gap-3 items-center">
        <input
          className="flex-1 min-w-[200px] px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all bg-white"
          placeholder="Search by tracking #, receiver, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          className="w-[140px] px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all bg-white"
          placeholder="Filter city…"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        />
        <select
          className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white text-gray-700"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="booked">Booked</option>
          <option value="picked_up">Picked Up</option>
          <option value="in_transit">In Transit</option>
          <option value="at_warehouse">At Warehouse</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
          <option value="returned">Returned</option>
        </select>
        <select
          className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white text-gray-700"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All priorities</option>
          <option value="standard">Standard</option>
          <option value="express">Express</option>
          <option value="overnight">Overnight</option>
        </select>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-gray-900 transition-all"
        >
          <Filter size={14} />
          Filter
        </motion.button>
      </form>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-sm">{error}</div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-sm text-gray-400 font-mono">Fetching parcels…</p>
      ) : parcels.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <EmptyState title="No parcels found" message="Try adjusting your search terms or filter selection." />
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Tracking & Receiver</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Destination</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Specs & Priority</th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {parcels.map((p, i) => {
                  const badgeColor = STATUS_BADGE_COLORS[p.status] || 'bg-gray-100 text-gray-700 border-gray-200'
                  const allowedTransitions = ALLOWED_TRANSITIONS[p.status] || []
                  const canUpdateStatus = allowedTransitions.length > 0

                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Package size={18} className="text-red-500 shrink-0" />
                          <div>
                            <p className="font-mono font-bold text-gray-900">{p.tracking_number}</p>
                            <p className="text-xs text-gray-600 font-medium mt-0.5">{p.receiver_name}</p>
                            {p.receiver_phone && <p className="text-[11px] font-mono text-gray-400">{p.receiver_phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-800 text-xs">{p.delivery_city}</p>
                        <p className="text-[11px] text-gray-400 truncate max-w-[160px]">{p.delivery_address_line1}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-gray-700 font-medium">{p.weight_kg || '1'} kg · ৳{p.delivery_cost || '0.00'}</span>
                          <div className="flex items-center gap-1">
                            <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${p.priority === 'express' ? 'bg-amber-100 text-amber-700' : p.priority === 'overnight' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                              {p.priority}
                            </span>
                            {p.is_fragile && (
                              <span className="text-[10px] bg-red-100 text-red-600 font-semibold px-1.5 py-0.5 rounded">
                                Fragile
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}>
                          {p.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        {canUpdateStatus && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openUpdateStatusModal(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all shadow-sm shadow-red-900/10"
                          >
                            <Edit3 size={12} />
                            Update Status
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openTrackingModal(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-gray-900 transition-all"
                        >
                          <ExternalLink size={12} />
                          Timeline
                        </motion.button>
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
            onChange={loadParcels}
          />
        </>
      )}

      {/* Update Status Modal */}
      <AnimatePresence>
        {updatingParcel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <Truck size={18} className="text-red-600" />
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Update Status</h3>
                    <p className="font-mono text-xs text-red-600">{updatingParcel.tracking_number}</p>
                  </div>
                </div>
                <button
                  onClick={() => setUpdatingParcel(null)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200/50 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleStatusUpdateSubmit} className="p-6 space-y-4">
                {modalError && (
                  <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-sm">
                    {modalError}
                  </div>
                )}

                <div>
                  <label className={labelClass}>Current Status</label>
                  <div className="px-3.5 py-2 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 capitalize">
                    {updatingParcel.status?.replace('_', ' ')}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>New Status *</label>
                  <select
                    className={inputClass}
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    {(ALLOWED_TRANSITIONS[updatingParcel.status] || []).map((st) => (
                      <option key={st} value={st}>
                        {st.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Current Location</label>
                  <input
                    className={inputClass}
                    placeholder="e.g. Dhaka Central Hub, Gulshan"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div>
                  <label className={labelClass}>Update Notes</label>
                  <textarea
                    rows={2}
                    className={inputClass}
                    placeholder="Internal notes or status remarks…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setUpdatingParcel(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-all"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={updating}
                    className="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-md shadow-red-900/10 transition-all disabled:opacity-50"
                  >
                    {updating ? 'Updating…' : 'Save Status Update'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tracking History Modal */}
      <AnimatePresence>
        {trackingParcel && (
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
                    <h3 className="font-bold text-gray-900 text-base">Tracking Timeline</h3>
                    <p className="font-mono text-xs text-red-600">{trackingParcel.tracking_number}</p>
                  </div>
                </div>
                <button
                  onClick={() => setTrackingParcel(null)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-200/50 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                {loadingHistory ? (
                  <p className="text-sm text-gray-400 font-mono">Fetching status timeline…</p>
                ) : trackingHistory.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm">No timeline updates recorded.</div>
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
    </div>
  )
}
