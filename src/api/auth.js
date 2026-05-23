import { ACCESS_TOKEN_KEYS, request } from './http.js'

const USER_KEY = 'smUser'
const EXPIRES_IN_KEY = 'smExpiresIn'
const ADMIN_HOME_PATH = '/admin'
const SALES_HOME_PATH = '/dashboard/quotation'

export function login(payload) {
  return request('/api/auth/login', {
    method: 'POST',
    body: payload,
    auth: false,
  })
}

export function logout() {
  return request('/api/auth/logout', {
    method: 'POST',
  })
}

export function getCurrentUser() {
  return request('/api/auth/me')
}

export function saveAuthSession(loginResponse) {
  localStorage.setItem('accessToken', loginResponse.accessToken)
  localStorage.setItem(USER_KEY, JSON.stringify(loginResponse.user))
  localStorage.setItem(EXPIRES_IN_KEY, String(loginResponse.expiresIn))
}

export function clearAuthSession() {
  ACCESS_TOKEN_KEYS.forEach((key) => {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  })
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(EXPIRES_IN_KEY)
  sessionStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(EXPIRES_IN_KEY)
}

export function getStoredUser() {
  const storedUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY)

  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser)
  } catch {
    return null
  }
}

export function isAdminUser(user) {
  return String(user?.role || '').toLowerCase() === 'admin'
}

export function getDefaultAuthenticatedPath(user = getStoredUser()) {
  return isAdminUser(user) ? ADMIN_HOME_PATH : SALES_HOME_PATH
}
