import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { forgotPassword, resetPassword } from '../api/auth.js'
import AnimatedInput from '../components/AnimatedInput.jsx'
import { MotionButton } from '../components/MotionButton.jsx'

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
        text: data?.message || 'A fresh 6-digit reset code has been sent to your email.',
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
    <section className="mx-auto max-w-md py-8 animate-fade-in-up">
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 ring-1 ring-primary-100 shadow-xs"
        >
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
        </motion.div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">
          {step === 'SUCCESS' ? 'Password Updated' : 'Reset your password'}
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          {step === 'EMAIL' && 'Enter your email to receive a 6-digit password reset code.'}
          {step === 'RESET' && `Enter the 6-digit code sent to ${email} and choose a new password.`}
          {step === 'SUCCESS' && 'Your password has been reset successfully.'}
        </p>
      </div>

      <motion.div
        animate={error ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className="rounded-2xl border border-warm-border bg-white p-6 sm:p-8 shadow-sm"
      >
        {/* SUCCESS VIEW */}
        {step === 'SUCCESS' && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-5 text-center"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success-50 text-success-700 ring-1 ring-success-100 shadow-xs">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-900 font-heading">All set!</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your password has been changed. You can now sign in with your new password.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-primary-700 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-primary-800 hover:shadow-md hover:-translate-y-0.5 active:bg-primary-900"
            >
              Sign in to your account
            </Link>
          </motion.div>
        )}

        {/* STEP 1: ENTER EMAIL */}
        {step === 'EMAIL' && (
          <form className="space-y-4" onSubmit={handleSendCode}>
            <AnimatePresence>
              {error ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-xs text-danger-700"
                >
                  {error}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatedInput
              id="reset-email-input"
              name="email"
              type="email"
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <MotionButton
              className="btn-primary w-full py-2.5 text-sm"
              type="submit"
              disabled={submitting || !email.trim()}
              pulse={false}
            >
              {submitting ? 'Sending code…' : 'Send Reset Code'}
            </MotionButton>

            <div className="pt-2 text-center">
              <Link to="/login" className="text-xs font-semibold text-slate-600 hover:text-primary-700 transition">
                ← Return to Sign in
              </Link>
            </div>
          </form>
        )}

        {/* STEP 2: ENTER 6-DIGIT CODE + NEW PASSWORD (Category 6: scale 0.9->1 entrance) */}
        {step === 'RESET' && (
          <motion.form
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="space-y-4"
            onSubmit={handleResetPassword}
          >
            <AnimatePresence>
              {error ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-xs text-danger-700"
                >
                  {error}
                </motion.div>
              ) : null}
            </AnimatePresence>

            {resendMessage ? (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border p-3 text-xs ${
                  resendMessage.type === 'success'
                    ? 'border-success-200 bg-success-50 text-success-800'
                    : 'border-danger-200 bg-danger-50 text-danger-700'
                }`}
              >
                {resendMessage.text}
              </motion.div>
            ) : null}

            <div>
              <label htmlFor="reset-code-input" className="block text-center text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
                6-Digit Reset Code
              </label>
              <motion.div
                animate={error ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
              >
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
                  className="w-full text-center font-mono text-2xl font-bold tracking-[0.4em] py-2.5 rounded-xl border border-warm-border focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 transition shadow-inner placeholder:text-slate-300"
                />
              </motion.div>
              <p className="mt-1 text-center text-[11px] text-slate-400">
                Code expires in 10 minutes.
              </p>
            </div>

            <AnimatedInput
              id="new-password-input"
              name="newPassword"
              type="password"
              label="New Password"
              placeholder="At least 8 characters"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <AnimatedInput
              id="confirm-password-input"
              name="confirmPassword"
              type="password"
              label="Confirm New Password"
              placeholder="Re-enter your new password"
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <MotionButton
              className="btn-primary w-full py-3 text-sm"
              type="submit"
              disabled={submitting || code.trim().length !== 6 || newPassword.length < 8}
              pulse={code.trim().length === 6 && newPassword.length >= 8}
            >
              {submitting ? 'Updating password…' : 'Reset Password'}
            </MotionButton>

            <div className="pt-2 border-t border-slate-100 text-center space-y-2">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCooldown > 0}
                className={`text-xs font-semibold transition ${
                  resendCooldown > 0
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-primary-700 hover:text-primary-900 underline'
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
          </motion.form>
        )}
      </motion.div>
    </section>
  )
}
