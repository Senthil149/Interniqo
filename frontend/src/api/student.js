import api from './http.js'

/**
 * Upload a PDF resume. The backend validates type (PDF only) and size (≤ 5 MB),
 * stores the file, then calls the Python AI service to extract profile sections.
 *
 * @param {File} file  The File object from an <input type="file"> element
 */
export const uploadResume = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/api/student/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * Fetch the authenticated student's uploaded resume as a Blob.
 */
export const getStudentResumeBlob = () =>
  api.get('/api/student/resume', {
    responseType: 'blob',
  })

/**
 * Fetch the current student's profile data.
 */
export const getStudentProfile = () =>
  api.get('/api/student/profile')

/**
 * Update the current student's profile fields.
 * @param {Object} data { name, professionalHeadline, location, college, bio, skills, githubUrl, linkedinUrl, portfolioUrl }
 */
export const updateStudentProfile = (data) =>
  api.put('/api/student/profile', data)

/**
 * Upload student profile photo (JPEG, PNG, WEBP, GIF ≤ 2 MB).
 * @param {File} file
 */
export const uploadProfilePhoto = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/api/student/profile/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * Remove student profile photo.
 */
export const removeProfilePhoto = () =>
  api.delete('/api/student/profile/photo')

/**
 * Resolves a profile photo URL to a fully qualified URL pointing to the backend
 * (or proxy) so <img> tags can render it correctly.
 *
 * @param {string} photoUrl  The relative or absolute photo URL
 * @returns {string|null}
 */
export function resolvePhotoUrl(photoUrl) {
  if (!photoUrl) return null
  if (
    photoUrl.startsWith('http://') ||
    photoUrl.startsWith('https://') ||
    photoUrl.startsWith('blob:') ||
    photoUrl.startsWith('data:')
  ) {
    return photoUrl
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  const cleanBase = apiBase.replace(/\/+$/, '')
  const cleanPath = photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`
  return `${cleanBase}${cleanPath}`
}

/**
 * Fetch the current student's cross-border preferences.
 */
export const getStudentPreferences = () =>
  api.get('/api/student/preferences')

/**
 * Update the current student's cross-border preferences.
 */
export const updateStudentPreferences = (data) =>
  api.put('/api/student/preferences', data)
