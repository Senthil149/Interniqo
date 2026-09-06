import api from './http.js'

/**
 * Submit application to an internship (Student role).
 * POST /api/applications
 *
 * @param {number|string} internshipId
 */
export const applyToInternship = (internshipId) =>
  api.post('/api/applications', { internshipId: Number(internshipId) })

/**
 * Get role-aware list of applications:
 * - Student: their own applications
 * - Company: applications to their postings (optionally filtered by internshipId)
 * GET /api/applications?internshipId=...
 *
 * @param {number|string} [internshipId]
 */
export const getApplications = (internshipId) =>
  api.get('/api/applications', {
    params: internshipId ? { internshipId: Number(internshipId) } : {},
  })

/**
 * Check if the student has already applied to this internship.
 * GET /api/applications/check/{internshipId}
 *
 * @param {number|string} internshipId
 */
export const checkApplication = (internshipId) =>
  api.get(`/api/applications/check/${internshipId}`)

/**
 * Update candidate application status (Company or Admin role).
 * PUT /api/applications/{id}/status
 *
 * Valid lifecycle transitions:
 * APPLIED -> SHORTLISTED, REJECTED, ACCEPTED
 * SHORTLISTED -> ACCEPTED, REJECTED
 * ACCEPTED -> COMPLETED
 *
 * @param {number|string} applicationId
 * @param {'APPLIED'|'SHORTLISTED'|'ACCEPTED'|'REJECTED'|'COMPLETED'} status
 */
export const updateApplicationStatus = (applicationId, status) =>
  api.put(`/api/applications/${applicationId}/status`, { status })
