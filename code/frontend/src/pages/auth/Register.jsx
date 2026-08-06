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
    <div className="landing-page" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <div style={{ background: '#111827', padding: '64px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ fontSize: '2rem', fontWeight: '800', color: '#E53935', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/delivery-guy.png" alt="UTHAO" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          UTHAO
        </div>
        
        <div style={{ zIndex: 10 }}>
          <h2 style={{ fontSize: '3.5rem', fontWeight: '800', lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-1px' }}>
            Start shipping. <br/><span style={{ color: '#E53935' }}>Faster than ever.</span>
          </h2>
          <p style={{ color: '#9CA3AF', fontSize: '1.25rem', maxWidth: '400px', lineHeight: 1.6 }}>
            Set up a customer account to get full visibility from doorstep to doorstep.
          </p>
        </div>

        <div style={{ color: '#6B7280', fontSize: '0.875rem', fontWeight: '500', zIndex: 10 }}>
          SECURE SESSION &middot; UTHAO LOGISTICS PLATFORM
        </div>

        <img src="/delivery-guy.png" alt="Background" style={{ position: 'absolute', right: '-10%', bottom: '5%', opacity: 0.15, width: '600px', pointerEvents: 'none' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', backgroundColor: '#FAFAFA' }}>
        <div style={{ width: '100%', maxWidth: '480px', background: '#fff', padding: '48px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', border: '1px solid #E5E7EB' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>Create your account</h1>
          <p style={{ color: '#6B7280', marginBottom: '32px' }}>Set up a customer account to start shipping with UTHAO.</p>

          {error && <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.95rem' }}>{error}</div>}

          <form onSubmit={onSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label htmlFor="first_name" style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '8px', fontSize: '0.95rem' }}>First name</label>
                <input id="first_name" required value={form.first_name} onChange={update('first_name')} placeholder="John" style={{ width: '100%', padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '1rem', boxSizing: 'border-box', outline: 'none', transition: 'all 0.2s' }} onFocus={(e) => { e.target.style.borderColor = '#E53935'; e.target.style.boxShadow = '0 0 0 3px rgba(229,57,53,0.1)' }} onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }} />
                {fieldErrors.first_name && <span style={{ fontSize: '0.875rem', color: '#DC2626', marginTop: '4px', display: 'block' }}>{fieldErrors.first_name}</span>}
              </div>
              <div>
                <label htmlFor="last_name" style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '8px', fontSize: '0.95rem' }}>Last name</label>
                <input id="last_name" required value={form.last_name} onChange={update('last_name')} placeholder="Doe" style={{ width: '100%', padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '1rem', boxSizing: 'border-box', outline: 'none', transition: 'all 0.2s' }} onFocus={(e) => { e.target.style.borderColor = '#E53935'; e.target.style.boxShadow = '0 0 0 3px rgba(229,57,53,0.1)' }} onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }} />
                {fieldErrors.last_name && <span style={{ fontSize: '0.875rem', color: '#DC2626', marginTop: '4px', display: 'block' }}>{fieldErrors.last_name}</span>}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="email" style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '8px', fontSize: '0.95rem' }}>Email</label>
              <input id="email" type="email" required value={form.email} onChange={update('email')} placeholder="you@example.com" style={{ width: '100%', padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '1rem', boxSizing: 'border-box', outline: 'none', transition: 'all 0.2s' }} onFocus={(e) => { e.target.style.borderColor = '#E53935'; e.target.style.boxShadow = '0 0 0 3px rgba(229,57,53,0.1)' }} onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }} />
              {fieldErrors.email && <span style={{ fontSize: '0.875rem', color: '#DC2626', marginTop: '4px', display: 'block' }}>{fieldErrors.email}</span>}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="phone" style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '8px', fontSize: '0.95rem' }}>Phone</label>
              <input id="phone" required value={form.phone} onChange={update('phone')} placeholder="+8801712345678" style={{ width: '100%', padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '1rem', boxSizing: 'border-box', outline: 'none', transition: 'all 0.2s' }} onFocus={(e) => { e.target.style.borderColor = '#E53935'; e.target.style.boxShadow = '0 0 0 3px rgba(229,57,53,0.1)' }} onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }} />
              {fieldErrors.phone && <span style={{ fontSize: '0.875rem', color: '#DC2626', marginTop: '4px', display: 'block' }}>{fieldErrors.phone}</span>}
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label htmlFor="password" style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '8px', fontSize: '0.95rem' }}>Password</label>
              <input id="password" type="password" required minLength={6} value={form.password} onChange={update('password')} placeholder="At least 6 characters" style={{ width: '100%', padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '1rem', boxSizing: 'border-box', outline: 'none', transition: 'all 0.2s' }} onFocus={(e) => { e.target.style.borderColor = '#E53935'; e.target.style.boxShadow = '0 0 0 3px rgba(229,57,53,0.1)' }} onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }} />
              {fieldErrors.password && <span style={{ fontSize: '0.875rem', color: '#DC2626', marginTop: '4px', display: 'block' }}>{fieldErrors.password}</span>}
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', backgroundColor: '#E53935', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1.125rem', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s', boxShadow: '0 4px 6px -1px rgba(229, 57, 53, 0.2)' }} onMouseOver={(e) => e.target.style.backgroundColor = '#D32F2F'} onMouseOut={(e) => e.target.style.backgroundColor = '#E53935'}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div style={{ marginTop: '32px', textAlign: 'center', color: '#6B7280', fontSize: '0.95rem' }}>
            Already have an account? <Link to="/login" style={{ color: '#E53935', fontWeight: '600', textDecoration: 'none' }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
