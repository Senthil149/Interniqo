import { useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { resendVerificationEmail } from '../api/auth.js'

/**
 * Non-blocking banner displayed for unverified company accounts.
 *
 * Design Rule #4 compliance:
 * Explicitly states that verification confirms inbox control only,
 * not legal company identity or business credentials.
 */
export default function CompanyVerificationBanner() {
  const { user, isAuthenticated } = useAuth()
  const [isResending, setIsResending] = useState(false)
  const [resendStatus, setResendStatus] = useState(null) // { type: 'success' | 'error', message: string }
  const [isDismissed, setIsDismissed] = useState(false)

  if (!isAuthenticated || user?.role !== 'COMPANY' || user?.emailVerified || isDismissed) {
    return null
  }

  async function handleResend() {
    setIsResending(true)
    setResendStatus(null)
    try {
      const { data } = await resendVerificationEmail(user?.email)
      setResendStatus({
        type: 'success',
        message: data?.message || 'Verification link resent! Check your inbox or server logs.',
      })
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Unable to resend verification email. Please try again.'
      setResendStatus({ type: 'error', message: errorMsg })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <aside
      aria-label="Email verification notice"
      className="border-b border-amber-200 bg-amber-50/95 text-amber-900 transition-all shadow-xs"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200/70 text-amber-800">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-amber-950 text-sm">
                Verify your company email address
              </span>
              <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-xs font-medium text-amber-800">
                Action Recommended
              </span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              We sent a verification link to <strong className="font-semibold">{user?.email}</strong>.
              Please verify your email to demonstrate active inbox control. You can continue posting
              and managing internships without interruption.
            </p>
            {/* Design Rule #4 Disclaimer */}
            <p className="text-[11px] text-amber-700/90 italic">
              Notice (Design Rule #4): Email verification confirms control of this domain inbox only.
              It does not certify legal company incorporation or verified business identity.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {resendStatus && (
            <span
              className={`text-xs font-medium ${resendStatus.type === 'success' ? 'text-emerald-700' : 'text-rose-700'
                }`}
            >
              {resendStatus.message}
            </span>
          )}

          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 disabled:opacity-50 transition"
          >
            {isResending ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
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
                Resending...
              </>
            ) : (
              'Resend Email'
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss banner"
            className="rounded p-1 text-amber-700 hover:bg-amber-200/60 hover:text-amber-900 transition"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
