import http from './http.js'

/**
 * Issue a blockchain-backed credential for a completed internship.
 * (Role: COMPANY)
 */
export function issueCredential(applicationId) {
  return http.post('/api/credentials/issue', { applicationId })
}

/**
 * Public credential verification endpoint (no login required).
 */
export function verifyCredential(credentialId) {
  return http.get(`/api/credentials/verify/${encodeURIComponent(credentialId)}`)
}

/**
 * Get credentials for current authenticated user (awarded to student or issued by company).
 */
export function getMyCredentials() {
  return http.get('/api/credentials/my')
}

/**
 * Get credential detail by platform credential ID.
 */
export function getCredentialById(credentialId) {
  return http.get(`/api/credentials/${encodeURIComponent(credentialId)}`)
}
