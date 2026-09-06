import api from './http.js'

/**
 * Fetch the latest risk assessment report for an internship.
 *
 * @param {number|string} internshipId
 */
export const getRiskAssessment = (internshipId) =>
  api.get(`/api/risk/${internshipId}`)

/**
 * Re-trigger risk assessment analysis for an internship.
 * (Accessible by the posting company or admin).
 *
 * @param {number|string} internshipId
 */
export const analyzeRisk = (internshipId) =>
  api.post(`/api/risk/analyze/${internshipId}`)
