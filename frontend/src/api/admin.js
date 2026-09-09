import http from './http.js'

export function getAdminMetrics() {
  return http.get('/api/admin/metrics')
}

export function getAdminUsers(role) {
  const params = role && role !== 'ALL' ? { role } : {}
  return http.get('/api/admin/users', { params })
}

export function updateAdminUserRole(id, role) {
  return http.put(`/api/admin/users/${id}/role`, { role })
}

export function getAdminCompanies() {
  return http.get('/api/admin/companies')
}

export function toggleCompanyVerification(id, verified) {
  return http.put(`/api/admin/companies/${id}/verification`, { verified })
}

export function getAdminInternships(status) {
  const params = status && status !== 'ALL' ? { status } : {}
  return http.get('/api/admin/internships', { params })
}

export function updateAdminInternshipStatus(id, status) {
  return http.put(`/api/admin/internships/${id}/status`, { status })
}

export function getAdminFlaggedPostings() {
  return http.get('/api/admin/risk/flagged')
}

export function reanalyzeInternshipRisk(id) {
  return http.post(`/api/admin/risk/analyze/${id}`)
}

export function getAdminEmailVerifications() {
  return http.get('/api/admin/verifications/email')
}

export function getAdminBlockchainRecords() {
  return http.get('/api/admin/verifications/blockchain')
}
