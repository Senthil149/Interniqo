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
  // Axios automatically sets the correct multipart/form-data Content-Type with boundary
  return api.post('/api/student/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * Fetch the current student's profile data (fields extracted from the last resume upload).
 * Returns null fields when no resume has been uploaded yet.
 */
export const getStudentProfile = () =>
  api.get('/api/student/profile')

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

