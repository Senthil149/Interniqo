import api from './http.js'

/**
 * Fetch the current company's profile information, including domain quality signals,
 * verified email status, website match indicator, and Design Rule #4 disclaimer notice.
 */
export const getCompanyProfile = () => api.get('/api/company/profile')

/**
 * Update the current company's profile (name, website, country, description).
 * Backend automatically recalculates personal email heuristics and website domain matching.
 */
export const updateCompanyProfile = (data) => api.put('/api/company/profile', data)
