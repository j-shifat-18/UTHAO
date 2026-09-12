import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, getTokens, setTokens, clearTokens } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(true)

  const loadProfile = useCallback(async () => {
    const { access } = getTokens()
    if (!access) {
      setUser(null)
      setBooting(false)
      return
    }
    try {
      // Backend returns { success: true, message: '...', data: user }
      const res = await api.get('/auth/profile')
      const profile = res.data?.data || res.data
      setUser(profile)
    } catch {
      clearTokens()
      setUser(null)
    } finally {
      setBooting(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  async function login(email, password) {
    // Pass { auth: false } so interceptor skips Bearer header
    const res = await api.post('/auth/login', { email, password }, { auth: false })
    // Backend returns { success: true, message: '...', data: { access_token, refresh_token, user } }
    const payload = res.data?.data || res.data
    const { access_token, refresh_token, user: u } = payload
    if (access_token && refresh_token) {
      setTokens(access_token, refresh_token)
    }
    setUser(u)
    return u
  }

  async function register(payload) {
    const res = await api.post('/auth/register', payload, { auth: false })
    // Backend returns { success: true, message: '...', data: { access_token, refresh_token, user } }
    const data = res.data?.data || res.data
    const { access_token, refresh_token, user: u } = data
    if (access_token && refresh_token) {
      setTokens(access_token, refresh_token)
    }
    setUser(u)
    return u
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore network errors on logout, clear locally regardless
    }
    clearTokens()
    setUser(null)
  }

  const userRole = typeof user?.role === 'string' ? user.role.toLowerCase() : (user?.role?.name || '').toLowerCase()
  const isAdminLike = user && ['admin', 'manager'].includes(userRole)
  const isStaff = user && ['admin', 'manager', 'branch_employee'].includes(userRole)
  const isAgent = user && userRole === 'delivery_agent'

  return (
    <AuthContext.Provider value={{ user, setUser, booting, login, register, logout, isAdminLike, isStaff, isAgent }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
