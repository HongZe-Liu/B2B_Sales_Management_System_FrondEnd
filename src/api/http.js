export const ACCESS_TOKEN_KEYS = ['accessToken', 'smAccessToken', 'sm_access_token']
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
let unauthorizedHandler = null

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

export function getStoredAccessToken() {
  for (const key of ACCESS_TOKEN_KEYS) {
    const token = localStorage.getItem(key) || sessionStorage.getItem(key)

    if (token) {
      return token
    }
  }

  return null
}

function buildUrl(path, query) {
  const params = new URLSearchParams()

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value)
    }
  })

  const queryString = params.toString()
  const isAbsoluteUrl = /^https?:\/\//i.test(path)
  const url = isAbsoluteUrl
    ? path
    : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`

  if (!queryString) {
    return url
  }

  return `${url}${url.includes('?') ? '&' : '?'}${queryString}`
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    return null
  }

  return response.json()
}

export async function request(path, options = {}) {
  const {
    method = 'GET',
    query,
    body,
    headers,
    auth = true,
  } = options
  const token = auth ? getStoredAccessToken() : null
  const response = await fetch(buildUrl(path, query), {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const result = await parseResponse(response)

  if (!response.ok || result?.success === false) {
    const error = new Error(
      result?.message || `Request failed with ${response.status}`,
    )
    error.status = response.status

    if (response.status === 401) {
      unauthorizedHandler?.(error)
    }

    throw error
  }

  return result?.data ?? result
}
