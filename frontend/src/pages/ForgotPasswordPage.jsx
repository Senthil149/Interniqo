import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword, resetPassword } from '../api/auth.js'

export default function ForgotPasswordPage() {
  // Steps: 'EMAIL' | 'RESET' | 'SUCCESS'
  const [step, setStep] = useState('EMAIL')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [resendCooldown, setResendCooldown] = useState(60)
  const [resendMessage, setResendMessage] = useState(null)

  // Countdown timer for 60-second rate limiting
  useEffect(() => {
    let timer = null
    if (step === 'RESET' && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [step, resendCooldown])

  async function handleSendCode(e) {
    e.preventDefault()
    if (!email.trim()) return

    setSubmitting(true)
    setError(null)
    setResendMessage(null)

    try {
      await forgotPassword(email.trim().toLowerCase())
      setStep('RESET')
      setResendCooldown(60)
      setCode('')
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Unable to request password reset code. Please try again later.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    const trimmedCode = code.trim()
    if (trimmedCode.length !== 6) {
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
        email: email.trim().toLowerCase(),
        code: trimmedCode,
        newPassword,
      })
      setStep('SUCCESS')
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Invalid or expired reset code. Please check your code or request a new one.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResendCode() {
    if (resendCooldown > 0) return

    setResendMessage(null)
    setError(null)

    try {
      const { data } = await forgotPassword(email.trim().toLowerCase())
      setResendMessage({
        type: 'success',
        text: data?.message || 'A new 6-digit reset code has been sent to your email.',
      })
      setResendCooldown(60)
    } catch (err) {
      setResendMessage({
        type: 'error',
        text: err.response?.data?.message || 'Unable to resend code. Please wait a moment.',
      })
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
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
          {step === 'SUCCESS' ? 'Password Updated' : 'Reset your password'}
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          {step === 'EMAIL' && 'Enter your email to receive a 6-digit password reset code.'}
          {step === 'RESET' && `Enter the 6-digit code sent to ${email} and choose a new password.`}
          {step === 'SUCCESS' && 'Your password has been reset successfully.'}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        {/* SUCCESS VIEW */}
        {step === 'SUCCESS' && (
          <div className="space-y-5 text-center animate-scale-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 shadow-xs">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-900 font-display">All set!</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your password has been changed. You can now sign in with your new password.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 active:bg-blue-800"
            >
              Sign in to your account
            </Link>
          </div>
        )}

        {/* STEP 1: ENTER EMAIL */}
        {step === 'EMAIL' && (
          <form className="space-y-4" onSubmit={handleSendCode}>
            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 animate-scale-in">
                {error}
              </div>
            ) : null}

            <label className="block text-sm font-medium text-slate-700">
              Email address
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
                type="email"
                required
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <button
              className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 active:bg-blue-800 disabled:opacity-60 disabled:hover:translate-y-0"
              type="submit"
              disabled={submitting || !email.trim()}
            >
              {submitting ? 'Sending code…' : 'Send Reset Code'}
            </button>

            <div className="pt-2 text-center">
              <Link to="/login" className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition">
                ← Return to Sign in
              </Link>
            </div>
          </form>
        )}

        {/* STEP 2: ENTER 6-DIGIT CODE + NEW PASSWORD */}
        {step === 'RESET' && (
          <form className="space-y-4" onSubmit={handleResetPassword}>
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

            <div>
              <label htmlFor="reset-code-input" className="block text-center text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
                6-Digit Reset Code
              </label>
              <input
                id="reset-code-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoFocus
                autoComplete="one-time-code"
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
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
                type="password"
                minLength={8}
                required
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Confirm New Password
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
                type="password"
                minLength={8}
                required
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>

            <button
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              type="submit"
              disabled={submitting || code.trim().length !== 6 || newPassword.length < 8}
            >
              {submitting ? 'Updating password…' : 'Reset Password'}
            </button>

            <div className="pt-2 border-t border-slate-100 text-center space-y-2">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCooldown > 0}
                className={`text-xs font-semibold transition ${
                  resendCooldown > 0
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-blue-600 hover:text-blue-700 underline'
                }`}
              >
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : 'Resend 6-digit code'}
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('EMAIL')
                    setError(null)
                    setResendMessage(null)
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 transition"
                >
                  ← Use different email address
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
