import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Navigation,
  UserCheck,
  ShieldCheck,
  AlertCircle,
  Package,
  ArrowRight,
  Sparkles,
  Calendar,
  Layers,
  Banknote,
  Send,
  X,
  ExternalLink,
  Search,
  PackageCheck,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { api } from '../../api/client.js'
import { PageHeader, EmptyState } from '../../components/Bits.jsx'

export default function DeliveryAgentPortal() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')

  // Completion modal state (supports both pickup and delivery stages)
  const [completingAssignment, setCompletingAssignment] = useState(null)
  const [deliveryNote, setDeliveryNote] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')

  // Tracking history modal
  const [viewingTracking, setViewingTracking] = useState(null)
  const [trackingHistory, setTrackingHistory] = useState([])
  const [loadingTracking, setLoadingTracking] = useState(false)

  const loadAssignments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // Fetch live assignments for current authenticated agent
      const res = await api.get('/deliveries/my')
      const data = res.data?.data || res.data || []
      setAssignments(Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn('Could not fetch live agent deliveries, loading fallback data:', err)
      try {
        const { deliveryApi } = await import('../../api/deliveryApi.js')
        const fallback = await deliveryApi.getAgentAssignments('agent-101')
        // Normalize mock structure
        const normalized = (fallback || []).map((asgn) => ({
          id: asgn.id,
          parcel_id: asgn.parcel?.id || asgn.parcel_id,
          delivery_agent_id: asgn.delivery_agent_id,
          assignment_type: asgn.assignment_type || 'pickup',
          assigned_at: asgn.assigned_at,
          status: asgn.status,
          notes: asgn.notes,
          tracking_number: asgn.parcel?.tracking_number,
          parcel_status: asgn.parcel?.status || 'booked',
          pickup_address: asgn.parcel?.pickup_address_line1 || 'Customer Address on File',
          pickup_city: asgn.parcel?.pickup_city || 'Dhaka',
          delivery_address: asgn.parcel?.delivery_address_line1,
          delivery_city: asgn.parcel?.delivery_city,
          recipient_name: asgn.parcel?.receiver_name,
          receiver_name: asgn.parcel?.receiver_name,
          recipient_phone: asgn.parcel?.receiver_phone,
          receiver_phone: asgn.parcel?.receiver_phone,
          sender_name: asgn.parcel?.sender_name || 'Sender',
          sender_phone: asgn.parcel?.sender_phone || 'N/A',
          weight_kg: asgn.parcel?.weight_kg || 1.5,
          total_cost: asgn.parcel?.delivery_cost || asgn.parcel?.total_cost || 120,
          delivery_cost: asgn.parcel?.delivery_cost || asgn.parcel?.total_cost || 120,
          payment_method: asgn.parcel?.payment_method || 'cod',
          is_paid: asgn.parcel?.is_paid || false,
          category: asgn.parcel?.category || 'Standard',
        }))
        setAssignments(normalized)
      } catch {
        setError('Failed to load assigned deliveries.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAssignments()
  }, [loadAssignments])

  // Mark assignment as In Progress / Out for Delivery
  const handleStartDelivery = async (asgn) => {
    try {
      try {
        await api.patch(`/deliveries/${asgn.id}/start`)
      } catch {
        const { deliveryApi } = await import('../../api/deliveryApi.js')
        await deliveryApi.updateParcelStatus(
          asgn.parcel_id,
          asgn.assignment_type === 'pickup' ? 'picked_up' : 'out_for_delivery',
          `Agent started ${asgn.assignment_type}`
        )
      }
      await loadAssignments()
    } catch (err) {
      alert(err.message || 'Failed to start route')
    }
  }

  // Open modal (pickup or delivery)
  const openCompleteModal = (asgn) => {
    setCompletingAssignment(asgn)
    setDeliveryNote('')
    setOtpInput('')
    setModalError('')
  }

  // Confirm Pickup or Delivery Complete
  const handleConfirmComplete = async (e) => {
    e.preventDefault()
    if (!completingAssignment) return
    setSubmitting(true)
    setModalError('')

    const isPickup = completingAssignment.assignment_type === 'pickup'
    const assignmentId = completingAssignment.id
    const parcelId = completingAssignment.parcel_id

    try {
      let completed = false

      // 1. Try assignment completion endpoint
      if (assignmentId) {
        try {
          await api.patch(`/deliveries/${assignmentId}/complete`, {
            notes: deliveryNote.trim() || undefined,
          })
          completed = true
        } catch (err) {
          console.warn('Delivery assignment complete error, attempting fallback:', err)
        }
      }

      // 2. If assignment endpoint wasn't successful, try parcel status endpoint
      if (!completed && parcelId) {
        const targetStatus = isPickup ? 'picked_up' : 'delivered'
        const defaultNote = isPickup ? 'Picked up from sender by agent' : 'Delivered directly to recipient'
        try {
          await api.patch(`/parcels/${parcelId}/status`, {
            status: targetStatus,
            notes: deliveryNote.trim() || defaultNote,
          })
          completed = true
        } catch (statusErr) {
          const { deliveryApi } = await import('../../api/deliveryApi.js')
          await deliveryApi.updateParcelStatus(
            parcelId,
            targetStatus,
            deliveryNote.trim() || defaultNote
          )
          completed = true
        }
      }

      setCompletingAssignment(null)
      setDeliveryNote('')
      setOtpInput('')
      await loadAssignments()
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || `Failed to mark ${isPickup ? 'pickup' : 'delivery'} as complete`)
    } finally {
      setSubmitting(false)
    }
  }

  // View tracking timeline
  const handleViewTracking = async (parcelId, trackingNumber) => {
    setViewingTracking({ parcelId, trackingNumber })
    setLoadingTracking(true)
    try {
      const res = await api.get(`/parcels/${parcelId}/tracking`)
      const body = res.data?.data
      setTrackingHistory(Array.isArray(body) ? body : body?.history || [])
    } catch {
      setTrackingHistory([])
    } finally {
      setLoadingTracking(false)
    }
  }

  // Filter & Search assignments
  const filteredAssignments = assignments.filter((a) => {
    const isPickup = a.assignment_type === 'pickup'
    const pStatus = (a.parcel_status || a.status || '').toLowerCase()
    const isCompleted = isPickup 
      ? pStatus === 'picked_up' || a.status === 'completed' || pStatus === 'at_warehouse' || pStatus === 'in_transit' || pStatus === 'out_for_delivery' || pStatus === 'delivered'
      : pStatus === 'delivered' || a.status === 'completed'

    if (filter === 'active' && isCompleted) return false
    if (filter === 'completed' && !isCompleted) return false
    if (filter === 'pickup' && !isPickup) return false
    if (filter === 'delivery' && isPickup) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchTracking = (a.tracking_number || '').toLowerCase().includes(q)
      const matchReceiver = (a.recipient_name || a.receiver_name || '').toLowerCase().includes(q)
      const matchSender = (a.sender_name || `${a.sender_first_name || ''} ${a.sender_last_name || ''}`).toLowerCase().includes(q)
      const matchPhone = (a.recipient_phone || a.receiver_phone || a.sender_phone || '').includes(q)
      const matchCity = (a.delivery_city || a.pickup_city || '').toLowerCase().includes(q)
      if (!matchTracking && !matchReceiver && !matchSender && !matchPhone && !matchCity) return false
    }

    return true
  })

  // Quick stats calculation
  const totalCount = assignments.length
  const completedCount = assignments.filter((a) => {
    const isPickup = a.assignment_type === 'pickup'
    const pStatus = (a.parcel_status || a.status || '').toLowerCase()
    return isPickup 
      ? pStatus === 'picked_up' || a.status === 'completed' || pStatus === 'at_warehouse' || pStatus === 'in_transit' || pStatus === 'out_for_delivery' || pStatus === 'delivered'
      : pStatus === 'delivered' || a.status === 'completed'
  }).length
  const activeCount = totalCount - completedCount
  const pickupCount = assignments.filter((a) => a.assignment_type === 'pickup').length
  const deliveryCount = assignments.filter((a) => a.assignment_type === 'delivery').length

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <PageHeader
        eyebrow="Delivery Operations"
        title="Assigned Deliveries & Pickups"
        sub="Manage assigned parcel pickups and drop-offs, inspect sender/recipient contact details, and record status completions."
      />

      {/* Agent Overview Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-red-500/20">
            <Truck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-gray-900 text-lg">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Delivery Agent'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Agent
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">
              {user?.email} {user?.phone ? `• ${user.phone}` : ''}
            </p>
          </div>
        </div>

        {/* Counters */}
        <div className="flex items-center gap-5 text-xs">
          <div className="text-center px-3 border-r border-gray-100">
            <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Total Tasks</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{totalCount}</p>
          </div>
          <div className="text-center px-3 border-r border-gray-100">
            <p className="text-blue-600 font-semibold uppercase tracking-wider text-[10px]">Pickups</p>
            <p className="text-lg font-bold text-blue-600 mt-0.5">{pickupCount}</p>
          </div>
          <div className="text-center px-3 border-r border-gray-100">
            <p className="text-purple-600 font-semibold uppercase tracking-wider text-[10px]">Deliveries</p>
            <p className="text-lg font-bold text-purple-600 mt-0.5">{deliveryCount}</p>
          </div>
          <div className="text-center px-3">
            <p className="text-emerald-600 font-semibold uppercase tracking-wider text-[10px]">Completed</p>
            <p className="text-lg font-bold text-emerald-600 mt-0.5">{completedCount}</p>
          </div>
        </div>
      </motion.div>

      {/* Filter Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'active', label: `Active Queue (${activeCount})` },
            { id: 'all', label: `All Tasks (${totalCount})` },
            { id: 'pickup', label: `Pickups (${pickupCount})` },
            { id: 'delivery', label: `Deliveries (${deliveryCount})` },
            { id: 'completed', label: `Completed (${completedCount})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filter === t.id
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/10'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tracking, name, city…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Deliveries List */}
      {loading ? (
        <div className="py-20 text-center text-gray-400">
          <Clock size={32} className="mx-auto mb-2 animate-spin text-red-500" />
          <p className="text-sm font-medium">Fetching assigned deliveries…</p>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center">
          <Package size={44} className="mx-auto mb-3 text-gray-300" />
          <h3 className="text-base font-bold text-gray-800">No Assigned Tasks</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            {filter === 'active'
              ? 'You have no active pending tasks in your queue. Great job!'
              : 'No tasks match the selected filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredAssignments.map((asgn) => {
            const isPickup = asgn.assignment_type === 'pickup'
            const currentStatus = (asgn.parcel_status || asgn.status || 'booked').toLowerCase()
            const isCompleted = isPickup 
              ? currentStatus === 'picked_up' || asgn.status === 'completed' || currentStatus === 'at_warehouse' || currentStatus === 'in_transit' || currentStatus === 'out_for_delivery' || currentStatus === 'delivered'
              : currentStatus === 'delivered' || asgn.status === 'completed'
            const isOutForDelivery = currentStatus === 'out_for_delivery'

            const senderDisplayName = asgn.sender_name || `${asgn.sender_first_name || ''} ${asgn.sender_last_name || ''}`.trim() || 'Sender'
            const recipientDisplayName = asgn.recipient_name || asgn.receiver_name || 'Recipient'
            const deliveryAddressText = asgn.delivery_address || asgn.delivery_address_line1 || asgn.delivery_city || 'Delivery Address'
            const pickupAddressText = asgn.pickup_address || asgn.pickup_city || 'Sender Address on File'
            const costAmount = asgn.total_cost || asgn.delivery_cost || 0

            return (
              <motion.div
                key={asgn.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm flex flex-col justify-between overflow-hidden ${
                  isCompleted
                    ? 'border-gray-200 opacity-90'
                    : isOutForDelivery
                    ? 'border-amber-300 ring-2 ring-amber-100'
                    : isPickup
                    ? 'border-blue-200 hover:border-blue-300'
                    : 'border-gray-200 hover:border-red-200'
                }`}
              >
                {/* Card Top Banner */}
                <div className="p-5 pb-3">
                  <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-200">
                        {asgn.tracking_number}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 text-[10px] uppercase font-bold rounded-md ${
                          isPickup ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-purple-100 text-purple-800 border border-purple-200'
                        }`}
                      >
                        {isPickup ? '📦 Pickup Stage' : '🚚 Delivery Stage'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 text-xs font-bold rounded-full capitalize ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : isOutForDelivery
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : currentStatus === 'picked_up'
                            ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}
                      >
                        {currentStatus.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Parcel Details Body */}
                  <div className="space-y-3 pt-3 text-xs">
                    {/* Primary Task Address (Sender if Pickup, Recipient if Delivery) */}
                    <div className={`p-3.5 rounded-xl border space-y-1.5 ${isPickup ? 'bg-blue-50/50 border-blue-100' : 'bg-gray-50/80 border-gray-100'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 uppercase font-semibold text-[10px] tracking-wider flex items-center gap-1">
                          <MapPin size={12} className={isPickup ? 'text-blue-600' : 'text-red-500'} />
                          {isPickup ? 'Pickup Location (Sender)' : 'Delivery Location (Recipient)'}
                        </span>
                        {((isPickup && asgn.sender_phone && asgn.sender_phone !== 'N/A') || (!isPickup && (asgn.recipient_phone || asgn.receiver_phone))) && (
                          <a
                            href={`tel:${isPickup ? asgn.sender_phone : (asgn.recipient_phone || asgn.receiver_phone)}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 px-2 py-0.5 rounded-md transition-colors"
                          >
                            <Phone size={10} /> Call {isPickup ? 'Sender' : 'Recipient'}
                          </a>
                        )}
                      </div>
                      <p className="font-bold text-gray-900 text-sm">
                        {isPickup ? senderDisplayName : recipientDisplayName}
                      </p>
                      <p className="text-gray-700 font-medium">
                        {isPickup ? pickupAddressText : deliveryAddressText}
                      </p>
                      <p className="text-gray-500">
                        {isPickup ? asgn.pickup_city : asgn.delivery_city}
                      </p>
                      <p className="text-gray-600 font-mono text-[11px]">
                        Phone: {isPickup ? (asgn.sender_phone || 'N/A') : (asgn.recipient_phone || asgn.receiver_phone)}
                      </p>
                    </div>

                    {/* Secondary Address (Recipient for Pickup, Sender for Delivery) */}
                    <div className="bg-gray-50/40 p-3 rounded-xl border border-dashed border-gray-200 space-y-1">
                      <span className="text-gray-400 uppercase font-semibold text-[10px] tracking-wider">
                        {isPickup ? 'Destination Info (Recipient)' : 'Origin Info (Sender)'}
                      </span>
                      <p className="font-semibold text-gray-800">
                        {isPickup ? recipientDisplayName : senderDisplayName} ({isPickup ? asgn.delivery_city : asgn.pickup_city})
                      </p>
                      <p className="text-gray-500 text-[11px]">
                        {isPickup ? deliveryAddressText : pickupAddressText}
                      </p>
                    </div>

                    {/* Shipment & Payment Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2 text-gray-500 text-[11px]">
                        <span>⚖️ {asgn.weight_kg || '1.0'} kg</span>
                        <span>•</span>
                        <span>📦 {asgn.category_name || asgn.category || 'Standard'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {asgn.is_paid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-800 border border-green-200">
                            <CheckCircle2 size={11} /> Paid ({asgn.payment_method || 'Online'})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Banknote size={11} /> Collect COD: ৳{costAmount}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dispatch Instructions */}
                    {asgn.notes && (
                      <div className="p-2.5 bg-amber-50/80 border border-amber-200/60 rounded-xl text-[11px] text-amber-900">
                        <span className="font-semibold">Dispatch Note:</span> {asgn.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleViewTracking(asgn.parcel_id, asgn.tracking_number)}
                    className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-200/60 transition-colors flex items-center gap-1"
                  >
                    <Clock size={13} /> Timeline
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Pickup Task Action */}
                    {isPickup && !isCompleted && (
                      <button
                        onClick={() => openCompleteModal(asgn)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-700/10 flex items-center gap-1.5"
                      >
                        <PackageCheck size={14} /> Mark as Picked Up
                      </button>
                    )}

                    {/* Delivery Task Actions */}
                    {!isPickup && !isCompleted && (
                      <>
                        {!isOutForDelivery && (
                          <button
                            onClick={() => handleStartDelivery(asgn)}
                            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                          >
                            <Navigation size={13} /> Start Route
                          </button>
                        )}
                        <button
                          onClick={() => openCompleteModal(asgn)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-700/10 flex items-center gap-1.5"
                        >
                          <CheckCircle2 size={14} /> Mark Delivery Complete
                        </button>
                      </>
                    )}

                    {/* Completed Badge */}
                    {isCompleted && (
                      <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 size={13} /> {isPickup ? 'Picked Up Successfully' : 'Delivered Successfully'}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Proof / Completion Modal for Pickup or Delivery */}
      <AnimatePresence>
        {completingAssignment && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100"
            >
              {(() => {
                const isPickup = completingAssignment.assignment_type === 'pickup'
                const senderName = completingAssignment.sender_name || `${completingAssignment.sender_first_name || ''} ${completingAssignment.sender_last_name || ''}`.trim() || 'Sender'
                const recipientName = completingAssignment.recipient_name || completingAssignment.receiver_name || 'Recipient'
                const pickupLoc = completingAssignment.pickup_address || completingAssignment.pickup_city || 'Address on file'
                const deliveryLoc = completingAssignment.delivery_address || completingAssignment.delivery_address_line1 || completingAssignment.delivery_city || 'Destination on file'
                const costVal = completingAssignment.total_cost || completingAssignment.delivery_cost || 0

                return (
                  <>
                    <div className={`flex items-center justify-between px-6 py-4 border-b border-gray-100 ${isPickup ? 'bg-blue-50/70' : 'bg-emerald-50/50'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isPickup ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {isPickup ? <PackageCheck size={18} /> : <ShieldCheck size={18} />}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-base">
                            {isPickup ? 'Confirm Pickup from Sender' : 'Complete Delivery to Recipient'}
                          </h3>
                          <p className={`text-[11px] font-mono ${isPickup ? 'text-blue-700' : 'text-emerald-700'}`}>
                            {completingAssignment.tracking_number}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setCompletingAssignment(null)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <form onSubmit={handleConfirmComplete} className="p-6 space-y-4">
                      {modalError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                          {modalError}
                        </div>
                      )}

                      {/* Recipient / Sender Summary */}
                      <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 text-xs space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">{isPickup ? 'Sender:' : 'Recipient:'}</span>
                          <span className="font-bold text-gray-800">
                            {isPickup ? senderName : recipientName}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">{isPickup ? 'Pickup Point:' : 'Destination:'}</span>
                          <span className="text-gray-700 text-right">
                            {isPickup ? pickupLoc : deliveryLoc}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                          <span className="text-gray-500">Payment:</span>
                          {completingAssignment.is_paid ? (
                            <span className="font-bold text-emerald-600">Paid Online</span>
                          ) : (
                            <span className="font-bold text-amber-700">
                              {isPickup ? 'COD (to be collected upon delivery)' : `Collect Cash ৳${costVal}`}
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Verification Code / OTP <span className="text-gray-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 581920"
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:bg-white focus:border-red-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          {isPickup ? 'Pickup Remarks / Package Verification' : 'Delivery Proof / Handover Notes'}
                        </label>
                        <textarea
                          rows={2}
                          placeholder={isPickup ? 'e.g. Picked up from sender, package sealed and in good condition...' : 'e.g. Handed directly to recipient at front gate, cash collected...'}
                          value={deliveryNote}
                          onChange={(e) => setDeliveryNote(e.target.value)}
                          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setCompletingAssignment(null)}
                          className="flex-1 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={submitting}
                          className={`flex-1 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                            isPickup
                              ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-700/20'
                              : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-700/20'
                          }`}
                        >
                          {submitting
                            ? 'Confirming…'
                            : isPickup
                            ? 'Confirm & Mark Picked Up'
                            : 'Confirm & Mark Delivered'}
                        </motion.button>
                      </div>
                    </form>
                  </>
                )
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tracking History Modal */}
      <AnimatePresence>
        {viewingTracking && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <Truck size={20} className="text-red-600" />
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Tracking History</h3>
                    <p className="font-mono text-xs text-red-600">{viewingTracking.trackingNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingTracking(null)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                {loadingTracking ? (
                  <p className="text-xs text-gray-400 font-mono">Loading history…</p>
                ) : trackingHistory.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No tracking entries recorded yet.</p>
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
