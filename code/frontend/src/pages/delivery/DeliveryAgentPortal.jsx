import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Navigation,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  ToggleLeft,
  ToggleRight,
  Star,
  Package,
} from 'lucide-react'
import { deliveryApi } from '../../api/deliveryApi.js'

export default function DeliveryAgentPortal() {
  const [agent, setAgent] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  // Status transition modal state
  const [activeModalParcel, setActiveModalParcel] = useState(null)
  const [deliveryNote, setDeliveryNote] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [updating, setUpdating] = useState(false)

  const loadAgentData = async () => {
    setLoading(true)
    try {
      // Load current rider profile (defaults to Kabir Hossain agent-101)
      const agentData = await deliveryApi.getAgentById('agent-101')
      setAgent(agentData)

      const asgns = await deliveryApi.getAgentAssignments('agent-101')
      setAssignments(asgns)
    } catch (err) {
      console.error('Error loading rider data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAgentData()
  }, [])

  const handleToggleAvailability = async () => {
    if (!agent) return
    const updated = await deliveryApi.toggleAgentAvailability(agent.id)
    setAgent(updated)
  }

  const handleAdvanceStatus = async (parcelId, currentStatus) => {
    let nextStatus = ''
    if (currentStatus === 'booked') nextStatus = 'picked_up'
    else if (['picked_up', 'at_warehouse', 'in_transit'].includes(currentStatus)) nextStatus = 'out_for_delivery'
    else if (currentStatus === 'out_for_delivery') {
      // Find target parcel & open proof modal
      const asgn = assignments.find((a) => a.parcel?.id === parcelId)
      if (asgn?.parcel) {
        setActiveModalParcel(asgn.parcel)
        return
      }
    }

    if (nextStatus) {
      setUpdating(true)
      try {
        await deliveryApi.updateParcelStatus(
          parcelId,
          nextStatus,
          `Rider ${agent?.first_name} updated status to ${nextStatus}`
        )
        await loadAgentData()
      } catch (err) {
        alert(err.message)
      } finally {
        setUpdating(false)
      }
    }
  }

  const handleConfirmDelivered = async (e) => {
    e.preventDefault()
    if (!activeModalParcel) return
    setUpdating(true)
    try {
      await deliveryApi.updateParcelStatus(
        activeModalParcel.id,
        'delivered',
        deliveryNote ? `Proof of delivery: ${deliveryNote}` : 'Delivered directly to customer',
        `${agent?.current_zone || 'Destination Zone'}`
      )
      setActiveModalParcel(null)
      setDeliveryNote('')
      setOtpInput('')
      await loadAgentData()
    } catch (err) {
      alert(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const filteredAssignments = assignments.filter((a) => {
    if (filter === 'pickup') return a.assignment_type === 'pickup'
    if (filter === 'delivery') return a.assignment_type === 'delivery'
    if (filter === 'completed') return a.status === 'completed'
    return true
  })

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-400">
        <Clock size={32} className="mx-auto mb-2 animate-spin text-red-500" />
        <p className="text-sm font-medium">Loading Rider Workspace...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-widest text-red-600 mb-1">
          <Truck size={16} /> Rider Portal
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Delivery Agent Workspace</h1>
        <p className="text-sm text-gray-500 mt-1">Manage assigned pickups, update package status, and complete deliveries.</p>
      </motion.div>

      {/* Rider Status Bar */}
      {agent && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-red-900/20">
              {agent.first_name[0]}
              {agent.last_name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-gray-900 text-lg">
                  {agent.first_name} {agent.last_name}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    agent.is_available
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-gray-100 text-gray-600 border border-gray-300'
                  }`}
                >
                  {agent.is_available ? '● Online & Available' : 'Offline'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Vehicle: <strong className="text-gray-700">{agent.vehicle_type.toUpperCase()}</strong> ({agent.vehicle_plate_number}) • Zone:{' '}
                <strong className="text-gray-700">{agent.current_zone}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <div className="text-center border-r border-gray-200 pr-5">
              <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Rating</p>
              <p className="text-base font-bold text-amber-500 flex items-center gap-1 mt-0.5">
                <Star size={15} className="fill-amber-400" /> {agent.rating}
              </p>
            </div>
            <div className="text-center border-r border-gray-200 pr-5">
              <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Completed</p>
              <p className="text-base font-bold text-gray-900 mt-0.5">{agent.total_deliveries}</p>
            </div>
            <button
              onClick={handleToggleAvailability}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                agent.is_available
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-gray-800 hover:bg-gray-900 text-white'
              }`}
            >
              {agent.is_available ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {agent.is_available ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        {['all', 'delivery', 'pickup', 'completed'].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              filter === t ? 'bg-red-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Assigned Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAssignments.length > 0 ? (
          filteredAssignments.map((asgn) => {
            const p = asgn.parcel
            if (!p) return null
            const isCompleted = p.status === 'delivered' || asgn.status === 'completed'

            return (
              <motion.div
                key={asgn.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 relative"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-gray-900">{p.tracking_number}</span>
                      <span
                        className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${
                          asgn.assignment_type === 'pickup'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {asgn.assignment_type}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 text-xs font-bold rounded-full capitalize ${
                        p.status === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'out_for_delivery'
                          ? 'bg-amber-100 text-amber-900 animate-pulse'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {p.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-2 pt-3 text-xs">
                    <div>
                      <p className="text-gray-400 uppercase tracking-wider font-semibold text-[10px]">Receiver / Contact</p>
                      <p className="font-bold text-gray-900 text-sm mt-0.5">{p.receiver_name}</p>
                      <a href={`tel:${p.receiver_phone}`} className="text-red-600 font-mono font-medium hover:underline">
                        {p.receiver_phone}
                      </a>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1">
                      <p className="text-gray-400 font-semibold text-[10px] uppercase flex items-center gap-1">
                        <MapPin size={11} className="text-red-500" /> Destination Address
                      </p>
                      <p className="text-gray-800 font-medium">{p.delivery_address_line1}</p>
                      <p className="text-gray-500">
                        {p.delivery_city} - {p.delivery_postal_code}
                      </p>
                    </div>

                    {p.delivery_instructions && (
                      <p className="text-amber-800 bg-amber-50/70 p-2 rounded-lg text-[11px] italic">
                        Note: "{p.delivery_instructions}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Transition Action Buttons */}
                {!isCompleted && (
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                    <a
                      href={`tel:${p.receiver_phone}`}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl flex items-center gap-1.5"
                    >
                      <Phone size={13} /> Call
                    </a>

                    {p.status === 'booked' && (
                      <button
                        onClick={() => handleAdvanceStatus(p.id, p.status)}
                        disabled={updating}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <Package size={14} /> Scan & Mark Picked Up
                      </button>
                    )}

                    {['picked_up', 'at_warehouse', 'in_transit'].includes(p.status) && (
                      <button
                        onClick={() => handleAdvanceStatus(p.id, p.status)}
                        disabled={updating}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <Navigation size={14} /> Start Delivery Route
                      </button>
                    )}

                    {p.status === 'out_for_delivery' && (
                      <button
                        onClick={() => handleAdvanceStatus(p.id, p.status)}
                        disabled={updating}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <CheckCircle size={14} /> Complete Delivery
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            )
          })
        ) : (
          <div className="col-span-2 bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-400">
            <UserCheck size={36} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No assigned delivery tasks matching criteria.</p>
          </div>
        )}
      </div>

      {/* Proof of Delivery Confirmation Modal */}
      {activeModalParcel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" /> Proof of Delivery
              </h3>
              <button onClick={() => setActiveModalParcel(null)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            <div className="text-xs bg-gray-50 p-3 rounded-xl border border-gray-200">
              <p className="font-bold text-gray-900">{activeModalParcel.tracking_number}</p>
              <p className="text-gray-600">Receiver: {activeModalParcel.receiver_name}</p>
              <p className="text-gray-600">{activeModalParcel.delivery_address_line1}</p>
            </div>

            <form onSubmit={handleConfirmDelivered} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Customer Delivery OTP / Signature Code</label>
                <input
                  type="text"
                  placeholder="e.g. 481920 (Optional)"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-mono focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Delivery Proof Notes</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Handed directly to receiver, payment collected..."
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModalParcel(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle size={15} /> Confirm Delivery
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
