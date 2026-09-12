import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { verifyEmailToken, verifyCode, resendCode } from '../api/auth.js'
import { useAuth } from '../auth/AuthContext.jsx'

/**
 * Verification page for 6-digit code verification.
 * Also gracefully supports legacy token URL clicks (`GET /verify-email?token=...`).
 *
 * Design Rule #4 compliance:
 * Clearly communicates that verification confirms inbox control only,
 * not legal company identity or academic status.
 */
export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const tokenParam = searchParams.get('token')
  const emailParam = searchParams.get('email')

  const { user, verifyCode: authVerifyCode } = useAuth()
  const navigate = useNavigate()

  // Form state
  const [email, setEmail] = useState(emailParam || user?.email || '')
  const [code, setCode] = useState(tokenParam && tokenParam.length === 6 && /^\d{6}$/.test(tokenParam) ? tokenParam : '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [successNotice, setSuccessNotice] = useState(null)

  // Resend state & cooldown
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendMessage, setResendMessage] = useState(null)

  // Legacy link-based verification support
  useEffect(() => {
    if (tokenParam && (!/^\d{6}$/.test(tokenParam))) {
      // Long cryptographic token -> handle via verifyEmailToken
      setSubmitting(true)
      verifyEmailToken(tokenParam)
        .then(({ data }) => {
          setSuccess(true)
          setSuccessNotice(data?.notice || 'Email verified successfully.')
          if (data?.email) setEmail(data.email)
        })
        .catch((err) => {
          setError(
            err.response?.data?.message ||
            'This verification token is invalid or has expired. Please enter your email and request a fresh code.'
          )
        })
        .finally(() => {
          setSubmitting(false)
        })
    }
  }, [tokenParam])

  // Countdown timer for resend rate-limiting
  useEffect(() => {
    let timer = null
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [resendCooldown])

  async function handleVerify(e) {
    e.preventDefault()
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedCode = code.trim()

    if (!trimmedEmail) {
      setError('Please enter your account email address.')
      return
    }

    if (trimmedCode.length !== 6) {
      setError('Please enter the 6-digit verification code.')
      return
    }

    setSubmitting(true)
    setError(null)
    setResendMessage(null)

    try {
      if (authVerifyCode) {
        await authVerifyCode({ email: trimmedEmail, code: trimmedCode })
      } else {
        await verifyCode({ email: trimmedEmail, code: trimmedCode })
      }
      setSuccess(true)
      setSuccessNotice('Email verified successfully! You are now authenticated.')
      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 1500)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Invalid or expired verification code. Please check your code or request a new one.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResendCode() {
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail) {
      setError('Please enter your account email to receive a new code.')
      return
    }

    if (resendCooldown > 0) return

    setResendMessage(null)
    setError(null)

    try {
      const { data } = await resendCode({ email: trimmedEmail })
      setResendMessage({
        type: 'success',
        text: data?.message || 'A fresh 6-digit verification code has been sent to your email.',
      })
      setResendCooldown(60)
    } catch (err) {
      setResendMessage({
        type: 'error',
        text: err.response?.data?.message || err.response?.data?.error || 'Unable to resend code.',
      })
    }
  }

  return (
    <div className="mx-auto max-w-md py-8 animate-fade-in-up">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 shadow-xs">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Email Verification</h1>
          <p className="mt-1 text-sm text-slate-600">
            Enter your email and the 6-digit code sent to your inbox.
          </p>
        </div>

        {success ? (
          <div className="space-y-4 text-center animate-scale-in">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 space-y-1">
              <p className="font-semibold text-emerald-900 font-display">Account Verified!</p>
              <p>{successNotice || 'Your email address has been verified successfully.'}</p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 active:bg-blue-800"
            >
              Go to Dashboard →
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleVerify}>
            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 animate-scale-in">
                {error}
              </div>
            ) : null}

            {resendMessage ? (
              <div
                className={`rounded-xl border p-3 text-xs animate-scale-in ${
                  resendMessage.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                {resendMessage.text}
              </div>
            ) : null}

            <label className="block text-sm font-medium text-slate-700">
              Account Email
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
              />
            </label>

            <div>
              <label htmlFor="code-input" className="block text-center text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
                6-Digit Verification Code
              </label>
              <input
                id="code-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoFocus
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setCode(val)
                  if (error) setError(null)
                }}
                placeholder="••••••"
                className="w-full text-center font-mono text-2xl font-bold tracking-[0.4em] py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition shadow-inner placeholder:text-slate-300"
              />
              <p className="mt-1 text-center text-[11px] text-slate-400">
                Code expires in 10 minutes.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || code.trim().length !== 6 || !email.trim()}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {submitting ? 'Verifying Code…' : 'Verify & Activate'}
            </button>

            <div className="pt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCooldown > 0 || !email.trim()}
                className={`text-xs font-semibold transition ${
                  resendCooldown > 0 || !email.trim()
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-blue-600 hover:text-blue-700 underline'
                }`}
              >
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : 'Resend 6-digit code'}
              </button>
            </div>

            {/* Design Rule #4 Disclaimer */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-[11px] text-slate-500 leading-relaxed text-center">
              <span className="font-semibold text-slate-700">Notice (Design Rule #4):</span> Email verification confirms control of this email address only. It does not certify legal company incorporation or academic standing.
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
