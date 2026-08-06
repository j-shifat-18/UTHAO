import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../../api/client'
import { PageHeader, TrackingTag } from '../../components/Bits.jsx'

const inputClass =
  'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all bg-white'

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
        // Axios wraps body in res.data
        const data = res.data
        setProfile(data)
        setForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          date_of_birth: data.date_of_birth || '',
          gender: data.gender || '',
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
      setSuccess('Profile updated successfully.')
    } catch (err) {
      setError(err.message || 'Could not save your changes.')
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return <p className="text-sm text-gray-400 font-mono">Fetching your profile…</p>

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Account" title="Your profile" sub="Keep your personal details up to date." />

      {profile && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <TrackingTag id={profile.id} label="CUS" />
          <span className="text-sm text-gray-500">{profile.email}</span>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm max-w-lg"
      >
        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl mb-5 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 border border-green-200 px-4 py-2.5 rounded-xl mb-5 text-sm">
            {success}
          </div>
        )}

        {form && (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-xs font-semibold text-gray-600 mb-1.5">
                  First name
                </label>
                <input id="first_name" required value={form.first_name} onChange={update('first_name')} className={inputClass} />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Last name
                </label>
                <input id="last_name" required value={form.last_name} onChange={update('last_name')} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date_of_birth" className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Date of birth
                </label>
                <input id="date_of_birth" type="date" value={form.date_of_birth || ''} onChange={update('date_of_birth')} className={inputClass} />
              </div>
              <div>
                <label htmlFor="gender" className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Gender
                </label>
                <select id="gender" value={form.gender || ''} onChange={update('gender')} className={inputClass}>
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={saving}
              whileHover={{ scale: saving ? 1 : 1.02 }}
              whileTap={{ scale: saving ? 1 : 0.98 }}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
