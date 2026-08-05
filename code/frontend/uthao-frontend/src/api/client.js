const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

function getTokens() {
  return {
    access: localStorage.getItem('uthao_access_token'),
    refresh: localStorage.getItem('uthao_refresh_token'),
  }
}

function setTokens(access, refresh) {
  if (access) localStorage.setItem('uthao_access_token', access)
  if (refresh) localStorage.setItem('uthao_refresh_token', refresh)
}

function clearTokens() {
  localStorage.removeItem('uthao_access_token')
  localStorage.removeItem('uthao_refresh_token')
}

async function refreshAccessToken() {
  const { refresh } = getTokens()
  if (!refresh) return null
  const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  })
  if (!res.ok) return null
  const json = await res.json()
  const { access_token, refresh_token } = json.data || {}
  setTokens(access_token, refresh_token)
  return access_token
}

/**
 * Core request helper. Attaches the bearer token automatically and
 * retries once with a refreshed token when a call comes back 401.
 */
async function request(path, { method = 'GET', body, auth = true, retry = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const { access } = getTokens()
    if (access) headers.Authorization = `Bearer ${access}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && auth && retry) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      return request(path, { method, body, auth, retry: false })
    }
    clearTokens()
  }

  let json = null
  try {
    json = await res.json()
  } catch {
    json = null
  }

  if (!res.ok) {
    const message = json?.message || `Request failed with status ${res.status}`
    const err = new Error(message)
    err.status = res.status
    err.errors = json?.errors
    throw err
  }

  return json
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body, opts = {}) => request(path, { method: 'POST', body, ...opts }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
}

export { getTokens, setTokens, clearTokens, BASE_URL }
