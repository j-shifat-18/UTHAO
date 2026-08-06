import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { api } from '../../api/client'
import { PageHeader, EmptyState } from '../../components/Bits.jsx'

const emptyForm = {
  label: 'home',
  address_line1: '',
  city: '',
  state: '',
  postal_code: '',
  is_default: false,
}

const inputClass =
  'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all bg-white'

export default function Addresses() {
  const [customerId, setCustomerId] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const me = await api.get('/customers/me')
        if (!active) return
        const customer = me.data?.data || me.data
        const cid = customer?.id
        if (cid && cid !== 'undefined') {
          setCustomerId(cid)
          const list = await api.get(`/customers/${cid}/addresses`)
          if (!active) return
          setAddresses(list.data?.data || list.data || [])
        } else {
          setError('Could not resolve customer account.')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        active && setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  function update(field) {
    return (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
      setForm((f) => ({ ...f, [field]: value }))
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!customerId || customerId === 'undefined') {
      setError('Customer profile missing. Please refresh the page.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await api.post(`/customers/${customerId}/addresses`, form)
      const newAddr = res.data?.data || res.data
      setAddresses((list) => [newAddr, ...list])
      setForm(emptyForm)
      setShowForm(false)
    } catch (err) {
      setError(err.message || 'Could not add this address.')
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return <p className="text-sm text-gray-400 font-mono">Fetching your addresses…</p>

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Addresses"
        sub="Pickup and delivery locations linked to your account."
        actions={
          <motion.button
            onClick={() => setShowForm((s) => !s)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-4 py-2 text-sm font-semibold bg-gray-900 hover:bg-gray-700 text-white rounded-xl transition-colors shadow-sm"
          >
            {showForm ? 'Cancel' : '+ Add address'}
          </motion.button>
        }
      />

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm max-w-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">New address</h3>
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label htmlFor="label" className="block text-xs font-semibold text-gray-600 mb-1.5">Label</label>
                  <select id="label" value={form.label} onChange={update('label')} className={inputClass}>
                    <option value="home">Home</option>
                    <option value="office">Office / Work</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="address_line1" className="block text-xs font-semibold text-gray-600 mb-1.5">Address</label>
                  <input id="address_line1" required value={form.address_line1} onChange={update('address_line1')} placeholder="123 Main St" className={inputClass} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-xs font-semibold text-gray-600 mb-1.5">City</label>
                    <input id="city" required value={form.city} onChange={update('city')} placeholder="Dhaka" className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-xs font-semibold text-gray-600 mb-1.5">State / Division</label>
                    <input id="state" required value={form.state} onChange={update('state')} placeholder="Dhaka" className={inputClass} />
                  </div>
                </div>

                <div>
                  <label htmlFor="postal_code" className="block text-xs font-semibold text-gray-600 mb-1.5">Postal code</label>
                  <input id="postal_code" required value={form.postal_code} onChange={update('postal_code')} placeholder="1205" className={inputClass} />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
                  <input type="checkbox" checked={form.is_default} onChange={update('is_default')} className="accent-red-600" />
                  Set as default address
                </label>

                <motion.button
                  type="submit"
                  disabled={saving}
                  whileHover={{ scale: saving ? 1 : 1.02 }}
                  whileTap={{ scale: saving ? 1 : 0.98 }}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? 'Adding…' : 'Add address'}
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {addresses.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <EmptyState title="No addresses yet" message="Add a pickup or delivery address to speed up future orders." />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {addresses.map((a, i) => (
            <motion.div
              key={a.id || i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 capitalize">
                  <MapPin size={11} /> {a.label}
                </span>
                {a.is_default && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                    default
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-800 font-medium">{a.address_line1}</p>
              <p className="text-xs text-gray-400 mt-0.5">{a.city}, {a.state} {a.postal_code}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
