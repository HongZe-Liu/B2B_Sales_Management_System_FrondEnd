import { request } from './http.js'

export function getDashboardSummary() {
  return request('/api/admin/dashboard/summary')
}

export function getDashboardAnalytics() {
  return request('/api/admin/dashboard/analytics')
}
