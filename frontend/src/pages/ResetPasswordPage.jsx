import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api/auth.js'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const tokenParam = searchParams.get('token')
  const emailParam = searchParams.get('email')

  const [email, setEmail] = useState(emailParam || '')
  const [code, setCode] = useState(tokenParam && tokenParam.length === 6 && /^\d{6}$/.test(tokenParam) ? tokenParam : '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    const trimmedEmail = email.trim().toLowerCase()
    const trimmedCode = code.trim() || tokenParam

    if (!tokenParam && !trimmedEmail) {
      setError('Please enter your account email address.')
      return
    }

    if (!trimmedCode) {
      setError('Please enter the 6-digit reset code.')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please ensure both passwords match.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await resetPassword({
        email: trimmedEmail || undefined,
        code: trimmedCode,
        token: tokenParam || trimmedCode,
        newPassword,
      })
      setSuccess(true)
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'This reset code is invalid or has expired. Please request a new one.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-6 animate-fade-in-up">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 shadow-xs">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">Reset your password</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter your 6-digit reset code and choose a new secure password.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        {success ? (
          <div className="space-y-4 text-center animate-scale-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 shadow-xs">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="text-lg font-bold text-slate-900 font-display">Password Reset Complete</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your password has been updated successfully. You can now sign in with your new credentials.
            </p>

            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 active:bg-blue-800"
            >
              Sign in to Account
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 space-y-1.5 animate-scale-in">
                <p className="font-semibold text-rose-800">Unable to reset password</p>
                <p>{error}</p>
                <div className="pt-1">
                  <Link
                    to="/forgot-password"
                    className="font-semibold text-rose-800 underline hover:text-rose-900"
                  >
                    Request a fresh code →
                  </Link>
                </div>
              </div>
            ) : null}

            {!tokenParam && (
              <label className="block text-sm font-medium text-slate-700">
                Email address
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
                />
              </label>
            )}

            <div>
              <label htmlFor="reset-code-field" className="block text-center text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
                6-Digit Reset Code
              </label>
              <input
                id="reset-code-field"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoFocus={!tokenParam}
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

            <label className="block text-sm font-medium text-slate-700">
              New Password
              <input
                type="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Confirm New Password
              <input
                type="password"
                required
                minLength={8}
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
              />
            </label>

            <button
              type="submit"
              disabled={submitting || (!tokenParam && code.trim().length !== 6) || newPassword.length < 8}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {submitting ? 'Updating password…' : 'Reset Password'}
            </button>

            <div className="pt-2 text-center">
              <Link to="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline">
                Need a new code? Request code
              </Link>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
