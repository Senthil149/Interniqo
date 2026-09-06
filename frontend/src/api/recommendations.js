import api from './http.js'

/**
 * Fetch existing stored recommendations for the authenticated student.
 */
export const getRecommendations = () => api.get('/api/recommendations')

/**
 * Trigger recommendation generation pipeline:
 * 1. Hard filters applied server-side in Spring Boot.
 * 2. Sentence-BERT semantic matching called on Python AI service.
 * 3. Persisted in database and returned ranked.
 *
 * @param {object} [filters] Optional structured filter parameters (country, workMode, minStipend, etc.)
 */
export const generateRecommendations = (filters = {}) =>
  api.post('/api/recommendations/generate', filters)
