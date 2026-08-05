import { useEffect, useState } from 'react'
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
        setCustomerId(me.data.id)
        const list = await api.get(`/customers/${me.data.id}/addresses`)
        if (!active) return
        setAddresses(list.data || [])
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
    setSaving(true)
    setError('')
    try {
      const res = await api.post(`/customers/${customerId}/addresses`, form)
      setAddresses((list) => [...list, res.data])
      setForm(emptyForm)
      setShowForm(false)
    } catch (err) {
      setError(err.message || 'Could not add this address.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading-line">Fetching your addresses…</div>

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Addresses"
        sub="Pickup and delivery locations linked to your account."
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel' : '+ Add address'}
          </button>
        }
      />

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20, maxWidth: 520 }}>
          <form onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="label">Label</label>
              <select id="label" value={form.label} onChange={update('label')}>
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="address_line1">Address</label>
              <input id="address_line1" required value={form.address_line1} onChange={update('address_line1')} placeholder="123 Main St" />
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="city">City</label>
                <input id="city" required value={form.city} onChange={update('city')} placeholder="Dhaka" />
              </div>
              <div className="field">
                <label htmlFor="state">State / Division</label>
                <input id="state" required value={form.state} onChange={update('state')} placeholder="Dhaka" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="postal_code">Postal code</label>
              <input id="postal_code" required value={form.postal_code} onChange={update('postal_code')} placeholder="1205" />
            </div>
            <label className="checkbox-row">
              <input type="checkbox" checked={form.is_default} onChange={update('is_default')} />
              Set as default address
            </label>
            <button className="btn btn-accent" type="submit" disabled={saving}>
              {saving ? 'Adding…' : 'Add address'}
            </button>
          </form>
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="card">
          <EmptyState title="No addresses yet" message="Add a pickup or delivery address to speed up future orders." />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {addresses.map((a) => (
            <div className="card" key={a.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="badge badge-teal">{a.label}</span>
                {a.is_default && <span className="badge badge-amber">default</span>}
              </div>
              <div style={{ marginTop: 12, fontSize: 14 }}>{a.address_line1}</div>
              <div style={{ color: 'var(--ink-muted)', fontSize: 13 }}>
                {a.city}, {a.state} {a.postal_code}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
