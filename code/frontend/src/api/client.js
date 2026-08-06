import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

// ── Token helpers ────────────────────────────────────────────────────────────
export function getTokens() {
  return {
    access: localStorage.getItem('uthao_access_token'),
    refresh: localStorage.getItem('uthao_refresh_token'),
  }
}

export function setTokens(access, refresh) {
  if (access) localStorage.setItem('uthao_access_token', access)
  if (refresh) localStorage.setItem('uthao_refresh_token', refresh)
}

export function clearTokens() {
  localStorage.removeItem('uthao_access_token')
  localStorage.removeItem('uthao_refresh_token')
}

// ── Axios instance ───────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach Bearer token on every request
api.interceptors.request.use((config) => {
  // Pass { auth: false } in config to skip token attachment
  if (config.auth !== false) {
    const { access } = getTokens()
    if (access) config.headers.Authorization = `Bearer ${access}`
  }
  return config
})

// Retry once with a refreshed token on 401
let isRefreshing = false
let pendingQueue = []

function processPendingQueue(error, token = null) {
  pendingQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  pendingQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.auth !== false) {
      if (isRefreshing) {
        // Queue this request until token is refreshed
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { refresh } = getTokens()
        if (!refresh) throw new Error('No refresh token')

        const res = await axios.post(`${BASE_URL}/auth/refresh-token`, {
          refresh_token: refresh,
        })
        const { access_token, refresh_token } = res.data?.data || {}
        setTokens(access_token, refresh_token)
        processPendingQueue(null, access_token)
        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        processPendingQueue(refreshError, null)
        clearTokens()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Normalize error to match existing shape { message, errors, status }
    const message =
      error.response?.data?.message || error.message || 'Request failed'
    const normalizedError = new Error(message)
    normalizedError.status = error.response?.status
    normalizedError.errors = error.response?.data?.errors
    return Promise.reject(normalizedError)
  }
)

export { BASE_URL }
