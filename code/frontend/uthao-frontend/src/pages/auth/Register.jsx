import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const initial = { first_name: '', last_name: '', email: '', phone: '', password: '' }

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initial)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setLoading(true)
    try {
      await register(form)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Could not create your account.')
      if (err.errors?.length) {
        const map = {}
        err.errors.forEach((e) => { map[e.field] = e.message })
        setFieldErrors(map)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-visual">
        <div className="mark">UTHAO</div>
        <h2>One waybill. Full visibility. From doorstep to doorstep.</h2>
        <svg className="route-map" width="260" height="200" viewBox="0 0 260 200" fill="none">
          <path d="M10 20 C 70 40, 90 90, 140 100 S 210 150, 250 185"
            stroke="#0E7C7B" strokeWidth="1.5" strokeDasharray="1 8" strokeLinecap="round" />
          <circle cx="10" cy="20" r="4" fill="#F2C94C" />
          <circle cx="250" cy="185" r="4" fill="#0E7C7B" />
        </svg>
        <div className="foot">SECURE SESSION · UTHAO LOGISTICS PLATFORM</div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-box">
          <h1>Create your account</h1>
          <p className="sub">Set up a customer account to start shipping with UTHAO.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={onSubmit}>
            <div className="field-row">
              <div className="field">
                <label htmlFor="first_name">First name</label>
                <input id="first_name" required value={form.first_name} onChange={update('first_name')} placeholder="John" />
                {fieldErrors.first_name && <span className="hint">{fieldErrors.first_name}</span>}
              </div>
              <div className="field">
                <label htmlFor="last_name">Last name</label>
                <input id="last_name" required value={form.last_name} onChange={update('last_name')} placeholder="Doe" />
                {fieldErrors.last_name && <span className="hint">{fieldErrors.last_name}</span>}
              </div>
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" required value={form.email} onChange={update('email')} placeholder="you@example.com" />
              {fieldErrors.email && <span className="hint">{fieldErrors.email}</span>}
            </div>

            <div className="field">
              <label htmlFor="phone">Phone</label>
              <input id="phone" required value={form.phone} onChange={update('phone')} placeholder="+8801712345678" />
              {fieldErrors.phone && <span className="hint">{fieldErrors.phone}</span>}
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" required minLength={6} value={form.password} onChange={update('password')} placeholder="At least 6 characters" />
              {fieldErrors.password && <span className="hint">{fieldErrors.password}</span>}
            </div>

            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
