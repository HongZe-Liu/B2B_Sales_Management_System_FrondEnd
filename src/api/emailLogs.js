import { request } from './http.js'

export function listEmailLogs(query) {
  return request('/api/admin/email-logs', { query })
}
