import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      const dest = location.state?.from || '/'
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err.message || 'Could not sign in. Check your details and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-visual">
        <div className="mark">UTHAO</div>
        <h2>Every parcel has a route. We make sure it's the right one.</h2>
        <svg className="route-map" width="260" height="200" viewBox="0 0 260 200" fill="none">
          <path d="M10 180 C 60 140, 90 160, 120 110 S 200 60, 250 20"
            stroke="#0E7C7B" strokeWidth="1.5" strokeDasharray="1 8" strokeLinecap="round" />
          <circle cx="10" cy="180" r="4" fill="#F2C94C" />
          <circle cx="250" cy="20" r="4" fill="#0E7C7B" />
        </svg>
        <div className="foot">SECURE SESSION · UTHAO LOGISTICS PLATFORM</div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-box">
          <h1>Sign in</h1>
          <p className="sub">Enter your details to access your dashboard.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={update('email')}
                placeholder="you@example.com"
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={update('password')}
                placeholder="••••••••"
              />
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="auth-switch">
            New to UTHAO? <Link to="/register">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
