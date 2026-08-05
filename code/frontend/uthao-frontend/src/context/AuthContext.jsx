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
      const res = await api.get('/auth/profile')
      setUser(res.data)
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
    const res = await api.post('/auth/login', { email, password }, { auth: false })
    const { access_token, refresh_token, user: u } = res.data
    setTokens(access_token, refresh_token)
    setUser(u)
    return u
  }

  async function register(payload) {
    const res = await api.post('/auth/register', payload, { auth: false })
    const { access_token, refresh_token, user: u } = res.data
    setTokens(access_token, refresh_token)
    setUser(u)
    return u
  }

  async function logout() {
    try {
      await api.post('/auth/logout', undefined)
    } catch {
      // ignore network errors on logout, clear locally regardless
    }
    clearTokens()
    setUser(null)
  }

  const isAdminLike = user && ['admin', 'manager'].includes(user.role)

  return (
    <AuthContext.Provider value={{ user, setUser, booting, login, register, logout, isAdminLike }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
