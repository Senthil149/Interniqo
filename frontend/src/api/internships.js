import api from './http.js'

// ── Company endpoints ──────────────────────────────────────────────────────

export const createInternship = (data) =>
  api.post('/api/company/internships', data)

export const updateInternship = (id, data) =>
  api.put(`/api/company/internships/${id}`, data)

export const deleteInternship = (id) =>
  api.delete(`/api/company/internships/${id}`)

export const getMyInternships = () =>
  api.get('/api/company/internships')

export const getCompanyInternship = (id) =>
  api.get(`/api/company/internships/${id}`)

// ── Student endpoints ──────────────────────────────────────────────────────

/**
 * Search with structured filters. Filters are applied server-side before results
 * are returned. page and size drive pagination (defaults: page=0, size=10).
 */
export const searchInternships = (filters = {}, page = 0, size = 10) => {
  const query = new URLSearchParams({ page, size })
  Object.entries(filters).forEach(([k, v]) => {
    // Skip empty, null, undefined, or false values (unset filters)
    if (v !== '' && v != null && v !== false) query.append(k, v)
  })
  return api.get(`/api/student/internships?${query}`)
}

// ── Public endpoint ────────────────────────────────────────────────────────

/** Public detail — accessible without authentication. */
export const getInternship = (id) =>
  api.get(`/api/internships/${id}`)
