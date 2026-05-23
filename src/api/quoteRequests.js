import { request } from './http.js'

export function createQuoteRequest(payload) {
  return request('/api/quote-requests', {
    method: 'POST',
    body: payload,
    auth: false,
  })
}

export function listQuoteRequests(query) {
  return request('/api/admin/quote-requests', { query })
}

export function getQuoteRequestDetail(id) {
  return request(`/api/admin/quote-requests/${id}`)
}

export function claimQuoteRequest(id) {
  return request(`/api/admin/quote-requests/${id}/claim`, {
    method: 'POST',
  })
}

export function updateQuoteRequestStatus(id, payload) {
  return request(`/api/admin/quote-requests/${id}/status`, {
    method: 'PATCH',
    body: payload,
  })
}

export function updateQuoteRequest(id, payload) {
  return request(`/api/admin/quote-requests/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export function addQuoteRequestNote(id, note) {
  return request(`/api/admin/quote-requests/${id}/notes`, {
    method: 'POST',
    body: { note },
  })
}

export function listQuoteRequestNotes(id) {
  return request(`/api/admin/quote-requests/${id}/notes`)
}

export function listQuoteRequestEvents(id) {
  return request(`/api/admin/quote-requests/${id}/events`)
}
