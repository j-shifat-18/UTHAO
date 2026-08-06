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
    <div className="landing-page" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <div style={{ background: '#111827', padding: '64px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ fontSize: '2rem', fontWeight: '800', color: '#E53935', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/delivery-guy.png" alt="UTHAO" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          UTHAO
        </div>
        
        <div style={{ zIndex: 10 }}>
          <h2 style={{ fontSize: '3.5rem', fontWeight: '800', lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-1px' }}>
            Welcome back. <br/><span style={{ color: '#E53935' }}>Ready to ship?</span>
          </h2>
          <p style={{ color: '#9CA3AF', fontSize: '1.25rem', maxWidth: '400px', lineHeight: 1.6 }}>
            Access your dashboard to track parcels, manage shipments, and scale your logistics.
          </p>
        </div>

        <div style={{ color: '#6B7280', fontSize: '0.875rem', fontWeight: '500', zIndex: 10 }}>
          SECURE SESSION &middot; UTHAO LOGISTICS PLATFORM
        </div>

        <img src="/delivery-guy.png" alt="Background" style={{ position: 'absolute', right: '-10%', bottom: '5%', opacity: 0.15, width: '600px', pointerEvents: 'none' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', backgroundColor: '#FAFAFA' }}>
        <div style={{ width: '100%', maxWidth: '440px', background: '#fff', padding: '48px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', border: '1px solid #E5E7EB' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>Sign in</h1>
          <p style={{ color: '#6B7280', marginBottom: '32px' }}>Enter your details to access your dashboard.</p>

          {error && <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.95rem' }}>{error}</div>}

          <form onSubmit={onSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="email" style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '8px', fontSize: '0.95rem' }}>Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={update('email')}
                placeholder="you@example.com"
                style={{ width: '100%', padding: '14px 16px', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '1rem', boxSizing: 'border-box', outline: 'none', transition: 'all 0.2s' }}
                onFocus={(e) => { e.target.style.borderColor = '#E53935'; e.target.style.boxShadow = '0 0 0 3px rgba(229,57,53,0.1)' }}
                onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <div style={{ marginBottom: '32px' }}>
              <label htmlFor="password" style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '8px', fontSize: '0.95rem' }}>Password</label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={update('password')}
                placeholder="••••••••"
                style={{ width: '100%', padding: '14px 16px', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '1rem', boxSizing: 'border-box', outline: 'none', transition: 'all 0.2s' }}
                onFocus={(e) => { e.target.style.borderColor = '#E53935'; e.target.style.boxShadow = '0 0 0 3px rgba(229,57,53,0.1)' }}
                onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              style={{ width: '100%', padding: '16px', backgroundColor: '#E53935', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1.125rem', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s', boxShadow: '0 4px 6px -1px rgba(229, 57, 53, 0.2)' }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#D32F2F'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#E53935'}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={{ marginTop: '32px', textAlign: 'center', color: '#6B7280', fontSize: '0.95rem' }}>
            New to UTHAO? <Link to="/register" style={{ color: '#E53935', fontWeight: '600', textDecoration: 'none' }}>Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
