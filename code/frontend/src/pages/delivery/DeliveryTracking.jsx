import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  UserCheck,
  AlertCircle,
  Phone,
  ArrowRight,
  ShieldCheck,
  Navigation,
} from 'lucide-react'
import { deliveryApi } from '../../api/deliveryApi.js'

const SAMPLE_TRACKING_NUMBERS = [
  { code: 'UT-892410-DH', label: 'Out for Delivery (Dhaka)' },
  { code: 'UT-771029-DH', label: 'Picked Up (Dhaka)' },
  { code: 'UT-654321-CTG', label: 'Delivered (Chittagong)' },
]

const LIFECYCLE_STEPS = [
  { key: 'booked', label: 'Booked', desc: 'Order confirmed' },
  { key: 'picked_up', label: 'Picked Up', desc: 'Rider collected item' },
  { key: 'at_warehouse', label: 'At Warehouse', desc: 'Sorted at regional hub' },
  { key: 'in_transit', label: 'In Transit', desc: 'En route to city' },
  { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Rider nearby' },
  { key: 'delivered', label: 'Delivered', desc: 'Handed to receiver' },
]

const STATUS_BADGES = {
  booked: { bg: 'bg-yellow-100 text-yellow-800 border-yellow-300', text: 'Booked' },
  picked_up: { bg: 'bg-blue-100 text-blue-800 border-blue-300', text: 'Picked Up' },
  at_warehouse: { bg: 'bg-purple-100 text-purple-800 border-purple-300', text: 'At Warehouse' },
  in_transit: { bg: 'bg-indigo-100 text-indigo-800 border-indigo-300', text: 'In Transit' },
  out_for_delivery: { bg: 'bg-amber-100 text-amber-900 border-amber-400 font-bold animate-pulse', text: 'Out for Delivery' },
  delivered: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold', text: 'Delivered' },
  failed: { bg: 'bg-red-100 text-red-800 border-red-300', text: 'Delivery Attempt Failed' },
  cancelled: { bg: 'bg-gray-100 text-gray-800 border-gray-300', text: 'Cancelled' },
}

export default function DeliveryTracking() {
  const [query, setQuery] = useState('UT-892410-DH')
  const [loading, setLoading] = useState(false)
  const [parcel, setParcel] = useState(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (trackingNum = query) => {
    if (!trackingNum.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await deliveryApi.getParcelByTracking(trackingNum)
      setParcel(res)
    } catch {
      setParcel(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    handleSearch('UT-892410-DH')
  }, [])

  const currentStepIndex = parcel
    ? LIFECYCLE_STEPS.findIndex((s) => s.key === parcel.status)
    : -1

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-widest text-red-600 mb-1">
          <Truck size={16} /> Delivery Module
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Live Parcel Delivery Tracking</h1>
        <p className="text-sm text-gray-500 mt-1">Track your package location and delivery progress in real-time.</p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSearch()
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Tracking Number (e.g. UT-892410-DH)"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-mono focus:bg-white focus:border-red-500 focus:outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded-xl transition-all shadow-md shadow-red-900/10 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Clock size={16} className="animate-spin" />
            ) : (
              <>
                <Search size={16} /> Track Package
              </>
            )}
          </button>
        </form>

        {/* Quick Sample Tracking Numbers */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-gray-500">
          <span className="font-medium text-gray-600">Sample tracking:</span>
          {SAMPLE_TRACKING_NUMBERS.map((s) => (
            <button
              key={s.code}
              onClick={() => {
                setQuery(s.code)
                handleSearch(s.code)
              }}
              className="px-2.5 py-1 bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-700 rounded-lg border border-gray-200 transition-all font-mono text-[11px]"
            >
              {s.code} ({s.label})
            </button>
          ))}
        </div>
      </motion.div>

      {/* Results area */}
      {searched && !loading && !parcel && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <AlertCircle size={40} className="mx-auto text-amber-500 mb-3" />
          <h3 className="text-base font-bold text-gray-900">No Package Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            We couldn't find any delivery record matching "<span className="font-mono">{query}</span>". Please verify your tracking number.
          </p>
        </motion.div>
      )}

      {parcel && (
        <AnimatePresence mode="wait">
          <motion.div
            key={parcel.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Main Parcel Overview Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-5">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-lg font-bold text-gray-900 tracking-wider">
                      {parcel.tracking_number}
                    </span>
                    <span
                      className={`px-3 py-0.5 text-xs rounded-full border ${
                        STATUS_BADGES[parcel.status]?.bg || 'bg-gray-100 text-gray-800 border-gray-300'
                      }`}
                    >
                      {STATUS_BADGES[parcel.status]?.text || parcel.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Category: <strong className="text-gray-700 capitalize">{parcel.category_name}</strong> • Weight:{' '}
                    <strong className="text-gray-700">{parcel.weight_kg} kg</strong>
                    {parcel.is_fragile && (
                      <span className="ml-2 px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded border border-amber-200">
                        FRAGILE
                      </span>
                    )}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Estimated Delivery</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5 flex items-center gap-1.5 justify-end">
                    <Clock size={14} className="text-red-500" />
                    {parcel.estimated_delivery_date || 'Within 24 Hours'}
                  </p>
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="py-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-6">Delivery Progress</p>
                <div className="relative flex items-center justify-between max-w-4xl mx-auto px-4">
                  {/* Step Connecting Line */}
                  <div className="absolute left-8 right-8 top-4 h-1 bg-gray-200 -z-0">
                    <div
                      className="h-full bg-red-600 transition-all duration-500"
                      style={{
                        width: `${
                          currentStepIndex >= 0
                            ? (currentStepIndex / (LIFECYCLE_STEPS.length - 1)) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  {LIFECYCLE_STEPS.map((step, idx) => {
                    const isCompleted = currentStepIndex >= idx
                    const isCurrent = currentStepIndex === idx
                    return (
                      <div key={step.key} className="relative z-10 flex flex-col items-center text-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                            isCompleted
                              ? 'bg-red-600 text-white ring-4 ring-red-100'
                              : 'bg-white text-gray-400 border-2 border-gray-300'
                          } ${isCurrent ? 'scale-110' : ''}`}
                        >
                          {isCompleted ? <CheckCircle2 size={18} /> : idx + 1}
                        </div>
                        <p className={`text-xs font-medium mt-2 ${isCompleted ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>
                          {step.label}
                        </p>
                        <p className="text-[10px] text-gray-400 max-w-[80px] hidden sm:block mt-0.5">{step.desc}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Sender & Receiver Address Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 text-xs">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <p className="font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <MapPin size={13} className="text-red-500" /> Pickup Origin
                  </p>
                  <p className="font-bold text-gray-900 text-sm">{parcel.sender_name}</p>
                  <p className="text-gray-600 mt-0.5">{parcel.sender_phone}</p>
                  <p className="text-gray-500 mt-1">Sorting Hub: Dhaka Central (DHK-01)</p>
                </div>

                <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                  <p className="font-semibold text-red-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Navigation size={13} className="text-red-600" /> Delivery Destination
                  </p>
                  <p className="font-bold text-gray-900 text-sm">{parcel.receiver_name}</p>
                  <p className="text-gray-600 mt-0.5">{parcel.receiver_phone}</p>
                  <p className="text-gray-700 font-medium mt-1">
                    {parcel.delivery_address_line1}, {parcel.delivery_city} - {parcel.delivery_postal_code}
                  </p>
                  {parcel.delivery_instructions && (
                    <p className="text-gray-500 italic mt-1.5 border-t border-red-100 pt-1 text-[11px]">
                      Instruction: "{parcel.delivery_instructions}"
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Assigned Rider Info & Route Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-1 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Assigned Delivery Agent</p>
                {parcel.agent ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold text-lg">
                        {parcel.agent.first_name[0]}
                        {parcel.agent.last_name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">
                          {parcel.agent.first_name} {parcel.agent.last_name}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Truck size={12} /> {parcel.agent.vehicle_type.toUpperCase()} • Rating ⭐ {parcel.agent.rating}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs space-y-1">
                      <p className="text-gray-600">
                        Vehicle No: <span className="font-mono font-bold text-gray-800">{parcel.agent.vehicle_plate_number}</span>
                      </p>
                      <p className="text-gray-600">
                        Zone: <span className="font-medium text-gray-800">{parcel.agent.current_zone}</span>
                      </p>
                    </div>

                    <a
                      href={`tel:${parcel.agent.phone}`}
                      className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all"
                    >
                      <Phone size={13} /> Call Rider ({parcel.agent.phone})
                    </a>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <UserCheck size={28} className="mx-auto mb-1 opacity-50" />
                    <p className="text-xs">Rider assignment pending at hub</p>
                  </div>
                )}
              </div>

              {/* Activity Log / Status History */}
              <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Tracking Activity Log</p>
                <div className="space-y-4">
                  {parcel.history && parcel.history.length > 0 ? (
                    parcel.history.map((hist, i) => (
                      <div key={hist.id || i} className="flex gap-3 text-xs">
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-600 mt-1" />
                          {i < parcel.history.length - 1 && <div className="w-0.5 h-full bg-gray-200 my-1" />}
                        </div>
                        <div className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <div className="flex items-center justify-between font-medium text-gray-900">
                            <span className="capitalize font-bold text-red-600">{hist.status.replace('_', ' ')}</span>
                            <span className="text-gray-400 text-[11px] font-mono">
                              {new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-gray-700 mt-1">{hist.notes}</p>
                          <p className="text-gray-400 text-[11px] mt-0.5 flex items-center gap-1">
                            <MapPin size={11} /> {hist.location}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">No historical logs available.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
