import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Package,
  Truck,
  DollarSign,
  MapPin,
  User,
  Phone,
  Mail,
  ShieldAlert,
  CheckCircle,
  ArrowRight,
  Calculator,
  Zap,
} from 'lucide-react'
import { deliveryApi } from '../../api/deliveryApi.js'

const CATEGORIES = [
  { id: 'document', name: 'Document / Papers', desc: 'Base ৳50 + ৳10/kg' },
  { id: 'small_package', name: 'Small Package (<2kg)', desc: 'Base ৳80 + ৳25/kg' },
  { id: 'medium_package', name: 'Medium Package (2-10kg)', desc: 'Base ৳120 + ৳20/kg' },
  { id: 'large_package', name: 'Large Package (10-30kg)', desc: 'Base ৳200 + ৳15/kg' },
  { id: 'electronics', name: 'Electronics & Devices', desc: 'Base ৳160 + ৳30/kg' },
  { id: 'fragile', name: 'Fragile Glass/Ceramics', desc: 'Base ৳150 + ৳35/kg' },
  { id: 'perishable', name: 'Perishable Goods', desc: 'Base ৳180 + ৳30/kg' },
]

const CITIES = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh']

export default function BookDelivery() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [bookedResult, setBookedResult] = useState(null)

  const [formData, setFormData] = useState({
    sender_name: 'Saif Sarker',
    sender_phone: '+8801700112233',
    receiver_name: '',
    receiver_phone: '',
    receiver_email: '',
    delivery_address_line1: '',
    delivery_address_line2: '',
    delivery_city: 'Dhaka',
    delivery_state: 'Dhaka',
    delivery_postal_code: '1212',
    category_name: 'small_package',
    weight_kg: 1.5,
    description: '',
    priority: 'standard',
    is_fragile: false,
    delivery_instructions: '',
    payment_method: 'cod',
  })

  // Dynamic cost calculation
  const calculatedCost = deliveryApi.calculateDeliveryCost(
    Number(formData.weight_kg) || 1,
    formData.category_name,
    formData.priority
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const payload = {
        ...formData,
        weight_kg: Number(formData.weight_kg),
        delivery_cost: calculatedCost,
        estimated_delivery_date: new Date(Date.now() + 86400000 * (formData.priority === 'overnight' ? 1 : 2))
          .toISOString()
          .split('T')[0],
      }
      const res = await deliveryApi.bookParcel(payload)
      setBookedResult(res)
    } catch (err) {
      alert('Booking failed: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-widest text-red-600 mb-1">
          <Package size={16} /> Delivery Module
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Book a New Parcel Delivery</h1>
        <p className="text-sm text-gray-500 mt-1">Schedule instant pickup and delivery across Bangladesh with live cost estimation.</p>
      </motion.div>

      {/* Success Modal / Result Screen */}
      {bookedResult ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-emerald-200 rounded-2xl p-8 shadow-lg text-center space-y-5"
        >
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={36} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900">Parcel Delivery Booked Successfully!</h2>
            <p className="text-sm text-gray-500 mt-1">Your request has been dispatched to our nearest delivery hub.</p>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5 max-w-md mx-auto text-left space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-emerald-200">
              <span className="text-gray-500 uppercase tracking-wider font-semibold">Tracking Number</span>
              <span className="font-mono text-base font-bold text-emerald-800">{bookedResult.tracking_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Receiver:</span>
              <span className="font-bold text-gray-900">{bookedResult.receiver_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Destination:</span>
              <span className="font-medium text-gray-800">
                {bookedResult.delivery_city} ({bookedResult.delivery_postal_code})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Delivery Cost:</span>
              <span className="font-bold text-red-600 text-sm">৳{bookedResult.delivery_cost}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Est. Delivery Date:</span>
              <span className="font-medium text-gray-800">{bookedResult.estimated_delivery_date}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setBookedResult(null)
                setFormData((prev) => ({ ...prev, receiver_name: '', receiver_phone: '', description: '' }))
              }}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-xl transition-all"
            >
              Book Another Parcel
            </button>
            <button
              onClick={() => navigate('/dashboard/delivery/track')}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-all shadow-md shadow-red-900/10 flex items-center gap-2"
            >
              Track Package <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Form Fields */}
          <div className="md:col-span-2 space-y-6">
            {/* Sender & Receiver Info */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-red-600 flex items-center gap-1.5">
                <User size={14} /> Sender & Receiver Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sender Name</label>
                  <input
                    type="text"
                    required
                    value={formData.sender_name}
                    onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sender Phone</label>
                  <input
                    type="text"
                    required
                    value={formData.sender_phone}
                    onChange={(e) => setFormData({ ...formData, sender_phone: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Receiver Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Farhana Yeasmin"
                    value={formData.receiver_name}
                    onChange={(e) => setFormData({ ...formData, receiver_name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Receiver Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+8801700000000"
                    value={formData.receiver_phone}
                    onChange={(e) => setFormData({ ...formData, receiver_phone: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Destination Address */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-red-600 flex items-center gap-1.5">
                <MapPin size={14} /> Delivery Destination Address
              </h3>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Street Address Line 1 *</label>
                <input
                  type="text"
                  required
                  placeholder="House #, Road #, Area / Sector"
                  value={formData.delivery_address_line1}
                  onChange={(e) => setFormData({ ...formData, delivery_address_line1: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">City / Region *</label>
                  <select
                    value={formData.delivery_city}
                    onChange={(e) => setFormData({ ...formData, delivery_city: e.target.value, delivery_state: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:outline-none"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Postal Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="1212"
                    value={formData.delivery_postal_code}
                    onChange={(e) => setFormData({ ...formData, delivery_postal_code: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Delivery Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:outline-none font-semibold text-red-600"
                  >
                    <option value="standard">Standard (24-48 hrs)</option>
                    <option value="express">Express 🚀 (Next Day)</option>
                    <option value="overnight">Overnight ⚡ (Same Day)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Package Specifications */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-red-600 flex items-center gap-1.5">
                <Package size={14} /> Parcel Details & Specifications
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category_name}
                    onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:outline-none capitalize"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="50"
                    required
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Item Description</label>
                <input
                  type="text"
                  placeholder="e.g. Leather jacket, Smartphone, Documents"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="fragile"
                  checked={formData.is_fragile}
                  onChange={(e) => setFormData({ ...formData, is_fragile: e.target.checked })}
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                />
                <label htmlFor="fragile" className="text-xs text-gray-700 font-medium cursor-pointer">
                  Mark as Fragile (Requires careful handling & protective bubble wrap)
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Delivery Instructions for Rider</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Call before arrival, leave with security if absent..."
                  value={formData.delivery_instructions}
                  onChange={(e) => setFormData({ ...formData, delivery_instructions: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Checkout Summary Sidebar */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4 sticky top-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                  <Calculator size={14} className="text-red-500" /> Delivery Estimate
                </h3>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full uppercase">Live</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Base & Weight Charge:</span>
                  <span className="font-mono">৳{calculatedCost}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Priority ({formData.priority}):</span>
                  <span className="font-mono">{formData.priority === 'standard' ? 'Included' : '+Multiplier'}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Insurance & Handling:</span>
                  <span className="text-emerald-600 font-bold">FREE</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
                <span className="font-bold text-gray-900 text-sm">Total Delivery Fee:</span>
                <span className="text-2xl font-extrabold text-red-600 font-mono">৳{calculatedCost}</span>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-medium text-gray-700">Payment Option</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, payment_method: 'cod' })}
                    className={`py-2 px-3 rounded-xl border text-center font-medium transition-all ${
                      formData.payment_method === 'cod'
                        ? 'border-red-600 bg-red-50 text-red-700 font-bold'
                        : 'border-gray-200 bg-gray-50 text-gray-600'
                    }`}
                  >
                    Cash on Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, payment_method: 'prepaid' })}
                    className={`py-2 px-3 rounded-xl border text-center font-medium transition-all ${
                      formData.payment_method === 'prepaid'
                        ? 'border-red-600 bg-red-50 text-red-700 font-bold'
                        : 'border-gray-200 bg-gray-50 text-gray-600'
                    }`}
                  >
                    Online Prepaid
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-red-900/10 flex items-center justify-center gap-2 mt-4"
              >
                {submitting ? (
                  'Processing Booking...'
                ) : (
                  <>
                    Confirm & Dispatch <Zap size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
