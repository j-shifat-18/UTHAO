import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
      navigate('/dashboard', { replace: true })
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

  const inputClass =
    'w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all'

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 font-sans">
      {/* Left panel */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex flex-col justify-between p-16 bg-gray-100 relative overflow-hidden"
      >
        <div className="flex items-center gap-2 text-2xl font-extrabold text-red-600">
          <img src="/delivery-guy.png" alt="UTHAO" className="w-10 h-10 object-contain" />
          UTHAO
        </div>

        <div className="relative z-10">
          <h2 className="text-5xl font-extrabold leading-tight tracking-tight text-gray-900 mb-6">
            Start shipping. <br />
            <span className="text-red-600">Faster than ever.</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-sm leading-relaxed">
            Set up a customer account to get full visibility from doorstep to doorstep.
          </p>
        </div>

        <div className="text-gray-400 text-sm font-medium z-10">
          SECURE SESSION · UTHAO LOGISTICS PLATFORM
        </div>

        <img
          src="/delivery-guy.png"
          alt=""
          aria-hidden="true"
          className="absolute right-[-10%] bottom-[5%] opacity-10 w-[600px] pointer-events-none select-none"
        />
      </motion.div>

      {/* Right panel */}
      <div className="flex items-center justify-center p-8 bg-gray-50 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-gray-100 p-10"
        >
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Create your account</h1>
          <p className="text-gray-500 mb-8">Set up a customer account to start shipping with UTHAO.</p>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-3 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  First name
                </label>
                <input
                  id="first_name"
                  required
                  value={form.first_name}
                  onChange={update('first_name')}
                  placeholder="John"
                  className={inputClass}
                />
                {fieldErrors.first_name && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.first_name}</p>
                )}
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Last name
                </label>
                <input
                  id="last_name"
                  required
                  value={form.last_name}
                  onChange={update('last_name')}
                  placeholder="Doe"
                  className={inputClass}
                />
                {fieldErrors.last_name && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.last_name}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={update('email')}
                placeholder="you@example.com"
                className={inputClass}
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Phone
              </label>
              <input
                id="phone"
                required
                value={form.phone}
                onChange={update('phone')}
                placeholder="+8801712345678"
                className={inputClass}
              />
              {fieldErrors.phone && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={update('password')}
                placeholder="At least 6 characters"
                className={inputClass}
              />
              {fieldErrors.password && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full py-4 mt-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-lg rounded-xl shadow-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-gray-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-red-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
