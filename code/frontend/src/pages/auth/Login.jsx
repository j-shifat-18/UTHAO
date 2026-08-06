import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
      const dest = location.state?.from || '/dashboard'
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err.message || 'Could not sign in. Check your details and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 font-sans">
      {/* Left panel */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex flex-col justify-between p-16 bg-gray-100 relative overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 text-2xl font-extrabold text-red-600">
          <img src="/delivery-guy.png" alt="UTHAO" className="w-10 h-10 object-contain" />
          UTHAO
        </div>

        {/* Headline */}
        <div className="relative z-10">
          <h2 className="text-5xl font-extrabold leading-tight tracking-tight text-gray-900 mb-6">
            Welcome back. <br />
            <span className="text-red-600">Ready to ship?</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-sm leading-relaxed">
            Access your dashboard to track parcels, manage shipments, and scale your logistics.
          </p>
        </div>

        {/* Footer text */}
        <div className="text-gray-400 text-sm font-medium z-10">
          SECURE SESSION · UTHAO LOGISTICS PLATFORM
        </div>

        {/* Background watermark */}
        <img
          src="/delivery-guy.png"
          alt=""
          aria-hidden="true"
          className="absolute right-[-10%] bottom-[5%] opacity-10 w-[600px] pointer-events-none select-none"
        />
      </motion.div>

      {/* Right panel */}
      <div className="flex items-center justify-center p-8 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-12"
        >
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Sign in</h1>
          <p className="text-gray-500 mb-8">Enter your details to access your dashboard.</p>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-3 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={update('email')}
                placeholder="you@example.com"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={update('password')}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-lg rounded-xl shadow-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </motion.button>
          </form>

          <p className="mt-8 text-center text-gray-500 text-sm">
            New to UTHAO?{' '}
            <Link to="/register" className="text-red-600 font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
