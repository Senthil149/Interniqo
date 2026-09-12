import api from './http.js'

/**
 * Validate company email verification token (link fallback).
 * GET /api/auth/verify-email?token={token}
 *
 * Design Rule #4: Verification confirms inbox control only, not legal company identity.
 *
 * @param {string} token
 */
export const verifyEmailToken = (token) =>
  api.get(`/api/auth/verify-email`, { params: { token } })

/**
 * Verify 6-digit numeric verification code.
 * POST /api/auth/verify-code
 * @param {{ email: string, code: string }} data
 */
export const verifyCode = (data) =>
  api.post(`/api/auth/verify-code`, data)

/**
 * Re-send a 6-digit verification code with 60s cooldown.
 * POST /api/auth/resend-code
 * @param {{ email: string }} data
 */
export const resendCode = (data) =>
  api.post(`/api/auth/resend-code`, data)

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

/**
 * Request a password reset code.
 * POST /api/auth/forgot-password
 *
 * @param {string} email
 */
export const forgotPassword = (email) =>
  api.post(`/api/auth/forgot-password`, { email })

/**
 * Reset password using a valid 6-digit code or reset token.
 * POST /api/auth/reset-password
 *
 * @param {string|{ email?: string, code?: string, token?: string, newPassword?: string }} tokenOrData
 * @param {string} [newPassword]
 */
export const resetPassword = (tokenOrData, newPassword) => {
  if (typeof tokenOrData === 'object' && tokenOrData !== null) {
    return api.post(`/api/auth/reset-password`, tokenOrData)
  }
  return api.post(`/api/auth/reset-password`, { token: tokenOrData, code: tokenOrData, newPassword })
}

