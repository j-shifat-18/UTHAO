import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Truck,
  Package,
  CheckCircle,
  Plus,
  Search,
  Star,
  UserPlus,
  Navigation,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import { deliveryApi } from '../../api/deliveryApi.js'

export default function DeliveryManagement() {
  const [agents, setAgents] = useState([])
  const [parcels, setParcels] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [assignModalParcel, setAssignModalParcel] = useState(null)
  const [selectedAgentId, setSelectedAgentId] = useState('')

  // New Agent Form state
  const [newAgent, setNewAgent] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    vehicle_type: 'motorcycle',
    vehicle_plate_number: '',
    license_number: '',
    current_zone: 'Dhaka Central',
    max_parcels_per_day: 25,
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const agList = await deliveryApi.getAgents()
      const pclList = await deliveryApi.getParcels()
      setAgents(agList)
      setParcels(pclList)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleToggleAgent = async (agentId) => {
    await deliveryApi.toggleAgentAvailability(agentId)
    await loadData()
  }

  const handleAddAgent = async (e) => {
    e.preventDefault()
    try {
      await deliveryApi.addAgent(newAgent)
      setShowAddModal(false)
      setNewAgent({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        vehicle_type: 'motorcycle',
        vehicle_plate_number: '',
        license_number: '',
        current_zone: 'Dhaka Central',
        max_parcels_per_day: 25,
      })
      await loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDispatchParcel = async (e) => {
    e.preventDefault()
    if (!assignModalParcel || !selectedAgentId) return
    try {
      await deliveryApi.assignParcelToAgent(
        assignModalParcel.id,
        selectedAgentId,
        'delivery',
        'Dispatched by operations manager'
      )
      setAssignModalParcel(null)
      setSelectedAgentId('')
      await loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  const activeAgentsCount = agents.filter((a) => a.is_available).length
  const outForDeliveryCount = parcels.filter((p) => p.status === 'out_for_delivery').length
  const deliveredCount = parcels.filter((p) => p.status === 'delivered').length

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-widest text-red-600 mb-1">
            <Truck size={16} /> Operations & Fleet
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Fleet & Dispatch Management</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor delivery agent status, manage fleet roster, and dispatch parcels.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <UserPlus size={16} /> Register New Rider
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Active Riders Online</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-gray-900">{activeAgentsCount}</span>
            <span className="text-xs text-gray-500">/ {agents.length} Total</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Out for Delivery</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-amber-600">{outForDeliveryCount}</span>
            <span className="text-xs text-gray-500">Active Parcels</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Completed Deliveries</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-emerald-600">{deliveredCount}</span>
            <span className="text-xs text-gray-500">Parcels Handed Over</span>
          </div>
        </div>
      </div>

      {/* Delivery Agents Roster Table */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
          <Users size={16} className="text-red-500" /> Delivery Agents Roster
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase tracking-wider">
                <th className="p-3">Rider Name</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Current Zone</th>
                <th className="p-3">Deliveries</th>
                <th className="p-3">Rating</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {agents.map((ag) => (
                <tr key={ag.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="p-3 font-bold text-gray-900">
                    {ag.first_name} {ag.last_name}
                  </td>
                  <td className="p-3 text-gray-600 font-mono">{ag.phone}</td>
                  <td className="p-3">
                    <span className="capitalize font-semibold text-gray-800">{ag.vehicle_type}</span>
                    <p className="text-[10px] text-gray-400 font-mono">{ag.vehicle_plate_number}</p>
                  </td>
                  <td className="p-3 text-gray-700">{ag.current_zone}</td>
                  <td className="p-3 font-bold text-gray-900">{ag.total_deliveries}</td>
                  <td className="p-3 font-bold text-amber-500 flex items-center gap-1">
                    <Star size={13} className="fill-amber-400" /> {ag.rating}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ag.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {ag.is_available ? 'Available' : 'Offline'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleToggleAgent(ag.id)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-[11px]"
                    >
                      Toggle Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Parcel Dispatch Board */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
          <Package size={16} className="text-red-500" /> Dispatch Board & Live Parcel Queue
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase tracking-wider">
                <th className="p-3">Tracking #</th>
                <th className="p-3">Receiver</th>
                <th className="p-3">Destination City</th>
                <th className="p-3">Status</th>
                <th className="p-3">Assigned Rider</th>
                <th className="p-3 text-right">Dispatch Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {parcels.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="p-3 font-mono font-bold text-gray-900">{p.tracking_number}</td>
                  <td className="p-3">
                    <p className="font-bold text-gray-900">{p.receiver_name}</p>
                    <p className="text-gray-500 text-[10px] font-mono">{p.receiver_phone}</p>
                  </td>
                  <td className="p-3 text-gray-700">{p.delivery_city}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full font-bold capitalize text-[10px]">
                      {p.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600 font-medium">
                    {p.agent ? `${p.agent.first_name} ${p.agent.last_name}` : <span className="text-amber-600 font-bold">Unassigned</span>}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        setAssignModalParcel(p)
                        setSelectedAgentId(agents[0]?.id || '')
                      }}
                      className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg text-[11px]"
                    >
                      Reassign / Dispatch
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Agent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <UserPlus size={18} className="text-red-600" /> Register Delivery Rider
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAgent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newAgent.first_name}
                    onChange={(e) => setNewAgent({ ...newAgent, first_name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newAgent.last_name}
                    onChange={(e) => setNewAgent({ ...newAgent, last_name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+8801700000000"
                    value={newAgent.phone}
                    onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Vehicle Type</label>
                  <select
                    value={newAgent.vehicle_type}
                    onChange={(e) => setNewAgent({ ...newAgent, vehicle_type: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl"
                  >
                    <option value="bike">Bicycle</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="van">Delivery Van</option>
                    <option value="truck">Truck</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Plate Number</label>
                  <input
                    type="text"
                    placeholder="DHAKA-METRO-HA-1234"
                    value={newAgent.vehicle_plate_number}
                    onChange={(e) => setNewAgent({ ...newAgent, vehicle_plate_number: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Operating Zone</label>
                  <input
                    type="text"
                    value={newAgent.current_zone}
                    onChange={(e) => setNewAgent({ ...newAgent, current_zone: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-red-600 text-white font-bold rounded-xl shadow-md">
                  Save Rider
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Assign Modal */}
      {assignModalParcel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base">Assign Parcel to Rider</h3>
              <button onClick={() => setAssignModalParcel(null)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            <div className="text-xs bg-gray-50 p-3 rounded-xl border border-gray-200">
              <p className="font-bold text-gray-900">{assignModalParcel.tracking_number}</p>
              <p className="text-gray-600">City: {assignModalParcel.delivery_city}</p>
            </div>

            <form onSubmit={handleDispatchParcel} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Select Delivery Agent</label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl"
                >
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.first_name} {ag.last_name} ({ag.vehicle_type} - {ag.current_zone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalParcel(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-red-600 text-white font-bold rounded-xl shadow-md">
                  Dispatch & Assign
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
