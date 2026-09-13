import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../auth/AuthContext.jsx'
import AnimatedInput from '../components/AnimatedInput.jsx'
import { MotionButton } from '../components/MotionButton.jsx'
import Modal from '../components/Modal.jsx'
import { resendCode } from '../api/auth.js'

function LoginPage() {
  const { login, verifyCode, isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [isUnverified, setIsUnverified] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const [resendStatus, setResendStatus] = useState(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  if (isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsUnverified(false)
    setSubmitting(true)
    try {
      await login({ email, password })
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.message || err.response?.data?.error || 'Unable to sign in'
      setError(msg)
      if (status === 403 || msg.toLowerCase().includes('not been verified')) {
        setIsUnverified(true)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerifySubmit(e) {
    e.preventDefault()
    const trimmedCode = verificationCode.trim()
    if (trimmedCode.length !== 6) {
      setVerifyError('Please enter the 6-digit numeric verification code.')
      return
    }

    setVerifyError('')
    setVerifying(true)
    try {
      await verifyCode({
        email: email.trim().toLowerCase(),
        code: trimmedCode,
      })
      setShowVerifyModal(false)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setVerifyError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Invalid or expired verification code.'
      )
    } finally {
      setVerifying(false)
    }
  }

  async function handleResendCode() {
    if (resendCooldown > 0) return
    setResendStatus(null)
    setVerifyError('')
    try {
      const { data } = await resendCode({ email: email.trim().toLowerCase() })
      setResendStatus({
        type: 'success',
        text: data?.message || 'A fresh code has been sent to your inbox.',
      })
      setResendCooldown(60)
    } catch (err) {
      setResendStatus({
        type: 'error',
        text: err.response?.data?.message || 'Unable to resend code.',
      })
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-6 animate-fade-in">
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-700 text-white shadow-sm mb-3"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </motion.div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Sign In to Interniqo
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Enter your registered email and password to access your portal.
        </p>
      </div>

      <motion.div
        animate={error ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className="card-base p-6 sm:p-8 shadow-sm"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-2xl border border-danger-200 bg-danger-50 p-4 text-xs font-medium text-danger-800 space-y-2"
              >
                <p className="font-bold flex items-center gap-1.5">
                  <span>⚠️</span> {error}
                </p>
                {isUnverified && (
                  <div className="pt-1 border-t border-danger-200/60 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setShowVerifyModal(true)
                        setVerifyError('')
                      }}
                      className="font-bold text-primary-700 hover:text-primary-900 underline cursor-pointer text-left"
                    >
                      Enter your 6-digit verification code now →
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatedInput
            id="login-email"
            name="email"
            type="email"
            label="Email Address"
            placeholder="you@domain.edu or you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-primary-700 hover:text-primary-800 transition"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              className="input-field border-warm-border focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <MotionButton
            className="btn-primary w-full py-2.5 text-sm mt-2"
            type="submit"
            disabled={submitting}
            pulse={false}
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </MotionButton>
        </form>

        <div className="mt-6 pt-4 text-center text-xs text-slate-500 border-t border-slate-100">
          Don&apos;t have an account yet?{' '}
          <Link className="font-bold text-primary-700 hover:text-primary-900 transition" to="/register">
            Register free →
          </Link>
        </div>
      </motion.div>

      {/* Category 6: Code verification dialog with scale 0.9->1 & separate backdrop fade */}
      <Modal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        title="Enter Verification Code"
      >
        <form onSubmit={handleVerifySubmit} className="space-y-4">
          <p className="text-xs text-slate-600">
            Please enter the 6-digit numeric verification code sent to{' '}
            <strong className="text-slate-900 font-mono">{email}</strong>.
          </p>

          {verifyError && (
            <div className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-xs text-danger-700">
              {verifyError}
            </div>
          )}

          {resendStatus && (
            <div className={`rounded-xl border p-3 text-xs ${
              resendStatus.type === 'success'
                ? 'border-success-200 bg-success-50 text-success-800'
                : 'border-danger-200 bg-danger-50 text-danger-700'
            }`}>
              {resendStatus.text}
            </div>
          )}

          <div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              value={verificationCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                setVerificationCode(val)
                if (verifyError) setVerifyError('')
              }}
              placeholder="••••••"
              className="w-full text-center font-mono text-3xl font-bold tracking-[0.4em] py-3 rounded-xl border border-warm-border bg-slate-50 text-slate-900 transition focus:border-primary-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/20"
            />
            <p className="mt-1 text-center text-[11px] text-slate-400">
              Code valid for 10 minutes
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendCooldown > 0}
              className={`text-xs font-semibold ${
                resendCooldown > 0
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-primary-700 hover:text-primary-900 underline'
              }`}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="btn-secondary text-xs py-2 px-3"
              >
                Cancel
              </button>
              <MotionButton
                type="submit"
                disabled={verifying || verificationCode.trim().length !== 6}
                className="btn-primary text-xs py-2 px-4"
              >
                {verifying ? 'Verifying…' : 'Verify & Continue'}
              </MotionButton>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default LoginPage
