import api from './http.js'

/**
 * Validate company email verification token.
 * GET /api/auth/verify-email?token={token}
 *
 * Design Rule #4: Verification confirms inbox control only, not legal company identity.
 *
 * @param {string} token
 */
export const verifyEmailToken = (token) =>
  api.get(`/api/auth/verify-email`, { params: { token } })

/**
 * Re-send a verification email to a company address.
 * POST /api/auth/resend-verification
 *
 * @param {string} [email]
 */
export const resendVerificationEmail = (email) =>
  api.post(`/api/auth/resend-verification`, email ? { email } : {})

/**
 * Fetch latest authenticated user profile (including emailVerified status).
 * GET /api/auth/me
 */
export const getMe = () =>
  api.get(`/api/auth/me`)
