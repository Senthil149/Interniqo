import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyEmailToken, resendVerificationEmail } from '../api/auth.js'
import { useAuth } from '../auth/AuthContext.jsx'

/**
 * Landing page for email verification link clicks.
 * Handles `GET /verify-email?token=...`.
 *
 * Design Rule #4 compliance:
 * The landing page makes clearly visible that verification confirms inbox control only,
 * not legal company identity or business credentials.
 */
export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { user, isAuthenticated, refreshUser } = useAuth()

  const [loading, setLoading] = useState(Boolean(token))
  const [result, setResult] = useState(null) // { verified: boolean, message: string, email?: string, companyName?: string, notice?: string }
  const [error, setError] = useState(!token ? 'No verification token was provided in the URL.' : null)

  // Resend form state for expired / failed cases
  const [resendEmail, setResendEmail] = useState(user?.email || '')
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState(null)

  useEffect(() => {
    if (!token) return

    let isMounted = true
    setLoading(true)
    setError(null)

    verifyEmailToken(token)
      .then(async ({ data }) => {
        if (!isMounted) return
        setResult(data)
        setLoading(false)
        if (isAuthenticated && refreshUser) {
          try {
            await refreshUser()
          } catch (e) {
            console.error('User refresh after verification failed:', e)
          }
        }
      })
      .catch((err) => {
        if (!isMounted) return
        const msg =
          err.response?.data?.message ||
          'This verification token is invalid or has expired. Please request a new link.'
        setError(msg)
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [token, isAuthenticated])

  async function handleResend(e) {
    e.preventDefault()
    if (!resendEmail.trim()) return

    setIsResending(true)
    setResendMessage(null)
    try {
      const { data } = await resendVerificationEmail(resendEmail.trim())
      setResendMessage({
        type: 'success',
        text: data?.message || 'Verification link sent! Check your inbox or terminal console.',
      })
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Unable to send verification link. Please check the email address.'
      setResendMessage({ type: 'error', text: errorMsg })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl py-12">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* State 1: Verifying in progress */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
              <svg
                className="h-8 w-8 animate-spin text-indigo-600"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Verifying Email...</h1>
            <p className="mt-2 text-sm text-slate-500">
              Please wait while we validate your verification token.
            </p>
          </div>
        )}

        {/* State 2: Verification Success */}
        {!loading && result?.verified && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-slate-900">Email Verified Successfully</h1>
            <p className="mt-2 text-sm text-slate-600 max-w-md">
              Control of <strong className="font-semibold text-slate-900">{result.email}</strong> has been
              confirmed for <span className="font-semibold">{result.companyName || 'your company'}</span>.
            </p>

            {/* Design Rule #4 Notice Box */}
            <div className="mt-6 w-full rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 text-left">
              <div className="flex items-start gap-2.5">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="space-y-1 text-xs text-indigo-950">
                  <span className="font-semibold">Platform Policy (Design Rule #4)</span>
                  <p className="leading-relaxed text-indigo-900/90">
                    This verification confirms <strong>control of the domain inbox only</strong>. In
                    accordance with platform standards, email confirmation does not serve as legal proof of
                    business registration, corporate identity, or official accreditation.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/company/internships"
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
                  >
                    View My Listings
                  </Link>
                  <Link
                    to="/company/internships/new"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Post Internship
                  </Link>
                </>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
                >
                  Sign in to Account
                </Link>
              )}
            </div>
          </div>
        )}

        {/* State 3: Error / Expired / Invalid */}
        {!loading && !result?.verified && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-slate-900">Verification Link Issue</h1>
            <p className="mt-2 text-sm text-rose-700 max-w-md">{error}</p>

            {/* Design Rule #4 Reminder */}
            <p className="mt-3 text-xs text-slate-500 italic max-w-md">
              Note (Design Rule #4): Email links expire in 24 hours to safeguard inbox ownership. Verification
              confirms inbox control only, not legal business identity.
            </p>

            {/* Resend verification box */}
            <div className="mt-8 w-full rounded-xl border border-slate-200 bg-slate-50/70 p-5 text-left">
              <h2 className="text-sm font-semibold text-slate-900">Need a fresh verification link?</h2>
              <p className="mt-1 text-xs text-slate-500">
                Enter your company email below and we will send a new link valid for 24 hours.
              </p>

              <form onSubmit={handleResend} className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  required
                  placeholder="company@example.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isResending}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition shrink-0"
                >
                  {isResending ? 'Sending...' : 'Resend Link'}
                </button>
              </form>

              {resendMessage && (
                <div
                  className={`mt-3 rounded-md p-2.5 text-xs font-medium ${resendMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                >
                  {resendMessage.text}
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <Link
                to="/"
                className="text-xs font-medium text-slate-600 hover:text-slate-900 transition"
              >
                Back to Home
              </Link>
              {isAuthenticated && (
                <>
                  <span className="text-xs text-slate-300">•</span>
                  <Link
                    to="/dashboard"
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition"
                  >
                    Go to Dashboard
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
