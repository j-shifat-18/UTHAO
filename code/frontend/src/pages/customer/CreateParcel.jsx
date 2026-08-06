import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../../api/client'
import { PageHeader } from '../../components/Bits.jsx'
import { Package, Truck, CheckCircle2, ArrowRight, ShieldAlert, Sparkles, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const inputClass = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all bg-white text-gray-800'
const labelClass = 'block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider'

const PRIORITY_MULTIPLIERS = {
  standard: 1.0,
  express: 1.5,
  overnight: 2.0,
}

export default function CreateParcel() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [branches, setBranches] = useState([])
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [createdParcel, setCreatedParcel] = useState(null)

  const [formData, setFormData] = useState({
    receiver_name: '',
    receiver_phone: '',
    receiver_email: '',
    delivery_address_line1: '',
    delivery_city: 'Dhaka',
    delivery_state: 'Dhaka',
    delivery_postal_code: '1216',
    category_id: '',
    weight_kg: '1.0',
    priority: 'standard',
    payment_method: 'prepaid',
    origin_branch_id: '',
    destination_branch_id: '',
    is_fragile: false,
    description: '',
  })

  useEffect(() => {
    async function loadData() {
      try {
        // Load categories
        try {
          const catRes = await api.get('/parcels/categories')
          const cats = catRes.data?.data || []
          if (cats.length > 0) {
            setCategories(cats)
            setFormData((f) => ({ ...f, category_id: String(cats[0].id) }))
          } else {
            // Default categories if database table is empty
            const fallbackCats = [
              { id: 1, name: 'Document', base_price: '50.00', price_per_kg: '10.00' },
              { id: 2, name: 'Small Package', base_price: '80.00', price_per_kg: '25.00' },
              { id: 3, name: 'Heavy Package', base_price: '150.00', price_per_kg: '40.00' },
            ]
            setCategories(fallbackCats)
            setFormData((f) => ({ ...f, category_id: '1' }))
          }
        } catch {
          const fallbackCats = [
            { id: 1, name: 'Document', base_price: '50.00', price_per_kg: '10.00' },
            { id: 2, name: 'Small Package', base_price: '80.00', price_per_kg: '25.00' },
            { id: 3, name: 'Heavy Package', base_price: '150.00', price_per_kg: '40.00' },
          ]
          setCategories(fallbackCats)
          setFormData((f) => ({ ...f, category_id: '1' }))
        }

        // Load branches if available
        try {
          const branchRes = await api.get('/branches')
          const brs = branchRes.data?.data || []
          if (brs.length > 0) {
            setBranches(brs)
            setFormData((f) => ({
              ...f,
              origin_branch_id: String(brs[0].id),
              destination_branch_id: brs.length > 1 ? String(brs[1].id) : String(brs[0].id),
              delivery_city: brs.length > 1 ? brs[1].city : brs[0].city,
              delivery_state: brs.length > 1 ? brs[1].state : brs[0].state,
            }))
          }
        } catch {
          // Ignore branch load failure so booking proceeds smoothly
        }
      } catch (err) {
        setError(err.message || 'Failed to load booking details')
      } finally {
        setLoadingInitial(false)
      }
    }
    loadData()
  }, [])

  // Calculate delivery cost
  const selectedCat = categories.find((c) => String(c.id) === String(formData.category_id)) || categories[0]
  const basePrice = selectedCat ? parseFloat(selectedCat.base_price || 0) : 50
  const pricePerKg = selectedCat ? parseFloat(selectedCat.price_per_kg || 0) : 10
  const weight = parseFloat(formData.weight_kg) || 1.0
  const multiplier = PRIORITY_MULTIPLIERS[formData.priority] || 1.0
  const calculatedCost = ((basePrice + pricePerKg * weight) * multiplier).toFixed(2)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    // Validation
    if (!formData.receiver_name.trim()) {
      setSubmitting(false)
      return setError('Receiver name is required')
    }
    if (!formData.receiver_phone.trim()) {
      setSubmitting(false)
      return setError('Receiver phone number is required')
    }
    if (!formData.delivery_address_line1.trim()) {
      setSubmitting(false)
      return setError('Delivery address is required')
    }
    if (!formData.delivery_city.trim()) {
      setSubmitting(false)
      return setError('Delivery city is required')
    }
    if (!formData.category_id) {
      setSubmitting(false)
      return setError('Category selection is required')
    }
    if (weight <= 0) {
      setSubmitting(false)
      return setError('Weight must be greater than 0')
    }

    const payload = {
      receiver_name: formData.receiver_name.trim(),
      receiver_phone: formData.receiver_phone.trim(),
      receiver_email: formData.receiver_email.trim() || undefined,
      delivery_address_line1: formData.delivery_address_line1.trim(),
      delivery_city: formData.delivery_city.trim(),
      delivery_state: formData.delivery_state.trim() || 'Dhaka',
      delivery_postal_code: formData.delivery_postal_code.trim() || '1216',
      category_id: parseInt(formData.category_id, 10),
      weight_kg: weight,
      priority: formData.priority,
      payment_method: formData.payment_method,
      is_fragile: formData.is_fragile,
      description: formData.description.trim() || undefined,
    }

    // Only attach branch IDs if selected from a real fetched branch
    if (branches.length > 0) {
      if (formData.origin_branch_id) {
        payload.origin_branch_id = parseInt(formData.origin_branch_id, 10)
      }
      if (formData.destination_branch_id) {
        payload.destination_branch_id = parseInt(formData.destination_branch_id, 10)
      }
    }

    try {
      const res = await api.post('/parcels', payload)
      const data = res.data?.data || res.data
      setCreatedParcel(data)
    } catch (err) {
      setError(err.message || 'Failed to create parcel booking')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingInitial) {
    return <p className="text-sm text-gray-400 font-mono">Loading booking options…</p>
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Shipment Booking"
        title="Book a Parcel"
        sub="Create a new shipment request with real-time cost calculation and tracking."
      />

      {/* Confirmation Modal */}
      <AnimatePresence>
        {createdParcel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-100 space-y-5"
            >
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-gray-900">Shipment Booked!</h3>
                <p className="text-sm text-gray-500 mt-1">Your parcel has been successfully registered.</p>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-left space-y-2">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Tracking Number</span>
                  <span className="font-mono font-bold text-red-600 text-sm">{createdParcel.tracking_number}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Status</span>
                  <span className="font-semibold text-gray-800 capitalize">{createdParcel.status || 'booked'}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Estimated Cost</span>
                  <span className="font-bold text-gray-900 text-base">৳{createdParcel.delivery_cost || calculatedCost}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setCreatedParcel(null)}
                  className="flex-1 py-3 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                >
                  Book Another
                </button>
                <button
                  onClick={() => navigate('/dashboard/my-parcels')}
                  className="flex-1 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-900/10 transition-all flex items-center justify-center gap-1.5"
                >
                  My Parcels
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns: Form fields */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Section 1: Route & Branch */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <MapPin size={18} className="text-red-500" />
              Route & Branch Selection
            </h3>

            {branches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Origin Branch</label>
                  <select
                    className={inputClass}
                    value={formData.origin_branch_id}
                    onChange={(e) => setFormData({ ...formData, origin_branch_id: e.target.value })}
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Destination Branch</label>
                  <select
                    className={inputClass}
                    value={formData.destination_branch_id}
                    onChange={(e) => {
                      const selectedBranch = branches.find((b) => String(b.id) === String(e.target.value))
                      setFormData({
                        ...formData,
                        destination_branch_id: e.target.value,
                        delivery_city: selectedBranch ? selectedBranch.city : formData.delivery_city,
                        delivery_state: selectedBranch ? selectedBranch.state : formData.delivery_state,
                      })
                    }}
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Origin City *</label>
                  <input
                    className={inputClass}
                    placeholder="e.g. Dhaka"
                    value="Dhaka"
                    readOnly
                  />
                </div>
                <div>
                  <label className={labelClass}>Destination City *</label>
                  <input
                    className={inputClass}
                    placeholder="e.g. Chittagong"
                    value={formData.delivery_city}
                    onChange={(e) => setFormData({ ...formData, delivery_city: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Receiver Info */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Truck size={18} className="text-red-500" />
              Receiver & Delivery Address
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Receiver Name *</label>
                <input
                  className={inputClass}
                  placeholder="e.g. Karim Khan"
                  value={formData.receiver_name}
                  onChange={(e) => setFormData({ ...formData, receiver_name: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Receiver Phone *</label>
                <input
                  className={inputClass}
                  placeholder="e.g. +8801812345678"
                  value={formData.receiver_phone}
                  onChange={(e) => setFormData({ ...formData, receiver_phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Receiver Email (Optional)</label>
              <input
                type="email"
                className={inputClass}
                placeholder="e.g. receiver@example.com"
                value={formData.receiver_email}
                onChange={(e) => setFormData({ ...formData, receiver_email: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>Street Address *</label>
              <input
                className={inputClass}
                placeholder="e.g. 456 Mirpur Road, Sector 3"
                value={formData.delivery_address_line1}
                onChange={(e) => setFormData({ ...formData, delivery_address_line1: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>City *</label>
                <input
                  className={inputClass}
                  placeholder="Dhaka"
                  value={formData.delivery_city}
                  onChange={(e) => setFormData({ ...formData, delivery_city: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>State / Division *</label>
                <input
                  className={inputClass}
                  placeholder="Dhaka"
                  value={formData.delivery_state}
                  onChange={(e) => setFormData({ ...formData, delivery_state: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Postal Code *</label>
                <input
                  className={inputClass}
                  placeholder="1216"
                  value={formData.delivery_postal_code}
                  onChange={(e) => setFormData({ ...formData, delivery_postal_code: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Package Specs */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Package size={18} className="text-red-500" />
              Package Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Category *</label>
                <select
                  className={inputClass}
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Base ৳{c.base_price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Weight (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  className={inputClass}
                  value={formData.weight_kg}
                  onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                />
              </div>

              <div>
                <label className={labelClass}>Priority *</label>
                <select
                  className={inputClass}
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="standard">Standard (1.0x)</option>
                  <option value="express">Express (1.5x)</option>
                  <option value="overnight">Overnight (2.0x)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Payment Method *</label>
                <select
                  className={inputClass}
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                >
                  <option value="prepaid">Prepaid (Pay now)</option>
                  <option value="cod">COD (Cash on delivery)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="is_fragile"
                  checked={formData.is_fragile}
                  onChange={(e) => setFormData({ ...formData, is_fragile: e.target.checked })}
                  className="w-5 h-5 text-red-600 focus:ring-red-500 rounded cursor-pointer"
                />
                <label htmlFor="is_fragile" className="text-sm font-semibold text-gray-700 cursor-pointer flex items-center gap-1.5">
                  <ShieldAlert size={16} className="text-amber-500" />
                  Fragile Item (Handle with care)
                </label>
              </div>
            </div>

            <div>
              <label className={labelClass}>Package Description / Notes</label>
              <textarea
                rows={2}
                className={inputClass}
                placeholder="Contents description, special delivery instructions…"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Right column: Real-time Cost Breakdown Card */}
        <div className="space-y-6">
          <div className="bg-gray-900 text-white rounded-3xl p-6 shadow-xl sticky top-24 space-y-6 border border-gray-800">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-2 text-red-500 font-bold">
                <Sparkles size={20} />
                Cost Calculation
              </div>
              <span className="text-xs uppercase font-semibold text-gray-400 bg-gray-800 px-2.5 py-1 rounded-full">
                {formData.priority}
              </span>
            </div>

            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>Category Base Price</span>
                <span className="font-mono text-white">৳{basePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Weight Fee ({weight}kg @ ৳{pricePerKg}/kg)</span>
                <span className="font-mono text-white">৳{(pricePerKg * weight).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Priority Multiplier</span>
                <span className="font-mono text-amber-400 font-semibold">{multiplier}x</span>
              </div>

              <div className="border-t border-gray-800 pt-3 flex justify-between items-baseline">
                <span className="font-semibold text-white">Total Estimate</span>
                <span className="text-3xl font-extrabold text-red-500 font-mono">৳{calculatedCost}</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              Formula: (Base Price + Rate/kg × Weight) × Priority Multiplier. Prices include standard insurance.
            </p>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={submitting}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-base rounded-xl shadow-lg shadow-red-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? 'Booking Parcel…' : 'Confirm & Book Parcel'}
            </motion.button>
          </div>
        </div>
      </form>
    </div>
  )
}
