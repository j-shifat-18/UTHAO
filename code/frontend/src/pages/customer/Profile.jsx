import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { PageHeader, TrackingTag } from '../../components/Bits.jsx'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true
    api.get('/customers/me')
      .then((res) => {
        if (!active) return
        setProfile(res.data)
        setForm({
          first_name: res.data.first_name || '',
          last_name: res.data.last_name || '',
          date_of_birth: res.data.date_of_birth || '',
          gender: res.data.gender || '',
        })
      })
      .catch((err) => setError(err.message))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await api.patch(`/customers/${profile.id}`, form)
      setProfile(res.data)
      setSuccess('Profile updated.')
    } catch (err) {
      setError(err.message || 'Could not save your changes.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading-line">Fetching your profile…</div>

  return (
    <div>
      <PageHeader eyebrow="Account" title="Your profile" sub="Keep your personal details up to date." />

      {profile && (
        <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
          <TrackingTag id={profile.id} label="CUS" />
          <span style={{ color: 'var(--ink-muted)', fontSize: 13.5 }}>{profile.email}</span>
        </div>
      )}

      <div className="card" style={{ maxWidth: 520 }}>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {form && (
          <form onSubmit={onSubmit}>
            <div className="field-row">
              <div className="field">
                <label htmlFor="first_name">First name</label>
                <input id="first_name" required value={form.first_name} onChange={update('first_name')} />
              </div>
              <div className="field">
                <label htmlFor="last_name">Last name</label>
                <input id="last_name" required value={form.last_name} onChange={update('last_name')} />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="date_of_birth">Date of birth</label>
                <input id="date_of_birth" type="date" value={form.date_of_birth || ''} onChange={update('date_of_birth')} />
              </div>
              <div className="field">
                <label htmlFor="gender">Gender</label>
                <select id="gender" value={form.gender || ''} onChange={update('gender')}>
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <button className="btn btn-accent" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
